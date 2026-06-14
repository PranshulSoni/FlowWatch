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
    listFlagsWithRuleCounts,
    listFlagRules,
    updateFlag,
    updateFlagRule,
} from "../../persistence/repositories/flags/flagRepository.js"
import { createRequestTracingMiddleware } from "../../runtime/tracing/tracingMiddleware.js"
import { getErrorById, getErrorsByTrace, listErrors } from "../../persistence/repositories/errors/errorRepository.js"
import { getRequestTrace, getTraceSpans, listRequestTraces } from "../../persistence/repositories/traces/traceRepository.js"
import {
    getLatestWorkflowDefinitionByName,
    getWorkflowExecution,
    getWorkflowExecutionSteps,
    listWorkflowDefinitions,
    listWorkflowExecutions,
    listWorkflowExecutionsByWorkflowName,
    listWorkflowStepExecutionsByExecutionIds,
    listWorkflowStepsByWorkflowIds,
} from "../../persistence/repositories/workflows/workflowRepository.js"
import {
    latestByWorkflow,
    serializeAuditLog,
    serializeError,
    serializeExecution,
    serializeFlag,
    serializeRule,
    serializeSettings,
    serializeTrace,
    serializeWorkflowSummary,
} from "./dashboardResponse.js"
import { generateGroqInsight, listGroqModels, askGroqAssistant, type PilotAiInsightContext } from "../../ai/groqInsightService.js"
import { savePilotEnv, isGroqApiKeyConfigured } from "../../utils/pilotEnvStore.js"
import { z } from "zod"

interface DashboardRouterOptions {
    config: NormalizedPilotConfig
    postgresPool: Pool
    redisClient: Redis
    elasticsearchClient: Client
}

async function invalidateFlagCache(redisClient: Redis, flagKey: string): Promise<void> {
    try {
        await redisClient.del(`pilot:flags:${flagKey}`)
    } catch {
        
    }
}

function validate(schema: z.ZodSchema) {
    return (req: any, res: any, next: any) => {
        const result = schema.safeParse(req.body)
        if (!result.success) {
            res.status(400).json({
                error: {
                    code: "validation_error",
                    message: result.error.issues.map((e: any) => `${e.path.join(".")}: ${e.message}`).join("; "),
                },
            })
            return
        }
        req.body = result.data
        next()
    }
}

function validateParams(schema: z.ZodSchema) {
    return (req: any, res: any, next: any) => {
        const result = schema.safeParse(req.params)
        if (!result.success) {
            res.status(400).json({
                error: {
                    code: "validation_error",
                    message: "Invalid route parameter",
                },
            })
            return
        }
        req.params = result.data
        next()
    }
}

function validateQuery(schema: z.ZodSchema) {
    return (req: any, res: any, next: any) => {
        const result = schema.safeParse(req.query)
        if (!result.success) {
            res.status(400).json({
                error: {
                    code: "validation_error",
                    message: "Invalid query parameter",
                },
            })
            return
        }
        req.query = result.data
        next()
    }
}

function asyncRoute(fn: (req: any, res: any) => Promise<void>) {
    return async (req: any, res: any) => {
        try {
            await fn(req, res)
        } catch (error) {
            await dashboardError(res)
        }
    }
}

async function dashboardError(res: any): Promise<void> {
    res.status(500).json({
        error: {
            code: "dashboard_api_error",
            message: "An internal error occurred",
        },
    })
}

