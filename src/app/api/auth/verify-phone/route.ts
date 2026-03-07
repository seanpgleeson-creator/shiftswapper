import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const verifyPhoneBodySchema = z.object({
  code: z.string().min(6, "Code must be 6 digits").max(6, "Code must be 6 digits"),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Sign in to verify your phone", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json(
      { error: "Session invalid", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", code: "VALIDATION_ERROR" },
      { status: 422 }
    );
  }
  const parsed = verifyPhoneBodySchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors.code?.[0] ?? "Invalid code";
    return NextResponse.json(
      { error: msg, code: "VALIDATION_ERROR" },
      { status: 422 }
    );
  }
  const code = parsed.data.code.trim();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      phoneVerificationCode: true,
      phoneVerificationExpiresAt: true,
      emailVerified: true,
    },
  });
  if (!user) {
    return NextResponse.json(
      { error: "User not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }
  if (!user.emailVerified) {
    return NextResponse.json(
      { error: "Verify your email first", code: "EMAIL_NOT_VERIFIED" },
      { status: 403 }
    );
  }
  if (!user.phoneVerificationCode || !user.phoneVerificationExpiresAt) {
    return NextResponse.json(
      { error: "Request a new code first", code: "NO_CODE" },
      { status: 400 }
    );
  }
  if (user.phoneVerificationExpiresAt < new Date()) {
    await prisma.user.update({
      where: { id: userId },
      data: { phoneVerificationCode: null, phoneVerificationExpiresAt: null },
    });
    return NextResponse.json(
      { error: "Code expired. Request a new code.", code: "EXPIRED" },
      { status: 400 }
    );
  }
  if (user.phoneVerificationCode !== code) {
    return NextResponse.json(
      { error: "Invalid code", code: "INVALID_CODE" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      phoneVerified: true,
      phoneVerificationCode: null,
      phoneVerificationExpiresAt: null,
    },
  });

  return NextResponse.json({ ok: true, message: "Phone verified" });
}
