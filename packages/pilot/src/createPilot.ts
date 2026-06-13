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
    const validConfig = validateConfig(config)
    const normalizedConfig = await normalizeConfig(validConfig)
    const postgresPool = createPostgresPool(normalizedConfig.db)
    if (normalizedConfig.migrations.autoRun) {
        await runMigrations(postgresPool, migrations);
    }
    const redisClient = new Redis(normalizedConfig.redis.url)
    const elasticsearchClient = createElasticsearchClient(normalizedConfig.elasticsearch.node)
    const workflowQueue = createWorkflowQueue(normalizedConfig.redis.url);
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
    const flagEngine = createFlagEngine(postgresPool, traceEngine, capturePilotError)
    await createMissingMappings(elasticsearchClient)
    if (normalizedConfig.worker.enabled) {
        createWorkflowWorker({
            redisUrl: normalizedConfig.redis.url,
            pool: postgresPool,
            getWorkflow: workflowEngine.getWorkflow,
            traceEngine,
            captureError: capturePilotError,
        })
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
