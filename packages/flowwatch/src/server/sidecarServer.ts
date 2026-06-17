import express, { Router, json } from "express"
import type { Flowwatch } from "../createFlowwatch.js"
import type { TraceSpanType } from "../persistence/repositories/traces/traceRepository.js"
import type { FlagContext } from "../engine/flags/types.js"
import type { CaptureErrorOptions } from "../engine/errors/errorEngine.js"
import { logger } from "../logger.js"

export function createSidecarRouter(fw: Flowwatch): Router {
    const router = Router()
    router.use(json())

    // ── Feature Flag ──────────────────────────────────────────────
    router.post("/api/flag", async (req, res) => {
        try {
            const { key, context } = req.body as { key: string; context?: FlagContext }

            if (!key || typeof key !== "string") {
                res.status(400).json({ error: "key must be a non-empty string" })
                return
            }

            const enabled = await fw.flag(key, context ?? {})
            res.json({ enabled })
        } catch (err: any) {
            res.status(500).json({ error: err?.message ?? "flag evaluation failed" })
        }
    })

    // ── Workflow Trigger ──────────────────────────────────────────
    router.post("/api/trigger", async (req, res) => {
        try {
            const { name, input } = req.body as { name: string; input?: unknown }

            if (!name || typeof name !== "string") {
                res.status(400).json({ error: "name must be a non-empty string" })
                return
            }

            const result = await fw.trigger(name, input)
            res.json(result)
        } catch (err: any) {
            res.status(500).json({ error: err?.message ?? "workflow trigger failed" })
        }
    })

    // ── Trace Span (single-shot) ──────────────────────────────────
    router.post("/api/trace-span", async (req, res) => {
        try {
            const { name, type, durationMs, metadata, status } = req.body as {
                name: string
                type: TraceSpanType
                durationMs: number
                metadata?: unknown
                status?: "ok" | "error"
            }

            if (!name || typeof name !== "string") {
                res.status(400).json({ error: "name must be a non-empty string" })
                return
            }

            if (!type) {
                res.status(400).json({ error: "type is required" })
                return
            }

            if (typeof durationMs !== "number" || durationMs < 0) {
                res.status(400).json({ error: "durationMs must be a non-negative number" })
                return
            }

            // The actual work was already timed on the caller side.
            // We record the span with the reported duration in metadata
            // since fw.trace measures real execution time of the callback.
            await fw.trace(name, type, async () => {
                // no-op — work already done by caller
            }, {
                sidecarDurationMs: durationMs,
                sidecarStatus: status ?? "ok",
                ...(metadata as any),
            })

            res.json({ ok: true })
        } catch (err: any) {
            res.status(500).json({ error: err?.message ?? "trace span recording failed" })
        }
    })

    // ── Error Capture ─────────────────────────────────────────────
    router.post("/api/capture-error", async (req, res) => {
        try {
            const { error, options } = req.body as {
                error: { message: string; name?: string; stack?: string }
                options: CaptureErrorOptions
            }

            if (!error || typeof error.message !== "string") {
                res.status(400).json({ error: "error.message must be a non-empty string" })
                return
            }

            if (!options || !options.source) {
                res.status(400).json({ error: "options.source is required" })
                return
            }

            const reconstructedError = new Error(error.message)
            if (error.name) reconstructedError.name = error.name
            if (error.stack) reconstructedError.stack = error.stack

            const stored = await fw.captureError(reconstructedError, options)

            res.json(stored ? { id: stored.id } : { ok: true })
        } catch (err: any) {
            res.status(500).json({ error: err?.message ?? "error capture failed" })
        }
    })

    // ── Health ────────────────────────────────────────────────────
    router.get("/api/health", async (_req, res) => {
        res.json({ status: "ok", sidecar: "flowwatch" })
    })

    return router
}

export interface SidecarOptions {
    port?: number
    token?: string
}

/**
 * Starts the FlowWatch sidecar on a dedicated port.
 * Python (or any language) apps call the REST API at http://localhost:<port>/api/*
 *
 * The dashboard is also available at http://localhost:<port>/ops
 *
 * Pass a token to require `Authorization: Bearer <token>` on all requests:
 *   startSidecar(fw, { port: 9400, token: process.env.SIDECAR_TOKEN })
 */
export function startSidecar(fw: Flowwatch, portOrOptions: number | SidecarOptions = 9400) {
    const port = typeof portOrOptions === "number" ? portOrOptions : (portOrOptions.port ?? 9400)
    const token = typeof portOrOptions === "object" ? portOrOptions.token : undefined

    const app = express()

    if (!token) {
        logger.warn("Sidecar server is unauthenticated — pass { token } to restrict access to /api/* and /ops")
    } else {
        app.use((_req: any, res: any, next: any) => {
            const authHeader = _req.headers.authorization as string | undefined
            const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined
            if (bearerToken === token) { next(); return }
            res.status(401).json({ error: { code: "unauthorized", message: "Unauthorized" } })
        })
    }

    app.use(createSidecarRouter(fw))
    app.use("/ops", fw.dashboard)

    app.listen(port, () => {
        logger.info({ port, dashboard: `http://localhost:${port}/ops`, api: `http://localhost:${port}/api/*` }, "Sidecar listening")
    })

    return app
}