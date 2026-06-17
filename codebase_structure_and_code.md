# Codebase Structure and Code Compilation

This document contains the entire structure of the files inside the `packages/flowwatch/src` directory along with the contents of each file.

## Directory Structure

```text
packages/flowwatch/src/
├── ai/
│   └── groqInsightService.ts
├── dashboard/
│   ├── routes/
│   │   ├── dashboardResponse.ts
│   │   └── router.ts
│   └── static/
│       └── dashboard.html
├── engine/
│   ├── background/
│   │   ├── queues/
│   │   │   └── workflowQueue.ts
│   │   └── workers/
│   │       └── workflowWorker.ts
│   ├── errors/
│   │   └── errorEngine.ts
│   ├── flags/
│   │   ├── evaluateFlag.ts
│   │   ├── flagEngine.ts
│   │   ├── hashRollout.ts
│   │   └── types.ts
│   ├── trace/
│   │   └── traceEngine.ts
│   └── workflows/
│       ├── types.ts
│       └── workflowEngine.ts
├── persistence/
│   ├── cache/
│   │   └── redisClient.ts
│   ├── db/
│   │   └── postgres.ts
│   ├── migrations/
│   │   ├── migrationRunner.ts
│   │   └── migrations.ts
│   ├── repositories/
│   │   ├── errors/
│   │   │   └── errorRepository.ts
│   │   ├── flags/
│   │   │   └── flagRepository.ts
│   │   ├── traces/
│   │   │   └── traceRepository.ts
│   │   └── workflows/
│   │       └── workflowRepository.ts
│   └── transaction.ts
├── runtime/
│   ├── config/
│   │   ├── normalizeConfig.ts
│   │   └── validationConfig.ts
│   ├── health/
│   │   └── healthService.ts
│   └── tracing/
│       ├── traceContext.ts
│       └── tracingMiddleware.ts
├── search/
│   └── elasticsearch/
│       ├── client.ts
│       ├── indexer.ts
│       ├── indexSetup.ts
│       └── mappingChecker.ts
├── server/
│   └── sidecarServer.ts
├── types/
│   └── index.ts
├── utils/
│   └── flowwatchEnvStore.ts
├── createFlowwatch.ts
└── index.ts
```

## File Contents

