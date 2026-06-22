import type { Pool } from "pg"
import type { Redis } from "ioredis"
import type { Client } from "@elastic/elasticsearch"
import { Router } from "express"

export interface HealthCheckResult {
    status: "ok" | "degraded" | "down"
    uptime: number
    checks: {
        postgres: { status: "ok" | "down"; latencyMs: number }
        redis: { status: "ok" | "down"; latencyMs: number }
        elasticsearch: { status: "ok" | "down"; latencyMs: number }
    }
}

async function pingPostgres(pool: Pool): Promise<{ status: "ok" | "down"; latencyMs: number }> {
    const start = Date.now()
    try {
        await pool.query("SELECT 1")
        return { status: "ok", latencyMs: Date.now() - start }
    } catch {
        return { status: "down", latencyMs: Date.now() - start }
    }
}

async function pingRedis(redis: Redis): Promise<{ status: "ok" | "down"; latencyMs: number }> {
    const start = Date.now()
    try {
        await redis.ping()
        return { status: "ok", latencyMs: Date.now() - start }
    } catch {
        return { status: "down", latencyMs: Date.now() - start }
    }
}

async function pingElasticsearch(client: Client): Promise<{ status: "ok" | "down"; latencyMs: number }> {
    const start = Date.now()
    try {
        await client.ping()
        return { status: "ok", latencyMs: Date.now() - start }
    } catch {
        return { status: "down", latencyMs: Date.now() - start }
    }
}

export function createHealthRouter(pool: Pool, redis: Redis, elasticsearch: Client): Router {
    const router = Router()

    router.get("/", async (_req, res) => {
        const [postgres, redisCheck, es] = await Promise.all([
            pingPostgres(pool),
            pingRedis(redis),
            pingElasticsearch(elasticsearch),
        ])

        const checks = { postgres, redis: redisCheck, elasticsearch: es }
        const statuses = Object.values(checks).map(c => c.status)
        const allDown = statuses.every(s => s === "down")
        const anyDown = statuses.some(s => s === "down")

        const status: HealthCheckResult["status"] = allDown ? "down" : anyDown ? "degraded" : "ok"
        const result: HealthCheckResult = { status, uptime: Math.floor(process.uptime()), checks }

        res.status(status === "down" ? 503 : 200).json(result)
    })

    return router
}
