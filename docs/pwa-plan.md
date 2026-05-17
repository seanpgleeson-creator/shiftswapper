# ShiftSwap PWA Readiness Audit & Implementation Plan

Audit and plan for turning the production ShiftSwap web app into an installable PWA. No code has been written yet — this is a planning document.

Last updated: 2026-05-17.

---

## 1. Current state assessment

### Stack snapshot (relevant bits)

| Area | Value | Source |
|------|-------|--------|
| Framework | Next.js **16.2.5**, App Router, **Turbopack dev** (`next dev --turbopack`) | [package.json](../package.json) |
| React | 19.0.0 | [package.json](../package.json) |
| Styling | Tailwind 3.4, mobile-first | [tailwind.config.ts](../tailwind.config.ts) |
| Auth | NextAuth 4.24, JWT strategy, custom `__Secure-next-auth.session-token` cookie | [src/lib/auth.ts](../src/lib/auth.ts) |
| Middleware | Next 16 **`proxy.ts`** (CSRF + `Cache-Control: private, no-store` on auth APIs) | [src/proxy.ts](../src/proxy.ts) |
| Observability | `@sentry/nextjs` 10 wrapping `next.config.ts` via `withSentryConfig`; `@vercel/analytics` | [next.config.ts](../next.config.ts), [sentry.client.config.ts](../sentry.client.config.ts) |
| Tour | `react-joyride` (client-only, demo `/demo` route) | [src/components/DemoTour.tsx](../src/components/DemoTour.tsx) |
| Other client deps | `next-auth`, `luxon`, `zod`, `ical-generator` | [package.json](../package.json) |
| Host | Vercel (prod `hcmcshiftswap.com`, demo `shiftswapper-demo.vercel.app`) | [docs/claude.md](claude.md) |

### Direct answers to the audit questions

**Q: Is `next.config.js` set up for PWA support?**
No. Only `withSentryConfig` is applied. Nothing else wraps the config. CSP is restrictive and currently has **no `worker-src` / `manifest-src`** directive (the browser falls back to `default-src 'self'`, which is permissive enough to register a same-origin SW but explicit allowances are best). See `cspDirectives` in [next.config.ts](../next.config.ts).

**Q: Do we have a `public/manifest.json` (or equivalent)?**
No. `public/` contains exactly one file: `shift-swapper-logo.svg`. There is no `manifest.json`, no `manifest.webmanifest`, no `favicon.ico`, no `apple-touch-icon.png`, no `icon-192.png`, no `icon-512.png`. The `proxy.ts` matcher already excludes `favicon.ico` and `shift-swapper-logo.svg`, anticipating those assets.

**Q: Service worker files?**
None. No `sw.js`, no `service-worker.ts`, no `app/sw/route.ts`, no Workbox / Serwist / next-pwa packages in `package.json`. No `navigator.serviceWorker.register` call anywhere in `src/`.

**Q: Are layouts mobile-first?**
Yes. Tailwind is mobile-first by convention and the codebase follows it:
- Root layout uses `min-h-screen flex flex-col` and a `Skip to content` link — good PWA / a11y foundation. See [src/app/layout.tsx](../src/app/layout.tsx).
- Nav and CTAs use `min-h-[44px]` / `min-h-[48px]` touch targets. See [src/components/NavBar.tsx](../src/components/NavBar.tsx) and [src/app/page.tsx](../src/app/page.tsx).
- Calendar grid and shift detail are explicitly designed mobile-first per [docs/ui.md](ui.md) §6.
- One gap: there is **no `viewport` export** on the root layout, so we are relying on Next.js's implicit default. We should add an explicit `viewport` export with `themeColor` and `width: 'device-width'` for proper standalone display.

