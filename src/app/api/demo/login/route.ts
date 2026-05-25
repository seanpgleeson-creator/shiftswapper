import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/db";

/**
 * Server-side demo login that bypasses the client-side CSRF flow.
 * LinkedIn / Facebook / Instagram in-app browsers (WebViews) often block
 * or restrict cookies set via fetch(), which breaks NextAuth's client-side
 * signIn() CSRF handshake.  This route creates the JWT and sets the session
 * cookie directly in an HTTP response, which WebViews handle correctly.
 */
export async function GET(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const origin = request.nextUrl.origin;

  const user = await prisma.user.findUnique({
    where: { email: "demo@shiftswapper.app" },
  });

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const maxAge = 30 * 24 * 60 * 60;

  const token = await encode({
    secret,
    token: {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
      firstName: user.firstName,
      lastName: user.lastName,
      position: user.position,
      phone: user.phone ?? undefined,
      role: user.role,
      smsConsent: user.smsConsent,
      smsConsentAt: user.smsConsentAt?.toISOString() ?? undefined,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
    },
    maxAge,
  });

  const isProd = process.env.NODE_ENV === "production";
  const cookieName = isProd
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

  const response = NextResponse.redirect(`${origin}/calendar?tour=1`);
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isProd,
    maxAge,
  });

  return response;
}
