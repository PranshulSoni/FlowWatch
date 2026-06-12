import type { ErrorRequestHandler } from "express"
import type { Pool } from "pg"
import { getCurrentTraceId, getCurrentSpanId } from "../../runtime/tracing/traceContext.js"
import { createError, type ErrorCategory } from "../../persistence/repositories/errors/errorRepository.js"
export interface NormalizedError {
    name: string
    message: string
    stack?: string
}

export function createErrorHandler(pool: Pool): ErrorRequestHandler {
    return async function pilotErrorHandler(error, req, res, next) {
        const normalizedError = normalizeError(error)
        const statusCode = getStatusCode(error, res.statusCode)
        const traceId = getCurrentTraceId()
        const spanId = getCurrentSpanId()
        const category = getErrorCategory(statusCode);
        try {
            await createError(pool, {
                traceId,
                spanId,
                source: "http",
                category,
                level: "error",
                message: normalizedError.message,
                stack: normalizedError.stack,
                name: normalizedError.name,
                statusCode,
                metadata: {
                    method: req.method,
                    path: req.originalUrl || req.path,
                },
            })
        }
        catch (errorCaptureFailure) {
            console.error("Failed to capture error", errorCaptureFailure)
        }

        if (res.headersSent) {
            return next(error)
        }

        res.status(statusCode).json({
            message: statusCode >= 500 ? "Internal server error" : normalizedError.message,
        })
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
