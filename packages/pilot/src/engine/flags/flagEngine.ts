import type { Pool } from "pg"
import { getFlagByKey, listFlagRules } from "../../persistence/repositories/flags/flagRepository.js"
import type { CaptureErrorFunction } from "../errors/errorEngine.js"
import type { TraceEngine } from "../trace/traceEngine.js"
import { evaluateFlag } from "./evaluateFlag.js"
import type { EvaluateFlag, FlagContext } from "./types.js"

export interface FlagEngine {
    flag: EvaluateFlag
}

export function createFlagEngine(
    pool: Pool,
    traceEngine: TraceEngine,
    captureError: CaptureErrorFunction
): FlagEngine {
    async function flag(key: string, context: FlagContext = {}): Promise<boolean> {
        try {
            return await traceEngine.trace("pilot.feature_flag.evaluate", "feature_flag", async () => {
                //So the redis function should actually come here and be stored here.
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
        catch (error) {
            await captureError(error, {
                source: "feature_flag",
                category: "server",
                level: "error",
                statusCode: 500,
                metadata: {
                    flagKey: key,
                },
            })

            throw error
        }
    }

    return {
        flag,
    }
}
