# ShiftSwapper Execution Checklist

Feature-driven development: each phase delivers an end-to-end slice you can **test in production**. Hosting is **GitHub + Vercel**; use production Postgres and verify each feature live after deploy. No separate staging.

- **PRD and scope:** [docs/prd.md](prd.md)
- **UI details:** [docs/ui.md](ui.md)
- **API and data:** [docs/backend.md](backend.md)

---

## Phase 0: Foundation

Goal: A deployable Next.js app with a database and a working "test in production" path.

### App and database

- [x] Initialize Next.js (App Router, TypeScript)
- [x] Add Prisma; configure PostgreSQL (prod) and optionally SQLite (local)
- [x] Define schema: `shifts` and `settings` tables per [docs/backend.md](backend.md)
- [x] Create and run migrations
- [x] Add `.env.example` with `DATABASE_URL`, and later `RESEND_API_KEY` (or SendGrid), `SCHEDULER_EMAIL`
- [x] Seed script: insert single `settings` row (`scheduler_email`, `timezone` default `America/Chicago`)

### Repo and hosting

- [x] Create GitHub repo and push initial code
- [x] Connect repo to Vercel; ensure `main` deploys to production
- [x] Add production Postgres (Vercel Postgres, Neon, or Supabase); set `DATABASE_URL` in Vercel
- [x] Run migrations and seed in production (manual or via deploy script)

**PARALLEL:** Repo + Vercel setup can happen alongside local Next.js + Prisma; then connect Vercel to the repo and wire the DB.

**Verify in production:** App loads on Vercel URL; no runtime errors. (No UI features yet.)

---

## Phase 1: Shell and Landing

Goal: Live site with navigation and placeholders so every route exists.

### Pages and layout

- [x] NavBar: Home, Post a Shift, Browse Shifts (routes: `/`, `/post`, `/calendar`)
- [x] Footer: link to Upcoming Features (`/upcoming-features`)
- [x] Landing page (`/`): hero tagline + two action cards (Post a Shift → `/post`, Browse Shifts → `/calendar`)
- [x] Upcoming Features banner/callout on landing linking to `/upcoming-features`
- [x] Placeholder pages: `/settings` and `/account` — "Coming soon" (no 404)
- [x] Base layout and responsive breakpoints per [docs/ui.md](ui.md) (e.g. &lt; 640px, 640–1024px, &gt; 1024px)

**PARALLEL:** Nav + Footer + layout can be built while landing content and placeholder pages are built.

**Verify in production:** Landing loads; all nav links work; `/settings` and `/account` show "Coming soon."

---

## Feature 1: Post a Shift

### Backend

- [x] `GET /api/locations` — return the 10 pharmacy location names (constants)
- [x] `GET /api/roles` — return role names (MVP: `["Pharmacist"]`)
- [x] `POST /api/shifts` — Zod validation; Prisma create; response **omits** `poster_email`, `poster_phone`
- [x] Consistent error envelope: `{ "error", "code" }` and `fields` for validation errors

### Frontend

- [x] `/post` page: when authenticated, form fields — Shift Date (default tomorrow), Start Time, End Time, Location (dropdown); name, email, role, and phone from session (no phone field shown; app uses account phone from signup)
- [x] Client validation on blur; end time &gt; start time; submit button disabled until valid
- [x] Submit → `POST /api/shifts`; on success show confirmation card ("Your shift on [date] at [location] has been posted") with "Post Another" and "Browse Shifts"
- [x] On server error: toast "Something went wrong"; keep form data
- [x] Optional: localStorage for last location/role

**PARALLEL:** Backend (locations, roles, POST shifts) and frontend (form, validation, submit) can proceed in parallel once request/response shape is agreed from backend.md.

**Verify in production:** Post a shift; confirm it persists (e.g. via DB or later GET /api/shifts).

---

## Feature 2: Browse Shifts

### Backend

- [x] `GET /api/shifts` — query params: `from`, `to`, `location`, `role`; return only `status: 'open'`; **no email** in response

