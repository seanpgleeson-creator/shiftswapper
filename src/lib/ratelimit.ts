/**
 * Rate limiting utility using Upstash Redis.
 *
 * Activate by adding these env vars (via `vercel integration add upstash`):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * When not configured, all checks degrade gracefully (pass-through with a warning).
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function makeRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = makeRedis();

function makeLimiter(requests: number, window: `${number} ${"s" | "m" | "h" | "d"}`): Ratelimit | null {
  if (!redis) return null;
  return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(requests, window), prefix: "rl" });
}

/** Auth endpoints: credentials login and signup — 10 req / 60 s per IP */
export const authLimiter = makeLimiter(10, "60 s");

/** Password reset / phone code send — 5 req / 60 s per IP (tighter) */
export const sensitiveAuthLimiter = makeLimiter(5, "60 s");

/** General API — 60 req / 60 s per IP */
export const apiLimiter = makeLimiter(60, "60 s");

/**
 * Check rate limit for a given key (typically `"<route>:<ip>"`).
 * Returns true when the request should be blocked (limit exceeded).
 * Returns false (allow) when Redis is not configured or an error occurs.
 */
export async function isRateLimited(
  limiter: Ratelimit | null,
  key: string
): Promise<boolean> {
  if (!limiter) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[RateLimit] Upstash not configured — UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN missing; skipping rate limit check");
    }
    return false;
  }
  try {
    const { success } = await limiter.limit(key);
    return !success;
  } catch (err) {
    console.error("[RateLimit] Error checking rate limit:", err);
    return false;
  }
}

/** Extract a best-effort IP from Next.js request headers. */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
