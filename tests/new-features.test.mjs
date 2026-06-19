import assert from "node:assert/strict"
import { resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { test } from "node:test"

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)))
const distCircuitBreakerPath = resolve(repoRoot, "packages/flowwatch/dist/runtime/circuitBreaker.js")
const distEventBusPath = resolve(repoRoot, "packages/flowwatch/dist/runtime/eventBus.js")
const distMetricsEnginePath = resolve(repoRoot, "packages/flowwatch/dist/runtime/metricsEngine.js")
const distAutoInstrumentationPath = resolve(repoRoot, "packages/flowwatch/dist/engine/trace/autoInstrumentation.js")

function importFresh(filePath) {
    const url = pathToFileURL(filePath)
    url.search = Date.now().toString()
    return import(url.href)
}

test("Circuit Breaker - executes successfully and opens on failures", async () => {
    const { createCircuitBreaker } = await importFresh(distCircuitBreakerPath)
    
    let captureCalled = false
    const mockCaptureError = () => { captureCalled = true; return Promise.resolve() }

    const breaker = createCircuitBreaker({
        threshold: 2,
        timeout: 1000,
        captureError: mockCaptureError
    })

    // Test success
    const result = await breaker(() => Promise.resolve("success-val"))
    assert.equal(result, "success-val")

    // Test failures triggering open state
    await assert.rejects(
        breaker(() => Promise.reject(new Error("fail 1"))),
        /fail 1/
    )

    await assert.rejects(
        breaker(() => Promise.reject(new Error("fail 2"))),
        /fail 2/
    )
    assert.equal(captureCalled, true)

    // Test fast-fail when open
    await assert.rejects(
        breaker(() => Promise.resolve("won't run")),
        /Circuit open/
    )
})

test("Event Bus - registers listeners and emits events", async () => {
    const { createEventBus } = await importFresh(distEventBusPath)
    const bus = createEventBus()

    let eventPayload = null
    bus.on("test-event", (data) => {
        eventPayload = data
    })

    bus.emit("test-event", { val: 42 })
    assert.deepEqual(eventPayload, { val: 42 })
})

test("Metrics Engine - creates Express middleware and metrics handler", async () => {
    const { createMetricsEngine } = await importFresh(distMetricsEnginePath)
    const metricsEngine = createMetricsEngine()

    assert.equal(typeof metricsEngine.middleware, "function")
    assert.equal(typeof metricsEngine.handler, "function")
})

test("Auto-Instrumentation - records database queries and HTTP fetches", async () => {
    const { createTracedQuery, createTracedFetch } = await importFresh(distAutoInstrumentationPath)
    
    // Mock TraceEngine
    const traces = []
    const mockTraceEngine = {
        trace: async (name, type, callback) => {
            traces.push({ name, type })
            return callback()
        }
    }

    // Mock pg Pool
    const mockPool = {
        query: async (sql, params) => {
            return { rows: [{ result: "query-ok" }] }
        }
    }

    // Test tracedQuery
    const query = createTracedQuery(mockPool, mockTraceEngine)
    const queryResult = await query("SELECT * FROM users WHERE id = $1", [1])
    assert.deepEqual(queryResult.rows, [{ result: "query-ok" }])
    assert.equal(traces.length, 1)
    assert.equal(traces[0].name, "SELECT * FROM users WHERE id = $1")
    assert.equal(traces[0].type, "repository")

    // Test tracedFetch
    const originalFetch = global.fetch
    global.fetch = async (url, init) => {
        return { ok: true, status: 200 }
    }

    try {
        const fetchHelper = createTracedFetch(mockTraceEngine)
        const fetchResult = await fetchHelper("https://api.example.com/data", { method: "POST" })
        assert.equal(fetchResult.status, 200)
        assert.equal(traces.length, 2)
        assert.equal(traces[1].name, "POST https://api.example.com/data")
        assert.equal(traces[1].type, "external_api")
    } finally {
        global.fetch = originalFetch
    }
})
