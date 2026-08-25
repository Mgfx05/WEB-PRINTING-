import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@erb/database/client";
import { createApiResponse, createApiError } from "@/lib/api/response";
import { ErrorCodes } from "@erb/types";

/**
 * GET /api/v1/shop/printers — list shop printers & capabilities
 * POST /api/v1/shop/printers — create new printer for shop
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
      createApiError(ErrorCodes.NOT_FOUND, "Shop not found for this account"),
      { status: 404 }
    );
  }

  const printers = await prisma.printer.findMany({
    where: { shopId: shop.id },
    include: {
      capabilities: true,
      _count: {
        select: {
          printJobs: {
            where: { status: { in: ["QUEUED", "CLAIMING", "PRINTING"] } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    createApiResponse({
      shopId: shop.id,
      printers: printers.map((p) => ({
        ...p,
        activeJobsCount: p._count.printJobs,
      })),
    })
  );
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
      createApiError(ErrorCodes.NOT_FOUND, "Shop not found for this account"),
      { status: 404 }
    );
  }

  try {
    const body = await req.json();
    const {
      name,
      model,
      manufacturer,
      serialNumber,
      agentId,
      supportsColor = true,
      supportsDuplex = true,
      supportsA3 = false,
      supportsA4 = true,
      maxCopies = 99,
      maxResolutionDpi = 4800,
    } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        createApiError(ErrorCodes.VALIDATION_ERROR, "Printer name is required"),
        { status: 400 }
      );
    }

    const printer = await prisma.$transaction(async (tx) => {
      const newPrinter = await tx.printer.create({
        data: {
          shopId: shop.id,
          name: name.trim(),
          model: model?.trim() || "Standard",
          manufacturer: manufacturer?.trim() || "Canon",
          serialNumber: serialNumber?.trim() || null,
          agentId: agentId?.trim() || null,
          status: "ONLINE",
          isEnabled: true,
          lastSeenAt: new Date(),
        },
      });

      const capabilitiesJson = {
        supportsColor: !!supportsColor,
        supportsDuplex: !!supportsDuplex,
        supportedPaperSizes: [
          "A4",
          "A5",
          "LETTER",
          ...(supportsA3 ? ["A3"] : []),
        ],
        supportedColorModes: supportsColor
          ? ["COLOR", "BLACK_AND_WHITE", "AUTO"]
          : ["BLACK_AND_WHITE"],
        supportedDuplexModes: supportsDuplex
          ? ["SINGLE_SIDED", "DUPLEX_LONG_EDGE", "DUPLEX_SHORT_EDGE"]
          : ["SINGLE_SIDED"],
        supportedOrientations: ["PORTRAIT", "LANDSCAPE"],
        supportedPagesPerSheet: [1, 2, 4, 6, 9],
        supportedScalingModes: ["FIT_TO_PAGE", "ACTUAL_SIZE", "CUSTOM"],
        supportedQualityModes: ["DRAFT", "NORMAL", "HIGH"],
        supportedMediaTypes: ["PLAIN", "PHOTO", "GLOSSY", "MATTE"],
        maxCopies: Number(maxCopies) || 99,
        maxResolutionDpi: Number(maxResolutionDpi) || 4800,
      };

      await tx.printerCapability.create({
        data: {
          printerId: newPrinter.id,
          supportsColor: !!supportsColor,
          supportsDuplex: !!supportsDuplex,
          supportsA3: !!supportsA3,
          supportsA4: !!supportsA4,
          maxCopies: Number(maxCopies) || 99,
          maxResolutionDpi: Number(maxResolutionDpi) || 4800,
          detectionMethod: "manual",
          capabilitiesJson,
        },
      });

      return newPrinter;
    });

    return NextResponse.json(createApiResponse(printer), { status: 201 });
  } catch (err) {
    console.error("[POST /api/v1/shop/printers]", err);
    return NextResponse.json(
      createApiError(ErrorCodes.INTERNAL_ERROR, "Failed to create printer"),
      { status: 500 }
    );
  }
}
