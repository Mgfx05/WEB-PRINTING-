import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { storageService, generateStorageKey } from "@/lib/storage/storage.service";
import { prisma } from "@erb/database/client";
import { createApiResponse, createApiError } from "@/lib/api/response";
import { ErrorCodes } from "@erb/types";

const MAX_FILE_SIZE = Number(process.env.MAX_UPLOAD_SIZE_BYTES ?? 52428800); // 50MB

/**
 * POST /api/v1/documents/upload
 *
 * Accepts a PDF file via multipart form data.
 *
 * Security:
 * - Validates actual file content (not just browser-supplied MIME type)
 * - Generates UUID-based storage key (never user filename)
 * - Stores SHA-256 checksum
 * - Access-controlled to authenticated users only
 * - Never overwrites another user's file
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      createApiError(ErrorCodes.UNAUTHORIZED, "Authentication required"),
      { status: 401 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        createApiError(ErrorCodes.VALIDATION_ERROR, "No file provided"),
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        createApiError(
          ErrorCodes.FILE_TOO_LARGE,
          `File size exceeds maximum allowed (${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB)`
        ),
        { status: 413 }
      );
    }

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate actual PDF magic bytes (%PDF-)
    // Do NOT trust the browser-supplied MIME type alone
    const pdfMagic = buffer.subarray(0, 5).toString("ascii");
    if (pdfMagic !== "%PDF-") {
      return NextResponse.json(
        createApiError(
          ErrorCodes.INVALID_FILE_TYPE,
          "File does not appear to be a valid PDF"
        ),
        { status: 400 }
      );
    }

    // Sanitize the original filename for display purposes only
    const rawFilename = file.name;
    const sanitizedFilename = rawFilename
      .replace(/[^a-zA-Z0-9._-\s]/g, "")
      .trim()
      .substring(0, 255) || "document.pdf";

    // Generate UUID-based storage key — NEVER derived from user filename
    const storageKey = generateStorageKey(session.user.id, "application/pdf");

    // Store file and get checksum
    const { checksum } = await storageService.upload(
      storageKey,
      buffer,
      "application/pdf"
    );

    // Extract page count from PDF content
    let detectedPages: number | null = null;
    try {
      const content = buffer.toString("latin1");
      const countMatch =
        content.match(/\/Type\s*\/Pages[^>]*\/Count\s+(\d+)/i) ||
        content.match(/\/Count\s+(\d+)[^>]*\/Type\s*\/Pages/i);
      if (countMatch && countMatch[1]) {
        const count = parseInt(countMatch[1], 10);
        if (count > 0 && count < 10000) {
          detectedPages = count;
        }
      }
      if (!detectedPages) {
        const pageMatches = content.match(/\/Type\s*\/Page\b/g);
        if (pageMatches && pageMatches.length > 0) {
          detectedPages = pageMatches.length;
        }
      }
    } catch {
      detectedPages = null;
    }

    const clientPageCount = formData.get("pageCount");
    const finalPageCount =
      detectedPages ??
      (clientPageCount ? parseInt(String(clientPageCount), 10) : 1);

    // Create document record in DB
    const document = await prisma.document.create({
      data: {
        userId: session.user.id,
        originalFilename: sanitizedFilename,
        storageKey,
        mimeType: "application/pdf",
        sizeBytes: BigInt(file.size),
        pageCount: Math.max(1, finalPageCount || 1),
        checksum,
        // Documents expire in 7 days if not ordered
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      select: {
        id: true,
        originalFilename: true,
        sizeBytes: true,
        pageCount: true,
        checksum: true,
        uploadedAt: true,
      },
    });

    return NextResponse.json(
      createApiResponse({
        ...document,
        sizeBytes: document.sizeBytes.toString(), // BigInt → string for JSON
      }),
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/v1/documents/upload]", err);
    return NextResponse.json(
      createApiError(ErrorCodes.UPLOAD_FAILED, "Upload failed. Please try again."),
      { status: 500 }
    );
  }
}

// GET /api/v1/documents/:id — get document info
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      createApiError(ErrorCodes.UNAUTHORIZED, "Authentication required"),
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const documentId = searchParams.get("id");

  if (!documentId) {
    return NextResponse.json(
      createApiError(ErrorCodes.VALIDATION_ERROR, "Document ID required"),
      { status: 400 }
    );
  }

  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      userId: session.user.id, // Users can only access their own documents
    },
    select: {
      id: true,
      originalFilename: true,
      sizeBytes: true,
      pageCount: true,
      uploadedAt: true,
      expiresAt: true,
    },
  });

  if (!document) {
    return NextResponse.json(
      createApiError(ErrorCodes.NOT_FOUND, "Document not found"),
      { status: 404 }
    );
  }

  return NextResponse.json(
    createApiResponse({
      ...document,
      sizeBytes: document.sizeBytes.toString(),
    })
  );
}
