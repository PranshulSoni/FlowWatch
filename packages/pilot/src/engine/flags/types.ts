export interface FlagContext {
    userId?: string
    role?: string
    email?: string
    [key: string]: unknown
}

export type EvaluateFlag = (
    key: string,
    context?: FlagContext
) => Promise<boolean>
