import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@erb/database/client";
import { createApiResponse } from "@/lib/api/response";

/**
 * GET /api/v1/shops
 * Returns available shops with printer summary.
 * Public endpoint — no auth required for browsing.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const city = searchParams.get("city");
  const hasColor = searchParams.get("hasColor") === "true";
  const hasDuplex = searchParams.get("hasDuplex") === "true";

  const where = {
    status: "ACTIVE" as const,
    ...(city ? { city: { contains: city, mode: "insensitive" as const } } : {}),
    ...(hasColor || hasDuplex
      ? {
          printers: {
            some: {
              isEnabled: true,
              status: "ONLINE",
              ...(hasColor || hasDuplex
                ? {
                    capabilities: {
                      ...(hasColor ? { supportsColor: true } : {}),
                      ...(hasDuplex ? { supportsDuplex: true } : {}),
                    },
                  }
                : {}),
            },
          },
        }
      : {}),
  };

  const [shops, total] = await prisma.$transaction([
    prisma.shop.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        city: true,
        state: true,
        phone: true,
        latitude: true,
        longitude: true,
        printers: {
          where: { isEnabled: true },
          select: {
            id: true,
            name: true,
            model: true,
            status: true,
            capabilities: {
              select: {
                supportsColor: true,
                supportsDuplex: true,
                supportsA3: true,
                supportsA4: true,
              },
            },
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: "asc" },
    }),
    prisma.shop.count({ where }),
  ]);

  // Add availability summary to each shop
  type ShopEntry = typeof shops[number];
  type PrinterEntry = ShopEntry["printers"][number];

  const shopsWithSummary = shops.map((shop: ShopEntry) => {
    const onlinePrinters = shop.printers.filter((p: PrinterEntry) => p.status === "ONLINE");
    return {
      ...shop,
      isAvailable: onlinePrinters.length > 0,
      onlinePrinterCount: onlinePrinters.length,
      totalPrinterCount: shop.printers.length,
      capabilities: {
        supportsColor: shop.printers.some((p: PrinterEntry) => p.capabilities?.supportsColor),
        supportsDuplex: shop.printers.some((p: PrinterEntry) => p.capabilities?.supportsDuplex),
        supportsA3: shop.printers.some((p: PrinterEntry) => p.capabilities?.supportsA3),
      },
    };
  });

  return NextResponse.json(
    createApiResponse({
      shops: shopsWithSummary,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  );
}
