import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { loadPilotEnv } from "./utils/pilotEnvStore.js"
import { createDashboardRouter } from "./dashboard/routes/router.js"
import type { PilotConfig } from "./types/index.js"
import { validateConfig } from "./runtime/config/validationConfig.js"
import { normalizeConfig } from "./runtime/config/normalizeConfig.js"
import { createPostgresPool } from "./persistence/db/postgres.js"
import { createElasticsearchClient } from "./search/elasticsearch/client.js"
import { Redis } from "ioredis"
import { runMigrations } from "./persistence/migrations/migrationRunner.js"
import { migrations } from "./persistence/migrations/migrations.js"
import { createWorkflowEngine } from "./engine/workflows/workflowEngine.js"
import type { RegisterWorkflow, TriggerWorkflow } from "./engine/workflows/types.js"
import { createWorkflowQueue } from "./engine/background/queues/workflowQueue.js"
import { createWorkflowWorker } from "./engine/background/workers/workflowWorker.js"
import { createFlagEngine } from "./engine/flags/flagEngine.js"
import type { EvaluateFlag } from "./engine/flags/types.js"
import { createRequestTracingMiddleware } from "./runtime/tracing/tracingMiddleware.js"
import { createTraceEngine, type ActiveTraceSpan, type TraceFunction } from "./engine/trace/traceEngine.js"
import type { TraceSpanType, TraceStatus } from "./persistence/repositories/traces/traceRepository.js"
import { captureError, createErrorHandler, type CaptureErrorFunction } from "./engine/errors/errorEngine.js"
import type { ErrorRequestHandler, RequestHandler, Router } from "express"
import { createMissingMappings } from "./search/elasticsearch/mappingChecker.js"
import { createRedisClient } from "./persistence/cache/redisClient.js"

export interface Pilot {
    dashboard: Router
    workflow: RegisterWorkflow
    trigger: TriggerWorkflow
    flag: EvaluateFlag
    requestTracer: RequestHandler
    trace: TraceFunction
    errorHandler: ErrorRequestHandler
    captureError: CaptureErrorFunction
}

export async function createPilot(config: PilotConfig): Promise<Pilot> {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)

    // ── One-time migration: move API key from legacy config.yaml → .pilot.env ──
    // Previous package versions stored the Groq API key in config.yaml next to
    // the compiled output.  Read it once on startup and persist to .pilot.env.
    try {
        const { readFile: rf } = await import("node:fs/promises")
        const { join: pjoin } = await import("node:path")
        const { load } = await import("js-yaml")
        const legacyPath = pjoin(__dirname, "../config.yaml")
        const raw = await rf(legacyPath, "utf-8")
        const yaml = load(raw) as Record<string, any>
        if (yaml?.groq?.apiKey) {
            await loadPilotEnv() // load first so we don't overwrite other stored values
            const { savePilotEnv } = await import("./utils/pilotEnvStore.js")
            await savePilotEnv({ groqApiKey: yaml.groq.apiKey, groqModel: yaml.groq?.model })
            console.log("[Pilot] ✅ Migrated Groq API key from legacy config.yaml to .pilot.env")
            // We've already called loadPilotEnv, skip the call below
        } else {
            await loadPilotEnv()
        }
    } catch {
        // config.yaml absent or unreadable — normal path, just load .pilot.env
        await loadPilotEnv()
    }


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
        console.warn(`[Pilot] ⚠️  Workflow queue unavailable (${reason}). Workflows will be registered but cannot be executed until Redis ≥ 5 is available.`)
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
    const capturePilotError: CaptureErrorFunction = (error, options) => {
        return captureError(errorEngineOptions, error, options)
    }
    const flagEngine = createFlagEngine(postgresPool, traceEngine, capturePilotError, redisClient)
    await createMissingMappings(elasticsearchClient)

    if (normalizedConfig.worker.enabled && workflowQueue !== null) {
        try {
            createWorkflowWorker({
                redisUrl: normalizedConfig.redis.url,
                pool: postgresPool,
                getWorkflow: workflowEngine.getWorkflow,
                traceEngine,
                captureError: capturePilotError,
            })
        } catch (err: any) {
            console.warn(`[Pilot] ⚠️  Workflow worker could not start: ${err?.message}`)
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
        captureError: capturePilotError,
    }
}