### Table of Contents
- [packages/flowwatch/src/ai/groqInsightService.ts](#packages-flowwatch-src-ai-groqinsightservicets)
- [packages/flowwatch/src/createFlowwatch.ts](#packages-flowwatch-src-createflowwatchts)
- [packages/flowwatch/src/dashboard/routes/dashboardResponse.ts](#packages-flowwatch-src-dashboard-routes-dashboardresponsets)
- [packages/flowwatch/src/dashboard/routes/router.ts](#packages-flowwatch-src-dashboard-routes-routerts)
- [packages/flowwatch/src/dashboard/static/dashboard.html](#packages-flowwatch-src-dashboard-static-dashboardhtml)
- [packages/flowwatch/src/engine/background/queues/workflowQueue.ts](#packages-flowwatch-src-engine-background-queues-workflowqueuets)
- [packages/flowwatch/src/engine/background/workers/workflowWorker.ts](#packages-flowwatch-src-engine-background-workers-workflowworkerts)
- [packages/flowwatch/src/engine/errors/errorEngine.ts](#packages-flowwatch-src-engine-errors-errorenginets)
- [packages/flowwatch/src/engine/flags/evaluateFlag.ts](#packages-flowwatch-src-engine-flags-evaluateflagts)
- [packages/flowwatch/src/engine/flags/flagEngine.ts](#packages-flowwatch-src-engine-flags-flagenginets)
- [packages/flowwatch/src/engine/flags/hashRollout.ts](#packages-flowwatch-src-engine-flags-hashrolloutts)
- [packages/flowwatch/src/engine/flags/types.ts](#packages-flowwatch-src-engine-flags-typests)
- [packages/flowwatch/src/engine/trace/traceEngine.ts](#packages-flowwatch-src-engine-trace-traceenginets)
- [packages/flowwatch/src/engine/workflows/types.ts](#packages-flowwatch-src-engine-workflows-typests)
- [packages/flowwatch/src/engine/workflows/workflowEngine.ts](#packages-flowwatch-src-engine-workflows-workflowenginets)
- [packages/flowwatch/src/index.ts](#packages-flowwatch-src-indexts)
- [packages/flowwatch/src/persistence/cache/redisClient.ts](#packages-flowwatch-src-persistence-cache-redisclientts)
- [packages/flowwatch/src/persistence/db/postgres.ts](#packages-flowwatch-src-persistence-db-postgrests)
- [packages/flowwatch/src/persistence/migrations/migrationRunner.ts](#packages-flowwatch-src-persistence-migrations-migrationrunnerts)
- [packages/flowwatch/src/persistence/migrations/migrations.ts](#packages-flowwatch-src-persistence-migrations-migrationsts)
- [packages/flowwatch/src/persistence/repositories/errors/errorRepository.ts](#packages-flowwatch-src-persistence-repositories-errors-errorrepositoryts)
- [packages/flowwatch/src/persistence/repositories/flags/flagRepository.ts](#packages-flowwatch-src-persistence-repositories-flags-flagrepositoryts)
- [packages/flowwatch/src/persistence/repositories/traces/traceRepository.ts](#packages-flowwatch-src-persistence-repositories-traces-tracerepositoryts)
- [packages/flowwatch/src/persistence/repositories/workflows/workflowRepository.ts](#packages-flowwatch-src-persistence-repositories-workflows-workflowrepositoryts)
- [packages/flowwatch/src/persistence/transaction.ts](#packages-flowwatch-src-persistence-transactionts)
- [packages/flowwatch/src/runtime/config/normalizeConfig.ts](#packages-flowwatch-src-runtime-config-normalizeconfigts)
- [packages/flowwatch/src/runtime/config/validationConfig.ts](#packages-flowwatch-src-runtime-config-validationconfigts)
- [packages/flowwatch/src/runtime/health/healthService.ts](#packages-flowwatch-src-runtime-health-healthservicets)
- [packages/flowwatch/src/runtime/tracing/traceContext.ts](#packages-flowwatch-src-runtime-tracing-tracecontextts)
- [packages/flowwatch/src/runtime/tracing/tracingMiddleware.ts](#packages-flowwatch-src-runtime-tracing-tracingmiddlewarets)
- [packages/flowwatch/src/search/elasticsearch/client.ts](#packages-flowwatch-src-search-elasticsearch-clientts)
- [packages/flowwatch/src/search/elasticsearch/indexSetup.ts](#packages-flowwatch-src-search-elasticsearch-indexsetupts)
- [packages/flowwatch/src/search/elasticsearch/indexer.ts](#packages-flowwatch-src-search-elasticsearch-indexerts)
- [packages/flowwatch/src/search/elasticsearch/mappingChecker.ts](#packages-flowwatch-src-search-elasticsearch-mappingcheckerts)
- [packages/flowwatch/src/server/sidecarServer.ts](#packages-flowwatch-src-server-sidecarserverts)
- [packages/flowwatch/src/types/index.ts](#packages-flowwatch-src-types-indexts)
- [packages/flowwatch/src/utils/flowwatchEnvStore.ts](#packages-flowwatch-src-utils-flowwatchenvstorets)

---

<a id="packages-flowwatch-src-ai-groqinsightservicets"></a>
### [packages/flowwatch/src/ai/groqInsightService.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/ai/groqInsightService.ts)

```typescript
import { getGroqApiKey, getGroqModel } from "../utils/flowwatchEnvStore.js"

export interface FlowwatchAiInsightContext {
    serviceName: string
    environment: string
    generatedAt: string
    workflows: unknown[]
    executions: unknown[]
    errors: unknown[]
    traces: unknown[]
    flags: unknown[]
    health: unknown[]
}

export interface FlowwatchAiInsight {
    summary: string
    likelyCause: string
    impact: string
    evidence: string[]
    recommendedActions: string[]
    confidence: number
    sourceCounts: {
        workflows: number
        executions: number
        errors: number
        traces: number
        flags: number
        health: number
    }
}

const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions"
const GROQ_MODELS_URL = "https://api.groq.com/openai/v1/models"
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"
const ALLOWED_CHAT_ROLES = new Set(["user", "assistant"])
const MODEL_ID_PATTERN = /^[a-zA-Z0-9._:/-]{1,128}$/
const OUT_OF_SCOPE_RESPONSE = [
    "### Server context only",
    "",
    "Ask Flowwatch AI can only help with this service's workflows, executions, traces, errors, feature flags, health checks, and backend runtime behavior.",
    "",
    "Try asking about:",
    "- Recent failed workflow executions",
    "- Slow traces or request latency",
    "- Captured server errors",
    "- Feature flag rollout impact",
    "- Health check failures",
].join("\n")

const SERVER_QUESTION_TERMS = [
    "api",
    "backend",
    "bullmq",
    "cache",
    "database",
    "db",
    "deployment",
    "endpoint",
    "error",
    "exception",
    "execution",
    "express",
    "failure",
    "feature flag",
    "flag",
    "health",
    "incident",
    "latency",
    "log",
    "metric",
    "migration",
    "postgres",
    "queue",
    "redis",
    "request",
    "retry",
    "route",
    "server",
    "service",
    "span",
    "status",
    "throughput",
    "trace",
    "workflow",
]

export interface GroqModelOption {
    id: string
    ownedBy?: string
}

function normalizeInsight(value: any, context: FlowwatchAiInsightContext): FlowwatchAiInsight {
    return {
        summary: String(value?.summary || "No summary returned."),
        likelyCause: String(value?.likelyCause || value?.likely_cause || "Unknown"),
        impact: String(value?.impact || "Unknown"),
        evidence: Array.isArray(value?.evidence) ? value.evidence.map(String).slice(0, 8) : [],
        recommendedActions: Array.isArray(value?.recommendedActions)
            ? value.recommendedActions.map(String).slice(0, 8)
            : Array.isArray(value?.recommended_actions)
                ? value.recommended_actions.map(String).slice(0, 8)
                : [],
        confidence: Math.max(0, Math.min(100, Number(value?.confidence ?? 0))),
        sourceCounts: {
            workflows: context.workflows.length,
            executions: context.executions.length,
            errors: context.errors.length,
            traces: context.traces.length,
            flags: context.flags.length,
            health: context.health.length,
        },
    }
}

function parseInsightJson(content: string): unknown {
    const trimmed = content.trim()
    const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)
    return JSON.parse(fenced?.[1] || trimmed)
}

function selectedModel(model?: string): string {
    const value = model || getGroqModel() || DEFAULT_GROQ_MODEL
    if (!MODEL_ID_PATTERN.test(value)) {
        throw new Error("Invalid Groq model id")
    }
    return value
}

function sanitizeChatHistory(history: Array<{ role: string; content: string }>): Array<{ role: "user" | "assistant"; content: string }> {
    return (history || [])
        .filter((message: any) => ALLOWED_CHAT_ROLES.has(message?.role))
        .map((message: any) => ({
            role: message.role,
            content: String(message.content || "").slice(0, 4096),
        }))
        .slice(-50)
}

export function isServerObservabilityQuestion(message: string): boolean {
    const normalized = String(message || "").toLowerCase().replace(/\s+/g, " ").trim()
    if (!normalized) return false

    return SERVER_QUESTION_TERMS.some((term) => normalized.includes(term))
}

export function outOfScopeFlowwatchResponse(): string {
    return OUT_OF_SCOPE_RESPONSE
}

export async function listGroqModels(): Promise<GroqModelOption[]> {
    const apiKey = getGroqApiKey()

    if (!apiKey) {
        throw new Error("GROQ_API_KEY is not configured")
    }

    const response = await fetch(GROQ_MODELS_URL, {
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
    })

    if (!response.ok) {
        const message = await response.text()
        throw new Error(`Groq model request failed: ${response.status} ${message}`)
    }

    const models = await response.json() as any
    return Array.isArray(models?.data)
        ? models.data
            .map((model: any) => ({
                id: String(model?.id || ""),
                ownedBy: model?.owned_by ? String(model.owned_by) : undefined,
            }))
            .filter((model: GroqModelOption) => model.id)
        : []
}

export async function generateGroqInsight(context: FlowwatchAiInsightContext, model?: string): Promise<FlowwatchAiInsight> {
    const apiKey = getGroqApiKey()

    if (!apiKey) {
        throw new Error("GROQ_API_KEY is not configured")
    }

    const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: selectedModel(model),
            temperature: 0.2,
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: [
                        "You are Flowwatch's backend reliability AI.",
                        "Use only the provided JSON context.",
                        "Do not invent workflow names, trace IDs, errors, metrics, services, or incidents.",
                        "Return valid JSON with these exact keys: summary, likelyCause, impact, evidence, recommendedActions, confidence.",
                        "evidence and recommendedActions must be arrays of strings. confidence must be a number from 0 to 100.",
                    ].join(" "),
                },
                {
                    role: "user",
                    content: JSON.stringify(context),
                },
            ],
        }),
    })

    if (!response.ok) {
        const message = await response.text()
        throw new Error(`Groq insight request failed: ${response.status} ${message}`)
    }

    const completion = await response.json() as any
    const content = completion.choices?.[0]?.message?.content

    if (!content) {
        throw new Error("Groq returned an empty insight response")
    }

    return normalizeInsight(parseInsightJson(content), context)
}

export async function askGroqAi(
    context: FlowwatchAiInsightContext,
    message: string,
    history: Array<{ role: string; content: string }>,
    model?: string
): Promise<string> {
    if (!isServerObservabilityQuestion(message)) {
        return outOfScopeFlowwatchResponse()
    }

    const apiKey = getGroqApiKey()

    if (!apiKey) {
        throw new Error("GROQ_API_KEY is not configured")
    }

    const safeHistory = sanitizeChatHistory(history)

    const messages = [
        {
            role: "system",
            content: [
                "You are Flowwatch's backend reliability AI.",
                "You help developers diagnose errors, traces, feature flags, workflows, and health checks.",
                "Only answer questions about the current server, backend application, Flowwatch data, reliability, observability, or operational debugging.",
                "If the user asks for unrelated general knowledge, personal advice, creative writing, jokes, math homework, trivia, or anything outside this server context, refuse briefly and redirect them to ask about server health, errors, traces, workflows, feature flags, or latency.",
                "Use the provided JSON context of the system which contains recent workflows, executions, errors, traces, feature flags, and health check statuses.",
                "Answer the user's question accurately. Focus on diagnostics, suggestions, and resolving issues.",
                "Keep answers developer-friendly, clear, and actionable. Use markdown formatting for lists, codes, and code snippets.",
            ].join(" "),
        },
        {
            role: "system",
            content: `Here is the current system context: ${JSON.stringify(context)}`,
        },
        ...safeHistory,
        {
            role: "user",
            content: message,
        }
    ]

    const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: selectedModel(model),
            temperature: 0.5,
            messages,
        }),
    })

    if (!response.ok) {
        const msg = await response.text()
        throw new Error(`Groq chat request failed: ${response.status} ${msg}`)
    }

    const completion = await response.json() as any
    const content = completion.choices?.[0]?.message?.content

    if (!content) {
        throw new Error("Groq returned an empty response")
    }

    return content
}

```

---

<a id="packages-flowwatch-src-createflowwatchts"></a>
### [packages/flowwatch/src/createFlowwatch.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/createFlowwatch.ts)

```typescript
import { loadFlowwatchEnv } from "./utils/flowwatchEnvStore.js"
import { createDashboardRouter } from "./dashboard/routes/router.js"
import type { FlowwatchConfig } from "./types/index.js"
import { validateConfig } from "./runtime/config/validationConfig.js"
import { normalizeConfig } from "./runtime/config/normalizeConfig.js"
import { createPostgresPool } from "./persistence/db/postgres.js"
import { createElasticsearchClient } from "./search/elasticsearch/client.js"
import { runMigrations } from "./persistence/migrations/migrationRunner.js"
import { migrations } from "./persistence/migrations/migrations.js"
import { createWorkflowEngine } from "./engine/workflows/workflowEngine.js"
import type { RegisterWorkflow, TriggerWorkflow } from "./engine/workflows/types.js"
import { createWorkflowQueue } from "./engine/background/queues/workflowQueue.js"
import { createWorkflowWorker } from "./engine/background/workers/workflowWorker.js"
import { createFlagEngine } from "./engine/flags/flagEngine.js"
import type { EvaluateFlag } from "./engine/flags/types.js"
import { createRequestTracingMiddleware } from "./runtime/tracing/tracingMiddleware.js"
import { createTraceEngine, type TraceFunction } from "./engine/trace/traceEngine.js"
import { captureError, createErrorHandler, type CaptureErrorFunction } from "./engine/errors/errorEngine.js"
import type { ErrorRequestHandler, RequestHandler, Router } from "express"
import { createMissingMappings } from "./search/elasticsearch/mappingChecker.js"
import { createRedisClient } from "./persistence/cache/redisClient.js"

export interface Flowwatch {
    dashboard: Router
    workflow: RegisterWorkflow
    trigger: TriggerWorkflow
    flag: EvaluateFlag
    requestTracer: RequestHandler
    trace: TraceFunction
    errorHandler: ErrorRequestHandler
    captureError: CaptureErrorFunction
}

export async function createFlowwatch(config: FlowwatchConfig): Promise<Flowwatch> {
    await loadFlowwatchEnv()

    const validConfig = validateConfig(config)
    const normalizedConfig = await normalizeConfig(validConfig)
    const postgresPool = createPostgresPool(normalizedConfig.db)
    if (normalizedConfig.migrations.autoRun) {
        await runMigrations(postgresPool, migrations);
    }
    const redisClient = createRedisClient(normalizedConfig.redis.url)
    const elasticsearchClient = createElasticsearchClient(normalizedConfig.elasticsearch.node)

    // BullMQ requires Redis ≥ 5. Gracefully degrade on older versions.
    let workflowQueue: ReturnType<typeof createWorkflowQueue> | null = null
    try {
        workflowQueue = createWorkflowQueue(normalizedConfig.redis.url)
        // Probe the connection — BullMQ throws synchronously on version check
        await workflowQueue.waitUntilReady()
    } catch (err: any) {
        const reason = err?.message ?? String(err)
        console.warn(`[Flowwatch] ⚠️  Workflow queue unavailable (${reason}). Workflows will be registered but cannot be executed until Redis ≥ 5 is available.`)
        workflowQueue = null
    }

    const traceEngine = createTraceEngine({
        pool: postgresPool,
        elasticsearchClient,
    })
    const workflowEngine = createWorkflowEngine({
        pool: postgresPool,
        workflowQueue,
        traceEngine,
    })
    const requestTracer = createRequestTracingMiddleware(postgresPool)
    const errorEngineOptions = {
        pool: postgresPool,
        elasticsearchClient,
    }
    const errorHandler = createErrorHandler(errorEngineOptions)
    const captureFlowwatchError: CaptureErrorFunction = (error, options) => {
        return captureError(errorEngineOptions, error, options)
    }
    const flagEngine = createFlagEngine(postgresPool, traceEngine, captureFlowwatchError, redisClient)
    await createMissingMappings(elasticsearchClient)

    if (normalizedConfig.worker.enabled && workflowQueue !== null) {
        try {
            createWorkflowWorker({
                redisUrl: normalizedConfig.redis.url,
                pool: postgresPool,
                getWorkflow: workflowEngine.getWorkflow,
                traceEngine,
                captureError: captureFlowwatchError,
            })
        } catch (err: any) {
            console.warn(`[Flowwatch] ⚠️  Workflow worker could not start: ${err?.message}`)
        }
    }

    const dashboard = createDashboardRouter({
        config: normalizedConfig,
        postgresPool,
        redisClient,
        elasticsearchClient,
    })

    return {
        dashboard,
        workflow: workflowEngine.workflow,
        trigger: workflowEngine.trigger,
        flag: flagEngine.flag,
        requestTracer,
        trace: traceEngine.trace,
        errorHandler,
        captureError: captureFlowwatchError,
    }
}
```

---

<a id="packages-flowwatch-src-dashboard-routes-dashboardresponsets"></a>
### [packages/flowwatch/src/dashboard/routes/dashboardResponse.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/dashboard/routes/dashboardResponse.ts)

```typescript
import type { NormalizedFlowwatchConfig } from "../../types/index.js"
import { isGroqApiKeyConfigured, getGroqModel } from "../../utils/flowwatchEnvStore.js"

function asIso(value: unknown): string | null {
    if (!value) {
        return null
    }

    if (value instanceof Date) {
        return value.toISOString()
    }

    return String(value)
}

function durationBetween(start: unknown, end: unknown): number | null {
    if (!start || !end) {
        return null
    }

    const startedAt = new Date(String(start)).getTime()
    const endedAt = new Date(String(end)).getTime()

    if (Number.isNaN(startedAt) || Number.isNaN(endedAt)) {
        return null
    }

    return Math.max(0, endedAt - startedAt)
}

function formatDashboardTime(value: unknown): string {
    const iso = asIso(value)

    if (!iso) {
        return "-"
    }

    return new Date(iso).toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    })
}

function formatDashboardDateTime(value: unknown): string {
    const iso = asIso(value)

    if (!iso) {
        return "-"
    }

    return new Date(iso).toISOString().slice(0, 16).replace("T", " ")
}

function formatDuration(ms: number | null | undefined): string {
    if (ms === null || ms === undefined) {
        return "-"
    }

    if (ms < 1000) {
        return `${ms}ms`
    }

    return `${(ms / 1000).toFixed(ms >= 10000 ? 0 : 1)}s`
}

function dashboardStatus(status: string | null | undefined): string {
    if (status === "ok") {
        return "completed"
    }

    if (status === "error") {
        return "failed"
    }

    return status || "unknown"
}

export function serializeFlag(flag: any, ruleCount = 0) {
    return {
        id: flag.id,
        key: flag.key,
        description: flag.description,
        enabled: flag.enabled,
        rollout: flag.rollout_percentage,
        rolloutPercentage: flag.rollout_percentage,
        rules: ruleCount,
        changedBy: flag.changed_by ?? "dashboard",
        createdAt: asIso(flag.created_at),
        updatedAt: asIso(flag.updated_at),
    }
}

export function serializeRule(rule: any) {
    return {
        id: rule.id,
        flagId: rule.flag_id,
        attribute: rule.attribute,
        operator: rule.operator,
        value: rule.value,
        enabled: rule.enabled,
        createdAt: asIso(rule.created_at),
        updatedAt: asIso(rule.updated_at),
    }
}

export function serializeAuditLog(log: any) {
    return {
        id: log.id,
        flagId: log.flag_id,
        action: log.action,
        before: log.before,
        after: log.after,
        changedBy: log.changed_by,
        createdAt: asIso(log.created_at),
    }
}

export function serializeError(error: any) {
    return {
        id: error.id,
        message: error.message,
        name: error.name || "Error",
        category: error.category,
        level: error.level,
        source: error.source,
        status: error.status_code,
        statusCode: error.status_code,
        trace: error.trace_id || "-",
        traceId: error.trace_id,
        spanId: error.span_id,
        fingerprint: error.fingerprint,
        metadata: error.metadata,
        stack: error.stack,
        occurred: formatDashboardTime(error.occurred_at),
        occurredAt: asIso(error.occurred_at),
        createdAt: asIso(error.created_at),
    }
}

export function serializeTrace(trace: any, spans: any[] = []) {
    return {
        id: trace.id,
        method: trace.method,
        path: trace.path,
        status: trace.status_code,
        statusCode: trace.status_code,
        ip: trace.ip,
        duration: trace.duration_ms ?? durationBetween(trace.started_at, trace.ended_at),
        durationMs: trace.duration_ms ?? durationBetween(trace.started_at, trace.ended_at),
        userId: trace.user_id,
        userAgent: trace.user_agent,
        metadata: trace.metadata,
        startedAt: asIso(trace.started_at),
        endedAt: asIso(trace.ended_at),
        createdAt: asIso(trace.created_at),
        spans: spans.map((span) => ({
            id: span.id,
            traceId: span.trace_id,
            parentSpanId: span.parent_span_id,
            name: span.name,
            type: span.type,
            status: dashboardStatus(span.status),
            duration: span.duration_ms ?? durationBetween(span.started_at, span.ended_at),
            durationMs: span.duration_ms ?? durationBetween(span.started_at, span.ended_at),
            metadata: span.metadata,
            startedAt: asIso(span.started_at),
            endedAt: asIso(span.ended_at),
        })),
    }
}

export function serializeExecution(execution: any, steps: any[] = []) {
    const failedStep = steps.find((step) => step.status === "failed")
    const startedAt = execution.started_at || execution.created_at
    const finishedAt = execution.completed_at || execution.failed_at
    const durationMs = durationBetween(startedAt, finishedAt)

    return {
        id: execution.id,
        workflowId: execution.workflow_id,
        workflow: execution.workflow_name,
        workflowName: execution.workflow_name,
        workflowVersion: execution.workflow_version,
        status: execution.status,
        input: execution.input,
        output: execution.output,
        error: execution.error,
        started: formatDashboardTime(startedAt),
        finished: formatDashboardTime(finishedAt),
        failedStep: failedStep?.step_name || "-",
        attempts: steps.reduce((total, step) => total + Number(step.attempt_count || 0), 0),
        duration: formatDuration(durationMs),
        createdAt: asIso(execution.created_at),
        startedAt: asIso(execution.started_at),
        completedAt: asIso(execution.completed_at),
        failedAt: asIso(execution.failed_at),
        durationMs,
        steps: steps.map((step) => ({
            id: step.id,
            executionId: step.execution_id,
            workflowStepId: step.workflow_step_id,
            stepIndex: step.step_index,
            stepName: step.step_name,
            name: step.step_name,
            status: step.status,
            input: step.input,
            output: step.output,
            error: step.error,
            attempts: step.attempt_count,
            attemptCount: step.attempt_count,
            maxRetries: step.max_retries,
            startedAt: asIso(step.started_at),
            completedAt: asIso(step.completed_at),
            failedAt: asIso(step.failed_at),
            nextRetryAt: asIso(step.next_retry_at),
            durationMs: durationBetween(step.started_at, step.completed_at || step.failed_at),
            duration: formatDuration(durationBetween(step.started_at, step.completed_at || step.failed_at)),
        })),
    }
}

export function serializeSettings(config: NormalizedFlowwatchConfig) {
    return {
        serviceName: config.runtime.serviceName,
        environment: config.runtime.environment,
        dashboard: {
            path: config.dashboard.path,
            enabled: config.dashboard.enabled,
            authEnabled: Boolean(config.dashboard.auth || config.dashboard.token),
        },
        worker: {
            ...config.worker,
            concurrency: config.worker.workflowConcurrency,
        },
        migrations: config.migrations,
        ai: {
            groqApiKeyConfigured: isGroqApiKeyConfigured(),
            groqModel: getGroqModel() || "llama-3.3-70b-versatile",
        },
    }
}

export function serializeWorkflowSummary(workflow: any, executions: any[], definitionSteps: any[], latestExecution?: any, latestExecutionSteps: any[] = []) {
    const workflowExecutions = executions.filter((e) => e.workflow_name === workflow.name)
    const completed = workflowExecutions.filter((e) => e.status === "completed").length
    const failed = workflowExecutions.filter((e) => e.status === "failed").length
    const running = workflowExecutions.filter((e) => e.status === "running").length

    return {
        id: workflow.id,
        name: workflow.name,
        version: workflow.version,
        steps: definitionSteps.length,
        created: formatDashboardDateTime(workflow.created_at),
        createdAt: asIso(workflow.created_at),
        updatedAt: asIso(workflow.updated_at),
        lastStatus: latestExecution?.status || "never run",
        totalRuns: workflowExecutions.length,
        completedRuns: completed,
        failedRuns: failed,
        runningRuns: running,
        failures: failed,
        pinned: false,
        chain: definitionSteps.map((step) => step.name),
        latestExecution: latestExecution ? serializeExecution(latestExecution, latestExecutionSteps) : undefined,
    }
}

export function latestByWorkflow(executions: any[]): Map<string, any> {
    const latest = new Map<string, any>()

    for (const execution of executions) {
        if (!latest.has(execution.workflow_name)) {
            latest.set(execution.workflow_name, execution)
        }
    }

    return latest
}
```

---

<a id="packages-flowwatch-src-dashboard-routes-routerts"></a>
### [packages/flowwatch/src/dashboard/routes/router.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/dashboard/routes/router.ts)

```typescript
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
```

---

<a id="packages-flowwatch-src-dashboard-static-dashboardhtml"></a>
### [packages/flowwatch/src/dashboard/static/dashboard.html](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/dashboard/static/dashboard.html)

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Flowwatch Dashboard</title>
    <style>
        :root {
            --bg: #080b10;
            --panel: #10151d;
            --panel-2: #161d28;
            --panel-3: #202938;
            --line: #2b3748;
            --line-soft: #1d2633;
            --text: #eef2f7;
            --muted: #9aa7ba;
            --subtle: #68778c;
            --blue: #4f8cff;
            --green: #22c55e;
            --amber: #f59e0b;
            --red: #ef4444;
            --cyan: #22d3ee;
            --shadow: 0 18px 46px rgba(0, 0, 0, 0.24);
            --shadow-soft: 0 10px 28px rgba(0, 0, 0, 0.18);
            color-scheme: dark;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            min-height: 100vh;
            background:
                radial-gradient(circle at 18% 0%, rgba(79, 140, 255, 0.08), transparent 32%),
                radial-gradient(circle at 100% 18%, rgba(34, 211, 238, 0.045), transparent 28%),
                var(--bg);
            color: var(--text);
            overflow: hidden;
        }

        @keyframes flowPacket {
            0% {
                left: -3px;
                opacity: 0;
                transform: scale(0.72);
            }

            12%,
            78% {
                opacity: 1;
            }

            100% {
                left: calc(100% - 3px);
                opacity: 0;
                transform: scale(1);
            }
        }

        @keyframes nodeGlow {

            0%,
            100% {
                box-shadow: 0 0 0 rgba(34, 197, 94, 0);
            }

            50% {
                box-shadow: 0 0 22px rgba(34, 197, 94, 0.18);
            }
        }

        @keyframes failurePulse {

            0%,
            100% {
                box-shadow: 0 0 0 rgba(239, 68, 68, 0);
            }

            50% {
                box-shadow: 0 0 24px rgba(239, 68, 68, 0.26);
            }
        }

        @keyframes softPulse {
            0%,
            100% {
                opacity: 0.78;
                box-shadow: 0 0 0 rgba(79, 140, 255, 0);
            }

            50% {
                opacity: 1;
                box-shadow: 0 0 18px rgba(79, 140, 255, 0.14);
            }
        }

        button,
        input,
        select,
        textarea {
            font: inherit;
        }

        button {
            cursor: pointer;
        }

        .app {
            display: grid;
            grid-template-columns: 76px minmax(0, 1fr);
            height: 100vh;
            transition: grid-template-columns 220ms cubic-bezier(0.2, 0, 0, 1);
        }

        .app:has(.sidebar:hover),
        .app:has(.sidebar:focus-within) {
            grid-template-columns: 244px minmax(0, 1fr);
        }

        .sidebar {
            width: 100%;
            background:
                linear-gradient(180deg, rgba(255, 255, 255, 0.025), transparent 18%),
                #0b1017;
            border-right: 1px solid var(--line-soft);
            display: flex;
            flex-direction: column;
            min-width: 0;
            overflow: hidden;
            transition: box-shadow 220ms ease;
            z-index: 25;
        }

        .sidebar:hover,
        .sidebar:focus-within {
            box-shadow: 18px 0 46px rgba(0, 0, 0, 0.32);
        }

        .brand {
            height: 58px;
            display: flex;
            align-items: center;
            gap: 12px;
            justify-content: center;
            padding: 0;
            border-bottom: 1px solid var(--line-soft);
            position: relative;
        }

        .sidebar:hover .brand,
        .sidebar:focus-within .brand {
            justify-content: flex-start;
            padding: 0 19px;
        }

        .brand-copy,
        .nav-label,
        .sidebar-footer {
            visibility: hidden;
            opacity: 0;
            transform: translateX(-6px);
            pointer-events: none;
            transition: opacity 130ms ease 70ms, transform 130ms ease 70ms, visibility 0s linear 220ms;
        }

        .sidebar:hover .brand-copy,
        .sidebar:hover .nav-label,
        .sidebar:hover .sidebar-footer,
        .sidebar:focus-within .brand-copy,
        .sidebar:focus-within .nav-label,
        .sidebar:focus-within .sidebar-footer {
            visibility: visible;
            opacity: 1;
            transform: translateX(0);
            pointer-events: auto;
            transition-delay: 90ms, 90ms, 0s;
        }

        .brand-copy {
            position: absolute;
            left: 63px;
            top: 14px;
        }

        .brand-mark {
            width: 32px;
            height: 32px;
            flex: 0 0 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            align-self: center;
            margin-top: 1px;
        }

        .brand-mark img {
            width: 32px;
            height: 32px;
            object-fit: contain;
        }

        .brand-title {
            font-size: 15px;
            font-weight: 750;
            line-height: 1;
        }

        .brand-subtitle {
            margin-top: 4px;
            color: var(--subtle);
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 11px;
            white-space: nowrap;
        }

        .nav {
            padding: 12px 0;
            display: grid;
            gap: 4px;
            overflow: hidden;
            align-content: start;
        }

        .nav-button {
            width: 100%;
            border: 1px solid transparent;
            background: transparent;
            color: var(--muted);
            display: grid;
            grid-template-columns: 76px minmax(0, 1fr);
            align-items: center;
            gap: 0;
            padding: 9px 0;
            border-radius: 8px;
            font-size: 13px;
            text-align: left;
            white-space: nowrap;
            position: relative;
            transition: color 140ms ease, background 140ms ease, border-color 140ms ease;
        }

        .nav-button::before {
            content: "";
            position: absolute;
            left: 0;
            top: 8px;
            bottom: 8px;
            width: 3px;
            border-radius: 0 999px 999px 0;
            background: transparent;
        }

        .nav-button:hover {
            color: var(--text);
            background: #131922;
            border-color: var(--line-soft);
        }

        .nav-button.active {
            color: #dbeafe;
            background: rgba(79, 140, 255, 0.14);
            border-color: rgba(79, 140, 255, 0.36);
        }

        .nav-button.active::before {
            background: var(--blue);
        }

        .nav-icon {
            width: 24px;
            height: 24px;
            border-radius: 6px;
            display: grid;
            place-items: center;
            background: #151b24;
            color: currentColor;
            justify-self: center;
        }

        .nav-icon svg {
            width: 15px;
            height: 15px;
            stroke: currentColor;
            stroke-width: 1.8;
            fill: none;
            stroke-linecap: round;
            stroke-linejoin: round;
        }

        .sidebar-footer {
            margin-top: auto;
            padding: 14px;
            border-top: 1px solid var(--line-soft);
            display: grid;
            gap: 10px;
            font-size: 12px;
            color: var(--muted);
        }

        .health-line {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            align-items: center;
        }

        .main {
            min-width: 0;
            min-height: 0;
            display: flex;
            flex-direction: column;
            background:
                linear-gradient(180deg, rgba(79, 140, 255, 0.04), transparent 260px),
                var(--bg);
        }

        .topbar {
            height: 58px;
            border-bottom: 1px solid var(--line-soft);
            background: rgba(9, 13, 19, 0.86);
            backdrop-filter: blur(14px);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            gap: 16px;
        }

        .topbar-left,
        .topbar-right {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
        }

        .service-name {
            font-weight: 700;
            font-size: 14px;
            white-space: nowrap;
        }

        .search {
            width: min(360px, 36vw);
            height: 34px;
            border-radius: 8px;
            border: 1px solid var(--line);
            background: #0b0f15;
            color: var(--text);
            padding: 0 11px;
            outline: none;
            font-size: 13px;
        }

        .search:focus {
            border-color: rgba(79, 140, 255, 0.72);
            box-shadow: 0 0 0 3px rgba(79, 140, 255, 0.12);
        }

        .global-search {
            position: relative;
            width: min(470px, 42vw);
        }

        .global-search .search {
            width: 100%;
            height: 38px;
            padding-left: 34px;
            padding-right: 70px;
            background:
                linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent),
                #090d13;
            border-color: #303948;
        }

        .search-icon {
            position: absolute;
            left: 11px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--subtle);
            font-size: 13px;
            font-weight: 900;
            pointer-events: none;
        }

        .search-kbd {
            position: absolute;
            right: 9px;
            top: 50%;
            transform: translateY(-50%);
            border: 1px solid var(--line);
            background: #111722;
            color: var(--subtle);
            border-radius: 4px;
            padding: 2px 6px;
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 10px;
            pointer-events: none;
        }

        .search-results {
            position: absolute;
            z-index: 50;
            left: 0;
            right: 0;
            top: calc(100% + 8px);
            display: none;
            background: #0d1117;
            border: 1px solid var(--line);
            border-radius: 10px;
            box-shadow: 0 24px 70px rgba(0, 0, 0, 0.46);
            overflow: hidden;
        }

        .global-search.open .search-results {
            display: block;
        }

        .search-result {
            display: grid;
            grid-template-columns: 82px minmax(0, 1fr) auto;
            gap: 10px;
            align-items: center;
            padding: 10px 12px;
            border-bottom: 1px solid var(--line-soft);
            cursor: pointer;
        }

        .search-result:last-child {
            border-bottom: 0;
        }

        .search-result:hover {
            background: rgba(79, 140, 255, 0.08);
        }

        .result-type {
            color: var(--subtle);
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 10px;
            text-transform: uppercase;
        }

        .result-title {
            color: var(--text);
            font-size: 12px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .select,
        .button,
        .icon-button {
            height: 36px;
            border-radius: 9px;
            border: 1px solid #303948;
            background:
                linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.01)),
                #0b0f15;
            color: var(--text);
            padding: 0 10px;
            font-size: 12px;
            transition: border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;
        }

        .select {
            appearance: none;
            padding-right: 34px;
            background-image:
                linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.01)),
                url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1.5 1.75 6 6.25l4.5-4.5' stroke='%238d98a8' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E");
            background-repeat: repeat, no-repeat;
            background-position: 0 0, right 11px center;
        }

        .button:hover,
        .icon-button:hover,
        .select:hover {
            border-color: #455164;
            background-color: #101722;
            box-shadow: 0 0 0 3px rgba(79, 140, 255, 0.08);
        }

        .button:active,
        .icon-button:active,
        .ask-ai-send-button:active {
            transform: translateY(1px);
        }

        .button:focus-visible,
        .icon-button:focus-visible,
        .select:focus-visible,
        .search:focus-visible {
            outline: 0;
            border-color: rgba(79, 140, 255, 0.78);
            box-shadow: 0 0 0 3px rgba(79, 140, 255, 0.16);
        }

        .button.primary {
            background:
                linear-gradient(180deg, rgba(255, 255, 255, 0.18), transparent),
                var(--blue);
            border-color: var(--blue);
            color: #fff;
            font-weight: 700;
            box-shadow: 0 10px 24px rgba(79, 140, 255, 0.2);
        }

        .icon-button {
            width: 34px;
            padding: 0;
            display: grid;
            place-items: center;
            font-weight: 800;
        }

        .icon-button svg {
            width: 15px;
            height: 15px;
            stroke: currentColor;
            stroke-width: 2;
            fill: none;
            stroke-linecap: round;
            stroke-linejoin: round;
        }

        .content {
            padding: 18px;
            flex: 1;
            min-height: 0;
            height: calc(100vh - 58px);
            overflow-y: auto;
            overflow-x: hidden;
            scrollbar-width: thin;
            scrollbar-color: #344054 #0a0e14;
        }

        .content::-webkit-scrollbar,
        .drawer-body::-webkit-scrollbar {
            width: 9px;
        }

        .content::-webkit-scrollbar-track,
        .drawer-body::-webkit-scrollbar-track {
            background: #0a0e14;
        }

        .content::-webkit-scrollbar-thumb,
        .drawer-body::-webkit-scrollbar-thumb {
            background: #344054;
            border-radius: 999px;
        }

        .page {
            display: none;
            max-width: 1480px;
            margin: 0 auto;
            min-height: calc(100vh - 94px);
            padding-bottom: 56px;
            animation: appear 140ms ease-out;
        }

        .page.active {
            display: block;
        }

        @keyframes appear {
            from {
                opacity: 0;
                transform: translateY(4px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .page-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 18px;
            margin-bottom: 16px;
        }

        .page-title {
            margin: 0;
            font-size: 20px;
            line-height: 1.2;
            letter-spacing: 0;
        }

        .page-meta {
            margin-top: 6px;
            color: var(--muted);
            font-size: 13px;
        }

        .metrics {
            display: grid;
            grid-template-columns: repeat(6, minmax(0, 1fr));
            gap: 10px;
            margin-bottom: 16px;
        }

        .metric {
            background:
                linear-gradient(180deg, rgba(255, 255, 255, 0.026), transparent),
                var(--panel);
            border: 1px solid var(--line-soft);
            border-radius: 8px;
            padding: 13px;
            min-height: 86px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-shadow: var(--shadow-soft);
            transition: transform 140ms ease, border-color 140ms ease;
        }

        .metric:hover {
            transform: translateY(-1px);
            border-color: rgba(79, 140, 255, 0.32);
        }

        .metric-label {
            color: var(--subtle);
            font-size: 11px;
            text-transform: uppercase;
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
        }

        .metric-value {
            font-size: 26px;
            font-weight: 760;
            letter-spacing: 0;
        }

        .grid-2 {
            display: grid;
            grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.55fr);
            gap: 14px;
        }

        .grid-even {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
        }

        .panel {
            background:
                linear-gradient(180deg, rgba(255, 255, 255, 0.018), transparent),
                rgba(16, 21, 29, 0.97);
            border: 1px solid var(--line-soft);
            border-radius: 8px;
            overflow: hidden;
            box-shadow: var(--shadow);
            transition: border-color 140ms ease, box-shadow 140ms ease;
        }

        .panel:hover {
            border-color: rgba(79, 140, 255, 0.24);
        }

        .panel-header {
            min-height: 46px;
            padding: 12px 14px;
            border-bottom: 1px solid var(--line-soft);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            background: rgba(22, 29, 40, 0.82);
        }

        .panel-title {
            font-size: 13px;
            font-weight: 760;
        }

        .panel-tools {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .ops-strip {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 10px;
            margin-bottom: 14px;
        }

        .ops-item {
            border: 1px solid var(--line-soft);
            background:
                linear-gradient(180deg, rgba(255, 255, 255, 0.025), transparent),
                #0d1219;
            border-radius: 8px;
            padding: 11px 12px;
            min-width: 0;
        }

        .ops-label {
            color: var(--subtle);
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 10px;
            text-transform: uppercase;
            margin-bottom: 7px;
        }

        .ops-value {
            color: var(--text);
            font-size: 13px;
            font-weight: 720;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }

        .overview-summary {
            display: grid;
            grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr);
            gap: 14px;
            margin-bottom: 16px;
        }

        .summary-primary,
        .summary-side {
            border: 1px solid var(--line-soft);
            border-radius: 8px;
            background:
                linear-gradient(135deg, rgba(239, 68, 68, 0.1), transparent 38%),
                linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent),
                #0d1219;
            padding: 16px;
            min-width: 0;
        }

        .summary-kicker {
            color: #fca5a5;
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 10px;
            font-weight: 760;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            margin-bottom: 8px;
        }

        .summary-title {
            margin: 0;
            font-size: 22px;
            line-height: 1.2;
            letter-spacing: 0;
        }

        .summary-copy {
            margin: 8px 0 0;
            color: var(--muted);
            font-size: 13px;
            line-height: 1.5;
            max-width: 720px;
        }

        .summary-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 14px;
        }

        .summary-side {
            display: grid;
            gap: 10px;
            background:
                linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent),
                #0d1219;
        }

        .summary-stat {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            border-bottom: 1px solid var(--line-soft);
            padding-bottom: 10px;
        }

        .summary-stat:last-child {
            border-bottom: 0;
            padding-bottom: 0;
        }

        .summary-stat span {
            color: var(--subtle);
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 10px;
            text-transform: uppercase;
        }

        .summary-stat strong {
            font-size: 13px;
            text-align: right;
        }

        .metric-delta {
            color: var(--subtle);
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 10px;
            margin-top: 5px;
        }

        .table-wrap {
            overflow: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            min-width: 760px;
            font-size: 12px;
        }

        th {
            color: var(--subtle);
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0;
            background: #151a22;
            border-bottom: 1px solid var(--line-soft);
            text-align: left;
            padding: 10px 12px;
            white-space: nowrap;
            position: sticky;
            top: 0;
            z-index: 1;
            background: #10151d;
        }

        td {
            padding: 11px 12px;
            border-bottom: 1px solid rgba(39, 48, 61, 0.58);
            color: #d8dee8;
            white-space: nowrap;
        }

        tbody tr {
            transition: background 120ms ease, box-shadow 120ms ease;
        }

        tbody tr:hover {
            background: rgba(79, 140, 255, 0.06);
        }

        .badge.is-live .dot {
            animation: softPulse 1.8s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
                animation-duration: 0.001ms !important;
                animation-iteration-count: 1 !important;
                scroll-behavior: auto !important;
                transition-duration: 0.001ms !important;
            }
        }

        .mono {
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
        }

        .muted {
            color: var(--muted);
        }

        .subtle {
            color: var(--subtle);
        }

        .right {
            text-align: right;
        }

        .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            height: 18px;
            border-radius: 5px;
            padding: 0 6px;
            font-size: 10px;
            font-weight: 600;
            border: 1px solid transparent;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            line-height: 1;
        }

        .dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: currentColor;
        }

        .ok {
            color: #4ade80;
            background: rgba(74, 222, 128, 0.08);
            border-color: rgba(74, 222, 128, 0.2);
        }

        .warn {
            color: #fbbf24;
            background: rgba(251, 191, 36, 0.08);
            border-color: rgba(251, 191, 36, 0.2);
        }

        .bad {
            color: #f87171;
            background: rgba(248, 113, 113, 0.08);
            border-color: rgba(248, 113, 113, 0.2);
        }

        .info {
            color: #60a5fa;
            background: rgba(96, 165, 250, 0.08);
            border-color: rgba(96, 165, 250, 0.2);
        }

        .cyan {
            color: #22d3ee;
            background: rgba(34, 211, 238, 0.08);
            border-color: rgba(34, 211, 238, 0.2);
        }

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 36px 20px;
            background: rgba(17, 21, 27, 0.4);
            border: 1px dashed var(--line);
            border-radius: 8px;
            margin: 12px 0;
            width: 100%;
        }

        .empty-title {
            font-size: 13px;
            font-weight: 600;
            color: var(--text);
            margin-bottom: 4px;
        }

        .empty-copy {
            font-size: 11px;
            color: var(--muted);
            max-width: 460px;
            line-height: 1.5;
        }

        .stack {
            display: grid;
            gap: 14px;
        }

        .health-list {
            display: grid;
            gap: 8px;
            padding: 12px;
            grid-template-rows: repeat(auto-fit, minmax(96px, max-content));
            align-content: start;
        }

        .health-row {
            border: 1px solid var(--line-soft);
            background: #0d1219;
            border-radius: 8px;
            padding: 11px;
            display: grid;
            gap: 8px;
            min-height: 96px;
        }

        .health-list.dynamic-fill {
            height: 100%;
            grid-template-rows: repeat(auto-fit, minmax(102px, 1fr));
        }

        .health-list.dynamic-fill .health-row {
            min-height: 0;
            align-content: center;
        }

        .health-list.dynamic-fill.is-compact {
            grid-template-rows: none;
            align-content: start;
            overflow-y: auto;
            max-height: min(560px, calc(100vh - 260px));
        }

        .health-list.dynamic-fill.is-compact .health-row {
            min-height: 96px;
            align-content: start;
        }

        .health-panel {
            display: flex;
            flex-direction: column;
            min-height: 0;
        }

        .health-panel .health-list {
            flex: 1;
        }

        .health-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }

        .health-name {
            font-size: 13px;
            font-weight: 760;
        }

        .bar {
            height: 7px;
            border-radius: 999px;
            background: #202734;
            overflow: hidden;
        }

        .bar-fill {
            height: 100%;
            border-radius: inherit;
            background: var(--blue);
        }

        .filters {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 12px;
        }

        .detail-layout {
            display: grid;
            grid-template-columns: minmax(0, 0.62fr) minmax(360px, 0.38fr);
            gap: 14px;
        }

        .timeline {
            padding: 14px;
            display: grid;
            gap: 0;
        }

        .timeline-item {
            display: grid;
            grid-template-columns: 32px minmax(0, 1fr);
            gap: 12px;
        }

        .timeline-rail {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .timeline-node {
            width: 26px;
            height: 26px;
            border-radius: 50%;
            border: 1px solid currentColor;
            display: grid;
            place-items: center;
            font-size: 11px;
            font-weight: 900;
        }

        button.timeline-node {
            background: transparent;
            padding: 0;
            cursor: pointer;
        }

        button.timeline-node.bad {
            box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
        }

        .timeline-line {
            width: 1px;
            min-height: 44px;
            background: var(--line);
        }

        .timeline-content {
            padding-bottom: 15px;
        }

        .timeline-title {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            font-size: 13px;
            font-weight: 760;
        }

        .timeline-desc {
            margin-top: 5px;
            color: var(--muted);
            font-size: 12px;
            line-height: 1.5;
        }

        .timeline-error-action {
            margin-top: 8px;
            border: 1px solid rgba(239, 68, 68, 0.36);
            border-radius: 8px;
            background: rgba(239, 68, 68, 0.08);
            color: #fecaca;
            padding: 8px 10px;
            font-size: 11px;
            font-weight: 760;
            text-align: left;
        }

        .timeline-error-action:hover {
            border-color: rgba(239, 68, 68, 0.58);
            background: rgba(239, 68, 68, 0.12);
        }

        .workflow-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
            margin-bottom: 14px;
        }

        .pinned-workflows {
            margin-bottom: 14px;
            border: 1px solid var(--line-soft);
            border-radius: 8px;
            overflow: hidden;
            background: rgba(17, 21, 27, 0.72);
        }

        .pinned-workflows .panel-header {
            border-bottom: 1px solid var(--line-soft);
        }

        .pinned-workflows .workflow-grid {
            padding: 14px;
            margin-bottom: 0;
        }

        .pin-button {
            min-width: 76px;
            height: 28px;
            border-radius: 7px;
            border: 1px solid var(--line);
            background: #0b0f15;
            color: var(--muted);
            font-size: 11px;
            font-weight: 700;
        }

        .pin-button.active {
            color: #bfdbfe;
            background: rgba(79, 140, 255, 0.14);
            border-color: rgba(79, 140, 255, 0.36);
        }

        .workflow-card {
            background: rgba(17, 21, 27, 0.96);
            border: 1px solid var(--line-soft);
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 16px 34px rgba(0, 0, 0, 0.18);
            transition: border-color 160ms ease, transform 160ms ease;
        }

        .workflow-card:hover {
            border-color: #344054;
            transform: translateY(-1px);
        }

        .workflow-card-head {
            padding: 12px 14px;
            border-bottom: 1px solid var(--line-soft);
            background: rgba(23, 28, 36, 0.72);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }

        .workflow-card-title {
            font-size: 14px;
            font-weight: 760;
        }

        .workflow-chain {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 14px;
            overflow-x: auto;
            min-height: 92px;
            background:
                linear-gradient(rgba(39, 48, 61, 0.22) 1px, transparent 1px),
                linear-gradient(90deg, rgba(39, 48, 61, 0.22) 1px, transparent 1px),
                #0a0e14;
            background-size: 24px 24px;
        }

        .workflow-chain::-webkit-scrollbar,
        .trace-board::-webkit-scrollbar {
            height: 8px;
        }

        .workflow-chain::-webkit-scrollbar-track,
        .trace-board::-webkit-scrollbar-track {
            background: #0a0e14;
        }

        .workflow-chain::-webkit-scrollbar-thumb,
        .trace-board::-webkit-scrollbar-thumb {
            background: #344054;
            border-radius: 999px;
        }

        .workflow-step {
            flex: 0 0 152px;
            min-height: 58px;
            border: 1px solid #344054;
            background: #101720;
            border-radius: 8px;
            padding: 10px;
        }

        .workflow-step.live {
            border-color: rgba(34, 197, 94, 0.52);
            background: #0d1914;
            animation: nodeGlow 2.8s ease-in-out infinite;
        }

        .workflow-step.failed {
            border-color: rgba(239, 68, 68, 0.75);
            background: #1b1115;
            animation: failurePulse 2.2s ease-in-out infinite;
        }

        .workflow-step.running {
            border-color: rgba(245, 158, 11, 0.7);
            background: #1a1510;
        }

        .workflow-step-name {
            font-size: 12px;
            font-weight: 720;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .workflow-step-meta {
            margin-top: 6px;
            color: var(--subtle);
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 10px;
        }

        .chain-arrow {
            flex: 0 0 24px;
            height: 1px;
            background: #3b4658;
            position: relative;
        }

        .chain-arrow.live {
            background: rgba(34, 197, 94, 0.46);
        }

        .chain-arrow.running {
            background: rgba(245, 158, 11, 0.72);
        }

        .chain-arrow.failed {
            background: rgba(239, 68, 68, 0.72);
        }

        .chain-arrow.live::before,
        .chain-arrow.running::before,
        .chain-arrow.failed::before {
            content: "";
            position: absolute;
            top: -3px;
            left: -3px;
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--green);
            box-shadow: 0 0 12px rgba(34, 197, 94, 0.85);
            animation: flowPacket 1.65s linear infinite;
        }

        .chain-arrow.running::before {
            background: var(--amber);
            box-shadow: 0 0 12px rgba(245, 158, 11, 0.9);
        }

        .chain-arrow.failed::before {
            background: var(--red);
            box-shadow: 0 0 12px rgba(239, 68, 68, 0.9);
            animation-duration: 1.05s;
        }

        .chain-arrow::after {
            content: "";
            position: absolute;
            right: -1px;
            top: -4px;
            border-left: 7px solid #3b4658;
            border-top: 4px solid transparent;
            border-bottom: 4px solid transparent;
        }

        .chain-arrow.live::after {
            border-left-color: rgba(34, 197, 94, 0.72);
        }

        .chain-arrow.running::after {
            border-left-color: rgba(245, 158, 11, 0.86);
        }

        .chain-arrow.failed::after {
            border-left-color: rgba(239, 68, 68, 0.86);
        }

        .trace-board {
            position: relative;
            height: 360px;
            padding: 16px;
            background:
                linear-gradient(rgba(39, 48, 61, 0.32) 1px, transparent 1px),
                linear-gradient(90deg, rgba(39, 48, 61, 0.32) 1px, transparent 1px),
                radial-gradient(circle at 20% 20%, rgba(79, 140, 255, 0.11), transparent 30%),
                #0a0e14;
            background-size: 28px 28px, 28px 28px, auto, auto;
            overflow-x: auto;
            overflow-y: hidden;
        }

        tr.selected-row td {
            background: rgba(99, 102, 241, 0.12) !important;
            border-top: 1px solid rgba(99, 102, 241, 0.3);
            border-bottom: 1px solid rgba(99, 102, 241, 0.3);
        }

        .trace-request-card {
            position: absolute;
            left: 14px;
            bottom: 12px;
            max-width: 330px;
            border: 1px solid var(--line-soft);
            border-radius: 9px;
            background: rgba(7, 10, 15, 0.9);
            box-shadow: 0 16px 32px rgba(0, 0, 0, 0.28);
            padding: 9px 11px;
            pointer-events: none;
        }

        .trace-request-title {
            color: var(--text);
            font-size: 12px;
            font-weight: 780;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .trace-request-meta {
            margin-top: 4px;
            color: var(--subtle);
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 10px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .trace-scroll-note {
            position: absolute;
            right: 14px;
            bottom: 10px;
            color: var(--subtle);
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 10px;
            background: rgba(10, 14, 20, 0.82);
            border: 1px solid var(--line-soft);
            border-radius: 999px;
            padding: 4px 8px;
            pointer-events: none;
        }

        .trace-svg {
            width: 1180px;
            height: 310px;
            min-width: 1180px;
        }

        .trace-edge {
            stroke: #3b4658;
            stroke-width: 2;
            fill: none;
        }

        .trace-edge.hot {
            stroke: var(--red);
            stroke-dasharray: 7 5;
        }

        .trace-edge.success {
            stroke: rgba(34, 197, 94, 0.72);
        }

        .trace-edge.running {
            stroke: rgba(245, 158, 11, 0.82);
        }

        .trace-edge.branch {
            stroke: #475569;
            stroke-dasharray: 5 5;
        }

        .trace-packet {
            r: 4;
            fill: var(--green);
            filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.9));
        }

        .trace-packet.hot {
            fill: var(--red);
            filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.95));
        }

        .trace-packet.running {
            fill: var(--amber);
            filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.95));
        }

        .trace-node rect {
            fill: #101720;
            stroke: #344054;
            stroke-width: 1.2;
            rx: 9;
        }

        .trace-node.active rect {
            stroke: rgba(79, 140, 255, 0.92);
            fill: #111c2d;
        }

        .trace-node.failed rect {
            stroke: rgba(239, 68, 68, 0.82);
            fill: #1b1115;
        }

        .trace-node.success rect {
            stroke: rgba(34, 197, 94, 0.58);
            fill: #0d1914;
        }

        .trace-node.running rect {
            stroke: rgba(245, 158, 11, 0.78);
            fill: #1a1510;
        }

        .trace-node.warning rect {
            stroke: rgba(79, 140, 255, 0.62);
            fill: #111827;
        }

        .trace-node text {
            fill: #e5edf8;
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 11px;
            font-weight: 700;
            text-anchor: middle;
            dominant-baseline: middle;
        }

        .trace-node text.trace-node-name {
            font-size: 11px;
            font-weight: 760;
            fill: #e5edf8;
        }

        .trace-node text.trace-node-sub {
            font-size: 10px;
            font-weight: 400;
            fill: #7f8da1;
        }

        .trace-lane-label {
            fill: #7f8da1;
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 10px;
            text-transform: uppercase;
        }

        .trace-caption {
            fill: #cbd5e1;
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 10px;
        }

        .trace-inspector {
            padding: 14px;
            display: grid;
            gap: 10px;
        }

        .span-list {
            display: grid;
            gap: 8px;
        }

        .span-row {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            align-items: center;
            gap: 10px;
            border: 1px solid var(--line-soft);
            background: #0a0f16;
            border-radius: 8px;
            padding: 9px 10px;
        }

        .span-name {
            font-size: 12px;
            font-weight: 720;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }

        .span-type {
            margin-top: 4px;
            color: var(--subtle);
            font-size: 10px;
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
        }

        .code-box {
            margin-top: 10px;
            border: 1px solid var(--line-soft);
            background: #080b10;
            border-radius: 8px;
            padding: 10px;
            color: #c7d2fe;
            font-size: 11px;
            line-height: 1.55;
            overflow: auto;
            max-height: 180px;
        }

        .drawer {
            position: fixed;
            inset: 0 0 0 auto;
            width: min(520px, 100vw);
            background: #0d1117;
            border-left: 1px solid var(--line);
            box-shadow: -18px 0 46px rgba(0, 0, 0, 0.38);
            transform: translateX(105%);
            transition: transform 180ms ease;
            z-index: 30;
            display: flex;
            flex-direction: column;
        }

        .drawer.open {
            transform: translateX(0);
        }

        .drawer-header {
            padding: 16px;
            border-bottom: 1px solid var(--line-soft);
            display: flex;
            justify-content: space-between;
            gap: 12px;
            align-items: flex-start;
        }

        .drawer-title {
            font-size: 16px;
            font-weight: 780;
        }

        .drawer-body {
            padding: 16px;
            overflow: auto;
        }

        .field-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
        }

        .field {
            border: 1px solid var(--line-soft);
            background: #0a0e14;
            border-radius: 8px;
            padding: 10px;
            min-width: 0;
        }

        .field-label {
            color: var(--subtle);
            font-size: 10px;
            text-transform: uppercase;
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            margin-bottom: 7px;
        }

        .field-value {
            font-size: 12px;
            color: var(--text);
            overflow-wrap: anywhere;
        }

        .modal {
            position: fixed;
            inset: 0;
            z-index: 40;
            display: none;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.58);
            padding: 18px;
        }

        .modal.open {
            display: flex;
        }

        .modal-panel {
            width: min(520px, 100%);
            background: #0d1117;
            border: 1px solid var(--line);
            border-radius: 8px;
            box-shadow: var(--shadow);
        }

        .modal-header,
        .modal-footer {
            padding: 14px;
            border-bottom: 1px solid var(--line-soft);
            display: flex;
            justify-content: space-between;
            gap: 12px;
            align-items: center;
        }

        .modal-footer {
            border-top: 1px solid var(--line-soft);
            border-bottom: 0;
            justify-content: flex-end;
        }

        .form {
            padding: 14px;
            display: grid;
            gap: 12px;
        }

        .form-row {
            display: grid;
            gap: 6px;
        }

        .form-row label {
            font-size: 12px;
            color: var(--muted);
        }

        .input {
            min-height: 36px;
            border-radius: 8px;
            border: 1px solid var(--line);
            background: #090d13;
            color: var(--text);
            padding: 8px 10px;
            outline: none;
            font-size: 13px;
        }

        .input:focus {
            border-color: rgba(79, 140, 255, 0.72);
        }

        .setting-control {
            display: grid;
            grid-template-columns: minmax(180px, 1fr) auto;
            align-items: center;
            justify-items: stretch;
            gap: 8px;
            min-width: min(320px, 100%);
        }

        .setting-control .input {
            width: 100%;
            max-width: none;
            min-width: 0;
        }

        .setting-control .setting-note {
            grid-column: 1 / -1;
        }

        .setting-note {
            color: var(--subtle);
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 10px;
            text-align: right;
        }

        .setting-note.status-ok {
            color: #33d47c;
        }

        .setting-note.status-missing {
            color: #f4805b;
        }

        .switch {
            position: relative;
            width: 40px;
            height: 22px;
            border: 1px solid var(--line);
            border-radius: 999px;
            background: #242b36;
            padding: 0;
        }

        .switch::after {
            content: "";
            position: absolute;
            top: 3px;
            left: 3px;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #aab4c2;
            transition: transform 160ms ease, background 160ms ease;
        }

        .switch.on {
            background: rgba(34, 197, 94, 0.24);
            border-color: rgba(34, 197, 94, 0.44);
        }

        .switch.on::after {
            transform: translateX(17px);
            background: #86efac;
        }

        .settings-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            gap: 14px;
            align-items: start;
            max-width: 980px;
        }

        .setting-card {
            border: 1px solid var(--line-soft);
            border-radius: 8px;
            background:
                linear-gradient(180deg, rgba(255, 255, 255, 0.025), transparent),
                #0d1219;
            overflow: hidden;
            min-width: 0;
        }

        .setting-card-head {
            padding: 13px 14px;
            border-bottom: 1px solid var(--line-soft);
        }

        .setting-card-title {
            font-size: 13px;
            font-weight: 760;
        }

        .setting-card-desc {
            margin-top: 5px;
            color: var(--subtle);
            font-size: 11px;
            line-height: 1.4;
        }

        .setting-list {
            display: grid;
        }

        .setting-row {
            display: grid;
            grid-template-columns: minmax(220px, 0.42fr) minmax(280px, 1fr);
            gap: 14px;
            align-items: center;
            padding: 12px 14px;
            border-bottom: 1px solid var(--line-soft);
        }

        .setting-row:last-child {
            border-bottom: 0;
        }

        .setting-name {
            font-size: 12px;
            font-weight: 720;
        }

        .setting-help {
            margin-top: 4px;
            color: var(--subtle);
            font-size: 11px;
            line-height: 1.4;
        }

        .setting-value {
            min-width: 0;
            min-height: 32px;
            border: 1px solid #303948;
            border-radius: 8px;
            background: #090d13;
            color: var(--text);
            padding: 7px 9px;
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 11px;
            text-align: right;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .trace-empty-copy {
            min-height: 190px;
            display: grid;
            place-content: center;
            gap: 8px;
            text-align: center;
            color: var(--muted);
        }

        .trace-empty-copy strong {
            color: var(--text);
            font-size: 13px;
        }

        .trace-empty-copy span {
            font-size: 12px;
        }

        .ai-hero {
            border: 1px solid var(--line-soft);
            border-radius: 8px;
            background:
                linear-gradient(135deg, rgba(34, 211, 238, 0.08), transparent 34%),
                linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent),
                #0d1219;
            padding: 16px;
            margin-bottom: 14px;
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(300px, 0.42fr);
            gap: 18px;
            align-items: center;
        }

        .ai-kicker {
            color: #a5f3fc;
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 10px;
            font-weight: 780;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            margin-bottom: 8px;
        }

        .ai-title {
            margin: 0;
            font-size: 22px;
            line-height: 1.2;
        }

        .ai-copy {
            margin: 8px 0 0;
            color: var(--muted);
            font-size: 13px;
            line-height: 1.55;
            max-width: 760px;
        }

        .ai-plain-summary {
            border: 1px solid rgba(34, 211, 238, 0.2);
            border-radius: 8px;
            background: rgba(34, 211, 238, 0.055);
            padding: 12px;
            display: grid;
            gap: 9px;
        }

        .ai-plain-row {
            display: grid;
            grid-template-columns: 74px minmax(0, 1fr);
            gap: 10px;
            align-items: baseline;
            font-size: 12px;
        }

        .ai-plain-label {
            color: var(--subtle);
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 9px;
            text-transform: uppercase;
        }

        .ai-grid {
            display: grid;
            grid-template-columns: minmax(0, 1.12fr) minmax(360px, 0.88fr);
            gap: 14px;
            align-items: start;
        }

        .ai-card {
            border: 1px solid var(--line-soft);
            border-radius: 8px;
            background:
                linear-gradient(180deg, rgba(255, 255, 255, 0.025), transparent),
                #0d1219;
            overflow: hidden;
        }

        .ai-card-head {
            min-height: 48px;
            padding: 13px 14px;
            border-bottom: 1px solid var(--line-soft);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }

        .ai-card-title {
            font-size: 13px;
            font-weight: 780;
        }

        .ai-card-body {
            padding: 14px;
            display: grid;
            gap: 12px;
        }

        .ai-locked-shell {
            position: relative;
        }

        .ai-locked-shell.is-locked .ai-lock-blur {
            filter: blur(6px);
            opacity: 0.28;
            pointer-events: none;
            user-select: none;
        }

        .ai-key-empty-state {
            align-items: center;
            background: rgba(10, 14, 20, 0.92);
            border: 1px solid var(--line);
            border-radius: 8px;
            box-shadow: var(--shadow);
            display: none;
            gap: 14px;
            left: 50%;
            max-width: 520px;
            padding: 24px;
            position: absolute;
            text-align: center;
            top: 50%;
            transform: translate(-50%, -50%);
            width: min(520px, calc(100% - 32px));
            z-index: 5;
        }

        .ai-locked-shell.is-locked .ai-key-empty-state {
            display: grid;
        }

        .ai-map {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 10px;
            align-items: stretch;
            margin-bottom: 14px;
        }

        .ai-map-step {
            position: relative;
            min-height: 96px;
            border: 1px solid var(--line-soft);
            border-radius: 8px;
            background:
                linear-gradient(180deg, rgba(255, 255, 255, 0.025), transparent),
                #0d1219;
            padding: 12px;
            display: grid;
            align-content: start;
            gap: 7px;
        }

        .ai-map-step:not(:last-child)::after {
            content: "";
            position: absolute;
            top: 50%;
            right: -10px;
            width: 10px;
            height: 2px;
            background: var(--line);
        }

        .ai-map-step.ok {
            border-color: rgba(34, 197, 94, 0.34);
        }

        .ai-map-step.warn {
            border-color: rgba(245, 158, 11, 0.4);
        }

        .ai-map-step.danger {
            border-color: rgba(239, 68, 68, 0.48);
            background:
                linear-gradient(180deg, rgba(239, 68, 68, 0.08), transparent),
                #100d0f;
        }

        .ai-map-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            color: var(--subtle);
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 9px;
            text-transform: uppercase;
        }

        .ai-map-title {
            font-size: 13px;
            font-weight: 780;
        }

        .ai-map-copy {
            color: var(--muted);
            font-size: 11px;
            line-height: 1.45;
        }

        .ai-finding {
            border: 1px solid var(--line-soft);
            border-radius: 8px;
            background: #090d13;
            padding: 12px;
        }

        .ai-finding-title {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            font-size: 13px;
            font-weight: 760;
        }

        .ai-finding-copy {
            margin-top: 8px;
            color: var(--muted);
            font-size: 12px;
            line-height: 1.55;
        }

        .ai-evidence {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
        }

        .ai-evidence-item {
            border: 1px solid var(--line-soft);
            border-radius: 8px;
            background: #090d13;
            padding: 10px;
            min-width: 0;
        }

        .ai-evidence-label {
            color: var(--subtle);
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 9px;
            text-transform: uppercase;
        }

        .ai-evidence-value {
            margin-top: 7px;
            font-size: 16px;
            font-weight: 800;
        }

        .ai-signal-list {
            display: grid;
            gap: 10px;
        }

        .ai-signal {
            display: grid;
            grid-template-columns: 10px minmax(0, 1fr);
            gap: 11px;
            align-items: start;
            padding: 10px;
            border: 1px solid var(--line-soft);
            border-radius: 8px;
            background: #090d13;
        }

        .ai-signal-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-top: 5px;
            background: var(--subtle);
            box-shadow: 0 0 0 4px rgba(95, 107, 124, 0.12);
        }

        .ai-signal-dot.ok {
            background: var(--green);
            box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12);
        }

        .ai-signal-dot.warn {
            background: var(--amber);
            box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.12);
        }

        .ai-signal-dot.danger {
            background: var(--red);
            box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.12);
        }

        .ai-action-list {
            display: grid;
            gap: 8px;
        }

        .ai-action {
            display: grid;
            grid-template-columns: 26px minmax(0, 1fr) auto;
            gap: 10px;
            align-items: center;
            border: 1px solid var(--line-soft);
            border-radius: 8px;
            background: #090d13;
            padding: 10px;
        }

        .ai-action-index {
            width: 26px;
            height: 26px;
            border-radius: 50%;
            display: grid;
            place-items: center;
            color: #a5f3fc;
            background: rgba(34, 211, 238, 0.1);
            border: 1px solid rgba(34, 211, 238, 0.24);
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 10px;
            font-weight: 800;
        }

        .ai-action-title {
            font-size: 12px;
            font-weight: 760;
        }

        .ai-action-copy {
            margin-top: 3px;
            color: var(--subtle);
            font-size: 11px;
            line-height: 1.45;
        }

        .ai-query {
            min-height: 92px;
            border: 1px solid var(--line);
            border-radius: 8px;
            background: #090d13;
            color: var(--text);
            padding: 12px;
            resize: none;
            scrollbar-width: none;
            outline: none;
            font-size: 13px;
            line-height: 1.5;
        }

        .ai-query:focus {
            border-color: rgba(34, 211, 238, 0.58);
            box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.08);
        }

        .ai-diagnosis-hero {
            border: 1px solid var(--line-soft);
            border-radius: 8px;
            background:
                linear-gradient(120deg, rgba(34, 211, 238, 0.07), transparent 35%),
                linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent),
                #0d1219;
            padding: 18px;
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(340px, 0.42fr);
            gap: 16px;
            align-items: stretch;
            margin-bottom: 14px;
        }

        .ai-diagnosis-title {
            margin: 0;
            max-width: 850px;
            font-size: 24px;
            line-height: 1.18;
            letter-spacing: 0;
        }

        .ai-diagnosis-copy {
            margin: 10px 0 0;
            max-width: 830px;
            color: var(--muted);
            font-size: 13px;
            line-height: 1.6;
        }

        .ai-suspect-panel {
            border: 1px solid rgba(239, 68, 68, 0.32);
            border-radius: 8px;
            background:
                linear-gradient(180deg, rgba(239, 68, 68, 0.08), transparent),
                rgba(9, 13, 19, 0.82);
            padding: 14px;
            display: grid;
            gap: 12px;
        }

        .ai-suspect-title {
            font-size: 18px;
            font-weight: 800;
        }

        .ai-suspect-meta {
            display: grid;
            gap: 8px;
        }

        .ai-suspect-row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            color: var(--muted);
            font-size: 11px;
        }

        .ai-suspect-row strong {
            color: var(--text);
        }

        .ai-insight-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 10px;
            margin-bottom: 14px;
        }

        .ai-insight-card {
            min-height: 128px;
            border: 1px solid var(--line-soft);
            border-radius: 8px;
            background:
                linear-gradient(180deg, rgba(255, 255, 255, 0.026), transparent),
                #0d1219;
            padding: 12px;
            display: grid;
            align-content: start;
            gap: 9px;
        }

        .ai-insight-card.danger {
            border-color: rgba(239, 68, 68, 0.42);
            background:
                linear-gradient(180deg, rgba(239, 68, 68, 0.07), transparent),
                #0d1219;
        }

        .ai-insight-card.warn {
            border-color: rgba(245, 158, 11, 0.36);
        }

        .ai-insight-card.ok {
            border-color: rgba(34, 197, 94, 0.28);
        }

        .ai-insight-label {
            color: var(--subtle);
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 9px;
            text-transform: uppercase;
        }

        .ai-insight-value {
            font-size: 18px;
            line-height: 1.16;
            font-weight: 820;
        }

        .ai-insight-desc {
            color: var(--muted);
            font-size: 11px;
            line-height: 1.48;
        }

        .ai-confidence {
            display: grid;
            gap: 8px;
        }

        .ai-confidence-top {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            align-items: baseline;
            font-size: 11px;
            color: var(--muted);
        }

        .ai-confidence-value {
            color: var(--text);
            font-size: 24px;
            font-weight: 840;
        }

        .ai-progress {
            height: 8px;
            border-radius: 999px;
            background: #090d13;
            border: 1px solid var(--line-soft);
            overflow: hidden;
        }

        .ai-progress-fill {
            height: 100%;
            border-radius: inherit;
            background: linear-gradient(90deg, var(--amber), var(--red));
        }

        .ai-evidence-list {
            display: grid;
            gap: 9px;
        }

        .ai-evidence-row {
            border: 1px solid var(--line-soft);
            border-radius: 8px;
            background: #090d13;
            padding: 11px;
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 12px;
            align-items: center;
        }

        .ai-evidence-title {
            font-size: 12px;
            font-weight: 760;
        }

        .ai-evidence-copy {
            margin-top: 4px;
            color: var(--subtle);
            font-size: 11px;
            line-height: 1.45;
        }

        .ai-evidence-stat {
            min-width: 82px;
            text-align: right;
            color: var(--text);
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 11px;
        }

        .ai-cause-list {
            display: grid;
            gap: 8px;
        }

        .ai-cause-row {
            display: grid;
            grid-template-columns: 88px minmax(0, 1fr);
            gap: 12px;
            border-bottom: 1px solid var(--line-soft);
            padding-bottom: 9px;
        }

        .ai-cause-row:last-child {
            border-bottom: 0;
            padding-bottom: 0;
        }

        .ai-cause-name {
            color: var(--subtle);
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 10px;
            text-transform: uppercase;
        }

        .ai-cause-copy {
            color: var(--muted);
            font-size: 12px;
            line-height: 1.5;
        }

        .ai-component-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 10px;
            margin-bottom: 14px;
        }

        .ai-component {
            border: 1px solid var(--line-soft);
            border-radius: 8px;
            background: #0d1219;
            padding: 12px;
            display: grid;
            gap: 8px;
            min-height: 120px;
        }

        .ai-component.ok {
            border-color: rgba(34, 197, 94, 0.28);
        }

        .ai-component.warn {
            border-color: rgba(245, 158, 11, 0.34);
        }

        .ai-component.danger {
            border-color: rgba(239, 68, 68, 0.45);
            background:
                linear-gradient(180deg, rgba(239, 68, 68, 0.06), transparent),
                #0d1219;
        }

        .ai-component-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            color: var(--subtle);
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 9px;
            text-transform: uppercase;
        }

        .ai-component-name {
            font-size: 13px;
            font-weight: 790;
        }

        .ai-component-copy {
            color: var(--muted);
            font-size: 11px;
            line-height: 1.5;
        }

        .ai-section-label {
            margin: 0 0 8px;
            color: var(--muted);
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 10px;
            text-transform: uppercase;
        }

        .ai-correlation-path {
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 8px;
        }

        .ai-path-node {
            position: relative;
            border: 1px solid var(--line-soft);
            border-radius: 8px;
            background: #090d13;
            padding: 10px;
            min-height: 82px;
        }

        .ai-path-node:not(:last-child)::after {
            content: "";
            position: absolute;
            top: 50%;
            right: -8px;
            width: 8px;
            height: 2px;
            background: var(--line);
            z-index: 2;
        }

        .ai-path-node.ok {
            border-color: rgba(34, 197, 94, 0.32);
        }

        .ai-path-node.warn {
            border-color: rgba(245, 158, 11, 0.34);
        }

        .ai-path-node.danger {
            border-color: rgba(239, 68, 68, 0.48);
        }

        .ai-path-title {
            font-size: 12px;
            font-weight: 780;
        }

        .ai-path-copy {
            margin-top: 6px;
            color: var(--subtle);
            font-size: 10px;
            line-height: 1.45;
        }

        .ai-chat-section {
            margin-top: 14px;
            border: 1px solid var(--line-soft);
            border-radius: 8px;
            background:
                linear-gradient(180deg, rgba(79, 140, 255, 0.045), transparent 42%),
                #0d1219;
            overflow: hidden;
        }

        .ai-chat-header {
            min-height: 58px;
            padding: 14px;
            border-bottom: 1px solid var(--line-soft);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
        }

        .ai-chat-title {
            font-size: 15px;
            font-weight: 800;
        }

        .ai-chat-subtitle {
            margin-top: 4px;
            color: var(--muted);
            font-size: 12px;
        }

        .ai-chat-body {
            padding: 14px;
            display: grid;
            gap: 12px;
        }

        .ai-chat-window {
            min-height: 220px;
            border: 1px solid var(--line-soft);
            border-radius: 8px;
            background: #090d13;
            padding: 14px;
            display: grid;
            gap: 12px;
            align-content: start;
        }

        .ai-message {
            display: grid;
            grid-template-columns: 30px minmax(0, 1fr);
            gap: 10px;
            max-width: 860px;
        }

        .ai-message.user {
            margin-left: auto;
            grid-template-columns: minmax(0, 1fr) 30px;
        }

        .ai-avatar {
            width: 30px;
            height: 30px;
            border-radius: 8px;
            display: grid;
            place-items: center;
            background: rgba(34, 211, 238, 0.1);
            border: 1px solid rgba(34, 211, 238, 0.22);
            color: #a5f3fc;
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 10px;
            font-weight: 800;
        }

        .ai-message.user .ai-avatar {
            background: rgba(79, 140, 255, 0.12);
            border-color: rgba(79, 140, 255, 0.26);
            color: #bfdbfe;
        }

        .ai-bubble {
            border: 1px solid var(--line-soft);
            border-radius: 8px;
            background: #0d1219;
            padding: 11px 12px;
            color: var(--muted);
            font-size: 12px;
            line-height: 1.55;
        }

        .ai-message.user .ai-bubble {
            background: #111827;
            color: var(--text);
        }

        .ai-prompt-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .ai-prompt-chip {
            border: 1px solid var(--line);
            border-radius: 6px;
            background: #090d13;
            color: var(--muted);
            padding: 7px 10px;
            font-size: 11px;
        }

        .ai-chat-composer {
            border: 1px solid var(--line);
            border-radius: 8px;
            background: #090d13;
            padding: 10px;
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 10px;
            align-items: end;
        }

        .ai-chat-input {
            min-height: 48px;
            max-height: 140px;
            border: 0;
            outline: 0;
            resize: none;
            scrollbar-width: none;
            background: transparent;
            color: var(--text);
            padding: 2px;
            font-size: 13px;
            line-height: 1.5;
        }

        .ask-ai-layout {
            min-height: calc(100vh - 116px);
            display: grid;
            grid-template-rows: auto minmax(0, 1fr);
            gap: 14px;
        }

        .ask-ai-hero {
            border: 1px solid var(--line-soft);
            border-radius: 8px;
            background:
                linear-gradient(120deg, rgba(79, 140, 255, 0.08), transparent 38%),
                linear-gradient(180deg, rgba(255, 255, 255, 0.028), transparent),
                #0d1219;
            padding: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
        }

        .ask-ai-title {
            margin: 0;
            font-size: 24px;
            line-height: 1.2;
        }

        .ask-ai-copy {
            margin: 7px 0 0;
            color: var(--muted);
            font-size: 13px;
            line-height: 1.55;
            max-width: 760px;
        }

        .ask-ai-shell {
            min-height: 0;
            border: 1px solid var(--line-soft);
            border-radius: 8px;
            background: #0d1219;
            display: grid;
            grid-template-columns: 250px minmax(0, 1fr);
            overflow: hidden;
        }

        .ask-ai-side {
            border-right: 1px solid var(--line-soft);
            background: #090d13;
            padding: 12px;
            display: grid;
            align-content: start;
            gap: 10px;
        }

        .ask-ai-new {
            width: 100%;
            justify-content: center;
        }

        .ask-ai-thread-list {
            display: grid;
            gap: 7px;
        }

        .ask-ai-thread {
            border: 1px solid transparent;
            border-radius: 8px;
            background: transparent;
            color: var(--muted);
            padding: 10px;
            text-align: left;
            display: grid;
            gap: 4px;
        }

        .ask-ai-thread.active,
        .ask-ai-thread:hover {
            border-color: var(--line);
            background: #111827;
            color: var(--text);
        }

        .ask-ai-thread-title {
            font-size: 12px;
            font-weight: 760;
        }

        .ask-ai-thread-meta {
            color: var(--subtle);
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 10px;
        }

        .ask-ai-main {
            min-width: 0;
            min-height: 0;
            display: grid;
            grid-template-rows: auto minmax(0, 1fr) auto;
            background:
                radial-gradient(circle at 50% 0%, rgba(34, 211, 238, 0.055), transparent 34%),
                #0d1219;
        }

        .ask-ai-context {
            padding: 14px 18px;
            border-bottom: 1px solid var(--line-soft);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            background: rgba(9, 13, 19, 0.72);
        }

        .ask-ai-context-title {
            font-size: 14px;
            font-weight: 780;
        }

        .ask-ai-context-copy {
            margin-top: 3px;
            color: var(--subtle);
            font-size: 12px;
        }

        .ask-ai-context-actions {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .ask-ai-messages {
            overflow: auto;
            padding: 22px 16px;
            display: grid;
            gap: 16px;
            align-content: start;
        }

        .ask-message {
            display: grid;
            grid-template-columns: 34px minmax(0, 760px);
            gap: 12px;
            justify-content: center;
        }

        .ask-message.user {
            grid-template-columns: minmax(0, 760px) 34px;
        }

        .ask-avatar {
            width: 34px;
            height: 34px;
            border-radius: 8px;
            border: 1px solid rgba(34, 211, 238, 0.22);
            background: rgba(34, 211, 238, 0.1);
            color: #a5f3fc;
            display: grid;
            place-items: center;
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 10px;
            font-weight: 800;
        }

        .ask-message.user .ask-avatar {
            border-color: rgba(79, 140, 255, 0.3);
            background: rgba(79, 140, 255, 0.12);
            color: #bfdbfe;
        }

        .ask-bubble {
            border: 1px solid var(--line-soft);
            border-radius: 8px;
            background: rgba(9, 13, 19, 0.72);
            padding: 13px 14px;
            color: var(--muted);
            font-size: 13px;
            line-height: 1.6;
        }

        .ask-message.user .ask-bubble {
            background: #111827;
            color: var(--text);
        }

        .ask-ai-suggestions {
            max-width: 820px;
            margin: 0 auto;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: center;
        }

        .ask-ai-composer-wrap {
            border-top: 1px solid var(--line-soft);
            padding: 14px 16px;
            background: rgba(9, 13, 19, 0.92);
        }

        .ask-ai-composer {
            max-width: 880px;
            margin: 0 auto;
            border: 1px solid var(--line);
            border-radius: 8px;
            background: #090d13;
            padding: 10px;
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 10px;
            align-items: end;
        }

        .ask-ai-input {
            min-height: 54px;
            max-height: 150px;
            border: 0;
            outline: 0;
            resize: none;
            scrollbar-width: none;
            background: transparent;
            color: var(--text);
            padding: 3px;
            font-size: 13px;
            line-height: 1.55;
        }

        .ask-ai-home {
            min-height: calc(100vh - 116px);
            display: grid;
            grid-template-rows: minmax(0, 1fr) auto;
            gap: 18px;
        }

        .ask-ai-center {
            min-height: 0;
            display: grid;
            align-content: center;
            justify-items: center;
            gap: 18px;
            padding: 42px 16px 26px;
            text-align: center;
        }

        .ask-ai-kicker {
            color: #a5f3fc;
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 11px;
            font-weight: 780;
            text-transform: uppercase;
        }

        .ask-ai-home-title {
            margin: 0;
            max-width: 900px;
            font-size: 42px;
            line-height: 1.08;
            letter-spacing: 0;
        }

        .ask-ai-home-copy {
            margin: 0;
            max-width: 720px;
            color: var(--muted);
            font-size: 14px;
            line-height: 1.6;
        }

        .ask-ai-prompt-grid {
            width: min(920px, 100%);
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 10px;
            margin-top: 8px;
        }

        .ask-ai-prompt-card {
            min-height: 102px;
            border: 1px solid var(--line-soft);
            border-radius: 8px;
            background:
                linear-gradient(180deg, rgba(255, 255, 255, 0.025), transparent),
                #0d1219;
            color: var(--text);
            padding: 12px;
            text-align: left;
            display: grid;
            align-content: start;
            gap: 8px;
        }

        .ask-ai-prompt-card:hover {
            border-color: rgba(34, 211, 238, 0.45);
            background: #111827;
        }

        .ask-ai-prompt-title {
            font-size: 12px;
            font-weight: 780;
        }

        .ask-ai-prompt-copy {
            color: var(--subtle);
            font-size: 11px;
            line-height: 1.45;
        }

        .ask-ai-home-composer {
            position: sticky;
            bottom: 0;
            padding: 16px 0 2px;
            background: linear-gradient(180deg, transparent, var(--bg) 34%);
        }

        .ask-ai-home-composer .ask-ai-composer {
            box-shadow: 0 18px 42px rgba(0, 0, 0, 0.28);
        }

        .ask-ai-home-composer .ask-ai-input {
            min-height: 62px;
        }

        #page-ask-ai {
            max-width: none;
            min-height: 0;
            height: calc(100vh - 94px);
            margin: 0;
            padding: 0;
            overflow: hidden;
        }

        #page-ask-ai .ask-ai-main {
            height: 100%;
            border: 0;
            border-radius: 0;
            overflow: hidden;
            background:
                radial-gradient(circle at 50% 36%, rgba(79, 140, 255, 0.09), transparent 32%),
                #090d13;
        }

        #page-ask-ai .ask-ai-content {
            min-height: 0;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
        }

        #page-ask-ai .ask-ai-home {
            min-height: 0;
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 44px 24px;
        }

        #page-ask-ai .ask-ai-center {
            padding: 0;
            gap: 22px;
        }

        #page-ask-ai .ask-ai-home-title {
            font-size: 36px;
            line-height: 1.16;
            font-weight: 720;
        }

        #page-ask-ai .ask-ai-home-copy {
            display: block;
            max-width: 680px;
            margin: -8px auto 0;
            color: var(--muted);
            font-size: 14px;
            line-height: 1.55;
        }

        #page-ask-ai .ask-ai-prompt-grid {
            width: min(820px, 100%);
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-top: 8px;
        }

        #page-ask-ai .ask-ai-prompt-card {
            min-height: 74px;
            border: 1px solid rgba(79, 140, 255, 0.24);
            border-radius: 8px;
            background:
                linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent),
                rgba(79, 140, 255, 0.055);
            color: #dbeafe;
            padding: 12px 14px;
            display: grid;
            align-content: center;
            gap: 5px;
            text-align: left;
        }

        #page-ask-ai .ask-ai-prompt-card:hover {
            border-color: rgba(79, 140, 255, 0.52);
            background: rgba(79, 140, 255, 0.12);
        }

        #page-ask-ai .ask-ai-prompt-copy {
            display: block;
            color: #8da2c4;
        }

        #page-ask-ai .ask-ai-composer-wrap {
            padding: 20px;
            border-top: 1px solid rgba(79, 140, 255, 0.16);
            background: linear-gradient(180deg, rgba(9, 13, 19, 0.5), #090d13 44%);
        }

        #page-ask-ai .ask-ai-composer {
            max-width: 1040px;
            border: 1px solid rgba(79, 140, 255, 0.32);
            border-radius: 8px;
            background:
                linear-gradient(180deg, rgba(79, 140, 255, 0.11), rgba(79, 140, 255, 0.035)),
                #0d1420;
            padding: 12px;
            grid-template-columns: minmax(0, 1fr) auto;
            align-items: center;
            box-shadow: 0 18px 42px rgba(0, 0, 0, 0.28), inset 0 0 0 1px rgba(255, 255, 255, 0.025);
        }

        .ask-ai-composer-field {
            min-width: 0;
            display: grid;
            gap: 6px;
        }

        .ask-ai-composer-hint {
            color: #73829a;
            font-size: 11px;
            padding: 0 10px 2px;
        }

        #page-ask-ai .ask-ai-input {
            min-height: 36px;
            max-height: 130px;
            padding: 8px 10px;
            color: #eef5ff;
            font-size: 15px;
            resize: none;
            overflow: hidden;
            scrollbar-width: none;
        }

        #page-ask-ai .ask-ai-input::placeholder {
            color: #8da2c4;
        }

        .ai-query::-webkit-scrollbar,
        .ai-chat-input::-webkit-scrollbar,
        .ask-ai-input::-webkit-scrollbar {
            display: none;
        }

        .ask-ai-send-button {
            min-width: 72px;
            height: 40px;
            border: 1px solid rgba(147, 197, 253, 0.45);
            border-radius: 7px;
            background: linear-gradient(180deg, #dbeafe, #bfdbfe);
            color: #07111f;
            font-size: 12px;
            font-weight: 820;
            display: grid;
            place-items: center;
            padding: 0 16px;
            cursor: pointer;
        }

        .ask-bubble.ai-response {
            background:
                linear-gradient(180deg, rgba(34, 211, 238, 0.035), transparent 22%),
                rgba(9, 13, 19, 0.86);
        }

        .ask-bubble.ai-response h3,
        .ask-bubble.ai-response h4 {
            margin: 2px 0 10px;
            color: #eef5ff;
            line-height: 1.3;
        }

        .ask-bubble.ai-response h3 {
            font-size: 17px;
        }

        .ask-bubble.ai-response h4 {
            font-size: 14px;
        }

        .ask-bubble.ai-response p {
            margin: 0 0 12px;
        }

        .ask-bubble.ai-response ul,
        .ask-bubble.ai-response ol {
            margin: 0 0 12px 19px;
            padding: 0;
            display: grid;
            gap: 6px;
        }

        .ask-bubble.ai-response pre {
            margin: 12px 0;
            border: 1px solid var(--line-soft);
            border-radius: 8px;
            background: #070a0e;
            padding: 12px;
            overflow-x: auto;
        }

        .ask-bubble.ai-response code {
            border: 1px solid rgba(148, 163, 184, 0.16);
            border-radius: 5px;
            background: rgba(148, 163, 184, 0.08);
            color: #dbeafe;
            padding: 1px 5px;
            font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
            font-size: 12px;
        }

        .ask-bubble.ai-response pre code {
            border: 0;
            background: transparent;
            padding: 0;
            color: var(--text);
            white-space: pre;
        }

        .ask-ai-empty-note {
            max-width: 680px;
            color: var(--muted);
            font-size: 14px;
            line-height: 1.55;
        }

        @media (max-width: 1060px) {
            .app {
                grid-template-columns: 76px minmax(0, 1fr);
            }

            .metrics {
                grid-template-columns: repeat(3, minmax(0, 1fr));
            }

            .ops-strip {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .overview-summary,
            .ai-hero,
            .ai-diagnosis-hero,
            .ai-insight-grid,
            .ai-component-grid,
            .ai-correlation-path,
            .ai-grid,
            .ai-map,
            .ask-ai-prompt-grid,
            .ask-ai-shell,
            .settings-grid {
                grid-template-columns: 1fr;
            }

            .workflow-grid {
                grid-template-columns: 1fr;
            }

            .grid-2,
            .detail-layout {
                grid-template-columns: 1fr;
            }

            .ai-path-node:not(:last-child)::after,
            .ai-map-step:not(:last-child)::after {
                display: none;
            }
        }

        @media (max-width: 740px) {
            body {
                overflow: auto;
            }

            .app {
                height: auto;
                min-height: 100vh;
                grid-template-columns: 1fr;
            }

            .app:has(.sidebar:hover),
            .app:has(.sidebar:focus-within) {
                grid-template-columns: 1fr;
            }

            .sidebar {
                width: 100%;
                overflow: visible;
                position: sticky;
                top: 0;
                z-index: 20;
                border-right: 0;
                border-bottom: 1px solid var(--line-soft);
            }

            .sidebar:hover {
                width: 100%;
                box-shadow: none;
            }

            .brand {
                height: 58px;
                justify-content: flex-start;
                padding: 0 14px;
            }

            .brand-copy {
                display: block;
                width: auto;
                visibility: visible;
                opacity: 1;
                transform: none;
                pointer-events: auto;
            }

            .nav {
                display: flex;
                overflow-x: auto;
                padding: 8px;
            }

            .nav-button {
                width: auto;
                min-width: 44px;
                display: grid;
                grid-template-columns: 24px;
                padding: 9px 10px;
            }

            .nav-label {
                display: none;
            }

            .sidebar-footer {
                display: none;
            }

            .main {
                min-height: 0;
            }

            .topbar {
                height: auto;
                padding: 12px;
                align-items: stretch;
                flex-direction: column;
            }

            .topbar-left,
            .topbar-right {
                width: 100%;
            }

            .search {
                width: 100%;
            }

            .global-search {
                width: 100%;
            }

            .content {
                padding: 12px;
            }

            .metrics,
            .ops-strip,
            .overview-summary,
            .ai-hero,
            .ai-diagnosis-hero,
            .ai-insight-grid,
            .ai-component-grid,
            .ai-correlation-path,
            .ai-grid,
            .ai-map,
            .ask-ai-prompt-grid,
            .ask-ai-shell,
            .ai-evidence,
            .grid-even,
            .field-grid,
            .settings-grid {
                grid-template-columns: 1fr;
            }

            .page-header {
                flex-direction: column;
            }

            .ai-chat-header {
                align-items: flex-start;
                flex-direction: column;
            }

            .ask-ai-hero,
            .ask-ai-context {
                align-items: flex-start;
                flex-direction: column;
            }

            .ask-ai-side {
                border-right: 0;
                border-bottom: 1px solid var(--line-soft);
            }

            .ai-chat-composer {
                grid-template-columns: 1fr;
            }

            .ask-ai-composer {
                grid-template-columns: 1fr;
            }

            .setting-row {
                grid-template-columns: 1fr;
                align-items: stretch;
            }

            .setting-control {
                grid-template-columns: minmax(0, 1fr) auto;
            }

            .ask-ai-home {
                min-height: calc(100vh - 252px);
            }

            .ask-ai-center {
                gap: 14px;
                padding: 24px 0 14px;
            }

            .ask-ai-home-title {
                font-size: 31px;
            }

            .ask-ai-prompt-grid {
                grid-template-columns: 1fr;
                overflow-x: visible;
                padding-bottom: 0;
            }

            .ask-ai-prompt-card {
                min-height: 88px;
            }

            .ask-ai-home-composer {
                padding-top: 10px;
            }
        }
    </style>
</head>

<body>
    <div class="app">
        <aside class="sidebar">
            <div class="brand">
                <div class="brand-mark" aria-hidden="true">
                    <img src="data:image/png;base64,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jcXxgdbShf7G0oXBZuPc0NISbV04O9CcP9PfXDzT15g/VZmbOdazOHNksy+ev310y9E3bNs+vjlJlnhHpC1lv92L9t/Nr0fX1mtZcVGWgROxY/AM4un/EAp+KfOcgsAp0JFxb2EFgeVy4LxoPpBvjAHzkrvC5L6wrXbbsprpYheXzVxR4NSOVrRpuwofybeeauOWTzy/8B3/7i+ffef/8ScP/+DvfO3It37xTOOOo1ll/1Q8uL2RjmzupCObWkn/8GLUM7QU9w4uxX2DS0nf4ELUNzxrekempGfThO3dOh717zxRVA9++VTrzt/80nPf/m//9Gs/+Bv3H/+BL1zIviXs3n3Nd7zznf1HjhxJunYoVazY9NeV0ER4LlkfGADXM1JYuR7/RV6AFYcYmYtdc6kPrfEBwVk+spzjvjh3bQXn9wPjB4GJ64DJO4EpejkiGwAAEABJREFUxSHStdB6hcoqrgEm2HZiH9uvxV7gAtuXYJsL17LMNueJCwdQ9nmeMueIsyvQ/DnqOa/1Ks/8xHZgkv1M3cBAyfzCCNDk2DKCe4q+6a7wZUo2gvBAoNDCFSJQXuFJcy7UxYE4Pn/H/oHDP/GtO778U996459/8O23/PGP3XPtx3/4rn0f/6Hbd3/8Hbfu+Pi779r7p++75+Cfvu9N133ifXcf/LP33n3tp3707us+9aNvPPip995z4M/efffBT/zwm2/45I99222fef+33/b5H3rTzgdft7f+7EAV52tzaLEv7ZPkJUlYUpCUKdSAgqfspd319Pwbt2957gfuuPFr73vzGz7/3je9/rM/fNetn33PHbd99j233lLSH7nt1s/9yG23fP59t91639+59db7f/y22+7/sdvuuP+9d9x5/4/ccft9P/q62+/74btuv/+HX3fXV7792v2PXtvfc2RLklyoorNUq/kcvXqonFG7FKUBqy6hBwtFDa3WQORnDg0Mn/7OgwcPf98NNz787htv/vK7b7j5i4r3XH/z/T98w033/9AtN3/++4gfuOWme99x0433/tDNN37uHTfefO87brjpcz9w882f/cFbbv3cu+6889533HrXF7/3+psee8uuA0evGRydGAMWuUY1cKoNXawyA12eUuV3qeYVWlasyje17HlG9Px+5q0YLwyDmnSLvcThbMV9h1AytZmCTOGmM8LFF0wRQpx5HwvA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" alt="FlowWatch logo" />






                </div>
                <div class="brand-copy">
                    <div class="brand-title">FlowWatch</div>
                    <div class="brand-subtitle">Reliability console</div>
                </div>
            </div>
            <nav class="nav" aria-label="Dashboard navigation">
                <button class="nav-button active" data-page-button="overview"><span class="nav-icon"><svg
                            viewBox="0 0 24 24">
                            <path d="M4 13h7V4H4v9Zm9 7h7V4h-7v16ZM4 20h7v-5H4v5Z" />
                        </svg></span><span class="nav-label">Overview</span></button>
                <button class="nav-button" data-page-button="workflows"><span class="nav-icon"><svg viewBox="0 0 24 24">
                            <path
                                d="M6 7h5m2 0h5M8.5 7v5m0 5h7M15.5 12v5M5 12h7v5H5v-5Zm7-10h8v5h-8V2Zm0 10h8v5h-8v-5Z" />
                        </svg></span><span class="nav-label">Workflows</span></button>
                <button class="nav-button" data-page-button="executions"><span class="nav-icon"><svg
                            viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7-11-7ZM4 5v14" />
                        </svg></span><span class="nav-label">Executions</span></button>
                <button class="nav-button" data-page-button="flags"><span class="nav-icon"><svg viewBox="0 0 24 24">
                            <path d="M6 21V4m0 0h11l-1.5 4L17 12H6" />
                        </svg></span><span class="nav-label">Feature Flags</span></button>
                <button class="nav-button" data-page-button="errors"><span class="nav-icon"><svg viewBox="0 0 24 24">
                            <path
                                d="M12 8v5m0 4h.01M10.3 3.8 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
                        </svg></span><span class="nav-label">Errors</span></button>
                <button class="nav-button" data-page-button="traces"><span class="nav-icon"><svg viewBox="0 0 24 24">
                            <path d="M4 12h4l3-7 3 14 3-7h3" />
                        </svg></span><span class="nav-label">Traces</span></button>
                <button class="nav-button" data-page-button="ai-insights"><span class="nav-icon"><svg
                            viewBox="0 0 24 24">
                            <path
                                d="M12 3l1.4 4.4L18 9l-4.6 1.6L12 15l-1.4-4.4L6 9l4.6-1.6L12 3Zm6 9 .8 2.2L21 15l-2.2.8L18 18l-.8-2.2L15 15l2.2-.8L18 12ZM5 13l.9 2.8L9 17l-3.1 1.2L5 21l-.9-2.8L1 17l3.1-1.2L5 13Z" />
                        </svg></span><span class="nav-label">AI Insights</span></button>
                <button class="nav-button" data-page-button="ask-ai"><span class="nav-icon"><svg viewBox="0 0 24 24">
                            <path
                                d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H9l-5 5v-5.5A2.5 2.5 0 0 1 4 13V5.5Zm4 2h8M8 11h5" />
                        </svg></span><span class="nav-label">Ask Flowwatch AI</span></button>
                <button class="nav-button" data-page-button="health"><span class="nav-icon"><svg viewBox="0 0 24 24">
                            <path d="M20 13c0 5-8 8-8 8s-8-3-8-8V5l8-3 8 3v8Zm-12-1h2l1.5-3 2.5 6 1.5-3H18" />
                        </svg></span><span class="nav-label">Health</span></button>
                <button class="nav-button" data-page-button="settings"><span class="nav-icon"><svg viewBox="0 0 24 24">
                            <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
                            <path
                                d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.37a1.7 1.7 0 0 0-1 .9l-.03.08A2 2 0 0 1 12.13 21h-.26a2 2 0 0 1-1.84-1.22l-.03-.08a1.7 1.7 0 0 0-1-.9 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.63 15a1.7 1.7 0 0 0-.9-1l-.08-.03A2 2 0 0 1 3 12.13v-.26a2 2 0 0 1 1.22-1.84l.08-.03a1.7 1.7 0 0 0 .9-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.63a1.7 1.7 0 0 0 1-.9l.03-.08A2 2 0 0 1 11.87 3h.26a2 2 0 0 1 1.84 1.22l.03.08a1.7 1.7 0 0 0 1 .9 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.37 9c.14.38.46.7.9.9l.08.03A2 2 0 0 1 21 11.87v.26a2 2 0 0 1-1.22 1.84l-.08.03a1.7 1.7 0 0 0-.3 1Z" />
                        </svg></span><span class="nav-label">Settings</span></button>
            </nav>
            <div class="sidebar-footer">
                <div class="health-line"><span>Service</span><strong id="sidebar-service">-</strong></div>
                <div class="health-line"><span>Postgres</span><span id="sidebar-postgres" class="badge warn"><span
                            class="dot"></span>unknown</span></div>
                <div class="health-line"><span>Worker</span><span id="sidebar-worker" class="badge warn"><span
                            class="dot"></span>unknown</span></div>
            </div>
        </aside>

        <div class="main">
            <header class="topbar">
                <div class="topbar-left">
                    <div class="service-name" id="top-service">-</div>
                </div>
                <div class="topbar-right">
                    <div class="global-search" id="global-search-shell">
                        <span class="search-icon">/</span>
                        <input id="global-search" class="search" type="search"
                            placeholder="Search errors, traces, workflow IDs">
                        <span class="search-kbd">Ctrl K</span>
                        <div class="search-results" id="global-search-results"></div>
                    </div>
                    <select id="time-range" class="select" aria-label="Time range">
                        <option>Last 1 hour</option>
                        <option>Last 24 hours</option>
                        <option>Last 7 days</option>
                    </select>
                    <button id="refresh-button" class="icon-button" title="Refresh" aria-label="Refresh">
                        <svg viewBox="0 0 24 24">
                            <path d="M20 6v5h-5" />
                            <path d="M4 18v-5h5" />
                            <path d="M18.5 9A7 7 0 0 0 6.2 6.8L4 9" />
                            <path d="M5.5 15A7 7 0 0 0 17.8 17.2L20 15" />
                        </svg>
                    </button>
                </div>
            </header>

            <main class="content">
                <section id="page-overview" class="page active">
                    <div class="page-header">
                        <div>
                            <h1 class="page-title">Overview</h1>
                            <div class="page-meta">System health, workflow failures, feature flag state, and recent
                                captured errors.</div>
                        </div>
                    </div>
                    <div class="overview-summary">
                        <div class="summary-primary">
                            <div class="summary-kicker">Current state</div>
                            <h2 id="summary-title" class="summary-title">Loading dashboard records.</h2>
                            <p id="summary-copy" class="summary-copy">Flowwatch is reading workflows, executions, feature
                                flags, traces, errors, and health checks from the configured tables.</p>
                            <div id="summary-actions" class="summary-actions">
                                <span class="badge warn is-live"><span class="dot"></span>loading</span>
                            </div>
                        </div>
                        <div class="summary-side">
                            <div class="summary-stat"><span>Workflow records</span><strong
                                    id="summary-workflow-count">-</strong></div>
                            <div class="summary-stat"><span>Execution records</span><strong
                                    id="summary-execution-count">-</strong></div>
                            <div class="summary-stat"><span>Error records</span><strong
                                    id="summary-error-count">-</strong></div>
                            <div class="summary-stat"><span>Trace records</span><strong
                                    id="summary-trace-count">-</strong></div>
                        </div>
                    </div>
                    <div class="metrics">
                        <div class="metric">
                            <div class="metric-label">Total workflows</div>
                            <div>
                                <div id="metric-workflows" class="metric-value">-</div>
                                <div id="metric-workflows-delta" class="metric-delta">from flowwatch_workflows</div>
                            </div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Running executions</div>
                            <div>
                                <div id="metric-running" class="metric-value" style="color: var(--amber)">-</div>
                                <div id="metric-running-delta" class="metric-delta">from flowwatch_workflow_executions</div>
                            </div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Failed executions</div>
                            <div>
                                <div id="metric-failed" class="metric-value" style="color: var(--red)">-</div>
                                <div id="metric-failed-delta" class="metric-delta">from flowwatch_workflow_executions</div>
                            </div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Recent errors</div>
                            <div>
                                <div id="metric-errors" class="metric-value" style="color: var(--red)">-</div>
                                <div id="metric-errors-delta" class="metric-delta">from flowwatch_errors</div>
                            </div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Active flags</div>
                            <div>
                                <div id="metric-flags" class="metric-value">-</div>
                                <div id="metric-flags-delta" class="metric-delta">from flowwatch_feature_flags</div>
                            </div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Avg latency</div>
                            <div>
                                <div id="metric-latency" class="metric-value" style="color: var(--green)">-</div>
                                <div id="metric-latency-delta" class="metric-delta">from flowwatch_request_traces</div>
                            </div>
                        </div>
                    </div>
                    <div class="grid-2">
                        <div class="stack">
                            <div class="panel">
                                <div class="panel-header">
                                    <div class="panel-title">Recent workflow executions</div>
                                    <button class="button" data-go="executions">View all</button>
                                </div>
                                <div class="table-wrap">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Execution</th>
                                                <th>Workflow</th>
                                                <th>Status</th>
                                                <th>Failed step</th>
                                                <th class="right">Duration</th>
                                            </tr>
                                        </thead>
                                        <tbody id="overview-executions"></tbody>
                                    </table>
                                </div>
                            </div>
                            <div class="panel">
                                <div class="panel-header">
                                    <div class="panel-title">Recent errors</div>
                                    <button class="button" data-go="errors">Search errors</button>
                                </div>
                                <div class="table-wrap">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Error</th>
                                                <th>Category</th>
                                                <th>Source</th>
                                                <th>Trace</th>
                                                <th class="right">Occurred</th>
                                            </tr>
                                        </thead>
                                        <tbody id="overview-errors"></tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div class="panel health-panel">
                            <div class="panel-header">
                                <div class="panel-title">Infrastructure health</div>
                            </div>
                            <div class="health-list dynamic-fill" id="overview-health"></div>
                        </div>
                    </div>
                </section>

                <section id="page-workflows" class="page">
                    <div class="page-header">
                        <div>
                            <h1 class="page-title">Workflows</h1>
                            <div class="page-meta">Registered through code with flowwatch.workflow(...). Creation is
                                intentionally not exposed here.</div>
                        </div>
                    </div>
                    <div class="pinned-workflows">
                        <div class="panel-header">
                            <div>
                                <div class="panel-title">Pinned workflow chains</div>
                                <div class="mono subtle" style="font-size: 10px; margin-top: 4px;">Pin up to 4 workflows
                                    from the table below</div>
                            </div>
                        </div>
                        <div class="workflow-grid" id="workflow-chain-grid"></div>
                    </div>
                    <div class="panel">
                        <div class="panel-header">
                            <div class="panel-title">Registered workflows</div>
                        </div>
                        <div class="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Version</th>
                                        <th>Steps</th>
                                        <th>Created</th>
                                        <th>Last status</th>
                                        <th>Pinned</th>
                                        <th class="right">Failures</th>
                                    </tr>
                                </thead>
                                <tbody id="workflow-table"></tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <section id="page-executions" class="page">
                    <div class="page-header">
                        <div>
                            <h1 class="page-title">Executions</h1>
                            <div class="page-meta">Inspect workflow runs, retries, inputs, failed steps, and timing.
                            </div>
                        </div>
                    </div>
                    <div class="filters">
                        <select id="execution-status-filter" class="select">
                            <option value="all">All statuses</option>
                            <option value="queued">Queued</option>
                            <option value="running">Running</option>
                            <option value="completed">Completed</option>
                            <option value="failed">Failed</option>
                        </select>
                        <input id="execution-search" class="search" type="search"
                            placeholder="Filter workflow or execution ID">
                    </div>
                    <div class="panel">
                        <div class="panel-header">
                            <div class="panel-title">Workflow executions</div>
                        </div>
                        <div class="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Execution</th>
                                        <th>Workflow</th>
                                        <th>Status</th>
                                        <th>Started</th>
                                        <th>Finished</th>
                                        <th>Failed step</th>
                                        <th class="right">Attempts</th>
                                    </tr>
                                </thead>
                                <tbody id="execution-table"></tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <section id="page-flags" class="page">
                    <div class="page-header">
                        <div>
                            <h1 class="page-title">Feature Flags</h1>
                            <div class="page-meta">Manage enabled state, deterministic rollout percentage, rules, and
                                audit history.</div>
                        </div>
                        <button id="open-flag-modal" class="button primary">Create flag</button>
                    </div>
                    <div class="panel">
                        <div class="panel-header">
                            <div class="panel-title">Flags</div>
                        </div>
                        <div class="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Key</th>
                                        <th>Enabled</th>
                                        <th>Rollout</th>
                                        <th>Rules</th>
                                        <th>Changed by</th>
                                        <th class="right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="flag-table"></tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <section id="page-errors" class="page">
                    <div class="page-header">
                        <div>
                            <h1 class="page-title">Errors</h1>
                            <div class="page-meta">Captured from Express middleware, workflows, flags, traces, and
                                manual flowwatch.captureError(...).</div>
                        </div>
                    </div>
                    <div class="filters">
                        <input id="error-search" class="search" type="search"
                            placeholder="Search message, stack, source">
                        <select id="error-category-filter" class="select">
                            <option value="all">All categories</option>
                            <option value="server">Server</option>
                            <option value="database">Database</option>
                            <option value="dependency">Dependency</option>
                            <option value="configuration">Configuration</option>
                            <option value="client">Client</option>
                        </select>
                    </div>
                    <div class="panel">
                        <div class="panel-header">
                            <div class="panel-title">Captured errors</div>
                        </div>
                        <div class="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Message</th>
                                        <th>Name</th>
                                        <th>Category</th>
                                        <th>Level</th>
                                        <th>Source</th>
                                        <th>Status</th>
                                        <th>Trace</th>
                                        <th class="right">Occurred</th>
                                    </tr>
                                </thead>
                                <tbody id="error-table"></tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <section id="page-traces" class="page">
                    <div class="page-header">
                        <div>
                            <h1 class="page-title">Traces</h1>
                            <div class="page-meta">Request traces and spans for HTTP, workflow, feature flag, database,
                                external API, and custom blocks.</div>
                        </div>
                    </div>
                    <div class="grid-2" style="margin-bottom: 14px;">
                        <div class="panel">
                            <div class="panel-header">
                                <div class="panel-title">Trace graph</div>
                            </div>
                            <div class="trace-board" id="trace-graph"></div>
                        </div>
                        <div class="panel">
                            <div class="panel-header">
                                <div class="panel-title">Span inspector</div>
                            </div>
                            <div class="trace-inspector">
                                <div class="field-grid">
                                    <div class="field">
                                        <div class="field-label">Trace</div>
                                        <div class="field-value mono" id="trace-inspector-id">-</div>
                                    </div>
                                    <div class="field">
                                        <div class="field-label">Critical path</div>
                                        <div class="field-value mono" id="trace-inspector-critical">-</div>
                                    </div>
                                </div>
                                <div class="span-list" id="trace-span-list"></div>
                            </div>
                        </div>
                    </div>
                    <div class="filters">
                        <input id="trace-search" class="search" type="search" placeholder="Search path, trace ID, IP">
                        <select id="trace-status-filter" class="select">
                            <option value="all">All status codes</option>
                            <option value="2">2xx</option>
                            <option value="4">4xx</option>
                            <option value="5">5xx</option>
                        </select>
                    </div>
                    <div class="panel">
                        <div class="panel-header">
                            <div class="panel-title">Request traces</div>
                        </div>
                        <div class="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Trace ID</th>
                                        <th>Method</th>
                                        <th>Path</th>
                                        <th>Status</th>
                                        <th>Time</th>
                                        <th>IP</th>
                                        <th class="right">Duration</th>
                                    </tr>
                                </thead>
                                <tbody id="trace-table"></tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <section id="page-ai-insights" class="page">
                    <div class="page-header">
                        <div>
                            <h1 class="page-title">AI Insights</h1>
                            <div class="page-meta">Current backend findings generated from request traces, workflow
                                runs, captured errors, feature flags, and health checks.</div>
                        </div>
                        <span id="ai-insight-status" class="badge warn"><span class="dot"></span>not loaded</span>
                    </div>

                    <div id="ai-locked-shell" class="ai-locked-shell">
                        <div id="ai-key-empty-state" class="ai-key-empty-state" aria-live="polite">
                            <div>
                                <div class="ai-kicker">Groq API key required</div>
                                <h2 class="ai-diagnosis-title">Insert your API key in the settings page.</h2>
                                <p class="ai-diagnosis-copy">AI Insights will stay locked until <span
                                        class="mono">GROQ_API_KEY</span> is configured on the backend.</p>
                            </div>
                            <button class="button primary" type="button" data-go="settings">Open settings</button>
                        </div>

                        <div class="ai-lock-blur">
                            <div class="ai-diagnosis-hero">
                                <div>
                                    <h2 id="ai-insight-summary" class="ai-diagnosis-title">Open AI Insights to generate
                                        analysis from your Flowwatch tables.</h2>
                                    <p id="ai-insight-cause" class="ai-diagnosis-copy">The dashboard will call the
                                        mounted <span class="mono">/api/ai-insights</span> endpoint, send structured
                                        context to Groq on the server, and render the model response here.</p>
                                </div>
                                <div class="ai-suspect-panel">
                                    <div>
                                        <div id="ai-insight-impact" class="ai-suspect-title">No model response loaded
                                            yet.</div>
                                    </div>
                                    <div class="ai-suspect-meta">
                                        <div class="ai-suspect-row"><span>Workflows</span><strong
                                                id="ai-workflow-count">0</strong></div>
                                        <div class="ai-suspect-row"><span>Executions</span><strong
                                                id="ai-execution-count">0</strong></div>
                                        <div class="ai-suspect-row"><span>Errors</span><strong
                                                id="ai-error-count">0</strong></div>
                                        <div class="ai-suspect-row"><span>Confidence</span><strong
                                                id="ai-confidence">0%</strong></div>
                                    </div>
                                </div>
                            </div>

                            <div class="ai-insight-grid">
                                <div class="ai-insight-card">
                                    <div class="ai-insight-label">Evidence</div>
                                    <div id="ai-evidence-count" class="ai-insight-value">0 items</div>
                                    <div id="ai-evidence-preview" class="ai-insight-desc">No evidence returned yet.
                                    </div>
                                </div>
                                <div class="ai-insight-card">
                                    <div class="ai-insight-label">Recommended actions</div>
                                    <div id="ai-action-count" class="ai-insight-value">0 actions</div>
                                    <div id="ai-action-preview" class="ai-insight-desc">No action returned yet.</div>
                                </div>
                            </div>

                            <div class="grid-2" style="margin-top: 14px;">
                                <div class="ai-card">
                                    <div class="ai-card-head">
                                        <div class="ai-card-title">Evidence used</div>
                                    </div>
                                    <div id="ai-evidence-list" class="ai-action-list"></div>
                                </div>
                                <div class="ai-card">
                                    <div class="ai-card-head">
                                        <div class="ai-card-title">Recommended actions</div>
                                    </div>
                                    <div id="ai-action-list" class="ai-action-list"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                </section>

                <section id="page-ask-ai" class="page">
                    <div class="ask-ai-main">
                        <div class="ask-ai-context">
                            <div>
                                <div class="ask-ai-context-title">Ask Flowwatch AI</div>
                                <div class="ask-ai-context-copy">Diagnose this server's errors, traces, workflows, flags, latency, and health.</div>
                            </div>
                            <div class="ask-ai-context-actions">
                                <button id="ask-ai-clear-btn" class="button" type="button">Clear chat</button>
                            </div>
                        </div>

                        <div id="ask-ai-content" class="ask-ai-content">
                            <div id="ask-ai-welcome" class="ask-ai-home">
                                <div class="ask-ai-center">
                                    <h1 class="ask-ai-home-title">What should we inspect first?</h1>
                                    <div class="ask-ai-empty-note">Flowwatch AI is scoped to this backend. Ask about workflow failures, trace latency, captured errors, feature flag rollout impact, queues, Redis, Postgres, or health checks.</div>
                                    <div class="ask-ai-prompt-grid" aria-label="Suggested Flowwatch AI prompts">
                                        <button class="ask-ai-prompt-card" data-ask-prompt="Explain the latest failed workflow execution using the loaded execution steps and linked errors.">
                                            <span class="ask-ai-prompt-title">Explain a failed execution</span>
                                            <span class="ask-ai-prompt-copy">Start from the failed workflow, retry count, and step timeline.</span>
                                        </button>
                                        <button class="ask-ai-prompt-card" data-ask-prompt="Use the selected trace to identify the slowest backend span and any linked captured error.">
                                            <span class="ask-ai-prompt-title">Read a trace</span>
                                            <span class="ask-ai-prompt-copy">Find the slow span, connected error, and affected request.</span>
                                        </button>
                                        <button class="ask-ai-prompt-card" data-ask-prompt="Compare enabled feature flags with recent traces, errors, and workflow failures.">
                                            <span class="ask-ai-prompt-title">Check rollout impact</span>
                                            <span class="ask-ai-prompt-copy">Compare flag state with traces, errors, and workflow failures.</span>
                                        </button>
                                        <button class="ask-ai-prompt-card" data-ask-prompt="Give me a safe replay plan for the selected failed workflow execution.">
                                            <span class="ask-ai-prompt-title">Plan a safe replay</span>
                                            <span class="ask-ai-prompt-copy">Separate completed side effects from steps that can be retried.</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div id="ask-ai-messages" class="ask-ai-messages"></div>
                        </div>

                        <div class="ask-ai-composer-wrap">
                            <div class="ask-ai-composer">
                                <div class="ask-ai-composer-field">
                                    <textarea id="ask-ai-input" class="ask-ai-input" rows="2" placeholder="Ask about this server's traces, workflows, errors, flags, latency, queues, or health..."></textarea>
                                    <div class="ask-ai-composer-hint">Flowwatch AI only answers questions grounded in this server's observability data.</div>
                                </div>
                                <button id="ask-ai-submit-btn" class="ask-ai-send-button" type="button" title="Send" aria-label="Send">Send</button>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="page-health" class="page">
                    <div class="page-header">
                        <div>
                            <h1 class="page-title">Health</h1>
                            <div class="page-meta">Postgres, Redis, Elasticsearch, and worker runtime health.</div>
                        </div>
                    </div>
                    <div class="grid-even" id="health-cards"></div>
                </section>

                <section id="page-settings" class="page">
                    <div class="page-header">
                        <div>
                            <h1 class="page-title">Settings</h1>
                            <div class="page-meta">Runtime settings exposed by Flowwatch. Secrets and connection strings stay hidden.</div>
                        </div>
                    </div>
                    <div class="settings-grid">
                        <div class="setting-card">
                            <div class="setting-card-head">
                                <div class="setting-card-title">Dashboard</div>
                                <div class="setting-card-desc">Only the runtime values that are useful from the dashboard.</div>
                            </div>
                            <div class="setting-list">
                                <div class="setting-row">
                                    <div>
                                        <div class="setting-name">Environment</div>
                                        <div class="setting-help">Shown in the header and attached to traces.</div>
                                    </div>
                                    <div class="setting-control">
                                        <input id="setting-environment-input" class="input" placeholder="development" spellcheck="false">
                                        <button id="setting-environment-save" class="button" type="button">Save</button>
                                        <span id="setting-environment-status" class="setting-note"></span>
                                    </div>
                                </div>
                                <div class="setting-row">
                                    <div>
                                        <div class="setting-name">Dashboard enabled</div>
                                        <div class="setting-help">Toggles the dashboard route on or off.</div>
                                    </div>
                                    <button id="setting-dashboard-enabled" class="switch" title="Dashboard enabled state"></button>
                                </div>
                            </div>
                        </div>
                        <div class="setting-card">
                            <div class="setting-card-head">
                                <div class="setting-card-title">AI Provider</div>
                                <div class="setting-card-desc">Groq credentials and model used by AI Insights and Ask Flowwatch.</div>
                            </div>
                            <div class="setting-list">
                                <div class="setting-row">
                                    <div>
                                        <div class="setting-name">Groq API key</div>
                                        <div class="setting-help">Required before the AI Insights page can generate analysis.</div>
                                    </div>
                                    <div class="setting-control">
                                        <input id="setting-groq-api-key-input" type="password" class="input" placeholder="Enter Groq API key" spellcheck="false">
                                        <button id="setting-groq-api-key-save" class="button" type="button">Save</button>
                                        <span id="setting-groq-api-key-status" class="setting-note"></span>
                                    </div>
                                </div>
                                <div class="setting-row">
                                    <div>
                                        <div class="setting-name">Groq model</div>
                                        <div class="setting-help">Model name sent by the backend insight service.</div>
                                    </div>
                                    <div class="setting-control">
                                        <select id="setting-groq-model-select" class="input">
                                            <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile</option>
                                            <option value="llama-3.1-8b-instant">llama-3.1-8b-instant</option>
                                            <option value="llama3-70b-8192">llama3-70b-8192</option>
                                            <option value="llama3-8b-8192">llama3-8b-8192</option>
                                            <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                                            <option value="gemma2-9b-it">gemma2-9b-it</option>
                                            <option value="gemma-7b-it">gemma-7b-it</option>
                                            <option value="llama-guard-3-8b">llama-guard-3-8b</option>
                                        </select>
                                        <button id="setting-groq-model-save" class="button" type="button">Save</button>
                                        <span id="setting-groq-model-status" class="setting-note"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    </div>

    <aside id="detail-drawer" class="drawer" aria-hidden="true">
        <div class="drawer-header">
            <div>
                <div id="drawer-title" class="drawer-title">Details</div>
                <div id="drawer-subtitle" class="page-meta">Selected record</div>
            </div>
            <button id="close-drawer" class="icon-button" title="Close">X</button>
        </div>
        <div id="drawer-body" class="drawer-body"></div>
    </aside>

    <div id="flag-modal" class="modal" role="dialog" aria-modal="true" aria-labelledby="flag-modal-title">
        <div class="modal-panel">
            <div class="modal-header">
                <strong id="flag-modal-title">Create feature flag</strong>
                <button id="close-flag-modal" class="icon-button" title="Close">X</button>
            </div>
            <form id="flag-form">
                <div class="form">
                    <div class="form-row">
                        <label for="flag-key">Flag key</label>
                        <input id="flag-key" class="input" required placeholder="feature-key">
                    </div>
                    <div class="form-row">
                        <label for="flag-description">Description</label>
                        <input id="flag-description" class="input" placeholder="Describe what this flag controls">
                    </div>
                    <div class="form-row">
                        <label for="flag-rollout">Rollout percentage</label>
                        <input id="flag-rollout" class="input" type="number" min="0" max="100" value="0">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="button" id="cancel-flag">Cancel</button>
                    <button type="submit" class="button primary">Create</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        const state = {
            workflows: [],
            executions: [],
            flags: [],
            errors: [],
            traces: [],
            health: [],
            serviceName: "-",
            environment: "-",
            settings: null,
            aiInsight: null,
            aiInsightError: null,
            aiInsightLoading: false,
            aiModelConfigured: false,
            aiKeyMissing: false,
            apiBacked: false,
            apiError: null,
            aiMessages: [],
            groqModels: [],
            selectedGroqModel: "llama-3.3-70b-versatile"
        };

        const SEEDED_GROQ_MODELS = [
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "openai/gpt-oss-120b",
            "openai/gpt-oss-20b",
            "meta-llama/llama-4-scout-17b-16e-instruct",
            "meta-llama/llama-4-maverick-17b-128e-instruct",
            "moonshotai/kimi-k2-instruct-0905",
            "qwen/qwen3-32b"
        ];

        const pageButtons = document.querySelectorAll("[data-page-button]");
        const pages = document.querySelectorAll(".page");
        const drawer = document.getElementById("detail-drawer");
        const drawerTitle = document.getElementById("drawer-title");
        const drawerSubtitle = document.getElementById("drawer-subtitle");
        const drawerBody = document.getElementById("drawer-body");
        const flagModal = document.getElementById("flag-modal");
        const globalSearchShell = document.getElementById("global-search-shell");
        const globalSearchInput = document.getElementById("global-search");
        const globalSearchResults = document.getElementById("global-search-results");

        function pinnedWorkflowNames() {
            try {
                return new Set(JSON.parse(localStorage.getItem("flowwatch:pinned-workflows") || "[]"));
            }
            catch {
                return new Set();
            }
        }

        function savePinnedWorkflowNames() {
            try {
                localStorage.setItem("flowwatch:pinned-workflows", JSON.stringify(state.workflows.filter((workflow) => workflow.pinned).map((workflow) => workflow.name)));
            }
            catch {
                // Local storage can be disabled; pinning can remain session-only.
            }
        }

        function dashboardBasePath() {
            const currentPath = window.location.pathname;

            if (currentPath.endsWith("/dashboard.html") || currentPath.endsWith("/index.html")) {
                return currentPath.slice(0, currentPath.lastIndexOf("/") + 1);
            }

            return currentPath.endsWith("/") ? currentPath : `${currentPath}/`;
        }

        function apiPath(path) {
            return `${dashboardBasePath()}api/${String(path).replace(/^\/+/, "")}`;
        }

        function escapeHtml(value) {
            return String(value ?? "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        async function apiRequest(path, options = {}) {
            const response = await fetch(apiPath(path), {
                headers: {
                    "Content-Type": "application/json",
                    ...(options.headers || {}),
                },
                ...options,
            });

            if (!response.ok) {
                let message = `Request failed with ${response.status}`;
                let code = "";

                try {
                    const body = await response.json();
                    message = body?.error?.message || body?.message || message;
                    code = body?.error?.code || body?.code || "";
                }
                catch {
                    // Keep the status-based message when the response is not JSON.
                }

                const error = new Error(message);
                error.status = response.status;
                error.code = code;
                throw error;
            }

            if (response.status === 204) {
                return {};
            }

            return response.json();
        }

        function normalizeWorkflow(workflow, index = 0) {
            const savedPins = pinnedWorkflowNames();
            const hasSavedPins = savedPins.size > 0;
            const chain = Array.isArray(workflow.chain) ? workflow.chain : [];
            const latestExecution = workflow.latestExecution || null;

            return {
                ...workflow,
                name: workflow.name,
                version: workflow.version || workflow.workflowVersion || latestExecution?.workflowVersion || 1,
                steps: workflow.steps || chain.length || latestExecution?.steps?.length || 0,
                created: workflow.created || formatDateTime(workflow.createdAt),
                lastStatus: workflow.lastStatus || latestExecution?.status || "queued",
                failures: workflow.failures || 0,
                pinned: hasSavedPins ? savedPins.has(workflow.name) : index < 4,
                chain: chain.length ? chain : (latestExecution?.steps || []).map((step) => step.stepName || step.name),
                latestExecution,
            };
        }

        function normalizeExecution(execution) {
            return {
                ...execution,
                workflow: execution.workflow || execution.workflowName,
                started: execution.started || formatTime(execution.startedAt || execution.createdAt),
                finished: execution.finished || formatTime(execution.completedAt || execution.failedAt),
                failedStep: execution.failedStep || (execution.steps || []).find((step) => step.status === "failed")?.stepName || "-",
                attempts: execution.attempts ?? (execution.steps || []).reduce((total, step) => total + Number(step.attempts || step.attemptCount || 0), 0),
                duration: execution.duration || formatDurationLabel(execution.durationMs),
                steps: execution.steps || [],
            };
        }

        function normalizeFlag(flag) {
            return {
                ...flag,
                rollout: flag.rollout ?? flag.rolloutPercentage ?? 0,
                rules: flag.rules ?? 0,
                changedBy: flag.changedBy || "dashboard",
            };
        }

        function normalizeError(error) {
            return {
                ...error,
                name: error.name || "Error",
                status: error.status ?? error.statusCode ?? "-",
                trace: error.trace || error.traceId || "-",
                occurred: error.occurred || formatTime(error.occurredAt || error.createdAt),
            };
        }

        function normalizeTrace(trace) {
            return {
                ...trace,
                status: trace.status ?? trace.statusCode ?? "-",
                duration: trace.duration ?? trace.durationMs ?? 0,
                spans: trace.spans || [],
            };
        }

        function formatTime(value) {
            if (!value) return "-";
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return "-";
            return date.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
        }

        function formatDateTime(value) {
            if (!value) return "-";
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return "-";
            return date.toISOString().slice(0, 16).replace("T", " ");
        }

        function formatDurationLabel(ms) {
            if (ms === null || ms === undefined) return "-";
            if (ms < 1000) return `${ms}ms`;
            return `${(ms / 1000).toFixed(ms >= 10000 ? 0 : 1)}s`;
        }

        async function loadDashboardData() {
            try {
                const data = await apiRequest("dashboard-data");

                state.serviceName = data.serviceName || "-";
                state.environment = data.environment || "-";
                state.settings = data.settings || null;
                state.workflows = (data.workflows || []).map(normalizeWorkflow);
                state.executions = (data.executions || []).map(normalizeExecution);
                state.flags = (data.flags || []).map(normalizeFlag);
                state.errors = (data.errors || []).map(normalizeError);
                state.traces = (data.traces || []).map(normalizeTrace);
                state.health = data.health || [];
                state.apiBacked = true;
                state.apiError = null;
            }
            catch (error) {
                state.workflows = [];
                state.executions = [];
                state.flags = [];
                state.errors = [];
                state.traces = [];
                state.health = [];
                state.serviceName = "-";
                state.environment = "-";
                state.settings = null;
                state.apiBacked = false;
                state.apiError = error instanceof Error ? error.message : "Dashboard API unavailable";
            }

            renderAll();
        }

        function badgeForStatus(status) {
            const s = escapeHtml(status);
            if (status === "completed" || status === "ok") return `<span class="badge ok"><span class="dot"></span>${s}</span>`;
            if (status === "running" || status === "queued" || status === "degraded") return `<span class="badge warn"><span class="dot"></span>${s}</span>`;
            return `<span class="badge bad"><span class="dot"></span>${s}</span>`;
        }

        function graphStatusClass(status) {
            if (status === "completed" || status === "ok") return "success";
            if (status === "running" || status === "queued" || status === "degraded") return "running";
            if (status === "failed" || status === "error") return "failed";
            return "";
        }

        function tableEmptyRow(colspan, title, copy) {
            return `
                <tr>
                    <td colspan="${Number(colspan) || 1}">
                        <div class="empty-state" style="padding: 20px;">
                            <div class="empty-title">${escapeHtml(title)}</div>
                            <div class="empty-copy">${escapeHtml(copy)}</div>
                        </div>
                    </td>
                </tr>
            `;
        }

        function workflowStepStatus(workflow, step, execution) {
            if (!execution) return "pending";
            const recordedStep = (execution.steps || []).find((item) => (item.stepName || item.name) === step);
            if (recordedStep?.status) return recordedStep.status;
            if (execution.status === "failed" && execution.failedStep === step) return "failed";
            if (["running", "queued"].includes(execution.status)) {
                const index = (workflow.chain || []).indexOf(step);
                if (index === 0) return execution.status;
            }
            return "pending";
        }

        function badgeForMethod(method) {
            const m = escapeHtml(method);
            if (method === "GET") return `<span class="badge ok">${m}</span>`;
            if (method === "POST") return `<span class="badge info">${m}</span>`;
            if (method === "PATCH") return `<span class="badge warn">${m}</span>`;
            return `<span class="badge bad">${m}</span>`;
        }

        function showPage(pageName) {
            pageButtons.forEach((button) => button.classList.toggle("active", button.dataset.pageButton === pageName));
            pages.forEach((page) => page.classList.toggle("active", page.id === `page-${pageName}`));
            closeDrawer();

            if (pageName === "ai-insights") {
                loadAiInsights();
            }
            if (pageName === "ask-ai") {
                initAiChat();
            }
            if (pageName === "settings") {
                loadGroqModelsForSettings();
            }
        }

        function openDrawer(title, subtitle, html) {
            drawerTitle.textContent = title;
            drawerSubtitle.textContent = subtitle;
            drawerBody.innerHTML = html;
            drawer.classList.add("open");
            drawer.setAttribute("aria-hidden", "false");
        }

        function closeDrawer() {
            drawer.classList.remove("open");
            drawer.setAttribute("aria-hidden", "true");
            drawerBody.innerHTML = "";
        }

        function latestExecutionForWorkflow(workflowName) {
            const workflow = state.workflows.find((item) => item.name === workflowName);
            return state.executions.find((execution) => execution.workflow === workflowName) || workflow?.latestExecution;
        }

        function allExecutionsForWorkflow(workflowName) {
            return state.executions.filter((execution) => execution.workflow === workflowName);
        }

        function workflowErrorForStep(workflowName, stepName) {
            const execution = latestExecutionForWorkflow(workflowName);
            const failedStep = (execution?.steps || []).find((step) => {
                const name = step.stepName || step.name;
                return name === stepName && step.status === "failed";
            });

            if (failedStep?.error) {
                const error = typeof failedStep.error === "string" ? { message: failedStep.error } : failedStep.error;
                return {
                    name: error.name || "WorkflowStepError",
                    message: error.message || JSON.stringify(error),
                    trace: execution.traceId || execution.trace || "-",
                    source: "workflow_step",
                };
            }

            if (!execution || execution.failedStep !== stepName) {
                return undefined;
            }

            const matchingTraceError = state.errors.find((error) => error.trace !== "-" && (error.trace === execution.traceId || error.trace === execution.trace));

            if (matchingTraceError) {
                return matchingTraceError;
            }

            return state.errors.find((error) => error.source === "workflow_step") || state.errors.find((error) => error.trace !== "-");
        }

        function workflowExecutionSteps(workflow, execution) {
            if (execution?.steps?.length) {
                return execution.steps.map((step, index) => {
                    const name = step.stepName || step.name || `step-${index + 1}`;
                    const error = step.status === "failed" ? workflowErrorForStep(workflow.name, name) : undefined;

                    return {
                        name,
                        index,
                        status: step.status || "pending",
                        duration: step.duration || formatDurationLabel(step.durationMs),
                        attempts: step.attempts ?? step.attemptCount ?? 0,
                        error,
                    };
                });
            }

            return workflow.chain.map((step, index) => {
                const normalizedStatus = workflowStepStatus(workflow, step, execution);
                const error = normalizedStatus === "failed" ? workflowErrorForStep(workflow.name, step) : undefined;

                return {
                    name: step,
                    index,
                    status: normalizedStatus,
                    duration: "-",
                    attempts: normalizedStatus === "failed" ? execution?.attempts || 1 : 0,
                    error,
                };
            });
        }

        function badgeForStepStatus(status) {
            if (status === "completed") return badgeForStatus("completed");
            if (status === "running" || status === "queued" || status === "pending") return `<span class="badge warn"><span class="dot"></span>${escapeHtml(status)}</span>`;
            return badgeForStatus("failed");
        }

        function workflowStepErrorDetail(workflow, step, error) {
            return `
                <div class="field-grid" style="margin-bottom: 14px;">
                    <div class="field"><div class="field-label">Workflow</div><div class="field-value">${escapeHtml(workflow.name)}</div></div>
                    <div class="field"><div class="field-label">Failed step</div><div class="field-value">${escapeHtml(step.name)}</div></div>
                    <div class="field"><div class="field-label">Attempts</div><div class="field-value mono">${escapeHtml(step.attempts)}</div></div>
                    <div class="field"><div class="field-label">Trace ID</div><div class="field-value mono">${escapeHtml(error?.trace || "-")}</div></div>
                </div>
                <div class="field" style="margin-bottom: 12px;"><div class="field-label">Error message</div><div class="field-value">${escapeHtml(error?.message || "No captured error is linked to this workflow step yet.")}</div></div>
                <pre class="code-box">${escapeHtml(error?.name || "WorkflowStepError")}: ${escapeHtml(error?.message || "Step failed without a captured error record.")}
    at runWorkflowStep (${escapeHtml(workflow.name)}.${escapeHtml(step.name)})
    at executeWorkflow (workflowWorker.ts)</pre>
            `;
        }

        function renderOverview() {
            const failedExecutions = state.executions.filter((execution) => execution.status === "failed");
            const runningExecutions = state.executions.filter((execution) => execution.status === "running");
            const activeFlags = state.flags.filter((flag) => flag.enabled);
            const partialFlags = state.flags.filter((flag) => flag.enabled && Number(flag.rollout) > 0 && Number(flag.rollout) < 100);
            const avgTraceDuration = state.traces.length
                ? Math.round(state.traces.reduce((total, trace) => total + Number(trace.duration || 0), 0) / state.traces.length)
                : null;
            const latestFailedExecution = failedExecutions[0];

            document.getElementById("top-service").textContent = state.serviceName;
            document.getElementById("sidebar-service").textContent = state.serviceName;
            document.getElementById("summary-workflow-count").textContent = `${state.workflows.length}`;
            document.getElementById("summary-execution-count").textContent = `${state.executions.length}`;
            document.getElementById("summary-error-count").textContent = `${state.errors.length}`;
            document.getElementById("summary-trace-count").textContent = `${state.traces.length}`;
            document.getElementById("metric-workflows").textContent = state.workflows.length;
            document.getElementById("metric-running").textContent = runningExecutions.length;
            document.getElementById("metric-failed").textContent = failedExecutions.length;
            document.getElementById("metric-errors").textContent = state.errors.length;
            document.getElementById("metric-flags").textContent = activeFlags.length;
            document.getElementById("metric-latency").textContent = avgTraceDuration === null ? "-" : `${avgTraceDuration}ms`;
            document.getElementById("metric-workflows-delta").textContent = "from flowwatch_workflows";
            document.getElementById("metric-running-delta").textContent = "currently running";
            document.getElementById("metric-failed-delta").textContent = "latest loaded executions";
            document.getElementById("metric-errors-delta").textContent = "latest captured errors";
            document.getElementById("metric-flags-delta").textContent = `${partialFlags.length} partial rollout`;
            document.getElementById("metric-latency-delta").textContent = "average loaded traces";

            if (state.apiError) {
                document.getElementById("summary-title").textContent = "Dashboard API is unavailable.";
                document.getElementById("summary-copy").textContent = state.apiError;
                document.getElementById("summary-actions").innerHTML = `<span class="badge bad"><span class="dot"></span>API error</span>`;
            }
            else if (latestFailedExecution) {
                document.getElementById("summary-title").textContent = `${latestFailedExecution.workflow} has a failed execution.`;
                document.getElementById("summary-copy").textContent = `Latest failed execution ${latestFailedExecution.id} failed at ${latestFailedExecution.failedStep || "an unknown step"}.`;
                document.getElementById("summary-actions").innerHTML = `
                    <span class="badge bad"><span class="dot"></span>${failedExecutions.length} failed executions</span>
                    <span class="badge warn"><span class="dot"></span>${runningExecutions.length} running executions</span>
                `;
            }
            else {
                document.getElementById("summary-title").textContent = state.executions.length ? "No failed executions in the loaded records." : "No workflow executions loaded yet.";
                document.getElementById("summary-copy").textContent = state.executions.length
                    ? "The overview is using the latest execution, error, trace, workflow, and flag rows returned by the dashboard API."
                    : "Run or trigger workflows in Flowwatch to populate dashboard tables.";
                document.getElementById("summary-actions").innerHTML = `
                    <span class="badge ok"><span class="dot"></span>${state.workflows.length} workflows</span>
                `;
            }

            document.getElementById("overview-executions").innerHTML = state.executions.length ? state.executions.slice(0, 5).map((execution) => `
                <tr data-execution="${escapeHtml(execution.id)}">
                    <td class="mono">${escapeHtml(execution.id)}</td>
                    <td>${escapeHtml(execution.workflow)}</td>
                    <td>${badgeForStatus(execution.status)}</td>
                    <td>${escapeHtml(execution.failedStep)}</td>
                    <td class="right mono">${escapeHtml(execution.duration)}</td>
                </tr>
            `).join("") : tableEmptyRow(5, "No execution records", "Workflow executions will appear after rows exist in flowwatch_workflow_executions.");

            document.getElementById("overview-errors").innerHTML = state.errors.length ? state.errors.slice(0, 4).map((error, index) => `
                <tr data-error="${index}">
                    <td>${escapeHtml(error.message)}</td>
                    <td>${badgeForStatus(error.category === "client" ? "queued" : "failed")}</td>
                    <td>${escapeHtml(error.source)}</td>
                    <td class="mono">${escapeHtml(error.trace)}</td>
                    <td class="right mono">${escapeHtml(error.occurred)}</td>
                </tr>
            `).join("") : tableEmptyRow(5, "No captured errors", "Captured errors will appear after rows exist in the Flowwatch error tables.");

            const overviewHealth = document.getElementById("overview-health");
            overviewHealth.classList.toggle("is-compact", state.health.length > 4);
            overviewHealth.innerHTML = state.health.length ? state.health.map((item) => `
                <div class="health-row">
                    <div class="health-top">
                        <div class="health-name">${escapeHtml(item.name)}</div>
                        ${badgeForStatus(item.status)}
                    </div>
                    <div class="muted" style="font-size: 12px;">${escapeHtml(item.description)}</div>
                    <div class="health-top mono subtle"><span>${item.latency > 0 ? item.latency + 'ms' : '--'} latency</span><span>last checked now</span></div>
                </div>
            `).join("") : `
                <div class="empty-state">
                    <div class="empty-title">No health checks loaded</div>
                    <div class="empty-copy">${escapeHtml(state.apiError) || "Health checks will appear after the dashboard API responds."}</div>
                </div>
            `;
        }

        function renderWorkflows() {
            const pinnedWorkflows = state.workflows.filter((workflow) => workflow.pinned).slice(0, 4);
            document.getElementById("workflow-chain-grid").innerHTML = pinnedWorkflows.length ? pinnedWorkflows.map((workflow) => `
                <div class="workflow-card" data-workflow="${escapeHtml(workflow.name)}">
                    <div class="workflow-card-head">
                        <div>
                            <div class="workflow-card-title">${escapeHtml(workflow.name)}</div>
                            <div class="mono subtle" style="font-size: 10px; margin-top: 4px;">v${escapeHtml(workflow.version)} / ${escapeHtml(workflow.steps)} steps</div>
                        </div>
                        ${badgeForStatus(workflow.lastStatus)}
                    </div>
                    <div class="workflow-chain">
                        ${workflow.chain.map((step, index) => `
                            ${index > 0 ? `<span class="chain-arrow ${getWorkflowArrowClass(workflow, step)}"></span>` : ""}
                            <div class="workflow-step ${getWorkflowStepClass(workflow, step)}">
                                <div class="workflow-step-name">${escapeHtml(step)}</div>
                                <div class="workflow-step-meta">step ${index + 1} / ${workflow.completedRuns || 0} runs ok</div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `).join("") : `
                <div class="empty-state" style="grid-column: 1 / -1; margin: 0;">
                    <div class="empty-title">${escapeHtml(state.workflows.length ? "No pinned workflows" : "No workflow records")}</div>
                    <div class="empty-copy">${escapeHtml(state.workflows.length ? "Pin workflows from the table below." : "Rows from flowwatch_workflows will appear here.")}</div>
                </div>
            `;

            document.getElementById("workflow-table").innerHTML = state.workflows.length ? state.workflows.map((workflow) => `
                <tr data-workflow="${escapeHtml(workflow.name)}">
                    <td><strong>${escapeHtml(workflow.name)}</strong></td>
                    <td class="mono">v${escapeHtml(workflow.version)}</td>
                    <td class="mono">${escapeHtml(workflow.steps)}</td>
                    <td class="mono">${escapeHtml(workflow.created)}</td>
                    <td>${badgeForStatus(workflow.lastStatus)}</td>
                    <td><button class="pin-button ${workflow.pinned ? "active" : ""}" data-toggle-pin="${escapeHtml(workflow.name)}">${workflow.pinned ? "Pinned" : "Pin"}</button></td>
                    <td class="right mono">${workflow.totalRuns || 0} <span class="subtle">runs &middot; ${workflow.completedRuns || 0} ok &middot; ${workflow.failedRuns || 0} failed</span></td>
                </tr>
            `).join("") : tableEmptyRow(7, "No workflow records", "Registered workflows will appear after rows exist in flowwatch_workflows.");
        }

        function getWorkflowStepClass(workflow, step) {
            const execution = latestExecutionForWorkflow(workflow.name);
            const status = workflowStepStatus(workflow, step, execution);
            if (status === "completed") return "live";
            if (status === "running") return "running";
            if (status === "failed") return "failed";
            return "";
        }

        function getWorkflowArrowClass(workflow, step) {
            const execution = latestExecutionForWorkflow(workflow.name);
            const status = workflowStepStatus(workflow, step, execution);
            if (status === "completed") return "live";
            if (status === "running") return "running";
            if (status === "failed") return "failed";
            return "";
        }

        function renderExecutions() {
            const statusFilter = document.getElementById("execution-status-filter").value;
            const search = document.getElementById("execution-search").value.toLowerCase();
            const rows = state.executions.filter((execution) => {
                const statusMatch = statusFilter === "all" || execution.status === statusFilter;
                const textMatch = `${execution.id} ${execution.workflow}`.toLowerCase().includes(search);
                return statusMatch && textMatch;
            });

            document.getElementById("execution-table").innerHTML = rows.length ? rows.map((execution) => `
                <tr data-execution="${escapeHtml(execution.id)}">
                    <td class="mono">${escapeHtml(execution.id)}</td>
                    <td>${escapeHtml(execution.workflow)}</td>
                    <td>${badgeForStatus(execution.status)}</td>
                    <td class="mono">${escapeHtml(execution.started)}</td>
                    <td class="mono">${escapeHtml(execution.finished)}</td>
                    <td>${escapeHtml(execution.failedStep)}</td>
                    <td class="right mono">${escapeHtml(execution.attempts)}</td>
                </tr>
            `).join("") : tableEmptyRow(7, "No execution records", "Workflow execution rows from flowwatch_workflow_executions will appear here.");
        }

        function renderFlags() {
            document.getElementById("flag-table").innerHTML = state.flags.length ? state.flags.map((flag) => `
                <tr data-flag="${escapeHtml(flag.key)}">
                    <td><strong>${escapeHtml(flag.key)}</strong></td>
                    <td><button class="switch ${flag.enabled ? "on" : ""}" data-toggle-flag="${escapeHtml(flag.key)}" title="Toggle ${escapeHtml(flag.key)}"></button></td>
                    <td>
                        <div class="mono">${escapeHtml(flag.rollout)}%</div>
                        <div class="bar" style="margin-top: 6px;"><div class="bar-fill" style="width: ${escapeHtml(flag.rollout)}%;"></div></div>
                    </td>
                    <td class="mono">${escapeHtml(flag.rules)}</td>
                    <td>${escapeHtml(flag.changedBy)}</td>
                    <td class="right"><button class="button" data-delete-flag="${escapeHtml(flag.key)}">Delete</button></td>
                </tr>
            `).join("") : tableEmptyRow(6, "No feature flag records", "Feature flags from flowwatch_feature_flags will appear here.");
        }

        function renderErrors() {
            const category = document.getElementById("error-category-filter").value;
            const search = document.getElementById("error-search").value.toLowerCase();
            const rows = state.errors.filter((error) => {
                const categoryMatch = category === "all" || error.category === category;
                const textMatch = `${error.message} ${error.name} ${error.source}`.toLowerCase().includes(search);
                return categoryMatch && textMatch;
            });

            document.getElementById("error-table").innerHTML = rows.length ? rows.map((error, index) => `
                <tr data-error="${state.errors.indexOf(error)}">
                    <td>${escapeHtml(error.message)}</td>
                    <td>${escapeHtml(error.name)}</td>
                    <td>${escapeHtml(error.category)}</td>
                    <td>${error.level === "critical" ? badgeForStatus("failed") : `<span class="badge warn">${escapeHtml(error.level)}</span>`}</td>
                    <td>${escapeHtml(error.source)}</td>
                    <td class="mono">${escapeHtml(error.status)}</td>
                    <td class="mono">${escapeHtml(error.trace)}</td>
                    <td class="right mono">${escapeHtml(error.occurred)}</td>
                </tr>
            `).join("") : tableEmptyRow(8, "No captured error records", "Captured errors will appear after Flowwatch writes error rows.");
        }

        function renderTraces() {
            const statusGroup = document.getElementById("trace-status-filter").value;
            const search = document.getElementById("trace-search").value.toLowerCase();
            const rows = state.traces.filter((trace) => {
                const groupMatch = statusGroup === "all" || String(trace.status).startsWith(statusGroup);
                const textMatch = `${trace.id} ${trace.path} ${trace.ip}`.toLowerCase().includes(search);
                return groupMatch && textMatch;
            });

            document.getElementById("trace-table").innerHTML = rows.length ? rows.map((trace) => `
                <tr data-trace="${escapeHtml(trace.id)}" class="${trace.id === state._selectedTraceId ? 'selected-row' : ''}">
                    <td class="mono">${escapeHtml(trace.id.slice(0, 8))}&hellip;</td>
                    <td>${badgeForMethod(trace.method)}</td>
                    <td>${escapeHtml(trace.path)}</td>
                    <td class="mono">${escapeHtml(trace.status ?? '-')}</td>
                    <td class="mono">${escapeHtml(formatTime(trace.startedAt || trace.createdAt))}</td>
                    <td class="mono">${escapeHtml(trace.ip)}</td>
                    <td class="right mono">${trace.duration != null ? escapeHtml(trace.duration) + 'ms' : '-'}</td>
                </tr>
            `).join("") : tableEmptyRow(7, "No trace records", "Request trace rows from flowwatch_request_traces will appear here.");

            if (state._selectedTraceId) {
                // Re-render graph for selected trace when table refreshes
                const selected = state.traces.find(t => t.id === state._selectedTraceId);
                if (selected) renderTraceGraph(selected);
            } else {
                document.getElementById("trace-graph").innerHTML = `
                    <div class="trace-empty-copy">
                        <strong>Select a request to view its trace graph</strong>
                        <span>Click any row in the table above to visualize its span chain.</span>
                    </div>`;
                document.getElementById("trace-inspector-id").textContent = "-";
                document.getElementById("trace-inspector-critical").textContent = "-";
                document.getElementById("trace-span-list").innerHTML = "";
            }
        }

        function renderTraceGraph(trace) {
            if (!trace) {
                document.getElementById("trace-graph").innerHTML = `
                    <div class="trace-empty-copy">
                        <strong>No traces captured</strong>
                        <span>Request traces will appear here after the dashboard API has trace records.</span>
                    </div>
                `;
                document.getElementById("trace-inspector-id").textContent = "-";
                document.getElementById("trace-inspector-critical").textContent = "-";
                document.getElementById("trace-span-list").innerHTML = "";
                return;
            }

            // Build display spans: use real spans if available, otherwise synthesise from trace fields
            const rawSpans = trace.spans && trace.spans.length > 0 ? trace.spans : [];

            // Always include a synthetic root span for the HTTP request itself
            const rootSpan = {
                name: "http.request",
                type: "http",
                status: trace.status >= 500 ? "failed" : trace.status >= 400 ? "error" : "completed",
                duration: trace.duration ?? 0,
            };

            // Build the span list: root first, then real child spans
            const allSpans = [rootSpan, ...rawSpans];

            const nodeWidth = 142;
            const nodeHeight = 58;
            // Spread nodes in a single row
            const nodes = allSpans.map((span, index) => ({
                ...span,
                x: 42 + index * 200,
                y: span.type === "feature_flag" ? 46 : span.type === "database" ? 178 : span.type === "external_api" ? 178 : 112,
            }));
            const svgWidth = Math.max(800, nodes.length * 200 + 120);
            const svgHeight = 290;
            const truncate = (value, limit = 20) => value && value.length > limit ? `${value.slice(0, limit)}...` : (value || '');
            const nodeName = (span) => {
                if (!span.name) return 'Span';
                if (span.name === "http.request") return `${trace.method || "GET"} ${trace.path || "/"}`;
                if (span.name.startsWith("flowwatch.flag")) return "Feature Flag";
                if (span.name.startsWith("flowwatch.workflow")) return "Workflow";
                return span.name;
            };
            const nodeStatusClass = (span) => {
                const s = String(span.status || '');
                if (s === 'failed' || s === 'error') return 'failed';
                if (s === 'completed' || s === 'ok') return 'success';
                if (s === 'running') return 'running';
                // For HTTP status codes on root span
                const code = Number(trace.status);
                if (!isNaN(code)) return code >= 500 ? 'failed' : code >= 400 ? '' : 'success';
                return '';
            };
            const nodeSub = (span, index) => {
                if (index === 0) return trace.duration != null ? trace.duration + 'ms' : '';
                return span.duration != null ? span.duration + 'ms' : '';
            };
            const node = (span, index) => `
                <g class="trace-node ${nodeStatusClass(span) || (index === 0 ? 'active' : '')}" data-node-span="${index}">
                    <title>${escapeHtml(nodeName(span))}</title>
                    <rect x="${span.x}" y="${span.y}" width="${nodeWidth}" height="${nodeHeight}"></rect>
                    <text x="${span.x + nodeWidth / 2}" y="${span.y + nodeHeight / 2 - 7}" class="trace-node-name" clip-path="url(#trace-node-clip-${index})">${escapeHtml(truncate(nodeName(span), 18))}</text>
                    <text x="${span.x + nodeWidth / 2}" y="${span.y + nodeHeight / 2 + 11}" class="trace-node-sub">${nodeSub(span, index)}</text>
                </g>
            `;
            const edge = (from, to) => {
                const x1 = from.x + nodeWidth;
                const y1 = from.y + nodeHeight / 2;
                const x2 = to.x;
                const y2 = to.y + nodeHeight / 2;
                const sc = nodeStatusClass(to);
                const marker = sc === "failed" ? "url(#arrow-hot)" : sc === "success" ? "url(#arrow-success)" : sc === "running" ? "url(#arrow-running)" : "url(#arrow)";
                const edgeClass = sc === "failed" ? "hot" : sc || '';
                const pathD = `M${x1} ${y1} C${x1 + 60} ${y1}, ${x2 - 60} ${y2}, ${x2} ${y2}`;
                return `
                    <path class="trace-edge ${edgeClass}" marker-end="${marker}" d="${pathD}"></path>
                    <circle r="4" class="trace-packet ${sc === 'failed' ? 'hot' : sc === 'running' ? 'running' : ''}">
                        <animateMotion dur="${sc === 'failed' ? '1.2s' : sc === 'running' ? '1.6s' : '2.2s'}" repeatCount="indefinite" path="${pathD}"></animateMotion>
                    </circle>
                `;
            };

            document.getElementById("trace-graph").innerHTML = `
                <svg class="trace-svg" viewBox="0 0 ${svgWidth} ${svgHeight}" role="img" aria-label="Trace chain graph for ${escapeHtml(trace.id)}">
                    <defs>
                        <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                            <path d="M0,0 L8,4 L0,8 Z" fill="#3b4658"></path>
                        </marker>
                        <marker id="arrow-hot" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                            <path d="M0,0 L8,4 L0,8 Z" fill="#ef4444"></path>
                        </marker>
                        <marker id="arrow-success" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                            <path d="M0,0 L8,4 L0,8 Z" fill="#22c55e"></path>
                        </marker>
                        <marker id="arrow-running" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                            <path d="M0,0 L8,4 L0,8 Z" fill="#f59e0b"></path>
                        </marker>
                        ${nodes.map((span, index) => `
                            <clipPath id="trace-node-clip-${index}">
                                <rect x="${span.x + 12}" y="${span.y + 11}" width="${nodeWidth - 24}" height="18" rx="2"></rect>
                            </clipPath>
                        `).join("")}
                    </defs>
                    ${nodes.slice(0, -1).map((span, index) => edge(span, nodes[index + 1])).join("")}
                    ${nodes.map((span, index) => node(span, index)).join("")}
                </svg>
                <div class="trace-request-card">
                    <div class="trace-request-title">${escapeHtml(trace.method)} ${escapeHtml(trace.path)}</div>
                    <div class="trace-request-meta">${escapeHtml(trace.id)} &middot; ${escapeHtml(trace.status ?? '-')} &middot; ${trace.duration != null ? escapeHtml(trace.duration) + 'ms' : 'pending'} &middot; ${escapeHtml(formatTime(trace.startedAt || trace.createdAt))}</div>
                </div>
            `;

            document.getElementById("trace-inspector-id").textContent = trace.id;
            document.getElementById("trace-inspector-critical").textContent = trace.duration != null ? `${trace.duration}ms` : 'pending';
            document.getElementById("trace-span-list").innerHTML = allSpans.map((span, index) => `
                <div class="span-row">
                    <div>
                        <div class="span-name">${escapeHtml(nodeName(span))}</div>
                        <div class="span-type">${escapeHtml(span.type)}${index === 0 ? ` &middot; ${escapeHtml(trace.status ?? 'pending')}` : ` &middot; ${escapeHtml(span.status)}`}</div>
                    </div>
                    <span class="mono ${nodeStatusClass(span) === 'failed' ? 'bad' : 'muted'}">${nodeSub(span, index) || '-'}</span>
                </div>
            `).join("");
        }

        function renderGlobalSearch() {
            const query = globalSearchInput.value.trim().toLowerCase();

            if (!query) {
                globalSearchResults.innerHTML = `
                    <div class="search-result" data-go="errors">
                        <span class="result-type">Shortcut</span>
                        <span class="result-title">Open captured errors</span>
                        <span class="mono subtle">Errors</span>
                    </div>
                    <div class="search-result" data-go="traces">
                        <span class="result-type">Shortcut</span>
                        <span class="result-title">Open trace graph and request spans</span>
                        <span class="mono subtle">Traces</span>
                    </div>
                    <div class="search-result" data-go="ai-insights">
                        <span class="result-type">Shortcut</span>
                        <span class="result-title">Open AI incident insights</span>
                        <span class="mono subtle">AI Insights</span>
                    </div>
                    <div class="search-result" data-go="ask-ai">
                        <span class="result-type">Shortcut</span>
                        <span class="result-title">Ask Flowwatch AI</span>
                        <span class="mono subtle">AI</span>
                    </div>
                    <div class="search-result" data-go="executions">
                        <span class="result-type">Shortcut</span>
                        <span class="result-title">Inspect workflow executions</span>
                        <span class="mono subtle">Executions</span>
                    </div>
                `;
                return;
            }

            const results = [
                ...state.executions.map((item) => ({
                    type: "execution",
                    title: `${item.id} / ${item.workflow}`,
                    meta: item.status,
                    action: "executions"
                })),
                ...state.errors.map((item) => ({
                    type: "error",
                    title: item.message,
                    meta: item.source,
                    action: "errors"
                })),
                ...state.traces.map((item) => ({
                    type: "trace",
                    title: `${item.id} ${item.method} ${item.path}`,
                    meta: `${item.duration}ms`,
                    action: "traces"
                })),
                ...state.flags.map((item) => ({
                    type: "flag",
                    title: item.key,
                    meta: `${item.rollout}% rollout`,
                    action: "flags"
                })),
                {
                    type: "insight",
                    title: "AI incident insights from traces workflows flags and errors",
                    meta: "AI Insights",
                    action: "ai-insights"
                },
                {
                    type: "ai",
                    title: "Ask Flowwatch AI about traces errors workflows and health",
                    meta: "Ask Flowwatch AI",
                    action: "ask-ai"
                }
            ].filter((item) => `${item.type} ${item.title} ${item.meta}`.toLowerCase().includes(query)).slice(0, 6);

            globalSearchResults.innerHTML = results.length ? results.map((item) => `
                <div class="search-result" data-go="${escapeHtml(item.action)}">
                    <span class="result-type">${escapeHtml(item.type)}</span>
                    <span class="result-title">${escapeHtml(item.title)}</span>
                    <span class="mono subtle">${escapeHtml(item.meta)}</span>
                </div>
            `).join("") : `
                <div class="search-result">
                    <span class="result-type">No match</span>
                    <span class="result-title">No local dashboard result for "${escapeHtml(query)}"</span>
                    <span class="mono subtle">search</span>
                </div>
            `;
        }

        function renderHealth() {
            const postgresHealth = state.health.find((item) => item.name === "Postgres");
            const workerHealth = state.health.find((item) => item.name === "BullMQ Worker");

            document.getElementById("sidebar-postgres").outerHTML = postgresHealth
                ? `<span id="sidebar-postgres">${badgeForStatus(postgresHealth.status)}</span>`
                : `<span id="sidebar-postgres" class="badge warn"><span class="dot"></span>unknown</span>`;
            document.getElementById("sidebar-worker").outerHTML = workerHealth
                ? `<span id="sidebar-worker">${badgeForStatus(workerHealth.status)}</span>`
                : `<span id="sidebar-worker" class="badge warn"><span class="dot"></span>unknown</span>`;

            document.getElementById("health-cards").innerHTML = state.health.length ? state.health.map((item) => `
                <div class="panel">
                    <div class="panel-header">
                        <div class="panel-title">${escapeHtml(item.name)}</div>
                        ${badgeForStatus(item.status)}
                    </div>
                    <div style="padding: 14px; display: grid; gap: 12px;">
                        <div class="muted">${escapeHtml(item.description)}</div>
                        <div class="field-grid">
                            <div class="field"><div class="field-label">Latency</div><div class="field-value mono">${item.latency > 0 ? escapeHtml(item.latency) + 'ms' : '--'}</div></div>
                            <div class="field"><div class="field-label">Last checked</div><div class="field-value mono">now</div></div>
                        </div>
                    </div>
                </div>
            `).join("") : `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-title">No health checks loaded</div>
                    <div class="empty-copy">${escapeHtml(state.apiError || "Health checks will appear after the dashboard API responds.")}</div>
                </div>
            `;
        }

        function renderSettings() {
            const settings = state.settings || {};
            const dashboard = settings.dashboard || {};
            const ai = settings.ai || {};
            const setSwitch = (id, enabled) => {
                const element = document.getElementById(id);
                if (!element) return;
                element.classList.toggle("on", Boolean(enabled));
                element.title = enabled ? "Enabled" : "Disabled";
            };

            const envInput = document.getElementById("setting-environment-input");
            if (envInput && !envInput.matches(":focus")) envInput.value = settings.environment || state.environment || "";

            const modelSelect = document.getElementById("setting-groq-model-select");
            if (modelSelect) {
                const savedModel = ai.groqModel || "llama-3.3-70b-versatile";
                modelSelect.value = savedModel;
            }

            setSwitch("setting-dashboard-enabled", dashboard.enabled);

            const keyStatus = document.getElementById("setting-groq-api-key-status");
            if (keyStatus) {
                keyStatus.textContent = ai.groqApiKeyConfigured ? "configured" : "not configured";
                keyStatus.className = "setting-note " + (ai.groqApiKeyConfigured ? "status-ok" : "status-missing");
            }
            state.selectedGroqModel = ai.groqModel || state.selectedGroqModel || "llama-3.3-70b-versatile";
            renderGroqModelControls();
        }

        async function saveSetting(settingName, value, statusElId) {
            const statusEl = document.getElementById(statusElId);
            if (statusEl) {
                statusEl.textContent = "saving...";
                statusEl.className = "setting-note";
            }

            try {
                const res = await apiRequest("settings", {
                    method: "POST",
                    body: JSON.stringify({ [settingName]: value })
                });

                if (res && res.settings) {
                    state.settings = res.settings;
                    renderSettings();
                }

                if (statusEl) {
                    statusEl.textContent = "saved";
                    statusEl.className = "setting-note status-ok";
                }
            } catch (error) {
                if (statusEl) {
                    statusEl.textContent = error.message || "failed";
                    statusEl.className = "setting-note status-missing";
                }
            }
        }

        async function toggleSetting(settingName, elementId) {
            const el = document.getElementById(elementId);
            if (!el) return;
            const isCurrentlyOn = el.classList.contains("on");
            const newValue = !isCurrentlyOn;

            // Optimistic visual update
            el.classList.toggle("on", newValue);
            el.title = newValue ? "Enabled" : "Disabled";

            try {
                const res = await apiRequest("settings", {
                    method: "POST",
                    body: JSON.stringify({ [settingName]: newValue })
                });

                if (res && res.settings) {
                    state.settings = res.settings;
                    renderSettings();
                }
            } catch (error) {
                console.error("Failed to toggle setting:", error);
                // Revert
                el.classList.toggle("on", isCurrentlyOn);
                el.title = isCurrentlyOn ? "Enabled" : "Disabled";
            }
        }

        async function saveGroqApiKey() {
            const input = document.getElementById("setting-groq-api-key-input");
            const statusEl = document.getElementById("setting-groq-api-key-status");
            const key = input.value.trim();
            if (!key) return;

            const modelSelect = document.getElementById("setting-groq-model-select");
            const model = modelSelect ? modelSelect.value : undefined;

            statusEl.textContent = "saving...";
            statusEl.className = "setting-note";

            try {
                const body = { groqApiKey: key };
                if (model) body.groqModel = model;

                await apiRequest("settings/ai-key", {
                    method: "POST",
                    body: JSON.stringify(body),
                });

                // Update in-memory state ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â backend is the source of truth
                state.settings = state.settings || {};
                state.settings.ai = state.settings.ai || {};
                state.settings.ai.groqApiKeyConfigured = true;
                if (model) state.settings.ai.groqModel = model;

                statusEl.textContent = "saved";
                statusEl.className = "setting-note status-ok";
                input.value = "";
                // Show masked indicator after save
                input.placeholder = "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢" + key.slice(-4);
            }
            catch (error) {
                statusEl.textContent = error.message || "failed";
                statusEl.className = "setting-note status-missing";
            }
        }

        function loadSavedGroqCredentials() {
            // Key status comes from backend settings (state.settings.ai) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â never from localStorage
            // Model preference also comes from backend settings
            const ai = state.settings?.ai || {};
            const keyInput = document.getElementById("setting-groq-api-key-input");
            const modelSelect = document.getElementById("setting-groq-model-select");

            if (ai.groqApiKeyConfigured && keyInput) {
                keyInput.placeholder = "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ (configured)";
            }
            if (ai.groqModel && modelSelect) {
                modelSelect.value = ai.groqModel;
                state._savedGroqModel = ai.groqModel;
            }
        }

        function selectedGroqModel() {
            return state.selectedGroqModel || state.settings?.ai?.groqModel || "llama-3.3-70b-versatile";
        }

        function groqModelOptions() {
            return Array.from(new Set([
                selectedGroqModel(),
                state.settings?.ai?.groqModel,
                ...state.groqModels.map((model) => model.id || model),
                ...SEEDED_GROQ_MODELS,
            ].filter(Boolean)));
        }

        function renderGroqModelControls() {
            const value = selectedGroqModel();
            const options = groqModelOptions();
            const settingSelect = document.getElementById("setting-groq-model-select");

            if (settingSelect) {
                settingSelect.innerHTML = options.map((model) => `<option value="${escapeHtml(model)}"${model === value ? " selected" : ""}>${escapeHtml(model)}</option>`).join("");
                settingSelect.value = value;
            }
        }

        function renderAiPlaceholders() {
            const workflowCount = document.getElementById("ai-workflow-count");
            const executionCount = document.getElementById("ai-execution-count");
            const errorCount = document.getElementById("ai-error-count");
            const lockedShell = document.getElementById("ai-locked-shell");
            const insight = state.aiInsight;
            const evidence = insight?.evidence || [];
            const actions = insight?.recommendedActions || [];

            if (state.aiInsightLoading) {
                state.aiKeyMissing = false;
            }

            if (lockedShell) {
                lockedShell.classList.toggle("is-locked", state.aiKeyMissing);
            }

            if (workflowCount) workflowCount.textContent = insight?.sourceCounts?.workflows ?? state.workflows.length;
            if (executionCount) executionCount.textContent = insight?.sourceCounts?.executions ?? state.executions.length;
            if (errorCount) errorCount.textContent = insight?.sourceCounts?.errors ?? state.errors.length;

            document.getElementById("ai-confidence").textContent = `${insight?.confidence ?? 0}%`;

            if (state.aiInsightLoading) {
                document.getElementById("ai-insight-status").outerHTML = `<span id="ai-insight-status" class="badge warn is-live"><span class="dot"></span>generating</span>`;
                document.getElementById("ai-insight-summary").textContent = "Sending current Flowwatch table context to Groq.";
                document.getElementById("ai-insight-cause").textContent = "The server is gathering workflows, executions, traces, errors, flags, and health checks before calling the model.";
                return;
            }

            if (state.aiKeyMissing) {
                document.getElementById("ai-insight-status").outerHTML = `<span id="ai-insight-status" class="badge warn"><span class="dot"></span>API key required</span>`;
                document.getElementById("ai-insight-summary").textContent = "Insert the API key in the settings page.";
                document.getElementById("ai-insight-cause").textContent = "AI Insights is locked until GROQ_API_KEY is configured on the backend.";
                document.getElementById("ai-insight-impact").textContent = "AI generation is disabled until the server has a Groq API key.";
                document.getElementById("ai-evidence-count").textContent = "0 items";
                document.getElementById("ai-action-count").textContent = "0 actions";
                document.getElementById("ai-evidence-preview").textContent = "Add GROQ_API_KEY in settings.";
                document.getElementById("ai-action-preview").textContent = "Open settings to configure the AI provider.";
                document.getElementById("ai-evidence-list").innerHTML = "";
                document.getElementById("ai-action-list").innerHTML = "";
                return;
            }

            if (state.aiInsightError) {
                document.getElementById("ai-insight-status").outerHTML = `<span id="ai-insight-status" class="badge bad"><span class="dot"></span>error</span>`;
                document.getElementById("ai-insight-summary").textContent = "Could not generate AI insight.";
                document.getElementById("ai-insight-cause").textContent = state.aiInsightError;
                return;
            }

            if (!insight) {
                document.getElementById("ai-insight-status").outerHTML = `<span id="ai-insight-status" class="badge warn"><span class="dot"></span>not loaded</span>`;
                document.getElementById("ai-evidence-list").innerHTML = "";
                document.getElementById("ai-action-list").innerHTML = "";
                return;
            }

            document.getElementById("ai-insight-status").outerHTML = state.aiModelConfigured
                ? `<span id="ai-insight-status" hidden></span>`
                : `<span id="ai-insight-status" class="badge warn"><span class="dot"></span>not configured</span>`;
            document.getElementById("ai-insight-summary").textContent = insight.summary;
            document.getElementById("ai-insight-cause").textContent = insight.likelyCause;
            document.getElementById("ai-insight-impact").textContent = insight.impact;
            document.getElementById("ai-evidence-count").textContent = `${evidence.length} item${evidence.length === 1 ? "" : "s"}`;
            document.getElementById("ai-action-count").textContent = `${actions.length} action${actions.length === 1 ? "" : "s"}`;
            document.getElementById("ai-evidence-preview").textContent = evidence[0] || "No evidence returned.";
            document.getElementById("ai-action-preview").textContent = actions[0] || "No action returned.";
            document.getElementById("ai-evidence-list").innerHTML = evidence.length ? evidence.map((item, index) => `
                <div class="ai-action">
                    <div class="ai-action-index">${index + 1}</div>
                    <div><div class="ai-action-title">${escapeHtml(item)}</div></div>
                </div>
            `).join("") : `<div class="empty-state"><div class="empty-title">No evidence returned</div></div>`;
            document.getElementById("ai-action-list").innerHTML = actions.length ? actions.map((item, index) => `
                <div class="ai-action">
                    <div class="ai-action-index">${index + 1}</div>
                    <div><div class="ai-action-title">${escapeHtml(item)}</div></div>
                </div>
            `).join("") : `<div class="empty-state"><div class="empty-title">No actions returned</div></div>`;
        }

        async function loadAiInsights() {
            state.aiInsightLoading = true;
            state.aiInsightError = null;
            state.aiKeyMissing = false;
            renderAiPlaceholders();

            try {
                const data = await apiRequest("ai-insights");
                state.aiInsight = data.insight || null;
                state.aiModelConfigured = Boolean(data.modelConfigured);
                state.aiKeyMissing = false;
            }
            catch (error) {
                state.aiInsight = null;
                state.aiModelConfigured = false;
                state.aiKeyMissing = error?.status === 428 || error?.code === "groq_api_key_missing";
                state.aiInsightError = state.aiKeyMissing ? null : error instanceof Error ? error.message : "AI insight request failed";
            }
            finally {
                state.aiInsightLoading = false;
                renderAiPlaceholders();
            }
        }

        async function loadGroqModelsForSettings() {
            try {
                const response = await fetch(apiPath("ai-models"));
                if (response.ok) {
                    const data = await response.json();
                    if (data && Array.isArray(data.models) && data.models.length > 0) {
                        state.groqModels = data.models;
                        renderGroqModelControls();
                    }
                }
            } catch (err) {
                console.error("Failed to load Groq models for settings:", err);
            }
        }

        function initAiChat() {
            state.aiMessages = [];
            renderMessages();
        }

        function saveMessages() {
            // AI chat history is intentionally session-only.
        }

        function clearAiChat() {
            state.aiMessages = [];
            saveMessages();
            renderMessages();
        }

        function renderMessages() {
            const welcomeEl = document.getElementById("ask-ai-welcome");
            const messagesEl = document.getElementById("ask-ai-messages");
            if (!welcomeEl || !messagesEl) return;

            const messages = state.aiMessages || [];
            if (messages.length === 0) {
                welcomeEl.style.display = "flex";
                messagesEl.style.display = "none";
                return;
            }

            welcomeEl.style.display = "none";
            messagesEl.style.display = "grid";

            messagesEl.innerHTML = messages.map(msg => `
                <div class="ask-message ${msg.role === 'user' ? 'user' : ''}">
                    ${msg.role !== 'user' ? `<div class="ask-avatar">AI</div>` : ''}
                    <div class="ask-bubble ${msg.role === 'user' ? '' : 'ai-response'}">
                        ${msg.role === 'user' ? escapeHtml(msg.content).replace(/\n/g, '<br>') : formatMessageMarkdown(msg.content)}
                    </div>
                    ${msg.role === 'user' ? `<div class="ask-avatar">ME</div>` : ''}
                </div>
            `).join("");

            // Scroll chat content wrapper to bottom
            const contentEl = document.getElementById("ask-ai-content");
            if (contentEl) {
                setTimeout(() => {
                    contentEl.scrollTop = contentEl.scrollHeight;
                }, 10);
            }
        }

        function formatMessageMarkdown(content) {
            const source = String(content || "").trim();
            if (source === "...") {
                return `<p>Thinking...</p>`;
            }

            const blocks = [];
            const codeBlocks = [];
            const withoutCode = source.replace(/```(?:[a-zA-Z0-9_-]+)?\n?([\s\S]*?)```/g, (_match, code) => {
                const token = `@@CODE_BLOCK_${codeBlocks.length}@@`;
                codeBlocks.push(`<pre><code>${escapeHtml(String(code).trim())}</code></pre>`);
                return `\n${token}\n`;
            });

            const lines = withoutCode.split(/\r?\n/);
            let paragraph = [];
            let listItems = [];
            let listType = null;

            const inlineFormat = (value) => escapeHtml(value)
                .replace(/`([^`]+)`/g, "<code>$1</code>")
                .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

            const flushParagraph = () => {
                if (!paragraph.length) return;
                blocks.push(`<p>${inlineFormat(paragraph.join(" "))}</p>`);
                paragraph = [];
            };

            const flushList = () => {
                if (!listItems.length) return;
                const tag = listType === "ol" ? "ol" : "ul";
                blocks.push(`<${tag}>${listItems.map(item => `<li>${inlineFormat(item)}</li>`).join("")}</${tag}>`);
                listItems = [];
                listType = null;
            };

            for (const rawLine of lines) {
                const line = rawLine.trim();
                if (!line) {
                    flushParagraph();
                    flushList();
                    continue;
                }

                const codeMatch = line.match(/^@@CODE_BLOCK_(\d+)@@$/);
                if (codeMatch) {
                    flushParagraph();
                    flushList();
                    blocks.push(codeBlocks[Number(codeMatch[1])] || "");
                    continue;
                }

                const headingMatch = line.match(/^(#{2,4})\s+(.+)$/);
                if (headingMatch) {
                    flushParagraph();
                    flushList();
                    const level = headingMatch[1].length <= 3 ? "h3" : "h4";
                    blocks.push(`<${level}>${inlineFormat(headingMatch[2])}</${level}>`);
                    continue;
                }

                const bulletMatch = line.match(/^[-*]\s+(.+)$/);
                if (bulletMatch) {
                    flushParagraph();
                    if (listType && listType !== "ul") flushList();
                    listType = "ul";
                    listItems.push(bulletMatch[1]);
                    continue;
                }

                const numberedMatch = line.match(/^\d+[.)]\s+(.+)$/);
                if (numberedMatch) {
                    flushParagraph();
                    if (listType && listType !== "ol") flushList();
                    listType = "ol";
                    listItems.push(numberedMatch[1]);
                    continue;
                }

                paragraph.push(line);
            }

            flushParagraph();
            flushList();

            return blocks.join("") || `<p>${inlineFormat(source)}</p>`;
        }

        async function sendMessage() {
            const inputEl = document.getElementById("ask-ai-input");
            if (!inputEl) return;

            const text = inputEl.value.trim();
            if (!text) return;

            // Push User Message
            state.aiMessages.push({ role: "user", content: text });

            inputEl.value = "";
            saveMessages();
            renderMessages();

            // Push Typing Indicator
            state.aiMessages.push({ role: "ai", content: "..." });
            renderMessages();

            try {
                // Prepare context/history (excluding the typing indicator)
                const history = state.aiMessages
                    .slice(0, state.aiMessages.length - 2)
                    .map(message => ({
                        role: message.role === "user" ? "user" : "assistant",
                        content: message.content
                    }));

                const response = await fetch(apiPath("ai-chat"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: text,
                        history: history
                    })
                });

                // Remove typing indicator
                state.aiMessages.pop();

                if (response.ok) {
                    const data = await response.json();
                    state.aiMessages.push({ role: "ai", content: data.response || "No response returned." });
                } else {
                    const err = await response.json();
                    state.aiMessages.push({ role: "ai", content: `Error: ${err?.error?.message || "Failed to communicate with Groq API"}` });
                }
            } catch (err) {
                // Remove typing indicator
                state.aiMessages.pop();
                state.aiMessages.push({ role: "ai", content: `Error: ${err.message || "Failed to send message."}` });
            } finally {
                saveMessages();
                renderMessages();
            }
        }

        function renderAll() {
            renderOverview();
            renderWorkflows();
            renderExecutions();
            renderFlags();
            renderErrors();
            renderTraces();
            renderHealth();
            renderSettings();
            renderAiPlaceholders();
        }

        function workflowDetail(workflow) {
            const execution = latestExecutionForWorkflow(workflow.name);
            const allExecs = allExecutionsForWorkflow(workflow.name);
            const steps = workflowExecutionSteps(workflow, execution);

            const execHistoryRows = allExecs.length
                ? allExecs.map((ex) => `
                    <tr data-execution="${escapeHtml(ex.id)}" style="cursor:pointer">
                        <td class="mono" style="font-size:11px">${escapeHtml(ex.id.slice(0, 8))}ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦</td>
                        <td>${badgeForStatus(ex.status)}</td>
                        <td class="mono" style="font-size:11px">${escapeHtml(ex.started || '-')}</td>
                        <td class="mono" style="font-size:11px">${escapeHtml(ex.finished || '-')}</td>
                        <td class="mono" style="font-size:11px">${escapeHtml(ex.failedStep !== '-' ? ex.failedStep : '')}</td>
                    </tr>
                `).join("")
                : `<tr><td colspan="5" style="padding:12px;color:var(--muted);text-align:center">No executions recorded yet</td></tr>`;

            return `
                <div class="field-grid" style="margin-bottom: 14px;">
                    <div class="field"><div class="field-label">Total runs</div><div class="field-value mono">${workflow.totalRuns || 0}</div></div>
                    <div class="field"><div class="field-label">Completed</div><div class="field-value mono" style="color:var(--green)">${workflow.completedRuns || 0}</div></div>
                    <div class="field"><div class="field-label">Failed</div><div class="field-value mono" style="color:var(--red)">${workflow.failedRuns || 0}</div></div>
                    <div class="field"><div class="field-label">Version</div><div class="field-value mono">v${escapeHtml(workflow.version)}</div></div>
                </div>
                <div class="panel" style="box-shadow:none;margin-bottom:14px">
                    <div class="panel-header">
                        <div class="panel-title">Execution history</div>
                    </div>
                    <div class="table-wrap" style="max-height:200px;overflow-y:auto">
                        <table>
                            <thead><tr>
                                <th>ID</th><th>Status</th><th>Started</th><th>Finished</th><th>Failed step</th>
                            </tr></thead>
                            <tbody>${execHistoryRows}</tbody>
                        </table>
                    </div>
                </div>
                <div class="panel" style="box-shadow: none;">
                    <div class="panel-header">
                        <div class="panel-title">Latest execution steps</div>
                    </div>
                    <div class="timeline">
                        ${steps.map((step) => `
                            <div class="timeline-item">
                                <div class="timeline-rail">
                                    ${step.error ? `
                                        <button type="button" class="timeline-node bad" title="Open ${escapeHtml(step.name)} error" data-workflow-error="${escapeHtml(workflow.name)}" data-step="${escapeHtml(step.name)}">${step.index + 1}</button>
                                    ` : `
                                        <div class="timeline-node ${step.status === "failed" ? "bad" : step.status === "completed" ? "ok" : "warn"}">${step.index + 1}</div>
                                    `}
                                    ${step.index === steps.length - 1 ? "" : `<div class="timeline-line"></div>`}
                                </div>
                                <div class="timeline-content">
                                    <div class="timeline-title"><span>${escapeHtml(step.name)}</span><span class="mono muted">${escapeHtml(step.duration)}</span></div>
                                    <div class="timeline-desc">${badgeForStepStatus(step.status)} <span class="mono subtle">attempts: ${escapeHtml(step.attempts)}</span></div>
                                    ${step.error ? `<button type="button" class="timeline-error-action" data-workflow-error="${escapeHtml(workflow.name)}" data-step="${escapeHtml(step.name)}">Open error: ${escapeHtml(step.error.name)}</button>` : ""}
                                </div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `;
        }

        function executionDetail(execution) {
            const workflow = state.workflows.find((item) => item.name === execution.workflow) || {
                name: execution.workflow,
                chain: (execution.steps || []).map((step) => step.stepName || step.name),
                lastStatus: execution.status,
                failures: execution.status === "failed" ? 1 : 0,
            };
            const steps = workflowExecutionSteps(workflow, execution);

            return `
                <div class="field-grid" style="margin-bottom: 14px;">
                    <div class="field"><div class="field-label">Workflow</div><div class="field-value">${escapeHtml(execution.workflow)}</div></div>
                    <div class="field"><div class="field-label">Status</div><div class="field-value">${badgeForStatus(execution.status)}</div></div>
                    <div class="field"><div class="field-label">Started</div><div class="field-value mono">${escapeHtml(execution.started)}</div></div>
                    <div class="field"><div class="field-label">Duration</div><div class="field-value mono">${escapeHtml(execution.duration)}</div></div>
                </div>
                <div class="panel" style="box-shadow: none;">
                    <div class="panel-header"><div class="panel-title">Step timeline</div></div>
                    <div class="timeline">
                        ${steps.map((step, index) => `
                            <div class="timeline-item">
                                <div class="timeline-rail">
                                    ${step.error ? `
                                        <button type="button" class="timeline-node bad" title="Open ${escapeHtml(step.name)} error" data-workflow-error="${escapeHtml(workflow.name)}" data-step="${escapeHtml(step.name)}">${index + 1}</button>
                                    ` : `
                                        <div class="timeline-node ${step.status === "failed" ? "bad" : step.status === "completed" ? "ok" : "warn"}">${index + 1}</div>
                                    `}
                                    ${index === steps.length - 1 ? "" : `<div class="timeline-line"></div>`}
                                </div>
                                <div class="timeline-content">
                                    <div class="timeline-title"><span>${escapeHtml(step.name)}</span><span class="mono muted">${escapeHtml(step.duration)}</span></div>
                                    <div class="timeline-desc">${badgeForStepStatus(step.status)} <span class="mono subtle">attempts: ${escapeHtml(step.attempts)}</span></div>
                                    ${step.error ? `<button type="button" class="timeline-error-action" data-workflow-error="${escapeHtml(workflow.name)}" data-step="${escapeHtml(step.name)}">Open error: ${escapeHtml(step.error.name)}</button>` : ""}
                                </div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `;
        }

        function errorDetail(error) {
            return `
                <div class="field-grid" style="margin-bottom: 14px;">
                    <div class="field"><div class="field-label">Name</div><div class="field-value">${escapeHtml(error.name)}</div></div>
                    <div class="field"><div class="field-label">Category</div><div class="field-value">${escapeHtml(error.category)}</div></div>
                    <div class="field"><div class="field-label">Level</div><div class="field-value">${escapeHtml(error.level)}</div></div>
                    <div class="field"><div class="field-label">Trace ID</div><div class="field-value mono">${escapeHtml(error.trace)}</div></div>
                </div>
                <div class="field" style="margin-bottom: 12px;"><div class="field-label">Message</div><div class="field-value">${escapeHtml(error.message)}</div></div>
                <pre class="code-box">Error: ${escapeHtml(error.message)}
    at runWorkflowStep (workflowWorker.ts:74:15)
    at executeWorkflow (workflowWorker.ts:39:9)
    at Worker.processJob (bullmq)</pre>
            `;
        }

        function traceDetail(trace) {
            const spans = trace.spans || [];

            return `
                <div class="field-grid" style="margin-bottom: 14px;">
                    <div class="field"><div class="field-label">Request</div><div class="field-value">${escapeHtml(trace.method)} ${escapeHtml(trace.path)}</div></div>
                    <div class="field"><div class="field-label">Status code</div><div class="field-value mono">${escapeHtml(trace.status)}</div></div>
                    <div class="field"><div class="field-label">IP address</div><div class="field-value mono">${escapeHtml(trace.ip)}</div></div>
                    <div class="field"><div class="field-label">Duration</div><div class="field-value mono">${escapeHtml(trace.duration)}ms</div></div>
                </div>
                <div class="timeline">
                    ${spans.map((span, index) => `
                        <div class="timeline-item">
                            <div class="timeline-rail">
                                <div class="timeline-node ${span.status === "failed" ? "bad" : "ok"}">${index + 1}</div>
                                ${index === spans.length - 1 ? "" : `<div class="timeline-line"></div>`}
                            </div>
                            <div class="timeline-content">
                                <div class="timeline-title"><span>${escapeHtml(span.name)}</span><span class="mono muted">${escapeHtml(span.duration)}ms</span></div>
                                <div class="timeline-desc">${badgeForStatus(span.status)}</div>
                            </div>
                        </div>
                    `).join("")}
                </div>
            `;
        }

        pageButtons.forEach((button) => button.addEventListener("click", () => showPage(button.dataset.pageButton)));
        document.querySelectorAll("[data-go]").forEach((button) => button.addEventListener("click", () => showPage(button.dataset.go)));
        document.getElementById("close-drawer").addEventListener("click", closeDrawer);
        document.getElementById("execution-status-filter").addEventListener("change", renderExecutions);
        document.getElementById("execution-search").addEventListener("input", renderExecutions);
        document.getElementById("error-category-filter").addEventListener("change", renderErrors);
        document.getElementById("error-search").addEventListener("input", renderErrors);
        document.getElementById("trace-status-filter").addEventListener("change", renderTraces);
        document.getElementById("trace-search").addEventListener("input", renderTraces);
        document.getElementById("refresh-button").addEventListener("click", loadDashboardData);
        document.getElementById("open-flag-modal").addEventListener("click", () => flagModal.classList.add("open"));
        document.getElementById("close-flag-modal").addEventListener("click", () => flagModal.classList.remove("open"));
        document.getElementById("cancel-flag").addEventListener("click", () => flagModal.classList.remove("open"));


        document.getElementById("setting-environment-save").addEventListener("click", () => {
            saveSetting("environment", document.getElementById("setting-environment-input").value.trim(), "setting-environment-status");
        });
        document.getElementById("setting-environment-input").addEventListener("keydown", (event) => {
            if (event.key === "Enter") document.getElementById("setting-environment-save").click();
        });

        document.getElementById("setting-dashboard-enabled").addEventListener("click", () => {
            toggleSetting("dashboardEnabled", "setting-dashboard-enabled");
        });

        document.getElementById("setting-groq-api-key-save").addEventListener("click", saveGroqApiKey);
        document.getElementById("setting-groq-api-key-input").addEventListener("keydown", (event) => {
            if (event.key === "Enter") saveGroqApiKey();
        });
        document.getElementById("setting-groq-model-save").addEventListener("click", async () => {
            const select = document.getElementById("setting-groq-model-select");
            const statusEl = document.getElementById("setting-groq-model-status");
            const model = select.value;
            if (!model) return;

            statusEl.textContent = "saving...";
            statusEl.className = "setting-note";

            try {
                const keyInput = document.getElementById("setting-groq-api-key-input");
                const key = keyInput ? keyInput.value.trim() : undefined;

                const body = { groqModel: model };
                if (key) body.groqApiKey = key;

                await apiRequest("settings/ai-key", {
                    method: "POST",
                    body: JSON.stringify(body),
                });

                state.settings.ai = state.settings.ai || {};
                state.settings.ai.groqModel = model;
                state.selectedGroqModel = model;
                if (key) {
                    state.settings.ai.groqApiKeyConfigured = true;
                    keyInput.value = "";
                }

                statusEl.textContent = "saved";
                statusEl.className = "setting-note status-ok";
                renderGroqModelControls();
            }
            catch (error) {
                statusEl.textContent = error.message || "failed";
                statusEl.className = "setting-note status-missing";
            }
        });

        document.getElementById("ask-ai-clear-btn").addEventListener("click", clearAiChat);
        document.getElementById("ask-ai-submit-btn").addEventListener("click", sendMessage);
        document.getElementById("ask-ai-input").addEventListener("keydown", (event) => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        });

        globalSearchInput.addEventListener("focus", () => {
            globalSearchShell.classList.add("open");
            renderGlobalSearch();
        });
        globalSearchInput.addEventListener("input", renderGlobalSearch);

        document.addEventListener("keydown", (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                globalSearchInput.focus();
            }

            if (event.key === "Escape") {
                globalSearchShell.classList.remove("open");
                closeDrawer();
                flagModal.classList.remove("open");
            }
        });

        document.getElementById("flag-form").addEventListener("submit", async (event) => {
            event.preventDefault();
            const draft = {
                key: document.getElementById("flag-key").value.trim(),
                description: document.getElementById("flag-description").value.trim(),
                enabled: false,
                rolloutPercentage: Number(document.getElementById("flag-rollout").value || 0),
                changedBy: "dashboard",
            };

            try {
                const { flag } = await apiRequest("flags", {
                    method: "POST",
                    body: JSON.stringify(draft),
                });
                state.flags.unshift(normalizeFlag(flag));
            }
            catch (error) {
                if (state.apiBacked) {
                    alert(error instanceof Error ? error.message : "Could not create feature flag.");
                    return;
                }

                state.flags.unshift(normalizeFlag({
                    key: draft.key,
                    description: draft.description,
                    enabled: draft.enabled,
                    rollout: draft.rolloutPercentage,
                    rules: 0,
                    changedBy: draft.changedBy,
                }));
            }

            document.getElementById("flag-form").reset();
            flagModal.classList.remove("open");
            renderFlags();
        });

        document.addEventListener("click", async (event) => {
            const askPrompt = event.target.closest("[data-ask-prompt]");
            if (askPrompt) {
                const askInput = document.getElementById("ask-ai-input");
                if (askInput) {
                    askInput.value = askPrompt.dataset.askPrompt;
                    askInput.focus();
                }
                return;
            }

            const workflowErrorNode = event.target.closest("[data-workflow-error]");
            if (workflowErrorNode) {
                event.stopPropagation();
                const workflow = state.workflows.find((item) => item.name === workflowErrorNode.dataset.workflowError);
                const stepName = workflowErrorNode.dataset.step;

                if (workflow && stepName) {
                    const execution = latestExecutionForWorkflow(workflow.name);
                    const step = workflowExecutionSteps(workflow, execution).find((item) => item.name === stepName);
                    const error = workflowErrorForStep(workflow.name, stepName);

                    if (step) {
                        openDrawer(`${stepName} error`, workflow.name, workflowStepErrorDetail(workflow, step, error));
                    }
                }

                return;
            }

            const routeTarget = event.target.closest("[data-go]");
            if (routeTarget) {
                showPage(routeTarget.dataset.go);
                globalSearchShell.classList.remove("open");
            }

            if (!event.target.closest("#global-search-shell")) {
                globalSearchShell.classList.remove("open");
            }

            const executionRow = event.target.closest("[data-execution]");
            if (executionRow) {
                const execution = state.executions.find((item) => item.id === executionRow.dataset.execution);
                if (execution) openDrawer(`Execution ${execution.id}`, execution.workflow, executionDetail(execution));
            }

            const errorRow = event.target.closest("[data-error]");
            if (errorRow) {
                const error = state.errors[Number(errorRow.dataset.error)];
                if (error) openDrawer(error.name, error.message, errorDetail(error));
            }

            const traceRow = event.target.closest("[data-trace]");
            if (traceRow) {
                const trace = state.traces.find((item) => item.id === traceRow.dataset.trace);
                if (trace) {
                    // Track selected trace so renderTraces() preserves it on refresh
                    state._selectedTraceId = trace.id;
                    // Highlight selected row
                    document.querySelectorAll("[data-trace]").forEach(r => r.classList.remove("selected-row"));
                    traceRow.classList.add("selected-row");
                    renderTraceGraph(trace);
                    openDrawer(`Trace ${trace.id}`, `${trace.method} ${trace.path}`, traceDetail(trace));
                }
            }

            const pinButton = event.target.closest("[data-toggle-pin]");
            if (pinButton) {
                event.stopPropagation();
                const workflow = state.workflows.find((item) => item.name === pinButton.dataset.togglePin);

                if (workflow) {
                    const pinnedCount = state.workflows.filter((item) => item.pinned).length;
                    if (!workflow.pinned && pinnedCount >= 4) {
                        alert("You can pin up to 4 workflows.");
                        return;
                    }

                    workflow.pinned = !workflow.pinned;
                    savePinnedWorkflowNames();
                    renderWorkflows();
                    return;
                }
            }

            const workflowRow = event.target.closest("[data-workflow]");
            if (workflowRow) {
                const workflow = state.workflows.find((item) => item.name === workflowRow.dataset.workflow);
                if (workflow) {
                    const execution = latestExecutionForWorkflow(workflow.name);
                    openDrawer(workflow.name, execution ? `latest execution ${execution.id}` : `version ${workflow.version}`, workflowDetail(workflow));
                }
            }

            const toggle = event.target.closest("[data-toggle-flag]");
            if (toggle) {
                event.stopPropagation();
                const flag = state.flags.find((item) => item.key === toggle.dataset.toggleFlag);
                if (flag) {
                    const nextEnabled = !flag.enabled;

                    try {
                        const { flag: updatedFlag } = await apiRequest(`flags/${encodeURIComponent(flag.key)}`, {
                            method: "PATCH",
                            body: JSON.stringify({
                                enabled: nextEnabled,
                                changedBy: "dashboard",
                            }),
                        });
                        Object.assign(flag, normalizeFlag(updatedFlag));
                    }
                    catch (error) {
                        if (state.apiBacked) {
                            alert(error instanceof Error ? error.message : "Could not update feature flag.");
                            return;
                        }

                        flag.enabled = nextEnabled;
                    }

                    renderFlags();
                }
            }

            const deleteFlag = event.target.closest("[data-delete-flag]");
            if (deleteFlag) {
                event.stopPropagation();
                const flagKey = deleteFlag.dataset.deleteFlag;

                try {
                    await apiRequest(`flags/${encodeURIComponent(flagKey)}`, {
                        method: "DELETE",
                        body: JSON.stringify({ changedBy: "dashboard" }),
                    });
                }
                catch (error) {
                    if (state.apiBacked) {
                        alert(error instanceof Error ? error.message : "Could not delete feature flag.");
                        return;
                    }
                }

                state.flags = state.flags.filter((item) => item.key !== flagKey);
                renderFlags();
            }

            const flagRow = event.target.closest("[data-flag]");
            if (flagRow && !event.target.closest("[data-toggle-flag]") && !event.target.closest("[data-delete-flag]")) {
                const flag = state.flags.find((item) => item.key === flagRow.dataset.flag);
                if (flag) {
                    openDrawer(escapeHtml(flag.key), escapeHtml(flag.description || "Feature flag"), `
                        <div class="field-grid" style="margin-bottom:16px">
                            <div class="field"><div class="field-label">Key</div><div class="field-value mono">${escapeHtml(flag.key)}</div></div>
                            <div class="field"><div class="field-label">Status</div><div class="field-value">${flag.enabled ? '<span class="badge ok"><span class="dot"></span>enabled</span>' : '<span class="badge bad"><span class="dot"></span>disabled</span>'}</div></div>
                            <div class="field"><div class="field-label">Rules</div><div class="field-value mono">${escapeHtml(flag.rules)}</div></div>
                            <div class="field"><div class="field-label">Changed by</div><div class="field-value mono">${escapeHtml(flag.changedBy || '-')}</div></div>
                        </div>
                        <div style="margin-bottom:16px">
                            <div class="field-label" style="margin-bottom:8px">Rollout percentage</div>
                            <div style="display:flex;align-items:center;gap:12px">
                                <input id="drawer-rollout-slider" type="range" min="0" max="100" value="${escapeHtml(flag.rollout)}" style="flex:1;accent-color:var(--indigo)">
                                <input id="drawer-rollout-input" type="number" min="0" max="100" value="${escapeHtml(flag.rollout)}" class="input" style="width:70px;text-align:center">
                                <span class="muted" style="font-size:12px">%</span>
                            </div>
                            <div class="bar" style="margin-top:10px"><div id="drawer-rollout-bar" class="bar-fill" style="width:${escapeHtml(flag.rollout)}%"></div></div>
                        </div>
                        <button id="drawer-save-rollout" class="button" type="button" style="width:100%">Save rollout %</button>
                        <span id="drawer-rollout-status" class="setting-note" style="display:block;margin-top:8px"></span>
                    `);

                    const slider = document.getElementById("drawer-rollout-slider");
                    const numInput = document.getElementById("drawer-rollout-input");
                    const barEl = document.getElementById("drawer-rollout-bar");
                    const syncUI = (val) => { slider.value = val; numInput.value = val; barEl.style.width = val + "%"; };
                    slider.addEventListener("input", () => syncUI(slider.value));
                    numInput.addEventListener("input", () => syncUI(Math.min(100, Math.max(0, Number(numInput.value)))));

                    document.getElementById("drawer-save-rollout").addEventListener("click", async () => {
                        const pct = Math.min(100, Math.max(0, Number(numInput.value)));
                        const statusEl = document.getElementById("drawer-rollout-status");
                        statusEl.textContent = "saving...";
                        statusEl.className = "setting-note";
                        try {
                            const { flag: updated } = await apiRequest(`flags/${encodeURIComponent(flag.key)}`, {
                                method: "PATCH",
                                body: JSON.stringify({ rolloutPercentage: pct, changedBy: "dashboard" }),
                            });
                            Object.assign(flag, normalizeFlag(updated));
                            statusEl.textContent = "saved \u2713";
                            statusEl.className = "setting-note status-ok";
                            renderFlags();
                        } catch (err) {
                            statusEl.textContent = err.message || "failed";
                            statusEl.className = "setting-note status-missing";
                        }
                    });
                }
            }
        });

        loadSavedGroqCredentials();
        loadDashboardData();
    </script>
</body>

</html>
```

---

<a id="packages-flowwatch-src-engine-background-queues-workflowqueuets"></a>
### [packages/flowwatch/src/engine/background/queues/workflowQueue.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/engine/background/queues/workflowQueue.ts)

```typescript
import { Queue } from "bullmq"

export interface WorkflowJobData {
    executionId: string
}

export function createWorkflowQueue(redisUrl: string) {
    return new Queue<WorkflowJobData>("workflows", {
        prefix: "{flowwatch}",
        connection: {
            url: redisUrl,
        },
    })
}

export async function addWorkflowJobToQueue(queue: ReturnType<typeof createWorkflowQueue>,executionId: string):Promise<void> {
    await queue.add("run-workflow", {
        executionId,
    })
}
```

---

<a id="packages-flowwatch-src-engine-background-workers-workflowworkerts"></a>
### [packages/flowwatch/src/engine/background/workers/workflowWorker.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/engine/background/workers/workflowWorker.ts)

```typescript
import { Worker } from "bullmq"
import type { Pool } from "pg"
import type { WorkflowJobData } from "../queues/workflowQueue.js"
import type { RegisteredWorkflow } from "../../workflows/types.js"
import type { TraceEngine } from "../../trace/traceEngine.js"
import type { CaptureErrorFunction } from "../../errors/errorEngine.js"

export interface WorkflowWorkerOptions {
    redisUrl: string
    pool: Pool
    getWorkflow: (name: string) => RegisteredWorkflow | undefined
    traceEngine: TraceEngine
    captureError: CaptureErrorFunction
}
import { getWorkflowExecution, getWorkflowExecutionSteps, markWorkflowExecutionCompleted, markWorkflowExecutionFailed, markWorkflowExecutionRunning, markWorkflowStepCompleted, markWorkflowStepFailed, markWorkflowStepRunning, } from "../../../persistence/repositories/workflows/workflowRepository.js"

export function createWorkflowWorker(options: WorkflowWorkerOptions): Worker<WorkflowJobData> {
    return new Worker<WorkflowJobData>(
        "workflows",
        async (job) => {
            await executeWorkflow(job.data.executionId, options)
        },
        {
            prefix: "{flowwatch}",
            connection: {
                url: options.redisUrl,
            },
        }
    )
}

export async function executeWorkflow(executionId: string, worker: WorkflowWorkerOptions): Promise<void> {
    const result = await getWorkflowExecution(worker.pool, executionId)
    if (!result) {
        throw new Error("No workflow exists with that id")
    }

    const executions = await getWorkflowExecutionSteps(worker.pool, executionId)
    if (executions.length === 0) {
        throw new Error("No workflow execution steps exists")
    }

    const workflowToExecute = worker.getWorkflow(result.workflow_name)
    if (!workflowToExecute) {
        throw new Error("Cannot find workflow in the working memory")
    }

    await markWorkflowExecutionRunning(worker.pool, executionId)

    try {
        let lastStepOutput: unknown

        for (const stepExecution of executions) {
            if (stepExecution.status === "completed") {
                continue
            }

            const registeredStep = workflowToExecute.steps.find((step) => {
                return step.name === stepExecution.step_name
            })

            if (!registeredStep) {
                throw new Error(`Cannot find registered step: ${stepExecution.step_name}`)
            }

            let attempt = stepExecution.attempt_count
            const maxAttempts = stepExecution.max_retries + 1

            while (attempt < maxAttempts) {
                await markWorkflowStepRunning(worker.pool, stepExecution.id)

                try {
                    lastStepOutput = await worker.traceEngine.trace(
                        `flowwatch.workflow.step.${stepExecution.step_name}`,
                        "workflow_step",
                        async () => registeredStep.run(stepExecution.input),
                        {
                            workflowName: result.workflow_name,
                            workflowVersion: result.workflow_version,
                            executionId,
                            stepExecutionId: stepExecution.id,
                            stepName: stepExecution.step_name,
                            stepIndex: stepExecution.step_index,
                            attempt: attempt + 1,
                        }
                    )
                    await markWorkflowStepCompleted(worker.pool, stepExecution.id, lastStepOutput)
                    break
                }
                catch (error) {
                    attempt += 1
                    await worker.captureError(error, {
                        source: "workflow",
                        category: "server",
                        level: "error",
                        statusCode: 500,
                        metadata: {
                            workflowName: result.workflow_name,
                            workflowVersion: result.workflow_version,
                            executionId,
                            stepExecutionId: stepExecution.id,
                            stepName: stepExecution.step_name,
                            stepIndex: stepExecution.step_index,
                            attempt,
                            maxAttempts,
                        },
                    })
                    await markWorkflowStepFailed(worker.pool, stepExecution.id, error)

                    if (attempt >= maxAttempts) {
                        throw error
                    }
                }
            }
        }

        await markWorkflowExecutionCompleted(worker.pool, executionId, lastStepOutput)
    }
    catch (error) {
        await worker.captureError(error, {
            source: "workflow",
            category: "server",
            level: "error",
            statusCode: 500,
            metadata: {
                workflowName: result.workflow_name,
                workflowVersion: result.workflow_version,
                executionId,
            },
        })
        await markWorkflowExecutionFailed(worker.pool, executionId, error)
        throw error
    }
}
```

---

<a id="packages-flowwatch-src-engine-errors-errorenginets"></a>
### [packages/flowwatch/src/engine/errors/errorEngine.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/engine/errors/errorEngine.ts)

```typescript
import type { ErrorRequestHandler } from "express"
import type { Pool } from "pg"
import type { Client } from "@elastic/elasticsearch"
import { createHash } from "node:crypto"
import { getCurrentTraceId, getCurrentSpanId } from "../../runtime/tracing/traceContext.js"
import {
    createError,
    type ErrorCategory,
    type ErrorLevel,
    type ErrorRow,
    type ErrorSource,
} from "../../persistence/repositories/errors/errorRepository.js"
import { indexError } from "../../search/elasticsearch/indexer.js"

export interface NormalizedError {
    name: string
    message: string
    stack?: string
}

export interface ErrorEngineOptions {
    pool: Pool
    elasticsearchClient: Client
}

export interface CaptureErrorOptions {
    source: ErrorSource
    category?: ErrorCategory
    level?: ErrorLevel
    statusCode?: number
    metadata?: unknown
    occurredAt?: Date
}

export type CaptureErrorFunction = (
    error: unknown,
    options: CaptureErrorOptions
) => Promise<ErrorRow | undefined>

export function createErrorHandler(options: ErrorEngineOptions): ErrorRequestHandler {
    return async function flowwatchErrorHandler(error, req, res, next) {
        const normalizedError = normalizeError(error)
        const statusCode = getStatusCode(error, res.statusCode)

        // Log every uncaught error with route info so we can trace the primary cause
        console.error(`[Flowwatch] Unhandled error on ${req.method} ${req.originalUrl || req.path}:`, normalizedError.message)

        await captureError(options, error, {
            source: "http",
            category: getErrorCategory(statusCode),
            level: "error",
            statusCode,
            metadata: {
                method: req.method,
                path: req.originalUrl || req.path,
            },
        })

        if (res.headersSent) {
            return next(error)
        }

        res.status(statusCode).json({
            message: statusCode >= 500 ? "Internal server error" : normalizedError.message,
        })
    }
}

export async function captureError(engineOptions: ErrorEngineOptions,error: unknown,captureOptions: CaptureErrorOptions): Promise<ErrorRow | undefined> {
    const normalizedError = normalizeError(error)
    const statusCode = captureOptions.statusCode ?? getStatusCode(error, 500)
    const category = captureOptions.category ?? getErrorCategory(statusCode)
    const fingerprint = createErrorFingerprint({
        source: captureOptions.source,
        category,
        name: normalizedError.name,
        message: normalizedError.message,
        statusCode,
    })

    try {
        const storedError = await createError(engineOptions.pool, {
            traceId: getCurrentTraceId(),
            spanId: getCurrentSpanId(),
            source: captureOptions.source,
            category,
            level: captureOptions.level ?? "error",
            message: normalizedError.message,
            stack: normalizedError.stack,
            name: normalizedError.name,
            statusCode,
            fingerprint,
            metadata: captureOptions.metadata,
            occurredAt: captureOptions.occurredAt,
        })

        try {
            await indexError(engineOptions.elasticsearchClient, storedError)
        }
        catch (errorIndexingFailure) {
            console.error("Failed to index error", errorIndexingFailure)
        }

        return storedError
    }
    catch (errorCaptureFailure) {
        console.error("[Flowwatch] Failed to capture error", errorCaptureFailure)
        return undefined
    }
}

export function normalizeError(error: unknown): NormalizedError {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack,
        }
    }

    if (typeof error === "string") {
        return {
            name: "UnknownError",
            message: error,
        }
    }

    return {
        name: "UnknownError",
        message: "Unknown error",
    }
}

export function getStatusCode(error: unknown, responseStatusCode: number): number {
    if (typeof error === "object" && error !== null) {
        const errorObject = error as { statusCode?: unknown; status?: unknown }

        if (typeof errorObject.statusCode === "number") {
            return errorObject.statusCode
        }

        if (typeof errorObject.status === "number") {
            return errorObject.status
        }
    }

    if (responseStatusCode >= 400) {
        return responseStatusCode
    }

    return 500
}


export function getErrorCategory(statusCode: number): ErrorCategory {
    if (statusCode >= 400 && statusCode < 500) {
        return "client"
    }

    if (statusCode >= 500 && statusCode < 600) {
        return "server"
    }

    return "unknown"
}

interface ErrorFingerprintInput {
    source: ErrorSource
    category: ErrorCategory
    name: string
    message: string
    statusCode: number
}

function createErrorFingerprint(input: ErrorFingerprintInput): string {
    return createHash("sha256")
        .update(`${input.source}:${input.category}:${input.name}:${input.message}:${input.statusCode}`)
        .digest("hex")
}
```

---

<a id="packages-flowwatch-src-engine-flags-evaluateflagts"></a>
### [packages/flowwatch/src/engine/flags/evaluateFlag.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/engine/flags/evaluateFlag.ts)

```typescript
import type { FeatureFlagRow, FeatureFlagRuleRow } from "../../persistence/repositories/flags/flagRepository.js"
import type { FlagContext } from "./types.js"
import { getRolloutBucket } from "./hashRollout.js"

export function evaluateFlag(flag: FeatureFlagRow | undefined,rules: FeatureFlagRuleRow[],context: FlagContext = {}): boolean {
    if (!flag) {
        return false
    }

    if (!flag.enabled) {
        return false
    }

    for (const rule of rules) {
        if (rule.enabled && ruleMatches(rule,context)) {
            return true
        }
    }

    if (flag.rollout_percentage >= 100) {
        return true
    }

    if (flag.rollout_percentage <= 0) {
        return false
    }

    if (!context.userId) {
        return false
    }

    const bucket = getRolloutBucket(flag.key, context.userId)

    return bucket < flag.rollout_percentage
}

function ruleMatches(rule: FeatureFlagRuleRow, context: FlagContext): boolean {
    const contextValue = context[rule.attribute]

    switch (rule.operator) {
        case "equals":
            return contextValue === rule.value
        case "not_equals":
            return contextValue !== rule.value
        case "in":
            return Array.isArray(rule.value) && rule.value.includes(contextValue)
        case "not_in":
            return Array.isArray(rule.value) && !rule.value.includes(contextValue)
        case "contains":
            return typeof contextValue === "string" && typeof rule.value === "string" && contextValue.includes(rule.value)
        case "starts_with":
            return typeof contextValue === "string" && typeof rule.value === "string" && contextValue.startsWith(rule.value)
        case "ends_with":
            return typeof contextValue === "string" && typeof rule.value === "string" && contextValue.endsWith(rule.value)
        case "greater_than":
            return typeof contextValue === "number" && typeof rule.value === "number" && contextValue > rule.value
        case "less_than":
            return typeof contextValue === "number" && typeof rule.value === "number" && contextValue < rule.value
        default:
            return false
    }
}
```

---

<a id="packages-flowwatch-src-engine-flags-flagenginets"></a>
### [packages/flowwatch/src/engine/flags/flagEngine.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/engine/flags/flagEngine.ts)

```typescript
import type { Pool } from "pg"
import { getFlagByKey, listFlagRules } from "../../persistence/repositories/flags/flagRepository.js"
import type { CaptureErrorFunction } from "../errors/errorEngine.js"
import type { TraceEngine } from "../trace/traceEngine.js"
import { evaluateFlag } from "./evaluateFlag.js"
import type { EvaluateFlag, FlagContext } from "./types.js"
import type { Redis } from "ioredis"
export interface FlagEngine {
    flag: EvaluateFlag
}

export function createFlagEngine(
    pool: Pool,
    traceEngine: TraceEngine,
    captureError: CaptureErrorFunction,
    redisClient: Redis
): FlagEngine {
    async function flag(key: string, context: FlagContext = {}): Promise<boolean> {
        try {
            return await traceEngine.trace("flowwatch.feature_flag.evaluate", "feature_flag", async () => {
                const cacheKey = `flowwatch:flags:${key}`

                // Cache read — non-fatal, falls back to DB on any Redis error
                try {
                    const cachedValue = await redisClient.get(cacheKey)
                    if (cachedValue) {
                        const cached = JSON.parse(cachedValue)
                        return evaluateFlag(cached.flag, cached.rules, context)
                    }
                } catch {
                    // Redis unavailable or version mismatch — continue to DB
                }

                const storedFlag = await getFlagByKey(pool, key)
                if (!storedFlag) {
                    return false
                }
                const rules = await listFlagRules(pool, key)

                // Cache write — non-fatal
                try {
                    await redisClient.set(
                        cacheKey,
                        JSON.stringify({ flag: storedFlag, rules }),
                        "EX",
                        60
                    )
                } catch {
                    // Cache write failed — not critical
                }

                return evaluateFlag(storedFlag, rules, context)
            }, {
                flagKey: key,
            })
        }
        catch (error) {
            await captureError(error, {
                source: "feature_flag",
                category: "server",
                level: "error",
                statusCode: 500,
                metadata: {
                    flagKey: key,
                },
            })

            throw error
        }
    }

    return {
        flag,
    }
}
```

---

<a id="packages-flowwatch-src-engine-flags-hashrolloutts"></a>
### [packages/flowwatch/src/engine/flags/hashRollout.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/engine/flags/hashRollout.ts)

```typescript
import { createHash } from "node:crypto"

export function getRolloutBucket(flagKey: string, userId: string): number {
    const hash = createHash("sha256")
        .update(`${flagKey}:${userId}`)
        .digest("hex")

    const firstEightHexChars = hash.slice(0, 8)
    const value = Number.parseInt(firstEightHexChars, 16)

    return value % 100
}
```

---

<a id="packages-flowwatch-src-engine-flags-typests"></a>
### [packages/flowwatch/src/engine/flags/types.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/engine/flags/types.ts)

```typescript
export interface FlagContext {
    userId?: string
    role?: string
    email?: string
    [key: string]: unknown
}

export type EvaluateFlag = (
    key: string,
    context?: FlagContext
) => Promise<boolean>
```

---

<a id="packages-flowwatch-src-engine-trace-traceenginets"></a>
### [packages/flowwatch/src/engine/trace/traceEngine.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/engine/trace/traceEngine.ts)

```typescript
import type { Client } from "@elastic/elasticsearch"
import type { Pool } from "pg"
import { createTraceSpan, finishTraceSpan, type TraceSpanType, type TraceStatus } from "../../persistence/repositories/traces/traceRepository.js"
import { getCurrentSpanId, getCurrentTraceId, runWithSpanContext } from "../../runtime/tracing/traceContext.js"
import { indexTraceSpan } from "../../search/elasticsearch/indexer.js"
import { captureError } from "../errors/errorEngine.js"

export interface ActiveTraceSpan {
    id: string
    startedAt: number
}

export interface StartSpanOptions {
    metadata?: unknown
}

export interface EndSpanOptions {
    metadata?: unknown
}

export type TraceCallback<T> = () => T | Promise<T>

export type TraceFunction = <T>(
    name: string,
    type: TraceSpanType,
    callback: TraceCallback<T>,
    metadata?: unknown
) => Promise<T>

export interface TraceEngine {
    trace: TraceFunction
}

export interface TraceEngineOptions {
    pool: Pool
    elasticsearchClient: Client
}

export function createTraceEngine(options: TraceEngineOptions): TraceEngine {
    const { pool, elasticsearchClient } = options

    async function trace<T>(name: string, type: TraceSpanType, callback: TraceCallback<T>, metadata?: unknown): Promise<T> {
        const span = await startSpan(pool, name, type, { metadata })

        try {
            const result = await runInsideSpan(span, callback)
            await endSpan(pool, elasticsearchClient, span, "ok")
            return result
        }
        catch (error) {
            await endSpan(pool, elasticsearchClient, span, "error")
            await captureError(options, error, {
                source: "unknown",
                category: "server",
                level: "error",
                statusCode: 500,
                metadata: {
                    spanName: name,
                    spanType: type,
                    spanMetadata: metadata,
                },
            })
            throw error
        }
    }

    return {
        trace,
    }
}

export async function startSpan(pool: Pool, name: string, type: TraceSpanType, options: StartSpanOptions = {}): Promise<ActiveTraceSpan | undefined> {
    const traceId = getCurrentTraceId()

    if (!traceId) {
        return undefined
    }

    const span = await createTraceSpan(pool, {
        traceId,
        parentSpanId: getCurrentSpanId(),
        name,
        type,
        metadata: options.metadata,
    })

    return {
        id: span.id,
        startedAt: Date.now(),
    }
}

export async function endSpan(pool: Pool, elasticsearchClient: Client, span: ActiveTraceSpan | undefined, status: TraceStatus, options: EndSpanOptions = {}): Promise<void> {
    if (!span) {
        return
    }

    const finishedSpan = await finishTraceSpan(pool, {
        spanId: span.id,
        status,
        durationMs: Date.now() - span.startedAt,
        metadata: options.metadata,
    })

    if (!finishedSpan) {
        return
    }

    try {
        await indexTraceSpan(elasticsearchClient, finishedSpan)
    }
    catch (traceIndexingFailure) {
        console.error("Failed to index trace span", traceIndexingFailure)
    }
}

export function runInsideSpan<T>(span: ActiveTraceSpan | undefined, callback: TraceCallback<T>): T | Promise<T> {
    if (!span) {
        return callback()
    }

    return runWithSpanContext(span.id, callback)
}
```

---

<a id="packages-flowwatch-src-engine-workflows-typests"></a>
### [packages/flowwatch/src/engine/workflows/types.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/engine/workflows/types.ts)

```typescript
export type WorkflowStepHandler = (input: unknown) => unknown | Promise<unknown>
export type WorkflowStepInputResolver = (workflowInput: unknown) => unknown

export interface WorkflowStep {
    name: string
    run: WorkflowStepHandler
    retries?: number
    input?: unknown | WorkflowStepInputResolver
}

export interface RegisteredWorkflow {
    name: string
    steps: WorkflowStep[]
    dbWorkflow: {
        id: string
        name: string
        version: number
    }
    dbSteps: {
        id: string
        workflowId: string
        stepIndex: number
        name: string
        maxRetries: number
    }[]
}

export type RegisterWorkflow = (
    name: string,
    steps: WorkflowStep[]
) => Promise<void>


export type TriggerWorkflow = (
    name: string,
    input?: unknown
) => Promise<{ executionId: string }>
```

---

<a id="packages-flowwatch-src-engine-workflows-workflowenginets"></a>
### [packages/flowwatch/src/engine/workflows/workflowEngine.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/engine/workflows/workflowEngine.ts)

```typescript
import type { Pool } from "pg"
import { insertWorkflow, insertWorkflowExecution } from "../../persistence/repositories/workflows/workflowRepository.js"
import { addWorkflowJobToQueue, type createWorkflowQueue } from "../background/queues/workflowQueue.js"
import type { TraceEngine } from "../trace/traceEngine.js"
import type { RegisterWorkflow, RegisteredWorkflow, TriggerWorkflow, WorkflowStep } from "./types.js"
export interface WorkflowEngine {
    workflow: RegisterWorkflow
    trigger: TriggerWorkflow
    getWorkflow: (name: string) => RegisteredWorkflow | undefined
}

export interface WorkflowEngineOptions {
    pool: Pool
    workflowQueue: ReturnType<typeof createWorkflowQueue> | null
    traceEngine: TraceEngine
}

export function createWorkflowEngine(options: WorkflowEngineOptions): WorkflowEngine {
    const { pool, workflowQueue, traceEngine } = options
    const registry = new Map<string, RegisteredWorkflow>()

    async function workflow(name: string, steps: WorkflowStep[]): Promise<void> {
        return traceEngine.trace("flowwatch.workflow.register", "workflow_step", async () => {
            validateWorkflow(name, steps)

            const workflowSteps = []

            for (const step of steps) {
                workflowSteps.push({
                    name: step.name,
                    maxRetries: step.retries ?? 0,
                })
            }

            const insertedWorkflow = await insertWorkflow(pool, {
                name,
                steps: workflowSteps,
            })

            const registeredWorkflow: RegisteredWorkflow = {
                name,
                steps,
                dbWorkflow: insertedWorkflow.workflow,
                dbSteps: insertedWorkflow.steps,
            }

            registry.set(name, registeredWorkflow)
        }, 
        {
            workflowName: name,
            stepCount: steps.length,
        })
    }

    function getWorkflow(name: string): RegisteredWorkflow | undefined {
        return registry.get(name)
    }

    async function trigger(name: string, input?: unknown): Promise<{ executionId: string }> {
        return traceEngine.trace("flowwatch.workflow.trigger", "workflow_step", async () => {
            const workflow = getWorkflow(name)

            if (!workflow) {
                throw new Error(`workflow not found: ${name}`)
            }

            const executionSteps = []
            
            for (const step of workflow.dbSteps) {
                const registeredStep = workflow.steps.find((workflowStep) => {
                    return workflowStep.name === step.name
                })

                if (!registeredStep) {
                    throw new Error(`workflow step not found in registry: ${step.name}`)
                }

                executionSteps.push({
                    workflowStepId: step.id,
                    stepIndex: step.stepIndex,
                    stepName: step.name,
                    maxRetries: step.maxRetries,
                    input: resolveStepInput(registeredStep, input),
                })
            }

            const execution = await insertWorkflowExecution(pool, {
                workflowId: workflow.dbWorkflow.id,
                workflowName: workflow.dbWorkflow.name,
                workflowVersion: workflow.dbWorkflow.version,
                input,
                steps: executionSteps,
            })

            if (workflowQueue === null) {
                console.warn(`[Flowwatch] ⚠️  Workflow "${name}" execution recorded but NOT queued — Redis queue unavailable. Upgrade to Redis ≥ 5 to enable background execution.`)
                return { executionId: execution.executionId }
            }

            await addWorkflowJobToQueue(workflowQueue, execution.executionId)

            return execution
        }, {
            workflowName: name,
        })
    }
    return {
        workflow,
        trigger,
        getWorkflow
    }
}

function resolveStepInput(step: WorkflowStep, workflowInput: unknown): unknown {
    if (typeof step.input === "function") {
        return step.input(workflowInput)
    }

    if (step.input !== undefined) {
        return step.input
    }

    return workflowInput
}

function validateWorkflow(name: string, steps: WorkflowStep[]): void {
    if (name.trim().length === 0) {
        throw new Error("workflow name must be a non-empty string")
    }

    if (steps.length === 0) {
        throw new Error("workflow steps must not be empty")
    }

    const stepNames = new Set<string>()

    for (const step of steps) {
        if (step.name.trim().length === 0) {
            throw new Error("workflow step name must be a non-empty string")
        }

        if (typeof step.run !== "function") {
            throw new Error(`workflow step ${step.name} run must be a function`)
        }

        if (step.retries !== undefined && (!Number.isInteger(step.retries) || step.retries < 0)) {
            throw new Error(`workflow step ${step.name} retries must be a non-negative integer`)
        }

        if (stepNames.has(step.name)) {
            throw new Error(`workflow step name must be unique: ${step.name}`)
        }

        stepNames.add(step.name)
    }
}
```

---

<a id="packages-flowwatch-src-indexts"></a>
### [packages/flowwatch/src/index.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/index.ts)

```typescript
export { createFlowwatch } from "./createFlowwatch.js"
export type { Flowwatch } from "./createFlowwatch.js"
export { startSidecar, createSidecarRouter } from "./server/sidecarServer.js"
export type { FlowwatchConfig } from "./types/index.js"
export type { TriggerWorkflow, WorkflowStep, WorkflowStepHandler } from "./engine/workflows/types.js"
export type { EvaluateFlag, FlagContext } from "./engine/flags/types.js"
export type { ActiveTraceSpan, TraceFunction } from "./engine/trace/traceEngine.js"
export type { TraceSpanType, TraceStatus } from "./persistence/repositories/traces/traceRepository.js"
export { getCurrentClientIp, getCurrentSpanId, getCurrentTraceId } from "./runtime/tracing/traceContext.js"
export { createRequestTracingMiddleware } from "./runtime/tracing/tracingMiddleware.js"
```

---

<a id="packages-flowwatch-src-persistence-cache-redisclientts"></a>
### [packages/flowwatch/src/persistence/cache/redisClient.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/persistence/cache/redisClient.ts)

```typescript
import {Redis} from "ioredis";


export function createRedisClient(redisUrl:string){
    return new Redis(redisUrl);
}   
```

---

<a id="packages-flowwatch-src-persistence-db-postgrests"></a>
### [packages/flowwatch/src/persistence/db/postgres.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/persistence/db/postgres.ts)

```typescript
import { Pool } from "pg"
import type { PoolConfig } from "pg"

export function createPostgresPool(config: PoolConfig): Pool {
    return new Pool(config)
}
```

---

<a id="packages-flowwatch-src-persistence-migrations-migrationrunnerts"></a>
### [packages/flowwatch/src/persistence/migrations/migrationRunner.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/persistence/migrations/migrationRunner.ts)

```typescript
import type { Pool, PoolClient } from "pg"
import type { Migration } from "./migrations.js"
import { withTransaction } from "../transaction.js"

export async function runMigrations(pool: Pool, migrationsToRun: Migration[]) {
    await createMigrationsTable(pool)

    await withMigrationLock(pool, async () => {
        const appliedMigrations = await getAppliedMigrations(pool)

        for (const migration of migrationsToRun) {
            if (appliedMigrations.has(migration.name)) {
                continue
            }
            await withTransaction(pool, async (client) => {
                await client.query(migration.up)
                await client.query(
                    "INSERT INTO flowwatch_migrations (name) VALUES ($1)",
                    [migration.name]
                )
            })
            appliedMigrations.add(migration.name)
        }
    })
}

async function withMigrationLock<T>(pool: Pool, fn: () => Promise<T>): Promise<T> {
    const client = await pool.connect()
    try {
        await client.query("SELECT pg_advisory_lock(hashtext('flowwatch:migrations'))")
        return await fn()
    } finally {
        await client.query("SELECT pg_advisory_unlock(hashtext('flowwatch:migrations'))")
        client.release()
    }
}

async function createMigrationsTable(pool: Pool) {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS flowwatch_migrations (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    `)
}
async function getAppliedMigrations(pool: Pool): Promise<Set<string>> {
    const result = await pool.query("SELECT name FROM flowwatch_migrations")

    const migrationNames: string[] = []

    for (const row of result.rows) {
        migrationNames.push(row.name)
    }

    const appliedMigrations = new Set<string>(migrationNames)

    return appliedMigrations
}
```

---

<a id="packages-flowwatch-src-persistence-migrations-migrationsts"></a>
### [packages/flowwatch/src/persistence/migrations/migrations.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/persistence/migrations/migrations.ts)

```typescript
export interface Migration {
  name: string
  up: string
}



export const migrations: Migration[] = [
  {
    name: "001_create_workflow_tables",
    up: `CREATE TABLE IF NOT EXISTS flowwatch_workflows (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT flowwatch_workflows_name_version_unique UNIQUE (name, version)
);

CREATE TABLE IF NOT EXISTS flowwatch_workflow_steps (
  id UUID PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES flowwatch_workflows(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  name TEXT NOT NULL,
  max_retries INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT flowwatch_workflow_steps_workflow_step_index_unique UNIQUE (workflow_id, step_index),
  CONSTRAINT flowwatch_workflow_steps_workflow_name_unique UNIQUE (workflow_id, name)
);

CREATE TABLE IF NOT EXISTS flowwatch_workflow_executions (
  id UUID PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES flowwatch_workflows(id),
  workflow_name TEXT NOT NULL,
  workflow_version INTEGER NOT NULL,
  status TEXT NOT NULL,
  input JSONB,
  output JSONB,
  error JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS flowwatch_workflow_step_executions (
  id UUID PRIMARY KEY,
  execution_id UUID NOT NULL REFERENCES flowwatch_workflow_executions(id) ON DELETE CASCADE,
  workflow_step_id UUID REFERENCES flowwatch_workflow_steps(id),
  step_index INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  status TEXT NOT NULL,
  input JSONB,
  output JSONB,
  error JSONB,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,

  CONSTRAINT flowwatch_workflow_step_executions_execution_step_index_unique UNIQUE (execution_id, step_index)
);

CREATE INDEX IF NOT EXISTS flowwatch_workflow_executions_workflow_status_idx
ON flowwatch_workflow_executions (workflow_name, status);

CREATE INDEX IF NOT EXISTS flowwatch_workflow_executions_created_at_idx
ON flowwatch_workflow_executions (created_at DESC);

CREATE INDEX IF NOT EXISTS flowwatch_workflow_step_executions_execution_idx
ON flowwatch_workflow_step_executions (execution_id, step_index);

CREATE INDEX IF NOT EXISTS flowwatch_workflow_step_executions_status_retry_idx
ON flowwatch_workflow_step_executions (status, next_retry_at);`
  }
  ,
  {
    name: "002_create_feature_flag_tables",
    up: `CREATE TABLE IF NOT EXISTS flowwatch_feature_flags (
  id UUID PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  rollout_percentage INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT flowwatch_feature_flags_rollout_percentage_check
  CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100)
);

CREATE TABLE IF NOT EXISTS flowwatch_feature_flag_rules (
  id UUID PRIMARY KEY,
  flag_id UUID NOT NULL REFERENCES flowwatch_feature_flags(id) ON DELETE CASCADE,
  attribute TEXT NOT NULL,
  operator TEXT NOT NULL,
  value JSONB NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS flowwatch_feature_flag_audit_logs (
  id UUID PRIMARY KEY,
  flag_id UUID REFERENCES flowwatch_feature_flags(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  before JSONB,
  after JSONB,
  changed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS flowwatch_feature_flag_rules_flag_id_idx
ON flowwatch_feature_flag_rules (flag_id);

CREATE INDEX IF NOT EXISTS flowwatch_feature_flag_audit_logs_flag_id_created_at_idx
ON flowwatch_feature_flag_audit_logs (flag_id, created_at DESC);`
  },
  {
    name: "003_create_error_capture_tables",
    up: `CREATE TABLE IF NOT EXISTS flowwatch_request_traces (
  id UUID PRIMARY KEY,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER,
  duration_ms INTEGER,
  user_id TEXT,
  ip TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS flowwatch_trace_spans (
  id UUID PRIMARY KEY,
  trace_id UUID NOT NULL REFERENCES flowwatch_request_traces(id) ON DELETE CASCADE,
  parent_span_id UUID REFERENCES flowwatch_trace_spans(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  duration_ms INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS flowwatch_errors (
  id UUID PRIMARY KEY,
  trace_id UUID REFERENCES flowwatch_request_traces(id) ON DELETE SET NULL,
  span_id UUID REFERENCES flowwatch_trace_spans(id) ON DELETE SET NULL,
  source TEXT NOT NULL,
  category TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'error',
  message TEXT NOT NULL,
  stack TEXT,
  name TEXT,
  status_code INTEGER,
  fingerprint TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS flowwatch_request_traces_started_at_idx
ON flowwatch_request_traces (started_at DESC);

CREATE INDEX IF NOT EXISTS flowwatch_request_traces_path_status_idx
ON flowwatch_request_traces (path, status_code);

CREATE INDEX IF NOT EXISTS flowwatch_trace_spans_trace_started_at_idx
ON flowwatch_trace_spans (trace_id, started_at ASC);

CREATE INDEX IF NOT EXISTS flowwatch_trace_spans_parent_span_id_idx
ON flowwatch_trace_spans (parent_span_id);

CREATE INDEX IF NOT EXISTS flowwatch_errors_trace_id_idx
ON flowwatch_errors (trace_id);

CREATE INDEX IF NOT EXISTS flowwatch_errors_span_id_idx
ON flowwatch_errors (span_id);

CREATE INDEX IF NOT EXISTS flowwatch_errors_source_category_idx
ON flowwatch_errors (source, category);

CREATE INDEX IF NOT EXISTS flowwatch_errors_occurred_at_idx
ON flowwatch_errors (occurred_at DESC);

CREATE INDEX IF NOT EXISTS flowwatch_errors_fingerprint_idx
ON flowwatch_errors (fingerprint);`
  }
];
```

---

<a id="packages-flowwatch-src-persistence-repositories-errors-errorrepositoryts"></a>
### [packages/flowwatch/src/persistence/repositories/errors/errorRepository.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/persistence/repositories/errors/errorRepository.ts)

```typescript
import { randomUUID } from "node:crypto"
import type { Pool } from "pg"

export type ErrorSource =
    | "http"
    | "workflow"
    | "feature_flag"
    | "background_worker"
    | "dashboard_api"
    | "unknown"

export type ErrorCategory =
    | "client"
    | "server"
    | "dependency"
    | "database"
    | "configuration"
    | "unknown"

export type ErrorLevel =
    | "warning"
    | "error"
    | "fatal"

export interface ErrorRow {
    id: string
    trace_id: string | null
    span_id: string | null
    source: ErrorSource
    category: ErrorCategory
    level: ErrorLevel
    message: string
    stack: string | null
    name: string | null
    status_code: number | null
    fingerprint: string | null
    metadata: unknown
    occurred_at: Date
    created_at: Date
}

export interface CreateErrorInput {
    traceId?: string
    spanId?: string
    source: ErrorSource
    category: ErrorCategory
    level?: ErrorLevel
    message: string
    stack?: string
    name?: string
    statusCode?: number
    fingerprint?: string
    metadata?: unknown
    occurredAt?: Date
}

export async function createError(
    pool: Pool,
    input: CreateErrorInput
): Promise<ErrorRow> {
    const result = await pool.query<ErrorRow>(
        `
        INSERT INTO flowwatch_errors (
            id,
            trace_id,
            span_id,
            source,
            category,
            level,
            message,
            stack,
            name,
            status_code,
            fingerprint,
            metadata,
            occurred_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13)
        RETURNING *
        `,
        [
            randomUUID(),
            input.traceId ?? null,
            input.spanId ?? null,
            input.source,
            input.category,
            input.level ?? "error",
            input.message,
            input.stack ?? null,
            input.name ?? null,
            input.statusCode ?? null,
            input.fingerprint ?? null,
            JSON.stringify(input.metadata ?? {}),
            input.occurredAt ?? new Date(),
        ]
    )

    return result.rows[0]
}

export async function getErrorsByTrace(
    pool: Pool,
    traceId: string
): Promise<ErrorRow[]> {
    const result = await pool.query<ErrorRow>(
        `
        SELECT *
        FROM flowwatch_errors
        WHERE trace_id = $1
        ORDER BY occurred_at DESC
        `,
        [traceId]
    )

    return result.rows
}

export async function getErrorById(
    pool: Pool,
    errorId: string
): Promise<ErrorRow | undefined> {
    const result = await pool.query<ErrorRow>(
        `
        SELECT *
        FROM flowwatch_errors
        WHERE id = $1
        `,
        [errorId]
    )

    return result.rows[0]
}

export async function listErrors(
    pool: Pool,
    page = 1,
    limit = 50
): Promise<{ rows: ErrorRow[]; total: number }> {
    const safeLimit = Math.max(1, Math.min(100, limit))
    const offset = (Math.max(1, page) - 1) * safeLimit

    const countResult = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::int AS count FROM flowwatch_errors`
    )

    const result = await pool.query<ErrorRow>(
        `
        SELECT *
        FROM flowwatch_errors
        ORDER BY occurred_at DESC
        LIMIT $1 OFFSET $2
        `,
        [safeLimit, offset]
    )

    return { rows: result.rows, total: Number(countResult.rows[0]?.count ?? 0) }
}
```

---

<a id="packages-flowwatch-src-persistence-repositories-flags-flagrepositoryts"></a>
### [packages/flowwatch/src/persistence/repositories/flags/flagRepository.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/persistence/repositories/flags/flagRepository.ts)

```typescript
import { randomUUID } from "node:crypto"
import type { Pool, PoolClient } from "pg"
import { withTransaction } from "../../transaction.js"
export type FlagRuleOperator =
    | "equals"
    | "not_equals"
    | "in"
    | "not_in"
    | "contains"
    | "starts_with"
    | "ends_with"
    | "greater_than"
    | "less_than"

export interface FeatureFlagRow {
    id: string
    key: string
    description: string | null
    enabled: boolean
    rollout_percentage: number
    created_at: Date
    updated_at: Date
}

export interface FeatureFlagRuleRow {
    id: string
    flag_id: string
    attribute: string
    operator: FlagRuleOperator
    value: unknown
    enabled: boolean
    created_at: Date
    updated_at: Date
}

export interface FeatureFlagAuditLogRow {
    id: string
    flag_id: string | null
    action: string
    before: unknown
    after: unknown
    changed_by: string | null
    created_at: Date
}

export interface FeatureFlagWithRuleCountRow extends FeatureFlagRow {
    rule_count: number
}

export interface CreateFlagInput {
    key: string
    description?: string
    enabled?: boolean
    rolloutPercentage?: number
    changedBy?: string
}

export interface UpdateFlagInput {
    description?: string | null
    enabled?: boolean
    rolloutPercentage?: number
    changedBy?: string
}

export interface CreateFlagRuleInput {
    flagKey: string
    attribute: string
    operator: FlagRuleOperator
    value: unknown
    enabled?: boolean
    changedBy?: string
}

export interface UpdateFlagRuleInput {
    attribute?: string
    operator?: FlagRuleOperator
    value?: unknown
    enabled?: boolean
    changedBy?: string
}

// ─── Flag CRUD ────────────────────────────────────────────────────────────────

export async function createFlag(pool: Pool, input: CreateFlagInput): Promise<FeatureFlagRow> {
    const flagId = randomUUID()

    return withTransaction(pool, async (client) => {
        const result = await client.query<FeatureFlagRow>(
            `
            INSERT INTO flowwatch_feature_flags (
                id,
                key,
                description,
                enabled,
                rollout_percentage
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            `,
            [
                flagId,
                input.key,
                input.description ?? null,
                input.enabled ?? false,
                input.rolloutPercentage ?? 0,
            ]
        )

        const flag = result.rows[0]

        await insertAuditLog(client, {
            flagId: flag.id,
            action: "flag_created",
            before: null,
            after: flag,
            changedBy: input.changedBy,
        })

        return flag
    })
}

export async function listFlags(pool: Pool): Promise<FeatureFlagRow[]> {
    const result = await pool.query<FeatureFlagRow>(
        `
        SELECT *
        FROM flowwatch_feature_flags
        ORDER BY key ASC
        `
    )

    return result.rows
}

export async function listFlagsWithRuleCounts(
    pool: Pool,
    page = 1,
    limit = 50
): Promise<{ rows: FeatureFlagWithRuleCountRow[]; total: number }> {
    const safeLimit = Math.max(1, Math.min(100, limit))
    const offset = (Math.max(1, page) - 1) * safeLimit

    const countResult = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::int AS count FROM flowwatch_feature_flags`
    )

    const result = await pool.query<FeatureFlagWithRuleCountRow>(
        `
        SELECT flags.*, COUNT(rules.id)::int AS rule_count
        FROM flowwatch_feature_flags flags
        LEFT JOIN flowwatch_feature_flag_rules rules ON rules.flag_id = flags.id
        GROUP BY flags.id
        ORDER BY flags.key ASC
        LIMIT $1 OFFSET $2
        `,
        [safeLimit, offset]
    )

    return { rows: result.rows, total: Number(countResult.rows[0]?.count ?? 0) }
}

export async function getFlagByKey(pool: Pool, key: string): Promise<FeatureFlagRow | undefined> {
    const result = await pool.query<FeatureFlagRow>(
        `
        SELECT *
        FROM flowwatch_feature_flags
        WHERE key = $1
        `,
        [key]
    )

    return result.rows[0]
}

export async function updateFlag(
    pool: Pool,
    key: string,
    input: UpdateFlagInput
): Promise<FeatureFlagRow | undefined> {
    return withTransaction(pool, async (client) => {
        const beforeResult = await client.query<FeatureFlagRow>(
            `SELECT * FROM flowwatch_feature_flags WHERE key = $1`,
            [key]
        )
        const before = beforeResult.rows[0]

        if (!before) return undefined

        const result = await client.query<FeatureFlagRow>(
            `
            UPDATE flowwatch_feature_flags
            SET description = COALESCE($2, description),
                enabled = COALESCE($3, enabled),
                rollout_percentage = COALESCE($4, rollout_percentage),
                updated_at = now()
            WHERE key = $1
            RETURNING *
            `,
            [
                key,
                input.description,
                input.enabled,
                input.rolloutPercentage,
            ]
        )

        const after = result.rows[0]

        await insertAuditLog(client, {
            flagId: after.id,
            action: "flag_updated",
            before,
            after,
            changedBy: input.changedBy,
        })

        return after
    })
}

export async function deleteFlag(pool: Pool, key: string, changedBy?: string): Promise<boolean> {
    return withTransaction(pool, async (client) => {
        const beforeResult = await client.query<FeatureFlagRow>(
            `SELECT * FROM flowwatch_feature_flags WHERE key = $1`,
            [key]
        )
        const before = beforeResult.rows[0]

        if (!before) return false

        // Write audit log BEFORE delete so the FK to flowwatch_feature_flags is still valid
        await insertAuditLog(client, {
            flagId: before.id,
            action: "flag_deleted",
            before,
            after: null,
            changedBy,
        })

        await client.query(
            `DELETE FROM flowwatch_feature_flags WHERE key = $1`,
            [key]
        )

        return true
    })
}

// ─── Flag Rules ───────────────────────────────────────────────────────────────

export async function listFlagRules(pool: Pool, flagKey: string): Promise<FeatureFlagRuleRow[]> {
    const flag = await getFlagByKey(pool, flagKey)

    if (!flag) {
        return []
    }

    const result = await pool.query<FeatureFlagRuleRow>(
        `
        SELECT *
        FROM flowwatch_feature_flag_rules
        WHERE flag_id = $1
        ORDER BY created_at ASC
        `,
        [flag.id]
    )

    return result.rows
}

export async function createFlagRule(
    pool: Pool,
    input: CreateFlagRuleInput
): Promise<FeatureFlagRuleRow | undefined> {
    return withTransaction(pool, async (client) => {
        const flagResult = await client.query<FeatureFlagRow>(
            `SELECT * FROM flowwatch_feature_flags WHERE key = $1`,
            [input.flagKey]
        )
        const flag = flagResult.rows[0]

        if (!flag) return undefined

        const result = await client.query<FeatureFlagRuleRow>(
            `
            INSERT INTO flowwatch_feature_flag_rules (
                id,
                flag_id,
                attribute,
                operator,
                value,
                enabled
            )
            VALUES ($1, $2, $3, $4, $5::jsonb, $6)
            RETURNING *
            `,
            [
                randomUUID(),
                flag.id,
                input.attribute,
                input.operator,
                JSON.stringify(input.value),
                input.enabled ?? true,
            ]
        )

        const rule = result.rows[0]

        await insertAuditLog(client, {
            flagId: flag.id,
            action: "rule_created",
            before: null,
            after: rule,
            changedBy: input.changedBy,
        })

        return rule
    })
}

export async function updateFlagRule(
    pool: Pool,
    ruleId: string,
    input: UpdateFlagRuleInput
): Promise<FeatureFlagRuleRow | undefined> {
    return withTransaction(pool, async (client) => {
        const beforeResult = await client.query<FeatureFlagRuleRow>(
            `SELECT * FROM flowwatch_feature_flag_rules WHERE id = $1`,
            [ruleId]
        )
        const before = beforeResult.rows[0]

        if (!before) return undefined

        const result = await client.query<FeatureFlagRuleRow>(
            `
            UPDATE flowwatch_feature_flag_rules
            SET attribute = COALESCE($2, attribute),
                operator = COALESCE($3::flag_rule_operator, operator),
                value = COALESCE($4::jsonb, value),
                enabled = COALESCE($5, enabled),
                updated_at = now()
            WHERE id = $1
            RETURNING *
            `,
            [
                ruleId,
                input.attribute,
                input.operator,
                input.value === undefined ? undefined : JSON.stringify(input.value),
                input.enabled,
            ]
        )

        const after = result.rows[0]

        await insertAuditLog(client, {
            flagId: before.flag_id,
            action: "rule_updated",
            before,
            after,
            changedBy: input.changedBy,
        })

        return after
    })
}

export async function deleteFlagRule(
    pool: Pool,
    ruleId: string,
    changedBy?: string
): Promise<boolean> {
    return withTransaction(pool, async (client) => {
        const beforeResult = await client.query<FeatureFlagRuleRow>(
            `SELECT * FROM flowwatch_feature_flag_rules WHERE id = $1`,
            [ruleId]
        )
        const before = beforeResult.rows[0]

        if (!before) return false

        await insertAuditLog(client, {
            flagId: before.flag_id,
            action: "rule_deleted",
            before,
            after: null,
            changedBy,
        })

        await client.query(
            `DELETE FROM flowwatch_feature_flag_rules WHERE id = $1`,
            [ruleId]
        )

        return true
    })
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export async function listAuditLogs(
    pool: Pool,
    flagKey?: string
): Promise<FeatureFlagAuditLogRow[]> {
    let query = `
        SELECT *
        FROM flowwatch_feature_flag_audit_log
    `
    const params: unknown[] = []

    if (flagKey) {
        const flag = await getFlagByKey(pool, flagKey)
        if (!flag) return []

        query += ` WHERE flag_id = $1`
        params.push(flag.id)
    }

    query += ` ORDER BY created_at DESC`

    const result = await pool.query<FeatureFlagAuditLogRow>(query, params)
    return result.rows
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function insertAuditLog(
    client: PoolClient,
    input: {
        flagId: string | null
        action: string
        before: unknown
        after: unknown
        changedBy?: string
    }
): Promise<void> {
    await client.query(
        `
        INSERT INTO flowwatch_feature_flag_audit_log (
            id,
            flag_id,
            action,
            before,
            after,
            changed_by
        )
        VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6)
        `,
        [
            randomUUID(),
            input.flagId,
            input.action,
            JSON.stringify(input.before ?? null),
            JSON.stringify(input.after ?? null),
            input.changedBy ?? null,
        ]
    )
}
```

---

<a id="packages-flowwatch-src-persistence-repositories-traces-tracerepositoryts"></a>
### [packages/flowwatch/src/persistence/repositories/traces/traceRepository.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/persistence/repositories/traces/traceRepository.ts)

```typescript
import { randomUUID } from "node:crypto"
import type { Pool } from "pg"

export type TraceSpanType =
    | "middleware"
    | "service"
    | "repository"
    | "external_api"
    | "workflow_step"
    | "feature_flag"
    | "custom"

export type TraceStatus =
    | "running"
    | "ok"
    | "error"

export interface RequestTraceRow {
    id: string
    method: string
    path: string
    status_code: number | null
    duration_ms: number | null
    user_id: string | null
    ip: string | null
    user_agent: string | null
    metadata: unknown
    started_at: Date
    ended_at: Date | null
    created_at: Date
}

export interface TraceSpanRow {
    id: string
    trace_id: string
    parent_span_id: string | null
    name: string
    type: TraceSpanType
    status: TraceStatus
    duration_ms: number | null
    metadata: unknown
    started_at: Date
    ended_at: Date | null
    created_at: Date
}

export interface CreateRequestTraceInput {
    method: string
    path: string
    userId?: string
    ip?: string
    userAgent?: string
    metadata?: unknown
}

export interface FinishRequestTraceInput {
    traceId: string
    statusCode?: number
    durationMs: number
    metadata?: unknown
}

export interface CreateTraceSpanInput {
    traceId: string
    parentSpanId?: string
    name: string
    type: TraceSpanType
    metadata?: unknown
}

export interface FinishTraceSpanInput {
    spanId: string
    status: TraceStatus
    durationMs: number
    metadata?: unknown
}

export async function createRequestTrace(
    pool: Pool,
    input: CreateRequestTraceInput
): Promise<RequestTraceRow> {
    const result = await pool.query<RequestTraceRow>(
        `
        INSERT INTO flowwatch_request_traces (
            id,
            method,
            path,
            user_id,
            ip,
            user_agent,
            metadata,
            started_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, now())
        RETURNING *
        `,
        [
            randomUUID(),
            input.method,
            input.path,
            input.userId ?? null,
            input.ip ?? null,
            input.userAgent ?? null,
            JSON.stringify(input.metadata ?? {}),
        ]
    )

    return result.rows[0]
}

export async function finishRequestTrace(
    pool: Pool,
    input: FinishRequestTraceInput
): Promise<RequestTraceRow | undefined> {
    const result = await pool.query<RequestTraceRow>(
        `
        UPDATE flowwatch_request_traces
        SET status_code = COALESCE($2, status_code),
            duration_ms = $3,
            metadata = COALESCE($4::jsonb, metadata),
            ended_at = now()
        WHERE id = $1
        RETURNING *
        `,
        [
            input.traceId,
            input.statusCode,
            input.durationMs,
            input.metadata === undefined ? undefined : JSON.stringify(input.metadata),
        ]
    )

    return result.rows[0]
}

export async function createTraceSpan(
    pool: Pool,
    input: CreateTraceSpanInput
): Promise<TraceSpanRow> {
    const result = await pool.query<TraceSpanRow>(
        `
        INSERT INTO flowwatch_trace_spans (
            id,
            trace_id,
            parent_span_id,
            name,
            type,
            status,
            metadata,
            started_at
        )
        VALUES ($1, $2, $3, $4, $5, 'running', $6::jsonb, now())
        RETURNING *
        `,
        [
            randomUUID(),
            input.traceId,
            input.parentSpanId ?? null,
            input.name,
            input.type,
            JSON.stringify(input.metadata ?? {}),
        ]
    )

    return result.rows[0]
}

export async function finishTraceSpan(
    pool: Pool,
    input: FinishTraceSpanInput
): Promise<TraceSpanRow | undefined> {
    const result = await pool.query<TraceSpanRow>(
        `
        UPDATE flowwatch_trace_spans
        SET status = $2,
            duration_ms = $3,
            metadata = COALESCE($4::jsonb, metadata),
            ended_at = now()
        WHERE id = $1
        RETURNING *
        `,
        [
            input.spanId,
            input.status,
            input.durationMs,
            input.metadata === undefined ? undefined : JSON.stringify(input.metadata),
        ]
    )

    return result.rows[0]
}

export async function getRequestTrace(
    pool: Pool,
    traceId: string
): Promise<RequestTraceRow | undefined> {
    const result = await pool.query<RequestTraceRow>(
        `
        SELECT *
        FROM flowwatch_request_traces
        WHERE id = $1
        `,
        [traceId]
    )

    return result.rows[0]
}

export async function listRequestTraces(
    pool: Pool,
    page = 1,
    limit = 50
): Promise<{ rows: RequestTraceRow[]; total: number }> {
    const safeLimit = Math.max(1, Math.min(100, limit))
    const offset = (Math.max(1, page) - 1) * safeLimit

    const countResult = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::int AS count FROM flowwatch_request_traces`
    )

    const result = await pool.query<RequestTraceRow>(
        `
        SELECT *
        FROM flowwatch_request_traces
        ORDER BY started_at DESC
        LIMIT $1 OFFSET $2
        `,
        [safeLimit, offset]
    )

    return { rows: result.rows, total: Number(countResult.rows[0]?.count ?? 0) }
}

export async function getTraceSpans(
    pool: Pool,
    traceId: string
): Promise<TraceSpanRow[]> {
    const result = await pool.query<TraceSpanRow>(
        `
        SELECT *
        FROM flowwatch_trace_spans
        WHERE trace_id = $1
        ORDER BY started_at ASC
        `,
        [traceId]
    )

    return result.rows
}
```

---

<a id="packages-flowwatch-src-persistence-repositories-workflows-workflowrepositoryts"></a>
### [packages/flowwatch/src/persistence/repositories/workflows/workflowRepository.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/persistence/repositories/workflows/workflowRepository.ts)

```typescript
import { randomUUID } from "node:crypto"
import type { Pool, PoolClient } from "pg"
import { withTransaction } from "../../transaction.js"

export interface WorkflowStepDefinitionInput {
    name: string
    maxRetries?: number
}

export interface CreateWorkflowDefinitionInput {
    name: string
    version?: number
    steps: WorkflowStepDefinitionInput[]
}

export interface WorkflowDefinitionRecord {
    id: string
    name: string
    version: number
    created_at?: Date
    updated_at?: Date
}

export interface WorkflowStepRecord {
    id: string
    workflowId: string
    stepIndex: number
    name: string
    maxRetries: number
}

export interface InsertWorkflowResult {
    workflow: WorkflowDefinitionRecord
    steps: WorkflowStepRecord[]
}

export interface WorkflowExecutionInput {
    workflowId: string
    workflowName: string
    workflowVersion: number
    input?: unknown
    steps: WorkflowExecutionStepInput[]
}

export interface WorkflowExecutionStepInput {
        workflowStepId: string
        stepIndex: number
        stepName: string
        maxRetries: number
        input?: unknown
}

export interface WorkflowExecutionRecord {
    executionId: string
}

export interface WorkflowExecutionRow {
    id: string
    workflow_id: string
    workflow_name: string
    workflow_version: number
    status: string
    input: unknown
    output: unknown
    error: unknown
    created_at: Date
    started_at: Date | null
    completed_at: Date | null
    failed_at: Date | null
}

export interface WorkflowStepExecutionRow {
    id: string
    execution_id: string
    workflow_step_id: string | null
    step_index: number
    step_name: string
    status: string
    input: unknown
    output: unknown
    error: unknown
    attempt_count: number
    max_retries: number
    created_at: Date
    started_at: Date | null
    completed_at: Date | null
    failed_at: Date | null
    next_retry_at: Date | null
}

export async function insertWorkflow(pool: Pool, input: CreateWorkflowDefinitionInput): Promise<InsertWorkflowResult> {
    const workflowId = randomUUID()
    const version = input.version ?? 1

    return withTransaction(pool, async (client) => {
        const workflowResult = await client.query<WorkflowDefinitionRecord>(
            `
            INSERT INTO flowwatch_workflows (id, name, version)
            VALUES ($1, $2, $3)
            ON CONFLICT (name, version)
            DO UPDATE SET updated_at = now()
            RETURNING id, name, version
            `,
            [workflowId, input.name, version]
        )

        const workflow = workflowResult.rows[0]
        const workflowSteps: WorkflowStepRecord[] = []

        for (let i = 0; i < input.steps.length; i++) {
            const step = input.steps[i]

            const stepResult = await client.query<{
                id: string
                workflow_id: string
                step_index: number
                name: string
                max_retries: number
            }>(
                `
                INSERT INTO flowwatch_workflow_steps (
                    id,
                    workflow_id,
                    step_index,
                    name,
                    max_retries
                )
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (workflow_id, step_index)
                DO UPDATE SET
                    name = EXCLUDED.name,
                    max_retries = EXCLUDED.max_retries
                RETURNING id, workflow_id, step_index, name, max_retries
                `,
                [
                    randomUUID(),
                    workflow.id,
                    i,
                    step.name,
                    step.maxRetries ?? 0,
                ]
            )

            const savedStep = stepResult.rows[0]

            workflowSteps.push({
                id: savedStep.id,
                workflowId: savedStep.workflow_id,
                stepIndex: savedStep.step_index,
                name: savedStep.name,
                maxRetries: savedStep.max_retries,
            })
        }

        return {
            workflow,
            steps: workflowSteps,
        }
    })
}


export async function insertWorkflowExecution(pool: Pool, input: WorkflowExecutionInput): Promise<WorkflowExecutionRecord> {
    const executionId = randomUUID()

    return withTransaction(pool, async (client) => {
        await client.query(
            `
      INSERT INTO flowwatch_workflow_executions (
        id,
        workflow_id,
        workflow_name,
        workflow_version,
        status,
        input
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
            [
                executionId,
                input.workflowId,
                input.workflowName,
                input.workflowVersion,
                "queued",
                JSON.stringify(input.input)
            ]
        )

        for (const step of input.steps) {
            await client.query(
                `
        INSERT INTO flowwatch_workflow_step_executions (
          id,
          execution_id,
          workflow_step_id,
          step_index,
          step_name,
          status,
          input,
          attempt_count,
          max_retries
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
                [
                    randomUUID(),
                    executionId,
                    step.workflowStepId,
                    step.stepIndex,
                    step.stepName,
                    "pending",
                    JSON.stringify(step.input),
                    0,
                    step.maxRetries
                ]
            )
        }

        return { executionId }
    })
}


export async function getWorkflowExecution(
    pool: Pool,
    executionId: string
): Promise<WorkflowExecutionRow | undefined> {
    const result = await pool.query<WorkflowExecutionRow>(
        `SELECT * FROM flowwatch_workflow_executions WHERE id = $1`,
        [executionId]
    )

    return result.rows[0]
}

export async function listWorkflowDefinitions(
    pool: Pool,
    page = 1,
    limit = 50
): Promise<{ rows: WorkflowDefinitionRecord[]; total: number }> {
    const safeLimit = Math.max(1, Math.min(100, limit))
    const offset = (Math.max(1, page) - 1) * safeLimit

    const countResult = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::int AS count FROM flowwatch_workflows`
    )

    const result = await pool.query<WorkflowDefinitionRecord>(
        `
        SELECT *
        FROM flowwatch_workflows
        ORDER BY name ASC, version DESC
        LIMIT $1 OFFSET $2
        `,
        [safeLimit, offset]
    )

    return { rows: result.rows, total: Number(countResult.rows[0]?.count ?? 0) }
}

export async function getLatestWorkflowDefinitionByName(
    pool: Pool,
    workflowName: string
): Promise<WorkflowDefinitionRecord | undefined> {
    const result = await pool.query<WorkflowDefinitionRecord>(
        `
        SELECT *
        FROM flowwatch_workflows
        WHERE name = $1
        ORDER BY version DESC
        LIMIT 1
        `,
        [workflowName]
    )

    return result.rows[0]
}

export async function listWorkflowExecutions(
    pool: Pool,
    page = 1,
    limit = 50
): Promise<{ rows: WorkflowExecutionRow[]; total: number }> {
    const safeLimit = Math.max(1, Math.min(100, limit))
    const offset = (Math.max(1, page) - 1) * safeLimit

    const countResult = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::int AS count FROM flowwatch_workflow_executions`
    )

    const result = await pool.query<WorkflowExecutionRow>(
        `
        SELECT *
        FROM flowwatch_workflow_executions
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
        `,
        [safeLimit, offset]
    )

    return { rows: result.rows, total: Number(countResult.rows[0]?.count ?? 0) }
}

export async function listWorkflowExecutionsByWorkflowName(
    pool: Pool,
    workflowName: string,
    limit = 50
): Promise<WorkflowExecutionRow[]> {
    const result = await pool.query<WorkflowExecutionRow>(
        `
        SELECT *
        FROM flowwatch_workflow_executions
        WHERE workflow_name = $1
        ORDER BY created_at DESC
        LIMIT $2
        `,
        [workflowName, limit]
    )

    return result.rows
}

export async function listWorkflowStepExecutionsByExecutionIds(
    pool: Pool,
    executionIds: string[]
): Promise<Map<string, WorkflowStepExecutionRow[]>> {
    if (executionIds.length === 0) {
        return new Map()
    }

    const result = await pool.query<WorkflowStepExecutionRow>(
        `
        SELECT *
        FROM flowwatch_workflow_step_executions
        WHERE execution_id = ANY($1::uuid[])
        ORDER BY execution_id ASC, step_index ASC
        `,
        [executionIds]
    )

    const grouped = new Map<string, WorkflowStepExecutionRow[]>()

    for (const row of result.rows) {
        const existing = grouped.get(row.execution_id) || []
        existing.push(row)
        grouped.set(row.execution_id, existing)
    }

    return grouped
}

export async function listWorkflowStepsByWorkflowIds(
    pool: Pool,
    workflowIds: string[]
): Promise<Map<string, WorkflowStepRecord[]>> {
    if (workflowIds.length === 0) {
        return new Map()
    }

    const result = await pool.query<{
        id: string
        workflow_id: string
        step_index: number
        name: string
        max_retries: number
    }>(
        `
        SELECT *
        FROM flowwatch_workflow_steps
        WHERE workflow_id = ANY($1::uuid[])
        ORDER BY workflow_id ASC, step_index ASC
        `,
        [workflowIds]
    )

    const grouped = new Map<string, WorkflowStepRecord[]>()

    for (const row of result.rows) {
        const existing = grouped.get(row.workflow_id) || []
        existing.push({
            id: row.id,
            workflowId: row.workflow_id,
            stepIndex: row.step_index,
            name: row.name,
            maxRetries: row.max_retries,
        })
        grouped.set(row.workflow_id, existing)
    }

    return grouped
}

export async function getWorkflowExecutionSteps(
    pool: Pool,
    executionId: string
): Promise<WorkflowStepExecutionRow[]> {
    const result = await pool.query<WorkflowStepExecutionRow>(
        `
        SELECT *
        FROM flowwatch_workflow_step_executions
        WHERE execution_id = $1
        ORDER BY step_index ASC
        `,
        [executionId]
    )

    return result.rows
}

export async function markWorkflowExecutionRunning(pool: Pool, executionId: string): Promise<void> {
    await pool.query(
        `
        UPDATE flowwatch_workflow_executions
        SET status = 'running',
            started_at = COALESCE(started_at, now())
        WHERE id = $1
        `,
        [executionId]
    )
}

export async function markWorkflowExecutionCompleted(
    pool: Pool,
    executionId: string,
    output?: unknown
): Promise<void> {
    await pool.query(
        `
        UPDATE flowwatch_workflow_executions
        SET status = 'completed',
            output = $2,
            completed_at = now()
        WHERE id = $1
        `,
        [executionId, JSON.stringify(output)]
    )
}

export async function markWorkflowExecutionFailed(
    pool: Pool,
    executionId: string,
    error: unknown
): Promise<void> {
    await pool.query(
        `
        UPDATE flowwatch_workflow_executions
        SET status = 'failed',
            error = $2,
            failed_at = now()
        WHERE id = $1
        `,
        [executionId, JSON.stringify(serializeError(error))]
    )
}

export async function markWorkflowStepRunning(pool: Pool, stepExecutionId: string): Promise<void> {
    await pool.query(
        `
        UPDATE flowwatch_workflow_step_executions
        SET status = 'running',
            started_at = COALESCE(started_at, now())
        WHERE id = $1
        `,
        [stepExecutionId]
    )
}

export async function markWorkflowStepCompleted(
    pool: Pool,
    stepExecutionId: string,
    output?: unknown
): Promise<void> {
    await pool.query(
        `
        UPDATE flowwatch_workflow_step_executions
        SET status = 'completed',
            output = $2,
            completed_at = now()
        WHERE id = $1
        `,
        [stepExecutionId, JSON.stringify(output)]
    )
}

export async function markWorkflowStepFailed(
    pool: Pool,
    stepExecutionId: string,
    error: unknown
): Promise<void> {
    await pool.query(
        `
        UPDATE flowwatch_workflow_step_executions
        SET status = 'failed',
            error = $2,
            failed_at = now(),
            attempt_count = attempt_count + 1
        WHERE id = $1
        `,
        [stepExecutionId, JSON.stringify(serializeError(error))]
    )
}

function serializeError(error: unknown) {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack,
        }
    }

    return {
        message: String(error),
    }
}
```

---

<a id="packages-flowwatch-src-persistence-transactionts"></a>
### [packages/flowwatch/src/persistence/transaction.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/persistence/transaction.ts)

```typescript
import type { Pool, PoolClient } from "pg"

export async function withTransaction<T>(pool: Pool, fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect()
    try {
        await client.query("BEGIN")
        const result = await fn(client)
        await client.query("COMMIT")
        return result
    } catch (error) {
        await client.query("ROLLBACK")
        throw error
    } finally {
        client.release()
    }
}
```

---

<a id="packages-flowwatch-src-runtime-config-normalizeconfigts"></a>
### [packages/flowwatch/src/runtime/config/normalizeConfig.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/runtime/config/normalizeConfig.ts)

```typescript
import type { NormalizedFlowwatchConfig, FlowwatchConfig, FlowwatchWorkerConfig } from "../../types/index.js"

export async function normalizeConfig(config: FlowwatchConfig): Promise<NormalizedFlowwatchConfig> {
    const workerConfig = normalizeWorkerConfig(config.worker)

    return {
        db: config.db,
        redis: {
            url: config.redis.url,
        },
        elasticsearch: {
            node: config.elasticsearch.node,
        },
        dashboard: {
            path: config.dashboard?.path ?? "/flowwatch",
            enabled: config.dashboard?.enabled ?? true,
            token: config.dashboard?.token,
            auth: config.dashboard?.auth,
        },
        worker: workerConfig,
        migrations: {
            autoRun: config.migrations?.autoRun ?? false,
            tableName: config.migrations?.tableName ?? "flowwatch_migrations",
        },
        runtime: {
            environment: config.runtime?.environment ?? process.env.NODE_ENV ?? "development",
            serviceName: config.runtime?.serviceName ?? "flowwatch",
            debug: config.runtime?.debug ?? false,
        },
    }
}

function normalizeWorkerConfig(worker: FlowwatchConfig["worker"]): Required<FlowwatchWorkerConfig> {
    if (typeof worker==="boolean") {
        return {
            enabled: worker,
            workflowConcurrency: 5,
            errorIndexingConcurrency: 2,
            maintenanceConcurrency: 1,
            queuePrefix: "flowwatch",
        }
    }

    return {
        enabled: worker?.enabled ?? true,
        workflowConcurrency: worker?.workflowConcurrency ?? 5,
        errorIndexingConcurrency: worker?.errorIndexingConcurrency ?? 2,
        maintenanceConcurrency: worker?.maintenanceConcurrency ?? 1,
        queuePrefix: worker?.queuePrefix ?? "flowwatch",
    }
}
```

---

<a id="packages-flowwatch-src-runtime-config-validationconfigts"></a>
### [packages/flowwatch/src/runtime/config/validationConfig.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/runtime/config/validationConfig.ts)

```typescript
import type { FlowwatchConfig } from "../../types/index.js"

export function validateConfig(config: unknown): FlowwatchConfig{
  if (!isObject(config)) {
    throw new Error("config must be an object")
  }

  validateDbConfig(config.db)
  validateRedisConfig(config.redis)
  validateElasticsearchConfig(config.elasticsearch)
  validateDashboardConfig(config.dashboard)
  validateWorkerConfig(config.worker)
  validateMigrationsConfig(config.migrations)
  validateRuntimeConfig(config.runtime)

  return config as unknown as FlowwatchConfig
}

function validateDbConfig(db:unknown){
  if (!isObject(db)) {
    throw new Error("config db must be an object")
  }
}

function validateRedisConfig(redis: unknown){
  if (!isObject(redis)) {
    throw new Error("config redis must be an object")
  }

  if (!isNonEmptyString(redis.url)) {
    throw new Error("config redis.url must be a non-empty string")
  }
}

function validateElasticsearchConfig(elasticsearch:unknown){
  if (!isObject(elasticsearch)) {
    throw new Error("config elasticsearch must be an object")
  }

  if (!isNonEmptyString(elasticsearch.node)) {
    throw new Error("config elasticsearch.node must be a non-empty string")
  }
}

function validateDashboardConfig(dashboard: unknown){
  if (dashboard===undefined){
    return
  }

  if (!isObject(dashboard)) {
    throw new Error("config dashboard must be an object")
  }

  if (dashboard.path !== undefined && (!isNonEmptyString(dashboard.path) || !dashboard.path.startsWith("/"))) {
    throw new Error("config dashboard.path must be a non-empty string starting with /")
  }

  if (dashboard.token !== undefined && !isNonEmptyString(dashboard.token)) {
    throw new Error("config dashboard.token must be a non-empty string")
  }

  if (dashboard.auth!==undefined && typeof dashboard.auth!=="function") {
    throw new Error("config dashboard.auth must be a function")
  }

  if (dashboard.enabled!==undefined && typeof dashboard.enabled!=="boolean") {
    throw new Error("config dashboard.enabled must be a boolean")
  }
}

function validateWorkerConfig(worker: unknown){
  if (worker===undefined) {
    return
  }

  if (typeof worker==="boolean") {
    return
  }

  if (!isObject(worker)) {
    throw new Error("config worker must be a boolean or an object")
  }

  if (worker.enabled!==undefined && typeof worker.enabled!=="boolean") {
    throw new Error("config worker.enabled must be a boolean")
  }

  validatePositiveInteger(worker.workflowConcurrency, "worker.workflowConcurrency")
  validatePositiveInteger(worker.errorIndexingConcurrency, "worker.errorIndexingConcurrency")
  validatePositiveInteger(worker.maintenanceConcurrency, "worker.maintenanceConcurrency")

  if (worker.queuePrefix !== undefined && !isNonEmptyString(worker.queuePrefix)) {
    throw new Error("config worker.queuePrefix must be a non-empty string")
  }
}

function validateMigrationsConfig(migrations: unknown){
  if (migrations === undefined) {
    return
  }

  if (!isObject(migrations)) {
    throw new Error("config migrations must be an object")
  }

  if (migrations.autoRun !== undefined && typeof migrations.autoRun !== "boolean") {
    throw new Error("config migrations.autoRun must be a boolean")
  }

  if (migrations.tableName !== undefined && !isNonEmptyString(migrations.tableName)) {
    throw new Error("config migrations.tableName must be a non-empty string")
  }
}

function validateRuntimeConfig(runtime: unknown){
  if (runtime === undefined) {
    return
  }

  if (!isObject(runtime)) {
    throw new Error("config runtime must be an object")
  }

  if (runtime.environment !== undefined && !isNonEmptyString(runtime.environment)) {
    throw new Error("config runtime.environment must be a non-empty string")
  }

  if (runtime.serviceName !== undefined && !isNonEmptyString(runtime.serviceName)) {
    throw new Error("config runtime.serviceName must be a non-empty string")
  }

  if (runtime.debug !== undefined && typeof runtime.debug !== "boolean") {
    throw new Error("config runtime.debug must be a boolean")
  }
}

function validatePositiveInteger(value: unknown, fieldName: string){
  if (value === undefined) {
    return
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error(`config ${fieldName} must be a positive integer`)
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value==="object" && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}
```

---

<a id="packages-flowwatch-src-runtime-health-healthservicets"></a>
### [packages/flowwatch/src/runtime/health/healthService.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/runtime/health/healthService.ts)

```typescript
import type { Client } from "@elastic/elasticsearch"
import type { Pool } from "pg";
import type { Redis } from "ioredis"

export async function checkPostgresHealth(pool: Pool) {
    const startedAt = Date.now();
    try {
        await pool.query("SELECT 1");
        return {
            status: "ok",
            latencyMs: Date.now() - startedAt
        };
    }
    catch (error) {
        return {
            status: "error",
            message: error instanceof Error ? error.message : "Unknown error" 
        }
    }
}

export async function checkRedisHealth(redisClient: Redis) {
    const startedAt = Date.now();

    try {
        const response = await redisClient.ping();
        if (response != "PONG") {
            return {
                status: "error",
                message: `Unexpected Redis Response ${response}`
            }
        }
        return {
            status: "ok",
            latencyMs: Date.now() - startedAt
        };
    }
    catch (error) {
        return {
            status: "error",
            message: error instanceof Error?error.message:"Unknown error"
        }
    }
}

export async function checkElasticsearchHealth(elasticsearchClient: Client) {
    const startedAt = Date.now()

    try {
        await elasticsearchClient.ping()

        return {
            status: "ok",
            latencyMs: Date.now() - startedAt
        }
    }
    catch (error) {
        return {
            status: "error",
            message: error instanceof Error ? error.message : "Unknown error"
        }
    }
}
```

---

<a id="packages-flowwatch-src-runtime-tracing-tracecontextts"></a>
### [packages/flowwatch/src/runtime/tracing/traceContext.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/runtime/tracing/traceContext.ts)

```typescript
import { AsyncLocalStorage } from "node:async_hooks"

export interface TraceContext {
    traceId: string
    currentSpanId?: string
    userId?: string
    ip?: string
}

const traceStorage = new AsyncLocalStorage<TraceContext>()
//Added a generic class named async local storage with the type tracecontext, as its a generic class all its methods also return the generic type.
export function runWithTraceContext<T>(context: TraceContext, callback: () => T): T {
    return traceStorage.run(context, callback)
}

export function getCurrentTraceContext(): TraceContext | undefined {
    return traceStorage.getStore()
}

export function getCurrentClientIp(): string | undefined {
    return traceStorage.getStore()?.ip
}

export function getCurrentTraceId(): string | undefined {
    return traceStorage.getStore()?.traceId
}

export function getCurrentSpanId(): string | undefined {
    return traceStorage.getStore()?.currentSpanId
}

export function runWithSpanContext<T>(spanId: string, callback: () => T): T {
    const currentContext = traceStorage.getStore()

    if (!currentContext) {
        return callback()
    }

    return traceStorage.run(
        {
            ...currentContext,
            currentSpanId: spanId,
        },
        callback
    )
}
```

---

<a id="packages-flowwatch-src-runtime-tracing-tracingmiddlewarets"></a>
### [packages/flowwatch/src/runtime/tracing/tracingMiddleware.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/runtime/tracing/tracingMiddleware.ts)

```typescript
import type { NextFunction, Request, RequestHandler, Response } from "express"
import type { Pool } from "pg"
import { createRequestTrace, finishRequestTrace } from "../../persistence/repositories/traces/traceRepository.js"
import { runWithTraceContext } from "./traceContext.js"

export function createRequestTracingMiddleware(pool: Pool): RequestHandler {
    return async function requestTracingMiddleware(req: Request, res: Response, next: NextFunction) {
        const startedAt = Date.now()
        const clientIp = getClientIp(req)

        try {
            const trace = await createRequestTrace(pool, {
                method: req.method,
                path: req.originalUrl || req.path,
                ip: clientIp,
            })

            res.on("finish", () => {
                finishRequestTrace(pool, {
                    traceId: trace.id,
                    statusCode: res.statusCode,
                    durationMs: Date.now() - startedAt,
                }).catch(() => {
                })
            })

            runWithTraceContext({ traceId: trace.id, ip: clientIp, },
                next
            )   
        }
        catch {
            next()
        }
    }
}

function getClientIp(req: Request): string | undefined {
    const forwardedFor = req.get("x-forwarded-for")

    if (forwardedFor) {
        return normalizeClientIp(forwardedFor.split(",")[0]?.trim())
    }

    return normalizeClientIp(req.ip || req.socket.remoteAddress || undefined)
}

function normalizeClientIp(value: string | undefined): string | undefined {
    if (!value) return undefined

    const ip = value.trim()
    if (ip === "::1" || ip === "::ffff:127.0.0.1") {
        return "127.0.0.1"
    }

    if (ip.startsWith("::ffff:")) {
        return ip.slice("::ffff:".length)
    }

    return ip
}
```

---

<a id="packages-flowwatch-src-search-elasticsearch-clientts"></a>
### [packages/flowwatch/src/search/elasticsearch/client.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/search/elasticsearch/client.ts)

```typescript
import { Client } from "@elastic/elasticsearch"

export function createElasticsearchClient(node: string): Client {
    return new Client({ node })
}
```

---

<a id="packages-flowwatch-src-search-elasticsearch-indexsetupts"></a>
### [packages/flowwatch/src/search/elasticsearch/indexSetup.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/search/elasticsearch/indexSetup.ts)

```typescript
import type { Client } from "@elastic/elasticsearch"

export async function createErrorMapping(client: Client): Promise<void> {
    await client.indices.create({
        index: "flowwatch_errors",
        mappings: {
            properties: {
                id: { type: "keyword" },
                traceId: { type: "keyword" },
                spanId: { type: "keyword" },

                source: { type: "keyword" },
                category: { type: "keyword" },
                level: { type: "keyword" },
                name: { type: "keyword" },
                fingerprint: { type: "keyword" },

                message: { type: "text" },
                stack: { type: "text" },

                statusCode: { type: "integer" },

                metadata: { type: "object", enabled: true },

                occurredAt: { type: "date" },
                createdAt: { type: "date" },
            },
        },
    })
}

export async function createTraceMapping(client: Client): Promise<void> {
    await client.indices.create({
        index: "flowwatch_trace_spans",
        mappings: {
            properties: {
                id: { type: "keyword" },
                traceId: { type: "keyword" },
                parentSpanId: { type: "keyword" },

                name: { type: "text" },
                type: { type: "keyword" },
                status: { type: "keyword" },

                durationMs: { type: "integer" },

                metadata: { type: "object", enabled: true },

                startedAt: { type: "date" },
                endedAt: { type: "date" },
                createdAt: { type: "date" },
            },
        },
    })
}
```

---

<a id="packages-flowwatch-src-search-elasticsearch-indexerts"></a>
### [packages/flowwatch/src/search/elasticsearch/indexer.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/search/elasticsearch/indexer.ts)

```typescript
import type { Client } from "@elastic/elasticsearch"
import type { ErrorRow } from "../../persistence/repositories/errors/errorRepository.js"
import type { TraceSpanRow } from "../../persistence/repositories/traces/traceRepository.js"

export const errorIndex = "flowwatch_errors"
export const traceSpanIndex = "flowwatch_trace_spans"

export async function indexError(client: Client, error: ErrorRow): Promise<void> {
    await client.index({
        index: errorIndex,
        id: error.id,
        document: {
            id: error.id,
            traceId: error.trace_id,
            spanId: error.span_id,
            source: error.source,
            category: error.category,
            level: error.level,
            message: error.message,
            stack: error.stack,
            name: error.name,
            statusCode: error.status_code,
            fingerprint: error.fingerprint,
            metadata: error.metadata,
            occurredAt: error.occurred_at,
            createdAt: error.created_at,
        },
    })
}

export async function indexTraceSpan(client: Client, span: TraceSpanRow): Promise<void> {
    await client.index({
        index: traceSpanIndex,
        id: span.id,
        document: {
            id: span.id,
            traceId: span.trace_id,
            parentSpanId: span.parent_span_id,
            name: span.name,
            type: span.type,
            status: span.status,
            durationMs: span.duration_ms,
            metadata: span.metadata,
            startedAt: span.started_at,
            endedAt: span.ended_at,
            createdAt: span.created_at,
        },
    })
}


export async function createErrorMapping(client: Client): Promise<void> {
    await client.indices.create({
        index: "flowwatch_errors",
        mappings: {
            properties: {
                id: { type: "keyword" },
                traceId: { type: "keyword" },
                spanId: { type: "keyword" },

                source: { type: "keyword" },
                category: { type: "keyword" },
                level: { type: "keyword" },
                name: { type: "keyword" },
                fingerprint: { type: "keyword" },

                message: { type: "text" },
                stack: { type: "text" },

                statusCode: { type: "integer" },

                metadata: { type: "object", enabled: true },

                occurredAt: { type: "date" },
                createdAt: { type: "date" },
            },
        },
    })
}

export async function createTraceMapping(client: Client): Promise<void> {
    await client.indices.create({
        index: "flowwatch_trace_spans",
        mappings: {
            properties: {
                id: { type: "keyword" },
                traceId: { type: "keyword" },
                parentSpanId: { type: "keyword" },

                name: { type: "text" },
                type: { type: "keyword" },
                status: { type: "keyword" },

                durationMs: { type: "integer" },

                metadata: { type: "object", enabled: true },

                startedAt: { type: "date" },
                endedAt: { type: "date" },
                createdAt: { type: "date" },
            },
        },
    })
}
```

---

<a id="packages-flowwatch-src-search-elasticsearch-mappingcheckerts"></a>
### [packages/flowwatch/src/search/elasticsearch/mappingChecker.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/search/elasticsearch/mappingChecker.ts)

```typescript
import type { Client } from "@elastic/elasticsearch"
import { createErrorMapping, createTraceMapping, errorIndex, traceSpanIndex } from "./indexer.js"

export async function createMissingMappings(client: Client): Promise<void> {
    try {
        await createErrorMappingIfMissing(client)
        await createTraceMappingIfMissing(client)
    } catch (err: any) {
        console.warn(`[Flowwatch] ⚠️  Elasticsearch unavailable on startup (${err?.message ?? err}). Search indexing will be skipped until Elasticsearch is reachable.`)
    }
}

async function createErrorMappingIfMissing(client: Client): Promise<void> {
    const exists = await client.indices.exists({
        index: errorIndex,
    })

    if(exists){
        return
    }

    await createErrorMapping(client)
}

async function createTraceMappingIfMissing(client: Client): Promise<void> {
    const exists = await client.indices.exists({
        index: traceSpanIndex,
    })

    if(exists){
        return
    }

    await createTraceMapping(client)
}
```

---

<a id="packages-flowwatch-src-server-sidecarserverts"></a>
### [packages/flowwatch/src/server/sidecarServer.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/server/sidecarServer.ts)

```typescript
import express, { Router, json } from "express"
import type { Flowwatch } from "../createFlowwatch.js"
import type { TraceSpanType } from "../persistence/repositories/traces/traceRepository.js"
import type { FlagContext } from "../engine/flags/types.js"
import type { CaptureErrorOptions } from "../engine/errors/errorEngine.js"

export function createSidecarRouter(fw: Flowwatch): Router {
    const router = Router()
    router.use(json())

    // ── Feature Flag ──────────────────────────────────────────────
    router.post("/api/flag", async (req, res) => {
        try {
            const { key, context } = req.body as { key: string; context?: FlagContext }

            if (!key || typeof key !== "string") {
                res.status(400).json({ error: "key must be a non-empty string" })
                return
            }

            const enabled = await fw.flag(key, context ?? {})
            res.json({ enabled })
        } catch (err: any) {
            res.status(500).json({ error: err?.message ?? "flag evaluation failed" })
        }
    })

    // ── Workflow Trigger ──────────────────────────────────────────
    router.post("/api/trigger", async (req, res) => {
        try {
            const { name, input } = req.body as { name: string; input?: unknown }

            if (!name || typeof name !== "string") {
                res.status(400).json({ error: "name must be a non-empty string" })
                return
            }

            const result = await fw.trigger(name, input)
            res.json(result)
        } catch (err: any) {
            res.status(500).json({ error: err?.message ?? "workflow trigger failed" })
        }
    })

    // ── Trace Span (single-shot) ──────────────────────────────────
    router.post("/api/trace-span", async (req, res) => {
        try {
            const { name, type, durationMs, metadata, status } = req.body as {
                name: string
                type: TraceSpanType
                durationMs: number
                metadata?: unknown
                status?: "ok" | "error"
            }

            if (!name || typeof name !== "string") {
                res.status(400).json({ error: "name must be a non-empty string" })
                return
            }

            if (!type) {
                res.status(400).json({ error: "type is required" })
                return
            }

            if (typeof durationMs !== "number" || durationMs < 0) {
                res.status(400).json({ error: "durationMs must be a non-negative number" })
                return
            }

            // The actual work was already timed on the caller side.
            // We record the span with the reported duration in metadata
            // since fw.trace measures real execution time of the callback.
            await fw.trace(name, type, async () => {
                // no-op — work already done by caller
            }, {
                sidecarDurationMs: durationMs,
                sidecarStatus: status ?? "ok",
                ...(metadata as any),
            })

            res.json({ ok: true })
        } catch (err: any) {
            res.status(500).json({ error: err?.message ?? "trace span recording failed" })
        }
    })

    // ── Error Capture ─────────────────────────────────────────────
    router.post("/api/capture-error", async (req, res) => {
        try {
            const { error, options } = req.body as {
                error: { message: string; name?: string; stack?: string }
                options: CaptureErrorOptions
            }

            if (!error || typeof error.message !== "string") {
                res.status(400).json({ error: "error.message must be a non-empty string" })
                return
            }

            if (!options || !options.source) {
                res.status(400).json({ error: "options.source is required" })
                return
            }

            const reconstructedError = new Error(error.message)
            if (error.name) reconstructedError.name = error.name
            if (error.stack) reconstructedError.stack = error.stack

            const stored = await fw.captureError(reconstructedError, options)

            res.json(stored ? { id: stored.id } : { ok: true })
        } catch (err: any) {
            res.status(500).json({ error: err?.message ?? "error capture failed" })
        }
    })

    // ── Health ────────────────────────────────────────────────────
    router.get("/api/health", async (_req, res) => {
        res.json({ status: "ok", sidecar: "flowwatch" })
    })

    return router
}

/**
 * Starts the FlowWatch sidecar on a dedicated port.
 * Python (or any language) apps call the REST API at http://localhost:<port>/api/*
 *
 * The dashboard is also available at http://localhost:<port>/ops
 */
export function startSidecar(fw: Flowwatch, port: number = 9400) {
    const app = express()

    app.use(createSidecarRouter(fw))
    app.use("/ops", fw.dashboard)

    app.listen(port, () => {
        console.log(`[Flowwatch] Sidecar listening on http://localhost:${port}`)
        console.log(`[Flowwatch] Dashboard → http://localhost:${port}/ops`)
        console.log(`[Flowwatch] API → http://localhost:${port}/api/*`)
    })

    return app
}
```

---

<a id="packages-flowwatch-src-types-indexts"></a>
### [packages/flowwatch/src/types/index.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/types/index.ts)

```typescript
import type { PoolConfig } from "pg"
import type { Request } from "express"

export interface FlowwatchConfig {
    db: PoolConfig
    redis: FlowwatchRedisConfig
    elasticsearch: FlowwatchElasticsearchConfig
    dashboard?: FlowwatchDashboardConfig
    worker?: boolean | FlowwatchWorkerConfig
    migrations?: FlowwatchMigrationConfig
    runtime?: FlowwatchRuntimeConfig
}

export interface FlowwatchRedisConfig {
    url: string
}

export interface FlowwatchElasticsearchConfig {
    node: string
}

export interface FlowwatchDashboardConfig {
    path?: string
    token?: string
    auth?: (req: Request) => boolean | Promise<boolean>
    enabled?: boolean
}

export interface FlowwatchWorkerConfig {
    enabled?: boolean
    workflowConcurrency?: number
    errorIndexingConcurrency?: number
    maintenanceConcurrency?: number
    queuePrefix?: string
}

export interface FlowwatchMigrationConfig {
    autoRun?: boolean
    tableName?: string
}

export interface FlowwatchRuntimeConfig {
    environment?: "development" | "test" | "staging" | "production" | string
    serviceName?: string
    debug?: boolean
}

export interface NormalizedFlowwatchConfig {
    db: PoolConfig
    redis: FlowwatchRedisConfig
    elasticsearch: FlowwatchElasticsearchConfig
    dashboard: Required<Pick<FlowwatchDashboardConfig, "path" | "enabled">> & Pick<FlowwatchDashboardConfig, "token" | "auth">
    worker: Required<FlowwatchWorkerConfig>
    migrations: Required<FlowwatchMigrationConfig>
    runtime: Required<FlowwatchRuntimeConfig>
}
```

---

<a id="packages-flowwatch-src-utils-flowwatchenvstorets"></a>
### [packages/flowwatch/src/utils/flowwatchEnvStore.ts](file:///C:/Users/Pranshul Soni/Documents/Projects/Backend/Pilot/packages/flowwatch/src/utils/flowwatchEnvStore.ts)

```typescript
/**
 * Flowwatch environment store — persists AI credentials to `.fw.env` in the
 * consumer's working directory (process.cwd()), i.e. their project root.
 *
 * Priority order on startup:
 *   1. FLOWWATCH_GROQ_API_KEY / FLOWWATCH_GROQ_MODEL   already in process.env
 *   2. .fw.env at process.cwd()           written by this module
 *   → whichever is found first wins; the result is persisted to .fw.env
 */
import { readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

const FLOWWATCH_ENV_FILE = ".fw.env"

interface FlowwatchEnv {
    groqApiKey?: string
    groqModel?: string
}

/** Single in-memory store for the lifetime of this process. */
const store: FlowwatchEnv = {}

// ─── Path ────────────────────────────────────────────────────────────────────

function getFlowwatchEnvPath(): string {
    return join(process.cwd(), FLOWWATCH_ENV_FILE)
}

// ─── File helpers ─────────────────────────────────────────────────────────────

function parseEnvFile(content: string): FlowwatchEnv {
    const result: FlowwatchEnv = {}
    for (const raw of content.split(/\r?\n/)) {
        const line = raw.trim()
        if (!line || line.startsWith("#")) continue
        const eq = line.indexOf("=")
        if (eq === -1) continue
        const key   = line.slice(0, eq).trim()
        const value = line.slice(eq + 1).trim()
        if (key === "FLOWWATCH_GROQ_API_KEY") result.groqApiKey = value
        if (key === "FLOWWATCH_GROQ_MODEL")   result.groqModel  = value
    }
    return result
}

function buildEnvFile(existing: string, updated: FlowwatchEnv): string {
    const kept = existing
        .split(/\r?\n/)
        .filter((l) => {
            const t = l.trim()
            return !t.startsWith("FLOWWATCH_GROQ_API_KEY=") && !t.startsWith("FLOWWATCH_GROQ_MODEL=")
        })

    while (kept.length && !kept[kept.length - 1].trim()) kept.pop()
    if (!kept.length) {
        kept.push("# Flowwatch AI configuration — auto-generated, do not commit to version control")
    }

    if (updated.groqApiKey) kept.push(`FLOWWATCH_GROQ_API_KEY=${updated.groqApiKey}`)
    if (updated.groqModel)  kept.push(`FLOWWATCH_GROQ_MODEL=${updated.groqModel}`)
    kept.push("")
    return kept.join("\n")
}

async function readEnvFile(): Promise<string> {
    try {
        return await readFile(getFlowwatchEnvPath(), "utf-8")
    } catch {
        return ""
    }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Load AI credentials into the in-memory store on startup.
 *
 * Resolution order (both are checked; process.env fills gaps not in the file):
 *   1. .fw.env at process.cwd()   — written by dashboard Settings
 *   2. process.env.FLOWWATCH_GROQ_API_KEY / GROQ_API_KEY   — set by consumer
 *
 * If the key is found only in process.env it is immediately persisted to
 * .fw.env so the next restart doesn't need process.env anymore.
 */
export async function loadFlowwatchEnv(): Promise<void> {
    const filePath = getFlowwatchEnvPath()

    // Step 1 — read whatever the file has (may be partial or missing)
    const raw    = await readEnvFile()
    const parsed = parseEnvFile(raw)
    if (parsed.groqApiKey) store.groqApiKey = parsed.groqApiKey
    if (parsed.groqModel)  store.groqModel  = parsed.groqModel

    // Step 2 — fill any gaps from process.env (ALWAYS checked, even if file exists)
    const envKey   = process.env.FLOWWATCH_GROQ_API_KEY || process.env.GROQ_API_KEY
    const envModel = process.env.FLOWWATCH_GROQ_MODEL   || process.env.GROQ_MODEL

    let needsSave = false
    if (!store.groqApiKey && envKey) {
        store.groqApiKey = envKey
        needsSave = true
    }
    if (!store.groqModel && envModel) {
        store.groqModel = envModel
        needsSave = true
    }

    if (store.groqApiKey) {
        console.log(`[Flowwatch] ✅  Groq API key loaded (config: ${filePath})`)
        // Persist back so future restarts find the key in the file
        if (needsSave) {
            try {
                await writeFile(filePath, buildEnvFile(raw, store), "utf-8")
                console.log(`[Flowwatch] ✅  API key saved to ${filePath}`)
            } catch (err: any) {
                console.warn(`[Flowwatch] ⚠️  Could not write ${filePath}: ${err?.message}`)
            }
        }
    } else {
        console.log(
            `[Flowwatch] ⚠️  No Groq API key found.\n` +
            `         • Enter it in the dashboard → Settings → AI Configuration\n` +
            `         • OR set FLOWWATCH_GROQ_API_KEY in your environment\n` +
            `         • Config will be saved to: ${filePath}`
        )
    }
}

/**
 * Persist settings to .fw.env and update the in-memory store.
 * Called from the dashboard Settings API when the user saves their key.
 */
export async function saveFlowwatchEnv(updates: Partial<FlowwatchEnv>): Promise<void> {
    if (updates.groqApiKey !== undefined) store.groqApiKey = updates.groqApiKey || undefined
    if (updates.groqModel  !== undefined) store.groqModel  = updates.groqModel  || undefined

    const existing = await readEnvFile()
    await writeFile(getFlowwatchEnvPath(), buildEnvFile(existing, store), "utf-8")
}

/** API key from store or process.env. Never log or send this to the client. */
export function getGroqApiKey(): string | undefined {
    return (
        store.groqApiKey ||
        process.env.FLOWWATCH_GROQ_API_KEY ||
        process.env.GROQ_API_KEY
    )
}

/** Model from store or process.env. */
export function getGroqModel(): string | undefined {
    return (
        store.groqModel ||
        process.env.FLOWWATCH_GROQ_MODEL ||
        process.env.GROQ_MODEL ||
        undefined
    )
}

/** True if any API key source is available. Safe to send to the client. */
export function isGroqApiKeyConfigured(): boolean {
    return Boolean(getGroqApiKey())
}
```

---

