# ShiftSwapper Product Requirements Document

This PRD synthesizes the requirements from `shiftswapper.md`, `docs/ui.md`, and `docs/backend.md` into a single canonical reference for what to build and why.

---

## 1. Product Overview

### Problem

A pharmacy workplace migrated from When I Work to UKG. UKG does not support the ability for team members to post their assigned shifts for others to pick up. Staff need a simple way to offer shifts they cannot work and to claim shifts others have posted.

### Solution

ShiftSwapper is a lightweight web application that lets pharmacy team members:

- **Sign up and log in** with first name, last name, email, position, and **phone (required for SMS)**. When logged in, post and cover shifts without re-entering those details.
- **Post a shift** they need covered — **posting is restricted to logged-in users only** (no anonymous post). When logged in, form is date, time, location (and phone from profile or required); only the **poster (or admin) can edit or remove** a posted shift. **Cover remains open to anyone** (with or without login).
- **Browse open shifts** on a calendar and claim one with one click. The calendar shows only shifts for the user's position (Pharmacist, Technician, Intern).
- **Get notified by email** when a shift is covered (poster) or when a coverage event occurs (scheduler). **SMS/text notifications** (e.g. to poster on cover) include the **coverer name and phone number** and a **prompt to send the shift officially in UKG**. Phone is required for posting and signup to enable SMS.
- **Add a covered shift to their calendar** (Outlook, Gmail, iCal) via a downloadable .ics file or Google Calendar deep link.
- **Optional calendar sync:** Subscribe to a feed of covered shifts so they appear in the user's calendar automatically.
- **Admin:** Admins can see all shifts, add or remove shifts, and receive an email when someone signs up so they can validate the user is an employee.

Shift Swapper is **separate from the company's UKG scheduling system**; manual transfer from Shift Swapper to UKG is required. The app remains **non-production**.

The app is mobile-first so staff can use it on phones between tasks. Cover is open to anyone (logged in or not); posting requires login.

### Intended Audience

- **Pharmacy team members** (e.g., pharmacists) who post or pick up shifts.
- **Scheduler** (single configurable email in settings) who receives coverage alerts and updates the official schedule.

---

## 2. Personas

| Persona | Role | Description |
|---------|------|-------------|
| **Shift Poster** | Primary | Team member who needs a shift covered. When unauthenticated: fills out full form (date, time, location, role, name, email). When logged in: form is date, time, location only; name/email/position from account. Receives an email when someone covers the shift. |
| **Shift Browser** | Primary | Team member looking for hours. Uses the calendar to find open shifts (filtered by their position when logged in), views shift details, and clicks "Cover This Shift." When unauthenticated: provides name and email in the dialog. When logged in: one-click confirm with no name/email prompt. Can download a calendar invite or subscribe to a feed of covered shifts. |
| **Member (logged-in)** | Primary | Has an account; posts shifts with date/time/location only; sees only shifts for their position; covers with one click (no name/email); can use calendar sync (feed URL for covered shifts). |
| **Scheduler** | Primary | Single recipient (email in settings). Receives an email every time a shift is covered, with poster and coverer details, so they can update UKG/the official schedule. |
| **Admin** | Primary | Logs in as admin; sees all shifts (open, covered, cancelled); can add or remove shifts; receives an email when a new user signs up to validate they are an employee. |

---

## 3. MVP Scope

### In Scope

- Landing page with two actions: Post a Shift, Browse Shifts.
- **Shift posting restricted to logged-in users only** (no anonymous post); poster (or admin) can remove/cancel own shift.
- **Phone required** for posting and signup (for SMS).
- **SMS notification on cover** (coverer name and phone, UKG prompt).
- **User sign-up** (first name, last name, email, position, **phone required**) and **login**; when logged in, post without name/email/position (date, time, location, phone from profile or required) and cover without name/email; calendar filtered by user position.
- Post a Shift form (login required; when authenticated: date, time, location, phone from profile or required).
- Calendar view of open shifts with month navigation, filters (location, role), and day selection; when logged in as member, only shifts for the user's position.
- Shift detail (modal/sheet) with "Cover This Shift" and confirmation dialog (coverer name + email when unauthenticated; one-click confirm when authenticated).
- Notification emails to poster and scheduler when a shift is covered.
- Calendar invite: .ics download (Outlook, Apple) and client-side Google Calendar link; **calendar sync** (feed URL for covered shifts so user can subscribe in their calendar app).
- **Admin persona:** see all shifts, add or remove shifts, receive notification when someone signs up.
- Upcoming Features page describing the roadmap.
- API for shifts (create, list, get, cover) and reference data (locations, roles); auth endpoints (signup, login, session/me); GET /api/me/calendar for covered-shifts feed.
- Settings table with scheduler email and timezone; seeded manually for MVP.

### Out of Scope

