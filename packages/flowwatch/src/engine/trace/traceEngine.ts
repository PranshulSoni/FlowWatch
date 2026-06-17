import type { Client } from "@elastic/elasticsearch"
import type { Pool } from "pg"
import { createTraceSpan, finishTraceSpan, type TraceSpanType, type TraceStatus } from "../../persistence/repositories/traces/traceRepository.js"
import { getCurrentSpanId, getCurrentTraceId, runWithSpanContext } from "../../runtime/tracing/traceContext.js"
import { indexTraceSpan } from "../../search/elasticsearch/indexer.js"
import { captureError } from "../errors/errorEngine.js"
import { logger } from "../../logger.js"

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
        logger.warn({ err: traceIndexingFailure }, "Failed to index trace span")
    }
}

export function runInsideSpan<T>(span: ActiveTraceSpan | undefined, callback: TraceCallback<T>): T | Promise<T> {
    if (!span) {
        return callback()
    }

    return runWithSpanContext(span.id, callback)
}
