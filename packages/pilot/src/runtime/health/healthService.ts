import type { Client } from "@elastic/elasticsearch"
import type { Pool } from "pg";
import type { Redis } from "ioredis"

export async function checkPostgresHealth(pool: Pool) {
    const startedAt = Date.now()
    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Postgres health check timed out")), 1500)
    )
    try {
        await Promise.race([pool.query("SELECT 1"), timeout])
        return { status: "ok", latencyMs: Date.now() - startedAt }
    }
    catch (error) {
        return { status: "error", latencyMs: Date.now() - startedAt,
                 message: error instanceof Error ? error.message : "Unknown error" }
    }
}

export async function checkRedisHealth(redisClient: Redis) {
    const startedAt = Date.now()
    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Redis health check timed out")), 1500)
    )
    try {
        const response = await Promise.race([redisClient.ping(), timeout])
        if (response !== "PONG") {
            return { status: "error", latencyMs: Date.now() - startedAt,
                     message: `Unexpected Redis response: ${response}` }
        }
        return { status: "ok", latencyMs: Date.now() - startedAt }
    }
    catch (error) {
        return { status: "error", latencyMs: Date.now() - startedAt,
                 message: error instanceof Error ? error.message : "Unknown error" }
    }
}

export async function checkElasticsearchHealth(elasticsearchClient: Client) {
    const startedAt = Date.now()
    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Elasticsearch health check timed out")), 1500)
    )
    try {
        // requestTimeout overrides the client-level retry/timeout for this single call
        await Promise.race([
            elasticsearchClient.ping({}, { requestTimeout: 1500, maxRetries: 0 }),
            timeout,
        ])
        return { status: "ok", latencyMs: Date.now() - startedAt }
    }
    catch (error) {
        return { status: "error", latencyMs: Date.now() - startedAt,
                 message: error instanceof Error ? error.message : "Unknown error" }
    }
}
