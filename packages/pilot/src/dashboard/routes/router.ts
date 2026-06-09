import { Router } from "express"
import type { NormalizedPilotConfig } from "../../types/index.js"

export function createDashboardRouter(config: NormalizedPilotConfig): Router {
    const router = Router()

    router.get("/api/health", async (req, res) => {
        res.json({
            status: "ok",
            serviceName: config.runtime.serviceName,
        })
    })

    return router
}
