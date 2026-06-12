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

export async function createRequestTrace(pool: Pool,input: CreateRequestTraceInput):Promise<RequestTraceRow> {
    const result = await pool.query<RequestTraceRow>(
        `
        INSERT INTO pilot_request_traces (
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

export async function finishRequestTrace(pool: Pool,input: FinishRequestTraceInput):Promise<RequestTraceRow | undefined> {
    const result = await pool.query<RequestTraceRow>(
        `
        UPDATE pilot_request_traces
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
        INSERT INTO pilot_trace_spans (
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

export async function finishTraceSpan(pool: Pool,input: FinishTraceSpanInput):Promise<TraceSpanRow | undefined> {
    const result = await pool.query<TraceSpanRow>(
        `
        UPDATE pilot_trace_spans
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

export async function createError(
    pool: Pool,
    input: CreateErrorInput
): Promise<ErrorRow> {
    const result = await pool.query<ErrorRow>(
        `
        INSERT INTO pilot_errors (
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

export async function getRequestTrace(
    pool: Pool,
    traceId: string
): Promise<RequestTraceRow | undefined> {
    const result = await pool.query<RequestTraceRow>(
        `
        SELECT *
        FROM pilot_request_traces
        WHERE id = $1
        `,
        [traceId]
    )

    return result.rows[0]
}

export async function getTraceSpans(
    pool: Pool,
    traceId: string
): Promise<TraceSpanRow[]> {
    const result = await pool.query<TraceSpanRow>(
        `
        SELECT *
        FROM pilot_trace_spans
        WHERE trace_id = $1
        ORDER BY started_at ASC
        `,
        [traceId]
    )

    return result.rows
}

export async function getErrorsByTrace(
    pool: Pool,
    traceId: string
): Promise<ErrorRow[]> {
    const result = await pool.query<ErrorRow>(
        `
        SELECT *
        FROM pilot_errors
        WHERE trace_id = $1
        ORDER BY occurred_at DESC
        `,
        [traceId]
    )

    return result.rows
}

export async function listErrors(
    pool: Pool,
    limit = 50
): Promise<ErrorRow[]> {
    const result = await pool.query<ErrorRow>(
        `
        SELECT *
        FROM pilot_errors
        ORDER BY occurred_at DESC
        LIMIT $1
        `,
        [limit]
    )

    return result.rows
}