### Frontend

- [x] `/calendar`: month grid (7 columns); days with open shifts show badge/count
- [x] Month navigation: prev/next arrows + "Today"
- [x] Filter bar: location (multi-select or pills), role (dropdown); default all locations
- [x] Day click → show list of shift cards for that day (time range, location, role, poster name only)
- [x] Shift card: compact; tapping opens Shift Detail (modal on desktop, sheet on mobile); "Cover This Shift" wired in Feature 3
- [x] Empty states: "No shifts posted for [Month]" and "No shifts match your filters"

**PARALLEL:** GET /api/shifts and calendar UI (grid, filters, day list, cards) can be built in parallel.

**Verify in production:** Open calendar; see posted shift(s); change month and filters; select a day and see shift list.

---

## Feature 3: Cover a Shift

### Backend

- [x] `GET /api/shifts/:id` — return shift; **omit** poster_email (and coverer_email if present)
- [x] `PATCH /api/shifts/:id/cover` — body: `coverer_name`, `coverer_email`; validate; 404 if not found, 409 if not open; update DB; send two emails (poster + scheduler) via Resend
- [x] Env: email API key, from-address; read `scheduler_email` from `settings` table
- [x] Email failure: log only; do not roll back cover; response still 200

### Frontend

- [x] Shift Detail (modal/sheet): date, time, location, role, poster name; "Cover This Shift" CTA
- [x] On "Cover This Shift": confirmation dialog — "Poster and scheduler will be notified"; collect coverer name and email (required)
- [x] On confirm: `PATCH /api/shifts/:id/cover`; loading state on button
- [x] Success: show "You're covering this shift!" + shift summary; error: "Something went wrong," re-enable button
- [x] After cover, calendar/list refreshes so shift disappears or is marked covered

**PARALLEL:** Cover API (GET by id, PATCH, email) and UI (detail modal, dialog, success view) can be built in parallel.

**Verify in production:** Cover a shift; confirm poster and scheduler receive emails; confirm shift no longer appears as open.

---

## Feature 4: Calendar Invites

### Backend

- [x] `GET /api/shifts/:id/calendar` — 404 if missing, 400 if not covered; generate .ics with ical-generator (timezone from settings); headers: `Content-Type: text/calendar`, `Content-Disposition: attachment; filename="shift-....ics"`

### Frontend

- [x] After cover success: "Add to Google Calendar" — build `calendar.google.com/calendar/render?action=TEMPLATE&...` from shift data (client-side)
- [x] "Add to Outlook" / "Add to Apple Calendar" — link to `GET /api/shifts/:id/calendar` to download .ics

**PARALLEL:** .ics endpoint and "Add to Calendar" buttons can be built in parallel.

**Verify in production:** Cover a shift; use "Add to Google Calendar" and .ics download; confirm event details in calendar.

---

## Feature 5: Upcoming Features and Polish

### Backend

- No backend tasks (content and polish only).

### Frontend

- [x] `/upcoming-features` page: list with short descriptions — User Accounts, Remove Posted Shift (poster can remove/cancel their shift; requires sign-in), Role and Location Restrictions, SMS/Text Notifications, Shift History, Admin Dashboard
- [x] Optional: "Request a Feature" (mailto or form)
- [x] Footer and/or landing link to Upcoming Features (if not already)
- [x] Polish: touch targets ≥ 44px; labels on form fields; error state = border + icon + text; keyboard and focus for calendar; modals dismiss with Escape; WCAG AA contrast
- [x] Any missing empty/error states from PRD

**Verify in production:** Full smoke test: post → browse → cover → add to calendar → open Upcoming Features; check /settings and /account placeholders.

---

## Feature 6: User accounts (sign-up / login)

### Backend

