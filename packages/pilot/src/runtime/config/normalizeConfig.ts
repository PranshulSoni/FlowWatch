import type { NormalizedPilotConfig, PilotConfig, PilotWorkerConfig } from "../../types/index.js"

export async function normalizeConfig(config: PilotConfig): Promise<NormalizedPilotConfig> {
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
            path: config.dashboard?.path ?? "/pilot",
            enabled: config.dashboard?.enabled ?? true,
            token: config.dashboard?.token,
            auth: config.dashboard?.auth,
        },
        worker: workerConfig,
        migrations: {
            autoRun: config.migrations?.autoRun ?? false,
            tableName: config.migrations?.tableName ?? "pilot_migrations",
        },
        runtime: {
            environment: config.runtime?.environment ?? process.env.NODE_ENV ?? "development",
            serviceName: config.runtime?.serviceName ?? "pilot",
            debug: config.runtime?.debug ?? false,
        },
    }
}

function normalizeWorkerConfig(worker: PilotConfig["worker"]): Required<PilotWorkerConfig> {
    if (typeof worker==="boolean") {
        return {
            enabled: worker,
            workflowConcurrency: 5,
            errorIndexingConcurrency: 2,
            maintenanceConcurrency: 1,
            queuePrefix: "pilot",
        }
    }

    return {
        enabled: worker?.enabled ?? true,
        workflowConcurrency: worker?.workflowConcurrency ?? 5,
        errorIndexingConcurrency: worker?.errorIndexingConcurrency ?? 2,
        maintenanceConcurrency: worker?.maintenanceConcurrency ?? 1,
        queuePrefix: worker?.queuePrefix ?? "pilot",
    }
}
