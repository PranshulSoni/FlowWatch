import type { Pool } from "pg"
import { getFlagByKey, listFlagRules } from "../../persistence/repositories/flags/flagRepository.js"
import type { CaptureErrorFunction } from "../errors/errorEngine.js"
import type { TraceEngine } from "../trace/traceEngine.js"
import { evaluateFlag } from "./evaluateFlag.js"
import type { EvaluateFlag, FlagContext } from "./types.js"
import type { Redis } from "ioredis"
export interface FlagEngine {
    flag: EvaluateFlag
}

export function createFlagEngine(
    pool: Pool,
    traceEngine: TraceEngine,
    captureError: CaptureErrorFunction,
    redisClient: Redis
): FlagEngine {
    async function flag(key: string, context: FlagContext = {}): Promise<boolean> {
        try {
            return await traceEngine.trace("pilot.feature_flag.evaluate", "feature_flag", async () => {
                const cacheKey = `pilot:flags:${key}`

                // Cache read — non-fatal, falls back to DB on any Redis error
                try {
                    const cachedValue = await redisClient.get(cacheKey)
                    if (cachedValue) {
                        const cached = JSON.parse(cachedValue)
                        return evaluateFlag(cached.flag, cached.rules, context)
                    }
                } catch {
                    // Redis unavailable or version mismatch — continue to DB
                }

                const storedFlag = await getFlagByKey(pool, key)
                if (!storedFlag) {
                    return false
                }
                const rules = await listFlagRules(pool, key)

                // Cache write — non-fatal
                try {
                    await redisClient.set(
                        cacheKey,
                        JSON.stringify({ flag: storedFlag, rules }),
                        "EX",
                        60
                    )
                } catch {
                    // Cache write failed — not critical
                }

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
