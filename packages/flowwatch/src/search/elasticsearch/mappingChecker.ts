import type { Client } from "@elastic/elasticsearch"
import { createErrorMapping, createTraceMapping, errorIndex, traceSpanIndex } from "./indexer.js"
import { logger } from "../../logger.js"

export async function createMissingMappings(client: Client): Promise<void> {
    try {
        await createErrorMappingIfMissing(client)
        await createTraceMappingIfMissing(client)
    } catch (err: any) {
        logger.warn({ err: err?.message ?? err }, "Elasticsearch unavailable on startup — indexing skipped until reachable")
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
