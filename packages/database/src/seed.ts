/**
 * Development seed script.
 * Creates test users, a shop, a printer with capabilities, and pricing rules.
 *
 * Run with: pnpm db:seed
 *
 * IMPORTANT: Never run this in production.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding development database...\n");

  // ── Create test users ──────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@erb.local" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@erb.local",
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  const shopOwner = await prisma.user.upsert({
    where: { email: "shop@erb.local" },
    update: {},
    create: {
      name: "Shop Owner",
      email: "shop@erb.local",
      passwordHash,
      role: "SHOP_OWNER",
    },
  });
  console.log(`✅ Shop Owner: ${shopOwner.email}`);

  const customer = await prisma.user.upsert({
    where: { email: "customer@erb.local" },
    update: {},
    create: {
      name: "Test Customer",
      email: "customer@erb.local",
      passwordHash,
      role: "CUSTOMER",
    },
  });
  console.log(`✅ Customer: ${customer.email}`);

  // ── Create a test shop ─────────────────────────────────────────────────
  const shop = await prisma.shop.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      ownerId: shopOwner.id,
      name: "ERB Demo Print Shop",
      description: "A full-featured demo print shop for development testing.",
      address: "123 MG Road",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560001",
      country: "India",
      latitude: 12.9716,
      longitude: 77.5946,
      phone: "+91 98765 43210",
      status: "ACTIVE",
    },
  });
  console.log(`✅ Shop: ${shop.name} (${shop.id})`);

  // ── Create a Canon printer (the real target hardware) ─────────────────
  const printer = await prisma.printer.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: { status: "ONLINE", lastSeenAt: new Date() },
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      shopId: shop.id,
      name: "Canon-01",
      model: "Canon PIXMA G7070",
      manufacturer: "Canon",
      status: "ONLINE",
      agentId: "dev-agent-001",
      lastSeenAt: new Date(),
      isEnabled: true,
    },
  });
  console.log(`✅ Printer: ${printer.name} (${printer.model})`);

  // ── Set Canon printer capabilities ────────────────────────────────────
  await prisma.printerCapability.upsert({
    where: { printerId: printer.id },
    update: {},
    create: {
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
        supportedPagesPerSheet: [1, 2, 4, 6, 9, 16],
        supportedScalingModes: ["FIT_TO_PAGE", "ACTUAL_SIZE", "CUSTOM"],
        supportedQualityModes: ["DRAFT", "NORMAL", "HIGH"],
        supportedMediaTypes: ["PLAIN", "PHOTO", "GLOSSY", "MATTE"],
        maxCopies: 99,
        maxResolutionDpi: 4800,
      },
    },
  });
  console.log(`✅ Capabilities set for ${printer.name}`);

  // ── Create default pricing rules ──────────────────────────────────────
  await prisma.pricingRule.upsert({
    where: { id: "00000000-0000-0000-0000-000000000003" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000003",
      shopId: shop.id,
      printerId: printer.id,
      name: "Canon Standard Pricing",
      isDefault: true,
      bwPricePerPage: 100,     // ₹1.00 per page
      colorPricePerPage: 500,  // ₹5.00 per page
      duplexDiscountPaise: 25, // ₹0.25 discount per duplex sheet
      paperSizePricing: { A3: 200, A4: 0, A5: 0, LETTER: 0, LEGAL: 50 },
      qualityPricing: { HIGH: 100, NORMAL: 0, DRAFT: 0 },
      mediaPricing: { GLOSSY: 300, PHOTO: 500, PLAIN: 0, MATTE: 100 },
    },
  });
  console.log(`✅ Pricing rules created`);

  console.log("\n🎉 Seed complete!\n");
  console.log("Test accounts:");
  console.log("  Admin:      admin@erb.local     / Password123");
  console.log("  Shop Owner: shop@erb.local      / Password123");
  console.log("  Customer:   customer@erb.local  / Password123\n");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
