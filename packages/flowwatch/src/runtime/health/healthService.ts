import type { Client } from "@elastic/elasticsearch"
import type { Pool } from "pg";
import type { Redis } from "ioredis"

export async function checkPostgresHealth(pool: Pool) {
    const startedAt = Date.now();
    try {
        await pool.query("SELECT 1");
        return {
            status: "ok",
            latencyMs: Date.now() - startedAt
        };
    }
    catch (error) {
        return {
            status: "error",
            message: error instanceof Error ? error.message : "Unknown error" 
        }
    }
}

export async function checkRedisHealth(redisClient: Redis) {
    const startedAt = Date.now();

    try {
        const response = await redisClient.ping();
        if (response != "PONG") {
            return {
                status: "error",
                message: `Unexpected Redis Response ${response}`
            }
        }
        return {
            status: "ok",
            latencyMs: Date.now() - startedAt
        };
    }
    catch (error) {
        return {
            status: "error",
            message: error instanceof Error?error.message:"Unknown error"
        }
    }
}

export async function checkElasticsearchHealth(elasticsearchClient: Client) {
    const startedAt = Date.now()

    try {
        await elasticsearchClient.ping()

        return {
            status: "ok",
            latencyMs: Date.now() - startedAt
        }
    }
    catch (error) {
        return {
            status: "error",
            message: error instanceof Error ? error.message : "Unknown error"
        }
    }
}
