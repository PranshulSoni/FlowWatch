import { randomUUID } from "node:crypto"
import type { Pool, PoolClient } from "pg"
import { withTransaction } from "../../transaction.js"

export interface WorkflowStepDefinitionInput {
    name: string
    maxRetries?: number
}

export interface CreateWorkflowDefinitionInput {
    name: string
    version?: number
    steps: WorkflowStepDefinitionInput[]
}

export interface WorkflowDefinitionRecord {
    id: string
    name: string
    version: number
    created_at?: Date
    updated_at?: Date
}

export interface WorkflowStepRecord {
    id: string
    workflowId: string
    stepIndex: number
    name: string
    maxRetries: number
}

export interface InsertWorkflowResult {
    workflow: WorkflowDefinitionRecord
    steps: WorkflowStepRecord[]
}

export interface WorkflowExecutionInput {
    workflowId: string
    workflowName: string
    workflowVersion: number
    input?: unknown
    steps: WorkflowExecutionStepInput[]
}

export interface WorkflowExecutionStepInput {
        workflowStepId: string
        stepIndex: number
        stepName: string
        maxRetries: number
        input?: unknown
}

export interface WorkflowExecutionRecord {
    executionId: string
}

export interface WorkflowExecutionRow {
    id: string
    workflow_id: string
    workflow_name: string
    workflow_version: number
    status: string
    input: unknown
    output: unknown
    error: unknown
    created_at: Date
    started_at: Date | null
    completed_at: Date | null
    failed_at: Date | null
}

export interface WorkflowStepExecutionRow {
    id: string
    execution_id: string
    workflow_step_id: string | null
    step_index: number
    step_name: string
    status: string
    input: unknown
    output: unknown
    error: unknown
    attempt_count: number
    max_retries: number
    created_at: Date
    started_at: Date | null
    completed_at: Date | null
    failed_at: Date | null
    next_retry_at: Date | null
}

export async function insertWorkflow(pool: Pool, input: CreateWorkflowDefinitionInput): Promise<InsertWorkflowResult> {
    const workflowId = randomUUID()
    const version = input.version ?? 1

    return withTransaction(pool, async (client) => {
        const workflowResult = await client.query<WorkflowDefinitionRecord>(
            `
            INSERT INTO flowwatch_workflows (id, name, version)
            VALUES ($1, $2, $3)
            ON CONFLICT (name, version)
            DO UPDATE SET updated_at = now()
            RETURNING id, name, version
            `,
            [workflowId, input.name, version]
        )

        const workflow = workflowResult.rows[0]
        const workflowSteps: WorkflowStepRecord[] = []

        for (let i = 0; i < input.steps.length; i++) {
            const step = input.steps[i]

            const stepResult = await client.query<{
                id: string
                workflow_id: string
                step_index: number
                name: string
                max_retries: number
            }>(
                `
                INSERT INTO flowwatch_workflow_steps (
                    id,
                    workflow_id,
                    step_index,
                    name,
                    max_retries
                )
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (workflow_id, step_index)
                DO UPDATE SET
                    name = EXCLUDED.name,
                    max_retries = EXCLUDED.max_retries
                RETURNING id, workflow_id, step_index, name, max_retries
                `,
                [
                    randomUUID(),
                    workflow.id,
                    i,
                    step.name,
                    step.maxRetries ?? 0,
                ]
            )

            const savedStep = stepResult.rows[0]

            workflowSteps.push({
                id: savedStep.id,
                workflowId: savedStep.workflow_id,
                stepIndex: savedStep.step_index,
                name: savedStep.name,
                maxRetries: savedStep.max_retries,
            })
        }

        return {
            workflow,
            steps: workflowSteps,
        }
    })
}


