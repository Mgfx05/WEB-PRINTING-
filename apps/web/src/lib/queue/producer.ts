import { Queue } from "bullmq";
import IORedis from "ioredis";
import type { PrintJobPayload } from "@erb/types";

// Singleton Redis connection for BullMQ producer
const redisConnection = new IORedis(
  process.env.REDIS_URL ?? "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  }
);

// Singleton queue instance (reused across hot-reloads in dev)
const globalForQueue = globalThis as unknown as {
  printJobQueue: Queue<PrintJobPayload> | undefined;
};

export const printJobQueue: Queue<PrintJobPayload> =
  globalForQueue.printJobQueue ??
  new Queue<PrintJobPayload>("print-jobs", {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: Number(process.env.WORKER_MAX_RETRIES ?? 3),
      backoff: {
        type: "exponential",
        delay: Number(process.env.WORKER_RETRY_DELAY_MS ?? 5000),
      },
      removeOnComplete: { count: 1000 }, // Keep last 1000 completed
      removeOnFail: { count: 5000 },     // Keep last 5000 failed for inspection
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForQueue.printJobQueue = printJobQueue;
}

/**
 * Enqueues a print job into the BullMQ queue.
 *
 * The job ID in BullMQ matches the printJobId from the database
 * to make correlation trivial.
 *
 * Priority: higher number = processed sooner.
 */
export async function enqueuePrintJob(
  payload: PrintJobPayload,
  priority: number = 0
): Promise<void> {
  await printJobQueue.add(
    `print-job-${payload.printJobId}`,
    payload,
    {
      jobId: `print-job-${payload.printJobId}`, // stable, deduplication key
      priority,
    }
  );
}
