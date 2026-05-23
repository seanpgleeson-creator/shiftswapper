# Handoff: ShiftSwap — resume here

Use this when picking up the project. See [docs/todo.md](todo.md) for the full checklist and [docs/current-status.md](current-status.md) for production status.

---

## Recent fix: login redirect loop (post-security-hardening)

Commit `b80b493` ("Security hardening") added an auth guard in `src/proxy.ts` that called `getToken()`. In Next.js 16, `proxy.ts` (formerly `middleware.ts`) is documented as **not** for authentication — `getToken()` returns `null` at the proxy runtime when `authOptions` overrides `cookies.sessionToken.name` (which the same commit added to `src/lib/auth.ts`). This caused every click to `/calendar`, `/post`, `/account`, etc. to redirect to `/login`, even for authenticated users.

**Fix applied:**
- Removed the auth guard, `PROTECTED_PAGES` constant, `isProtectedPage()` helper, and `getToken` import from `src/proxy.ts`. Kept the CSRF Origin check and `Cache-Control: private, no-store` blocks.
- Added missing `useSession()` redirect guards (`router.replace("/login")` on `status === "unauthenticated"`) to `src/app/bug-report/page.tsx` and `src/app/account/page.tsx`.
- Auth remains enforced: client-side via `useSession()` on all protected pages; server-side via `getServerSession()` on all protected API routes.

**Do not re-add auth to `proxy.ts` unless you migrate to NextAuth v5's `auth()` helper**, which is designed to work in the proxy/edge context.

---

## Demo site

**Goal:** A publicly shareable demo at `shiftswapper-demo.vercel.app` with fake pre-populated shifts so anyone can try the product without signing up.

**Architecture:**
- Separate Vercel project `shiftswapper-demo` pointing to the same GitHub repo
- Its own Neon database (connected via Vercel Storage) — fully isolated from production
- Gated by `DEMO_MODE=true` / `NEXT_PUBLIC_DEMO_MODE=true` env vars on the demo project only
- The seed script (`prisma/seed.ts`) is shared code; it creates demo users and shifts only when `DEMO_MODE=true`

**Demo credentials:**

| User | Email | Password | Role |
|------|-------|----------|------|
| Demo User | `demo@shiftswapper.app` | `demo1234` | Member |
| Admin Demo | `admin@shiftswapper.app` | `admin1234` | Admin |
| Jamie Rivera | `jamie.rivera@shiftswapper.app` | `demo1234` | Member |
| Morgan Chen | `morgan.chen@shiftswapper.app` | `demo1234` | Member |

All users are seeded with `emailVerified: true` and `smsConsent: false` so the `VerificationGate` never blocks them.

**Phase status:**

| Phase | Status |
|-------|--------|
| 1 — Vercel project + Neon DB + env vars | Done |
| 2 — Seed script expanded + committed; DB migration + seeding | Done |
| 3 — One-click demo login button + demo banner | Done |
| 4 — Auto-reset cron | Done — `GET|POST /api/demo/reset` + `vercel.json` cron at 06:00 UTC |
| 5 — Public landing page + guided tour | **Shipped** (commit `c2b3da0`) — see blocker below |

**Phase 5 — what was built (commit `c2b3da0`):**
- New public landing page at `/` with "Try the Demo" and "Log in" CTAs replacing the authenticated home
- `/demo` route: auto-logs in as `demo@shiftswapper.app` / `demo1234`, sets `sessionStorage.demo_tour_active = true`, redirects to `/calendar`
- `src/components/DemoTour.tsx`: react-joyride 6-step guided tour (welcome → calendar grid → month nav → location filters → shift list → Post a Shift nav link), ends with a sign-up CTA modal
- `data-tour` attributes added to calendar grid, nav, filter bar, shift list panel, and Post a Shift nav link
- `/demo` added to `VerificationGate` allowlist so the auto-login isn't interrupted by the verification check

**Phase 5 — auth-aware homepage (follow-up fix):**
- `src/app/page.tsx` is now a client component using `useSession()`.
- **Unauthenticated:** unchanged — "Try the Demo" (external demo link) + "Log in" + "No account needed to try the demo." subtext.
- **Authenticated:** CTA row replaced with "Browse Shifts" → `/calendar` (primary) and "Post a Shift" → `/post` (secondary); demo/login buttons and demo subtext are hidden.
- **Loading:** CTA row rendered with `opacity-0` to prevent a visible swap flash.

**⚠ Known blocker — resume here tomorrow:**

The "Try the Demo" button on the production landing page (`hcmcshiftswap.com`) currently links to `/demo` on the same host. But the demo user (`demo@shiftswapper.app`) does not exist in the production database, and `DEMO_MODE` is intentionally **not** set on production — setting it would be dangerous: the daily cron calls `/api/demo/reset`, which runs `prisma.user.deleteMany({ where: { email: { notIn: DEMO_USER_EMAILS } } })` and would wipe all real users.

