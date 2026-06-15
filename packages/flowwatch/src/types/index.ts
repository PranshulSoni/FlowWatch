import type { PoolConfig } from "pg"
import type { Request } from "express"

export interface FlowwatchConfig {
    db: PoolConfig
    redis: FlowwatchRedisConfig
    elasticsearch: FlowwatchElasticsearchConfig
    dashboard?: FlowwatchDashboardConfig
    worker?: boolean | FlowwatchWorkerConfig
    migrations?: FlowwatchMigrationConfig
    runtime?: FlowwatchRuntimeConfig
}

export interface FlowwatchRedisConfig {
    url: string
}

export interface FlowwatchElasticsearchConfig {
    node: string
}

export interface FlowwatchDashboardConfig {
    path?: string
    token?: string
    auth?: (req: Request) => boolean | Promise<boolean>
    enabled?: boolean
}

export interface FlowwatchWorkerConfig {
    enabled?: boolean
    workflowConcurrency?: number
    errorIndexingConcurrency?: number
    maintenanceConcurrency?: number
    queuePrefix?: string
}

export interface FlowwatchMigrationConfig {
    autoRun?: boolean
    tableName?: string
}

export interface FlowwatchRuntimeConfig {
    environment?: "development" | "test" | "staging" | "production" | string
    serviceName?: string
    debug?: boolean
}

export interface NormalizedFlowwatchConfig {
    db: PoolConfig
    redis: FlowwatchRedisConfig
    elasticsearch: FlowwatchElasticsearchConfig
    dashboard: Required<Pick<FlowwatchDashboardConfig, "path" | "enabled">> & Pick<FlowwatchDashboardConfig, "token" | "auth">
    worker: Required<FlowwatchWorkerConfig>
    migrations: Required<FlowwatchMigrationConfig>
    runtime: Required<FlowwatchRuntimeConfig>
}
