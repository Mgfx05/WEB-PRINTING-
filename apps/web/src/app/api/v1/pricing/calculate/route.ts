import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { PriceCalculationSchema } from "@erb/validation";
import { createApiResponse, createApiError } from "@/lib/api/response";
import { ErrorCodes } from "@erb/types";
import { pricingEngine } from "@/lib/pricing/pricing.engine";
import type { PrintOptions } from "@erb/types";

/**
 * POST /api/v1/pricing/calculate
 *
 * Returns the authoritative server-side price for a set of print options.
 * Called by the frontend live-pricing UI (debounced).
 *
 * IMPORTANT: This is also what the order creation endpoint uses.
 * The frontend NEVER calculates the final price unilaterally.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      createApiError(ErrorCodes.UNAUTHORIZED, "Authentication required"),
      { status: 401 }
    );
  }

  const body = await req.json();
  const parsed = PriceCalculationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      createApiError(ErrorCodes.VALIDATION_ERROR, "Invalid request", {
        issues: parsed.error.flatten(),
      }),
      { status: 400 }
    );
  }

  const { shopId, printerId, documentId, options } = parsed.data;

  try {
    const breakdown = await pricingEngine.calculatePrice(
      shopId,
      printerId,
      documentId,
      options as PrintOptions
    );

    return NextResponse.json(createApiResponse(breakdown));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Pricing failed";
    return NextResponse.json(
      createApiError(ErrorCodes.INTERNAL_ERROR, message),
      { status: 500 }
    );
  }
}
