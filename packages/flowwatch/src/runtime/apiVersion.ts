import { Router } from "express"
import type { RequestHandler } from "express"

export interface ApiVersionOptions {
  defaultVersion?: number
  header?: string
}

export function createVersionRouter(): Router {
  return Router()
}

export function createVersionMiddleware(options: ApiVersionOptions = {}): RequestHandler {
  const { defaultVersion = 1, header = "api-version" } = options
  return (req, _res, next) => {
    const fromHeader = req.headers[header.toLowerCase()]
    const fromQuery = req.query["version"]
    const raw = fromHeader ?? fromQuery ?? String(defaultVersion)
    ;(req as any).apiVersion = parseInt(String(raw), 10) || defaultVersion
    next()
  }
}
