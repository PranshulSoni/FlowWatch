import type { CaptureErrorFunction } from "../engine/errors/errorEngine.js"

type State = "closed" | "open" | "half-open"

export interface CircuitBreakerOptions {
  threshold?: number        // failures before opening — default: 5
  timeout?: number          // ms before half-open probe — default: 30_000
  captureError?: CaptureErrorFunction
}

export type CircuitBreaker = <T>(fn: () => Promise<T>) => Promise<T>

export function createCircuitBreaker(options: CircuitBreakerOptions = {}): CircuitBreaker {
  const threshold = options.threshold ?? 5
  const timeout = options.timeout ?? 30_000
  let state: State = "closed"
  let failures = 0
  let openedAt = 0

  return async function <T>(fn: () => Promise<T>): Promise<T> {
    if (state === "open") {
      if (Date.now() - openedAt >= timeout) {
        state = "half-open"
      } else {
        throw Object.assign(new Error("Circuit open"), { code: "CIRCUIT_OPEN" })
      }
    }

    try {
      const result = await fn()
      // recovery: reset on any success
      failures = 0
      state = "closed"
      return result
    } catch (err) {
      failures++
      if (failures >= threshold) {
        state = "open"
        openedAt = Date.now()
        options.captureError?.(err, {
          source: "http",
          category: "dependency",
          level: "error",
          statusCode: 503,
          metadata: { circuitBreaker: "opened", threshold }
        }).catch(() => {})
      }
      throw err
    }
  }
}
