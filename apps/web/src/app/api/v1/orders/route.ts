import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@erb/database/client";
import type { Prisma } from "@prisma/client";
import { CreateOrderSchema } from "@erb/validation";
import { createApiResponse, createApiError } from "@/lib/api/response";
import { OrderStatus, PrintJobStatus, ErrorCodes } from "@erb/types";
import { pricingEngine } from "@/lib/pricing/pricing.engine";
import { nanoid } from "nanoid";
import type { PrintOptions } from "@erb/types";

/**
 * POST /api/v1/orders
 *
 * Creates a new order and its associated print job atomically.
 * Uses DB transaction to ensure both are created or neither is.
 *
 * IDEMPOTENCY: Uses idempotencyKey to prevent double-submission.
 * If the same key is submitted twice, the existing order is returned.
 *
 * CONCURRENCY SAFETY:
 * - Each order gets a unique UUID
 * - Each print job gets a unique UUID
 * - Storage key was already assigned at upload time
 * - No shared mutable state
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      createApiError(ErrorCodes.UNAUTHORIZED, "Authentication required"),
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const parsed = CreateOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        createApiError(ErrorCodes.VALIDATION_ERROR, "Invalid order data", {
          issues: parsed.error.flatten(),
        }),
        { status: 400 }
      );
    }

    const { shopId, printerId, documentId, options, idempotencyKey } =
      parsed.data;

    // ── Idempotency check ─────────────────────────────────────────────────
    const existing = await prisma.order.findUnique({
      where: { idempotencyKey },
      select: {
        id: true,
        publicOrderNumber: true,
        status: true,
        totalAmount: true,
        createdAt: true,
      },
    });

    if (existing) {
      return NextResponse.json(createApiResponse(existing));
    }

    // ── Validate document belongs to user ────────────────────────────────
    const document = await prisma.document.findFirst({
      where: { id: documentId, userId: session.user.id },
    });

    if (!document) {
      return NextResponse.json(
        createApiError(ErrorCodes.NOT_FOUND, "Document not found"),
        { status: 404 }
      );
    }

    // ── Validate shop is active ──────────────────────────────────────────
    const shop = await prisma.shop.findFirst({
      where: { id: shopId, status: "ACTIVE" },
    });

    if (!shop) {
      return NextResponse.json(
        createApiError(ErrorCodes.SHOP_UNAVAILABLE, "Shop is not available"),
        { status: 422 }
      );
    }

    // ── Validate printer is online and belongs to shop ───────────────────
    const printer = await prisma.printer.findFirst({
      where: { id: printerId, shopId, isEnabled: true },
      include: { capabilities: true },
    });

    if (!printer) {
      return NextResponse.json(
        createApiError(ErrorCodes.PRINTER_NOT_FOUND, "Printer not found"),
        { status: 404 }
      );
    }

    if (printer.status !== "ONLINE" && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        createApiError(
          ErrorCodes.PRINTER_OFFLINE,
          "The selected printer is currently offline"
        ),
        { status: 422 }
      );
    }

    // ── Validate print options against capabilities ──────────────────────
    if (printer.capabilities) {
      const cap = printer.capabilities.capabilitiesJson as Record<
        string,
        unknown
      > & {
        supportsColor?: boolean;
        supportsDuplex?: boolean;
        supportedPaperSizes?: string[];
      };

      if (options.colorMode === "COLOR" && cap.supportsColor === false) {
        return NextResponse.json(
          createApiError(
            ErrorCodes.UNSUPPORTED_OPTION,
            "Color printing is not supported by this printer"
          ),
          { status: 422 }
        );
      }

      if (
        options.duplexMode !== "SINGLE_SIDED" &&
        cap.supportsDuplex === false
      ) {
        return NextResponse.json(
          createApiError(
            ErrorCodes.UNSUPPORTED_OPTION,
            "Duplex printing is not supported by this printer"
          ),
          { status: 422 }
        );
      }

      if (
        cap.supportedPaperSizes &&
        !cap.supportedPaperSizes.includes(options.paperSize)
      ) {
        return NextResponse.json(
          createApiError(
            ErrorCodes.UNSUPPORTED_OPTION,
            `Paper size ${options.paperSize} is not supported by this printer`
          ),
          { status: 422 }
        );
      }
    }

    // ── Calculate authoritative price ────────────────────────────────────
    const priceBreakdown = await pricingEngine.calculatePrice(
      shopId,
      printerId,
      documentId,
      options as PrintOptions
    );

    // ── Create order + print job atomically ──────────────────────────────
    const publicOrderNumber = `ERB-${nanoid(6).toUpperCase()}`;

    const { order, printJob } = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const order = await tx.order.create({
        data: {
          publicOrderNumber,
          userId: session.user.id,
          shopId,
          documentId,
          status: OrderStatus.WAITING_FOR_SHOP,
          totalAmount: priceBreakdown.total,
          currency: "INR",
          priceBreakdown: priceBreakdown as object,
          idempotencyKey,
        },
      });

      const printJob = await tx.printJob.create({
        data: {
          orderId: order.id,
          printerId,
          status: PrintJobStatus.QUEUED,
          requestedOptions: options as object,
          priority: 0,
          attemptCount: 0,
        },
      });

      // Immutable event log
      await tx.printJobEvent.create({
        data: {
          printJobId: printJob.id,
          eventType: "job.created",
          message: "Print job created, waiting for shop acceptance",
          metadata: { orderId: order.id, publicOrderNumber },
        },
      });

      return { order, printJob };
    });

    return NextResponse.json(
      createApiResponse({
        orderId: order.id,
        publicOrderNumber: order.publicOrderNumber,
        printJobId: printJob.id,
        status: order.status,
        totalAmount: order.totalAmount,
        priceBreakdown,
        currency: "INR",
        createdAt: order.createdAt,
      }),
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/v1/orders]", err);
    return NextResponse.json(
      createApiError(ErrorCodes.INTERNAL_ERROR, "Failed to create order"),
      { status: 500 }
    );
  }
}

// GET /api/v1/orders — list customer's orders
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      createApiError(ErrorCodes.UNAUTHORIZED, "Authentication required"),
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        shop: { select: { id: true, name: true } },
        document: {
          select: { id: true, originalFilename: true, pageCount: true },
        },
        printJobs: {
          select: { id: true, status: true, attemptCount: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json(
    createApiResponse({
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  );
}
