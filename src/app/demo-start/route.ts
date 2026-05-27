import { NextRequest, NextResponse } from "next/server";

/**
 * Backward-compatibility shim.
 *
 * During the LinkedIn iOS in-app browser fix attempts (commits 6e6b6a3 -> 4c596dc,
 * reverted in 0b88706), the production homepage's "Try the Demo" button briefly
 * pointed at /demo-start instead of /demo. That fix was reverted, but stale HTML
 * caches (browser HTTP cache, service workers, long-open tabs) can still send users
 * to /demo-start and would otherwise see a 404.
 *
 * This route returns a 308 permanent redirect to /demo. Safe to remove once stale
 * HTML has aged out (~30 days from 2026-05-27).
 */
export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/demo", request.url), 308);
}