**Fix (one-line change):** In `src/app/page.tsx`, change the Try Demo `href` from `/demo` to `https://shiftswapper-demo.vercel.app/demo`. Both projects deploy from the same repo so the `/demo` route already exists on the demo subdomain. See todo.md Phase 5 checklist.

**To refresh demo data** (after schema changes or to wipe clutter):
```bash
DEMO_MODE=true DATABASE_URL="<demo DATABASE_URL>" npx prisma migrate reset --force
```
Do **not** use `migrate deploy` on the demo DB — it errors with P3005 once tables exist.

Full checklist: see **Demo Site** section in [docs/todo.md](todo.md).

---

## Current state (what's done)

### Auth and verification (Feature 14)

- **Signup:** Email required. SMS is optional via "Get text when your shift is covered?" If checked, phone is required and validated at signup.
- **Verify-email redirect:** If user opted into SMS (phone + `sms_consent`) and is not phone-verified -> redirect to **/verify-phone**; else -> **/calendar**.
- **Access gate:** Email verification is always required. Phone verification is required only when `sms_consent && phone && !phone_verified`.
- **Account:** Users can add/update phone via PATCH `/api/me`; SMS verify flow appears only when needed.
- **SMS on cover:** Sent only when poster has `sms_consent` and `phone_verified`; Twilio still pending toll-free approval.

### Toll-free compliance and branding updates (new)

- Product branding is now **ShiftSwap** (user-facing copy updated across UI, SMS/email text, and calendar descriptions).
- Footer now shows **ShiftSwap**, includes **About** link, and states: "Built and operated by Sean Gleeson."
- New public **/about** page includes business description and visible contact info:
  - Address: 20475 Summerville Road, Deephaven, MN 55331
  - Phone: 952-393-6886
  - Email: sean@hcmcshiftswap.com
- Privacy and Terms pages updated to ShiftSwap branding, domain email, mailing address, and phone; draft wording removed.
- Verification gate now allows `/about`, `/privacy`, `/terms` so these pages remain reachable for review.

### Sentry and bug reporting (Feature 15)

