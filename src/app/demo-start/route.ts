import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/db";

/**
 * Server-side demo login at a NON-/api path.
 *
 * LinkedIn's iOS in-app browser (WKWebView) blocks navigation to any /api/*
 * URL at the policy layer — it treats them as non-page resources and shows
 * "File downloads are not supported" before the request even completes.
 * Serving the same logic from /demo-start (a plain page-like path) bypasses
 * that heuristic entirely.
 *
 * Returns an HTML page (200) that sets the session cookie and immediately
 * navigates to /calendar?tour=1 via meta-refresh + window.location.replace().
 * HTML responses are always rendered inline by WKWebView; the cookie is
 * honoured because it is set on a same-origin navigation response.
 */
export async function GET(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    return new NextResponse("Not found", { status: 404 });
  }

  const origin = request.nextUrl.origin;

  const user = await prisma.user.findUnique({
    where: { email: "demo@shiftswapper.app" },
  });

  if (!user) {
    return htmlRedirect(origin, "/login");
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return htmlRedirect(origin, "/login");
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

  const response = htmlRedirect(origin, "/calendar?tour=1");
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isProd,
    maxAge,
  });

  return response;
}

/** Returns a 200 HTML page that immediately navigates to the given path. */
function htmlRedirect(origin: string, path: string): NextResponse {
  const url = `${origin}${path}`;
  const html = `<!doctype html><html><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="refresh" content="0;url=${url}">
  <title>Loading demo\u2026</title>
</head><body style="font:14px system-ui,sans-serif;text-align:center;padding:4rem;color:#475569">
  <p>Loading demo\u2026</p>
  <script>window.location.replace(${JSON.stringify(url)})</script>
</body></html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Explicitly tell the browser to render this inline, not download it.
      // Some in-app browsers (LinkedIn iOS WKWebView) apply download detection
      // heuristics and this header overrides them.
      "Content-Disposition": "inline",
    },
  });
}
