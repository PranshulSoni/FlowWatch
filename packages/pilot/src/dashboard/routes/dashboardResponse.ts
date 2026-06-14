import type { NormalizedPilotConfig } from "../../types/index.js"

function asIso(value: unknown): string | null {
    if (!value) {
        return null
    }

    if (value instanceof Date) {
        return value.toISOString()
    }

    return String(value)
}

function durationBetween(start: unknown, end: unknown): number | null {
    if (!start || !end) {
        return null
    }

    const startedAt = new Date(String(start)).getTime()
    const endedAt = new Date(String(end)).getTime()

    if (Number.isNaN(startedAt) || Number.isNaN(endedAt)) {
        return null
    }

    return Math.max(0, endedAt - startedAt)
}

function formatDashboardTime(value: unknown): string {
    const iso = asIso(value)

    if (!iso) {
        return "-"
    }

    return new Date(iso).toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    })
}

function formatDashboardDateTime(value: unknown): string {
    const iso = asIso(value)

    if (!iso) {
        return "-"
    }

    return new Date(iso).toISOString().slice(0, 16).replace("T", " ")
}

function formatDuration(ms: number | null | undefined): string {
    if (ms === null || ms === undefined) {
        return "-"
    }

    if (ms < 1000) {
        return `${ms}ms`
    }

    return `${(ms / 1000).toFixed(ms >= 10000 ? 0 : 1)}s`
}

function dashboardStatus(status: string | null | undefined): string {
    if (status === "ok") {
        return "completed"
    }

    if (status === "error") {
        return "failed"
    }

    return status || "unknown"
}

export function serializeFlag(flag: any, ruleCount = 0) {
    return {
        id: flag.id,
        key: flag.key,
        description: flag.description,
        enabled: flag.enabled,
        rollout: flag.rollout_percentage,
        rolloutPercentage: flag.rollout_percentage,
        rules: ruleCount,
        changedBy: flag.changed_by ?? "dashboard",
        createdAt: asIso(flag.created_at),
        updatedAt: asIso(flag.updated_at),
    }
}

export function serializeRule(rule: any) {
    return {
        id: rule.id,
        flagId: rule.flag_id,
        attribute: rule.attribute,
        operator: rule.operator,
        value: rule.value,
        enabled: rule.enabled,
        createdAt: asIso(rule.created_at),
        updatedAt: asIso(rule.updated_at),
    }
}

export function serializeAuditLog(log: any) {
    return {
        id: log.id,
        flagId: log.flag_id,
        action: log.action,
        before: log.before,
        after: log.after,
        changedBy: log.changed_by,
        createdAt: asIso(log.created_at),
    }
}

export function serializeError(error: any) {
    return {
        id: error.id,
        message: error.message,
        name: error.name || "Error",
        category: error.category,
        level: error.level,
        source: error.source,
        status: error.status_code,
        statusCode: error.status_code,
        trace: error.trace_id || "-",
        traceId: error.trace_id,
        spanId: error.span_id,
        fingerprint: error.fingerprint,
        metadata: error.metadata,
        stack: error.stack,
        occurred: formatDashboardTime(error.occurred_at),
        occurredAt: asIso(error.occurred_at),
        createdAt: asIso(error.created_at),
    }
}

export function serializeTrace(trace: any, spans: any[] = []) {
    return {
        id: trace.id,
        method: trace.method,
        path: trace.path,
        status: trace.status_code,
        statusCode: trace.status_code,
        ip: trace.ip,
        duration: trace.duration_ms ?? durationBetween(trace.started_at, trace.ended_at),
        durationMs: trace.duration_ms ?? durationBetween(trace.started_at, trace.ended_at),
        userId: trace.user_id,
        userAgent: trace.user_agent,
        metadata: trace.metadata,
        startedAt: asIso(trace.started_at),
        endedAt: asIso(trace.ended_at),
        createdAt: asIso(trace.created_at),
        spans: spans.map((span) => ({
            id: span.id,
            traceId: span.trace_id,
            parentSpanId: span.parent_span_id,
            name: span.name,
            type: span.type,
            status: dashboardStatus(span.status),
            duration: span.duration_ms ?? durationBetween(span.started_at, span.ended_at),
            durationMs: span.duration_ms ?? durationBetween(span.started_at, span.ended_at),
            metadata: span.metadata,
            startedAt: asIso(span.started_at),
            endedAt: asIso(span.ended_at),
        })),
    }
}

