import type { RequestHandler, Request } from "express"

export interface TenantResolverOptions {
    from: "subdomain" | "header" | "jwt"
    header?: string      // default "x-tenant-id"
    jwtClaim?: string    // default "tenantId"
    onMissing?: "reject" | "ignore"   // default "reject"
}

declare global {
    namespace Express {
        interface Request {
            tenantId?: string
        }
    }
}

export function createTenantResolver(options: TenantResolverOptions): RequestHandler {
    const { from, onMissing = "reject" } = options
    const headerName = (options.header ?? "x-tenant-id").toLowerCase()
    const jwtClaim = options.jwtClaim ?? "tenantId"

    return (req: Request, res, next) => {
        let tenantId: string | undefined

        if (from === "subdomain") {
            const parts = req.hostname.split(".")
            tenantId = parts.length >= 3 ? parts[0] : undefined
        } else if (from === "header") {
            const val = req.headers[headerName]
            tenantId = typeof val === "string" ? val : undefined
        } else if (from === "jwt") {
            // ponytail: req.user is set by authapi's protect middleware
            tenantId = (req as any).user?.[jwtClaim]
        }

        if (!tenantId) {
            if (onMissing === "ignore") return next()
            res.status(400).json({ error: "Tenant not identified" })
            return
        }

        req.tenantId = tenantId
        next()
    }
}
