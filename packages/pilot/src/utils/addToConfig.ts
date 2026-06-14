import { readFile, writeFile } from "node:fs/promises"
import { dump, load } from "js-yaml"

export async function addToConfig(configPath: string, groqApiKey: string, groqModel: string): Promise<void> {
    let data: Record<string, any> = {}

    try {
        const raw = await readFile(configPath, "utf-8")
        data = load(raw) as Record<string, any> || {}
    } catch {
        data = {}
    }

    if (!data.groq) data.groq = {}
    data.groq.apiKey = groqApiKey
    data.groq.model = groqModel

    await writeFile(configPath, dump(data, { lineWidth: 120, noRefs: true }), "utf-8")
}
