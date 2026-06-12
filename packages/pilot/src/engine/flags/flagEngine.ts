import type { Pool } from "pg"
import { getFlagByKey, listFlagRules } from "../../persistence/repositories/flags/flagRepository.js"
import type { TraceEngine } from "../trace/traceEngine.js"
import { evaluateFlag } from "./evaluateFlag.js"
import type { EvaluateFlag, FlagContext } from "./types.js"

export interface FlagEngine {
    flag: EvaluateFlag
}

export function createFlagEngine(pool: Pool, traceEngine: TraceEngine): FlagEngine {
    async function flag(key: string, context: FlagContext = {}): Promise<boolean> {
        return traceEngine.trace("pilot.feature_flag.evaluate", "feature_flag", async () => {
            const storedFlag = await getFlagByKey(pool, key)

            if (!storedFlag) {
                return false
            }

            const rules = await listFlagRules(pool, key)
            
            return evaluateFlag(storedFlag, rules, context)
        }, {
            flagKey: key,
        })
    }

    return {
        flag,
    }
}
