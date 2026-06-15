import type { Client } from "@elastic/elasticsearch"
import { createErrorMapping, createTraceMapping, errorIndex, traceSpanIndex } from "./indexer.js"

export async function createMissingMappings(client: Client): Promise<void> {
    try {
        await createErrorMappingIfMissing(client)
        await createTraceMappingIfMissing(client)
    } catch (err: any) {
        console.warn(`[Pilot] ⚠️  Elasticsearch unavailable on startup (${err?.message ?? err}). Search indexing will be skipped until Elasticsearch is reachable.`)
    }
}

async function createErrorMappingIfMissing(client: Client): Promise<void> {
    const exists = await client.indices.exists({
        index: errorIndex,
    })

    if(exists){
        return
    }

    await createErrorMapping(client)
}

async function createTraceMappingIfMissing(client: Client): Promise<void> {
    const exists = await client.indices.exists({
        index: traceSpanIndex,
    })

    if(exists){
        return
    }

    await createTraceMapping(client)
}
