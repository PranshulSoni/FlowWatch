/**
 * Pilot environment store — persists AI credentials to `.pilot.env` in the
 * consumer's working directory (process.cwd()), i.e. their project root.
 *
 * Priority order on startup:
 *   1. PILOT_GROQ_API_KEY / PILOT_GROQ_MODEL   already in process.env (e.g. from their .env file)
 *   2. .pilot.env at process.cwd()              written by this module
 *   → whichever is found first wins; the result is persisted to .pilot.env
 */
import { readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

const PILOT_ENV_FILE = ".pilot.env"

interface PilotEnv {
    groqApiKey?: string
    groqModel?: string
}

/** Single in-memory store for the lifetime of this process. */
const store: PilotEnv = {}

// ─── Path ────────────────────────────────────────────────────────────────────

function getPilotEnvPath(): string {
    return join(process.cwd(), PILOT_ENV_FILE)
}

// ─── File helpers ─────────────────────────────────────────────────────────────

function parseEnvFile(content: string): PilotEnv {
    const result: PilotEnv = {}
    for (const raw of content.split(/\r?\n/)) {
        const line = raw.trim()
        if (!line || line.startsWith("#")) continue
        const eq = line.indexOf("=")
        if (eq === -1) continue
        const key   = line.slice(0, eq).trim()
        const value = line.slice(eq + 1).trim()
        if (key === "PILOT_GROQ_API_KEY") result.groqApiKey = value
        if (key === "PILOT_GROQ_MODEL")   result.groqModel  = value
    }
    return result
}

function buildEnvFile(existing: string, updated: PilotEnv): string {
    const kept = existing
        .split(/\r?\n/)
        .filter((l) => {
            const t = l.trim()
            return !t.startsWith("PILOT_GROQ_API_KEY=") && !t.startsWith("PILOT_GROQ_MODEL=")
        })

    while (kept.length && !kept[kept.length - 1].trim()) kept.pop()
    if (!kept.length) {
        kept.push("# Pilot AI configuration — auto-generated, do not commit to version control")
    }

    if (updated.groqApiKey) kept.push(`PILOT_GROQ_API_KEY=${updated.groqApiKey}`)
    if (updated.groqModel)  kept.push(`PILOT_GROQ_MODEL=${updated.groqModel}`)
    kept.push("")
    return kept.join("\n")
}

async function readEnvFile(): Promise<string> {
    try {
        return await readFile(getPilotEnvPath(), "utf-8")
    } catch {
        return ""
    }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Load AI credentials into the in-memory store on startup.
 *
 * Resolution order (both are checked; process.env fills gaps not in the file):
 *   1. .pilot.env at process.cwd()   — written by dashboard Settings
 *   2. process.env.PILOT_GROQ_API_KEY / GROQ_API_KEY   — set by consumer
 *
 * If the key is found only in process.env it is immediately persisted to
 * .pilot.env so the next restart doesn't need process.env anymore.
 */
export async function loadPilotEnv(): Promise<void> {
    const filePath = getPilotEnvPath()

    // Step 1 — read whatever the file has (may be partial or missing)
    const raw    = await readEnvFile()
    const parsed = parseEnvFile(raw)
    if (parsed.groqApiKey) store.groqApiKey = parsed.groqApiKey
    if (parsed.groqModel)  store.groqModel  = parsed.groqModel

    // Step 2 — fill any gaps from process.env (ALWAYS checked, even if file exists)
    const envKey   = process.env.PILOT_GROQ_API_KEY || process.env.GROQ_API_KEY
    const envModel = process.env.PILOT_GROQ_MODEL   || process.env.GROQ_MODEL

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
        console.log(`[Pilot] ✅  Groq API key loaded (config: ${filePath})`)
        // Persist back so future restarts find the key in the file
        if (needsSave) {
            try {
                await writeFile(filePath, buildEnvFile(raw, store), "utf-8")
                console.log(`[Pilot] ✅  API key saved to ${filePath}`)
            } catch (err: any) {
                console.warn(`[Pilot] ⚠️  Could not write ${filePath}: ${err?.message}`)
            }
        }
    } else {
        console.log(
            `[Pilot] ⚠️  No Groq API key found.\n` +
            `         • Enter it in the dashboard → Settings → AI Configuration\n` +
            `         • OR set PILOT_GROQ_API_KEY in your environment\n` +
            `         • Config will be saved to: ${filePath}`
        )
    }
}

/**
 * Persist settings to .pilot.env and update the in-memory store.
 * Called from the dashboard Settings API when the user saves their key.
 */
export async function savePilotEnv(updates: Partial<PilotEnv>): Promise<void> {
    if (updates.groqApiKey !== undefined) store.groqApiKey = updates.groqApiKey || undefined
    if (updates.groqModel  !== undefined) store.groqModel  = updates.groqModel  || undefined

    const existing = await readEnvFile()
    await writeFile(getPilotEnvPath(), buildEnvFile(existing, store), "utf-8")
}

/** API key from store or process.env. Never log or send this to the client. */
export function getGroqApiKey(): string | undefined {
    return (
        store.groqApiKey ||
        process.env.PILOT_GROQ_API_KEY ||
        process.env.GROQ_API_KEY
    )
}

/** Model from store or process.env. */
export function getGroqModel(): string | undefined {
    return (
        store.groqModel ||
        process.env.PILOT_GROQ_MODEL ||
        process.env.GROQ_MODEL ||
        undefined
    )
}

/** True if any API key source is available. Safe to send to the client. */
export function isGroqApiKeyConfigured(): boolean {
    return Boolean(getGroqApiKey())
}
