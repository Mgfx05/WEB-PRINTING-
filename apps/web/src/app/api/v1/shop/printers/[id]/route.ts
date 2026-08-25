import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@erb/database/client";
import { createApiResponse, createApiError } from "@/lib/api/response";
import { ErrorCodes, PrinterStatus } from "@erb/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
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

  const { id: printerId } = await params;

  // Verify printer belongs to this owner's shop
  const shop = await prisma.shop.findFirst({
    where: { ownerId: session.user.id },
  });

  if (!shop) {
    return NextResponse.json(
      createApiError(ErrorCodes.NOT_FOUND, "Shop not found"),
      { status: 404 }
    );
  }

  const existingPrinter = await prisma.printer.findFirst({
    where: { id: printerId, shopId: shop.id },
    include: { capabilities: true },
  });

  if (!existingPrinter) {
    return NextResponse.json(
      createApiError(ErrorCodes.NOT_FOUND, "Printer not found"),
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
      status,
      isEnabled,
      supportsColor,
      supportsDuplex,
      supportsA3,
      supportsA4,
      maxCopies,
      maxResolutionDpi,
    } = body;

    const updatedPrinter = await prisma.$transaction(async (tx) => {
      const printer = await tx.printer.update({
        where: { id: printerId },
        data: {
          ...(name !== undefined ? { name: name.trim() } : {}),
          ...(model !== undefined ? { model: model?.trim() } : {}),
          ...(manufacturer !== undefined ? { manufacturer: manufacturer?.trim() } : {}),
          ...(serialNumber !== undefined ? { serialNumber: serialNumber?.trim() } : {}),
          ...(agentId !== undefined ? { agentId: agentId?.trim() } : {}),
          ...(status !== undefined ? { status: status as PrinterStatus } : {}),
          ...(isEnabled !== undefined ? { isEnabled: !!isEnabled } : {}),
          updatedAt: new Date(),
        },
      });

      if (
        supportsColor !== undefined ||
        supportsDuplex !== undefined ||
        supportsA3 !== undefined ||
        supportsA4 !== undefined ||
        maxCopies !== undefined ||
        maxResolutionDpi !== undefined
      ) {
        const capsJson = {
          supportsColor:
            supportsColor !== undefined
              ? !!supportsColor
              : existingPrinter.capabilities?.supportsColor ?? true,
          supportsDuplex:
            supportsDuplex !== undefined
              ? !!supportsDuplex
              : existingPrinter.capabilities?.supportsDuplex ?? true,
          supportedPaperSizes: [
            "A4",
            "A5",
            "LETTER",
            ...((supportsA3 ?? existingPrinter.capabilities?.supportsA3) ? ["A3"] : []),
          ],
          supportedColorModes: (supportsColor ?? existingPrinter.capabilities?.supportsColor)
            ? ["COLOR", "BLACK_AND_WHITE", "AUTO"]
            : ["BLACK_AND_WHITE"],
          supportedDuplexModes: (supportsDuplex ?? existingPrinter.capabilities?.supportsDuplex)
            ? ["SINGLE_SIDED", "DUPLEX_LONG_EDGE", "DUPLEX_SHORT_EDGE"]
            : ["SINGLE_SIDED"],
          supportedOrientations: ["PORTRAIT", "LANDSCAPE"],
          supportedPagesPerSheet: [1, 2, 4, 6, 9],
          supportedScalingModes: ["FIT_TO_PAGE", "ACTUAL_SIZE", "CUSTOM"],
          supportedQualityModes: ["DRAFT", "NORMAL", "HIGH"],
          supportedMediaTypes: ["PLAIN", "PHOTO", "GLOSSY", "MATTE"],
          maxCopies:
            maxCopies !== undefined
              ? Number(maxCopies)
              : existingPrinter.capabilities?.maxCopies ?? 99,
          maxResolutionDpi:
            maxResolutionDpi !== undefined
              ? Number(maxResolutionDpi)
              : existingPrinter.capabilities?.maxResolutionDpi ?? 4800,
        };

        await tx.printerCapability.upsert({
          where: { printerId },
          update: {
            ...(supportsColor !== undefined ? { supportsColor: !!supportsColor } : {}),
            ...(supportsDuplex !== undefined ? { supportsDuplex: !!supportsDuplex } : {}),
            ...(supportsA3 !== undefined ? { supportsA3: !!supportsA3 } : {}),
            ...(supportsA4 !== undefined ? { supportsA4: !!supportsA4 } : {}),
            ...(maxCopies !== undefined ? { maxCopies: Number(maxCopies) } : {}),
            ...(maxResolutionDpi !== undefined ? { maxResolutionDpi: Number(maxResolutionDpi) } : {}),
            capabilitiesJson: capsJson,
          },
          create: {
            printerId,
            supportsColor: !!supportsColor,
            supportsDuplex: !!supportsDuplex,
            supportsA3: !!supportsA3,
            supportsA4: !!supportsA4,
            maxCopies: Number(maxCopies) || 99,
            maxResolutionDpi: Number(maxResolutionDpi) || 4800,
            capabilitiesJson: capsJson,
          },
        });
      }

      return printer;
    });

    return NextResponse.json(createApiResponse(updatedPrinter));
  } catch (err) {
    console.error("[PATCH /api/v1/shop/printers/:id]", err);
    return NextResponse.json(
      createApiError(ErrorCodes.INTERNAL_ERROR, "Failed to update printer"),
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
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

  const { id: printerId } = await params;

  const shop = await prisma.shop.findFirst({
    where: { ownerId: session.user.id },
  });

  if (!shop) {
    return NextResponse.json(
      createApiError(ErrorCodes.NOT_FOUND, "Shop not found"),
      { status: 404 }
    );
  }

  await prisma.printer.update({
    where: { id: printerId, shopId: shop.id },
    data: { isEnabled: false, status: "OFFLINE" },
  });

  return NextResponse.json(createApiResponse({ success: true, message: "Printer disabled" }));
}
