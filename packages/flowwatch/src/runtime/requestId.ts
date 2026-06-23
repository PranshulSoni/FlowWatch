import { randomUUID } from "crypto"
import type { RequestHandler } from "express"

const HEADER = "x-request-id"

declare global {
    namespace Express {
        interface Request {
            requestId?: string
        }
    }
}

export function createRequestIdMiddleware(): RequestHandler {
    return (req, res, next) => {
        const id = (req.headers[HEADER] as string | undefined) ?? randomUUID()
        req.requestId = id
        res.setHeader(HEADER, id)
        next()
    }
}
