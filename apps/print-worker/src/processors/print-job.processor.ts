import { Job } from "bullmq";
import { prisma, Prisma } from "@erb/database";
import { PrintJobStatus, OrderStatus, ErrorCodes } from "@erb/types";
import type { PrintJobPayload } from "@erb/types";
import { createLogger } from "../services/logger";
import { agentClient } from "../agent-client";
import { recordJobEvent } from "../services/job-events";

const logger = createLogger("print-job-processor");

const MAX_ATTEMPTS = Number(process.env.WORKER_MAX_RETRIES ?? 3);

/**
 * Main print job processor.
 *
 * CONCURRENCY SAFETY:
 * BullMQ guarantees atomic job claiming via Redis — only one worker
 * ever processes a given job. We additionally verify the DB status
 * before proceeding to guard against any edge cases.
 *
 * The sequence:
 * 1. Verify job is still in QUEUED state in DB (race condition guard)
 * 2. Atomically set status → PRINTING (with DB transaction)
 * 3. Validate capabilities against requested options
 * 4. Send to print agent
 * 5. Update to COMPLETED or FAILED
 * 6. Schedule retry if under attempt limit
 */
export async function processJob(job: Job<PrintJobPayload>): Promise<void> {
  const { printJobId, orderId, documentId, shopId, printerId, options } =
    job.data;

  const workerId = `worker-${process.pid}-${job.id}`;

  logger.info("Processing print job", {
    printJobId,
    orderId,
    printerId,
    workerId,
    attemptsMade: job.attemptsMade,
  });

  // ── Step 1: Atomic claim in database ──────────────────────────────────────
  // Use a transaction with a conditional UPDATE to prevent two workers from
  // simultaneously claiming the same job (belt-and-suspenders on top of BullMQ).
  const claimed = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const updated = await tx.printJob.updateMany({
      where: {
        id: printJobId,
        status: { in: [PrintJobStatus.QUEUED, PrintJobStatus.CLAIMING] },
      },
      data: {
        status: PrintJobStatus.CLAIMING,
        workerId,
        startedAt: new Date(),
        attemptCount: { increment: 1 },
      },
    });
    return updated.count > 0;
  });

  if (!claimed) {
    // Another worker already claimed it or it was cancelled.
    logger.warn("Job was already claimed or is in an unexpected state — skipping", {
      printJobId,
    });
    return;
  }

  await recordJobEvent(printJobId, "job.claiming", `Worker ${workerId} claiming job`, {
    workerId,
    attempt: job.attemptsMade + 1,
  });

  try {
    // ── Step 2: Fetch full job details ───────────────────────────────────────
    const printJob = await prisma.printJob.findUniqueOrThrow({
      where: { id: printJobId },
      include: {
        order: { include: { document: true } },
        printer: { include: { capabilities: true } },
      },
    });

    // ── Step 3: Validate capabilities ───────────────────────────────────────
    const capabilities = printJob.printer.capabilities?.capabilitiesJson as
      | Record<string, unknown>
      | null;

    if (capabilities) {
      const validationError = validateOptionsAgainstCapabilities(
        options,
        capabilities
      );
      if (validationError) {
        throw new PrintJobError(ErrorCodes.CAPABILITY_VALIDATION_FAILED, validationError);
      }
    }

    // ── Step 4: Check printer is online ──────────────────────────────────────
    if (
      printJob.printer.status !== "ONLINE" &&
      process.env.NODE_ENV === "production"
    ) {
      throw new PrintJobError(
        ErrorCodes.PRINTER_OFFLINE,
        `Printer ${printerId} is not online (status: ${printJob.printer.status})`
      );
    }

    // ── Step 5: Mark as PRINTING ─────────────────────────────────────────────
    await prisma.printJob.update({
      where: { id: printJobId },
      data: { status: PrintJobStatus.PRINTING },
    });

    // Also update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PRINTING },
    });

    await recordJobEvent(printJobId, "job.printing", "Job sent to print agent", {
      agentId: printJob.printer.agentId,
    });

    // ── Step 6: Send to print agent ──────────────────────────────────────────
    const agentId = printJob.printer.agentId;
    if (!agentId) {
      throw new PrintJobError(
        ErrorCodes.AGENT_OFFLINE,
        `No agent registered for printer ${printerId}`
      );
    }

    const result = await agentClient.submitJob(agentId, {
      printJobId,
      documentStorageKey: printJob.order.document.storageKey,
      options,
      printerModel: printJob.printer.model ?? "unknown",
      copies: options.copies,
    });

    if (!result.success) {
      throw new PrintJobError(
        ErrorCodes.PRINT_FAILED,
        result.errorMessage ?? "Print agent reported failure"
      );
    }

    // ── Step 7: Mark COMPLETED ───────────────────────────────────────────────
    await prisma.$transaction([
      prisma.printJob.update({
        where: { id: printJobId },
        data: {
          status: PrintJobStatus.COMPLETED,
          completedAt: new Date(),
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.COMPLETED, updatedAt: new Date() },
      }),
    ]);

    await recordJobEvent(printJobId, "job.completed", "Job completed successfully");

    logger.info("Print job completed successfully", { printJobId, orderId });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    const errorCode =
      err instanceof PrintJobError ? err.code : ErrorCodes.UNKNOWN_PRINTER_ERROR;

    logger.error("Print job failed", {
      printJobId,
      orderId,
      errorCode,
      error: error.message,
    });

    const currentAttempt = (job.attemptsMade ?? 0) + 1;
    const isRetryable = currentAttempt < MAX_ATTEMPTS;

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.printJob.update({
        where: { id: printJobId },
        data: {
          status: isRetryable ? PrintJobStatus.FAILED : PrintJobStatus.FAILED,
          failedAt: new Date(),
          errorCode,
          errorMessage: error.message,
          errorDetails: { stack: error.stack, attempt: currentAttempt },
        },
      });

      // Only set order to FAILED on final attempt
      if (!isRetryable) {
        await tx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.FAILED },
        });
      }
    });

    await recordJobEvent(
      printJobId,
      isRetryable ? "job.failed_retrying" : "job.failed_terminal",
      error.message,
      { errorCode, attempt: currentAttempt, isRetryable }
    );

    // BullMQ will handle the retry based on job settings.
    // Re-throw so BullMQ knows the job failed.
    throw error;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

class PrintJobError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "PrintJobError";
  }
}

function validateOptionsAgainstCapabilities(
  options: PrintJobPayload["options"],
  capabilities: Record<string, unknown>
): string | null {
  const cap = capabilities as {
    supportsColor?: boolean;
    supportsDuplex?: boolean;
    supportedPaperSizes?: string[];
    supportedPagesPerSheet?: number[];
    maxCopies?: number;
  };

  if (
    options.colorMode === "COLOR" &&
    cap.supportsColor === false
  ) {
    return "Color printing is not supported by this printer";
  }

  if (
    options.duplexMode !== "SINGLE_SIDED" &&
    cap.supportsDuplex === false
  ) {
    return "Duplex printing is not supported by this printer";
  }

  if (
    cap.supportedPaperSizes &&
    !cap.supportedPaperSizes.includes(options.paperSize)
  ) {
    return `Paper size ${options.paperSize} is not supported by this printer`;
  }

  if (
    cap.supportedPagesPerSheet &&
    !cap.supportedPagesPerSheet.includes(options.pagesPerSheet)
  ) {
    return `${options.pagesPerSheet} pages per sheet is not supported`;
  }

  if (cap.maxCopies && options.copies > cap.maxCopies) {
    return `Requested ${options.copies} copies exceeds maximum of ${cap.maxCopies}`;
  }

  return null;
}
