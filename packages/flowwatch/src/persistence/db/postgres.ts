import { Pool } from "pg"
import type { PoolConfig } from "pg"

export function createPostgresPool(config: PoolConfig): Pool {
    return new Pool(config)
}