import type { Pool, QueryResult } from "pg"
import type { Redis } from "ioredis"

export function createMockPool(rows: Record<string, unknown>[] = []): Pool {
  const queryResult: QueryResult = { rows, rowCount: rows.length, command: "", oid: 0, fields: [] }
  return {
    query: async () => queryResult,
    end: async () => {},
  } as unknown as Pool
}

export function createMockRedis(): Redis {
  const store = new Map<string, string>()
  const sets = new Map<string, Set<string>>()
  return {
    get: async (key: string) => store.get(key) ?? null,
    set: async (key: string, value: string) => { store.set(key, value); return "OK" },
    setex: async (key: string, _ttl: number, value: string) => { store.set(key, value); return "OK" },
    del: async (...keys: string[]) => { keys.forEach((k) => store.delete(k)); return keys.length },
    sadd: async (key: string, ...members: string[]) => {
      if (!sets.has(key)) sets.set(key, new Set())
      members.forEach((m) => sets.get(key)!.add(m))
      return members.length
    },
    smembers: async (key: string) => [...(sets.get(key) ?? [])],
    expire: async () => 1,
    incr: async (key: string) => { const v = parseInt(store.get(key) ?? "0", 10) + 1; store.set(key, String(v)); return v },
    pttl: async () => -1,
  } as unknown as Redis
}
