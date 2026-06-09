import { Client } from "@elastic/elasticsearch"

export function createElasticsearchClient(node: string): Client {
    return new Client({ node })
}
