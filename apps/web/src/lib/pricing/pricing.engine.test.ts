import { describe, it, expect, vi, beforeEach } from "vitest";
import { pricingEngine } from "./pricing.engine";
import {
  ColorMode,
  DuplexMode,
  PaperSize,
  Orientation,
  PrintQuality,
  ScalingMode,
  type PrintOptions,
} from "@erb/types";

// Mock database client
vi.mock("@erb/database/client", () => ({
  prisma: {
    pricingRule: {
      findFirst: vi.fn(),
    },
    document: {
      findUniqueOrThrow: vi.fn(),
    },
  },
}));

import { prisma } from "@erb/database/client";

describe("PricingEngine", () => {
  const mockPricingRule = {
    id: "rule-1",
    shopId: "shop-1",
    name: "Default Pricing",
    isDefault: true,
    bwPricePerPage: 100, // 100 paise = ₹1.00
    colorPricePerPage: 500, // 500 paise = ₹5.00
    duplexDiscountPaise: 25, // 25 paise = ₹0.25 discount
    paperSizePricing: {
      A4: 0,
      A5: 0,
      LETTER: 0,
      A3: 200, // +₹2.00
      LEGAL: 50, // +₹0.50
    },
    qualityPricing: {
      DRAFT: 0,
      NORMAL: 0,
      HIGH: 100, // +₹1.00
    },
    mediaPricing: {
      PLAIN: 0,
      MATTE: 100,
      GLOSSY: 300,
      PHOTO: 500,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.pricingRule.findFirst).mockResolvedValue(mockPricingRule as never);
    vi.mocked(prisma.document.findUniqueOrThrow).mockResolvedValue({
      id: "doc-1",
      pageCount: 10,
    } as never);
  });

  it("calculates 1-sided black and white print correctly", async () => {
    const options: PrintOptions = {
      colorMode: ColorMode.BLACK_AND_WHITE,
      duplexMode: DuplexMode.SINGLE_SIDED,
      paperSize: PaperSize.A4,
      orientation: Orientation.PORTRAIT,
      pagesPerSheet: 1,
      scaling: ScalingMode.FIT_TO_PAGE,
      quality: PrintQuality.NORMAL,
      copies: 1,
      collate: true,
    };

    const quote = await pricingEngine.calculatePrice(
      "shop-1",
      "printer-1",
      "doc-1",
      options
    );

    // 10 pages * ₹1.00 = ₹10.00
    expect(quote.currency).toBe("INR");
    expect(quote.basePrice).toBe(10);
    expect(quote.duplexDiscount).toBe(0);
    expect(quote.total).toBe(10);
    expect(quote.copiesMultiplier).toBe(1);
  });

  it("calculates 2-sided duplex discount correctly", async () => {
    const options: PrintOptions = {
      colorMode: ColorMode.BLACK_AND_WHITE,
      duplexMode: DuplexMode.DUPLEX_LONG_EDGE,
      paperSize: PaperSize.A4,
      orientation: Orientation.PORTRAIT,
      pagesPerSheet: 1,
      scaling: ScalingMode.FIT_TO_PAGE,
      quality: PrintQuality.NORMAL,
      copies: 1,
      collate: true,
    };

    const quote = await pricingEngine.calculatePrice(
      "shop-1",
      "printer-1",
      "doc-1",
      options
    );

    // 10 document pages -> 5 charged physical sheets
    // Base: 5 sheets * 100 paise = 500 paise (₹5.00)
    // Duplex discount: 5 sheets * 25 paise = 125 paise (₹1.25)
    // Subtotal: 500 - 125 = 375 paise (₹3.75)
    expect(quote.basePrice).toBe(5);
    expect(quote.duplexDiscount).toBe(1.25);
    expect(quote.total).toBe(3.75);
  });

  it("calculates full color and multiple copies correctly", async () => {
    const options: PrintOptions = {
      colorMode: ColorMode.COLOR,
      duplexMode: DuplexMode.SINGLE_SIDED,
      paperSize: PaperSize.A4,
      orientation: Orientation.PORTRAIT,
      pagesPerSheet: 1,
      scaling: ScalingMode.FIT_TO_PAGE,
      quality: PrintQuality.NORMAL,
      copies: 3,
      collate: true,
    };

    const quote = await pricingEngine.calculatePrice(
      "shop-1",
      "printer-1",
      "doc-1",
      options
    );

    // 10 pages * ₹5.00 = ₹50.00 per copy * 3 copies = ₹150.00
    expect(quote.basePrice).toBe(50);
    expect(quote.copiesMultiplier).toBe(3);
    expect(quote.total).toBe(150);
  });

  it("calculates A3 and High Quality surcharges", async () => {
    const options: PrintOptions = {
      colorMode: ColorMode.BLACK_AND_WHITE,
      duplexMode: DuplexMode.SINGLE_SIDED,
      paperSize: PaperSize.A3,
      orientation: Orientation.PORTRAIT,
      pagesPerSheet: 1,
      scaling: ScalingMode.FIT_TO_PAGE,
      quality: PrintQuality.HIGH,
      copies: 1,
      collate: true,
    };

    const quote = await pricingEngine.calculatePrice(
      "shop-1",
      "printer-1",
      "doc-1",
      options
    );

    // 10 pages
    // Base: 10 * ₹1.00 = ₹10.00
    // A3 surcharge: 10 * ₹2.00 = ₹20.00
    // High Quality: 10 * ₹1.00 = ₹10.00
    // Total: ₹40.00
    expect(quote.basePrice).toBe(10);
    expect(quote.paperSizeSurcharge).toBe(20);
    expect(quote.qualitySurcharge).toBe(10);
    expect(quote.total).toBe(40);
  });

  it("calculates custom page ranges correctly", async () => {
    const options: PrintOptions = {
      colorMode: ColorMode.BLACK_AND_WHITE,
      duplexMode: DuplexMode.SINGLE_SIDED,
      paperSize: PaperSize.A4,
      orientation: Orientation.PORTRAIT,
      pagesPerSheet: 1,
      scaling: ScalingMode.FIT_TO_PAGE,
      quality: PrintQuality.NORMAL,
      pageRangeStart: 3,
      pageRangeEnd: 6, // 4 pages (3, 4, 5, 6)
      copies: 1,
      collate: true,
    };

    const quote = await pricingEngine.calculatePrice(
      "shop-1",
      "printer-1",
      "doc-1",
      options
    );

    // 4 pages * ₹1.00 = ₹4.00
    expect(quote.total).toBe(4);
  });
});
