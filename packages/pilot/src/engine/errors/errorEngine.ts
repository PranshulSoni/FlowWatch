import type { ErrorRequestHandler } from "express"
import type { Pool } from "pg"
import type { Client } from "@elastic/elasticsearch"
import { createHash } from "node:crypto"
import { getCurrentTraceId, getCurrentSpanId } from "../../runtime/tracing/traceContext.js"
import {
    createError,
    type ErrorCategory,
    type ErrorLevel,
    type ErrorRow,
    type ErrorSource,
} from "../../persistence/repositories/errors/errorRepository.js"
import { indexError } from "../../search/elasticsearch/indexer.js"

export interface NormalizedError {
    name: string
    message: string
    stack?: string
}

export interface ErrorEngineOptions {
    pool: Pool
    elasticsearchClient: Client
}

export interface CaptureErrorOptions {
    source: ErrorSource
    category?: ErrorCategory
    level?: ErrorLevel
    statusCode?: number
    metadata?: unknown
    occurredAt?: Date
}

export type CaptureErrorFunction = (
    error: unknown,
    options: CaptureErrorOptions
) => Promise<ErrorRow | undefined>

export function createErrorHandler(options: ErrorEngineOptions): ErrorRequestHandler {
    return async function pilotErrorHandler(error, req, res, next) {
        const normalizedError = normalizeError(error)
        const statusCode = getStatusCode(error, res.statusCode)

        // Log every uncaught error with route info so we can trace the primary cause
        console.error(`[Pilot] Unhandled error on ${req.method} ${req.originalUrl || req.path}:`, normalizedError.message)

        await captureError(options, error, {
            source: "http",
            category: getErrorCategory(statusCode),
            level: "error",
            statusCode,
            metadata: {
                method: req.method,
                path: req.originalUrl || req.path,
            },
        })

        if (res.headersSent) {
            return next(error)
        }

        res.status(statusCode).json({
            message: statusCode >= 500 ? "Internal server error" : normalizedError.message,
        })
    }
}

export async function captureError(engineOptions: ErrorEngineOptions,error: unknown,captureOptions: CaptureErrorOptions): Promise<ErrorRow | undefined> {
    const normalizedError = normalizeError(error)
    const statusCode = captureOptions.statusCode ?? getStatusCode(error, 500)
    const category = captureOptions.category ?? getErrorCategory(statusCode)
    const fingerprint = createErrorFingerprint({
        source: captureOptions.source,
        category,
        name: normalizedError.name,
        message: normalizedError.message,
        statusCode,
    })

    try {
        const storedError = await createError(engineOptions.pool, {
            traceId: getCurrentTraceId(),
            spanId: getCurrentSpanId(),
            source: captureOptions.source,
            category,
            level: captureOptions.level ?? "error",
            message: normalizedError.message,
            stack: normalizedError.stack,
            name: normalizedError.name,
            statusCode,
            fingerprint,
            metadata: captureOptions.metadata,
            occurredAt: captureOptions.occurredAt,
        })

        try {
            await indexError(engineOptions.elasticsearchClient, storedError)
        }
        catch (errorIndexingFailure) {
            console.error("Failed to index error", errorIndexingFailure)
        }

        return storedError
    }
    catch (errorCaptureFailure) {
        console.error("[Pilot] Failed to capture error", errorCaptureFailure)
        return undefined
    }
}

export function normalizeError(error: unknown): NormalizedError {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack,
        }
    }

    if (typeof error === "string") {
        return {
            name: "UnknownError",
            message: error,
        }
    }

    return {
        name: "UnknownError",
        message: "Unknown error",
    }
}

export function getStatusCode(error: unknown, responseStatusCode: number): number {
    if (typeof error === "object" && error !== null) {
        const errorObject = error as { statusCode?: unknown; status?: unknown }

        if (typeof errorObject.statusCode === "number") {
            return errorObject.statusCode
        }

        if (typeof errorObject.status === "number") {
            return errorObject.status
        }
    }

    if (responseStatusCode >= 400) {
        return responseStatusCode
    }

    return 500
}


export function getErrorCategory(statusCode: number): ErrorCategory {
    if (statusCode >= 400 && statusCode < 500) {
        return "client"
    }

    if (statusCode >= 500 && statusCode < 600) {
        return "server"
    }

    return "unknown"
}

interface ErrorFingerprintInput {
    source: ErrorSource
    category: ErrorCategory
    name: string
    message: string
    statusCode: number
}

function createErrorFingerprint(input: ErrorFingerprintInput): string {
    return createHash("sha256")
        .update(`${input.source}:${input.category}:${input.name}:${input.message}:${input.statusCode}`)
        .digest("hex")
}
