import { createHash } from "crypto"
import type { Pool } from "pg"
import type { Redis } from "ioredis"

export interface QueryCacheOptions {
  ttl: number
  tags?: string[]
}

export interface QueryCache {
  get<T = unknown>(sql: string, params: unknown[], options: QueryCacheOptions): Promise<T[]>
  invalidate(...tags: string[]): Promise<void>
}

function cacheKey(sql: string, params: unknown[]): string {
  const hash = createHash("sha1").update(sql + JSON.stringify(params)).digest("hex").slice(0, 20)
  return `flowwatch:qcache:${hash}`
}

export function createQueryCache(pool: Pool, redis: Redis): QueryCache {
  return {
    async get<T>(sql: string, params: unknown[], options: QueryCacheOptions): Promise<T[]> {
      const key = cacheKey(sql, params)
      const cached = await redis.get(key)
      if (cached) return JSON.parse(cached) as T[]
      const result = await pool.query(sql, params)
      const rows = result.rows as T[]
      await redis.setex(key, options.ttl, JSON.stringify(rows))
      for (const tag of options.tags ?? []) {
        await redis.sadd(`flowwatch:qtag:${tag}`, key)
        await redis.expire(`flowwatch:qtag:${tag}`, options.ttl)
      }
      return rows
    },
    async invalidate(...tags: string[]): Promise<void> {
      for (const tag of tags) {
        const tKey = `flowwatch:qtag:${tag}`
        const keys = await redis.smembers(tKey)
        if (keys.length) await redis.del(...keys)
        await redis.del(tKey)
      }
    },
  }
}
