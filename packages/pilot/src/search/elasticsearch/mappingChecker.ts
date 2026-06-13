import type { Client } from "@elastic/elasticsearch"
import { createErrorMapping, createTraceMapping, errorIndex, traceSpanIndex } from "./indexer.js"

export async function createMissingMappings(client: Client): Promise<void> {
    await createErrorMappingIfMissing(client)
    await createTraceMappingIfMissing(client)
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
