export { createFlowwatch } from "./createFlowwatch.js"
export type { Flowwatch } from "./createFlowwatch.js"
export { logger } from "./logger.js"
export type { Logger } from "./logger.js"
export { startSidecar, createSidecarRouter } from "./server/sidecarServer.js"
export type { FlowwatchConfig } from "./types/index.js"
export type { TriggerWorkflow, WorkflowStep, WorkflowStepHandler } from "./engine/workflows/types.js"
export type { EvaluateFlag, FlagContext } from "./engine/flags/types.js"
export type { ActiveTraceSpan, TraceFunction } from "./engine/trace/traceEngine.js"
export type { TraceSpanType, TraceStatus } from "./persistence/repositories/traces/traceRepository.js"
export { getCurrentClientIp, getCurrentSpanId, getCurrentTraceId } from "./runtime/tracing/traceContext.js"
export { createRequestTracingMiddleware } from "./runtime/tracing/tracingMiddleware.js"

// HTTP Caching
export type { HttpCacheOptions } from "./runtime/httpCache.js"

// Server-Sent Events
export { createSseConnection } from "./server/sse.js"
export type { SseConnection } from "./server/sse.js"

// Response Cache
export type { ResponseCacheOptions } from "./persistence/cache/responseCache.js"

// Query Cache
export type { QueryCache, QueryCacheOptions } from "./persistence/cache/queryCache.js"

// Full-text search
export type { FullTextSearch, SearchOptions, SearchResult } from "./search/fullTextSearch.js"

// Bulkhead
export type { Bulkhead, BulkheadOptions } from "./runtime/bulkhead.js"

// Testing utilities
export { createMockPool, createMockRedis } from "./testing/index.js"

// Rate limiting
export type { RateLimitOptions, RateLimitAlgorithm } from "./runtime/rateLimit.js"

// IP filtering
export type { IpFilterOptions } from "./runtime/ipFilter.js"

// API versioning
export type { ApiVersionOptions } from "./runtime/apiVersion.js"
export { createVersionRouter, createVersionMiddleware } from "./runtime/apiVersion.js"

// WebSocket
export { createWebSocketServer } from "./runtime/websocket.js"
export type { FlowwatchWebSocket } from "./runtime/websocket.js"

// Log store
export type { LogEntry, LogQueryOptions } from "./runtime/logStore.js"

// Circuit breaker
export type { CircuitBreaker, CircuitBreakerOptions } from "./runtime/circuitBreaker.js"

// Event bus
export type { EventBus } from "./runtime/eventBus.js"

// Prometheus metrics
export type { MetricsEngine } from "./runtime/metricsEngine.js"

// Auto-traced helpers
export type { TracedQuery, TracedFetch } from "./engine/trace/autoInstrumentation.js"

// CRON scheduler
export type { RegisterCron } from "./runtime/cronEngine.js"

// Webhooks
export type { WebhookEngine } from "./runtime/webhookEngine.js"
export type { WebhookRow } from "./persistence/repositories/webhooks/webhookRepository.js"
