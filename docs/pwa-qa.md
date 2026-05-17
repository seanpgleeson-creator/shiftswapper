# ShiftSwap PWA — QA Checklist

Use this document every time you test a PWA-related deploy. It covers four areas: Chrome DevTools inspection, Lighthouse audit, iOS install, and Android install. Each section has pass/fail criteria tied to our specific implementation.

**Production URL:** `https://hcmcshiftswap.com`  
**Service worker URL:** `https://hcmcshiftswap.com/serwist/sw.js`  
**Manifest URL:** `https://hcmcshiftswap.com/manifest.webmanifest`

---

## 1. Chrome DevTools — Application tab

This is the fastest mechanical check. Do this first, on desktop Chrome, before going to any real device.

### Step-by-step

1. Open `https://hcmcshiftswap.com` in Chrome.
2. Open DevTools (`Cmd+Option+I` / `F12`).
3. Go to **Application** tab.

#### 1a. Manifest panel

Click **Manifest** in the left sidebar.

| What to check | Expected value | Pass? |
|---|---|---|
| Identity → Name | `ShiftSwap` | |
| Identity → Short name | `ShiftSwap` | |
| Presentation → Start URL | `/` | |
| Presentation → Theme color | `#1a4a3a` (deep teal) | |
| Presentation → Background color | `#f8fafc` | |
| Presentation → Display | `standalone` | |
| Icons | Two entries — 192×192 and 512×512 | |
| Icons → purpose | `any maskable` on both | |
| Installability section | No errors listed | |
| Shortcuts | "Browse Shifts" → `/calendar` and "Post a Shift" → `/post` | |

If any icon shows a broken image, the PNG file is missing or the path is wrong in `public/icons/`.

#### 1b. Service Workers panel

Click **Service Workers** in the left sidebar.

| What to check | Expected value | Pass? |
|---|---|---|
| Source | `/serwist/sw.js` | |
| Status | **activated and running** (green dot) | |
| Clients | Shows the current tab URL | |
| No errors in the console | No red lines | |

If the SW shows "waiting to activate", click **skipWaiting** — this is normal on first install when a previous SW is present. In production with fresh users it will activate immediately (we use `skipWaiting: true`).

#### 1c. Cache Storage panel

After navigating to `/`, `/calendar`, and `/post`, click **Cache Storage** in the left sidebar.

| Cache name | What should be in it |
|---|---|
| `serwist-precache-v2-...` | The 45 precache entries (JS/CSS chunks, pages) |
| `pages` | Visited page HTML (NetworkFirst) |
| `next-static` | `_next/static/**` chunk files |
| `pwa-assets` | Icons, favicon, logo SVG |
| `api-public` | `/api/locations` and `/api/roles` responses |

**The following should NOT appear in any cache:**

- `/api/me` responses
- `/api/shifts/...` responses
- `/api/auth/...` responses
- Any response containing `Set-Cookie` headers

To verify, click any cache entry and inspect the **Headers** tab. Confirm no `Set-Cookie` is present.

#### 1d. Simulate offline and verify fallback

1. In the Service Workers panel, check the **Offline** checkbox.
2. Reload the page.
3. **Expected:** The `/offline` page loads (ShiftSwap logo, "You're offline" heading, "Try again" link). The browser should NOT show Chrome's dinosaur error page.
4. Navigate to `/calendar` while still offline.
5. **Expected:** Either the cached version of `/calendar` loads (if you visited it before going offline) or the `/offline` page loads. Never a blank screen or browser error.
6. Uncheck **Offline** before continuing.

---

## 2. iOS Safari — Install prompt and installed behavior

> **Important:** The install banner (`IosBanner.tsx`) only appears in iOS Safari. It does not appear in Chrome for iOS, Firefox for iOS, or any desktop browser. Verify from a real iPhone or iPad, not a simulator.

### Prerequisites

- A real iPhone or iPad (not a simulator — `navigator.standalone` is not available in the iOS Simulator).
- Safari browser (not Chrome or Firefox).
- The device must be on a network that can reach `hcmcshiftswap.com`.
- Clear the `localStorage` key `shiftswap-ios-banner-dismissed` before testing the first-visit banner (instructions below).

### 2a. First-visit banner

