import type { Pool } from "pg"
import type { RequestHandler } from "express"
import type { CronEngine } from "./cronEngine.js"

export interface AuditMiddlewareOptions {
    ignore?: string[]        // path prefixes to skip, e.g. ["/health", "/metrics"]
    retentionDays?: number   // default 15
}

export interface AuditQueryOptions {
    userId?: string
    tenantId?: string
    method?: string
    path?: string
    status?: number
    from?: Date
    to?: Date
    limit?: number
}

export interface AuditEntry {
    id: string
    user_id: string | null
    tenant_id: string | null
    method: string
    path: string
    status: number
    duration_ms: number
    ip: string | null
    created_at: Date
}

export interface AuditEngine {
    middleware(options?: AuditMiddlewareOptions): RequestHandler
    query(options?: AuditQueryOptions): Promise<AuditEntry[]>
}

async function ensureTable(pool: Pool) {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS fw_audit_log (
            id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id     TEXT,
            tenant_id   TEXT,
            method      VARCHAR(10) NOT NULL,
            path        TEXT        NOT NULL,
            status      INTEGER     NOT NULL,
            duration_ms INTEGER     NOT NULL,
            ip          TEXT,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `)
    await pool.query(`
        CREATE INDEX IF NOT EXISTS fw_audit_log_user_id_idx    ON fw_audit_log (user_id)
    `)
    await pool.query(`
        CREATE INDEX IF NOT EXISTS fw_audit_log_tenant_id_idx  ON fw_audit_log (tenant_id)
    `)
    await pool.query(`
        CREATE INDEX IF NOT EXISTS fw_audit_log_created_at_idx ON fw_audit_log (created_at)
    `)
}

export async function createAuditEngine(pool: Pool, cronEngine: CronEngine | null): Promise<AuditEngine> {
    await ensureTable(pool)

    return {
        middleware(options: AuditMiddlewareOptions = {}): RequestHandler {
            const ignore = options.ignore ?? []
            const retentionDays = options.retentionDays ?? 15

            // register nightly cleanup — BullMQ deduplicates by name+pattern so safe to call multiple times
            if (cronEngine) {
                cronEngine.cron("fw:audit-cleanup", "0 0 * * *", async () => {
                    await pool.query(
                        "DELETE FROM fw_audit_log WHERE created_at < NOW() - ($1 || ' days')::INTERVAL",
                        [retentionDays]
                    )
                })
            }

            return (req, res, next) => {
                // skip ignored paths
                if (ignore.some(p => req.path.startsWith(p))) return next()

                const start = Date.now()

                res.on("finish", () => {
                    const userId = (req as any).user?.userId ?? null
                    const tenantId = (req as any).tenantId ?? null
                    const ip = req.ip ?? null
                    const duration = Date.now() - start

                    // fire-and-forget — response already sent
                    pool.query(
                        `INSERT INTO fw_audit_log (user_id, tenant_id, method, path, status, duration_ms, ip)
                         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                        [userId, tenantId, req.method, req.path, res.statusCode, duration, ip]
                    ).catch(() => {})
                })

                next()
            }
        },

        async query(options: AuditQueryOptions = {}): Promise<AuditEntry[]> {
            const conditions: string[] = []
            const values: unknown[] = []
            let i = 1

            if (options.userId)   { conditions.push(`user_id = $${i++}`);   values.push(options.userId) }
            if (options.tenantId) { conditions.push(`tenant_id = $${i++}`); values.push(options.tenantId) }
            if (options.method)   { conditions.push(`method = $${i++}`);    values.push(options.method.toUpperCase()) }
            if (options.path)     { conditions.push(`path = $${i++}`);      values.push(options.path) }
            if (options.status)   { conditions.push(`status = $${i++}`);    values.push(options.status) }
            if (options.from)     { conditions.push(`created_at >= $${i++}`); values.push(options.from) }
            if (options.to)       { conditions.push(`created_at <= $${i++}`); values.push(options.to) }

            const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
            const limit = options.limit ?? 100

            const result = await pool.query<AuditEntry>(
                `SELECT * FROM fw_audit_log ${where} ORDER BY created_at DESC LIMIT $${i}`,
                [...values, limit]
            )
            return result.rows
        }
    }
}
