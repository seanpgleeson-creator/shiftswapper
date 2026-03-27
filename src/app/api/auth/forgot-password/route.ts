import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import { sendPasswordResetSms } from "@/lib/sms";
import { sendPasswordResetEmail } from "@/lib/email";

const TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MS = 60 * 1000; // 60 seconds between requests

function generateSixDigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, method } = body as { email?: string; method?: string };

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  if (method !== "sms" && method !== "email") {
    return NextResponse.json({ error: "Method must be 'sms' or 'email'" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      phone: true,
      phoneVerified: true,
      passwordResetExpiresAt: true,
    },
  });

  // Always return success to prevent email enumeration
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  // Rate limit: reject if a valid token was issued less than 60 seconds ago
  if (
    user.passwordResetExpiresAt &&
    user.passwordResetExpiresAt.getTime() > Date.now() &&
    user.passwordResetExpiresAt.getTime() - TOKEN_EXPIRY_MS > Date.now() - RATE_LIMIT_MS
  ) {
    return NextResponse.json(
      { error: "Please wait before requesting another reset." },
      { status: 429 }
    );
  }

  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

  if (method === "sms") {
    const phone = user.phone?.trim();
    if (!phone || !user.phoneVerified) {
      // Fall back silently — return generic success so we don't reveal account details
      return NextResponse.json({ ok: true });
    }

    const code = generateSixDigitCode();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: code,
        passwordResetExpiresAt: expiresAt,
        passwordResetMethod: "sms",
      },
    });

    const result = await sendPasswordResetSms(phone, code);
    if (!result.ok) {
      console.error("[ForgotPassword] SMS send failed:", result.error);
    }

    return NextResponse.json({ ok: true });
  }

  // Email method
  const plainToken = crypto.randomUUID();
  const hashedToken = hashToken(plainToken);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hashedToken,
      passwordResetExpiresAt: expiresAt,
      passwordResetMethod: "email",
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${plainToken}&email=${encodeURIComponent(normalizedEmail)}`;

  const result = await sendPasswordResetEmail(normalizedEmail, resetUrl);
  if (!result.ok) {
    console.error("[ForgotPassword] Email send failed:", result.error);
  }

  return NextResponse.json({ ok: true });
}
