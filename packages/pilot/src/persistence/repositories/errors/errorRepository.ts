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

export async function getErrorById(
    pool: Pool,
    errorId: string
): Promise<ErrorRow | undefined> {
    const result = await pool.query<ErrorRow>(
        `
        SELECT *
        FROM pilot_errors
        WHERE id = $1
        `,
        [errorId]
    )

    return result.rows[0]
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
