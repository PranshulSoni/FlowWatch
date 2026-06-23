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
import { createWorkflowQueue, getFailedJobs, requeueFailedJob } from "./engine/background/queues/workflowQueue.js"
import { createWorkflowWorker } from "./engine/background/workers/workflowWorker.js"
import { createFlagEngine } from "./engine/flags/flagEngine.js"
import type { EvaluateFlag } from "./engine/flags/types.js"
import { createRequestTracingMiddleware } from "./runtime/tracing/tracingMiddleware.js"
import { createTraceEngine, type TraceFunction } from "./engine/trace/traceEngine.js"
import { createTracedQuery, createTracedFetch, type TracedQuery, type TracedFetch } from "./engine/trace/autoInstrumentation.js"
import { captureError, createErrorHandler, type CaptureErrorFunction } from "./engine/errors/errorEngine.js"
import { json, urlencoded, type ErrorRequestHandler, type RequestHandler, type Router } from "express"
import helmet from "helmet"
import { createMissingMappings } from "./search/elasticsearch/mappingChecker.js"
import { createRedisClient } from "./persistence/cache/redisClient.js"
import pino from "pino"
import { logger, type Logger } from "./logger.js"
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
import { createCronEngine, type RegisterCron } from "./runtime/cronEngine.js"
import { createWebhookEngine, type WebhookEngine } from "./runtime/webhookEngine.js"
import { createTenantResolver, type TenantResolverOptions } from "./runtime/tenantResolver.js"
import { createHealthRouter, type HealthCheckResult } from "./runtime/healthCheck.js"
import { createAuditEngine, type AuditEngine } from "./runtime/auditLog.js"
import { createRequestIdMiddleware } from "./runtime/requestId.js"
import { createAuth } from "@pranshul_soni/authapi"
import { createOpenApiRouter } from "./runtime/openapi.js"
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
    // CRON scheduler — register recurring background jobs
    cron: RegisterCron
    // Webhooks — register endpoints and deliver signed events with retries
    webhook: WebhookEngine
    // Body parsing middleware — JSON + URL-encoded with configurable size limit
    bodyParser: RequestHandler
    // Request timeout — returns 503 if handler doesn't respond within ms
    timeout: (ms?: number) => RequestHandler
    // Maintenance mode — returns 503 to all requests when isEnabled() is true
    maintenanceMode: (isEnabled: () => boolean | Promise<boolean>) => RequestHandler
    // Security headers — helmet middleware (pass false to disable, or a helmet options object)
    securityHeaders: RequestHandler
    // Dead Letter Queue — inspect and retry permanently failed workflow jobs
    dlq: {
        getFailedJobs: (limit?: number) => Promise<any[]>
        requeueJob: (jobId: string) => Promise<void>
    }
    // Pino logger instance scoped to this FlowWatch app
    logger: Logger
    // Auth — JWT router + protect/requireRole/requireVerifiedEmail middleware (undefined if no auth config provided)
    auth?: {
        router: Router
        protect: RequestHandler
        requireRole: (role: string) => RequestHandler
        requireVerifiedEmail: RequestHandler
    }
    // OpenAPI docs — mount anywhere, serves Swagger UI + /openapi.json (undefined if no openapi config provided)
    docs?: Router
    // Audit log — auto-capture every request with fire-and-forget writes + nightly cleanup
    audit: AuditEngine
    // Health check — mount as a router; returns Postgres/Redis/Elasticsearch status
    health: Router
    // Rotate the JWT secret without restarting — all new sign/verify calls use the new secret immediately
    rotateSecret: (newSecret: string) => void
    // Tenant resolver — sets req.tenantId from subdomain, header, or JWT claim
    tenantResolver: (options: TenantResolverOptions) => RequestHandler
    // Request ID — attaches x-request-id to every request and response
    requestId: () => RequestHandler
    // Clean up connections and workers
    close: () => Promise<void>
}

