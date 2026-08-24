import "dotenv/config";
import { Worker, Job } from "bullmq";
import { createLogger } from "./services/logger";
import { processJob } from "./processors/print-job.processor";
import { redisConnection } from "./services/redis";
import type { PrintJobPayload } from "@erb/types";

const logger = createLogger("worker");

const QUEUE_NAME = "print-jobs";
const CONCURRENCY = Number(process.env.WORKER_CONCURRENCY ?? 2);

async function main() {
  logger.info("ERB Print Worker starting", {
    queueName: QUEUE_NAME,
    concurrency: CONCURRENCY,
    nodeEnv: process.env.NODE_ENV,
  });

  const worker = new Worker<PrintJobPayload>(
    QUEUE_NAME,
    async (job: Job<PrintJobPayload>) => {
      return processJob(job);
    },
    {
      connection: redisConnection,
      concurrency: CONCURRENCY,
      // BullMQ handles atomic claiming — only one worker can claim a job at a time.
      // The lock expires after 30s; the worker renews it every 15s while active.
      lockDuration: 30000,
      lockRenewTime: 15000,
    }
  );

  worker.on("completed", (job) => {
    logger.info("Job completed", {
      jobId: job.id,
      printJobId: job.data.printJobId,
      orderId: job.data.orderId,
    });
  });

  worker.on("failed", (job, error) => {
    logger.error("Job failed", {
      jobId: job?.id,
      printJobId: job?.data?.printJobId,
      orderId: job?.data?.orderId,
      error: error.message,
      stack: error.stack,
    });
  });

  worker.on("error", (error) => {
    logger.error("Worker error", { error: error.message, stack: error.stack });
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    await worker.close();
    logger.info("Worker shut down cleanly");
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  logger.info("ERB Print Worker running and waiting for jobs");
}

main().catch((err) => {
  console.error("Fatal worker error:", err);
  process.exit(1);
});
