import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@erb/database/client";
import { createApiResponse, createApiError } from "@/lib/api/response";
import { ErrorCodes, ShopStatus } from "@erb/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/v1/admin/shops/[id] — Update shop status (Approve, Suspend, Activate)
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
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

  const { id: shopId } = await params;

  try {
    const body = await req.json();
    const { status } = body;

    if (
      status &&
      !["PENDING_APPROVAL", "ACTIVE", "SUSPENDED", "INACTIVE"].includes(status)
    ) {
      return NextResponse.json(
        createApiError(ErrorCodes.VALIDATION_ERROR, "Invalid shop status"),
        { status: 400 }
      );
    }

    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: {
        ...(status ? { status: status as ShopStatus } : {}),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(createApiResponse(updatedShop));
  } catch (err) {
    console.error("[PATCH /api/v1/admin/shops/:id]", err);
    return NextResponse.json(
      createApiError(ErrorCodes.INTERNAL_ERROR, "Failed to update shop"),
      { status: 500 }
    );
  }
}
