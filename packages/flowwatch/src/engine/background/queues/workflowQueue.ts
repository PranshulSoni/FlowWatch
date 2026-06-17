import { Queue } from "bullmq"

export interface WorkflowJobData {
    executionId: string
}

export function createWorkflowQueue(redisUrl: string) {
    return new Queue<WorkflowJobData>("workflows", {
        prefix: "{flowwatch}",
        connection: {
            url: redisUrl,
            skipVersionCheck: true,
        },
    })
}

export async function addWorkflowJobToQueue(queue: ReturnType<typeof createWorkflowQueue>,executionId: string):Promise<void> {
    await queue.add("run-workflow", {
        executionId,
    })
}

export async function getFailedJobs(queue: ReturnType<typeof createWorkflowQueue>, limit = 100) {
    return queue.getFailed(0, limit - 1)
}

export async function requeueFailedJob(queue: ReturnType<typeof createWorkflowQueue>, jobId: string): Promise<void> {
    const job = await queue.getJob(jobId)
    if (!job) throw new Error(`DLQ: job ${jobId} not found`)
    await job.retry("failed")
}