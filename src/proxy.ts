/**
 * Next.js Proxy (previously "middleware")
 *
 * Responsibilities:
 * 1. Auth guard — redirect unauthenticated users away from protected page routes
 * 2. CSRF check — block state-changing API requests where Origin doesn't match host
 * 3. Cache-Control — mark authenticated API responses as private/no-store
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Page routes that require a valid session
const PROTECTED_PAGES = [
  "/account",
  "/admin",
  "/post",
  "/calendar",
  "/bug-report",
  "/verify-phone",
  "/check-email",
];

// API routes that do NOT require auth (public reads + auth endpoints)
const PUBLIC_API_PREFIXES = [
  "/api/auth/",
  "/api/locations",
  "/api/roles",
];

// Mutating HTTP methods subject to CSRF check
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function isProtectedPage(pathname: string): boolean {
  return PROTECTED_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Auth guard for protected page routes ──────────────────────────────
  if (isProtectedPage(pathname)) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── 2. CSRF Origin check for mutating API requests ────────────────────────
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

  // ── 3. Cache-Control on authenticated API responses ───────────────────────
  const response = NextResponse.next();
  if (pathname.startsWith("/api/") && !isPublicApiRoute(pathname)) {
    response.headers.set("Cache-Control", "private, no-store");
  }

  return response;
}

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|shift-swapper-logo.svg).*)",
  ],
};
