import { createHash } from "crypto"
import type { RequestHandler } from "express"

export interface HttpCacheOptions {
  maxAge?: number // seconds for Cache-Control max-age, 0 = no-cache
}

export function createHttpCacheMiddleware(options: HttpCacheOptions = {}): RequestHandler {
  const { maxAge = 0 } = options
  return (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") { next(); return }
    const originalJson = res.json.bind(res)
    res.json = (body?: unknown) => {
      const str = JSON.stringify(body)
      const etag = `"${createHash("sha1").update(str).digest("hex").slice(0, 16)}"`
      res.setHeader("ETag", etag)
      res.setHeader("Cache-Control", maxAge > 0 ? `public, max-age=${maxAge}` : "no-cache")
      if (req.headers["if-none-match"] === etag) { res.status(304).end(); return res }
      return originalJson(body)
    }
    next()
  }
}
