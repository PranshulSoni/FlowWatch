import { randomUUID } from "node:crypto"
import type { Pool } from "pg"

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
}

export interface WorkflowExecutionRecord {
    executionId: string
}

export async function insertWorkflow(
    pool: Pool,
    input: CreateWorkflowDefinitionInput
): Promise<InsertWorkflowResult> {
    const workflowId = randomUUID()
    const version = input.version ?? 1

    await pool.query("BEGIN")

    try {
        const workflowResult = await pool.query<WorkflowDefinitionRecord>(
            `
            INSERT INTO pilot_workflows (id, name, version)
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

            const stepResult = await pool.query<{
                id: string
                workflow_id: string
                step_index: number
                name: string
                max_retries: number
            }>(
                `
                INSERT INTO pilot_workflow_steps (
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

        await pool.query("COMMIT")

        return {
            workflow,
            steps: workflowSteps,
        }
    }
    catch (error) {
        await pool.query("ROLLBACK")
        throw error
    }
}


export async function insertWorkflowExecution(
    pool: Pool,
    input: WorkflowExecutionInput
): Promise<WorkflowExecutionRecord> {
    const executionId = randomUUID()

    await pool.query("BEGIN")

    try {
        await pool.query(
            `
      INSERT INTO pilot_workflow_executions (
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
            await pool.query(
                `
        INSERT INTO pilot_workflow_step_executions (
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
                    JSON.stringify(input.input),
                    0,
                    step.maxRetries
                ]
            )
        }

        await pool.query("COMMIT")

        return { executionId }
    }
    catch (error) {
        await pool.query("ROLLBACK")
        throw error
    }
}
