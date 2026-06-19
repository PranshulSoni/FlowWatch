import type { Pool } from "pg"

export interface SearchOptions {
  table: string
  columns: string[]
  query: string
  limit?: number
  offset?: number
  language?: string
}

export interface SearchResult<T = unknown> {
  rows: T[]
  total: number
}

export interface FullTextSearch {
  search<T = unknown>(options: SearchOptions): Promise<SearchResult<T>>
}

function validateIdentifier(name: string): void {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw new Error(`Invalid SQL identifier: "${name}"`)
  }
}

export function createFullTextSearch(pool: Pool): FullTextSearch {
  return {
    async search<T = unknown>(options: SearchOptions): Promise<SearchResult<T>> {
      const { table, columns, query, limit = 20, offset = 0, language = "english" } = options
      validateIdentifier(table)
      columns.forEach(validateIdentifier)
      const vector = columns.map((c) => `coalesce(${c}::text, '')`).join(" || ' ' || ")
      const dataResult = await pool.query<T & { _rank: number }>(
        `SELECT *, ts_rank(to_tsvector($1, ${vector}), plainto_tsquery($1, $2)) AS _rank
         FROM ${table}
         WHERE to_tsvector($1, ${vector}) @@ plainto_tsquery($1, $2)
         ORDER BY _rank DESC LIMIT $3 OFFSET $4`,
        [language, query, limit, offset]
      )
      const countResult = await pool.query<{ count: string }>(
        `SELECT count(*) FROM ${table} WHERE to_tsvector($1, ${vector}) @@ plainto_tsquery($1, $2)`,
        [language, query]
      )
      return { rows: dataResult.rows, total: parseInt(countResult.rows[0].count, 10) }
    },
  }
}
