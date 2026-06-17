import { Pool } from "pg"
import type { PoolConfig } from "pg"

export function createPostgresPool(config: PoolConfig): Pool {
    return new Pool({
        connectionTimeoutMillis: 5_000,
        query_timeout: 10_000,
        ...config,
    })
}