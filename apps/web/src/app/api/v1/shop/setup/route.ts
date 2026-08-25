import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@erb/database/client";
import { createApiResponse, createApiError } from "@/lib/api/response";
import { ErrorCodes } from "@erb/types";

/**
 * POST /api/v1/shop/setup — Initial setup of a new shop by shop owner
 */
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

  // Check if shop already exists
  const existingShop = await prisma.shop.findFirst({
    where: { ownerId: session.user.id },
  });

  if (existingShop) {
    return NextResponse.json(createApiResponse(existingShop));
  }

  try {
    const body = await req.json();
    const { name, description, address, city, state, postalCode, phone, email } = body;

    if (!name || !address) {
      return NextResponse.json(
        createApiError(ErrorCodes.VALIDATION_ERROR, "Shop name and address are required"),
        { status: 400 }
      );
    }

    const shop = await prisma.$transaction(async (tx) => {
      const newShop = await tx.shop.create({
        data: {
          ownerId: session.user.id,
          name: name.trim(),
          description: description?.trim() || null,
          address: address.trim(),
          city: city?.trim() || "Bengaluru",
          state: state?.trim() || "Karnataka",
          postalCode: postalCode?.trim() || null,
          phone: phone?.trim() || null,
          email: email?.trim() || session.user.email,
          status: "ACTIVE", // Auto-activate or PENDING_APPROVAL
        },
      });

      // Create initial printer
      const printer = await tx.printer.create({
        data: {
          shopId: newShop.id,
          name: "Main Printer",
          model: "Canon PIXMA G7070",
          manufacturer: "Canon",
          status: "ONLINE",
          isEnabled: true,
          lastSeenAt: new Date(),
        },
      });

      // Create printer capabilities
      await tx.printerCapability.create({
        data: {
          printerId: printer.id,
          supportsColor: true,
          supportsDuplex: true,
          supportsA3: false,
          supportsA4: true,
          maxCopies: 99,
          maxResolutionDpi: 4800,
          detectionMethod: "manual",
          capabilitiesJson: {
            supportsColor: true,
            supportsDuplex: true,
            supportedPaperSizes: ["A4", "A5", "LETTER", "LEGAL"],
            supportedColorModes: ["COLOR", "BLACK_AND_WHITE", "AUTO"],
            supportedDuplexModes: ["SINGLE_SIDED", "DUPLEX_LONG_EDGE", "DUPLEX_SHORT_EDGE"],
            supportedOrientations: ["PORTRAIT", "LANDSCAPE"],
            supportedPagesPerSheet: [1, 2, 4, 6, 9],
            supportedScalingModes: ["FIT_TO_PAGE", "ACTUAL_SIZE", "CUSTOM"],
            supportedQualityModes: ["DRAFT", "NORMAL", "HIGH"],
            supportedMediaTypes: ["PLAIN", "PHOTO", "GLOSSY", "MATTE"],
            maxCopies: 99,
            maxResolutionDpi: 4800,
          },
        },
      });

      // Create default pricing rules
      await tx.pricingRule.create({
        data: {
          shopId: newShop.id,
          name: "Default Pricing",
          isDefault: true,
          bwPricePerPage: 100,     // ₹1.00
          colorPricePerPage: 500,  // ₹5.00
          duplexDiscountPaise: 25, // ₹0.25 discount
          paperSizePricing: { A3: 200, A4: 0, A5: 0, LETTER: 0, LEGAL: 50 },
          qualityPricing: { HIGH: 100, NORMAL: 0, DRAFT: 0 },
          mediaPricing: { GLOSSY: 300, PHOTO: 500, PLAIN: 0, MATTE: 100 },
        },
      });

      return newShop;
    });

    return NextResponse.json(createApiResponse(shop), { status: 201 });
  } catch (err) {
    console.error("[POST /api/v1/shop/setup]", err);
    return NextResponse.json(
      createApiError(ErrorCodes.INTERNAL_ERROR, "Failed to setup shop"),
      { status: 500 }
    );
  }
}