- Fine-grained role/location restrictions (allowed_locations, allowed_roles per user); current design uses position-only filtering.
- Fine-grained SMS preferences (e.g. per-notification toggles) remain out of scope; SMS on cover is in scope.
- Shift history or audit log in the UI.

---

## 4. Functional Requirements

### 4.1 Shift Posting

| ID | Requirement |
|----|-------------|
| FR-1.0 | **Posting requires authentication.** Unauthenticated users are redirected to login or shown "Sign in to post a shift"; no anonymous post. |
| FR-1.1 | When logged in, user can submit a form with: shift date, start time, end time, location (dropdown), role from account; **poster_phone is required** (from user profile or one required field at post time). Poster name/email come from session. |
| FR-1.2 | Location options: Red Pharmacy, CSC Pharmacy, Shapiro Pharmacy, Whittier Pharmacy, Enhanced Care, Speciality Pharmacy, Brooklyn Park Pharmacy, St. Anthony Pharmacy, Richfield Pharmacy, North Loop Pharmacy. |
| FR-1.3 | Client validates: end time after start time; all required fields present. Inline validation on blur; submit button disabled until valid. |
| FR-1.4 | Server validates: poster_name non-empty; poster_email valid format; location and role in allowed lists; shift_date today or future; end_time after start_time. |
| FR-1.5 | On successful post, show confirmation card with date/location and links to "Post Another" and "Browse Shifts." On server error, show toast and retain form data. |
| FR-1.6 | Poster email and phone are never returned in any API response. |

### 4.1b Remove shift (poster or admin)

| ID | Requirement |
|----|-------------|
| FR-Remove.1 | **Poster** can remove or cancel only shifts they posted (posted_by_user_id = current user). **Admin** can remove or cancel any shift. One endpoint (e.g. PATCH /api/shifts/:id with status=cancelled or DELETE) with auth and ownership check; 403 if not owner and not admin. |
| FR-Remove.2 | UI: poster sees "Remove my shift" (or "Cancel") on shifts they posted (e.g. in calendar or "My shifts"); confirmation before PATCH/DELETE. Admin can remove any shift in admin UI. |

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
| FR-2.8 | Calendar view shows pay-period indication: alternating two-week blocks with light gray background (first gray block March 8–21 from fixed anchor), so users can swap within the same pay period. |

### 4.3 Shift Coverage

| ID | Requirement |
|----|-------------|
| FR-3.1 | Shift Detail shows: date, time, location, role, poster name (no email). Prominent "Cover This Shift" button. |
| FR-3.2 | On "Cover This Shift," a confirmation dialog appears: "Are you sure? The poster and scheduler will be notified." Dialog collects coverer name and email (required). |
| FR-3.3 | On confirm, client sends PATCH to cover endpoint. Button shows loading state. |
| FR-3.4 | Server: if shift not found return 404; if status not `open` return 409. Validate coverer_name and coverer_email; update shift to covered, set coverer_name, coverer_email, covered_at. |
| FR-3.5 | After successful cover, send email to poster and to scheduler (see Notification Behavior). SMS to poster includes coverer name and phone number and UKG prompt. Email/SMS failure is logged; shift remains covered; response still 200. |
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
| FR-6.2 | Routes `/settings` and `/account` return a "Coming soon" placeholder when not implemented, not 404. |

### 4.7 Authentication and member experience

| ID | Requirement |
|----|-------------|
| FR-Auth.1 | User can sign up with first name, last name, email, position (dropdown: Pharmacist, Technician, Intern; list from API), **phone (required, for SMS)**. Admin receives an email on signup. |
| FR-Auth.2 | User can log in; session is used for subsequent requests. |
| FR-Auth.3 | When logged in, Post a Shift form does not ask for name, email, or position (pre-filled from account). |
| FR-Auth.4 | When logged in, Cover flow does not ask for name or email (taken from session). |
| FR-Auth.5 | Calendar lists only shifts whose role matches the logged-in user's position (e.g. Pharmacist, Technician, or Intern sees only shifts for their role). |

### 4.8 Admin

| ID | Requirement |
|----|-------------|
| FR-Admin.1 | Admin can view all shifts (open, covered, cancelled). |
| FR-Admin.2 | Admin can add a shift (same data as post; poster can be specified or admin). |
| FR-Admin.3 | Admin can remove or cancel a shift. |
| FR-Admin.4 | Admin receives an email when a new user signs up (to validate employee). |

### 4.9 Calendar sync

| ID | Requirement |
|----|-------------|
| FR-CalSync.1 | User can get a calendar feed URL that includes all shifts they have covered; subscribing in a calendar app shows those shifts without manual download per shift. |

---