async function buildAiInsightContext(options: DashboardRouterOptions): Promise<PilotAiInsightContext> {
    const { config, postgresPool, redisClient, elasticsearchClient } = options
    const [
        postgres,
        redis,
        elasticsearch,
        flags,
        workflows,
        executions,
        traces,
        errors,
    ] = await Promise.all([
        checkPostgresHealth(postgresPool),
        checkRedisHealth(redisClient),
        checkElasticsearchHealth(elasticsearchClient),
        listFlagsWithRuleCounts(postgresPool),
        listWorkflowDefinitions(postgresPool),
        listWorkflowExecutions(postgresPool, 25),
        listRequestTraces(postgresPool, 25),
        listErrors(postgresPool, 25),
    ])
    const executionSteps = await listWorkflowStepExecutionsByExecutionIds(postgresPool, executions.map((execution) => execution.id))
    const traceSpans = new Map<string, any[]>()

    await Promise.all(traces.slice(0, 10).map(async (trace) => {
        traceSpans.set(trace.id, await getTraceSpans(postgresPool, trace.id))
    }))

    return {
        serviceName: config.runtime.serviceName,
        environment: config.runtime.environment,
        generatedAt: new Date().toISOString(),
        workflows: workflows.slice(0, 25).map((workflow) => ({
            id: workflow.id,
            name: workflow.name,
            version: workflow.version,
        })),
        executions: executions.map((execution) => ({
            ...serializeExecution(execution, executionSteps.get(execution.id) || []),
            input: undefined,
            output: undefined,
        })),
        errors: errors.map((error) => ({
            id: error.id,
            name: error.name,
            message: error.message,
            category: error.category,
            level: error.level,
            source: error.source,
            status: (error as any).status,
            traceId: error.trace_id,
            occurredAt: error.occurred_at,
        })),
        traces: traces.slice(0, 10).map((trace) => serializeTrace(trace, traceSpans.get(trace.id) || [])),
        flags: flags.slice(0, 10).map((flag) => serializeFlag(flag, flag.rule_count)),
        health: [
            { name: "Postgres", status: postgres.status, latency: postgres.latencyMs },
            { name: "Redis", status: redis.status, latency: redis.latencyMs },
            { name: "Elasticsearch", status: elasticsearch.status, latency: elasticsearch.latencyMs },
            { name: "BullMQ Worker", status: config.worker.enabled ? "ok" : "degraded", latency: 0 },
        ],
    }
}