**Q: Libraries that conflict with PWA / offline caching?**
- **NextAuth (cookie + JWT)** — works fine offline if the SW does not intercept `/api/auth/*`. Must be added to the SW bypass list. Custom `__Secure-` cookie name does not affect SW.
- **Sentry** — `withSentryConfig` wraps `next.config.ts`; PWA plugin must compose cleanly. Sentry's ingest URL (`https://*.ingest.sentry.io`) is already in `connect-src`. The SW must let Sentry's `fetch` beacons pass through (not cache them) or errors will be swallowed.
- **`proxy.ts` sets `Cache-Control: private, no-store`** on every non-public `/api/*` response. This is **good for privacy** but means we cannot lean on `stale-while-revalidate` for those endpoints via the HTTP cache; the SW would have to cache them in spite of the header (which we generally should not do for authenticated data anyway).
- **`react-joyride`** — pure client, no conflict. Heavy bundle though; not used outside `/demo`.
- **`@vercel/analytics`** — already in `connect-src`; same beacon-bypass rule applies.
- **Twilio / Resend / Prisma** — server-only, irrelevant to the SW.
- **Turbopack dev** — this is the critical conflict driver. `next-pwa` requires webpack; running it with Next.js 16 requires the `--webpack` flag and gives up Turbopack. Serwist (specifically `@serwist/next` / `@serwist/turbopack`) is the only actively maintained option for the Turbopack-default Next 16 era.

---

## 2. Files to be created or modified

### New files

- `public/manifest.webmanifest` — name, short_name, description, `start_url: "/"`, `scope: "/"`, `display: "standalone"`, `background_color: "#f8fafc"` (slate-50, matches body), `theme_color: "#2563eb"` (blue-600), `orientation: "portrait"`, `icons` array.
- `public/icon-192.png` — 192×192 maskable + any-purpose. Rastered from `shift-swapper-logo.svg` (or a square crop of the Rx emblem).
- `public/icon-512.png` — 512×512 maskable + any-purpose.
- `public/apple-touch-icon.png` — 180×180 (iOS does not read `manifest.webmanifest` icons properly).
- `public/favicon.ico` — already referenced by `proxy.ts` matcher; ship it now.
- `src/app/sw.ts` — Serwist service-worker source (precaches `_next/static` and selected app-shell routes, defines runtime caching strategies, bypass rules).
- `src/components/ServiceWorkerRegister.tsx` — `"use client"` component that registers the SW on mount; mounted once from the root layout.
- `src/app/offline/page.tsx` — minimal offline fallback (logo + "You're offline — open shifts you've already viewed are still available.").
- `docs/pwa-plan.md` — this file.

### Files to modify

- [next.config.ts](../next.config.ts)
  - Wrap with Serwist: `export default withSerwist(withSentryConfig(nextConfig, { ... }))`.
  - Configure Serwist options: `swSrc: "src/app/sw.ts"`, `swDest: "public/sw.js"`, `cacheOnNavigation: true`, `reloadOnOnline: true`, `disable: process.env.NODE_ENV === "development"`.
  - Update CSP: add `worker-src 'self'` and `manifest-src 'self'`; keep everything else.

- [src/app/layout.tsx](../src/app/layout.tsx)
  - Extend `metadata` with `manifest: "/manifest.webmanifest"`, `appleWebApp: { capable: true, statusBarStyle: "default", title: "ShiftSwap" }`, `icons: { icon: "/favicon.ico", apple: "/apple-touch-icon.png" }`.
  - Add a separate `viewport` export: `{ themeColor: "#2563eb", width: "device-width", initialScale: 1, viewportFit: "cover" }` (Next 15+ moved `themeColor` out of `metadata`).
  - Mount `<ServiceWorkerRegister />` inside `<body>`, after `<Analytics />`.

- [src/proxy.ts](../src/proxy.ts)
  - Add `manifest.webmanifest`, `sw.js`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, and `offline` to the matcher exclusion or treat them as static.
  - Optionally serve `/sw.js` with `Service-Worker-Allowed: /` and `Cache-Control: public, max-age=0, must-revalidate` (so updates roll out immediately).

