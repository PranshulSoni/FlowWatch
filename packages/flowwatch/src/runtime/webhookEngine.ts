import { Queue, Worker } from "bullmq";
import { createHmac, randomBytes } from "node:crypto";
import type { Pool } from "pg";
import type { CaptureErrorFunction } from "../engine/errors/errorEngine.js";
import {
  insertWebhook,
  findWebhooksForEvent,
  deleteWebhook,
  listWebhooks,
  insertDelivery,
  updateDelivery,
  type WebhookRow
} from "../persistence/repositories/webhooks/webhookRepository.js";

export interface WebhookEngine {
  register: (url: string, events: string[], secret?: string) => Promise<{ id: string; secret: string }>;
  deliver: (event: string, payload: unknown) => Promise<void>;
  remove: (id: string) => Promise<void>;
  list: () => Promise<WebhookRow[]>;
  close: () => Promise<void>;
}

interface WebhookJobData {
  deliveryId: string;
  url: string;
  secret: string;
  event: string;
  payload: unknown;
}

function sign(secret: string, payload: unknown): string {
  return "sha256=" + createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
}

async function deliverWebhook(pool: Pool, job: WebhookJobData): Promise<void> {
  const { deliveryId, url, secret, event, payload } = job;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Flowwatch-Event": event,
      "X-Flowwatch-Signature": sign(secret, payload),
    },
    body: JSON.stringify({ event, payload }),
  });
  await updateDelivery(pool, deliveryId, response.ok ? "success" : "failed", response.status);
  if (!response.ok) throw new Error(`Webhook delivery failed: ${response.status}`);
}

export function createWebhookEngine(
  pool: Pool,
  redisUrl: string,
  captureError: CaptureErrorFunction
): WebhookEngine {
  const connection = { url: redisUrl, skipVersionCheck: true };
  const queue = new Queue<WebhookJobData>("flowwatch-webhooks", { prefix: "{flowwatch}", connection });

  const worker = new Worker<WebhookJobData>(
    "flowwatch-webhooks",
    (job) => deliverWebhook(pool, job.data),
    { prefix: "{flowwatch}", connection }
  );

  worker.on("failed", (job, err) => {
    if (!job) return;
    captureError(err, {
      source: "background_worker",
      category: "server",
      level: "error",
      statusCode: 500,
      metadata: { webhookUrl: job.data.url, event: job.data.event }
    }).catch(() => {});
  });

  return {
    async register(url, events, secret) {
      const webhookSecret = secret ?? randomBytes(32).toString("hex");
      const webhook = await insertWebhook(pool, url, events, webhookSecret);
      return { id: webhook.id, secret: webhookSecret };
    },

    async deliver(event, payload) {
      const webhooks = await findWebhooksForEvent(pool, event);
      await Promise.all(webhooks.map(async (webhook) => {
        const delivery = await insertDelivery(pool, webhook.id, event, payload);
        await queue.add("deliver", {
          deliveryId: delivery.id,
          url: webhook.url,
          secret: webhook.secret,
          event,
          payload
        }, {
          attempts: 5,
          backoff: { type: "exponential", delay: 5_000 }
        });
      }));
    },

    remove: (id) => deleteWebhook(pool, id),
    list: () => listWebhooks(pool),

    close: async () => {
      await worker.close();
      await queue.close();
    }
  };
}
