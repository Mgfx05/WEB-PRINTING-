import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@erb/database/client";
import { createApiResponse, createApiError } from "@/lib/api/response";
import { ErrorCodes, UserRole } from "@erb/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/v1/admin/users/[id] — update user role or status
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

  const { id: userId } = await params;

  try {
    const body = await req.json();
    const { role } = body;

    if (role && !["CUSTOMER", "SHOP_OWNER", "ADMIN"].includes(role)) {
      return NextResponse.json(
        createApiError(ErrorCodes.VALIDATION_ERROR, "Invalid role value"),
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(role ? { role: role as UserRole } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(createApiResponse(updatedUser));
  } catch (err) {
    console.error("[PATCH /api/v1/admin/users/:id]", err);
    return NextResponse.json(
      createApiError(ErrorCodes.INTERNAL_ERROR, "Failed to update user"),
      { status: 500 }
    );
  }
}
