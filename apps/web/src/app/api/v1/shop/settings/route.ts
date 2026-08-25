import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@erb/database/client";
import { createApiResponse, createApiError } from "@/lib/api/response";
import { ErrorCodes } from "@erb/types";

/**
 * GET /api/v1/shop/settings — get shop profile
 * PATCH /api/v1/shop/settings — update shop details
 */

export async function GET() {
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
      createApiError(ErrorCodes.NOT_FOUND, "Shop not found"),
      { status: 404 }
    );
  }

  return NextResponse.json(createApiResponse(shop));
}

export async function PATCH(req: NextRequest) {
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
      createApiError(ErrorCodes.NOT_FOUND, "Shop not found"),
      { status: 404 }
    );
  }

  try {
    const body = await req.json();
    const { name, description, address, city, state, postalCode, phone, email } = body;

    const updatedShop = await prisma.shop.update({
      where: { id: shop.id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() } : {}),
        ...(address !== undefined ? { address: address.trim() } : {}),
        ...(city !== undefined ? { city: city?.trim() } : {}),
        ...(state !== undefined ? { state: state?.trim() } : {}),
        ...(postalCode !== undefined ? { postalCode: postalCode?.trim() } : {}),
        ...(phone !== undefined ? { phone: phone?.trim() } : {}),
        ...(email !== undefined ? { email: email?.trim() } : {}),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(createApiResponse(updatedShop));
  } catch (err) {
    console.error("[PATCH /api/v1/shop/settings]", err);
    return NextResponse.json(
      createApiError(ErrorCodes.INTERNAL_ERROR, "Failed to update shop settings"),
      { status: 500 }
    );
  }
}
