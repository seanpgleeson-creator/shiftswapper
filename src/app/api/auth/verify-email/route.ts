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

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
    },
  });

  const base = request.nextUrl.origin;
  return NextResponse.redirect(new URL("/verify-phone?email_verified=1", base));
}
