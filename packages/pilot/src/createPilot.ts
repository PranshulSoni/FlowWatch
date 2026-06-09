import type { Router } from "express"
import { createDashboardRouter } from "./dashboard/routes/router.js"
import type { PilotConfig } from "./types/index.js"
import { validateConfig } from "./runtime/config/validationConfig.js"
import { normalizeConfig } from "./runtime/config/normalizeConfig.js"
import { createPostgresPool } from "./persistence/db/postgres.js"
import { createElasticsearchClient } from "./search/elasticsearch/client.js"
import { Redis } from "ioredis"
import { runMigrations } from "./persistence/migrations/migrationRunner.js"
import { migrations } from "./persistence/migrations/migrations.js"

export interface Pilot {
    dashboard: Router
}

export async function createPilot(config: PilotConfig): Promise<Pilot> {
    const validConfig = validateConfig(config)
    const normalizedConfig = await normalizeConfig(validConfig)
    const postgresPool = createPostgresPool(normalizedConfig.db)
    if(normalizedConfig.migrations.autoRun){
        await runMigrations(postgresPool,migrations);
    }
    const redisClient = new Redis(normalizedConfig.redis.url)
    const elasticsearchClient = createElasticsearchClient(normalizedConfig.elasticsearch.node)
    const dashboard = createDashboardRouter({
        config: normalizedConfig,
        postgresPool,
        redisClient,
        elasticsearchClient,
    })
    return {
        dashboard
    }
}
