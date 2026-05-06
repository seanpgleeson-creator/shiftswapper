import { randomInt } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendPhoneVerificationCode } from "@/lib/sms";
import { sensitiveAuthLimiter, getClientIp, isRateLimited } from "@/lib/ratelimit";

const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

function generateSixDigitCode(): string {
  return String(randomInt(100000, 1000000));
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  if (await isRateLimited(sensitiveAuthLimiter, `send-phone-code:${ip}`)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before requesting another code.", code: "RATE_LIMITED" },
      { status: 429 }
    );
  }
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Sign in to request a verification code", code: "UNAUTHORIZED" },
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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true, emailVerified: true },
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
  const phone = user.phone?.trim();
  if (!phone || phone.length < 10) {
    return NextResponse.json(
      { error: "No phone number on your account", code: "NO_PHONE" },
      { status: 400 }
    );
  }

  const code = generateSixDigitCode();
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MS);
  await prisma.user.update({
    where: { id: userId },
    data: {
      phoneVerificationCode: code,
      phoneVerificationExpiresAt: expiresAt,
      phoneVerificationAttempts: 0,
    },
  });

  const result = await sendPhoneVerificationCode(phone, code);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Failed to send code", code: "SMS_FAILED" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, message: "Code sent" });
}
