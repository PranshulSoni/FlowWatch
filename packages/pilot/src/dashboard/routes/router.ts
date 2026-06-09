import type { Client } from "@elastic/elasticsearch"
import { Router } from "express"
import type { Redis } from "ioredis"
import type { Pool } from "pg"
import type { NormalizedPilotConfig } from "../../types/index.js"
import { checkElasticsearchHealth, checkPostgresHealth, checkRedisHealth } from "../../runtime/health/healthService.js"

interface DashboardRouterOptions {
    config: NormalizedPilotConfig
    postgresPool: Pool
    redisClient: Redis
    elasticsearchClient: Client
}

export function createDashboardRouter(options: DashboardRouterOptions): Router {
    const router = Router()
    const { config, postgresPool, redisClient, elasticsearchClient } = options

    router.get("/api/health", async (req, res) => {
        const postgres = await checkPostgresHealth(postgresPool)
        const redis = await checkRedisHealth(redisClient)
        const elasticsearch = await checkElasticsearchHealth(elasticsearchClient)

        res.json({
            status: postgres.status === "ok" && redis.status === "ok" && elasticsearch.status === "ok" ? "ok" : "degraded",
            serviceName: config.runtime.serviceName,
            checks: {
                postgres,
                redis,
                elasticsearch,
            },
        })
    })

    return router
}
