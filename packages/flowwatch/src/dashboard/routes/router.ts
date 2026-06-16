import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import type { Client } from "@elastic/elasticsearch"
import express, { json, Router } from "express"
import type { Redis } from "ioredis"
import type { Pool } from "pg"
import type { NormalizedFlowwatchConfig } from "../../types/index.js"
import { checkElasticsearchHealth, checkPostgresHealth, checkRedisHealth } from "../../runtime/health/healthService.js"
import {
    createFlag,
    createFlagRule,
    deleteFlag,
    deleteFlagRule,
    getFlagByKey,
    listAuditLogs,
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
import { generateGroqInsight, listGroqModels, askGroqAi, type FlowwatchAiInsightContext } from "../../ai/groqInsightService.js"
import { saveFlowwatchEnv, isGroqApiKeyConfigured } from "../../utils/flowwatchEnvStore.js"
import { captureError } from "../../engine/errors/errorEngine.js"
import { z } from "zod"

interface DashboardRouterOptions {
    config: NormalizedFlowwatchConfig
    postgresPool: Pool
    redisClient: Redis
    elasticsearchClient: Client
}

/** Capture an AI error into the Flowwatch error store and surface a meaningful response */
async function handleAiError(engineOptions: { pool: Pool; elasticsearchClient: Client }, res: any, error: unknown, route: string): Promise<void> {
    const err = error instanceof Error ? error : new Error(String(error))
    const msg = err.message

    // Store it so it shows up in the dashboard Errors tab
    try {
        await captureError(
            engineOptions,
            err,
            { source: "dashboard_api", category: "server", level: "error", statusCode: 502,
              metadata: { route } }
        )
    } catch { /* never block the response */ }

    console.error(`[Flowwatch] AI route error (${route}):`, msg)

    if (msg.includes("not configured") || msg.includes("GROQ_API_KEY")) {
        res.status(428).json({ error: { code: "groq_api_key_missing",
            message: "Groq API key not configured. Add it in Settings → AI Configuration." } })
        return
    }
    if (msg.includes("401") || msg.includes("403") || msg.toLowerCase().includes("invalid api key")) {
        res.status(502).json({ error: { code: "groq_auth_error",
            message: `Groq rejected the API key: ${msg.slice(0, 300)}` } })
        return
    }
    if (msg.includes("413") || msg.toLowerCase().includes("too large") || msg.toLowerCase().includes("rate limit")) {
        res.status(502).json({ error: { code: "groq_rate_limit",
            message: "Groq rate limit or token limit exceeded. Try again shortly." } })
        return
    }
    res.status(502).json({ error: { code: "groq_request_failed",
        message: `AI request failed: ${msg.slice(0, 300)}` } })
}

async function invalidateFlagCache(redisClient: Redis, flagKey: string): Promise<void> {
    try {
        await redisClient.del(`flowwatch:flags:${flagKey}`)
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
        req.validatedQuery = result.data   // req.query is read-only in Express 5
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

async function dashboardError(res: any, error?: unknown): Promise<void> {
    if (error) console.error("[Flowwatch dashboard] API error", error)
    res.status(500).json({
        error: {
            code: "dashboard_api_error",
            message: "An internal error occurred",
        },
    })
}

/**
 * Surfaces a meaningful error when an AI provider call fails.
 * Distinguishes between: API key not configured, token limit exceeded, bad key, other.
 */
async function aiProviderError(res: any, error: unknown): Promise<void> {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("[Flowwatch dashboard] AI provider error:", msg)

    // Key not loaded into store yet
    if (msg.includes("not configured")) {
        res.status(428).json({
            error: {
                code: "groq_api_key_missing",
                message: "Groq API key not configured. Add it in Settings → AI Configuration.",
            },
        })
        return
    }

    // Token limit exceeded
    if (msg.includes("413") || msg.toLowerCase().includes("token") || msg.toLowerCase().includes("too large")) {
        res.status(502).json({
            error: {
                code: "groq_token_limit",
                message: "AI request exceeded the model's token limit. Try selecting a model with a higher context limit.",
            },
        })
        return
    }

    // Bad API key / auth failure
    if (msg.includes("401") || msg.includes("403")) {
        res.status(502).json({
            error: {
                code: "groq_auth_error",
                message: "Groq rejected the API key. Re-enter your key in Settings → AI Configuration.",
            },
        })
        return
    }

    res.status(502).json({
        error: {
            code: "groq_request_failed",
            message: `Groq request failed: ${msg.slice(0, 200)}`,
        },
    })
}

async function buildAiInsightContext(options: DashboardRouterOptions): Promise<FlowwatchAiInsightContext> {
    const { config, postgresPool, redisClient, elasticsearchClient } = options
    const [
        postgres,
        redis,
        elasticsearch,
        flagsResult,
        workflowsResult,
        executionsResult,
        tracesResult,
        errorsResult,
    ] = await Promise.all([
        checkPostgresHealth(postgresPool).catch(() => ({ status: "error", latencyMs: -1 })),
        checkRedisHealth(redisClient).catch(() => ({ status: "error", latencyMs: -1 })),
        checkElasticsearchHealth(elasticsearchClient).catch(() => ({ status: "error", latencyMs: -1 })),
        listFlagsWithRuleCounts(postgresPool).catch((): { rows: any[]; total: number } => ({ rows: [], total: 0 })),
        listWorkflowDefinitions(postgresPool).catch((): { rows: any[]; total: number } => ({ rows: [], total: 0 })),
        listWorkflowExecutions(postgresPool, 1, 10).catch((): { rows: any[]; total: number } => ({ rows: [], total: 0 })),
        listRequestTraces(postgresPool, 1, 8).catch((): { rows: any[]; total: number } => ({ rows: [], total: 0 })),
        listErrors(postgresPool, 1, 10).catch((): { rows: any[]; total: number } => ({ rows: [], total: 0 })),
    ])

    const flags = flagsResult.rows
    const workflows = workflowsResult.rows
    const executions = executionsResult.rows
    const traces = tracesResult.rows
    const errors = errorsResult.rows

    const executionSteps = await listWorkflowStepExecutionsByExecutionIds(
        postgresPool,
        executions.map((e) => e.id)
    ).catch(() => new Map<string, any[]>())

    return {
        serviceName: config.runtime.serviceName,
        environment: config.runtime.environment,
        generatedAt: new Date().toISOString(),
        // Workflows — name + version only (no IDs)
        workflows: workflows.slice(0, 6).map((w) => ({
            name: w.name,
            version: w.version,
        })),
        // Executions — status + step summary only (no input/output/IDs)
        executions: executions.slice(0, 8).map((execution) => {
            const steps = (executionSteps.get(execution.id) || []).slice(0, 5)
            return {
                workflow: execution.workflow_name,
                status: execution.status,
                failedStep: steps.find((s: any) => s.status === "failed")?.step_name ?? null,
                steps: steps.map((s: any) => ({ name: s.step_name, status: s.status })),
            }
        }),
        // Errors — no stack traces, message capped at 120 chars
        errors: errors.slice(0, 8).map((error) => ({
            name: error.name,
            message: String(error.message || "").slice(0, 120),
            category: error.category,
            level: error.level,
            source: error.source,
        })),
        // Traces — summary only, no spans, path capped at 80 chars
        traces: traces.slice(0, 5).map((trace) => ({
            method: trace.method,
            path: String(trace.path || "").slice(0, 80),
            status: trace.status_code,
            durationMs: trace.duration_ms,
        })),
        // Flags — key + state + rollout only
        flags: flags.slice(0, 6).map((flag) => ({
            key: flag.key,
            enabled: flag.enabled,
            rollout: flag.rollout_percentage,
        })),
        // Health — status + latency only
        health: [
            { name: "Postgres", status: postgres.status, latency: postgres.latencyMs },
            { name: "Redis", status: redis.status, latency: redis.latencyMs },
            { name: "Elasticsearch", status: elasticsearch.status, latency: elasticsearch.latencyMs },
            { name: "Worker", status: config.worker.enabled ? "ok" : "degraded" },
        ],
    }
}

/** Extract page and limit from query string with safe defaults */
function getPagination(query: any): { page: number; limit: number } {
    const page = Math.max(1, parseInt(String(query.page), 10) || 1)
    const limit = Math.max(1, Math.min(100, parseInt(String(query.limit), 10) || 50))
    return { page, limit }
}

export function createDashboardRouter(options: DashboardRouterOptions): Router {
    const router = Router()
    const { config, postgresPool, redisClient, elasticsearchClient } = options

    // Dashboard SPA
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const dashboardPath = join(__dirname, "..", "dashboard.html")

    router.get("/", (req, res) => {
        res.sendFile(dashboardPath)
    })

    // ── Health ──

    router.get("/api/health", async (req, res) => {
        try {
            const [postgres, redis, elasticsearch] = await Promise.all([
                checkPostgresHealth(postgresPool),
                checkRedisHealth(redisClient),
                checkElasticsearchHealth(elasticsearchClient),
            ])

            res.json({
                status: postgres.status === "ok" && redis.status === "ok" && elasticsearch.status === "ok" ? "ok" : "degraded",
                serviceName: config.runtime.serviceName,
                checks: {
                    postgres,
                    redis,
                    elasticsearch,
                },
            })
        }
        catch (error) {
            await dashboardError(res)
        }
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
                errorsResult,
            ] = await Promise.all([
                checkPostgresHealth(postgresPool),
                checkRedisHealth(redisClient),
                checkElasticsearchHealth(elasticsearchClient),
                listFlagsWithRuleCounts(postgresPool),
                listWorkflowDefinitions(postgresPool),
                listWorkflowExecutions(postgresPool, 1, 50),
                listRequestTraces(postgresPool, 1, 50),
                listErrors(postgresPool, 1, 50),
            ])

            const flags = flagsResult.rows
            const workflows = workflowsResult.rows
            const executions = executionsResult.rows
            const traces = tracesResult.rows
            const errorsRows = errorsResult.rows

            const executionSteps = await listWorkflowStepExecutionsByExecutionIds(postgresPool, executions.map((execution) => execution.id))
            const workflowSteps = await listWorkflowStepsByWorkflowIds(postgresPool, workflows.map((workflow) => workflow.id))
            const latestExecutions = latestByWorkflow(executions)
            const traceSpans = new Map<string, any[]>()

            await Promise.all(traces.map(async (trace) => {
                traceSpans.set(trace.id, await getTraceSpans(postgresPool, trace.id))
            }))

            res.json({
                serviceName: config.runtime.serviceName,
                environment: config.runtime.environment,
                settings: serializeSettings(config),
                workflows: workflows.map((workflow) => {
                    const latestExecution = latestExecutions.get(workflow.name)
                    const steps = executionSteps.get(latestExecution?.id) || []
                    const definitionSteps = workflowSteps.get(workflow.id) || []

                    return serializeWorkflowSummary(workflow, executions, definitionSteps, latestExecution, steps)
                }),
                executions: executions.map((execution) => serializeExecution(execution, executionSteps.get(execution.id) || [])),
                flags: flags.map((flag) => serializeFlag(flag, flag.rule_count)),
                errors: errorsRows.map(serializeError),
                traces: traces.map((trace) => serializeTrace(trace, traceSpans.get(trace.id) || [])),
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

    const optionalModelQuerySchema = z.object({
        model: z.string().optional(),
    })

    router.get("/api/ai-insights", validateQuery(optionalModelQuerySchema), async (req, res) => {
        try {
            if (!isGroqApiKeyConfigured()) {
                res.status(428).json({
                    error: { code: "groq_api_key_missing",
                             message: "Add your Groq API key in Settings → AI Configuration." },
                    modelConfigured: false,
                })
                return
            }
            const context = await buildAiInsightContext(options)
            const model = typeof (req as any).validatedQuery?.model === "string" ? (req as any).validatedQuery.model : undefined
            const insight = await generateGroqInsight(context, model)
            res.json({ insight, modelConfigured: true })
        }
        catch (error) {
            await handleAiError({ pool: postgresPool, elasticsearchClient }, res, error, "GET /api/ai-insights")
        }
    })

    router.get("/api/flags", async (req, res) => {
        const { page, limit } = getPagination(req.query)
        const result = await listFlagsWithRuleCounts(postgresPool, page, limit)
        res.json({
            flags: result.rows.map((flag) => serializeFlag(flag, flag.rule_count)),
            total: result.total,
            page,
            limit,
        })
    })

    const flagCreateSchema = z.object({
        key: z.string().min(1).max(128),
        description: z.string().max(512).optional(),
        enabled: z.boolean().optional(),
        rolloutPercentage: z.number().min(0).max(100).optional(),
        changedBy: z.string().max(128).optional(),
    }).strict()

    const flagUpdateSchema = z.object({
        description: z.string().max(512).nullable().optional(),
        enabled: z.boolean().optional(),
        rolloutPercentage: z.number().min(0).max(100).optional(),
        changedBy: z.string().max(128).optional(),
    }).strict()

    const flagKeyParam = z.object({
        key: z.string().min(1).max(128),
    })

    router.post("/api/flags", json(), validate(flagCreateSchema), async (req, res) => {
        try {
            const flag = await createFlag(postgresPool, req.body)
            await invalidateFlagCache(redisClient, flag.key)
            res.status(201).json({ flag: serializeFlag(flag, 0) })
        }
        catch (error) {
            await dashboardError(res, error)
        }
    })

    router.patch("/api/flags/:key", json(), validateParams(flagKeyParam), validate(flagUpdateSchema), async (req, res) => {
        try {
            const flag = await updateFlag(postgresPool, req.params.key, req.body)
            if (!flag) {
                res.status(404).json({ message: "Feature flag not found" })
                return
            }
            await invalidateFlagCache(redisClient, flag.key)
            res.json({ flag: serializeFlag(flag, 0) })
        }
        catch (error) {
            await dashboardError(res, error)
        }
    })

    router.delete("/api/flags/:key", validateParams(flagKeyParam), async (req, res) => {
        try {
            const deleted = await deleteFlag(postgresPool, req.params.key)
            if (!deleted) {
                res.status(404).json({ message: "Feature flag not found" })
                return
            }
            await invalidateFlagCache(redisClient, req.params.key)
            res.status(204).end()
        }
        catch (error) {
            await dashboardError(res, error)
        }
    })

    // ── Flag Rules ──

    const ruleIdParam = z.object({
        flagKey: z.string().min(1).max(128),
        ruleId: z.string().min(1),
    })

    const flagRuleCreateSchema = z.object({
        attribute: z.string().min(1).max(128),
        operator: z.enum(["equals", "not_equals", "in", "not_in", "contains", "starts_with", "ends_with", "greater_than", "less_than"]),
        value: z.any(),
        enabled: z.boolean().optional(),
        changedBy: z.string().max(128).optional(),
    }).strict()

    const flagRuleUpdateSchema = z.object({
        attribute: z.string().min(1).max(128).optional(),
        operator: z.enum(["equals", "not_equals", "in", "not_in", "contains", "starts_with", "ends_with", "greater_than", "less_than"]).optional(),
        value: z.any().optional(),
        enabled: z.boolean().optional(),
        changedBy: z.string().max(128).optional(),
    }).strict()

    router.get("/api/flags/:flagKey/rules", validateParams(flagKeyParam), async (req, res) => {
        try {
            const rules = await listFlagRules(postgresPool, req.params.flagKey)
            res.json({ rules: rules.map(serializeRule) })
        }
        catch (error) {
            await dashboardError(res)
        }
    })

    router.post("/api/flags/:flagKey/rules", json(), validateParams(flagKeyParam), validate(flagRuleCreateSchema), async (req, res) => {
        try {
            const rule = await createFlagRule(postgresPool, { ...req.body, flagKey: req.params.flagKey })
            if (!rule) {
                res.status(404).json({ message: "Feature flag not found" })
                return
            }
            await invalidateFlagCache(redisClient, req.params.flagKey)
            res.status(201).json({ rule: serializeRule(rule) })
        }
        catch (error) {
            await dashboardError(res, error)
        }
    })

    router.patch("/api/flags/:flagKey/rules/:ruleId", json(), validateParams(ruleIdParam), validate(flagRuleUpdateSchema), async (req, res) => {
        try {
            const rule = await updateFlagRule(postgresPool, req.params.ruleId, req.body)
            if (!rule) {
                res.status(404).json({ message: "Rule not found" })
                return
            }
            await invalidateFlagCache(redisClient, req.params.flagKey)
            res.json({ rule: serializeRule(rule) })
        }
        catch (error) {
            await dashboardError(res, error)
        }
    })

    router.delete("/api/flags/:flagKey/rules/:ruleId", validateParams(ruleIdParam), async (req, res) => {
        try {
            const deleted = await deleteFlagRule(postgresPool, req.params.ruleId)
            if (!deleted) {
                res.status(404).json({ message: "Rule not found" })
                return
            }
            await invalidateFlagCache(redisClient, req.params.flagKey)
            res.status(204).end()
        }
        catch (error) {
            await dashboardError(res, error)
        }
    })

    // ── Audit Logs ──

    router.get("/api/flags/:flagKey/audit", validateParams(flagKeyParam), async (req, res) => {
        try {
            const logs = await listAuditLogs(postgresPool, req.params.flagKey)
            res.json({ logs: logs.map(serializeAuditLog) })
        }
        catch (error) {
            await dashboardError(res)
        }
    })

    router.get("/api/audit-logs", async (req, res) => {
        try {
            const logs = await listAuditLogs(postgresPool)
            res.json({ logs: logs.map(serializeAuditLog) })
        }
        catch (error) {
            await dashboardError(res)
        }
    })

    // ── Workflow Definitions (paginated) ──

    router.get("/api/workflows", async (req, res) => {
        try {
            const { page, limit } = getPagination(req.query)
            const result = await listWorkflowDefinitions(postgresPool, page, limit)

            const allWorkflows = result.rows
            const workflowIds = allWorkflows.map((w) => w.id)

            const [steps, executions, latestByWorkflowMap] = await Promise.all([
                listWorkflowStepsByWorkflowIds(postgresPool, workflowIds),
                listWorkflowExecutions(postgresPool, 1, 25),
                (async () => {
                    const execResult = await listWorkflowExecutions(postgresPool, 1, 10)
                    return latestByWorkflow(execResult.rows)
                })(),
            ])

            res.json({
                workflows: allWorkflows.map((workflow) => {
                    const defSteps = steps.get(workflow.id) || []
                    const executionsForSummary = executions.rows
                    const latestExecution = latestByWorkflowMap.get(workflow.name)
                    const latestSteps = latestExecution ? [] : []
                    return serializeWorkflowSummary(workflow, executionsForSummary, defSteps, latestExecution, latestSteps)
                }),
                total: result.total,
                page,
                limit,
            })
        }
        catch (error) {
            await dashboardError(res)
        }
    })

    const workflowNameParam = z.object({
        workflowName: z.string().min(1).max(256),
    })

    const optionalWorkflowQuerySchema = z.object({
        workflow: z.string().optional(),
    })

    router.get("/api/workflows/:workflowName", validateParams(workflowNameParam), async (req, res) => {
        try {
            const workflow = await getLatestWorkflowDefinitionByName(postgresPool, req.params.workflowName)

            if (!workflow) {
                res.status(404).json({ message: "Workflow not found" })
                return
            }

            const [definitionSteps, executions, workflowSteps] = await Promise.all([
                listWorkflowStepsByWorkflowIds(postgresPool, [workflow.id]),
                listWorkflowExecutionsByWorkflowName(postgresPool, req.params.workflowName, 50),
                listWorkflowStepExecutionsByExecutionIds(postgresPool, []),
            ])

            const latestExecutionResult = await listWorkflowExecutionsByWorkflowName(postgresPool, req.params.workflowName, 1)
            const latestExecution = latestExecutionResult[0] || null
            const latestSteps = latestExecution ? await getWorkflowExecutionSteps(postgresPool, latestExecution.id) : []

            res.json({
                workflow: serializeWorkflowSummary(workflow, executions, definitionSteps.get(workflow.id) || [], latestExecution, latestSteps),
                executions: executions.map((execution) => serializeExecution(execution, workflowSteps.get(execution.id) || [])),
            })
        }
        catch (error) {
            await dashboardError(res)
        }
    })

    router.get("/api/executions", validateQuery(optionalWorkflowQuerySchema), async (req, res) => {
        try {
            const workflowName = typeof (req as any).validatedQuery?.workflow === "string" ? (req as any).validatedQuery.workflow : undefined
            const { page, limit } = getPagination(req.query)

            let execResult: { rows: any[]; total: number }
            if (workflowName) {
                // listWorkflowExecutionsByWorkflowName returns raw array - wrap it
                const rows = await listWorkflowExecutionsByWorkflowName(postgresPool, workflowName, limit)
                execResult = { rows, total: rows.length }
            } else {
                execResult = await listWorkflowExecutions(postgresPool, page, limit)
            }

            const executionSteps = await listWorkflowStepExecutionsByExecutionIds(postgresPool, execResult.rows.map((execution) => execution.id))

            res.json({
                executions: execResult.rows.map((execution) => serializeExecution(execution, executionSteps.get(execution.id) || [])),
                total: execResult.total,
                page,
                limit,
            })
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
            const { page, limit } = getPagination(req.query)
            const result = await listRequestTraces(postgresPool, page, limit)
            const traces = result.rows
            const traceSpans = new Map<string, any[]>()

            await Promise.all(traces.map(async (trace) => {
                traceSpans.set(trace.id, await getTraceSpans(postgresPool, trace.id))
            }))

            res.json({
                traces: traces.map((trace) => serializeTrace(trace, traceSpans.get(trace.id) || [])),
                total: result.total,
                page,
                limit,
            })
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

    const optionalTraceQuerySchema = z.object({
        traceId: z.string().optional(),
    })

    router.get("/api/errors", validateQuery(optionalTraceQuerySchema), async (req, res) => {
        try {
            const traceId = typeof (req as any).validatedQuery?.traceId === "string" ? (req as any).validatedQuery.traceId : undefined
            const { page, limit } = getPagination(req.query)

            if (traceId) {
                const errors = await getErrorsByTrace(postgresPool, traceId)
                res.json({ errors: errors.map(serializeError), total: errors.length, page: 1, limit: errors.length })
            } else {
                const result = await listErrors(postgresPool, page, limit)
                res.json({
                    errors: result.rows.map(serializeError),
                    total: result.total,
                    page,
                    limit,
                })
            }
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
    })

    router.put("/api/settings/ai-config", json(), validate(aiKeySchema), async (req, res) => {
        try {
            const { groqApiKey } = req.body as { groqApiKey?: string }

            if (groqApiKey !== undefined) {
                saveFlowwatchEnv({ groqApiKey })
                res.json({
                    groqApiKeyConfigured: Boolean(groqApiKey),
                    message: groqApiKey ? "API key saved. Refresh the page to enable AI features." : "API key cleared.",
                })
                return
            }

            res.json({ groqApiKeyConfigured: isGroqApiKeyConfigured() })
        }
        catch (error) {
            await dashboardError(res, error)
        }
    })

    const aiAskSchema = z.object({
        question: z.string().min(1).max(2000),
        model: z.string().min(1).max(256).optional(),
    })

    router.post("/api/ai-ask", json(), validate(aiAskSchema), async (req, res) => {
        try {
            if (!isGroqApiKeyConfigured()) {
                res.status(428).json({
                    error: {
                        code: "groq_api_key_missing",
                        message: "Add your Groq API key in Settings → AI Configuration.",
                    },
                })
                return
            }

            const { question, model } = req.body as { question: string; model?: string }
            const context = await buildAiInsightContext(options)
            const answer = await askGroqAi(context, question, [], model)
            res.json({ answer })
        }
        catch (error) {
            await handleAiError({ pool: postgresPool, elasticsearchClient }, res, error, "POST /api/ai-ask")
        }
    })

    return router
}

function idParamSchema(paramName: string) {
    return z.object({
        [paramName]: z.string().min(1),
    })
}