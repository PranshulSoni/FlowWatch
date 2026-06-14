import type { Pool, PoolClient } from "pg"
import type { Migration } from "./migrations.js"
import { withTransaction } from "../transaction.js"

export async function runMigrations(pool: Pool, migrationsToRun: Migration[]) {
    await createMigrationsTable(pool)

    const appliedMigrations = await getAppliedMigrations(pool)

    for (const migration of migrationsToRun) {
        if (appliedMigrations.has(migration.name)) {
            continue
        }
        await withTransaction(pool, async (client) => {
            await client.query(migration.up)
            await client.query(
                "INSERT INTO pilot_migrations (name) VALUES ($1)",
                [migration.name]
            )
        })
    }
}

async function createMigrationsTable(pool: Pool) {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS pilot_migrations (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    `)
}
async function getAppliedMigrations(pool: Pool): Promise<Set<string>> {
    const result = await pool.query("SELECT name FROM pilot_migrations")

    const migrationNames: string[] = []

    for (const row of result.rows) {
        migrationNames.push(row.name)
    }

    const appliedMigrations = new Set<string>(migrationNames)

    return appliedMigrations
}
