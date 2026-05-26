import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { signupSchema } from "@/lib/validation";
import { sendSignupNotificationToAdmin, sendVerificationEmail } from "@/lib/email";
import { authLimiter, getClientIp, isRateLimited } from "@/lib/ratelimit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  if (await isRateLimited(authLimiter, `signup:${ip}`)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment before trying again.", code: "RATE_LIMITED" },
      { status: 429 }
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

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors;
    const fieldList = Object.entries(fields).map(([field, messages]) => ({
      field,
      message: Array.isArray(messages) ? messages[0] : messages,
    }));
    return NextResponse.json(
      {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        fields: fieldList,
      },
      { status: 422 }
    );
  }

  const data = parsed.data;
  const email = data.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Return generic success so the response is indistinguishable from a real signup.
    // The user will receive a "check your email" message; no account existence is revealed.
    return NextResponse.json(
      {
        message: "Account created. Check your email to verify, then sign in.",
        verification_email_sent: false,
      },
      { status: 201 }
    );
  }

  const passwordHash = await hash(data.password, 12);
  const now = new Date();
  const emailVerificationToken = randomBytes(32).toString("hex");
  const emailVerificationExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h
  const user = await prisma.user.create({
    data: {
      firstName: data.first_name.trim(),
      lastName: data.last_name.trim(),
      email,
      passwordHash,
      phone: data.phone?.trim() || null,
      position: data.position,
      role: "member",
      smsConsent: data.sms_consent === true,
      smsConsentAt: data.sms_consent === true ? now : null,
      emailVerified: false,
      phoneVerified: false,
      emailVerificationToken,
      emailVerificationExpiresAt,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const verifyUrl = baseUrl
    ? `${baseUrl.replace(/\/$/, "")}/api/auth/verify-email?token=${encodeURIComponent(emailVerificationToken)}`
    : "";
  let verificationEmailSent = false;
  if (verifyUrl) {
    const sent = await sendVerificationEmail(user.email, verifyUrl);
    verificationEmailSent = sent.ok;
    if (!sent.ok) console.error("Verification email failed:", sent.error);
  } else {
    console.warn("NEXTAUTH_URL not set; verification email link not sent");
  }

  // Prefer a dedicated admin notification address; fall back to schedulerEmail
  // so existing deployments without the env var continue to work.
  const adminEmail =
    process.env.ADMIN_NOTIFICATION_EMAIL?.trim() ||
    (await prisma.settings.findFirst())?.schedulerEmail ||
    "";
  if (adminEmail) {
    const notif = await sendSignupNotificationToAdmin(adminEmail, {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      position: user.position,
    });
    if (!notif.ok) console.error("Signup notification failed:", notif.error);
  }

  return NextResponse.json(
    {
      user: {
        id: user.id,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        position: user.position,
        phone: user.phone,
        role: user.role,
        sms_consent: user.smsConsent,
        sms_consent_at: user.smsConsentAt?.toISOString() ?? null,
        email_verified: user.emailVerified,
        phone_verified: user.phoneVerified,
      },
      message: "Account created. Check your email to verify, then sign in.",
      verification_email_sent: verificationEmailSent,
    },
    { status: 201 }
  );
}