- **Sentry SDK:** `@sentry/nextjs` integrated with `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, and `src/instrumentation.ts`.
- **Error boundaries:** Root, global, calendar, and account error boundaries capture exceptions to Sentry.
- **Bug report:** `/bug-report` page + POST `/api/bug-report`; nav includes "Report a Bug" for authenticated users.
- **Sentry project setup in progress:** org `shift-swap`, project `javascript-nextjs`; env vars need to be finalized in Vercel and deployed.

### Deploy status

- Production deploy target: `main` branch -> Vercel.
- Latest work in this session updates branding/compliance and Twilio-readiness; commit and push are still required.

---

## System context

ShiftSwap operates separately from the company's UKG scheduling system. A manual transfer is required from ShiftSwap into UKG. SMS/text notifications bridge that gap (e.g., prompt poster to send shift officially in UKG).

---

## PWA — shipped 2026-05-17, QA'd on desktop Chrome 2026-05-17

ShiftSwap is a full installable PWA. Production smoke test passed. Real-device iOS test still outstanding.

**Architecture:** `@serwist/turbopack` (not `next-pwa` or `@serwist/next`). Next.js 16 uses Turbopack for production builds, so only the Turbopack route-handler approach works. The SW is compiled at build time by esbuild via the route handler at `src/app/serwist/[path]/route.ts` and served at `/serwist/sw.js`.

**Key files:**

| File | Purpose |
|------|---------|
| `public/manifest.webmanifest` | Web app manifest — deep teal theme, name/icons/shortcuts |
| `public/icons/icon-192x192.png`, `icon-512x512.png` | App icons (separate `any` + `maskable` entries in manifest) |
| `public/icons/shortcut-calendar.png`, `shortcut-post.png` | 96×96 shortcut icons for Android long-press menu |
| `public/apple-touch-icon.png` | 180×180 iOS home screen icon |
| `public/favicon.ico`, `favicon-32x32.png` | Favicon |
| `src/app/sw.ts` | Service worker source — NetworkOnly for all auth/user APIs, NetworkFirst for pages, CacheFirst for icons |
| `src/app/serwist/[path]/route.ts` | Serwist esbuild Route Handler that produces `/serwist/sw.js` |
| `src/components/ServiceWorkerRegister.tsx` | `ServiceWorkerProvider` — wraps app in layout.tsx |
| `src/app/offline/page.tsx` | Offline fallback page |
| `src/components/IosBanner.tsx` | iOS Safari install education banner (DM Sans + Fraunces, teal/amber palette) |
| `scripts/generate-pwa-icons.mjs` | Re-runnable icon generation script (uses sharp) — run after any brand change |

**iOS banner:** Detects iOS Safari (not Chrome/Firefox on iOS, not desktop). Persists dismissal in `localStorage` key `shiftswap-ios-banner-dismissed`. Does not show if already running in `standalone` mode. Step-by-step: Share icon → Add to Home Screen → Add.

**Caching rules (important — do not loosen):**
- `/api/auth/*`, `/api/me`, `/api/shifts/*`, `/api/admin/*`, `/api/bug-report`, `/api/demo/*` → **NetworkOnly** (shared pharmacy devices, auth data)
- `/api/locations`, `/api/roles` → StaleWhileRevalidate (public static lists only)
- Sentry + Vercel Analytics beacons → NetworkOnly
- Pages → NetworkFirst (10s timeout), fallback to `/offline`
- `_next/static/**` → StaleWhileRevalidate
- Icons / favicon / logo → CacheFirst (also precached at build time)

**CSP additions:** `worker-src 'self'` and `manifest-src 'self'` added to `next.config.ts`.

**Desktop Chrome smoke test results (2026-05-17, fully resolved 2026-05-23):**
- SW registered at `/serwist/sw.js` — activated and running ✓
- Manifest valid — name, theme color, icons, shortcuts all correct ✓
- Offline fallback (`/offline` page) confirmed ✓
- No auth data in Cache Storage ✓
- Manifest icon purpose warnings fixed — each icon now has separate `any` + `maskable` entries ✓
- Shortcut icons (96×96) added — calendar + post shortcuts show branded icons ✓
- `/api/shifts` base route NetworkOnly fix deployed (commit `10c4a72`) — stale `apis` cache entry manually cleared ✓
- Cache Storage confirmed clean: `apis` cache contains no shift data after fix ✓

**Remaining QA (see docs/pwa-qa.md):**
- Real iPhone smoke test — iOS Safari install banner, Add to Home Screen, standalone mode
- Verify VerificationGate redirects work from the installed standalone app
- Sentry error capture from installed PWA (requires DSN env var first)
- SMS cover flow from installed PWA (requires Twilio activation first)

---

## Immediate next steps

1. **Fix the Try Demo button (one-line change)**
   - In `src/app/page.tsx`, change the "Try the Demo" `href` from `/demo` to `https://shiftswapper-demo.vercel.app/demo`.
   - Commit and push to `main`; Vercel deploys in ~1 minute.
   - Verify on the demo subdomain: `shiftswapper-demo.vercel.app` landing → Try Demo → auto-login → tour starts → finish → sign-up CTA.

2. **Wire up the demo subdomain (manual Vercel steps)**
   - Confirm `DEMO_MODE=true` and `NEXT_PUBLIC_DEMO_MODE=true` are set on the **demo** Vercel project.
   - Confirm `CRON_SECRET` is set on the demo project (generate with `openssl rand -base64 32`).
   - Trigger a manual reset to seed demo users: `curl -X POST https://shiftswapper-demo.vercel.app/api/demo/reset -H "Authorization: Bearer <CRON_SECRET>"` — should return `{"ok":true,...}`.

3. **Finalize Sentry activation**
   - In Vercel (production) set: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG=shift-swap`, `SENTRY_PROJECT=javascript-nextjs`, and optional `SENTRY_AUTH_TOKEN`.
   - Redeploy and verify via `/bug-report` submission and Sentry Issues.

4. **Activate Twilio SMS in production** — toll-free verification is approved.
   - Confirm `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` (`+18443144554`) are set in Vercel production env vars.
   - Redeploy if env vars were just added.
   - Test end-to-end: signup with SMS opted in → verify email → verify phone (SMS code) → cover a shift → confirm poster receives SMS.

---

## Key paths and docs

| Area | Path / doc |
|------|------------|
| Gate | `src/components/VerificationGate.tsx` |
| Signup | `src/app/signup/page.tsx`, `src/lib/validation.ts` |
| Verify-email redirect | `src/app/api/auth/verify-email/route.ts` |
| Account + phone | `src/app/account/page.tsx`, PATCH `src/app/api/me/route.ts` |
| About/Privacy/Terms | `src/app/about/page.tsx`, `src/app/privacy/page.tsx`, `src/app/terms/page.tsx` |
| Footer | `src/components/Footer.tsx` |
| SMS | `src/lib/sms.ts`; cover route: `src/app/api/shifts/[id]/cover/route.ts` |
| Email templates | `src/lib/email.ts` |
| Sentry config | `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation.ts`, `next.config.ts` |
| Error boundaries | `src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/calendar/error.tsx`, `src/app/account/error.tsx` |
| Bug report | `src/app/bug-report/page.tsx`, `src/app/api/bug-report/route.ts` |
| Execution checklist | [todo.md](todo.md) |
| Status doc | [current-status.md](current-status.md) |
| Toll-free checklist | [toll-free-sms-compliance.md](toll-free-sms-compliance.md) |