## 5. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | **Mobile-first responsive design.** Breakpoints: &lt; 640px (phone), 640–1024px (tablet), &gt; 1024px (desktop). Single column on phone; calendar full-width; modals as full-screen sheets on phone. |
| NFR-2 | **Touch targets** at least 44x44px for buttons, cards, calendar days. |
| NFR-3 | **Accessibility:** Labels on all form fields; error state indicated by more than color (icon + text); keyboard navigation for calendar; modals trap focus and dismiss with Escape; WCAG AA contrast. |
| NFR-4 | **API:** Poster and coverer email addresses are never included in API response bodies. |
| NFR-5 | **API errors** use a consistent JSON envelope: `{ "error": "...", "code": "..." }`. Validation errors include a `fields` array. |
| NFR-6 | **Authentication** is supported; when authenticated, shift and cover endpoints use session data. Unauthenticated users can still post and cover with inline name/email. |
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
| poster_name, poster_email, poster_phone | string | poster_phone required when posting (for SMS) |
| location, role | string | From allowed lists |
| shift_date | date | |
| start_time, end_time | time | end &gt; start |
| status | string | open / covered / cancelled |
| coverer_name, coverer_email, coverer_phone | string | Set when covered; coverer_phone used in SMS to poster |
| created_at, covered_at | timestamptz | |

### settings

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| scheduler_email | string | Notification recipient |
| timezone | string | Default America/Chicago |
| created_at, updated_at | timestamptz | |

### users

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| first_name, last_name | string | |
| email | string | UNIQUE, login identifier |
| phone | string | **Required** (for SMS) |
| position | string | e.g. Pharmacist; from roles list |
| role | string | member \| admin |
| created_at, updated_at | timestamptz | |

Shifts: add `posted_by_user_id` (nullable FK to users). Poster-only mutation (PATCH/DELETE) and admin override documented in API and backend.

---

## 8. API Surface Summary

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/locations | List of 10 pharmacy location names |
| GET | /api/roles | List of role/position names (Pharmacist, Technician, Intern) |
| POST | /api/auth/signup | Sign up (first_name, last_name, email, position, phone?, password or magic link) |
| POST | /api/auth/login | Log in; establish session |
| POST | /api/auth/logout | Log out; clear session |
| GET | /api/auth/session or /api/me | Current user (401 if unauthenticated) |
| GET | /api/me/calendar | Authenticated .ics feed of all shifts the user has covered (calendar sync) |
| POST | /api/shifts | Create shift; **auth required** (401 if not); poster from session; poster_phone required (profile or body) |
| GET | /api/shifts | List shifts; when member: filter by user position; when admin: can request all (e.g. status=all) |
| GET | /api/shifts/:id | Shift detail (no email in response) |
| PATCH | /api/shifts/:id/cover | Cover shift; when authenticated coverer from session; else body: coverer_name, coverer_email |
| GET | /api/shifts/:id/calendar | Download .ics for covered shift |
| PATCH or DELETE | /api/shifts/:id | **Poster or admin only:** cancel or remove shift; 403 if not owner and not admin |
| GET / PATCH | /api/settings | Future, admin-only |

---

## 9. Notification Behavior

| When | Who | What |
|------|-----|------|
| A shift is covered (PATCH cover succeeds) | **Poster** (poster_email) | Email: "Your shift on [date] at [location] has been covered." Body: coverer name, shift details, ask to confirm with scheduler. |
| Same event | **Poster** (poster_phone) | **SMS:** Include coverer name and phone number and prompt to send the shift officially in UKG. (Shift Swapper is separate from UKG; manual transfer required.) |
| Same event | **Scheduler** (settings.scheduler_email) | Email: "Shift coverage alert: [date] at [location]." Body: shift details, poster name, coverer name and email. |

Emails are sent server-side via Resend/SendGrid. SMS (e.g. Twilio) is additive; email behavior unchanged. If sending fails, the cover is still persisted; failure is logged and optionally noted in the API response.

---

## 10. Future Roadmap

- **User accounts, admin, calendar sync:** In scope per this PRD (sign-up, login, position-filtered calendar, admin see all/add/remove, signup notification, covered-shifts feed).
- **Remove posted shift:** Allow the shift poster to remove or cancel a shift they posted. Requires sign-in; only the poster or admin can remove.
- **Role and location restrictions:** Optional allowed_locations and allowed_roles per user; 403 when not allowed to cover a given shift.
- **SMS notifications:** Use poster_phone (and future coverer_phone); Twilio (or similar); toggle in settings.
- **Admin dashboard:** UI for scheduler email, timezone, locations/roles, and user permissions.
- **Background jobs:** Move email/SMS to a queue (e.g., BullMQ) for retries and to avoid blocking the request.
- **Audit log:** shift_events table (created/covered/cancelled, actor, timestamp) for scheduler and compliance.

---

## Document History

- **Source documents:** `shiftswapper.md`, `docs/ui.md`, `docs/backend.md`
- This PRD is the single source of truth for MVP scope and requirements; refer to ui.md and backend.md for detailed UI components, API request/response shapes, and implementation notes.
