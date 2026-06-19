import { Writable } from "stream";
import type { Pool } from "pg";

export interface LogEntry {
  level: string;
  message: string;
  metadata: Record<string, unknown>;
  logged_at: Date;
}

export interface LogQueryOptions {
  level?: string;
  limit?: number;
  since?: Date;
  search?: string;
}

export interface LogStore {
  stream: Writable;
  query(options?: LogQueryOptions): Promise<LogEntry[]>;
}

const LEVEL_NAMES: Record<number, string> = {
  10: "trace", 20: "debug", 30: "info", 40: "warn", 50: "error", 60: "fatal",
};

export function createLogStore(pool: Pool): LogStore {
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      try {
        const entry = JSON.parse(chunk.toString()) as Record<string, unknown>;
        const levelRaw = entry["level"];
        const level = typeof levelRaw === "number"
          ? (LEVEL_NAMES[levelRaw] ?? "info")
          : String(levelRaw ?? "info");
        const msg = String(entry["msg"] ?? "");
        const time = typeof entry["time"] === "number" ? new Date(entry["time"]) : new Date();

        pool.query(
          "INSERT INTO flowwatch_logs (level, message, metadata, logged_at) VALUES ($1, $2, $3, $4)",
          [level, msg, JSON.stringify(entry), time]
        ).catch(() => {}); // fire-and-forget, never block the stream
      } catch {
        // ignore malformed log lines
      }
      callback();
    }
  });

  async function query({ level, limit = 100, since, search }: LogQueryOptions = {}): Promise<LogEntry[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (level) conditions.push(`level = $${params.push(level)}`);
    if (since) conditions.push(`logged_at >= $${params.push(since)}`);
    if (search) conditions.push(`message ILIKE $${params.push(`%${search}%`)}`);

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await pool.query<LogEntry>(
      `SELECT level, message, metadata, logged_at FROM flowwatch_logs ${where} ORDER BY logged_at DESC LIMIT $${params.push(limit)}`,
      params
    );
    return result.rows;
  }

  return { stream, query };
}
