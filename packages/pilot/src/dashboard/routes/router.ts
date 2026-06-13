import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import type { Client } from "@elastic/elasticsearch"
import express, { json, Router } from "express"
import type { Redis } from "ioredis"
import type { Pool } from "pg"
import type { NormalizedPilotConfig } from "../../types/index.js"
import { checkElasticsearchHealth, checkPostgresHealth, checkRedisHealth } from "../../runtime/health/healthService.js"
import {
    createFlag,
    createFlagRule,
    deleteFlag,
    deleteFlagRule,
    getFlagByKey,
    listFlagAuditLogs,
    listFlagRules,
    listFlags,
    updateFlag,
    updateFlagRule,
} from "../../persistence/repositories/flags/flagRepository.js"
import { createRequestTracingMiddleware } from "../../runtime/tracing/tracingMiddleware.js"

interface DashboardRouterOptions {
    config: NormalizedPilotConfig
    postgresPool: Pool
    redisClient: Redis
    elasticsearchClient: Client
}

async function invalidateFlagCache(redisClient: Redis, flagKey: string): Promise<void> {
    await redisClient.del(`pilot:flags:${flagKey}`)
}

export function createDashboardRouter(options: DashboardRouterOptions): Router {
    const router = Router()
    const { config, postgresPool, redisClient, elasticsearchClient } = options
    router.use(json())
    router.use(createRequestTracingMiddleware(postgresPool))

    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const staticPath = join(__dirname, "../static")

    router.use(express.static(staticPath))

    router.get("/", (req, res) => {
        res.sendFile(join(staticPath, "index.html"))
    })

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

    router.get("/api/flags", async (req, res) => {
        const flags = await listFlags(postgresPool)
        res.json({ flags })
    })

    router.post("/api/flags", async (req, res) => {
        const flag = await createFlag(postgresPool, {
            key: req.body.key,
            description: req.body.description,
            enabled: req.body.enabled,
            rolloutPercentage: req.body.rolloutPercentage,
            changedBy: req.body.changedBy,
        })

        await invalidateFlagCache(redisClient, flag.key)

        res.status(201).json({ flag })
    })

    router.get("/api/flags/:key", async (req, res) => {
        const flag = await getFlagByKey(postgresPool, req.params.key)

        if (!flag) {
            res.status(404).json({ message: "Feature flag not found" })
            return
        }

        const rules = await listFlagRules(postgresPool, req.params.key)

        res.json({
            flag,
            rules,
        })
    })

    router.patch("/api/flags/:key", async (req, res) => {
        const flag = await updateFlag(postgresPool, req.params.key, {
            description: req.body.description,
            enabled: req.body.enabled,
            rolloutPercentage: req.body.rolloutPercentage,
            changedBy: req.body.changedBy,
        })

        if (!flag) {
            res.status(404).json({ message: "Feature flag not found" })
            return
        }

        await invalidateFlagCache(redisClient, req.params.key)

        res.json({ flag })
    })

    router.delete("/api/flags/:key", async (req, res) => {
        const deleted = await deleteFlag(postgresPool, req.params.key, req.body?.changedBy)

        if (!deleted) {
            res.status(404).json({ message: "Feature flag not found" })
            return
        }

        await invalidateFlagCache(redisClient, req.params.key)

        res.status(204).send()
    })

    router.get("/api/flags/:key/rules", async (req, res) => {
        const flag = await getFlagByKey(postgresPool, req.params.key)

        if (!flag) {
            res.status(404).json({ message: "Feature flag not found" })
            return
        }

        const rules = await listFlagRules(postgresPool, req.params.key)
        res.json({ rules })
    })

    router.post("/api/flags/:key/rules", async (req, res) => {
        const rule = await createFlagRule(postgresPool, {
            flagKey: req.params.key,
            attribute: req.body.attribute,
            operator: req.body.operator,
            value: req.body.value,
            enabled: req.body.enabled,
            changedBy: req.body.changedBy,
        })

        if (!rule) {
            res.status(404).json({ message: "Feature flag not found" })
            return
        }

        await invalidateFlagCache(redisClient, req.params.key)

        res.status(201).json({ rule })
    })

    router.patch("/api/flags/:key/rules/:ruleId", async (req, res) => {
        const flag = await getFlagByKey(postgresPool, req.params.key)

        if (!flag) {
            res.status(404).json({ message: "Feature flag not found" })
            return
        }

        const rule = await updateFlagRule(postgresPool, req.params.ruleId, {
            attribute: req.body.attribute,
            operator: req.body.operator,
            value: req.body.value,
            enabled: req.body.enabled,
            changedBy: req.body.changedBy,
        })

        if (!rule) {
            res.status(404).json({ message: "Feature flag rule not found" })
            return
        }

        await invalidateFlagCache(redisClient, req.params.key)

        res.json({ rule })
    })

    router.delete("/api/flags/:key/rules/:ruleId", async (req, res) => {
        const flag = await getFlagByKey(postgresPool, req.params.key)

        if (!flag) {
            res.status(404).json({ message: "Feature flag not found" })
            return
        }

        const deleted = await deleteFlagRule(postgresPool, req.params.ruleId, req.body?.changedBy)

        if (!deleted) {
            res.status(404).json({ message: "Feature flag rule not found" })
            return
        }

        await invalidateFlagCache(redisClient, req.params.key)

        res.status(204).send()
    })

    router.get("/api/flags/:key/audit-logs", async (req, res) => {
        const flag = await getFlagByKey(postgresPool, req.params.key)

        if (!flag) {
            res.status(404).json({ message: "Feature flag not found" })
            return
        }

        const auditLogs = await listFlagAuditLogs(postgresPool, req.params.key)
        res.json({ auditLogs })
    })

    router.get("/api/workflows", async (req, res) => {
        try {
            const result = await postgresPool.query("SELECT * FROM pilot_workflows ORDER BY name ASC")
            res.json({ workflows: result.rows })
        } catch (error: any) {
            res.status(500).json({ error: error.message })
        }
    })

    router.get("/api/executions", async (req, res) => {
        try {
            const result = await postgresPool.query("SELECT * FROM pilot_workflow_executions ORDER BY created_at DESC LIMIT 50")
            res.json({ executions: result.rows })
        } catch (error: any) {
            res.status(500).json({ error: error.message })
        }
    })

    router.get("/api/traces", async (req, res) => {
        try {
            const result = await postgresPool.query("SELECT * FROM pilot_request_traces ORDER BY started_at DESC LIMIT 50")
            res.json({ traces: result.rows })
        } catch (error: any) {
            res.status(500).json({ error: error.message })
        }
    })

    router.get("/api/errors", async (req, res) => {
        try {
            const result = await postgresPool.query("SELECT * FROM pilot_errors ORDER BY occurred_at DESC LIMIT 50")
            res.json({ errors: result.rows })
        } catch (error: any) {
            res.status(500).json({ error: error.message })
        }
    })

    return router
}

