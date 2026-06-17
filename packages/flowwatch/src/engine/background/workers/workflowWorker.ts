import { Worker } from "bullmq"
import type { Pool } from "pg"
import type { WorkflowJobData } from "../queues/workflowQueue.js"
import type { RegisteredWorkflow } from "../../workflows/types.js"
import type { TraceEngine } from "../../trace/traceEngine.js"
import type { CaptureErrorFunction } from "../../errors/errorEngine.js"
import { getWorkflowExecution, getWorkflowExecutionSteps, markWorkflowExecutionCompleted, markWorkflowExecutionFailed, markWorkflowExecutionRunning, markWorkflowStepCompleted, markWorkflowStepFailed, markWorkflowStepRunning, } from "../../../persistence/repositories/workflows/workflowRepository.js"

export interface WorkflowWorkerOptions {
    redisUrl: string
    pool: Pool
    getWorkflow: (name: string) => RegisteredWorkflow | undefined
    traceEngine: TraceEngine
    captureError: CaptureErrorFunction
}

export function createWorkflowWorker(options: WorkflowWorkerOptions): Worker<WorkflowJobData> {
    const worker = new Worker<WorkflowJobData>(
        "workflows",
        async (job) => {
            await executeWorkflow(job.data.executionId, options)
        },
        {
            prefix: "{flowwatch}",
            connection: {
                url: options.redisUrl,
                skipVersionCheck: true,
            },
        }
    )

    worker.on("failed", (job, err) => {
        if (!job) return
        options.captureError(err, {
            source: "workflow",
            category: "server",
            level: "error",
            statusCode: 500,
            metadata: {
                jobId: job.id,
                executionId: job.data.executionId,
                attemptsMade: job.attemptsMade,
                dlq: true,
            },
        }).catch(() => {})
    })

    return worker
}

export async function executeWorkflow(executionId: string, worker: WorkflowWorkerOptions): Promise<void> {
    const result = await getWorkflowExecution(worker.pool, executionId)
    if (!result) {
        throw new Error("No workflow exists with that id")
    }

    const executions = await getWorkflowExecutionSteps(worker.pool, executionId)
    if (executions.length === 0) {
        throw new Error("No workflow execution steps exists")
    }

    const workflowToExecute = worker.getWorkflow(result.workflow_name)
    if (!workflowToExecute) {
        throw new Error("Cannot find workflow in the working memory")
    }

    await markWorkflowExecutionRunning(worker.pool, executionId)

    try {
        let lastStepOutput: unknown

        for (const stepExecution of executions) {
            if (stepExecution.status === "completed") {
                continue
            }

            const registeredStep = workflowToExecute.steps.find((step) => {
                return step.name === stepExecution.step_name
            })

            if (!registeredStep) {
                throw new Error(`Cannot find registered step: ${stepExecution.step_name}`)
            }

            let attempt = stepExecution.attempt_count
            const maxAttempts = stepExecution.max_retries + 1

            while (attempt < maxAttempts) {
                await markWorkflowStepRunning(worker.pool, stepExecution.id)

                try {
                    lastStepOutput = await worker.traceEngine.trace(
                        `flowwatch.workflow.step.${stepExecution.step_name}`,
                        "workflow_step",
                        async () => registeredStep.run(stepExecution.input),
                        {
                            workflowName: result.workflow_name,
                            workflowVersion: result.workflow_version,
                            executionId,
                            stepExecutionId: stepExecution.id,
                            stepName: stepExecution.step_name,
                            stepIndex: stepExecution.step_index,
                            attempt: attempt + 1,
                        }
                    )
                    await markWorkflowStepCompleted(worker.pool, stepExecution.id, lastStepOutput)
                    break
                }
                catch (error) {
                    attempt += 1
                    await worker.captureError(error, {
                        source: "workflow",
                        category: "server",
                        level: "error",
                        statusCode: 500,
                        metadata: {
                            workflowName: result.workflow_name,
                            workflowVersion: result.workflow_version,
                            executionId,
                            stepExecutionId: stepExecution.id,
                            stepName: stepExecution.step_name,
                            stepIndex: stepExecution.step_index,
                            attempt,
                            maxAttempts,
                        },
                    })
                    await markWorkflowStepFailed(worker.pool, stepExecution.id, error)

                    if (attempt >= maxAttempts) {
                        throw error
                    }
                }
            }
        }

        await markWorkflowExecutionCompleted(worker.pool, executionId, lastStepOutput)
    }
    catch (error) {
        await worker.captureError(error, {
            source: "workflow",
            category: "server",
            level: "error",
            statusCode: 500,
            metadata: {
                workflowName: result.workflow_name,
                workflowVersion: result.workflow_version,
                executionId,
            },
        })
        await markWorkflowExecutionFailed(worker.pool, executionId, error)
        throw error
    }
}