1. Open `hcmcshiftswap.com` in iOS Safari for the first time (or after clearing storage).
2. Wait approximately 1 second.
3. **Expected:** The dark teal install banner slides up from the bottom of the screen. It shows:
   - The Rx emblem icon
   - "ShiftSwap" headline in Fraunces italic
   - "Install App" label in DM Sans
   - Three numbered steps: tap Share → tap Add to Home Screen → tap Add
   - A warm amber "Got it" button
   - An ✕ dismiss button in the top-right corner

4. Tap the **✕** button.
5. **Expected:** Banner dismisses. Reload the page and wait 1 second.
6. **Expected:** Banner does NOT reappear (persisted in `localStorage`).

**To reset the banner for re-testing:**  
Open Safari DevTools (Mac → Safari → Develop → [your device name] → hcmcshiftswap.com → Console) and run:
```js
localStorage.removeItem('shiftswap-ios-banner-dismissed');
location.reload();
```

### 2b. Banner does not show when already installed

1. Install the app (follow steps in §2c below).
2. Open the installed app from the home screen.
3. **Expected:** No banner appears. The app is already in standalone mode (`window.navigator.standalone === true`), so `IosBanner` exits early.

### 2c. Install to home screen

1. Open `hcmcshiftswap.com` in iOS Safari.
2. Tap the **Share** button (the box-with-arrow icon in the Safari toolbar — bottom center on iPhone, top right on iPad).
3. Scroll down in the share sheet and tap **Add to Home Screen**.
4. Confirm the name shows **ShiftSwap** and the icon is the teal Rx emblem.
5. Tap **Add**.

### 2d. Verify the installed app

After adding to home screen:

| What to check | Expected |
|---|---|
| Home screen icon | Teal square with Rx emblem (no white border/letterbox) |
| App name under icon | `ShiftSwap` |
| Tap icon — app launches | Full-screen, no Safari address bar or bottom tab bar |
| Status bar | Deep teal (`#1a4a3a`) — matches theme_color |
| Log in | Auth works normally (session cookie persists) |
| Navigate to `/calendar` | Page loads, calendar grid renders |
| Post a shift at `/post` | Form loads, submission works |
| Log out | Redirects to `/` |
| Re-open app from home screen | Returns to `/` (start_url) |

### 2e. iOS offline behavior

With the app installed:

1. Go to `/calendar`, let it load fully.
2. Enable Airplane Mode.
3. Tap the home screen icon to re-open (or reload).
4. **Expected:** `/calendar` page shell loads from the ServiceWorker cache (NetworkFirst, 10s timeout). The calendar grid will appear but shift data (`/api/shifts`) will fail — a loading or error state is expected, not a blank screen.
5. Navigate to a page you have NOT visited (e.g., `/post` if you only visited `/calendar`).
6. **Expected:** Either the page loads from precache (app shell precached) or the `/offline` page appears. Never a browser-level network error.
7. Disable Airplane Mode and reload.
8. **Expected:** App recovers immediately and shows live data.

---

## 3. Android Chrome — Install banner and installed behavior

Android Chrome shows a native "Add to Home Screen" banner when the PWA criteria are met (HTTPS, manifest with 192px icon, service worker active). Unlike iOS, you do not need to manually educate users — Chrome handles the install UI.

### 3a. Verify install eligibility

1. Open `hcmcshiftswap.com` in Chrome for Android.
2. Wait a few seconds on the landing page.
3. **Expected:** Chrome shows a bottom sheet or "Add ShiftSwap to Home screen" mini-bar.
   - If it does not appear immediately, tap the Chrome menu (⋮) → **Add to Home screen** manually.
4. Tap **Add** (or **Install** in newer Chrome).
5. **Expected:** Icon appears on the home screen.

### 3b. Verify the installed app

| What to check | Expected |
|---|---|
| Home screen icon | Teal square, Rx emblem |
| App name | `ShiftSwap` |
| Launch from home screen | Full-screen, no Chrome address bar |
| Status bar color | Deep teal |
| Auth / Calendar / Post flows | Work as normal |

### 3c. Android offline behavior

Same test as iOS §2e — visit `/calendar`, toggle Airplane Mode, reload. Expect cached shell or `/offline` page, not a Chrome network error.

---

## 4. Lighthouse PWA audit

Lighthouse gives a formal score with actionable findings.

### How to run

