# ShiftSwapper Product Requirements Document

This PRD synthesizes the requirements from `shiftswapper.md`, `docs/ui.md`, and `docs/backend.md` into a single canonical reference for what to build and why.

---

## 1. Product Overview

### Problem

A pharmacy workplace migrated from When I Work to UKG. UKG does not support the ability for team members to post their assigned shifts for others to pick up. Staff need a simple way to offer shifts they cannot work and to claim shifts others have posted.

### Solution

ShiftSwapper is a lightweight web application that lets pharmacy team members:

- **Post a shift** they need covered (date, time, location, role, contact info).
- **Browse open shifts** on a calendar and claim one with one click.
- **Get notified by email** when a shift is covered (poster) or when a coverage event occurs (scheduler).
- **Add a covered shift to their calendar** (Outlook, Gmail, iCal) via a downloadable .ics file or Google Calendar deep link.

No login is required for the MVP. The app is mobile-first so staff can use it on phones between tasks.

### Intended Audience

- **Pharmacy team members** (e.g., pharmacists) who post or pick up shifts.
- **Scheduler** (single configurable email in settings) who receives coverage alerts and updates the official schedule.

---

## 2. Personas

| Persona | MVP Role | Description |
|---------|----------|-------------|
| **Shift Poster** | Primary | Team member who needs a shift covered. Fills out the Post a Shift form with date, time, location, role, name, and email. Receives an email when someone covers the shift. |
| **Shift Browser** | Primary | Team member looking for hours. Uses the calendar to find open shifts, views shift details, and clicks "Cover This Shift." Provides name and email in the confirmation dialog. Can download a calendar invite after covering. |
| **Scheduler** | Primary | Single recipient (email in settings). Receives an email every time a shift is covered, with poster and coverer details, so they can update UKG/the official schedule. |
| **Admin** | Future | Will manage user accounts, assign role/location restrictions, and configure scheduler email and other settings. Not in MVP; placeholders (e.g., `/settings`, `/account`) and an Upcoming Features page set expectations. |

---

## 3. MVP Scope

### In Scope

- Landing page with two actions: Post a Shift, Browse Shifts.
- Post a Shift form (all fields and validation as specified).
- Calendar view of open shifts with month navigation, filters (location, role), and day selection.
- Shift detail (modal/sheet) with "Cover This Shift" and confirmation dialog (coverer name + email).
- Notification emails to poster and scheduler when a shift is covered.
- Calendar invite: .ics download (Outlook, Apple) and client-side Google Calendar link.
- Upcoming Features page describing the roadmap.
- API for shifts (create, list, get, cover) and reference data (locations, roles).
- Settings table with scheduler email and timezone; seeded manually for MVP.

### Out of Scope (MVP)

- User accounts and authentication.
- Role/location restrictions (who can cover which shifts).
- SMS/text notifications (phone field exists but is optional and unused for notifications).
- Admin UI to edit settings.
- Shift history or audit log in the UI.

---

## 4. Functional Requirements

### 4.1 Shift Posting

| ID | Requirement |
|----|-------------|
| FR-1.1 | User can submit a form with: poster name, shift date, start time, end time, location (dropdown of 10 pharmacies), role (dropdown; MVP: "Pharmacist" only), email (required), mobile phone (optional). |
| FR-1.2 | Location options: Red Pharmacy, CSC Pharmacy, Shapiro Pharmacy, Whittier Pharmacy, Green Pharmacy, Speciality Pharmacy, Brooklyn Park Pharmacy, St. Anthony Pharmacy, Richfield Pharmacy, North Loop Pharmacy. |
| FR-1.3 | Client validates: end time after start time; all required fields present. Inline validation on blur; submit button disabled until valid. |
| FR-1.4 | Server validates: poster_name non-empty; poster_email valid format; location and role in allowed lists; shift_date today or future; end_time after start_time. |
| FR-1.5 | On successful post, show confirmation card with date/location and links to "Post Another" and "Browse Shifts." On server error, show toast and retain form data. |
| FR-1.6 | Poster email and phone are never returned in any API response. |

