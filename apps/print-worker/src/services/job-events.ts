import { prisma, Prisma } from "@erb/database";

/**
 * Records an immutable event in the print_job_events table.
 * Called at every significant step of a job's lifecycle.
 */
export async function recordJobEvent(
  printJobId: string,
  eventType: string,
  message?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await prisma.printJobEvent.create({
    data: {
      printJobId,
      eventType,
      message,
      metadata: (metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}