export function createDashboardRouter(options: DashboardRouterOptions): Router {
    const router = Router()
    const { config, postgresPool, redisClient, elasticsearchClient } = options
    router.use(json({ limit: "100kb" }))
    router.use(createRequestTracingMiddleware(postgresPool))

    const flagKeyParamSchema = z.object({
        key: z.string().min(1).max(128).regex(/^[a-zA-Z0-9._:-]+$/),
    })
    const workflowNameParamSchema = z.object({
        name: z.string().min(1).max(160),
    })
    const idParamSchema = (name: string) => z.object({
        [name]: z.string().min(1).max(160).regex(/^[a-zA-Z0-9._:-]+$/),
    })
    const optionalWorkflowQuerySchema = z.object({
        workflow: z.string().min(1).max(160).optional(),
    })
    const optionalTraceQuerySchema = z.object({
        traceId: z.string().min(1).max(160).regex(/^[a-zA-Z0-9._:-]+$/).optional(),
    })
    const optionalModelQuerySchema = z.object({
        model: z.string().min(1).max(128).regex(/^[a-zA-Z0-9._:/-]+$/).optional(),
    })

    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const staticPath = join(__dirname, "../static")

    router.use(express.static(staticPath))

    router.get("/", (req, res) => {
        res.sendFile(join(staticPath, "dashboard.html"))
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

    router.get("/api/dashboard-data", async (req, res) => {
        try {
            const [
                postgres,
                redis,
                elasticsearch,
                flagsResult,
                workflowsResult,
                executionsResult,
                tracesResult,
                errors,
            ] = await Promise.all([
                checkPostgresHealth(postgresPool),
                checkRedisHealth(redisClient),
                checkElasticsearchHealth(elasticsearchClient),
                listFlagsWithRuleCounts(postgresPool),
                listWorkflowDefinitions(postgresPool),
                listWorkflowExecutions(postgresPool, 50),
                listRequestTraces(postgresPool, 50),
                listErrors(postgresPool, 50),
            ])

            const executionSteps = await listWorkflowStepExecutionsByExecutionIds(postgresPool, executionsResult.map((execution) => execution.id))
            const workflowSteps = await listWorkflowStepsByWorkflowIds(postgresPool, workflowsResult.map((workflow) => workflow.id))
            const latestExecutions = latestByWorkflow(executionsResult)
            const traceSpans = new Map<string, any[]>()

            await Promise.all(tracesResult.map(async (trace) => {
                traceSpans.set(trace.id, await getTraceSpans(postgresPool, trace.id))
            }))

            res.json({
                serviceName: config.runtime.serviceName,
                environment: config.runtime.environment,
                settings: serializeSettings(config),
                workflows: workflowsResult.map((workflow) => {
                    const latestExecution = latestExecutions.get(workflow.name)
                    const steps = executionSteps.get(latestExecution?.id) || []
                    const definitionSteps = workflowSteps.get(workflow.id) || []

                    return serializeWorkflowSummary(workflow, executionsResult, definitionSteps, latestExecution, steps)
                }),
                executions: executionsResult.map((execution) => serializeExecution(execution, executionSteps.get(execution.id) || [])),
                flags: flagsResult.map((flag) => serializeFlag(flag, flag.rule_count)),
                errors: errors.map(serializeError),
                traces: tracesResult.map((trace) => serializeTrace(trace, traceSpans.get(trace.id) || [])),
                health: [
                    { name: "Postgres", status: postgres.status, latency: postgres.latencyMs, description: "Primary persistence for workflows, flags, traces, and errors." },
                    { name: "Redis", status: redis.status, latency: redis.latencyMs, description: "BullMQ queue transport and feature flag cache." },
                    { name: "Elasticsearch", status: elasticsearch.status, latency: elasticsearch.latencyMs, description: "Search index for errors and trace spans." },
                    { name: "BullMQ Worker", status: config.worker.enabled ? "ok" : "degraded", latency: 0, description: "Background workflow execution worker." },
                ],
            })
        }
        catch (error) {
            await dashboardError(res)
        }
    })

    router.get("/api/settings", async (req, res) => {
        res.json({
            settings: serializeSettings(config),
        })
    })

    router.get("/api/ai-models", async (req, res) => {
        try {
            if (!isGroqApiKeyConfigured()) {
                res.status(428).json({
                    error: {
                        code: "groq_api_key_missing",
                        message: "Add GROQ_API_KEY before syncing Groq models.",
                    },
                    models: [],
                })
                return
            }

            res.json({
                models: await listGroqModels(),
            })
        }
        catch (error) {
            await dashboardError(res)
        }
    })

    router.get("/api/ai-insights", validateQuery(optionalModelQuerySchema), async (req, res) => {
        try {
            if (!isGroqApiKeyConfigured()) {
                res.status(428).json({
                    error: {
                        code: "groq_api_key_missing",
                        message: "Add GROQ_API_KEY in settings to enable AI Insights.",
                    },
                    modelConfigured: false,
                })
                return
            }

            const context = await buildAiInsightContext(options)
            const model = typeof req.query.model === "string" ? req.query.model : undefined
            const insight = await generateGroqInsight(context, model)

            res.json({
                insight,
                modelConfigured: true,
            })
        }
        catch (error) {
            await dashboardError(res)
        }
    })

    router.get("/api/flags", async (req, res) => {
        const flags = await listFlagsWithRuleCounts(postgresPool)
        res.json({ flags: flags.map((flag) => serializeFlag(flag, flag.rule_count)) })
    })

    const flagCreateSchema = z.object({
        key: z.string().min(1).max(128),
        description: z.string().max(512).optional(),
        enabled: z.boolean().optional(),
        rolloutPercentage: z.number().min(0).max(100).optional(),
        changedBy: z.string().max(128).optional(),
    }).strict()

    const flagUpdateSchema = z.object({
        description: z.string().max(512).optional(),
        enabled: z.boolean().optional(),
        rolloutPercentage: z.number().min(0).max(100).optional(),
        changedBy: z.string().max(128).optional(),
    }).strict()

    const flagRuleSchema = z.object({
        attribute: z.string().min(1).max(128),
        operator: z.enum(["equals", "not_equals", "in", "not_in", "contains", "starts_with", "ends_with"]),
        value: z.string().min(1).max(512),
        enabled: z.boolean().optional(),
        changedBy: z.string().max(128).optional(),
    }).strict()

    const deleteBodySchema = z.object({
        changedBy: z.string().max(128).optional(),
    }).strict().default({})

    router.post("/api/flags", validate(flagCreateSchema), asyncRoute(async (req, res) => {
        const flag = await createFlag(postgresPool, {
            key: req.body.key,
            description: req.body.description,
            enabled: req.body.enabled,
            rolloutPercentage: req.body.rolloutPercentage,
            changedBy: req.body.changedBy,
        })

        await invalidateFlagCache(redisClient, flag.key)

        res.status(201).json({ flag: serializeFlag(flag) })
    }))

    router.get("/api/flags/:key", validateParams(flagKeyParamSchema), asyncRoute(async (req, res) => {
        const flag = await getFlagByKey(postgresPool, req.params.key)

        if (!flag) {
            res.status(404).json({ message: "Feature flag not found" })
            return
        }

        const rules = await listFlagRules(postgresPool, req.params.key)

        res.json({
            flag: serializeFlag(flag, rules.length),
            rules: rules.map(serializeRule),
        })
    }))

    router.patch("/api/flags/:key", validateParams(flagKeyParamSchema), validate(flagUpdateSchema), asyncRoute(async (req, res) => {
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

        const rules = await listFlagRules(postgresPool, req.params.key)
        res.json({ flag: serializeFlag(flag, rules.length) })
    }))

    router.delete("/api/flags/:key", validateParams(flagKeyParamSchema), validate(deleteBodySchema), asyncRoute(async (req, res) => {
        const deleted = await deleteFlag(postgresPool, req.params.key, req.body?.changedBy)

        if (!deleted) {
            res.status(404).json({ message: "Feature flag not found" })
            return
        }

        await invalidateFlagCache(redisClient, req.params.key)

        res.status(204).send()
    }))

    router.get("/api/flags/:key/rules", validateParams(flagKeyParamSchema), asyncRoute(async (req, res) => {
        const flag = await getFlagByKey(postgresPool, req.params.key)

        if (!flag) {
            res.status(404).json({ message: "Feature flag not found" })
            return
        }

        const rules = await listFlagRules(postgresPool, req.params.key)
        res.json({ rules: rules.map(serializeRule) })
    }))

    router.post("/api/flags/:key/rules", validateParams(flagKeyParamSchema), validate(flagRuleSchema), asyncRoute(async (req, res) => {
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

        res.status(201).json({ rule: serializeRule(rule) })
    }))

    router.patch("/api/flags/:key/rules/:ruleId", validateParams(flagKeyParamSchema.merge(idParamSchema("ruleId"))), validate(flagRuleSchema.partial()), asyncRoute(async (req, res) => {
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

        res.json({ rule: serializeRule(rule) })
    }))

    router.delete("/api/flags/:key/rules/:ruleId", validateParams(flagKeyParamSchema.merge(idParamSchema("ruleId"))), validate(deleteBodySchema), asyncRoute(async (req, res) => {
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
    }))

    router.get("/api/flags/:key/audit-logs", validateParams(flagKeyParamSchema), asyncRoute(async (req, res) => {
        const flag = await getFlagByKey(postgresPool, req.params.key)

        if (!flag) {
            res.status(404).json({ message: "Feature flag not found" })
            return
        }

        const auditLogs = await listFlagAuditLogs(postgresPool, req.params.key)
        res.json({ auditLogs: auditLogs.map(serializeAuditLog) })
    }))

    router.get("/api/workflows", async (req, res) => {
        try {
            const workflows = await listWorkflowDefinitions(postgresPool)
            const executions = await listWorkflowExecutions(postgresPool, 200)
            const executionSteps = await listWorkflowStepExecutionsByExecutionIds(postgresPool, executions.map((execution) => execution.id))
            const workflowSteps = await listWorkflowStepsByWorkflowIds(postgresPool, workflows.map((workflow) => workflow.id))
            const latestExecutions = latestByWorkflow(executions)

            res.json({
                workflows: workflows.map((workflow) => {
                    const latestExecution = latestExecutions.get(workflow.name)
                    const steps = executionSteps.get(latestExecution?.id) || []
                    const definitionSteps = workflowSteps.get(workflow.id) || []

                    return serializeWorkflowSummary(workflow, executions, definitionSteps, latestExecution, steps)
                }),
            })
        }
        catch (error) {
            await dashboardError(res)
        }
    })

    router.get("/api/workflows/:name", validateParams(workflowNameParamSchema), async (req, res) => {
        try {
            const workflow = await getLatestWorkflowDefinitionByName(postgresPool, req.params.name)

            if (!workflow) {
                res.status(404).json({ message: "Workflow not found" })
                return
            }

            const executions = await listWorkflowExecutionsByWorkflowName(postgresPool, req.params.name, 50)
            const executionSteps = await listWorkflowStepExecutionsByExecutionIds(postgresPool, executions.map((execution) => execution.id))
            const workflowSteps = await listWorkflowStepsByWorkflowIds(postgresPool, [workflow.id])
            const latestExecution = executions[0]
            const latestSteps = executionSteps.get(latestExecution?.id) || []
            const definitionSteps = workflowSteps.get(workflow.id) || []

            res.json({
                workflow: serializeWorkflowSummary(workflow, executions, definitionSteps, latestExecution, latestSteps),
                executions: executions.map((execution) => serializeExecution(execution, executionSteps.get(execution.id) || [])),
            })
        }
        catch (error) {
            await dashboardError(res)
        }
    })

    router.get("/api/executions", validateQuery(optionalWorkflowQuerySchema), async (req, res) => {
        try {
            const workflowName = typeof req.query.workflow === "string" ? req.query.workflow : undefined
            const executions = workflowName
                ? await listWorkflowExecutionsByWorkflowName(postgresPool, workflowName, 50)
                : await listWorkflowExecutions(postgresPool, 50)
            const executionSteps = await listWorkflowStepExecutionsByExecutionIds(postgresPool, executions.map((execution) => execution.id))

            res.json({ executions: executions.map((execution) => serializeExecution(execution, executionSteps.get(execution.id) || [])) })
        }
        catch (error) {
            await dashboardError(res)
        }
    })

    router.get("/api/executions/:executionId", validateParams(idParamSchema("executionId")), async (req, res) => {
        try {
            const execution = await getWorkflowExecution(postgresPool, req.params.executionId)

            if (!execution) {
                res.status(404).json({ message: "Workflow execution not found" })
                return
            }

            const steps = await getWorkflowExecutionSteps(postgresPool, req.params.executionId)
            res.json({ execution: serializeExecution(execution, steps) })
        }
        catch (error) {
            await dashboardError(res)
        }
    })

    router.get("/api/traces", async (req, res) => {
        try {
            const traces = await listRequestTraces(postgresPool, 50)
            const traceSpans = new Map<string, any[]>()

            await Promise.all(traces.map(async (trace) => {
                traceSpans.set(trace.id, await getTraceSpans(postgresPool, trace.id))
            }))

            res.json({ traces: traces.map((trace) => serializeTrace(trace, traceSpans.get(trace.id) || [])) })
        }
        catch (error) {
            await dashboardError(res)
        }
    })

    router.get("/api/traces/:traceId", validateParams(idParamSchema("traceId")), async (req, res) => {
        try {
            const trace = await getRequestTrace(postgresPool, req.params.traceId)

            if (!trace) {
                res.status(404).json({ message: "Trace not found" })
                return
            }

            const [spans, errors] = await Promise.all([
                getTraceSpans(postgresPool, req.params.traceId),
                getErrorsByTrace(postgresPool, req.params.traceId),
            ])

            res.json({
                trace: serializeTrace(trace, spans),
                errors: errors.map(serializeError),
            })
        }
        catch (error) {
            await dashboardError(res)
        }
    })

    router.get("/api/errors", validateQuery(optionalTraceQuerySchema), async (req, res) => {
        try {
            const traceId = typeof req.query.traceId === "string" ? req.query.traceId : undefined
            const errors = traceId ? await getErrorsByTrace(postgresPool, traceId) : await listErrors(postgresPool, 50)
            res.json({ errors: errors.map(serializeError) })
        }
        catch (error) {
            await dashboardError(res)
        }
    })

    router.get("/api/errors/:errorId", validateParams(idParamSchema("errorId")), async (req, res) => {
        try {
            const error = await getErrorById(postgresPool, req.params.errorId)

            if (!error) {
                res.status(404).json({ message: "Error not found" })
                return
            }

            res.json({ error: serializeError(error) })
        }
        catch (error) {
            await dashboardError(res)
        }
    })

    const aiKeySchema = z.object({
        groqApiKey: z.string().min(1).max(512).regex(/^[^\r\n]+$/).optional(),
        groqModel: z.string().min(1).max(128).regex(/^[a-zA-Z0-9._:/-]+$/).optional(),
    }).strict().refine((d) => d.groqApiKey || d.groqModel, { message: "groqApiKey or groqModel is required" })

    router.post("/api/settings/ai-key", validate(aiKeySchema), async (req, res) => {
        try {
            await savePilotEnv({
                ...(req.body.groqApiKey ? { groqApiKey: req.body.groqApiKey } : {}),
                ...(req.body.groqModel ? { groqModel: req.body.groqModel } : {}),
            })

            res.json({ success: true })
        } catch (error) {
            await dashboardError(res)
        }
    })

    const settingsSchema = z.object({
        environment: z.string().max(64).regex(/^[a-zA-Z0-9._:-]*$/).optional(),
        dashboardPath: z.string().max(256).regex(/^\/[a-zA-Z0-9/_:-]*$/).optional(),
        dashboardEnabled: z.boolean().optional(),
        dashboardAuthEnabled: z.boolean().optional(),
        workerEnabled: z.boolean().optional(),
        workerConcurrency: z.number().int().min(1).max(100).optional(),
        queuePrefix: z.string().max(64).regex(/^[a-zA-Z0-9:_-]*$/).optional(),
        autoRunMigrations: z.boolean().optional(),
        groqModel: z.string().max(128).regex(/^[a-zA-Z0-9._:/-]+$/).optional(),
    }).strict()

    router.post("/api/settings", validate(settingsSchema), async (req, res) => {
        try {
            const {
                environment,
                dashboardPath,
                dashboardEnabled,
                dashboardAuthEnabled,
                workerEnabled,
                workerConcurrency,
                queuePrefix,
                autoRunMigrations,
                groqModel,
            } = req.body

            // Update in-memory config
            if (environment !== undefined) config.runtime.environment = environment
            if (dashboardPath !== undefined) config.dashboard.path = dashboardPath
            if (dashboardEnabled !== undefined) config.dashboard.enabled = dashboardEnabled
            if (workerEnabled !== undefined) config.worker.enabled = workerEnabled
            if (workerConcurrency !== undefined) config.worker.workflowConcurrency = Number(workerConcurrency)
            if (queuePrefix !== undefined) config.worker.queuePrefix = queuePrefix
            if (autoRunMigrations !== undefined) config.migrations.autoRun = autoRunMigrations

            // Model preference is persisted to .pilot.env (not process.env)
            if (groqModel !== undefined) {
                await savePilotEnv({ groqModel })
            }

            res.json({ success: true, settings: serializeSettings(config) })
        } catch (error) {
            await dashboardError(res)
        }
    })

    const aiChatSchema = z.object({
        message: z.string().min(1).max(4096),
        history: z.array(z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string().max(4096),
        }).strict()).max(50).default([]),
        model: z.string().max(128).regex(/^[a-zA-Z0-9._:/-]+$/).optional(),
    }).strict()

    router.post("/api/ai-chat", validate(aiChatSchema), async (req, res) => {
        try {
            if (!isGroqApiKeyConfigured()) {
                res.status(428).json({
                    error: {
                        code: "groq_api_key_missing",
                        message: "Add GROQ_API_KEY in settings to enable the AI assistant.",
                    },
                })
                return
            }

            const sanitizedHistory = req.body.history.filter((m: any) => m.role !== "system")
            const context = await buildAiInsightContext(options)
            const responseText = await askGroqAssistant(context, req.body.message, sanitizedHistory, req.body.model)

            res.json({ response: responseText })
        }
        catch (error) {
            await dashboardError(res)
        }
    })

    return router
}
