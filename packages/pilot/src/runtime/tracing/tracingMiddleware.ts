import type { NextFunction, Request, RequestHandler, Response } from "express"
import type { Pool } from "pg"
import { createRequestTrace, finishRequestTrace } from "../../persistence/repositories/traces/traceRepository.js"
import { runWithTraceContext } from "./traceContext.js"

export function createRequestTracingMiddleware(pool: Pool): RequestHandler {
    return async function requestTracingMiddleware(req: Request, res: Response, next: NextFunction) {
        const startedAt = Date.now()
        const clientIp = getClientIp(req)

        try {
            const trace = await createRequestTrace(pool, {
                method: req.method,
                path: req.originalUrl || req.path,
                ip: clientIp,
            })

            res.on("finish", () => {
                void finishRequestTrace(pool, {
                    traceId: trace.id,
                    statusCode: res.statusCode,
                    durationMs: Date.now()-startedAt,
                }).catch(() => {
                })
            })

            runWithTraceContext({traceId: trace.id,ip: clientIp,},
                next
            )
        }
        catch {
            next()
        }
    }
}

function getClientIp(req: Request): string | undefined {
    const forwardedFor = req.get("x-forwarded-for")

    if (forwardedFor) {
        return forwardedFor.split(",")[0]?.trim()
    }

    return req.ip || req.socket.remoteAddress || undefined
}
