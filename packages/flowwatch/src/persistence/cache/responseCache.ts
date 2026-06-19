import type { RequestHandler } from "express"
import type { Redis } from "ioredis"

export interface ResponseCacheOptions {
  ttl: number // seconds
}

export function createResponseCacheMiddleware(redis: Redis, options: ResponseCacheOptions): RequestHandler {
  const { ttl } = options
  return async (req, res, next) => {
    if (req.method !== "GET") { next(); return }
    const key = `flowwatch:cache:${req.method}:${req.originalUrl}`
    const cached = await redis.get(key)
    if (cached) {
      res.setHeader("X-Cache", "HIT")
      res.json(JSON.parse(cached))
      return
    }
    const originalJson = res.json.bind(res)
    res.json = (body?: unknown) => {
      redis.setex(key, ttl, JSON.stringify(body)).catch(() => {})
      res.setHeader("X-Cache", "MISS")
      return originalJson(body)
    }
    next()
  }
}
