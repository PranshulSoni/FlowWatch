import { randomUUID } from "node:crypto"
import type { Pool } from "pg"

export type FlagRuleOperator =
    | "equals"
    | "not_equals"
    | "in"
    | "not_in"
    | "contains"
    | "starts_with"
    | "ends_with"
    | "greater_than"
    | "less_than"

export interface FeatureFlagRow {
    id: string
    key: string
    description: string | null
    enabled: boolean
    rollout_percentage: number
    created_at: Date
    updated_at: Date
}

export interface FeatureFlagRuleRow {
    id: string
    flag_id: string
    attribute: string
    operator: FlagRuleOperator
    value: unknown
    enabled: boolean
    created_at: Date
    updated_at: Date
}

export interface FeatureFlagAuditLogRow {
    id: string
    flag_id: string | null
    action: string
    before: unknown
    after: unknown
    changed_by: string | null
    created_at: Date
}

export interface CreateFlagInput {
    key: string
    description?: string
    enabled?: boolean
    rolloutPercentage?: number
    changedBy?: string
}

export interface UpdateFlagInput {
    description?: string | null
    enabled?: boolean
    rolloutPercentage?: number
    changedBy?: string
}

export interface CreateFlagRuleInput {
    flagKey: string
    attribute: string
    operator: FlagRuleOperator
    value: unknown
    enabled?: boolean
    changedBy?: string
}

export interface UpdateFlagRuleInput {
    attribute?: string
    operator?: FlagRuleOperator
    value?: unknown
    enabled?: boolean
    changedBy?: string
}

export async function createFlag(pool: Pool, input: CreateFlagInput): Promise<FeatureFlagRow> {
    const flagId = randomUUID()

    await pool.query("BEGIN")

    try {
        const result = await pool.query<FeatureFlagRow>(
            `
            INSERT INTO pilot_feature_flags (
                id,
                key,
                description,
                enabled,
                rollout_percentage
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            `,
            [
                flagId,
                input.key,
                input.description ?? null,
                input.enabled ?? false,
                input.rolloutPercentage ?? 0,
            ]
        )

        const flag = result.rows[0]

        await insertAuditLog(pool, {
            flagId: flag.id,
            action: "flag_created",
            before: null,
            after: flag,
            changedBy: input.changedBy,
        })

        await pool.query("COMMIT")

        return flag
    }
    catch (error) {
        await pool.query("ROLLBACK")
        throw error
    }
}

export async function listFlags(pool: Pool): Promise<FeatureFlagRow[]> {
    const result = await pool.query<FeatureFlagRow>(
        `
        SELECT *
        FROM pilot_feature_flags
        ORDER BY key ASC
        `
    )

    return result.rows
}

export async function getFlagByKey(pool: Pool, key: string): Promise<FeatureFlagRow | undefined> {
    const result = await pool.query<FeatureFlagRow>(
        `
        SELECT *
        FROM pilot_feature_flags
        WHERE key = $1
        `,
        [key]
    )

    return result.rows[0]
}

export async function updateFlag(
    pool: Pool,
    key: string,
    input: UpdateFlagInput
): Promise<FeatureFlagRow | undefined> {
    await pool.query("BEGIN")

    try {
        const before = await getFlagByKey(pool, key)

        if (!before) {
            await pool.query("ROLLBACK")
            return undefined
        }

        const result = await pool.query<FeatureFlagRow>(
            `
            UPDATE pilot_feature_flags
            SET description = COALESCE($2, description),
                enabled = COALESCE($3, enabled),
                rollout_percentage = COALESCE($4, rollout_percentage),
                updated_at = now()
            WHERE key = $1
            RETURNING *
            `,
            [
                key,
                input.description,
                input.enabled,
                input.rolloutPercentage,
            ]
        )

        const after = result.rows[0]

        await insertAuditLog(pool, {
            flagId: after.id,
            action: "flag_updated",
            before,
            after,
            changedBy: input.changedBy,
        })

        await pool.query("COMMIT")

        return after
    }
    catch (error) {
        await pool.query("ROLLBACK")
        throw error
    }
}

export async function deleteFlag(pool: Pool, key: string, changedBy?: string): Promise<boolean> {
    await pool.query("BEGIN")

    try {
        const before = await getFlagByKey(pool, key)

        if (!before) {
            await pool.query("ROLLBACK")
            return false
        }

        await pool.query(
            `
            DELETE FROM pilot_feature_flags
            WHERE key = $1
            `,
            [key]
        )

        await insertAuditLog(pool, {
            flagId: before.id,
            action: "flag_deleted",
            before,
            after: null,
            changedBy,
        })

        await pool.query("COMMIT")

        return true
    }
    catch (error) {
        await pool.query("ROLLBACK")
        throw error
    }
}

