import { loadFlowwatchEnv } from "./utils/flowwatchEnvStore.js"
import { createDashboardRouter } from "./dashboard/routes/router.js"
import type { FlowwatchConfig } from "./types/index.js"
import { validateConfig } from "./runtime/config/validationConfig.js"
import { normalizeConfig } from "./runtime/config/normalizeConfig.js"
import { createPostgresPool } from "./persistence/db/postgres.js"
import { createElasticsearchClient } from "./search/elasticsearch/client.js"
import { runMigrations, rollbackLastMigration } from "./persistence/migrations/migrationRunner.js"
import { migrations } from "./persistence/migrations/migrations.js"
import { createWorkflowEngine } from "./engine/workflows/workflowEngine.js"
import type { RegisterWorkflow, TriggerWorkflow } from "./engine/workflows/types.js"
import { createWorkflowQueue } from "./engine/background/queues/workflowQueue.js"
import { createWorkflowWorker } from "./engine/background/workers/workflowWorker.js"
import { createFlagEngine } from "./engine/flags/flagEngine.js"
import type { EvaluateFlag } from "./engine/flags/types.js"
import { createRequestTracingMiddleware } from "./runtime/tracing/tracingMiddleware.js"
import { createTraceEngine, type TraceFunction } from "./engine/trace/traceEngine.js"
import { createTracedQuery, createTracedFetch, type TracedQuery, type TracedFetch } from "./engine/trace/autoInstrumentation.js"
import { captureError, createErrorHandler, type CaptureErrorFunction } from "./engine/errors/errorEngine.js"
import type { ErrorRequestHandler, RequestHandler, Router } from "express"
import { createMissingMappings } from "./search/elasticsearch/mappingChecker.js"
import { createRedisClient } from "./persistence/cache/redisClient.js"
import { logger } from "./logger.js"
import { createHttpCacheMiddleware, type HttpCacheOptions } from "./runtime/httpCache.js"
import { createResponseCacheMiddleware, type ResponseCacheOptions } from "./persistence/cache/responseCache.js"
import { createQueryCache, type QueryCache } from "./persistence/cache/queryCache.js"
import { createFullTextSearch, type FullTextSearch } from "./search/fullTextSearch.js"
import { createBulkhead, type Bulkhead, type BulkheadOptions } from "./runtime/bulkhead.js"
import { createRateLimitMiddleware, type RateLimitOptions } from "./runtime/rateLimit.js"
import { createIpFilterMiddleware, type IpFilterOptions } from "./runtime/ipFilter.js"
import { createVersionRouter, createVersionMiddleware, type ApiVersionOptions } from "./runtime/apiVersion.js"
import { createWebSocketServer, type FlowwatchWebSocket } from "./runtime/websocket.js"
import { createLogStore, type LogStore } from "./runtime/logStore.js"
import { createCircuitBreaker, type CircuitBreaker, type CircuitBreakerOptions } from "./runtime/circuitBreaker.js"
import { createEventBus, type EventBus } from "./runtime/eventBus.js"
import { createMetricsEngine, type MetricsEngine } from "./runtime/metricsEngine.js"
import type { Server } from "http"

export interface Flowwatch {
    dashboard: Router
    workflow: RegisterWorkflow
    trigger: TriggerWorkflow
    flag: EvaluateFlag
    requestTracer: RequestHandler
    trace: TraceFunction
    errorHandler: ErrorRequestHandler
    captureError: CaptureErrorFunction
    rollbackMigration: () => Promise<void>
    httpCache: (options?: HttpCacheOptions) => RequestHandler
    responseCache: (options: ResponseCacheOptions) => RequestHandler
    queryCache: QueryCache
    search: FullTextSearch["search"]
    bulkhead: (options: BulkheadOptions) => Bulkhead
    rateLimit: (options: RateLimitOptions) => RequestHandler
    ipFilter: (options: IpFilterOptions) => RequestHandler
    version: () => Router
    versionMiddleware: (options?: ApiVersionOptions) => RequestHandler
    // WebSocket — attach a WebSocket server to your HTTP server
    websocket: (server: Server, path?: string) => FlowwatchWebSocket
    // Structured log store — query logs persisted to Postgres
    logs: Pick<LogStore, "query">
    // Circuit breaker — stop calling a failing dependency until it recovers
    circuitBreaker: (options?: CircuitBreakerOptions) => CircuitBreaker
    // Internal event bus — emit and listen for application-level events
    events: EventBus
    // Prometheus metrics — mount middleware and expose /metrics handler
    metrics: MetricsEngine
    // Auto-traced helpers — use instead of db queries / fetches for automatic span recording
    query: TracedQuery
    fetch: TracedFetch
}

export async function createFlowwatch(config: FlowwatchConfig): Promise<Flowwatch> {
    await loadFlowwatchEnv()

    const validConfig = validateConfig(config)
    const normalizedConfig = await normalizeConfig(validConfig)
    const postgresPool = createPostgresPool(normalizedConfig.db)
    const logStore = createLogStore(postgresPool)
    const eventBus = createEventBus()
    const metricsEngine = createMetricsEngine()
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
        logger.warn({ err: reason }, "Workflow queue unavailable, background jobs disabled")
        workflowQueue = null
    }

    const traceEngine = createTraceEngine({
        pool: postgresPool,
        elasticsearchClient,
    })
    const tracedQuery = createTracedQuery(postgresPool, traceEngine)
    const tracedFetch = createTracedFetch(traceEngine)
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
            logger.warn({ err: err?.message }, "Workflow worker could not start")
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
        rollbackMigration: () => rollbackLastMigration(postgresPool, migrations),
        httpCache: (options?: HttpCacheOptions) => createHttpCacheMiddleware(options),
        responseCache: (options: ResponseCacheOptions) => createResponseCacheMiddleware(redisClient, options),
        queryCache: createQueryCache(postgresPool, redisClient),
        search: createFullTextSearch(postgresPool).search,
        bulkhead: (opts: BulkheadOptions) => createBulkhead(opts),
        rateLimit: (opts: RateLimitOptions) => createRateLimitMiddleware(redisClient, opts),
        ipFilter: (opts: IpFilterOptions) => createIpFilterMiddleware(opts),
        version: () => createVersionRouter(),
        versionMiddleware: (opts?: ApiVersionOptions) => createVersionMiddleware(opts),
        websocket: (server: Server, path?: string) => createWebSocketServer(server, path),
        logs: { query: logStore.query },
        circuitBreaker: (opts?: CircuitBreakerOptions) => createCircuitBreaker(opts),
        events: eventBus,
        metrics: metricsEngine,
        query: tracedQuery,
        fetch: tracedFetch,
    }
}
