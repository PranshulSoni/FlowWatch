export interface PilotAiInsightContext {
    serviceName: string
    environment: string
    generatedAt: string
    workflows: unknown[]
    executions: unknown[]
    errors: unknown[]
    traces: unknown[]
    flags: unknown[]
    health: unknown[]
}

export interface PilotAiInsight {
    summary: string
    likelyCause: string
    impact: string
    evidence: string[]
    recommendedActions: string[]
    confidence: number
    sourceCounts: {
        workflows: number
        executions: number
        errors: number
        traces: number
        flags: number
        health: number
    }
}

const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions"
const GROQ_MODELS_URL = "https://api.groq.com/openai/v1/models"
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"

export interface GroqModelOption {
    id: string
    ownedBy?: string
}

function normalizeInsight(value: any, context: PilotAiInsightContext): PilotAiInsight {
    return {
        summary: String(value?.summary || "No summary returned."),
        likelyCause: String(value?.likelyCause || value?.likely_cause || "Unknown"),
        impact: String(value?.impact || "Unknown"),
        evidence: Array.isArray(value?.evidence) ? value.evidence.map(String).slice(0, 8) : [],
        recommendedActions: Array.isArray(value?.recommendedActions)
            ? value.recommendedActions.map(String).slice(0, 8)
            : Array.isArray(value?.recommended_actions)
                ? value.recommended_actions.map(String).slice(0, 8)
                : [],
        confidence: Math.max(0, Math.min(100, Number(value?.confidence ?? 0))),
        sourceCounts: {
            workflows: context.workflows.length,
            executions: context.executions.length,
            errors: context.errors.length,
            traces: context.traces.length,
            flags: context.flags.length,
            health: context.health.length,
        },
    }
}

function parseInsightJson(content: string): unknown {
    const trimmed = content.trim()
    const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)
    return JSON.parse(fenced?.[1] || trimmed)
}

export async function listGroqModels(): Promise<GroqModelOption[]> {
    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
        throw new Error("GROQ_API_KEY is not configured")
    }

    const response = await fetch(GROQ_MODELS_URL, {
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
    })

    if (!response.ok) {
        const message = await response.text()
        throw new Error(`Groq model request failed: ${response.status} ${message}`)
    }

    const models = await response.json() as any
    return Array.isArray(models?.data)
        ? models.data
            .map((model: any) => ({
                id: String(model?.id || ""),
                ownedBy: model?.owned_by ? String(model.owned_by) : undefined,
            }))
            .filter((model: GroqModelOption) => model.id)
        : []
}

export async function generateGroqInsight(context: PilotAiInsightContext, model?: string): Promise<PilotAiInsight> {
    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
        throw new Error("GROQ_API_KEY is not configured")
    }

    const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: model || process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
            temperature: 0.2,
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: [
                        "You are Pilot's backend reliability assistant.",
                        "Use only the provided JSON context.",
                        "Do not invent workflow names, trace IDs, errors, metrics, services, or incidents.",
                        "Return valid JSON with these exact keys: summary, likelyCause, impact, evidence, recommendedActions, confidence.",
                        "evidence and recommendedActions must be arrays of strings. confidence must be a number from 0 to 100.",
                    ].join(" "),
                },
                {
                    role: "user",
                    content: JSON.stringify(context),
                },
            ],
        }),
    })

    if (!response.ok) {
        const message = await response.text()
        throw new Error(`Groq insight request failed: ${response.status} ${message}`)
    }

    const completion = await response.json() as any
    const content = completion.choices?.[0]?.message?.content

    if (!content) {
        throw new Error("Groq returned an empty insight response")
    }

    return normalizeInsight(parseInsightJson(content), context)
}