- [src/app/robots.ts](../src/app/robots.ts)
  - Add `/offline` to `disallow` (utility page, not for indexing).

- [package.json](../package.json)
  - Add `@serwist/next` and `serwist` to `dependencies`; add `@types/serviceworker` to `devDependencies`.
  - No script changes required.

### Files explicitly **not** changed

- [src/lib/auth.ts](../src/lib/auth.ts), [src/lib/db.ts](../src/lib/db.ts), Prisma schema — server-only, untouched.
- Sentry config files — untouched; we only adjust the order of wrapping in `next.config.ts`.

---

## 3. Recommended PWA library

**Use `@serwist/next` (Serwist), not `next-pwa`.**

Rationale for our stack specifically:

- **Turbopack compatibility.** We run `next dev --turbopack` (see [package.json](../package.json) `"dev"` script). `next-pwa` is a webpack plugin; on Next.js 16 you cannot use it without forcing `next dev --webpack` / `next build --webpack` and giving up Turbopack. Serwist's `@serwist/turbopack` route-handler approach is designed for Next 16 Turbopack.
- **Active maintenance.** `next-pwa` (shadowwalker) has had no meaningful App Router updates and is widely flagged as unmaintained. Serwist is actively maintained, Workbox-based, and explicitly supports App Router as of 2025/2026.
- **Composes with `withSentryConfig`.** Serwist exports a `withSerwist(nextConfig, options)` HOC; we wrap Sentry first, then Serwist. Both transformations are config-level and don't conflict.
- **First-class TypeScript SW source.** `src/app/sw.ts` is a typed module rather than a string-templated webpack injection.
- **Workbox under the hood** with sensible defaults: `NetworkFirst` for HTML, `StaleWhileRevalidate` for `_next/static`, `CacheFirst` for fonts/icons.

Custom service worker (no library) is **not** recommended:
- Workbox-style precache manifest generation from `.next/static` is non-trivial to maintain by hand across releases.
- We would have to reimplement update flow, route matching, expiration, and Sentry/Vercel-Analytics bypass that Serwist provides.
- The maintenance cost is real and the marginal benefit over Serwist is near zero for our caching needs.

---

## 4. Risks and gotchas specific to this stack

1. **`Cache-Control: private, no-store` on auth APIs.** The proxy stamps every non-public `/api/*` response with `private, no-store`. Our SW must **not** runtime-cache `/api/*` responses except a small allowlist (e.g., `/api/locations`, `/api/roles` which are in `PUBLIC_API_PREFIXES`). Caching authenticated `/api/shifts` or `/api/me` would leak data between accounts on a shared device.

2. **NextAuth session cookie.** `/api/auth/*` issues `Set-Cookie` with `__Secure-` prefix and `SameSite=Lax`. The SW must pass these through untouched. Standard mitigation: add a `denylist`/`bypass` entry for `/api/auth/` in Serwist's `runtimeCaching` and `navigateFallbackDenylist`.

3. **`VerificationGate` redirects.** [src/components/VerificationGate.tsx](../src/components/VerificationGate.tsx) calls `fetch('/api/me')` on every authenticated navigation and `router.replace()` to `/check-email` or `/verify-phone` based on the response. If the SW serves a stale `/api/me`, users could be incorrectly redirected (or not redirected when they should be). **Do not cache `/api/me`.**

4. **Sentry beacons.** Sentry posts to `https://*.ingest.sentry.io`. If the SW intercepts and fails offline, errors are silently dropped. Serwist's default `NetworkOnly` for cross-origin beacons is fine, but we must verify and explicitly add `https://*.ingest.sentry.io` and `https://vitals.vercel-insights.com` to a `NetworkOnly` runtime route or a bypass list.