1. Open `https://hcmcshiftswap.com` in Chrome (not Incognito — service worker must be active).
2. Open DevTools → **Lighthouse** tab.
3. Select categories: **Progressive Web App** only (uncheck the others for speed).
4. Device: **Mobile**.
5. Click **Analyze page load**.

### What to look for

Lighthouse PWA audit does not give a numeric score — it returns pass/fail per check. All of the following should pass:

**Installable**
- Registers a service worker — ✓ `/serwist/sw.js` is registered
- Responds with 200 when offline — ✓ precache + `/offline` fallback
- Has a `<meta name="viewport">` — ✓ viewport export in layout.tsx
- Web app manifest meets minimum requirements — ✓ name, icons, start_url, display
- Manifest's icons are at least 192px — ✓ 192×192 and 512×512 provided
- Manifest has `display: standalone` — ✓

**PWA Optimized**
- Redirects HTTP traffic to HTTPS — ✓ Vercel enforces this
- Configured for a custom splash screen — ✓ background_color + theme_color + icons in manifest
- Themed address bar — ✓ theme_color `#1a4a3a`
- Defines a maskable icon — ✓ `purpose: "any maskable"` on both icons
- Content is sized correctly for the viewport — verify no horizontal scroll on mobile

**Common failures and their fixes:**

| Lighthouse failure | Likely cause | Fix |
|---|---|---|
| "Service worker does not successfully serve the page offline" | SW not yet activated (first visit) | Visit the page, wait 5s, re-run audit |
| "Manifest could not be fetched" | CSP blocking `manifest-src` | Verify `manifest-src 'self'` is in CSP in next.config.ts |
| "Service worker registration failed" | CSP blocking `worker-src` | Verify `worker-src 'self'` is in CSP |
| "Maskable icon not present" | Icon purpose format mismatch | Verify manifest uses `"purpose": "any maskable"` (space-separated, not comma) |
| Icons fail to load | Path wrong or file missing | Open `/icons/icon-192x192.png` in browser — should show the Rx emblem |

---

## 5. ShiftSwap-specific flow testing

These tests are specific to our app and its authentication/data model. Run them from the installed PWA on a real device.

### 5a. Authentication persists across installs

| Step | Expected |
|---|---|
| Log in at `hcmcshiftswap.com` in Safari | Session established |
| Install the app (§2c) | — |
| Open from home screen | Lands on `/` — session is still active (CTA shows "Browse Shifts") |
| Close app, wait 10 minutes, re-open | Still logged in (JWT session maxAge = 30 days) |
| Log out from installed app | Redirects to `/`, "Log in" CTA shown |

### 5b. VerificationGate works in standalone mode

| Step | Expected |
|---|---|
| Sign up with email that has not verified | After login, redirected to `/check-email` — even from standalone |
| Open standalone app as a user with `sms_consent` but `phone_verified=false` | Redirected to `/verify-phone` — gate works from home screen |

### 5c. Calendar browsing (the core flow)

| Step | Expected |
|---|---|
| Navigate to `/calendar` while online | Shifts load, calendar grid renders, pay-period banding visible |
| Click a day with shifts | Shift list panel appears |
| Click a shift card | Shift detail opens |
| Go offline (Airplane Mode), reload `/calendar` | Calendar shell loads from SW cache; shift list may be empty or show cached state — no blank screen |
| API call to `/api/shifts` while offline | Fails gracefully (NetworkOnly → error state in UI, not a crash) |
| Come back online | Data reloads automatically |

**Key assertion:** `/api/shifts/...` must NEVER be served from cache. If a shift appears "covered" in the offline cached state but is actually still open (or vice versa), a staff member could make a decision based on stale data. This is why the SW uses NetworkOnly for all shift routes.

### 5d. Posting a shift

| Step | Expected |
|---|---|
| Navigate to `/post` while online | Form loads |
| Fill in shift date, time, location | Inline validation works |
| Submit while offline | POST to `/api/shifts` fails; form should show an error state — the post is NOT queued silently |
| Come back online | User must re-submit manually |

Background sync is intentionally not implemented (see pwa-plan.md Phase D). Shifts must be submitted over an active connection.

### 5e. Covering a shift

