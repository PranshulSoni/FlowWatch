import { Queue } from "bullmq"

export interface WorkflowJobData {
    executionId: string
}

export function createWorkflowQueue(redisUrl: string) {
    return new Queue<WorkflowJobData>("workflows", {
        prefix: "{pilot}",
        connection: {
            url: redisUrl,
        },
    })
}

export async function addWorkflowJobToQueue(queue: ReturnType<typeof createWorkflowQueue>,executionId: string):Promise<void> {
    await queue.add("run-workflow", {
        executionId,
    })
}