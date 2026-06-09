import type { PoolConfig } from "pg"
import type { Request } from "express"

export interface PilotConfig {
    db: PoolConfig
    redis: PilotRedisConfig
    elasticsearch: PilotElasticsearchConfig
    dashboard?: PilotDashboardConfig
    worker?: boolean | PilotWorkerConfig
    migrations?: PilotMigrationConfig
    runtime?: PilotRuntimeConfig
}

export interface PilotRedisConfig {
    url: string
}

export interface PilotElasticsearchConfig {
    node: string
}

export interface PilotDashboardConfig {
    path?: string
    token?: string
    auth?: (req: Request) => boolean | Promise<boolean>
    enabled?: boolean
}

export interface PilotWorkerConfig {
    enabled?: boolean
    workflowConcurrency?: number
    errorIndexingConcurrency?: number
    maintenanceConcurrency?: number
    queuePrefix?: string
}

export interface PilotMigrationConfig {
    autoRun?: boolean
    tableName?: string
}

export interface PilotRuntimeConfig {
    environment?: "development" | "test" | "staging" | "production" | string
    serviceName?: string
    debug?: boolean
}

export interface NormalizedPilotConfig {
    db: PoolConfig
    redis: PilotRedisConfig
    elasticsearch: PilotElasticsearchConfig
    dashboard: Required<Pick<PilotDashboardConfig, "path" | "enabled">> & Pick<PilotDashboardConfig, "token" | "auth">
    worker: Required<PilotWorkerConfig>
    migrations: Required<PilotMigrationConfig>
    runtime: Required<PilotRuntimeConfig>
}
