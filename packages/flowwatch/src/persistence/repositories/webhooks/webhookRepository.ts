import { randomUUID } from "node:crypto";
import type { Pool } from "pg";

export interface WebhookRow {
  id: string;
  url: string;
  events: string[];
  secret: string;
  enabled: boolean;
  created_at: Date;
}

export interface WebhookDeliveryRow {
  id: string;
  webhook_id: string;
  event: string;
  payload: unknown;
  status: "pending" | "success" | "failed";
  response_status: number | null;
  attempts: number;
  last_attempted_at: Date | null;
  created_at: Date;
}

export async function insertWebhook(pool: Pool, url: string, events: string[], secret: string): Promise<WebhookRow> {
  const result = await pool.query<WebhookRow>(
    `INSERT INTO flowwatch_webhooks (id, url, events, secret) VALUES ($1, $2, $3, $4) RETURNING *`,
    [randomUUID(), url, events, secret]
  );
  return result.rows[0];
}

export async function findWebhooksForEvent(pool: Pool, event: string): Promise<WebhookRow[]> {
  const result = await pool.query<WebhookRow>(
    `SELECT * FROM flowwatch_webhooks WHERE enabled = true AND $1 = ANY(events)`,
    [event]
  );
  return result.rows;
}

export async function deleteWebhook(pool: Pool, id: string): Promise<void> {
  await pool.query(`DELETE FROM flowwatch_webhooks WHERE id = $1`, [id]);
}

export async function listWebhooks(pool: Pool): Promise<WebhookRow[]> {
  const result = await pool.query<WebhookRow>(`SELECT * FROM flowwatch_webhooks ORDER BY created_at DESC`);
  return result.rows;
}

export async function insertDelivery(pool: Pool, webhookId: string, event: string, payload: unknown): Promise<WebhookDeliveryRow> {
  const result = await pool.query<WebhookDeliveryRow>(
    `INSERT INTO flowwatch_webhook_deliveries (id, webhook_id, event, payload) VALUES ($1, $2, $3, $4::jsonb) RETURNING *`,
    [randomUUID(), webhookId, event, JSON.stringify(payload)]
  );
  return result.rows[0];
}

export async function updateDelivery(pool: Pool, id: string, status: "success" | "failed", responseStatus: number | null): Promise<void> {
  await pool.query(
    `UPDATE flowwatch_webhook_deliveries SET status = $2, response_status = $3, attempts = attempts + 1, last_attempted_at = now() WHERE id = $1`,
    [id, status, responseStatus]
  );
}
