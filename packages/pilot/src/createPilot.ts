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
import { createErrorHandler } from "./engine/errors/errorEngine.js"
import type { ErrorRequestHandler, RequestHandler, Router } from "express"
export interface Pilot {
    dashboard: Router
    workflow: RegisterWorkflow
    trigger: TriggerWorkflow
    flag: EvaluateFlag
    requestTracer: RequestHandler
    startSpan: (name: string, type: TraceSpanType, metadata?: unknown) => Promise<ActiveTraceSpan | undefined>
    endSpan: (span: ActiveTraceSpan | undefined, status: TraceStatus, metadata?: unknown) => Promise<void>
    trace: TraceFunction
    errorHandler:ErrorRequestHandler
}

export async function createPilot(config: PilotConfig): Promise<Pilot> {
    const validConfig = validateConfig(config)
    const normalizedConfig = await normalizeConfig(validConfig)
    const postgresPool = createPostgresPool(normalizedConfig.db)
    if(normalizedConfig.migrations.autoRun){
        await runMigrations(postgresPool,migrations);
    }
    const redisClient = new Redis(normalizedConfig.redis.url)
    const elasticsearchClient = createElasticsearchClient(normalizedConfig.elasticsearch.node)
    const workflowQueue= createWorkflowQueue(normalizedConfig.redis.url);
    const traceEngine = createTraceEngine(postgresPool)
    const workflowEngine = createWorkflowEngine({
        pool: postgresPool,
        workflowQueue,
        traceEngine,
    })
    const flagEngine = createFlagEngine(postgresPool, traceEngine)
    const requestTracer = createRequestTracingMiddleware(postgresPool)
    const errorHandler=createErrorHandler(postgresPool);

    if (normalizedConfig.worker.enabled) {
        createWorkflowWorker({
            redisUrl: normalizedConfig.redis.url,
            pool: postgresPool,
            getWorkflow: workflowEngine.getWorkflow,
            traceEngine,
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
        startSpan: traceEngine.startSpan,
        endSpan: traceEngine.endSpan,
        trace:traceEngine.trace,
        errorHandler
    }
}