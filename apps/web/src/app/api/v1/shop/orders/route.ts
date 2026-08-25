import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@erb/database/client";
import { createApiResponse, createApiError } from "@/lib/api/response";
import { ErrorCodes, OrderStatus } from "@erb/types";

/**
 * GET /api/v1/shop/orders
 * Returns all orders received by the authenticated shop owner's shop.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      createApiError(ErrorCodes.UNAUTHORIZED, "Authentication required"),
      { status: 401 }
    );
  }

  const role = session.user.role;
  if (role !== "SHOP_OWNER" && role !== "ADMIN") {
    return NextResponse.json(
      createApiError(ErrorCodes.FORBIDDEN, "Shop owner access required"),
      { status: 403 }
    );
  }

  const shop = await prisma.shop.findFirst({
    where: { ownerId: session.user.id },
  });

  if (!shop) {
    return NextResponse.json(
      createApiError(ErrorCodes.NOT_FOUND, "Shop not found for this account"),
      { status: 404 }
    );
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

  const where = {
    shopId: shop.id,
    ...(statusParam && statusParam !== "ALL"
      ? { status: statusParam as OrderStatus }
      : {}),
  };

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        document: {
          select: {
            id: true,
            originalFilename: true,
            pageCount: true,
            sizeBytes: true,
            storageKey: true,
          },
        },
        printJobs: {
          include: {
            printer: { select: { id: true, name: true, model: true } },
            events: {
              orderBy: { createdAt: "desc" },
              take: 3,
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json(
    createApiResponse({
      shopId: shop.id,
      shopName: shop.name,
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  );
}
