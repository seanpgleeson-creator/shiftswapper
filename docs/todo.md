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

- [x] `/post` page: form fields — Your Name, Shift Date (default tomorrow), Start Time, End Time, Location (dropdown), Title/Role (dropdown), Email, Mobile Phone (optional, labeled for future SMS)
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

- [ ] `/upcoming-features` page: list with short descriptions — User Accounts, Remove Posted Shift (poster can remove/cancel their shift; requires sign-in), Role and Location Restrictions, SMS/Text Notifications, Shift History, Admin Dashboard
- [ ] Optional: "Request a Feature" (mailto or form)
- [ ] Footer and/or landing link to Upcoming Features (if not already)
- [ ] Polish: touch targets ≥ 44px; labels on form fields; error state = border + icon + text; keyboard and focus for calendar; modals dismiss with Escape; WCAG AA contrast
- [ ] Any missing empty/error states from PRD

**Verify in production:** Full smoke test: post → browse → cover → add to calendar → open Upcoming Features; check /settings and /account placeholders.

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

Sequence remains feature-driven: finish each feature end-to-end and verify in production before moving to the next.
