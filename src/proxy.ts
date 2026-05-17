/**
 * Next.js Proxy (previously "middleware")
 *
 * Responsibilities:
 * 1. CSRF check — block state-changing API requests where Origin doesn't match host
 * 2. Cache-Control — mark authenticated API responses as private/no-store
 *
 * Note: Auth enforcement is intentionally NOT done here. Next.js 16 proxy.ts
 * runs before the Node.js runtime is fully available and getToken() cannot read
 * the session cookie when authOptions overrides the cookie name. Auth is enforced
 * client-side via useSession() on protected pages and server-side via
 * getServerSession() on protected API routes.
 */

import { NextRequest, NextResponse } from "next/server";

// API routes that do NOT require auth (public reads + auth endpoints)
const PUBLIC_API_PREFIXES = [
  "/api/auth/",
  "/api/locations",
  "/api/roles",
];

// Mutating HTTP methods subject to CSRF check
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. CSRF Origin check for mutating API requests ────────────────────────
  // Skip public API routes (auth callbacks, etc.) which need to accept cross-origin POSTs
  if (
    pathname.startsWith("/api/") &&
    !isPublicApiRoute(pathname) &&
    MUTATING_METHODS.has(request.method)
  ) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    if (origin && host) {
      let originHost: string;
      try {
        originHost = new URL(origin).host;
      } catch {
        return NextResponse.json(
          { error: "Invalid Origin header", code: "FORBIDDEN" },
          { status: 403 }
        );
      }
      if (originHost !== host) {
        console.warn(`[CSRF] Blocked: origin=${origin} host=${host} path=${pathname}`);
        return NextResponse.json(
          { error: "Forbidden", code: "FORBIDDEN" },
          { status: 403 }
        );
      }
    }
  }

  // ── 2. Cache-Control on authenticated API responses ───────────────────────
  const response = NextResponse.next();
  if (pathname.startsWith("/api/") && !isPublicApiRoute(pathname)) {
    response.headers.set("Cache-Control", "private, no-store");
  }

  return response;
}

export const config = {
  // Run on all routes except Next.js internals, static files, and PWA assets
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon-32x32.png|shift-swapper-logo.svg|manifest.webmanifest|serwist/.*|icons/.*|apple-touch-icon.png|offline).*)",
  ],
};
