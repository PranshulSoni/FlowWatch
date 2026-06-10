import { Queue } from "bullmq"
import { Redis } from "ioredis"

export interface WorkflowJobData {
    executionId: string
}

export function createWorkflowQueue(redisUrl: string){
    const connection = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
    })

    return new Queue<WorkflowJobData>("pilot:workflows", {
        connection:{
            url:redisUrl,
        }
    })
}

export async function addWorkflowJobToQueue(queue: Queue<WorkflowJobData>,executionId: string):Promise<void> {
    await queue.add("run-workflow", {
        executionId,
    })
}