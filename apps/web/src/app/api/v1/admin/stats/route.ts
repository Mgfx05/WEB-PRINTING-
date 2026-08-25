import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@erb/database/client";
import { createApiResponse, createApiError } from "@/lib/api/response";
import { ErrorCodes } from "@erb/types";

/**
 * GET /api/v1/admin/stats
 * Returns platform-wide statistics for administrators.
 */
export async function GET() {
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

  const [
    totalUsers,
    totalShops,
    activeShops,
    pendingShops,
    totalPrinters,
    onlinePrinters,
    totalOrders,
    completedOrders,
    activeOrders,
    revenueResult,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.shop.count(),
    prisma.shop.count({ where: { status: "ACTIVE" } }),
    prisma.shop.count({ where: { status: "PENDING_APPROVAL" } }),
    prisma.printer.count({ where: { isEnabled: true } }),
    prisma.printer.count({ where: { isEnabled: true, status: "ONLINE" } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "COMPLETED" } }),
    prisma.order.count({
      where: {
        status: { in: ["CREATED", "UPLOADED", "WAITING_FOR_SHOP", "ACCEPTED", "QUEUED", "PRINTING"] },
      },
    }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: "COMPLETED" },
    }),
  ]);

  return NextResponse.json(
    createApiResponse({
      totalUsers,
      totalShops,
      activeShops,
      pendingShops,
      totalPrinters,
      onlinePrinters,
      totalOrders,
      completedOrders,
      activeOrders,
      totalRevenueRupees: Number(revenueResult._sum.totalAmount || 0),
    })
  );
}