- [x] Add `users` table (first_name, last_name, email, phone, position, role member|admin); migrations
- [x] POST /api/auth/signup — body: first_name, last_name, email, position, phone (optional), password or magic link; create user role 'member'; send signup notification email to admin
- [x] POST /api/auth/login, POST /api/auth/logout; GET /api/auth/session or GET /api/me — return current user; 401 if unauthenticated
- [x] POST /api/shifts: when authenticated, poster from session, body only shift_date, start_time, end_time, location; set posted_by_user_id
- [x] PATCH /api/shifts/:id/cover: when authenticated, coverer from session; body optional
- [x] GET /api/shifts: when authenticated as member, filter to shifts where role = user.position

### Frontend

- [x] /signup — form: first name, last name, email, position (dropdown from GET /api/roles), phone optional, password (or magic link)
- [x] /login — email + password (or magic link); link to sign up
- [x] Nav: show "Log in" and "Sign up" when unauthenticated; "Account" and "Log out" when authenticated
- [x] /post when logged in: hide or read-only name, email, Title/Role; submit minimal body
- [x] Cover dialog when logged in: no name/email fields; "You're covering as [Name]. The poster and scheduler will be notified." Single Confirm
- [x] Calendar when logged in: show only shifts for user's position (role filter default or hidden)

**Verify in production:** Sign up → log in → post shift (no name/email/role) → browse (only my position) → cover (no name/email).

---

## Feature 6b: Login enforcement and poster-only remove

### Backend

- [x] POST /api/shifts **requires authentication**; return 401 if unauthenticated (no anonymous post).
- [x] Add **PATCH /api/shifts/:id** (e.g. status: cancelled) or **DELETE /api/shifts/:id**. Allowed only when `posted_by_user_id` = current user or user is admin; 403 otherwise.
- [x] Phone required in signup and in post flow (from profile or body).

### Frontend

- [x] /post when unauthenticated → redirect to login or show "Sign in to post a shift."
- [x] For shifts the current user posted, show "Remove my shift" (or "Cancel") with confirmation; call new PATCH or DELETE endpoint.
- [x] Phone required in signup form and in post flow if not on profile.

- [x] **View and pick up require login:** GET /api/shifts and PATCH /api/shifts/:id/cover return 401 if unauthenticated. /calendar redirects to /login when not signed in.

**Verify in production:** Unauthenticated /post → redirect or sign-in prompt. Log in → post shift → see "Remove my shift" on that shift → confirm → shift cancelled/removed. Unauthenticated /calendar → redirect to login; only logged-in users can browse or cover shifts.

---

## Feature 6c: SMS / text notifications

### Backend

- [x] Require **poster_phone** when posting (for SMS); when authenticated, use user.phone from profile only (no phone field on post form).
- [x] On cover: send **SMS** (e.g. to poster) with coverer name and prompt to send the shift officially in UKG. Twilio (or similar); env vars (e.g. TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER).
- [x] Email behavior unchanged.

### Frontend

- [x] Phone required in signup (collected at account creation). When logged in, post form does not show phone; app uses account phone. No separate phone field on post form for authenticated users.

**Verify in production:** Post shift with phone → another user covers → poster receives SMS with coverer name and UKG prompt.

---

## Polish: Nav and branding (post–6c)

### Frontend

- [x] **Logo:** Replace nav “ShiftSwapper” text with logo image (`public/shift-swapper-logo.svg`); logo height `h-12`.
- [x] **Nav uniformity and mobile:** All nav links use same text size and weight (text-sm, font-medium); Sign up button uses consistent tap target (min-h 44px) and padding; nav wraps cleanly on small screens with appropriate gaps.

---

## Feature 7: Admin

### Backend

- [x] Admin role: when user.role === 'admin', GET /api/shifts can return all shifts (e.g. query status=all or admin=true)
- [x] Admin can POST /api/shifts (add shift; same shape, poster can be specified)
- [x] Admin can PATCH /api/shifts/:id (e.g. status: 'cancelled') or DELETE to remove/cancel shift
- [x] Signup notification email to admin (scheduler_email or admin_notification_email) when POST /api/auth/signup succeeds — if not already done in Feature 6

### Frontend

