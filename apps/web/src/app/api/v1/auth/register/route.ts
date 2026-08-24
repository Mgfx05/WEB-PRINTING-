import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@erb/database/client";
import { RegisterSchema } from "@erb/validation";
import { UserRole } from "@erb/types";
import { createApiResponse, createApiError } from "@/lib/api/response";
import { ErrorCodes } from "@erb/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        createApiError(ErrorCodes.VALIDATION_ERROR, "Invalid request data", {
          issues: parsed.error.flatten(),
        }),
        { status: 400 }
      );
    }

    const { name, email, phone, password, role } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        createApiError(
          ErrorCodes.VALIDATION_ERROR,
          "An account with this email already exists"
        ),
        { status: 409 }
      );
    }

    // Hash password with bcrypt (cost factor 12)
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        phone,
        passwordHash,
        role: role as UserRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(createApiResponse(user), { status: 201 });
  } catch (err) {
    console.error("[POST /api/v1/auth/register]", err);
    return NextResponse.json(
      createApiError(ErrorCodes.INTERNAL_ERROR, "Registration failed"),
      { status: 500 }
    );
  }
}
