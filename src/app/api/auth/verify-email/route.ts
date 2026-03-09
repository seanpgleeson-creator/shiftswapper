import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token?.trim()) {
    return NextResponse.redirect(new URL("/login?error=missing_token", request.url));
  }

  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: token.trim(),
      emailVerificationExpiresAt: { gt: new Date() },
    },
  });
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=invalid_or_expired", request.url));
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
    },
    select: { smsConsent: true, phone: true, phoneVerified: true },
  });

  const base = request.nextUrl.origin;
  const hasPhone = (updated.phone ?? "").trim().length >= 10;
  const needsPhoneVerify =
    updated.smsConsent === true && hasPhone && updated.phoneVerified === false;
  const target = needsPhoneVerify ? "/verify-phone?email_verified=1" : "/calendar";
  return NextResponse.redirect(new URL(target, base));
}