export async function insertWorkflowExecution(pool: Pool, input: WorkflowExecutionInput): Promise<WorkflowExecutionRecord> {
    const executionId = randomUUID()

    return withTransaction(pool, async (client) => {
        await client.query(
            `
      INSERT INTO flowwatch_workflow_executions (
        id,
        workflow_id,
        workflow_name,
        workflow_version,
        status,
        input
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
            [
                executionId,
                input.workflowId,
                input.workflowName,
                input.workflowVersion,
                "queued",
                JSON.stringify(input.input)
            ]
        )

        for (const step of input.steps) {
            await client.query(
                `
        INSERT INTO flowwatch_workflow_step_executions (
          id,
          execution_id,
          workflow_step_id,
          step_index,
          step_name,
          status,
          input,
          attempt_count,
          max_retries
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
                [
                    randomUUID(),
                    executionId,
                    step.workflowStepId,
                    step.stepIndex,
                    step.stepName,
                    "pending",
                    JSON.stringify(step.input),
                    0,
                    step.maxRetries
                ]
            )
        }

        return { executionId }
    })
}


export async function getWorkflowExecution(
    pool: Pool,
    executionId: string
): Promise<WorkflowExecutionRow | undefined> {
    const result = await pool.query<WorkflowExecutionRow>(
        `SELECT * FROM flowwatch_workflow_executions WHERE id = $1`,
        [executionId]
    )

    return result.rows[0]
}

export async function listWorkflowDefinitions(
    pool: Pool,
    page = 1,
    limit = 50
): Promise<{ rows: WorkflowDefinitionRecord[]; total: number }> {
    const safeLimit = Math.max(1, Math.min(100, limit))
    const offset = (Math.max(1, page) - 1) * safeLimit

    const countResult = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::int AS count FROM flowwatch_workflows`
    )

    const result = await pool.query<WorkflowDefinitionRecord>(
        `
        SELECT *
        FROM flowwatch_workflows
        ORDER BY name ASC, version DESC
        LIMIT $1 OFFSET $2
        `,
        [safeLimit, offset]
    )

    return { rows: result.rows, total: Number(countResult.rows[0]?.count ?? 0) }
}

export async function getLatestWorkflowDefinitionByName(
    pool: Pool,
    workflowName: string
): Promise<WorkflowDefinitionRecord | undefined> {
    const result = await pool.query<WorkflowDefinitionRecord>(
        `
        SELECT *
        FROM flowwatch_workflows
        WHERE name = $1
        ORDER BY version DESC
        LIMIT 1
        `,
        [workflowName]
    )

    return result.rows[0]
}

export async function listWorkflowExecutions(
    pool: Pool,
    page = 1,
    limit = 50
): Promise<{ rows: WorkflowExecutionRow[]; total: number }> {
    const safeLimit = Math.max(1, Math.min(100, limit))
    const offset = (Math.max(1, page) - 1) * safeLimit

    const countResult = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::int AS count FROM flowwatch_workflow_executions`
    )

    const result = await pool.query<WorkflowExecutionRow>(
        `
        SELECT *
        FROM flowwatch_workflow_executions
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
        `,
        [safeLimit, offset]
    )

    return { rows: result.rows, total: Number(countResult.rows[0]?.count ?? 0) }
}

export async function listWorkflowExecutionsByWorkflowName(
    pool: Pool,
    workflowName: string,
    limit = 50
): Promise<WorkflowExecutionRow[]> {
    const result = await pool.query<WorkflowExecutionRow>(
        `
        SELECT *
        FROM flowwatch_workflow_executions
        WHERE workflow_name = $1
        ORDER BY created_at DESC
        LIMIT $2
        `,
        [workflowName, limit]
    )

    return result.rows
}

export async function listWorkflowStepExecutionsByExecutionIds(
    pool: Pool,
    executionIds: string[]
): Promise<Map<string, WorkflowStepExecutionRow[]>> {
    if (executionIds.length === 0) {
        return new Map()
    }

    const result = await pool.query<WorkflowStepExecutionRow>(
        `
        SELECT *
        FROM flowwatch_workflow_step_executions
        WHERE execution_id = ANY($1::uuid[])
        ORDER BY execution_id ASC, step_index ASC
        `,
        [executionIds]
    )

    const grouped = new Map<string, WorkflowStepExecutionRow[]>()

    for (const row of result.rows) {
        const existing = grouped.get(row.execution_id) || []
        existing.push(row)
        grouped.set(row.execution_id, existing)
    }

    return grouped
}