- [x] /admin (or admin section under /settings): visible only when user.role === 'admin'
- [x] Admin: list or calendar view of all shifts (open, covered, cancelled); no position filter
- [x] Admin: add shift form (date, time, location, role, poster if needed)
- [x] Admin: remove/cancel shift action from list or detail with confirmation

**Verify in production:** Log in as admin → see all shifts → add a shift → remove/cancel a shift. New signup triggers admin email.

---

## Feature 9: Pay-period indication on calendar

### Backend

- No backend tasks (display only).

### Frontend

- [x] Calendar month grid applies alternating two-week background (light gray vs default); first gray block = March 8–21; pattern continues from that anchor indefinitely.

### Fix

- [x] Correct pay-period grayscale so it follows the requested date pattern (March 8–21 = first gray block; alternating 14-day periods from that anchor).
- [x] Verify anchor and 14-day boundaries using timezone-safe date math so gray bands align with March 8–21, March 22–April 4, etc.
- [x] Use calendar-date-based period calculation: each cell’s displayed (year, month, day) is interpreted in UTC for the 14-day period, so bands are correct regardless of user timezone.
- [x] Use a stronger gray (e.g. slate-200) for the pay-period block so bands are clearly visible vs white.
- [x] Re-verify in production: calendar shows gray bands on correct two-week chunks.

**Verify in production:** Calendar shows gray bands on correct two-week chunks (March 8–21 gray, March 22–April 4 default, etc.).

---

## Feature 10: Rename Green Pharmacy to Enhanced Care

### Backend

- [x] Update locations constant (and any seeds/docs that list locations): "Green Pharmacy" → "Enhanced Care".

### Frontend

- [x] All location dropdowns and filters use "Enhanced Care" instead of "Green Pharmacy" (locations come from API).

**Verify in production:** Post, browse, and admin show "Enhanced Care"; no "Green Pharmacy" in UI.

---

## Feature 11: Add Technician and Intern roles

### Backend

- [x] Add "Technician" and "Intern" to roles constant; GET /api/roles returns Pharmacist, Technician, Intern; validation accepts all three for shift role and user position.

### Frontend

- [x] Signup and post position/role dropdowns include Technician and Intern; calendar role filter includes them.

**Verify in production:** Can sign up and post as Technician or Intern; calendar filters by role.

---

## Feature 12: Coverer name and phone in SMS to poster

### Backend

- [x] Add `coverer_phone` to shifts table (nullable); on cover, set from session; SMS payload and content include coverer name and coverer phone; document in backend.

### Frontend

- [x] No change if cover is login-only (phone from session).

**Verify in production:** After cover, poster receives SMS with coverer name and phone and UKG prompt.

---

## Feature 13: SMS opt-in on signup

### Backend

- [x] Add `sms_consent` (boolean, NOT NULL, default false) and `sms_consent_at` (timestamp, NULL) to the users table (Prisma migration).
- [x] POST /api/auth/signup: accept `sms_consent` in body; require `sms_consent === true` for signup to succeed; set `sms_consent_at` to current time when true.
- [x] GET /api/me (or session): include `sms_consent` (and optionally `sms_consent_at`) in the returned user object.
- [x] Cover flow: when sending SMS to the poster, only call the SMS sender if the poster is a user (`posted_by_user_id` set) and that user has `sms_consent === true`. For shifts with no `posted_by_user_id`, do not send SMS (consent unknown).

### Frontend

- [x] Signup form: add a required checkbox, unchecked by default, with label: "I agree to receive SMS notifications for shift swap updates. Message & data rates may apply. Reply STOP to opt out."
- [x] Submit disabled until the checkbox is checked; send `sms_consent: true` in the signup request (server sets `sms_consent_at`).

**Verify in production:** Sign up with checkbox checked → user row has `sms_consent` true and `sms_consent_at` set; sign up without checking fails validation; when a user who has not opted in has their shift covered, they do not receive SMS.

---

## Feature 14: Email and phone verification at signup

### Backend