5. **CSP.** [next.config.ts](../next.config.ts) sets `default-src 'self'`. Service workers fall back to `default-src` for `worker-src` and `manifest-src`, so registration will work, but **explicit `worker-src 'self'` and `manifest-src 'self'` directives are best practice** and protect against future CSP tightening (e.g., removing `'unsafe-inline'` once we add nonces).

6. **iOS install behavior.**
   - iOS Safari ignores `manifest.icons` for the home-screen icon; it uses `/apple-touch-icon.png` (180×180) at the root. We must ship this file even if the manifest is correct.
   - iOS reloads the SW aggressively; precache size should stay well under 5 MB.
   - iOS does not support `display: "standalone"` background sync or push (yet — improving in iOS 26.x, but we should not rely on it).

7. **Demo mode data resets.** [vercel.json](../vercel.json) runs `/api/demo/reset` daily at 06:00 UTC. If a demo user installed the PWA and cached shift data, they would see stale shifts after a reset. Acceptable: demo shifts are not security-sensitive; the SW's `NetworkFirst` strategy for HTML will refresh on next online navigation.

8. **`react-joyride` and the SW.** Joyride manipulates the DOM on `/calendar`. Serwist's `NavigationRoute` for the app shell will serve the same HTML; we just need to ensure the SW does not serve a stale build artifact whose chunk hashes don't match the new HTML (Workbox precache handles this correctly because it's keyed on hashed filenames in `_next/static`).

9. **`withSentryConfig` ordering.** Sentry rewrites the build output (source maps, tunnel route). Serwist reads the final manifest. **Wrap Sentry first, then Serwist on the outside**: `withSerwist(withSentryConfig(nextConfig, sentryOpts), serwistOpts)`. Reversing the order risks Serwist precaching pre-Sentry chunk names that change post-Sentry-build.

10. **Dev experience.** Always pass `disable: process.env.NODE_ENV === "development"` to Serwist. A hot-reloading SW + Turbopack module replacement is a debugging nightmare.

11. **Update rollout.** A user with the PWA installed will keep the old SW until it's revalidated. Recommend `clientsClaim: true` + `skipWaiting: true` so new versions take over on next navigation. Trade-off: a long-lived tab can switch SW mid-session; acceptable for ShiftSwap because navigations are short.

12. **Sign-out and shared devices.** Pharmacy staff share tablets and computers at workstations. After sign-out we should `caches.delete()` any user-scoped caches. Mitigated by **only caching truly public/static assets and the app shell** — not API responses tied to a user.

13. **Sentry CSP `connect-src`.** The current `connect-src` allows `'self'`, Sentry, and Vercel only. No additional entries are needed for the SW (its registration is same-origin and Serwist does not call any third party). No CSP changes for `connect-src`.

---

## 5. Sequenced implementation task list

Phase-ordered so each step is independently testable.

### Phase A — Manifest + icons (no SW yet, no risk)
1. Generate `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png` from the existing logo. Maskable variants for 192/512.
2. Add `public/favicon.ico`.
3. Add `public/manifest.webmanifest` with `start_url: "/"`, `scope: "/"`, `display: "standalone"`, `theme_color: "#2563eb"`, `background_color: "#f8fafc"`, and the icon set.
4. Update [src/app/layout.tsx](../src/app/layout.tsx): add `manifest`, `appleWebApp`, `icons` to `metadata`; add new `viewport` export with `themeColor` and `viewportFit: "cover"`.
5. Update [src/proxy.ts](../src/proxy.ts) matcher to exclude `manifest.webmanifest`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`.
6. **Verify:** Lighthouse PWA section recognizes the manifest, icons, and theme color. Android Chrome shows "Add to Home Screen". iOS Safari uses the apple-touch-icon. No service worker yet — install will be partial on Chrome (no SW = no full installability, but manifest is valid).

### Phase B — Service worker via Serwist
7. `npm i @serwist/next serwist` and `npm i -D @types/serviceworker`.
8. Create `src/app/sw.ts` with:
   - Precache `self.__SW_MANIFEST` (Serwist auto-injects build assets).
   - `NetworkFirst` for navigations (HTML), with `/offline` as fallback.
   - `StaleWhileRevalidate` for `_next/static/**` and `_next/image`.
   - `CacheFirst` for `/icon-*.png`, `/apple-touch-icon.png`, `/shift-swapper-logo.svg`, `/favicon.ico`.
   - `NetworkOnly` (bypass) for `/api/auth/**`, `/api/me`, `/api/shifts/**`, `/api/bug-report`, `/api/demo/**`, `https://*.ingest.sentry.io/**`, `https://vitals.vercel-insights.com/**`.
   - Allow `StaleWhileRevalidate` only for `/api/locations`, `/api/roles` (public static lists).
   - `clientsClaim: true`, `skipWaiting: true`.
9. Create `src/components/ServiceWorkerRegister.tsx` (client component) and mount in root layout.
10. Create `src/app/offline/page.tsx` (static, no auth dependencies).
11. Update [next.config.ts](../next.config.ts):
    - `import withSerwist from "@serwist/next"`.
    - Add `worker-src 'self'` and `manifest-src 'self'` to `cspDirectives`.
    - Export `withSerwist({ swSrc: "src/app/sw.ts", swDest: "public/sw.js", disable: isDev, cacheOnNavigation: true, reloadOnOnline: true })(withSentryConfig(nextConfig, {...}))`.
12. Add `/offline` to `disallow` in [src/app/robots.ts](../src/app/robots.ts).
13. **Verify locally (production build):** `npm run build && npm start`. Confirm `/sw.js` is served, `Application > Manifest` and `Application > Service Workers` are green in Chrome DevTools, going offline still serves `/`, `/calendar` (shell), `/offline`, and static assets.

### Phase C — Production rollout
14. Deploy to a **preview branch** in Vercel first (not main). Check Sentry source maps still upload (Sentry plugin must not be broken by Serwist wrapping).
15. Smoke-test on a real iPhone (Safari → Share → Add to Home Screen) and a real Android device (Chrome → Install App).
16. Verify NextAuth login still works inside the installed standalone PWA (cookies persist; `useSession()` rehydrates).
17. Verify SMS-on-cover flow end-to-end while installed: the SW must not intercept POST `/api/shifts/[id]/cover` or `/api/auth/*`.
18. Verify Sentry receives errors thrown inside the standalone PWA.
19. Merge to `main`; Vercel deploys to production (`hcmcshiftswap.com`).
20. Deploy to the demo project (`shiftswapper-demo.vercel.app`) — same code, no separate work.

### Phase D — Optional follow-ups (not in initial scope)
- Push notifications via Web Push (requires VAPID key + service-worker `push` listener; Twilio SMS already covers the notification gap, so this is low-priority).
- Background sync for offline-posted shifts (likely unnecessary for our use case — pharmacy staff post from a stable connection at workstations).
- Web Share Target so the install can receive `/post?...` deep links from other apps.
- Periodic background sync to refresh the calendar feed (low ROI; daily reset on the demo and live data elsewhere).

---

## Open questions for confirmation

1. **Branding for the app icon** — use the existing Rx emblem from `shift-swapper-logo.svg`, or a simplified square mark? (The current SVG is wordmark + emblem at 480×140 — needs cropping for square icons.)
2. **Theme color** — proposed `#2563eb` (Tailwind blue-600, matches primary CTAs). Confirm or override.
3. **Offline scope** — confirm we should **not** cache any authenticated shift data on-device (privacy-conservative default), even though that means the offline experience is limited to the app shell + the `/offline` page. Pharmacy-shared devices argue strongly for "no, don't cache user data."
4. **PWA on the demo project too?** Default yes (same code), but the demo has aggressive data resets — confirm we want users to be able to "install" the demo.