| Step | Expected |
|---|---|
| Navigate to `/calendar`, select a shift | Shift detail opens |
| Tap "Cover This Shift" while online | Confirmation dialog appears |
| Confirm | POST to `/api/shifts/[id]/cover` succeeds |
| Attempt to cover a shift while offline | POST fails; error message displayed — shift is not double-covered |
| Poster receives SMS (when Twilio active) | SMS arrives within ~30 seconds |

### 5f. Notifications and Sentry — in the installed app

| Step | Expected |
|---|---|
| Submit a bug report from `/bug-report` inside installed app | POST succeeds; report is logged server-side |
| Trigger a JS error (e.g., manually throw in console: `throw new Error('pwa test')`) | Error appears in Sentry Issues (requires DSN env var set) |
| Sentry beacon (`https://*.ingest.sentry.io`) while online | Fires normally — NetworkOnly so SW passes it through |
| Sentry beacon while offline | Silently dropped — expected and acceptable |

### 5g. Shared-device account isolation

Pharmacy workstations may be shared. This is the most security-sensitive flow.

| Step | Expected |
|---|---|
| Log in as User A, visit `/calendar` and `/account` | Data loads for User A |
| Log out | Redirected to `/` |
| Log in as User B (same browser, same device) | Data loads for User B only |
| Inspect Cache Storage in DevTools | No `/api/me` or `/api/shifts` responses cached — **cache must be empty of user-specific data** |
| Clear all browser data and reload | SW re-registers, precache re-populates; no stale User A data |

---

## 6. iOS banner edge case testing

| Scenario | Expected behavior |
|---|---|
| First visit, iOS Safari | Banner appears after ~800ms |
| Tap ✕ to dismiss | Banner gone; never shows again on this device |
| Tap "Got it" button | Same: banner gone, never shows again |
| Second visit, same Safari session | No banner |
| Clear `localStorage`, reload | Banner reappears |
| Visit from Chrome for iOS | No banner (UA check excludes CriOS) |
| Visit from Firefox for iOS | No banner (UA check excludes FxiOS) |
| Visit from Mac Safari | No banner (not iOS device) |
| App is already installed, open from home screen | No banner (`isStandalone()` returns true) |
| Visit while offline on iOS | Banner may not appear (depends on whether the page loaded from cache) — acceptable |

---

## 7. Quick smoke test — for every deploy

Before signing off on any PWA-affecting deploy, run this abbreviated list:

- [ ] `https://hcmcshiftswap.com/serwist/sw.js` responds 200 with `Content-Type: application/javascript`
- [ ] `https://hcmcshiftswap.com/manifest.webmanifest` responds 200 with `Content-Type: application/manifest+json`
- [ ] `https://hcmcshiftswap.com/icons/icon-192x192.png` responds 200
- [ ] `https://hcmcshiftswap.com/apple-touch-icon.png` responds 200
- [ ] Chrome DevTools → Application → Service Workers: status is **activated and running**
- [ ] Chrome DevTools → Application → Manifest: no errors, icons load
- [ ] Offline checkbox → reload: `/offline` page appears (not Chrome's dino)
- [ ] Log in → navigate to `/calendar` → log out: no auth data appears in Cache Storage
- [ ] iOS Safari real device: install banner shows on first visit, suppressed after dismiss

---

## 8. Notes on our specific SW architecture

Keep these in mind when debugging unexpected caching behavior:

- **SW URL is `/serwist/sw.js`, not `/sw.js`.** The SW is compiled by the route handler at `/serwist/[path]/route.ts` and served at this path. Chrome DevTools will show it registered at `https://hcmcshiftswap.com/serwist/sw.js`. This is different from a classic `public/sw.js` setup.

- **SW is disabled in development.** `process.env.NODE_ENV === "development"` disables the SW in `next dev`. To test SW behavior, run `npm run build && npm start` and open `http://localhost:3000`, or test on the deployed production URL.

- **`skipWaiting: true` + `clientsClaim: true`.** A new SW version activates immediately on the next page load without requiring the user to close all tabs. If you are testing an update, reload once after deploy to trigger the takeover.

- **45 precache entries.** If you see significantly fewer entries in Cache Storage after a deploy, the build may have failed to generate the precache manifest. Recheck the Vercel build log for `(serwist) X precache entries`.

- **`Cache-Control: private, no-store`** is set by `proxy.ts` on all non-public API routes. The SW respects this for all our auth routes (NetworkOnly). The `private, no-store` header does not affect the SW's ability to serve precached static assets.