### 4.2 Shift Browsing

| ID | Requirement |
|----|-------------|
| FR-2.1 | User can view a month calendar grid. Days with open shifts show a badge/count. |
| FR-2.2 | User can navigate months (prev/next) and jump to "Today." |
| FR-2.3 | User can filter by location (multi-select/pills for 10 locations; default all) and by role (dropdown). |
| FR-2.4 | Selecting a day with shifts shows a list of shift cards (time range, location, role, poster name only). |
| FR-2.5 | Tapping a shift card opens Shift Detail (modal on desktop, full-screen sheet on mobile). |
| FR-2.6 | Empty states: no shifts in month, or no shifts match filters; clear copy for each. |
| FR-2.7 | Only shifts with status `open` are listed. Covered shifts are excluded or visually marked non-clickable. |

### 4.3 Shift Coverage

| ID | Requirement |
|----|-------------|
| FR-3.1 | Shift Detail shows: date, time, location, role, poster name (no email). Prominent "Cover This Shift" button. |
| FR-3.2 | On "Cover This Shift," a confirmation dialog appears: "Are you sure? The poster and scheduler will be notified." Dialog collects coverer name and email (required). |
| FR-3.3 | On confirm, client sends PATCH to cover endpoint. Button shows loading state. |
| FR-3.4 | Server: if shift not found return 404; if status not `open` return 409. Validate coverer_name and coverer_email; update shift to covered, set coverer_name, coverer_email, covered_at. |
| FR-3.5 | After successful cover, send email to poster and to scheduler (see Notification Behavior). Email failure is logged; shift remains covered; response still 200. |
| FR-3.6 | On success, modal shows "You're covering this shift!" plus shift summary and "Add to Calendar" options. On error, show "Something went wrong" and re-enable button. |

### 4.4 Calendar Invites

| ID | Requirement |
|----|-------------|
| FR-4.1 | After covering, user can "Add to Google Calendar" (client builds `calendar.google.com/calendar/render?action=TEMPLATE&...` from shift data). |
| FR-4.2 | User can "Add to Outlook" or "Add to Apple Calendar / iCal" by downloading a .ics file from GET /api/shifts/:id/calendar. |
| FR-4.3 | Calendar endpoint returns 404 if shift missing, 400 if shift not covered. Returns RFC 5545 .ics with SUMMARY, DTSTART, DTEND, LOCATION, DESCRIPTION; timezone from settings (default America/Chicago). |

### 4.5 Upcoming Features Page

| ID | Requirement |
|----|-------------|
| FR-5.1 | A page at `/upcoming-features` lists planned features with short descriptions: User Accounts, Role and Location Restrictions, SMS/Text Notifications, Shift History, Admin Dashboard. |
| FR-5.2 | Footer and/or landing banner link to this page. Tone is friendly and forward-looking. Optional: "Request a Feature" (mailto or form). |

### 4.6 Settings

| ID | Requirement |
|----|-------------|
| FR-6.1 | A settings table stores scheduler_email and timezone (default America/Chicago). For MVP this row is seeded manually; no admin UI. |
| FR-6.2 | Routes `/settings` and `/account` return a "Coming soon" placeholder, not 404. |

---

## 5. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | **Mobile-first responsive design.** Breakpoints: &lt; 640px (phone), 640–1024px (tablet), &gt; 1024px (desktop). Single column on phone; calendar full-width; modals as full-screen sheets on phone. |
| NFR-2 | **Touch targets** at least 44x44px for buttons, cards, calendar days. |
| NFR-3 | **Accessibility:** Labels on all form fields; error state indicated by more than color (icon + text); keyboard navigation for calendar; modals trap focus and dismiss with Escape; WCAG AA contrast. |
| NFR-4 | **API:** Poster and coverer email addresses are never included in API response bodies. |
| NFR-5 | **API errors** use a consistent JSON envelope: `{ "error": "...", "code": "..." }`. Validation errors include a `fields` array. |
| NFR-6 | **No authentication** in MVP; all shift and reference-data endpoints are unauthenticated. |
| NFR-7 | **Visual design:** Clean, clinical tone (healthcare audience); calm palette (blues, whites, grays); minimal chrome; 4/8px spacing; single sans-serif, two weights. |

