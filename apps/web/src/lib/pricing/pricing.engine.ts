import { prisma } from "@erb/database/client";
import type {
  PrintOptions,
  PriceBreakdown,
  PaperSize,
  PrintQuality,
} from "@erb/types";

/**
 * Server-side pricing engine.
 *
 * CRITICAL: The frontend may show estimates, but this is the ONLY
 * authoritative price. The result is stored with the order at creation time
 * so historical orders remain accurate even if pricing changes later.
 *
 * All monetary values internally use integers (paise) to avoid
 * floating-point precision issues. Converted to decimal rupees at the end.
 */
export class PricingEngine {
  /**
   * Calculate the authoritative price for a print job.
   *
   * Formula (per page, in paise):
   *   basePricePerPage
   *   + paperSizeSurcharge
   *   + qualitySurcharge
   *   + mediaSurcharge
   *   - duplexDiscount (if duplex)
   *   × effectivePages (accounting for pagesPerSheet + pageRange)
   *   × copies
   *
   * colorSurcharge replaces bw base when color is selected.
   */
  async calculatePrice(
    shopId: string,
    printerId: string,
    documentId: string,
    options: PrintOptions
  ): Promise<PriceBreakdown> {
    // Fetch pricing rule (printer-specific first, then shop default)
    const pricingRule = await prisma.pricingRule.findFirst({
      where: {
        shopId,
        OR: [{ printerId }, { printerId: null }],
        isDefault: true,
      },
      orderBy: [
        { printerId: "desc" }, // prefer printer-specific rule
        { createdAt: "desc" },
      ],
    });

    if (!pricingRule) {
      throw new Error(`No pricing rule found for shop ${shopId}`);
    }

    // Fetch document to get page count
    const document = await prisma.document.findUniqueOrThrow({
      where: { id: documentId },
      select: { pageCount: true },
    });

    const totalPages = document.pageCount ?? 1;

    // Calculate effective page count from page range
    const startPage = options.pageRangeStart ?? 1;
    const endPage = options.pageRangeEnd ?? totalPages;
    const selectedPages = Math.max(1, endPage - startPage + 1);

    // Account for pages-per-sheet (1 physical sheet prints N document pages)
    const pps = options.pagesPerSheet || 1;
    const physicalSheets = Math.ceil(selectedPages / pps);

    // For duplex, each sheet prints 2 sides
    const chargedSheets =
      options.duplexMode !== "SINGLE_SIDED"
        ? Math.ceil(physicalSheets / 2)
        : physicalSheets;

    // ── Base price per page (in paise) ───────────────────────────────────
    const isColor = options.colorMode === "COLOR";
    const basePricePerPage = isColor
      ? pricingRule.colorPricePerPage
      : pricingRule.bwPricePerPage;

    // ── Surcharges ────────────────────────────────────────────────────────
    const paperSizePricing = pricingRule.paperSizePricing as Record<
      string,
      number
    >;
    const qualityPricing = pricingRule.qualityPricing as Record<string, number>;
    const mediaPricing = pricingRule.mediaPricing as Record<string, number>;

    const paperSizeSurchargePerPage =
      paperSizePricing[options.paperSize as PaperSize] ?? 0;
    const qualitySurchargePerPage =
      qualityPricing[options.quality as PrintQuality] ?? 0;
    const mediaSurchargePerPage = options.mediaType
      ? (mediaPricing[options.mediaType] ?? 0)
      : 0;

    // Color surcharge is built into colorPricePerPage above
    const colorSurchargePerPage = isColor
      ? pricingRule.colorPricePerPage - pricingRule.bwPricePerPage
      : 0;

    // ── Duplex discount ───────────────────────────────────────────────────
    const duplexDiscountTotal =
      options.duplexMode !== "SINGLE_SIDED"
        ? pricingRule.duplexDiscountPaise * chargedSheets
        : 0;

    // ── Subtotal per copy ─────────────────────────────────────────────────
    const pricePerSheet =
      basePricePerPage +
      paperSizeSurchargePerPage +
      qualitySurchargePerPage +
      mediaSurchargePerPage;

    const subtotalPaisePerCopy =
      pricePerSheet * chargedSheets - duplexDiscountTotal;

    // ── Total ─────────────────────────────────────────────────────────────
    const copies = options.copies ?? 1;
    const totalPaise = subtotalPaisePerCopy * copies;

    // Convert paise → rupees (2 decimal places)
    const toRupees = (paise: number): number =>
      Math.round(paise) / 100;

    return {
      basePrice: toRupees(
        (isColor ? pricingRule.colorPricePerPage : pricingRule.bwPricePerPage) *
          chargedSheets
      ),
      colorSurcharge: toRupees(colorSurchargePerPage * chargedSheets),
      paperSizeSurcharge: toRupees(paperSizeSurchargePerPage * chargedSheets),
      qualitySurcharge: toRupees(qualitySurchargePerPage * chargedSheets),
      mediaSurcharge: toRupees(mediaSurchargePerPage * chargedSheets),
      duplexDiscount: toRupees(duplexDiscountTotal),
      copiesMultiplier: copies,
      subtotal: toRupees(subtotalPaisePerCopy),
      total: toRupees(totalPaise),
      currency: "INR",
    };
  }
}

export const pricingEngine = new PricingEngine();
