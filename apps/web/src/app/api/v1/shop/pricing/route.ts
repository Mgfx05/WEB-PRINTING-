import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@erb/database/client";
import { createApiResponse, createApiError } from "@/lib/api/response";
import { ErrorCodes } from "@erb/types";

/**
 * GET /api/v1/shop/pricing — get pricing rules for shop
 * POST /api/v1/shop/pricing — upsert default pricing rules
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

  const pricingRules = await prisma.pricingRule.findMany({
    where: { shopId: shop.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(createApiResponse({ shopId: shop.id, pricingRules }));
}

export async function POST(req: NextRequest) {
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
    const {
      name = "Default Pricing",
      printerId = null,
      bwPricePerPage = 100,
      colorPricePerPage = 500,
      duplexDiscountPaise = 25,
      paperSizePricing = { A3: 200, A4: 0, A5: 0, LETTER: 0, LEGAL: 50 },
      qualityPricing = { HIGH: 100, NORMAL: 0, DRAFT: 0 },
      mediaPricing = { GLOSSY: 300, PHOTO: 500, PLAIN: 0, MATTE: 100 },
    } = body;

    // Find existing default or printer-specific rule
    const existingRule = await prisma.pricingRule.findFirst({
      where: {
        shopId: shop.id,
        printerId: printerId || null,
        isDefault: !printerId,
      },
    });

    let rule;
    if (existingRule) {
      rule = await prisma.pricingRule.update({
        where: { id: existingRule.id },
        data: {
          name: name.trim(),
          bwPricePerPage: Number(bwPricePerPage),
          colorPricePerPage: Number(colorPricePerPage),
          duplexDiscountPaise: Number(duplexDiscountPaise),
          paperSizePricing,
          qualityPricing,
          mediaPricing,
          updatedAt: new Date(),
        },
      });
    } else {
      rule = await prisma.pricingRule.create({
        data: {
          shopId: shop.id,
          printerId: printerId || null,
          name: name.trim(),
          isDefault: !printerId,
          bwPricePerPage: Number(bwPricePerPage),
          colorPricePerPage: Number(colorPricePerPage),
          duplexDiscountPaise: Number(duplexDiscountPaise),
          paperSizePricing,
          qualityPricing,
          mediaPricing,
        },
      });
    }

    return NextResponse.json(createApiResponse(rule));
  } catch (err) {
    console.error("[POST /api/v1/shop/pricing]", err);
    return NextResponse.json(
      createApiError(ErrorCodes.INTERNAL_ERROR, "Failed to save pricing rule"),
      { status: 500 }
    );
  }
}
