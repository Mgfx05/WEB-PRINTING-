import { NextResponse } from "next/server";
import { prisma } from "@erb/database/client";

/**
 * GET /api/health
 * Health check endpoint for load balancers, Docker, and monitoring.
 * Returns 200 if healthy, 503 if DB is unreachable.
 */
export async function GET() {
  const start = Date.now();

  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - start;

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        database: { status: "ok", latencyMs: dbLatencyMs },
      },
      version: process.env.npm_package_version ?? "0.1.0",
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        services: {
          database: { status: "error", error },
        },
      },
      { status: 503 }
    );
  }
}
