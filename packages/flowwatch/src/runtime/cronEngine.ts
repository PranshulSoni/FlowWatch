import { Queue, Worker } from "bullmq";
import type { CaptureErrorFunction } from "../engine/errors/errorEngine.js";
import { logger } from "../logger.js";

export type CronHandler = () => Promise<void>;
export type RegisterCron = (name: string, pattern: string, handler: CronHandler) => void;

export interface CronEngine {
  cron: RegisterCron;
  close: () => Promise<void>;
}

export function createCronEngine(redisUrl: string, captureError: CaptureErrorFunction): CronEngine {
  const handlers = new Map<string, CronHandler>();
  const connection = { url: redisUrl, skipVersionCheck: true };

  const queue = new Queue("flowwatch-cron", { prefix: "{flowwatch}", connection });

  const worker = new Worker(
    "flowwatch-cron",
    async (job) => {
      const handler = handlers.get(job.name);
      if (handler) {
        await handler();
      }
    },
    { prefix: "{flowwatch}", connection }
  );

  worker.on("failed", (job, err) => {
    if (!job) return;
    captureError(err, {
      source: "background_worker",
      category: "server",
      level: "error",
      statusCode: 500,
      metadata: { cronJob: job.name }
    }).catch(() => {});
  });

  return {
    cron(name, pattern, handler) {
      handlers.set(name, handler);
      queue.add(name, {}, { repeat: { pattern } }).catch((err) =>
        logger.error({ err, cronJob: name }, "Failed to schedule cron job")
      );
    },
    close: async () => {
      await worker.close();
      await queue.close();
    }
  };
}
