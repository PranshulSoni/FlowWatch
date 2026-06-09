export type WorkflowStepHandler = (input: unknown) => unknown | Promise<unknown>

export interface WorkflowStep {
    name: string
    run: WorkflowStepHandler
    retries?: number
}

export interface RegisteredWorkflow {
    name: string
    steps: WorkflowStep[]
}

export type RegisterWorkflow = (
    name: string,
    steps: WorkflowStep[]
) => Promise<void>


export type TriggerWorkflow = (
    name: string,
    input?: unknown
) => Promise<void>
