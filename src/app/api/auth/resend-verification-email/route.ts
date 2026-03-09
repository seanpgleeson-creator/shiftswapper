import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24h

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Sign in to resend the verification email", code: "UNAUTHORIZED" },
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
    select: { email: true, emailVerified: true },
  });
  if (!user) {
    return NextResponse.json(
      { error: "User not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }
  if (user.emailVerified) {
    return NextResponse.json(
      { error: "Email already verified", code: "ALREADY_VERIFIED" },
      { status: 400 }
    );
  }

  const emailVerificationToken = randomBytes(32).toString("hex");
  const emailVerificationExpiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationToken,
      emailVerificationExpiresAt,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const verifyUrl = baseUrl
    ? `${baseUrl.replace(/\/$/, "")}/api/auth/verify-email?token=${encodeURIComponent(emailVerificationToken)}`
    : "";
  if (!verifyUrl) {
    return NextResponse.json(
      { error: "Server misconfiguration: NEXTAUTH_URL not set", code: "CONFIG_ERROR" },
      { status: 500 }
    );
  }

  const sent = await sendVerificationEmail(user.email, verifyUrl);
  if (!sent.ok) {
    console.error("[Resend verification] failed:", sent.error);
    return NextResponse.json(
      { error: sent.error ?? "Failed to send email", code: "SEND_FAILED" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, message: "Verification email sent" });
}