export async function listFlagRules(pool: Pool, flagKey: string): Promise<FeatureFlagRuleRow[]> {
    const flag = await getFlagByKey(pool, flagKey)

    if (!flag) {
        return []
    }

    const result = await pool.query<FeatureFlagRuleRow>(
        `
        SELECT *
        FROM pilot_feature_flag_rules
        WHERE flag_id = $1
        ORDER BY created_at ASC
        `,
        [flag.id]
    )

    return result.rows
}

export async function createFlagRule(
    pool: Pool,
    input: CreateFlagRuleInput
): Promise<FeatureFlagRuleRow | undefined> {
    await pool.query("BEGIN")

    try {
        const flag = await getFlagByKey(pool, input.flagKey)

        if (!flag) {
            await pool.query("ROLLBACK")
            return undefined
        }

        const result = await pool.query<FeatureFlagRuleRow>(
            `
            INSERT INTO pilot_feature_flag_rules (
                id,
                flag_id,
                attribute,
                operator,
                value,
                enabled
            )
            VALUES ($1, $2, $3, $4, $5::jsonb, $6)
            RETURNING *
            `,
            [
                randomUUID(),
                flag.id,
                input.attribute,
                input.operator,
                JSON.stringify(input.value),
                input.enabled ?? true,
            ]
        )

        const rule = result.rows[0]

        await insertAuditLog(pool, {
            flagId: flag.id,
            action: "rule_created",
            before: null,
            after: rule,
            changedBy: input.changedBy,
        })

        await pool.query("COMMIT")

        return rule
    }
    catch (error) {
        await pool.query("ROLLBACK")
        throw error
    }
}

export async function updateFlagRule(
    pool: Pool,
    ruleId: string,
    input: UpdateFlagRuleInput
): Promise<FeatureFlagRuleRow | undefined> {
    await pool.query("BEGIN")

    try {
        const beforeResult = await pool.query<FeatureFlagRuleRow>(
            `
            SELECT *
            FROM pilot_feature_flag_rules
            WHERE id = $1
            `,
            [ruleId]
        )

        const before = beforeResult.rows[0]

        if (!before) {
            await pool.query("ROLLBACK")
            return undefined
        }

        const result = await pool.query<FeatureFlagRuleRow>(
            `
            UPDATE pilot_feature_flag_rules
            SET attribute = COALESCE($2, attribute),
                operator = COALESCE($3, operator),
                value = COALESCE($4::jsonb, value),
                enabled = COALESCE($5, enabled),
                updated_at = now()
            WHERE id = $1
            RETURNING *
            `,
            [
                ruleId,
                input.attribute,
                input.operator,
                input.value === undefined ? undefined : JSON.stringify(input.value),
                input.enabled,
            ]
        )

        const after = result.rows[0]

        await insertAuditLog(pool, {
            flagId: after.flag_id,
            action: "rule_updated",
            before,
            after,
            changedBy: input.changedBy,
        })

        await pool.query("COMMIT")

        return after
    }
    catch (error) {
        await pool.query("ROLLBACK")
        throw error
    }
}

export async function deleteFlagRule(pool: Pool, ruleId: string, changedBy?: string): Promise<boolean> {
    await pool.query("BEGIN")

    try {
        const beforeResult = await pool.query<FeatureFlagRuleRow>(
            `
            SELECT *
            FROM pilot_feature_flag_rules
            WHERE id = $1
            `,
            [ruleId]
        )

        const before = beforeResult.rows[0]

        if (!before) {
            await pool.query("ROLLBACK")
            return false
        }

        await pool.query(
            `
            DELETE FROM pilot_feature_flag_rules
            WHERE id = $1
            `,
            [ruleId]
        )

        await insertAuditLog(pool, {
            flagId: before.flag_id,
            action: "rule_deleted",
            before,
            after: null,
            changedBy,
        })

        await pool.query("COMMIT")

        return true
    }
    catch (error) {
        await pool.query("ROLLBACK")
        throw error
    }
}

export async function listFlagAuditLogs(pool: Pool, flagKey: string): Promise<FeatureFlagAuditLogRow[]> {
    const flag = await getFlagByKey(pool, flagKey)

    if (!flag) {
        return []
    }

    const result = await pool.query<FeatureFlagAuditLogRow>(
        `
        SELECT *
        FROM pilot_feature_flag_audit_logs
        WHERE flag_id = $1
        ORDER BY created_at DESC
        `,
        [flag.id]
    )

    return result.rows
}

interface AuditLogInput {
    flagId: string
    action: string
    before: unknown
    after: unknown
    changedBy?: string
}

async function insertAuditLog(pool: Pool, input: AuditLogInput): Promise<void> {
    await pool.query(
        `
        INSERT INTO pilot_feature_flag_audit_logs (
            id,
            flag_id,
            action,
            before,
            after,
            changed_by
        )
        VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6)
        `,
        [
            randomUUID(),
            input.flagId,
            input.action,
            JSON.stringify(input.before),
            JSON.stringify(input.after),
            input.changedBy ?? null,
        ]
    )
}
