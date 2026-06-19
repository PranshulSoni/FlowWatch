import type { RequestHandler, Request } from "express"
import type { Redis } from "ioredis"

export interface RateLimitOptions {
  max: number
  windowSeconds: number
  keyBy?: "ip" | "userId" | "apiKey" | ((req: Request) => string)
  prefix?: string
}

export function createRateLimitMiddleware(redis: Redis, options: RateLimitOptions): RequestHandler {
  const { max, windowSeconds, keyBy = "ip", prefix = "flowwatch:rl" } = options

  function getKey(req: Request): string {
    if (typeof keyBy === "function") return `${prefix}:custom:${keyBy(req)}`
    if (keyBy === "userId") return `${prefix}:user:${(req as any).user?.id ?? req.ip}`
    if (keyBy === "apiKey") return `${prefix}:apikey:${req.headers["x-api-key"] ?? req.ip}`
    return `${prefix}:ip:${req.ip}`
  }

  return async (req, res, next) => {
    const key = getKey(req)
    try {
      const count = await redis.incr(key)
      if (count === 1) await redis.expire(key, windowSeconds)

      res.set("X-RateLimit-Limit", String(max))
      res.set("X-RateLimit-Remaining", String(Math.max(0, max - count)))

      if (count > max) {
        const ttl = await redis.ttl(key)
        res.set("Retry-After", String(ttl > 0 ? ttl : windowSeconds))
        res.status(429).json({ error: "Too many requests. Please try again later." })
        return
      }
      next()
    } catch {
      next()
    }
  }
}
