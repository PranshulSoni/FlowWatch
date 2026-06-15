/**
 * Flowwatch environment store — persists AI credentials to `.fw.env` in the
 * consumer's working directory (process.cwd()), i.e. their project root.
 *
 * Priority order on startup:
 *   1. FLOWWATCH_GROQ_API_KEY / FLOWWATCH_GROQ_MODEL   already in process.env
 *   2. .fw.env at process.cwd()           written by this module
 *   → whichever is found first wins; the result is persisted to .fw.env
 */
import { readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

const FLOWWATCH_ENV_FILE = ".fw.env"

interface FlowwatchEnv {
    groqApiKey?: string
    groqModel?: string
}

/** Single in-memory store for the lifetime of this process. */
const store: FlowwatchEnv = {}

// ─── Path ────────────────────────────────────────────────────────────────────

function getFlowwatchEnvPath(): string {
    return join(process.cwd(), FLOWWATCH_ENV_FILE)
}

// ─── File helpers ─────────────────────────────────────────────────────────────

function parseEnvFile(content: string): FlowwatchEnv {
    const result: FlowwatchEnv = {}
    for (const raw of content.split(/\r?\n/)) {
        const line = raw.trim()
        if (!line || line.startsWith("#")) continue
        const eq = line.indexOf("=")
        if (eq === -1) continue
        const key   = line.slice(0, eq).trim()
        const value = line.slice(eq + 1).trim()
        if (key === "FLOWWATCH_GROQ_API_KEY") result.groqApiKey = value
        if (key === "FLOWWATCH_GROQ_MODEL")   result.groqModel  = value
    }
    return result
}

function buildEnvFile(existing: string, updated: FlowwatchEnv): string {
    const kept = existing
        .split(/\r?\n/)
        .filter((l) => {
            const t = l.trim()
            return !t.startsWith("FLOWWATCH_GROQ_API_KEY=") && !t.startsWith("FLOWWATCH_GROQ_MODEL=")
        })

    while (kept.length && !kept[kept.length - 1].trim()) kept.pop()
    if (!kept.length) {
        kept.push("# Flowwatch AI configuration — auto-generated, do not commit to version control")
    }

    if (updated.groqApiKey) kept.push(`FLOWWATCH_GROQ_API_KEY=${updated.groqApiKey}`)
    if (updated.groqModel)  kept.push(`FLOWWATCH_GROQ_MODEL=${updated.groqModel}`)
    kept.push("")
    return kept.join("\n")
}

async function readEnvFile(): Promise<string> {
    try {
        return await readFile(getFlowwatchEnvPath(), "utf-8")
    } catch {
        return ""
    }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Load AI credentials into the in-memory store on startup.
 *
 * Resolution order (both are checked; process.env fills gaps not in the file):
 *   1. .fw.env at process.cwd()   — written by dashboard Settings
 *   2. process.env.FLOWWATCH_GROQ_API_KEY / GROQ_API_KEY   — set by consumer
 *
 * If the key is found only in process.env it is immediately persisted to
 * .fw.env so the next restart doesn't need process.env anymore.
 */
export async function loadFlowwatchEnv(): Promise<void> {
    const filePath = getFlowwatchEnvPath()

    // Step 1 — read whatever the file has (may be partial or missing)
    const raw    = await readEnvFile()
    const parsed = parseEnvFile(raw)
    if (parsed.groqApiKey) store.groqApiKey = parsed.groqApiKey
    if (parsed.groqModel)  store.groqModel  = parsed.groqModel

    // Step 2 — fill any gaps from process.env (ALWAYS checked, even if file exists)
    const envKey   = process.env.FLOWWATCH_GROQ_API_KEY || process.env.GROQ_API_KEY
    const envModel = process.env.FLOWWATCH_GROQ_MODEL   || process.env.GROQ_MODEL

    let needsSave = false
    if (!store.groqApiKey && envKey) {
        store.groqApiKey = envKey
        needsSave = true
    }
    if (!store.groqModel && envModel) {
        store.groqModel = envModel
        needsSave = true
    }

    if (store.groqApiKey) {
        console.log(`[Flowwatch] ✅  Groq API key loaded (config: ${filePath})`)
        // Persist back so future restarts find the key in the file
        if (needsSave) {
            try {
                await writeFile(filePath, buildEnvFile(raw, store), "utf-8")
                console.log(`[Flowwatch] ✅  API key saved to ${filePath}`)
            } catch (err: any) {
                console.warn(`[Flowwatch] ⚠️  Could not write ${filePath}: ${err?.message}`)
            }
        }
    } else {
        console.log(
            `[Flowwatch] ⚠️  No Groq API key found.\n` +
            `         • Enter it in the dashboard → Settings → AI Configuration\n` +
            `         • OR set FLOWWATCH_GROQ_API_KEY in your environment\n` +
            `         • Config will be saved to: ${filePath}`
        )
    }
}

/**
 * Persist settings to .fw.env and update the in-memory store.
 * Called from the dashboard Settings API when the user saves their key.
 */
export async function saveFlowwatchEnv(updates: Partial<FlowwatchEnv>): Promise<void> {
    if (updates.groqApiKey !== undefined) store.groqApiKey = updates.groqApiKey || undefined
    if (updates.groqModel  !== undefined) store.groqModel  = updates.groqModel  || undefined

    const existing = await readEnvFile()
    await writeFile(getFlowwatchEnvPath(), buildEnvFile(existing, store), "utf-8")
}

/** API key from store or process.env. Never log or send this to the client. */
export function getGroqApiKey(): string | undefined {
    return (
        store.groqApiKey ||
        process.env.FLOWWATCH_GROQ_API_KEY ||
        process.env.GROQ_API_KEY
    )
}

/** Model from store or process.env. */
export function getGroqModel(): string | undefined {
    return (
        store.groqModel ||
        process.env.FLOWWATCH_GROQ_MODEL ||
        process.env.GROQ_MODEL ||
        undefined
    )
}

/** True if any API key source is available. Safe to send to the client. */
export function isGroqApiKeyConfigured(): boolean {
    return Boolean(getGroqApiKey())
}