---

## 6. Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Runtime | Node.js + TypeScript | Strong typing, ecosystem |
| Framework | Next.js (App Router + Route Handlers) | Collocates API and React UI |
| Database | PostgreSQL (prod) / SQLite (local) | Prisma supports both |
| ORM | Prisma | Type-safe, migrations |
| Email | Resend or SendGrid | Transactional API |
| Calendar | ical-generator (npm) | RFC 5545 .ics |
| Validation | Zod | Request body and business rules |

---

## 7. Data Model Summary

### shifts

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| poster_name, poster_email, poster_phone | string | phone optional |
| location, role | string | From allowed lists |
| shift_date | date | |
| start_time, end_time | time | end &gt; start |
| status | string | open / covered / cancelled |
| coverer_name, coverer_email | string | Set when covered |
| created_at, covered_at | timestamptz | |

### settings

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| scheduler_email | string | Notification recipient |
| timezone | string | Default America/Chicago |
| created_at, updated_at | timestamptz | |

### users (future)

Documented for extension: id, name, email, phone, role (member/admin), allowed_locations (JSONB), allowed_roles (JSONB). Shifts will get `posted_by_user_id` when auth exists.

---

## 8. API Surface Summary

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/locations | List of 10 pharmacy location names |
| GET | /api/roles | List of role names (MVP: Pharmacist) |
| POST | /api/shifts | Create shift (body: poster_name, poster_email, poster_phone?, location, role, shift_date, start_time, end_time) |
| GET | /api/shifts | List open shifts; query: from, to, location, role |
| GET | /api/shifts/:id | Shift detail (no email in response) |
| PATCH | /api/shifts/:id/cover | Cover shift (body: coverer_name, coverer_email); triggers emails |
| GET | /api/shifts/:id/calendar | Download .ics for covered shift |
| GET / PATCH | /api/settings | Future, admin-only |

---

## 9. Notification Behavior

| When | Who | What |
|------|-----|------|
| A shift is covered (PATCH cover succeeds) | **Poster** (poster_email) | Email: "Your shift on [date] at [location] has been covered." Body: coverer name, shift details, ask to confirm with scheduler. |
| Same event | **Scheduler** (settings.scheduler_email) | Email: "Shift coverage alert: [date] at [location]." Body: shift details, poster name, coverer name and email. |

Emails are sent server-side via Resend/SendGrid. If sending fails, the cover is still persisted; failure is logged and optionally noted in the API response.

---

## 10. Future Roadmap

- **User accounts:** Sign-in (e.g., NextAuth, Clerk); shifts tied to user; name/email pre-filled from profile.
- **Remove posted shift:** Allow the shift poster to remove or cancel a shift they posted (e.g., they no longer need coverage). Requires sign-in so the app can identify the poster; only the poster (or an admin) can remove their shift.
- **Role and location restrictions:** Only users with matching allowed_locations and allowed_roles can cover a given shift; 403 when not allowed.
- **SMS notifications:** Use poster_phone (and future coverer_phone); Twilio (or similar); toggle in settings.
- **Admin dashboard:** UI for scheduler email, timezone, locations/roles, and eventually user permissions.
- **Background jobs:** Move email/SMS to a queue (e.g., BullMQ) for retries and to avoid blocking the request.
- **Audit log:** shift_events table (created/covered/cancelled, actor, timestamp) for scheduler and compliance.

---

## Document History

- **Source documents:** `shiftswapper.md`, `docs/ui.md`, `docs/backend.md`
- This PRD is the single source of truth for MVP scope and requirements; refer to ui.md and backend.md for detailed UI components, API request/response shapes, and implementation notes.
