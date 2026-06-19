import { Counter, Histogram, Registry, collectDefaultMetrics } from "prom-client"
import type { RequestHandler } from "express"

export interface MetricsEngine {
  middleware: RequestHandler
  handler: RequestHandler
}

export function createMetricsEngine(): MetricsEngine {
  const registry = new Registry()
  collectDefaultMetrics({ register: registry })

  const requestsTotal = new Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status_code"],
    registers: [registry]
  })

  const requestDuration = new Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request duration in seconds",
    labelNames: ["method", "route"],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [registry]
  })

  const middleware: RequestHandler = (req, res, next) => {
    const start = Date.now()
    res.on("finish", () => {
      const route = (req.route?.path as string | undefined) ?? req.path
      const duration = (Date.now() - start) / 1000
      requestsTotal.inc({ method: req.method, route, status_code: res.statusCode })
      requestDuration.observe({ method: req.method, route }, duration)
    })
    next()
  }

  const handler: RequestHandler = async (_req, res) => {
    res.set("Content-Type", registry.contentType)
    res.send(await registry.metrics())
  }

  return { middleware, handler }
}
