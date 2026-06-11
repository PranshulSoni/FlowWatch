import { createHash } from "node:crypto"

export function getRolloutBucket(flagKey: string, userId: string): number {
    const hash = createHash("sha256")
        .update(`${flagKey}:${userId}`)
        .digest("hex")

    const firstEightHexChars = hash.slice(0, 8)
    const value = Number.parseInt(firstEightHexChars, 16)

    return value % 100
}
