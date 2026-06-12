import type { Pool } from "pg"
import { createTraceSpan, finishTraceSpan, type TraceSpanType, type TraceStatus } from "../../persistence/repositories/errors/errorRepository.js"
import { getCurrentSpanId, getCurrentTraceId, runWithSpanContext } from "../../runtime/tracing/traceContext.js"

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
    startSpan: (name: string, type: TraceSpanType, metadata?: unknown) => Promise<ActiveTraceSpan | undefined>
    endSpan: (span: ActiveTraceSpan | undefined, status: TraceStatus, metadata?: unknown) => Promise<void>
    trace: TraceFunction
}

export function createTraceEngine(pool: Pool): TraceEngine {
    async function trace<T>(
        name: string,
        type: TraceSpanType,
        callback: TraceCallback<T>,
        metadata?: unknown
    ): Promise<T> {
        const span = await startSpan(pool, name, type, { metadata })

        try {
            const result = await runInsideSpan(span, callback)
            await endSpan(pool, span, "ok")
            return result
        }
        catch (error) {
            await endSpan(pool, span, "error")
            throw error
        }
    }

    return {
        startSpan: (name, type, metadata) => startSpan(pool, name, type, { metadata }),
        endSpan: (span, status, metadata) => endSpan(pool, span, status, { metadata }),
        trace,
    }
}

export async function startSpan(
    pool: Pool,
    name: string,
    type: TraceSpanType,
    options: StartSpanOptions = {}
): Promise<ActiveTraceSpan | undefined> {
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

export async function endSpan(
    pool: Pool,
    span: ActiveTraceSpan | undefined,
    status: TraceStatus,
    options: EndSpanOptions = {}
): Promise<void> {
    if (!span) {
        return
    }

    await finishTraceSpan(pool, {
        spanId: span.id,
        status,
        durationMs: Date.now() - span.startedAt,
        metadata: options.metadata,
    })
}

export function runInsideSpan<T>(
    span: ActiveTraceSpan | undefined,
    callback: TraceCallback<T>
): T | Promise<T> {
    if (!span) {
        return callback()
    }

    return runWithSpanContext(span.id, callback)
}
