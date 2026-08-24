import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@erb/database/client";

/**
 * GET /api/v1/orders/[id]/events
 *
 * Server-Sent Events stream for real-time order status updates.
 *
 * The client subscribes once and receives push events as the order
 * progresses through the state machine.
 *
 * Events:
 * - order.status_changed
 * - print_job.status_changed
 * - heartbeat (every 30s to keep connection alive)
 */

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  // Verify access to this order
  const order = await prisma.order.findUnique({
    where: { id },
    select: { userId: true, shopId: true, status: true },
  });

  if (!order) return new Response("Not found", { status: 404 });

  const role = session.user.role;
  if (role === "CUSTOMER" && order.userId !== session.user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  // Set up SSE stream
  const encoder = new TextEncoder();
  let pollInterval: NodeJS.Timeout;
  let heartbeatInterval: NodeJS.Timeout;

  const stream = new ReadableStream({
    start(controller) {
      const send = (eventType: string, data: object) => {
        const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      let lastStatus = order.status;
      let lastJobStatus: string | null = null;

      // Poll DB every 2 seconds for status changes
      // In a production system, this would be replaced by Redis pub/sub
      pollInterval = setInterval(async () => {
        try {
          const current = await prisma.order.findUnique({
            where: { id },
            select: {
              status: true,
              updatedAt: true,
              printJobs: {
                select: { status: true, errorMessage: true },
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          });

          if (!current) return;

          if (current.status !== lastStatus) {
            send("order.status_changed", {
              orderId: id,
              status: current.status,
              timestamp: new Date().toISOString(),
            });
            lastStatus = current.status;

            // Close stream on terminal states
            const terminalStates = ["COMPLETED", "FAILED", "CANCELLED", "REJECTED"];
            if (terminalStates.includes(current.status)) {
              clearInterval(pollInterval);
              clearInterval(heartbeatInterval);
              controller.close();
              return;
            }
          }

          const jobStatus = current.printJobs[0]?.status ?? null;
          if (jobStatus && jobStatus !== lastJobStatus) {
            send("print_job.status_changed", {
              orderId: id,
              jobStatus,
              errorMessage: current.printJobs[0]?.errorMessage ?? null,
              timestamp: new Date().toISOString(),
            });
            lastJobStatus = jobStatus;
          }
        } catch {
          // Silently continue on transient DB errors
        }
      }, 2000);

      // Heartbeat every 30 seconds to keep connection alive
      heartbeatInterval = setInterval(() => {
        send("heartbeat", { timestamp: new Date().toISOString() });
      }, 30000);

      // Send initial state
      send("order.status_changed", {
        orderId: id,
        status: order.status,
        timestamp: new Date().toISOString(),
      });
    },

    cancel() {
      clearInterval(pollInterval);
      clearInterval(heartbeatInterval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
