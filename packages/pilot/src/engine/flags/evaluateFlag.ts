import type { FeatureFlagRow, FeatureFlagRuleRow } from "../../persistence/repositories/flags/flagRepository.js"
import type { FlagContext } from "./types.js"
import { getRolloutBucket } from "./hashRollout.js"

export function evaluateFlag(
    flag: FeatureFlagRow | undefined,
    rules: FeatureFlagRuleRow[],
    context: FlagContext = {}
): boolean {
    if (!flag) {
        return false
    }

    if (!flag.enabled) {
        return false
    }

    for (const rule of rules) {
        if (rule.enabled && ruleMatches(rule, context)) {
            return true
        }
    }

    if (flag.rollout_percentage >= 100) {
        return true
    }

    if (flag.rollout_percentage <= 0) {
        return false
    }

    if (!context.userId) {
        return false
    }

    const bucket = getRolloutBucket(flag.key, context.userId)

    return bucket < flag.rollout_percentage
}

function ruleMatches(rule: FeatureFlagRuleRow, context: FlagContext): boolean {
    const contextValue = context[rule.attribute]

    switch (rule.operator) {
        case "equals":
            return contextValue === rule.value
        case "not_equals":
            return contextValue !== rule.value
        case "in":
            return Array.isArray(rule.value) && rule.value.includes(contextValue)
        case "not_in":
            return Array.isArray(rule.value) && !rule.value.includes(contextValue)
        case "contains":
            return typeof contextValue === "string" && typeof rule.value === "string" && contextValue.includes(rule.value)
        case "starts_with":
            return typeof contextValue === "string" && typeof rule.value === "string" && contextValue.startsWith(rule.value)
        case "ends_with":
            return typeof contextValue === "string" && typeof rule.value === "string" && contextValue.endsWith(rule.value)
        case "greater_than":
            return typeof contextValue === "number" && typeof rule.value === "number" && contextValue > rule.value
        case "less_than":
            return typeof contextValue === "number" && typeof rule.value === "number" && contextValue < rule.value
        default:
            return false
    }
}
