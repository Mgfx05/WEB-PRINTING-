import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@erb/database/client";
import type { Prisma } from "@prisma/client";
import { createApiResponse, createApiError } from "@/lib/api/response";
import { OrderStatus, ErrorCodes } from "@erb/types";
import { enqueuePrintJob } from "@/lib/queue/producer";

/**
 * GET /api/v1/orders/[id] — get order details
 * PATCH /api/v1/orders/[id] — update order state (accept, reject, cancel)
 */

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      createApiError(ErrorCodes.UNAUTHORIZED, "Authentication required"),
      { status: 401 }
    );
  }

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      shop: { select: { id: true, name: true, address: true, phone: true } },
      document: {
        select: {
          id: true,
          originalFilename: true,
          pageCount: true,
          sizeBytes: true,
        },
      },
      printJobs: {
        include: {
          printer: { select: { id: true, name: true, model: true } },
          events: {
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) {
    return NextResponse.json(
      createApiError(ErrorCodes.ORDER_NOT_FOUND, "Order not found"),
      { status: 404 }
    );
  }

  // Customers can only see their own orders
  // Shop owners can see orders for their shop
  // Admins can see all
  const role = session.user.role;
  if (
    role === "CUSTOMER" &&
    order.userId !== session.user.id
  ) {
    return NextResponse.json(
      createApiError(ErrorCodes.FORBIDDEN, "Access denied"),
      { status: 403 }
    );
  }

  if (role === "SHOP_OWNER") {
    const shop = await prisma.shop.findFirst({
      where: { id: order.shopId, ownerId: session.user.id },
    });
    if (!shop) {
      return NextResponse.json(
        createApiError(ErrorCodes.FORBIDDEN, "Access denied"),
        { status: 403 }
      );
    }
  }

  return NextResponse.json(
    createApiResponse({
      ...order,
      printJobs: order.printJobs.map((job: typeof order.printJobs[number]) => ({
        ...job,
      })),
    })
  );
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      createApiError(ErrorCodes.UNAUTHORIZED, "Authentication required"),
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await req.json();
  const { action } = body as { action: "accept" | "reject" | "cancel" };

  const order = await prisma.order.findUnique({
    where: { id },
    include: { printJobs: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!order) {
    return NextResponse.json(
      createApiError(ErrorCodes.ORDER_NOT_FOUND, "Order not found"),
      { status: 404 }
    );
  }

  const role = session.user.role;

  switch (action) {
    case "accept": {
      // Only shop owners can accept
      if (role !== "SHOP_OWNER" && role !== "ADMIN") {
        return NextResponse.json(
          createApiError(ErrorCodes.FORBIDDEN, "Only shop owners can accept orders"),
          { status: 403 }
        );
      }

      if (order.status !== OrderStatus.WAITING_FOR_SHOP) {
        return NextResponse.json(
          createApiError(
            ErrorCodes.INVALID_STATE_TRANSITION,
            `Order cannot be accepted from status ${order.status}`
          ),
          { status: 422 }
        );
      }

      const printJob = order.printJobs[0];
      if (!printJob) {
        return NextResponse.json(
          createApiError(ErrorCodes.INTERNAL_ERROR, "No print job found"),
          { status: 500 }
        );
      }

      // Accept order → Queue the print job
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.order.update({
          where: { id },
          data: { status: OrderStatus.QUEUED },
        });

        await tx.printJob.update({
          where: { id: printJob.id },
          data: { status: "QUEUED", queuedAt: new Date() },
        });

        await tx.printJobEvent.create({
          data: {
            printJobId: printJob.id,
            eventType: "job.accepted",
            message: "Order accepted by shop, job queued for printing",
            metadata: { acceptedBy: session.user.id },
          },
        });
      });

      // Enqueue in BullMQ — this is separate from the DB transaction
      // (if enqueue fails, the job is still in DB with QUEUED status
      //  and can be re-enqueued manually)
      await enqueuePrintJob({
        printJobId: printJob.id,
        orderId: order.id,
        documentId: order.documentId,
        shopId: order.shopId,
        printerId: printJob.printerId,
        options: printJob.requestedOptions as unknown as Parameters<typeof enqueuePrintJob>[0]["options"],
        attemptCount: 0,
      });

      return NextResponse.json(
        createApiResponse({ status: OrderStatus.QUEUED, message: "Order accepted and queued" })
      );
    }

    case "reject": {
      if (role !== "SHOP_OWNER" && role !== "ADMIN") {
        return NextResponse.json(
          createApiError(ErrorCodes.FORBIDDEN, "Only shop owners can reject orders"),
          { status: 403 }
        );
      }

      if (order.status !== OrderStatus.WAITING_FOR_SHOP) {
        return NextResponse.json(
          createApiError(
            ErrorCodes.INVALID_STATE_TRANSITION,
            `Order cannot be rejected from status ${order.status}`
          ),
          { status: 422 }
        );
      }

      await prisma.order.update({
        where: { id },
        data: { status: OrderStatus.REJECTED },
      });

      return NextResponse.json(
        createApiResponse({ status: OrderStatus.REJECTED })
      );
    }

    case "cancel": {
      const cancellableStatuses: OrderStatus[] = [
        OrderStatus.CREATED,
        OrderStatus.UPLOADED,
        OrderStatus.WAITING_FOR_SHOP,
        OrderStatus.ACCEPTED,
      ];

      // Customers can only cancel their own orders
      if (role === "CUSTOMER" && order.userId !== session.user.id) {
        return NextResponse.json(
          createApiError(ErrorCodes.FORBIDDEN, "Access denied"),
          { status: 403 }
        );
      }

      if (!cancellableStatuses.includes(order.status as OrderStatus)) {
        return NextResponse.json(
          createApiError(
            ErrorCodes.ORDER_CANNOT_BE_CANCELLED,
            `Order in ${order.status} status cannot be cancelled`
          ),
          { status: 422 }
        );
      }

      await prisma.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED },
      });

      return NextResponse.json(
        createApiResponse({ status: OrderStatus.CANCELLED })
      );
    }

    default:
      return NextResponse.json(
        createApiError(ErrorCodes.VALIDATION_ERROR, "Unknown action"),
        { status: 400 }
      );
  }
}
