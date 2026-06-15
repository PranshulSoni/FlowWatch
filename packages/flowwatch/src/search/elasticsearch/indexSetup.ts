import type { Client } from "@elastic/elasticsearch"

export async function createErrorMapping(client: Client): Promise<void> {
    await client.indices.create({
        index: "flowwatch_errors",
        mappings: {
            properties: {
                id: { type: "keyword" },
                traceId: { type: "keyword" },
                spanId: { type: "keyword" },

                source: { type: "keyword" },
                category: { type: "keyword" },
                level: { type: "keyword" },
                name: { type: "keyword" },
                fingerprint: { type: "keyword" },

                message: { type: "text" },
                stack: { type: "text" },

                statusCode: { type: "integer" },

                metadata: { type: "object", enabled: true },

                occurredAt: { type: "date" },
                createdAt: { type: "date" },
            },
        },
    })
}

export async function createTraceMapping(client: Client): Promise<void> {
    await client.indices.create({
        index: "flowwatch_trace_spans",
        mappings: {
            properties: {
                id: { type: "keyword" },
                traceId: { type: "keyword" },
                parentSpanId: { type: "keyword" },

                name: { type: "text" },
                type: { type: "keyword" },
                status: { type: "keyword" },

                durationMs: { type: "integer" },

                metadata: { type: "object", enabled: true },

                startedAt: { type: "date" },
                endedAt: { type: "date" },
                createdAt: { type: "date" },
            },
        },
    })
}