import type { NormalizedFlowwatchConfig, FlowwatchConfig, FlowwatchWorkerConfig } from "../../types/index.js"

export async function normalizeConfig(config: FlowwatchConfig): Promise<NormalizedFlowwatchConfig> {
    const workerConfig = normalizeWorkerConfig(config.worker)

    return {
        db: config.db,
        redis: {
            url: config.redis.url,
        },
        elasticsearch: {
            node: config.elasticsearch.node,
        },
        dashboard: {
            path: config.dashboard?.path ?? "/flowwatch",
            enabled: config.dashboard?.enabled ?? true,
            token: config.dashboard?.token,
            auth: config.dashboard?.auth,
        },
        worker: workerConfig,
        migrations: {
            autoRun: config.migrations?.autoRun ?? false,
            tableName: config.migrations?.tableName ?? "flowwatch_migrations",
        },
        runtime: {
            environment: config.runtime?.environment ?? process.env.NODE_ENV ?? "development",
            serviceName: config.runtime?.serviceName ?? "flowwatch",
            debug: config.runtime?.debug ?? false,
        },
        server: {
            bodyLimit: config.server?.bodyLimit ?? "1mb",
            timeout: config.server?.timeout ?? 30_000,
        },
    }
}

function normalizeWorkerConfig(worker: FlowwatchConfig["worker"]): Required<FlowwatchWorkerConfig> {
    if (typeof worker==="boolean") {
        return {
            enabled: worker,
            workflowConcurrency: 5,
            errorIndexingConcurrency: 2,
            maintenanceConcurrency: 1,
            queuePrefix: "flowwatch",
        }
    }

    return {
        enabled: worker?.enabled ?? true,
        workflowConcurrency: worker?.workflowConcurrency ?? 5,
        errorIndexingConcurrency: worker?.errorIndexingConcurrency ?? 2,
        maintenanceConcurrency: worker?.maintenanceConcurrency ?? 1,
        queuePrefix: worker?.queuePrefix ?? "flowwatch",
    }
}
