import assert from "node:assert/strict"
import { resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { test } from "node:test"

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)))
const distWorkerPath = resolve(repoRoot, "packages/flowwatch/dist/engine/background/workers/workflowWorker.js")

function importFresh(filePath, query) {
    const url = pathToFileURL(filePath)
    url.search = query
    return import(url.href)
}

function makeExecution(overrides = {}) {
    return {
        id: "exec-1",
        workflow_id: "wf-1",
        workflow_name: "my-workflow",
        workflow_version: 1,
        status: "queued",
        input: null,
        output: null,
        error: null,
        created_at: new Date(),
        started_at: null,
        completed_at: null,
        failed_at: null,
        ...overrides,
    }
}

function makeStep(overrides = {}) {
    return {
        id: "step-exec-1",
        execution_id: "exec-1",
        workflow_step_id: "step-1",
        step_index: 0,
        step_name: "step-one",
        status: "queued",
        input: null,
        output: null,
        error: null,
        attempt_count: 0,
        max_retries: 0,
        created_at: new Date(),
        started_at: null,
        completed_at: null,
        failed_at: null,
        next_retry_at: null,
        ...overrides,
    }
}

function makeMockPool({ execution, steps }) {
    return {
        async query(sql) {
            if (sql.includes("FROM flowwatch_workflow_executions WHERE id")) {
                return { rows: execution ? [execution] : [] }
            }
            // getWorkflowExecutionSteps: multiline SQL — match table + clause separately
            if (sql.includes("FROM flowwatch_workflow_step_executions") && sql.includes("WHERE execution_id = $1")) {
                return { rows: steps }
            }
            // All other queries (UPDATEs, etc.) succeed silently
            return { rows: [] }
        },
    }
}

function makeMockTraceEngine() {
    return {
        async trace(_name, _type, fn) {
            return fn()
        },
    }
}

function makeMockCaptureError() {
    const captured = []
    const fn = async (error) => {
        captured.push(error)
    }
    fn.captured = captured
    return fn
}

test("executeWorkflow completes a single-step workflow successfully", async () => {
    const { executeWorkflow } = await importFresh(distWorkerPath, "t=success")

    const pool = makeMockPool({
        execution: makeExecution(),
        steps: [makeStep()],
    })

    let stepRunCalled = false
    const worker = {
        redisUrl: "redis://localhost",
        pool,
        getWorkflow: () => ({
            steps: [{
                name: "step-one",
                run: async () => { stepRunCalled = true; return { result: "ok" } },
            }],
        }),
        traceEngine: makeMockTraceEngine(),
        captureError: makeMockCaptureError(),
    }

    await executeWorkflow("exec-1", worker)

    assert.equal(stepRunCalled, true)
})

test("executeWorkflow skips steps already marked completed", async () => {
    const { executeWorkflow } = await importFresh(distWorkerPath, "t=skip-completed")

    let skippedStepCalled = false
    let activeStepCalled = false

    const pool = makeMockPool({
        execution: makeExecution(),
        steps: [
            makeStep({ id: "step-exec-1", step_name: "step-one", step_index: 0, status: "completed" }),
            makeStep({ id: "step-exec-2", step_name: "step-two", step_index: 1, status: "queued" }),
        ],
    })

    const worker = {
        redisUrl: "redis://localhost",
        pool,
        getWorkflow: () => ({
            steps: [
                { name: "step-one", run: async () => { skippedStepCalled = true } },
                { name: "step-two", run: async () => { activeStepCalled = true; return "done" } },
            ],
        }),
        traceEngine: makeMockTraceEngine(),
        captureError: makeMockCaptureError(),
    }

    await executeWorkflow("exec-1", worker)

    assert.equal(skippedStepCalled, false, "completed step must not be re-executed")
    assert.equal(activeStepCalled, true, "queued step must execute")
})

test("executeWorkflow retries a failed step up to max_retries times", async () => {
    const { executeWorkflow } = await importFresh(distWorkerPath, "t=retry")

    let callCount = 0

    const pool = makeMockPool({
        execution: makeExecution(),
        steps: [makeStep({ max_retries: 2, attempt_count: 0 })],
    })

    const captureError = makeMockCaptureError()
    const worker = {
        redisUrl: "redis://localhost",
        pool,
        getWorkflow: () => ({
            steps: [{
                name: "step-one",
                run: async () => {
                    callCount += 1
                    if (callCount < 3) throw new Error(`attempt ${callCount} failed`)
                    return "success"
                },
            }],
        }),
        traceEngine: makeMockTraceEngine(),
        captureError,
    }

    await executeWorkflow("exec-1", worker)

    assert.equal(callCount, 3, "step must be called 3 times (1 initial + 2 retries)")
    assert.equal(captureError.captured.length, 2, "two failures must be captured before success")
})

test("executeWorkflow fails the execution when all retries are exhausted", async () => {
    const { executeWorkflow } = await importFresh(distWorkerPath, "t=exhausted")

    const pool = makeMockPool({
        execution: makeExecution(),
        steps: [makeStep({ max_retries: 1, attempt_count: 0 })],
    })

    const captureError = makeMockCaptureError()
    const worker = {
        redisUrl: "redis://localhost",
        pool,
        getWorkflow: () => ({
            steps: [{
                name: "step-one",
                run: async () => { throw new Error("always fails") },
            }],
        }),
        traceEngine: makeMockTraceEngine(),
        captureError,
    }

    await assert.rejects(
        () => executeWorkflow("exec-1", worker),
        /always fails/,
    )

    // Captured once per failed attempt plus once for the execution-level failure
    assert.ok(captureError.captured.length >= 2, "failures must be captured for each retry + execution")
})

test("executeWorkflow throws when the execution record is not found", async () => {
    const { executeWorkflow } = await importFresh(distWorkerPath, "t=no-exec")

    const pool = makeMockPool({ execution: null, steps: [] })

    const worker = {
        redisUrl: "redis://localhost",
        pool,
        getWorkflow: () => ({ steps: [] }),
        traceEngine: makeMockTraceEngine(),
        captureError: makeMockCaptureError(),
    }

    await assert.rejects(
        () => executeWorkflow("missing-id", worker),
        /No workflow exists with that id/,
    )
})

test("executeWorkflow throws when no step executions are found", async () => {
    const { executeWorkflow } = await importFresh(distWorkerPath, "t=no-steps")

    const pool = makeMockPool({ execution: makeExecution(), steps: [] })

    const worker = {
        redisUrl: "redis://localhost",
        pool,
        getWorkflow: () => ({ steps: [] }),
        traceEngine: makeMockTraceEngine(),
        captureError: makeMockCaptureError(),
    }

    await assert.rejects(
        () => executeWorkflow("exec-1", worker),
        /No workflow execution steps exists/,
    )
})
