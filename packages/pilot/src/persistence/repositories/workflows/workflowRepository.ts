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

export async function insertWorkflow(
    pool: Pool,
    input: CreateWorkflowDefinitionInput
): Promise<WorkflowDefinitionRecord> {
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

        for (let i = 0; i<input.steps.length; i++) {
            const step = input.steps[i]

            await pool.query(
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
                `,
                [
                    randomUUID(),
                    workflow.id,
                    i,
                    step.name,
                    step.maxRetries ?? 0,
                ]
            )
        }

        await pool.query("COMMIT")

        return workflow
    }
    catch (error) {
        await pool.query("ROLLBACK")
        throw error
    }
}