export async function createFlowwatch(config: FlowwatchConfig): Promise<Flowwatch> {
    await loadFlowwatchEnv()

    const validConfig = validateConfig(config)
    const normalizedConfig = await normalizeConfig(validConfig)
    const postgresPool = createPostgresPool(normalizedConfig.db)
    const headersConfig = validConfig.security?.headers
    const securityHeaders: RequestHandler = headersConfig === false
        ? (_req, _res, next) => next()
        : helmet(headersConfig as any)

    const bodyLimit = normalizedConfig.server.bodyLimit
    const jsonParser = json({ limit: bodyLimit })
    const formParser = urlencoded({ limit: bodyLimit, extended: false })
    const bodyParser: RequestHandler = (req, res, next) => {
        jsonParser(req, res, (err) => {
            if (err) return next(err)
            formParser(req, res, next)
        })
    }

    const logStore = createLogStore(postgresPool)
    const instanceLogger = pino(
        { name: normalizedConfig.runtime.serviceName ?? "flowwatch", level: process.env.LOG_LEVEL ?? "info" },
        pino.multistream([{ stream: process.stdout }, { stream: logStore.stream }])
    )
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

    const secretStore = { current: validConfig.auth?.jwtSecret ?? "" }

    let authInstance: Awaited<ReturnType<typeof createAuth>> | null = null
    if (validConfig.auth) {
        authInstance = await createAuth({
            db: normalizedConfig.db,
            ...validConfig.auth,
            jwtSecret: () => secretStore.current,
        })
    }

    const docsRouter = validConfig.openapi
        ? createOpenApiRouter(validConfig.openapi, !!validConfig.auth)
        : null

    const maintenanceMode = (isEnabled: () => boolean | Promise<boolean>): RequestHandler =>
        async (_req, res, next) => {
            if (await isEnabled()) {
                res.set("Retry-After", "60")
                res.status(503).json({ error: "Service temporarily unavailable." })
                return
            }
            next()
        }

    const defaultTimeout = normalizedConfig.server.timeout
    const timeout = (ms: number = defaultTimeout): RequestHandler => (req, res, next) => {
        const timer = setTimeout(() => {
            if (!res.headersSent) {
                captureFlowwatchError(new Error("Request timed out"), {
                    source: "http",
                    category: "server",
                    level: "warning",
                    statusCode: 503,
                    metadata: { method: req.method, path: req.path },
                }).catch(() => {})
                res.status(503).json({ error: "Request timed out." })
            }
        }, ms)
        res.on("finish", () => clearTimeout(timer))
        res.on("close", () => clearTimeout(timer))
        next()
    }

    let workflowWorkerInstance: any = null
    if (normalizedConfig.worker.enabled && workflowQueue !== null) {
        try {
            workflowWorkerInstance = createWorkflowWorker({
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

    let cronEngine: ReturnType<typeof createCronEngine> | null = null
    try {
        cronEngine = createCronEngine(normalizedConfig.redis.url, captureFlowwatchError)
    } catch (err: any) {
        logger.warn({ err: err?.message }, "Cron engine unavailable, scheduled jobs disabled")
    }

    const auditEngine = createAuditEngine(postgresPool, cronEngine)

    let webhookEngine: WebhookEngine | null = null
    try {
        webhookEngine = createWebhookEngine(postgresPool, normalizedConfig.redis.url, captureFlowwatchError)
    } catch (err: any) {
        logger.warn({ err: err?.message }, "Webhook engine unavailable, webhook delivery disabled")
    }

    const close = async () => {
        if (workflowWorkerInstance) {
            await workflowWorkerInstance.close()
        }
        if (workflowQueue) {
            await workflowQueue.close()
        }
        if (cronEngine) {
            await cronEngine.close()
        }
        if (webhookEngine) {
            await webhookEngine.close()
        }
        await redisClient.quit()
        await postgresPool.end()
        await elasticsearchClient.close()
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
        cron: cronEngine
            ? cronEngine.cron
            : (name: string) => { logger.warn({ cronJob: name }, "Cron unavailable — Redis not connected") },
        webhook: webhookEngine ?? {
            register: () => Promise.reject(new Error("Webhook engine unavailable")),
            deliver: () => Promise.resolve(),
            remove: () => Promise.reject(new Error("Webhook engine unavailable")),
            list: () => Promise.resolve([]),
            close: () => Promise.resolve()
        },
        securityHeaders,
        dlq: {
            getFailedJobs: (limit?: number) => workflowQueue
                ? getFailedJobs(workflowQueue, limit)
                : Promise.resolve([]),
            requeueJob: (jobId: string) => workflowQueue
                ? requeueFailedJob(workflowQueue, jobId)
                : Promise.reject(new Error("Workflow queue unavailable")),
        },
        bodyParser,
        timeout,
        maintenanceMode,
        logger: instanceLogger,
        auth: authInstance ?? undefined,
        docs: docsRouter ?? undefined,
        audit: auditEngine,
        health: createHealthRouter(postgresPool, redisClient, elasticsearchClient),
        rotateSecret: (newSecret: string) => { secretStore.current = newSecret },
        tenantResolver: (opts: TenantResolverOptions) => createTenantResolver(opts),
        requestId: () => createRequestIdMiddleware(),
        close,
    }
}
