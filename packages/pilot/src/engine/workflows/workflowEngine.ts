import type { Pool } from "pg"
import { insertWorkflow } from "../../persistence/repositories/workflows/workflowRepository.js"
import type { RegisterWorkflow, RegisteredWorkflow, TriggerWorkflow, WorkflowStep } from "./types.js"
export interface WorkflowEngine {
    workflow: RegisterWorkflow
    trigger: TriggerWorkflow
    getWorkflow: (name: string) => RegisteredWorkflow | undefined
}

export function createWorkflowEngine(pool: Pool): WorkflowEngine {
    const registry = new Map<string, RegisteredWorkflow>()

    async function workflow(name: string, steps: WorkflowStep[]): Promise<void> {
        validateWorkflow(name, steps)

        const registeredWorkflow: RegisteredWorkflow = {
            name,
            steps,
        }

        registry.set(name, registeredWorkflow)

        const workflowSteps = []

        for (const step of steps) {
            workflowSteps.push({
                name: step.name,
                maxRetries: step.retries ?? 0,
            })
        }

        await insertWorkflow(pool, {
            name,
            steps: workflowSteps,
        })
    }

    function getWorkflow(name: string): RegisteredWorkflow | undefined {
        return registry.get(name)
    }

    async function trigger(name: string, input?: unknown): Promise<void> {
        const workflow = getWorkflow(name)

        if (!workflow) {
            throw new Error(`workflow not found: ${name}`)
        }

        for (const step of workflow.steps) {
            await step.run(input)
        }
    }
    return {
        workflow,
        trigger,
        getWorkflow
    }
}

function validateWorkflow(name: string, steps: WorkflowStep[]): void {
    if (name.trim().length === 0) {
        throw new Error("workflow name must be a non-empty string")
    }

    if (steps.length === 0) {
        throw new Error("workflow steps must not be empty")
    }

    const stepNames = new Set<string>()

    for (const step of steps) {
        if (step.name.trim().length === 0) {
            throw new Error("workflow step name must be a non-empty string")
        }

        if (typeof step.run !== "function") {
            throw new Error(`workflow step ${step.name} run must be a function`)
        }

        if (step.retries !== undefined && (!Number.isInteger(step.retries) || step.retries < 0)) {
            throw new Error(`workflow step ${step.name} retries must be a non-negative integer`)
        }

        if (stepNames.has(step.name)) {
            throw new Error(`workflow step name must be unique: ${step.name}`)
        }

        stepNames.add(step.name)
    }
}
