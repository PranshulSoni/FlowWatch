import type { Client } from "@elastic/elasticsearch"
import type { ErrorRow } from "../../persistence/repositories/errors/errorRepository.js"
import type { TraceSpanRow } from "../../persistence/repositories/traces/traceRepository.js"

export const errorIndex = "pilot_errors"
export const traceSpanIndex = "pilot_trace_spans"

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
