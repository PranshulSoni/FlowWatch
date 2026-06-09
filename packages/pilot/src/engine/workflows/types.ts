export type WorkflowStepHandler = (input: unknown) => unknown | Promise<unknown>

export interface WorkflowStep {
    name: string
    run: WorkflowStepHandler
    retries?: number
}

export interface RegisteredWorkflow {
    name: string
    steps: WorkflowStep[]
    dbWorkflow: {
        id: string
        name: string
        version: number
    }
    dbSteps: {
        id: string
        workflowId: string
        stepIndex: number
        name: string
        maxRetries: number
    }[]
}

export type RegisterWorkflow = (
    name: string,
    steps: WorkflowStep[]
) => Promise<void>


export type TriggerWorkflow = (
    name: string,
    input?: unknown
) => Promise<{ executionId: string }>