export function serializeExecution(execution: any, steps: any[] = []) {
    const failedStep = steps.find((step) => step.status === "failed")
    const startedAt = execution.started_at || execution.created_at
    const finishedAt = execution.completed_at || execution.failed_at
    const durationMs = durationBetween(startedAt, finishedAt)

    return {
        id: execution.id,
        workflowId: execution.workflow_id,
        workflow: execution.workflow_name,
        workflowName: execution.workflow_name,
        workflowVersion: execution.workflow_version,
        status: execution.status,
        input: execution.input,
        output: execution.output,
        error: execution.error,
        started: formatDashboardTime(startedAt),
        finished: formatDashboardTime(finishedAt),
        failedStep: failedStep?.step_name || "-",
        attempts: steps.reduce((total, step) => total + Number(step.attempt_count || 0), 0),
        duration: formatDuration(durationMs),
        createdAt: asIso(execution.created_at),
        startedAt: asIso(execution.started_at),
        completedAt: asIso(execution.completed_at),
        failedAt: asIso(execution.failed_at),
        durationMs,
        steps: steps.map((step) => ({
            id: step.id,
            executionId: step.execution_id,
            workflowStepId: step.workflow_step_id,
            stepIndex: step.step_index,
            stepName: step.step_name,
            name: step.step_name,
            status: step.status,
            input: step.input,
            output: step.output,
            error: step.error,
            attempts: step.attempt_count,
            attemptCount: step.attempt_count,
            maxRetries: step.max_retries,
            startedAt: asIso(step.started_at),
            completedAt: asIso(step.completed_at),
            failedAt: asIso(step.failed_at),
            nextRetryAt: asIso(step.next_retry_at),
            durationMs: durationBetween(step.started_at, step.completed_at || step.failed_at),
            duration: formatDuration(durationBetween(step.started_at, step.completed_at || step.failed_at)),
        })),
    }
}

export function serializeSettings(config: NormalizedPilotConfig) {
    return {
        serviceName: config.runtime.serviceName,
        environment: config.runtime.environment,
        dashboard: {
            path: config.dashboard.path,
            enabled: config.dashboard.enabled,
            authEnabled: Boolean(config.dashboard.auth || config.dashboard.token),
        },
        worker: {
            ...config.worker,
            concurrency: config.worker.workflowConcurrency,
        },
        migrations: config.migrations,
        ai: {
            groqApiKeyConfigured: Boolean(process.env.GROQ_API_KEY),
            groqModel: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        },
    }
}

export function serializeWorkflowSummary(workflow: any, executions: any[], definitionSteps: any[], latestExecution?: any, latestExecutionSteps: any[] = []) {
    const workflowExecutions = executions.filter((e) => e.workflow_name === workflow.name)
    const completed = workflowExecutions.filter((e) => e.status === "completed").length
    const failed = workflowExecutions.filter((e) => e.status === "failed").length
    const running = workflowExecutions.filter((e) => e.status === "running").length

    return {
        id: workflow.id,
        name: workflow.name,
        version: workflow.version,
        steps: definitionSteps.length,
        created: formatDashboardDateTime(workflow.created_at),
        createdAt: asIso(workflow.created_at),
        updatedAt: asIso(workflow.updated_at),
        lastStatus: latestExecution?.status || "never run",
        totalRuns: workflowExecutions.length,
        completedRuns: completed,
        failedRuns: failed,
        runningRuns: running,
        failures: failed,
        pinned: false,
        chain: definitionSteps.map((step) => step.name),
        latestExecution: latestExecution ? serializeExecution(latestExecution, latestExecutionSteps) : undefined,
    }
}

export function latestByWorkflow(executions: any[]): Map<string, any> {
    const latest = new Map<string, any>()

    for (const execution of executions) {
        if (!latest.has(execution.workflow_name)) {
            latest.set(execution.workflow_name, execution)
        }
    }

    return latest
}
