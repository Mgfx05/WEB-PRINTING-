import { describe, it, expect } from "vitest";
import {
  RegisterSchema,
  LoginSchema,
  PrintOptionsSchema,
  CreateOrderSchema,
  DocumentUploadSchema,
  CreateShopSchema,
} from "./index";

describe("Validation Schemas", () => {
  describe("RegisterSchema", () => {
    it("accepts valid customer registration", () => {
      const valid = {
        name: "Rahul Sharma",
        email: "rahul@example.com",
        phone: "+919876543210",
        password: "Password123",
        role: "CUSTOMER",
      };
      const result = RegisterSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects weak password without numbers or uppercase", () => {
      const invalid = {
        name: "Rahul Sharma",
        email: "rahul@example.com",
        password: "weakpassword",
      };
      const result = RegisterSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects invalid email formats", () => {
      const invalid = {
        name: "Rahul",
        email: "not-an-email",
        password: "Password123",
      };
      const result = RegisterSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("PrintOptionsSchema", () => {
    it("validates full set of print options", () => {
      const valid = {
        colorMode: "COLOR",
        duplexMode: "DUPLEX_LONG_EDGE",
        paperSize: "A4",
        orientation: "PORTRAIT",
        pagesPerSheet: 2,
        scaling: "FIT_TO_PAGE",
        quality: "HIGH",
        copies: 5,
        pageRangeStart: 1,
        pageRangeEnd: 10,
        collate: true,
      };
      const result = PrintOptionsSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects zero copies", () => {
      const invalid = {
        colorMode: "BLACK_AND_WHITE",
        duplexMode: "SINGLE_SIDED",
        paperSize: "A4",
        orientation: "PORTRAIT",
        pagesPerSheet: 1,
        scaling: "FIT_TO_PAGE",
        quality: "NORMAL",
        copies: 0,
      };
      const result = PrintOptionsSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("CreateOrderSchema", () => {
    it("validates complete order with idempotency UUID", () => {
      const valid = {
        shopId: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        printerId: "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
        documentId: "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
        idempotencyKey: "d4e5f6a7-b89c-0d1e-2f3a-4b5c6d7e8f9a",
        options: {
          colorMode: "BLACK_AND_WHITE",
          duplexMode: "SINGLE_SIDED",
          paperSize: "A4",
          orientation: "PORTRAIT",
          pagesPerSheet: 1,
          scaling: "FIT_TO_PAGE",
          quality: "NORMAL",
          copies: 1,
        },
      };
      const result = CreateOrderSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects non-UUID idempotency keys", () => {
      const invalid = {
        shopId: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        printerId: "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
        documentId: "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
        idempotencyKey: "simple-string",
        options: {
          colorMode: "BLACK_AND_WHITE",
          duplexMode: "SINGLE_SIDED",
          paperSize: "A4",
          orientation: "PORTRAIT",
          pagesPerSheet: 1,
          scaling: "FIT_TO_PAGE",
          quality: "NORMAL",
          copies: 1,
        },
      };
      const result = CreateOrderSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("DocumentUploadSchema", () => {
    it("accepts valid PDF within 50MB limit", () => {
      const valid = {
        filename: "thesis_final.pdf",
        mimeType: "application/pdf",
        sizeBytes: 15 * 1024 * 1024,
      };
      const result = DocumentUploadSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects non-PDF mime types", () => {
      const invalid = {
        filename: "image.png",
        mimeType: "image/png",
        sizeBytes: 1024,
      };
      const result = DocumentUploadSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