- [x] Add `email_verified` (boolean, NOT NULL, default false) and `phone_verified` (boolean, NOT NULL, default false) to the users table (Prisma migration). Optionally store `email_verification_token` and `email_verification_expires_at` for the link, or document the chosen approach.
- [x] **Email:** On signup, send a verification email (Resend) with a link; link hits a verify endpoint that sets `email_verified = true`. User cannot access the app until `email_verified` is true (or document: signup response instructs "check your email" and app gates on email_verified).
- [x] **Phone:** After signup (and after email is verified), when user first hits the app or a dedicated step: send 6-digit verification code via Twilio to the user's phone; expose endpoint to request code (e.g. POST /api/auth/send-phone-code) and to verify code (e.g. POST /api/auth/verify-phone). On success set `phone_verified = true`. Store code (and expiry) in DB or in-memory/cache; document choice.
- [x] **Session/GET /api/me:** Include `email_verified` and `phone_verified` in session and in GET /api/me.
- [x] **SMS on cover:** Only send SMS to the poster when the user has `sms_consent === true` **and** `phone_verified === true` (in addition to existing checks).

### Frontend

- [x] After signup success, redirect to a "Verify your email" state (e.g. "Check your email" page or wait for verification); then redirect to phone verification step.
- [x] **Phone verification:** Show a simple code entry screen (e.g. /verify-phone) where the user enters the 6-digit code received by SMS. Submit calls verify-phone API; on success set `phone_verified` and allow full app access.
- [x] **Access gate:** If the user is logged in but `email_verified` is false, show "Verify your email" and block access to /post, /calendar, etc. If `phone_verified` is false (and email is verified), show the code entry screen and block full access until verified.

**Verify in production:** Sign up → receive email link → click to verify email → receive SMS code → enter code on verify-phone screen → access app; when a poster has not verified phone, they do not receive SMS on cover.

---

## Parallel Work Summary

| Phase / Feature | Can run in parallel |
|-----------------|----------------------|
| **Phase 0** | Repo + Vercel setup \| Next.js + Prisma + schema + seed |
| **Phase 1** | Nav + Footer + layout \| Landing content + placeholder pages |
| **Feature 1: Post a Shift** | Backend (locations, roles, POST shifts) \| Frontend (form, validation, submit) |
| **Feature 2: Browse Shifts** | GET /api/shifts \| Calendar UI (grid, filters, day list, cards) |
| **Feature 3: Cover a Shift** | Cover API (GET :id, PATCH, email) \| Detail modal, confirm dialog, success view |
| **Feature 4: Calendar Invites** | GET :id/calendar (.ics) \| Add to Calendar buttons (Google URL + .ics link) |
| **Feature 6: User accounts**      | Auth (signup, login, session) \| Post/cover/calendar behavior when authenticated |
| **Feature 6b: Login + poster remove** | POST auth + PATCH/DELETE ownership \| /post redirect, "Remove my shift" UI |
| **Feature 6c: SMS**              | poster_phone + Twilio on cover \| Phone in signup/post |
| **Feature 7: Admin**             | Admin shifts API \| Admin UI (all shifts, add, remove) |
| **Feature 9: Pay-period indication** | Display only (calendar grid styling) |
| **Feature 10: Rename Green Pharmacy** | Backend (locations constant) \| Frontend (dropdowns/filters) |
| **Feature 11: Technician and Intern roles** | Backend (roles constant) \| Frontend (signup, post, filters) |
| **Feature 12: Coverer name and phone in SMS** | Backend (coverer_phone, SMS payload) \| Frontend (no change) |
| **Feature 13: SMS opt-in on signup** | Backend (users columns, signup validation, cover SMS gate) \| Frontend (checkbox, required) |
| **Feature 14: Email and phone verification** | Backend (email/phone verify endpoints, DB columns) \| Frontend (verify-email state, verify-phone screen, access gate) |

Sequence remains feature-driven: finish each feature end-to-end and verify in production before moving to the next.
