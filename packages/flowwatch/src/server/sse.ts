import type { Request, Response } from "express"

export interface SseConnection {
  send(event: string, data: unknown): void
  close(): void
}

export function createSseConnection(req: Request, res: Response): SseConnection {
  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")
  res.flushHeaders()
  req.on("close", () => res.end())
  return {
    send(event: string, data: unknown) {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    },
    close() { res.end() },
  }
}
