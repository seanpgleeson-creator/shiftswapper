/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { defaultCache } from "@serwist/turbopack/worker";
import {
  NetworkFirst,
  NetworkOnly,
  StaleWhileRevalidate,
  CacheFirst,
  ExpirationPlugin,
  Serwist,
  type RuntimeCaching,
} from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// ─── Caching strategy ───────────────────────────────────────────────────────
//
// RULES (see docs/pwa-plan.md §4):
//
// 1. All authenticated API routes → NetworkOnly (never cached on device)
//    Prevents stale session data and cross-account data leaks on shared devices.
//
// 2. Public, truly static lists (locations, roles) → StaleWhileRevalidate
//    These change rarely and are safe to serve from cache.
//
// 3. Static Next.js assets (_next/static) → StaleWhileRevalidate
//    Hashed filenames ensure we never serve wrong chunks.
//
// 4. PWA icons + logo → CacheFirst (long-lived, never change per URL)
//
// 5. Page navigations → NetworkFirst with offline fallback to /offline
//    Allows the app shell to load offline after first visit.
//
// 6. Third-party beacons (Sentry, Vercel Analytics) → NetworkOnly
//    Errors should never be swallowed by the service worker.

const BYPASS_ROUTES: RuntimeCaching[] = [
  // NextAuth — cookie issuance must go direct
  { matcher: /\/api\/auth\/.*/, handler: new NetworkOnly() },
  // Authenticated user data — never cache (shared pharmacy devices)
  { matcher: /\/api\/me/, handler: new NetworkOnly() },
  { matcher: /\/api\/shifts\/.*/, handler: new NetworkOnly() },
  { matcher: /\/api\/admin\/.*/, handler: new NetworkOnly() },
  { matcher: /\/api\/bug-report/, handler: new NetworkOnly() },
  { matcher: /\/api\/demo\/.*/, handler: new NetworkOnly() },
  // Telemetry beacons — never cache
  {
    matcher: /^https:\/\/.*\.ingest\.sentry\.io\/.*/i,
    handler: new NetworkOnly(),
  },
  {
    matcher: /^https:\/\/vitals\.vercel-insights\.com\/.*/i,
    handler: new NetworkOnly(),
  },
  {
    matcher: /^https:\/\/va\.vercel-scripts\.com\/.*/i,
    handler: new NetworkOnly(),
  },
];

const customRuntimeCaching: RuntimeCaching[] = [
  // ── Bypass rules first (order matters) ──────────────────────────────────
  ...BYPASS_ROUTES,

  // ── Public static API lists (safe to cache) ─────────────────────────────
  {
    matcher: /\/api\/locations/,
    handler: new StaleWhileRevalidate({
      cacheName: "api-public",
      plugins: [
        new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 24 * 60 * 60 }),
      ],
    }),
  },
  {
    matcher: /\/api\/roles/,
    handler: new StaleWhileRevalidate({
      cacheName: "api-public",
      plugins: [
        new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 24 * 60 * 60 }),
      ],
    }),
  },

  // ── PWA icons + logo → CacheFirst (long-lived) ──────────────────────────
  {
    matcher: /\/icons\/.*\.png$/,
    handler: new CacheFirst({
      cacheName: "pwa-assets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        }),
      ],
    }),
  },
  {
    matcher: /\/(apple-touch-icon|favicon|shift-swapper-logo).*\.(png|svg|ico)$/,
    handler: new CacheFirst({
      cacheName: "pwa-assets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        }),
      ],
    }),
  },

  // ── Next.js static assets → StaleWhileRevalidate (hashed URLs) ──────────
  {
    matcher: /\/_next\/static\/.*/,
    handler: new StaleWhileRevalidate({
      cacheName: "next-static",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 256,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        }),
      ],
    }),
  },
  {
    matcher: /\/_next\/image\?.*/,
    handler: new StaleWhileRevalidate({
      cacheName: "next-image",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 64,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        }),
      ],
    }),
  },

  // ── Page navigations → NetworkFirst with offline fallback ───────────────
  {
    matcher: ({ request }) => request.mode === "navigate",
    handler: new NetworkFirst({
      cacheName: "pages",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60,
        }),
      ],
      networkTimeoutSeconds: 10,
    }),
  },

  // ── defaultCache for anything else (RSC, fonts, etc.) ───────────────────
  // Filter out the API routes already covered above
  ...defaultCache.filter((entry) => {
    const m = entry.matcher;
    if (typeof m === "object" && m instanceof RegExp) {
      return !m.toString().includes("/api/auth/");
    }
    return true;
  }),
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: customRuntimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
