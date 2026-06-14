/**
 * Pilot environment store — owns the API key and model preference without
 * mutating the consumer's process.env. Persists to `.pilot.env` in the
 * consumer's working directory (process.cwd()), not inside node_modules.
 */
import { readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

const ENV_FILE_NAME = ".pilot.env"

interface PilotEnv {
    groqApiKey?: string
    groqModel?: string
}

// Module-level store — single source of truth for this process
const store: PilotEnv = {}

function getEnvFilePath(): string {
    return join(process.cwd(), ENV_FILE_NAME)
}

/** Parse a simple KEY=VALUE .env file (no external dependency). */
function parseEnvFile(content: string): PilotEnv {
    const result: PilotEnv = {}
    for (const line of content.split("\n")) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith("#")) continue
        const eq = trimmed.indexOf("=")
        if (eq === -1) continue
        const key = trimmed.slice(0, eq).trim()
        const value = trimmed.slice(eq + 1).trim()
        if (key === "PILOT_GROQ_API_KEY") result.groqApiKey = value
        if (key === "PILOT_GROQ_MODEL") result.groqModel = value
    }
    return result
}

/** Serialize the store to .env file format. */
function serializeEnvFile(env: PilotEnv): string {
    const lines = [
        "# Pilot AI configuration — auto-generated, do not commit to version control",
        "# Add .pilot.env to your .gitignore",
        "",
    ]
    if (env.groqApiKey) lines.push(`PILOT_GROQ_API_KEY=${env.groqApiKey}`)
    if (env.groqModel) lines.push(`PILOT_GROQ_MODEL=${env.groqModel}`)
    lines.push("")
    return lines.join("\n")
}

/** Load credentials from .pilot.env into the in-memory store on startup. */
export async function loadPilotEnv(): Promise<void> {
    try {
        const content = await readFile(getEnvFilePath(), "utf-8")
        const parsed = parseEnvFile(content)
        if (parsed.groqApiKey) store.groqApiKey = parsed.groqApiKey
        if (parsed.groqModel) store.groqModel = parsed.groqModel
    } catch {
        // File doesn't exist yet — that's fine
    }
}

/** Save credentials to .pilot.env and update the in-memory store. */
export async function savePilotEnv(updates: Partial<PilotEnv>): Promise<void> {
    if (updates.groqApiKey !== undefined) store.groqApiKey = updates.groqApiKey || undefined
    if (updates.groqModel !== undefined) store.groqModel = updates.groqModel || undefined

    await writeFile(getEnvFilePath(), serializeEnvFile(store), "utf-8")
}

/** Read the current Groq API key (never exposed to client). */
export function getGroqApiKey(): string | undefined {
    return store.groqApiKey
}

/** Read the current Groq model preference. */
export function getGroqModel(): string | undefined {
    return store.groqModel
}

/** Check if the API key is configured (safe to send to client). */
export function isGroqApiKeyConfigured(): boolean {
    return Boolean(store.groqApiKey)
}
