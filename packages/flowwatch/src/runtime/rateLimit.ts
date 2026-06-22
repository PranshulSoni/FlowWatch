import type { RequestHandler, Request } from "express"
import type { Redis } from "ioredis"

export type RateLimitAlgorithm = "fixed-window" | "sliding-window" | "token-bucket" | "spike-arrest"

export interface RateLimitOptions {
  max: number
  windowSeconds: number
  algorithm?: RateLimitAlgorithm
  maxPerSecond?: number   // only used by spike-arrest
  keyBy?: "ip" | "userId" | "apiKey" | "tenant" | ((req: Request) => string)
  prefix?: string
}

// Token bucket: atomically consume one token; returns [allowed, tokensRemaining, waitSeconds]
// Refill rate = max tokens / windowSeconds
const TOKEN_BUCKET_SCRIPT = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refillRate = tonumber(ARGV[2])
local nowMs = tonumber(ARGV[3])

local data = redis.call('HMGET', key, 'tokens', 'lastMs')
local tokens = tonumber(data[1])
local lastMs = tonumber(data[2])

if tokens == nil then
  tokens = capacity
  lastMs = nowMs
end

local elapsed = math.max(0, nowMs - lastMs) / 1000
local refilled = math.min(capacity, tokens + elapsed * refillRate)

if refilled < 1 then
  redis.call('HMSET', key, 'tokens', refilled, 'lastMs', nowMs)
  redis.call('EXPIRE', key, math.ceil(capacity / refillRate) + 2)
  return {0, 0, math.ceil((1 - refilled) / refillRate)}
end

local remaining = refilled - 1
redis.call('HMSET', key, 'tokens', remaining, 'lastMs', nowMs)
redis.call('EXPIRE', key, math.ceil(capacity / refillRate) + 2)
return {1, math.floor(remaining), 0}
`

function getKey(req: Request, keyBy: RateLimitOptions["keyBy"], prefix: string): string {
  if (typeof keyBy === "function") return `${prefix}:custom:${keyBy(req)}`
  if (keyBy === "userId") return `${prefix}:user:${(req as any).user?.id ?? req.ip}`
  if (keyBy === "apiKey") return `${prefix}:apikey:${req.headers["x-api-key"] ?? req.ip}`
  if (keyBy === "tenant") return `${prefix}:tenant:${req.tenantId ?? req.ip}`
  return `${prefix}:ip:${req.ip}`
}

async function fixedWindow(
  redis: Redis,
  key: string,
  max: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
  const count = await redis.incr(key)
  if (count === 1) await redis.expire(key, windowSeconds)
  const allowed = count <= max
  const remaining = Math.max(0, max - count)
  const retryAfter = allowed ? 0 : await redis.ttl(key).then(t => (t > 0 ? t : windowSeconds))
  return { allowed, remaining, retryAfter }
}

async function slidingWindow(
  redis: Redis,
  key: string,
  max: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
  const now = Date.now()
  const windowStart = now - windowSeconds * 1000
  const member = `${now}-${Math.random()}`

  const pipeline = redis.pipeline()
  pipeline.zadd(key, now, member)
  pipeline.zremrangebyscore(key, 0, windowStart)
  pipeline.zcard(key)
  pipeline.expire(key, windowSeconds)
  const results = await pipeline.exec()

  const count = (results?.[2]?.[1] as number) ?? 0
  const allowed = count <= max
  if (!allowed) await redis.zrem(key, member)
  const remaining = Math.max(0, max - count)
  const retryAfter = allowed ? 0 : Math.ceil(windowSeconds / max)
  return { allowed, remaining, retryAfter }
}

async function tokenBucket(
  redis: Redis,
  key: string,
  max: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
  const refillRate = max / windowSeconds
  const result = await (redis as any).eval(
    TOKEN_BUCKET_SCRIPT,
    1,
    key,
    max,
    refillRate,
    Date.now()
  ) as [number, number, number]

  const [ok, remaining, waitSec] = result
  return { allowed: ok === 1, remaining, retryAfter: waitSec }
}

async function spikeArrest(
  redis: Redis,
  key: string,
  maxPerSecond: number
): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
  const minIntervalMs = Math.floor(1000 / maxPerSecond)
  const now = Date.now()
  const last = await redis.get(key)
  const lastMs = last ? parseInt(last, 10) : 0
  const elapsed = now - lastMs

  if (elapsed < minIntervalMs) {
    const waitMs = minIntervalMs - elapsed
    return { allowed: false, remaining: 0, retryAfter: Math.ceil(waitMs / 1000) || 1 }
  }

  await redis.set(key, String(now), "EX", 2)
  return { allowed: true, remaining: 1, retryAfter: 0 }
}

export function createRateLimitMiddleware(redis: Redis, options: RateLimitOptions): RequestHandler {
  const {
    max,
    windowSeconds,
    algorithm = "fixed-window",
    maxPerSecond = 10,
    keyBy = "ip",
    prefix = "flowwatch:rl",
  } = options

  return async (req, res, next) => {
    const key = getKey(req, keyBy, `${prefix}:${algorithm}`)
    try {
      let result: { allowed: boolean; remaining: number; retryAfter: number }

      if (algorithm === "sliding-window") {
        result = await slidingWindow(redis, key, max, windowSeconds)
      } else if (algorithm === "token-bucket") {
        result = await tokenBucket(redis, key, max, windowSeconds)
      } else if (algorithm === "spike-arrest") {
        result = await spikeArrest(redis, key, maxPerSecond)
      } else {
        result = await fixedWindow(redis, key, max, windowSeconds)
      }

      res.set("X-RateLimit-Limit", String(max))
      res.set("X-RateLimit-Remaining", String(result.remaining))

      if (!result.allowed) {
        res.set("Retry-After", String(result.retryAfter))
        res.status(429).json({ error: "Too many requests. Please try again later." })
        return
      }
      next()
    } catch {
      next()
    }
  }
}
