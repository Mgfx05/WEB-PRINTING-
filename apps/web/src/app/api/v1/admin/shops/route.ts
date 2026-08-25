import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@erb/database/client";
import { createApiResponse, createApiError } from "@/lib/api/response";
import { ErrorCodes, ShopStatus } from "@erb/types";

/**
 * GET /api/v1/admin/shops — List all shops with owner & printer metrics
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      createApiError(ErrorCodes.UNAUTHORIZED, "Authentication required"),
      { status: 401 }
    );
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      createApiError(ErrorCodes.FORBIDDEN, "Admin privileges required"),
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const query = searchParams.get("q");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));

  const where = {
    ...(status && status !== "ALL" ? { status: status as ShopStatus } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { city: { contains: query, mode: "insensitive" as const } },
            { address: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [shops, total] = await prisma.$transaction([
    prisma.shop.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        printers: {
          select: { id: true, name: true, status: true, isEnabled: true },
        },
        _count: {
          select: { orders: true, printers: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.shop.count({ where }),
  ]);

  return NextResponse.json(
    createApiResponse({
      shops: shops.map((s) => ({
        ...s,
        totalOrdersCount: s._count.orders,
        totalPrintersCount: s._count.printers,
        onlinePrintersCount: s.printers.filter((p) => p.status === "ONLINE" && p.isEnabled).length,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  );
}