export async function listWorkflowStepsByWorkflowIds(
    pool: Pool,
    workflowIds: string[]
): Promise<Map<string, WorkflowStepRecord[]>> {
    if (workflowIds.length === 0) {
        return new Map()
    }

    const result = await pool.query<{
        id: string
        workflow_id: string
        step_index: number
        name: string
        max_retries: number
    }>(
        `
        SELECT *
        FROM flowwatch_workflow_steps
        WHERE workflow_id = ANY($1::uuid[])
        ORDER BY workflow_id ASC, step_index ASC
        `,
        [workflowIds]
    )

    const grouped = new Map<string, WorkflowStepRecord[]>()

    for (const row of result.rows) {
        const existing = grouped.get(row.workflow_id) || []
        existing.push({
            id: row.id,
            workflowId: row.workflow_id,
            stepIndex: row.step_index,
            name: row.name,
            maxRetries: row.max_retries,
        })
        grouped.set(row.workflow_id, existing)
    }

    return grouped
}

export async function getWorkflowExecutionSteps(
    pool: Pool,
    executionId: string
): Promise<WorkflowStepExecutionRow[]> {
    const result = await pool.query<WorkflowStepExecutionRow>(
        `
        SELECT *
        FROM flowwatch_workflow_step_executions
        WHERE execution_id = $1
        ORDER BY step_index ASC
        `,
        [executionId]
    )

    return result.rows
}

export async function markWorkflowExecutionRunning(pool: Pool, executionId: string): Promise<void> {
    await pool.query(
        `
        UPDATE flowwatch_workflow_executions
        SET status = 'running',
            started_at = COALESCE(started_at, now())
        WHERE id = $1
        `,
        [executionId]
    )
}

export async function markWorkflowExecutionCompleted(
    pool: Pool,
    executionId: string,
    output?: unknown
): Promise<void> {
    await pool.query(
        `
        UPDATE flowwatch_workflow_executions
        SET status = 'completed',
            output = $2,
            completed_at = now()
        WHERE id = $1
        `,
        [executionId, JSON.stringify(output)]
    )
}

export async function markWorkflowExecutionFailed(
    pool: Pool,
    executionId: string,
    error: unknown
): Promise<void> {
    await pool.query(
        `
        UPDATE flowwatch_workflow_executions
        SET status = 'failed',
            error = $2,
            failed_at = now()
        WHERE id = $1
        `,
        [executionId, JSON.stringify(serializeError(error))]
    )
}

export async function markWorkflowStepRunning(pool: Pool, stepExecutionId: string): Promise<void> {
    await pool.query(
        `
        UPDATE flowwatch_workflow_step_executions
        SET status = 'running',
            started_at = COALESCE(started_at, now())
        WHERE id = $1
        `,
        [stepExecutionId]
    )
}

export async function markWorkflowStepCompleted(
    pool: Pool,
    stepExecutionId: string,
    output?: unknown
): Promise<void> {
    await pool.query(
        `
        UPDATE flowwatch_workflow_step_executions
        SET status = 'completed',
            output = $2,
            completed_at = now()
        WHERE id = $1
        `,
        [stepExecutionId, JSON.stringify(output)]
    )
}

export async function markWorkflowStepFailed(
    pool: Pool,
    stepExecutionId: string,
    error: unknown
): Promise<void> {
    await pool.query(
        `
        UPDATE flowwatch_workflow_step_executions
        SET status = 'failed',
            error = $2,
            failed_at = now(),
            attempt_count = attempt_count + 1
        WHERE id = $1
        `,
        [stepExecutionId, JSON.stringify(serializeError(error))]
    )
}

function serializeError(error: unknown) {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack,
        }
    }

    return {
        message: String(error),
    }
}