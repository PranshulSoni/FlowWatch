import type { Pool } from "pg"
import { getFlagByKey, listFlagRules } from "../../persistence/repositories/flags/flagRepository.js"
import { evaluateFlag } from "./evaluateFlag.js"
import type { EvaluateFlag, FlagContext } from "./types.js"

export interface FlagEngine {
    flag: EvaluateFlag
}

export function createFlagEngine(pool: Pool): FlagEngine {
    async function flag(key: string, context: FlagContext = {}): Promise<boolean> {
        const storedFlag = await getFlagByKey(pool, key)

        if (!storedFlag) {
            return false
        }

        const rules = await listFlagRules(pool, key)

        return evaluateFlag(storedFlag, rules, context)
    }

    return {
        flag,
    }
}
