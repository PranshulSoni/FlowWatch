import type { Pool, PoolClient } from "pg"
import type { Migration } from "./migrations.js"
import { withTransaction } from "../transaction.js"

export async function runMigrations(pool: Pool, migrationsToRun: Migration[]) {
    await createMigrationsTable(pool)

    await withMigrationLock(pool, async () => {
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
            appliedMigrations.add(migration.name)
        }
    })
}

async function withMigrationLock<T>(pool: Pool, fn: () => Promise<T>): Promise<T> {
    const client = await pool.connect()
    try {
        await client.query("SELECT pg_advisory_lock(hashtext('pilot:migrations'))")
        return await fn()
    } finally {
        await client.query("SELECT pg_advisory_unlock(hashtext('pilot:migrations'))")
        client.release()
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
