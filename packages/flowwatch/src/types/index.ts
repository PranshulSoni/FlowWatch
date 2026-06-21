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
    server?: FlowwatchServerConfig
    security?: FlowwatchSecurityConfig
    auth?: FlowwatchAuthConfig
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

export interface FlowwatchServerConfig {
    bodyLimit?: string
    timeout?: number
}

export interface FlowwatchSecurityConfig {
    // false = disable helmet entirely; object = pass custom helmet options
    headers?: false | Record<string, unknown>
}

export interface FlowwatchAuthConfig {
    jwtSecret: string
    urls?: {
        apiBaseUrl: string
        frontendBaseUrl?: string
    }
    accessTokenExpiry?: string
    refreshTokenExpiry?: string
    rateLimit?: {
        redisUrl: string
    }
    email?: {
        provider: string
        apiKey: string
        from: string
    }
    oauth?: {
        google?: {
            clientId: string
            clientSecret: string
            callbackUrl: string
        }
    }
}

export interface NormalizedFlowwatchConfig {
    db: PoolConfig
    redis: FlowwatchRedisConfig
    elasticsearch: FlowwatchElasticsearchConfig
    dashboard: Required<Pick<FlowwatchDashboardConfig, "path" | "enabled">> & Pick<FlowwatchDashboardConfig, "token" | "auth">
    worker: Required<FlowwatchWorkerConfig>
    migrations: Required<FlowwatchMigrationConfig>
    runtime: Required<FlowwatchRuntimeConfig>
    server: Required<FlowwatchServerConfig>
}
