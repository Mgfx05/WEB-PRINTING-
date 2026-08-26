// Shared Zod validation schemas used by both API handlers and frontend forms.
// Keep in sync with @erb/types interfaces.

import { z } from "zod";

// ============================================================
// Auth Schemas
// ============================================================

export const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{9,14}$/, "Invalid phone number")
    .optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100)
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  role: z.enum(["CUSTOMER", "SHOP_OWNER"]).default("CUSTOMER"),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const ResetPasswordRequestSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8).max(100),
});

// ============================================================
// Shop Schemas
// ============================================================

export const CreateShopSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  address: z.string().min(5).max(500),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

export const UpdateShopSchema = CreateShopSchema.partial();

// ============================================================
// Printer Schemas
// ============================================================

export const CreatePrinterSchema = z.object({
  shopId: z.string().uuid(),
  name: z.string().min(1).max(200),
  model: z.string().max(200).optional(),
  manufacturer: z.string().max(200).optional(),
  serialNumber: z.string().max(200).optional(),
});

export const UpdatePrinterCapabilitiesSchema = z.object({
  supportsColor: z.boolean(),
  supportsDuplex: z.boolean(),
  supportsA3: z.boolean().default(false),
  supportsA4: z.boolean().default(true),
  maxCopies: z.number().int().min(1).max(999).default(99),
  maxResolutionDpi: z.number().int().optional(),
  capabilitiesJson: z.object({
    supportsColor: z.boolean(),
    supportsDuplex: z.boolean(),
    supportedPaperSizes: z.array(z.string()),
    supportedColorModes: z.array(z.string()),
    supportedDuplexModes: z.array(z.string()),
    supportedOrientations: z.array(z.string()),
    supportedPagesPerSheet: z.array(z.number()),
    supportedScalingModes: z.array(z.string()),
    supportedQualityModes: z.array(z.string()),
    supportedMediaTypes: z.array(z.string()),
    maxCopies: z.number().int(),
    maxResolutionDpi: z.number().int().optional(),
  }),
});

// ============================================================
// Print Options Schema
// ============================================================

export const PrintOptionsSchema = z.object({
  colorMode: z.enum(["COLOR", "BLACK_AND_WHITE", "AUTO"]),
  duplexMode: z.enum(["SINGLE_SIDED", "DUPLEX_LONG_EDGE", "DUPLEX_SHORT_EDGE"]),
  paperSize: z.enum(["A3", "A4", "A5", "LETTER", "LEGAL", "TABLOID"]),
  orientation: z.enum(["PORTRAIT", "LANDSCAPE"]),
  pagesPerSheet: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(4),
    z.literal(6),
    z.literal(8),
    z.literal(9),
    z.literal(16),
  ]),
  scaling: z.enum(["FIT_TO_PAGE", "ACTUAL_SIZE", "CUSTOM"]),
  customScalePercent: z.number().min(10).max(400).optional(),
  quality: z.enum(["DRAFT", "NORMAL", "HIGH"]),
  copies: z.number().int().min(1).max(999),
  pageRangeStart: z.number().int().min(1).optional(),
  pageRangeEnd: z.number().int().min(1).optional(),
  collate: z.boolean().default(true),
  mediaType: z.string().max(100).optional(),
});

// ============================================================
// Pricing Calculation Schema
// ============================================================

export const PriceCalculationSchema = z.object({
  shopId: z.string().uuid(),
  printerId: z.string().uuid(),
  documentId: z.string().uuid(),
  options: PrintOptionsSchema,
});

// ============================================================
// Order Creation Schema
// ============================================================

export const CreateOrderSchema = z.object({
  shopId: z.string().uuid(),
  printerId: z.string().uuid(),
  documentId: z.string().uuid(),
  options: PrintOptionsSchema,
  idempotencyKey: z.string().uuid(), // client-generated UUID to prevent double-submit
});

// ============================================================
// Pricing Rule Schema
// ============================================================

export const CreatePricingRuleSchema = z.object({
  shopId: z.string().uuid(),
  printerId: z.string().uuid().optional(),
  name: z.string().max(200).default("Default"),
  isDefault: z.boolean().default(false),
  bwPricePerPage: z.number().int().min(0),     // in paise
  colorPricePerPage: z.number().int().min(0),  // in paise
  paperSizePricing: z.record(z.string(), z.number().int()).default({}),
  qualityPricing: z.record(z.string(), z.number().int()).default({}),
  mediaPricing: z.record(z.string(), z.number().int()).default({}),
  duplexDiscountPaise: z.number().int().min(0).default(0),
});

// ============================================================
// Document Upload Validation
// ============================================================

export const DocumentUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.literal("application/pdf"),
  sizeBytes: z
    .number()
    .int()
    .min(1)
    .max(Number(process.env.MAX_UPLOAD_SIZE_BYTES ?? 26214400), "File size must not exceed 25MB"),
});

// ============================================================
// Pagination
// ============================================================

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateShopInput = z.infer<typeof CreateShopSchema>;
export type CreatePrinterInput = z.infer<typeof CreatePrinterSchema>;
export type PrintOptionsInput = z.infer<typeof PrintOptionsSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type PriceCalculationInput = z.infer<typeof PriceCalculationSchema>;
export type CreatePricingRuleInput = z.infer<typeof CreatePricingRuleSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
