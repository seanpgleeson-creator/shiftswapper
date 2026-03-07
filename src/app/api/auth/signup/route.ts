import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { signupSchema } from "@/lib/validation";
import { sendSignupNotificationToAdmin, sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
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
    return NextResponse.json(
      { error: "An account with this email already exists", code: "EMAIL_IN_USE" },
      { status: 409 }
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
  if (verifyUrl) {
    const sent = await sendVerificationEmail(user.email, verifyUrl);
    if (!sent.ok) console.error("Verification email failed:", sent.error);
  } else {
    console.warn("NEXTAUTH_URL not set; verification email link not sent");
  }

  const settings = await prisma.settings.findFirst();
  const schedulerEmail = settings?.schedulerEmail ?? "";
  if (schedulerEmail) {
    const notif = await sendSignupNotificationToAdmin(schedulerEmail, {
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
    },
    { status: 201 }
  );
}
