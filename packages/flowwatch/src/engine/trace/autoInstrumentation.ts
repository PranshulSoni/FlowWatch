import type { Pool, QueryConfig, QueryResult } from "pg";
import type { TraceEngine } from "./traceEngine.js";

export type TracedQuery = (sql: string | QueryConfig, params?: unknown[]) => Promise<QueryResult>;
export type TracedFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export function createTracedQuery(pool: Pool, traceEngine: TraceEngine): TracedQuery {
  return (sql, params) => {
    const name = typeof sql === "string" ? sql.slice(0, 100) : (sql.text ?? "db_query").slice(0, 100);
    return traceEngine.trace(name, "repository", () => pool.query(sql as any, params));
  };
}

export function createTracedFetch(traceEngine: TraceEngine): TracedFetch {
  return (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;
    const method = init?.method ?? (input instanceof Request ? input.method : "GET");
    return traceEngine.trace(`${method} ${url}`, "external_api", () => fetch(input, init));
  };
}
