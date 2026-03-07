# ShiftSwapper UI Design

## 1. Overview

ShiftSwapper is a lightweight web app that lets pharmacy team members post shifts they need covered and lets coworkers browse and claim those shifts. The UI must be dead-simple -- staff will use it on their phones between tasks, so every interaction needs to be fast, obvious, and forgiving.

This document covers the site map, page-by-page breakdown, component inventory, user flows, responsive strategy, and future-proofing hooks.

---

## 2. Site Map

```
/                         Landing page (hero + quick-action cards)
/post                     Post a Shift form
/calendar                 Browse Available Shifts (calendar view)
/calendar/:shiftId        Shift Detail (modal overlay, or standalone on mobile)
/upcoming-features        Info page describing roadmap
/login                    Log in (email + password or magic link)
/signup                   Sign up (first name, last name, email, position, phone)
/account                  User account (profile, calendar sync); when logged in
/admin                    Admin area (all shifts, add/remove); when user.role === 'admin'
/settings (future)        Admin/scheduler settings
```

### Navigation

A persistent top nav bar:

| Label             | Route               | Notes                              |
|-------------------|---------------------|------------------------------------|
| Home              | `/`                 | Logo/wordmark acts as home link    |
| Post a Shift      | `/post`             | Primary CTA, visually emphasized   |
| Browse Shifts     | `/calendar`         | Secondary nav item                 |

- **When unauthenticated:** Show "Log in" and "Sign up" in nav or footer.
- **When authenticated:** Show user name or "Account" and "Log out."
- **When admin:** Add "Admin" or link to admin area (e.g. `/admin`).

A footer contains a link to the Upcoming Features page and, when relevant, Settings/Account links.

---

## 3. Pages

### 3.1 Landing Page (`/`)

**Purpose:** Orient the user and get them to the right action in one tap.

**Layout:**

- **Hero section** -- short tagline ("Need a shift covered? Post it. Looking for hours? Browse open shifts.") over a clean background.
- **Two action cards** side by side (stacked on mobile):
  - "Post a Shift" -- icon + brief description, links to `/post`.
  - "Browse Shifts" -- icon + brief description, links to `/calendar`.
- **Upcoming Features banner** -- a subtle callout strip at the bottom linking to `/upcoming-features`. Something like: "We are building more -- see what is coming."

The landing page loads instantly. When auth is implemented, unauthenticated users can still use Post and Browse (with name/email collected at post or cover time); logged-in users get a streamlined experience.

---

### 3.2 Sign up (`/signup`)

**Purpose:** Let a new team member create an account.

**Form fields:** First name, Last name, Email, Position (single dropdown — list from GET /api/roles: Pharmacist, Technician, Intern), **Phone (required, for SMS)**.  Password (or "Send magic link" if using magic-link auth). **SMS opt-in checkbox (required):** Unchecked by default; label: "I agree to receive SMS notifications for shift swap updates. Message & data rates may apply. Reply STOP to opt out." User cannot submit until the checkbox is checked. Submit → POST /api/auth/signup (body includes `sms_consent: true`); on success redirect to `/` or `/calendar` and establish session.

**Consent:** Consent is stored with the user profile (`sms_consent`, `sms_consent_at`). SMS notifications (e.g. when a shift is covered) are only sent to users who have opted in.

**UX note:** After signup, the admin receives an email with the new user's first name, last name, email, and position so they can validate the user is an employee.

---

### 3.3 Login (`/login`)

**Purpose:** Let an existing user sign in.

Email + password (or magic link). POST /api/auth/login; on success redirect to `/` or previous page. Include a link to sign up for users who do not have an account.

---

### 3.4 Post a Shift (`/post`)

**Purpose:** Let a team member publish a shift for others to pick up.

**Posting requires login.** If the user is not logged in, redirect to login or show a clear message: "Sign in to post a shift" (with link to `/login` or `/signup`). Do not offer an anonymous post form.

**When authenticated** — form fields (top to bottom):

| Field              | Type              | Required | Details                                                                                       |
|--------------------|-------------------|----------|-----------------------------------------------------------------------------------------------|
| Shift Date         | Date picker       | Yes      | Native date input on mobile, calendar widget on desktop. Default: tomorrow.                   |
| Shift Start Time   | Time picker       | Yes      | Native time input. 15-min increments suggested.                                               |
| Shift End Time     | Time picker       | Yes      | Must be after start time. Validation inline.                                                  |
| Location           | Dropdown/select   | Yes      | Options: Red Pharmacy, CSC Pharmacy, Shapiro Pharmacy, Whittier Pharmacy, Enhanced Care, Speciality Pharmacy, Brooklyn Park Pharmacy, St. Anthony Pharmacy, Richfield Pharmacy, North Loop Pharmacy. |
| Mobile Phone       | Tel input         | Yes      | From profile if present; otherwise one required field (for SMS notifications).                |

Your name, email, and role (position) come from the session and are not shown or are read-only. Submit sends minimal body; server fills poster from session. **Phone** is required (from profile or one required field).

**Interactions:**

- **Inline validation** -- show errors as the user leaves a field (blur), not on every keystroke. Highlight the offending field with a red border and a one-line message below it.
- **Submit button** -- labeled "Post Shift". Disabled until all required fields pass validation.
- **Success state** -- after submission, replace the form with a confirmation card: "Your shift on [date] at [location] has been posted. You will be notified by email when someone picks it up." Include a "Post Another" link and a "Browse Shifts" link.
- **Error state** -- if the server request fails, show a toast/banner at the top: "Something went wrong. Please try again." Keep the form populated so the user does not lose their input.

**UX notes:**

- Pre-populate location and role if the user has posted before (store in localStorage for MVP, tied to user account later).
- Phone is required for posting (for SMS); when logged in, use profile phone or require one phone field on the form.

---

### 3.5 Browse Shifts -- Calendar View (`/calendar`)

**Purpose:** Let a team member scan available shifts by date and claim one.

**Layout:**

- **Month calendar grid** -- standard 7-column grid. Days with available shifts show a badge/dot indicator with the count of open shifts. **Pay-period banding:** Apply a gray background (e.g. slate-200) to every other two-week block so pay periods are clearly distinguishable from white; first gray block = March 8–21, then default March 22–April 4, then gray April 5–18, etc., from a fixed March 8 anchor continuing indefinitely. Implementation uses the calendar date of each cell (year/month/day in UTC) for the 14-day pattern so it is timezone-safe and bands align with March 8–21, March 22–April 4, April 5–18, etc.
- **Navigation** -- left/right arrows to move between months. A "Today" button to jump back.
- **Filter bar** (above or beside the calendar):
  - Location filter — multi-select checkboxes or pill toggles for the 10 pharmacy locations. Default: all selected.
  - Role filter — dropdown. **When authenticated as member:** hide or default to the user's position; calendar shows only shifts for the user's position (e.g. Pharmacist, Technician, or Intern sees only shifts for their role). **When unauthenticated or admin:** role filter as today (all roles or user selection).
- **Day click behavior** -- tapping a day with available shifts expands a panel below the calendar (on mobile) or to the right (on desktop) showing a list of shifts for that day.

**Shift list (for a selected day):**

Each shift is a compact card showing:

- Time range (e.g., "7:00 AM - 3:00 PM")
- Location name
- Role
- Posted by (name only, no contact info exposed here)
- **Remove my shift:** For shifts the current user posted, show "Remove my shift" or "Cancel" with confirmation; on confirm, call PATCH or DELETE to cancel/remove. Admin can remove any shift from the admin UI.

Tapping a shift card opens the Shift Detail view.

**Empty states:**

- If no shifts exist for the selected month: "No shifts posted for [Month]. Check back soon!"
- If filters eliminate all results: "No shifts match your filters. Try broadening your search."
- **When logged in as member:** If no shifts match the user's position: e.g. "No [Pharmacist/Technician/Intern] shifts this month."

---

### 3.6 Shift Detail (`/calendar/:shiftId`)

**Purpose:** Show full shift info and let the user commit to covering it.

**Presentation:** A modal overlay on desktop, a full-screen slide-up sheet on mobile. Both include a clear close/back button.

**Content:**

- **Shift date and time** -- prominent, large text.
- **Location** -- with an icon or subtle map pin indicator.
- **Role** -- badge style.
- **Posted by** -- name only (email is not exposed to the browser; notifications happen server-side).
- **"Cover This Shift" button** -- large, primary-colored CTA.
- **Remove my shift:** When the current user is the poster, show "Remove my shift" (or "Cancel"); confirmation dialog before PATCH/DELETE. Admin can remove any shift from admin UI.

**Cover Shift flow:**

1. User taps "Cover This Shift".
2. **When unauthenticated:** A confirmation dialog appears: "Are you sure you want to cover this shift? The poster and scheduler will be notified." The dialog collects coverer name and email (required).
   **When authenticated:** Confirmation dialog with no name/email fields: "You're covering this shift as [Name]. The poster and scheduler will be notified." Single "Confirm" button; server gets coverer from session.
3. User confirms.
4. Loading spinner on the button while the request is in flight.
5. **Success state:** The modal updates to a confirmation view:
   - "You are covering this shift!"
   - Shift summary (date, time, location).
   - **"Add to Calendar" buttons** — three options:
     - "Add to Google Calendar" (opens a Google Calendar event creation URL).
     - "Add to Outlook" (downloads a .ics file).
     - "Add to Apple Calendar / iCal" (downloads the same .ics file; iOS recognizes it natively).
   - **Calendar sync:** Optionally a "Sync your calendar" callout with instructions or a "Copy feed URL" button for the authenticated covered-shifts feed (see Account / Calendar sync).
   - "Back to Calendar" link.
6. **Error state:** "Something went wrong. Please try again." Button re-enables.

**UX notes:**

- The confirmation step is critical -- accidentally covering a shift triggers real emails. The dialog must be explicit.
- After a shift is covered, it should disappear from the calendar (or be visually marked as "Covered" and non-clickable) so other users do not try to claim it.
- The poster receives an SMS on cover that includes the coverer's name and phone number (and UKG prompt); see backend/SMS content for details.

---

### 3.7 Account (`/account`)

**Purpose:** Let the logged-in user view their profile and manage calendar sync.

When implemented: show user profile (first name, last name, email, position, **phone** — required for SMS, visible in account). Optional "Edit" later. Include a **Calendar sync** block: explain that the user can add a subscription URL (e.g. "Add calendar by URL" in Google Calendar or Outlook) pointing to their covered-shifts feed so future covered shifts appear automatically. Provide a "Copy feed URL" button (authenticated URL or token-based URL). No manual .ics download required once subscribed.

---

### 3.8 Calendar sync (user-facing)

In Account or after cover success: **"Sync your calendar"** — explain that the user can add the feed URL to their calendar app (Google, Outlook, Apple) so all shifts they have picked up appear automatically. Optionally show "Copy feed URL" for GET /api/me/calendar (or the token-based equivalent). Once subscribed, new covered shifts show up without downloading a file per shift.

---

### 3.9 Admin (`/admin` or under `/settings`)

**Purpose:** Let admins see all shifts and add or remove shifts. Visible only when `user.role === 'admin'`.

- **All shifts** — List or calendar view of all shifts (open, covered, cancelled). Same calendar UI or table; no position filter. Admin sees every shift.
- **Add shift** — Form equivalent to Post a Shift (date, time, location, role, and poster details if posting on behalf of someone; or "post as system" for admin-created shifts).
- **Remove shift** — From list or shift detail, "Remove" or "Cancel" button; calls DELETE or PATCH to cancel. Show confirmation before remove.

Admin receives an email when a new user signs up (see Sign up); no separate UI required for that notification.

---

### 3.10 Upcoming Features (`/upcoming-features`)

**Purpose:** Inform users about the roadmap and set expectations.

**Layout:** Simple content page with a list of planned features, each with a short description.

**Content (suggested):**

| Feature                        | Description                                                                                  |
|--------------------------------|----------------------------------------------------------------------------------------------|
| User Accounts                  | Sign in with your own account to manage your posted and covered shifts in one place.         |
| Remove Posted Shift            | Remove or cancel a shift you posted (e.g., you no longer need coverage). Requires sign-in.   |
| Role and Location Restrictions | Ensure only team members approved for a specific role or location can pick up those shifts.   |
| SMS/Text Notifications         | Get text messages when your shift is covered (coverer name, prompt to send shift officially in UKG). Shift Swapper is separate from UKG; manual transfer required.       |
| Shift History                  | View a log of past shift swaps for your records.                                             |
| Admin Dashboard                | Schedulers can manage locations, roles, and team member permissions.                         |

**UX notes:**

- Keep the tone friendly and forward-looking. This page doubles as reassurance that the tool is actively being improved.
- Consider a simple "Request a Feature" link (mailto or form) at the bottom.

---

## 4. User Flows

### 4.1 Post a Shift

```
Landing Page
  -> Tap "Post a Shift"
       -> Fill out form
            -> Tap "Post Shift"
                 |-- [Success] -> Confirmation card -> "Browse Shifts" or "Post Another"
                 |-- [Error]   -> Error banner -> fix and retry
```

### 4.2 Browse and Cover a Shift

```
Landing Page
  -> Tap "Browse Shifts"
       -> Calendar view loads (current month, all locations)
            -> Tap a day with available shifts
                 -> Shift list appears
                      -> Tap a shift card
                           -> Shift Detail modal opens
                                -> Tap "Cover This Shift"
                                     -> Confirmation dialog (enter your name + email)
                                          -> Confirm
                                               |-- [Success] -> Confirmation + "Add to Calendar" buttons
                                               |-- [Error]   -> Error message -> retry
```

### 4.3 Add to Calendar

```
Shift Detail (after covering)
  -> Tap "Add to Google Calendar"
       -> Browser opens Google Calendar with pre-filled event
  -> OR tap "Add to Outlook / iCal"
       -> .ics file downloads -> OS handles it
```

### 4.4 Signed-in member flow

```
Sign up (or Log in)
  -> Post a Shift (no name/email/position — form is date, time, location only)
  -> Browse Shifts (calendar shows only shifts for my position)
  -> Tap shift -> Cover (no name/email — "You're covering as [Name]" -> Confirm)
  -> Calendar sync: copy feed URL and add to calendar app so covered shifts appear automatically
```

### 4.5 Admin flow

```
Log in as admin
  -> Admin area: see all shifts (open, covered, cancelled)
  -> Add shift (form with date, time, location, role, poster if needed)
  -> Remove/Cancel shift (from list or detail, with confirmation)
Admin receives email when a new user signs up (to validate employee).
```

---

## 5. Component Inventory

| Component               | Used On                  | Notes                                                        |
|--------------------------|--------------------------|--------------------------------------------------------------|
| NavBar                  | All pages                | Logo, nav links, responsive hamburger on mobile.             |
| Footer                  | All pages                | Links to Upcoming Features, future Settings/Account.         |
| HeroSection             | Landing page             | Tagline + two action cards.                                  |
| ActionCard              | Landing page             | Icon, title, description, link. Reusable.                    |
| ShiftForm               | Post a Shift page        | All form fields, validation, submit handler.                 |
| DatePicker              | ShiftForm                | Native on mobile, enhanced widget on desktop.                |
| TimePicker              | ShiftForm                | Native on mobile, enhanced widget on desktop.                |
| SelectDropdown          | ShiftForm, Filter bar    | Styled select for location, role.                            |
| FormField               | ShiftForm                | Wrapper: label, input, error message, optional badge.        |
| ConfirmationCard        | Post a Shift (success)   | Summary of posted shift + next-action links.                 |
| CalendarGrid            | Calendar page            | Month grid with day cells, shift-count badges.               |
| CalendarNav             | Calendar page            | Month arrows + "Today" button.                               |
| FilterBar               | Calendar page            | Location toggles, role dropdown.                             |
| ShiftListPanel          | Calendar page            | Expandable list for a selected day.                          |
| ShiftCard               | ShiftListPanel           | Compact shift summary (time, location, role, poster name).   |
| ShiftDetailModal        | Calendar page (overlay)  | Full shift info + Cover button.                              |
| ConfirmDialog           | ShiftDetailModal         | "Are you sure?" with name/email collection.                  |
| CoverSuccessView        | ShiftDetailModal         | Confirmation + calendar-add buttons.                         |
| CalendarAddButtons      | CoverSuccessView         | Google Calendar link, .ics download button(s).               |
| Toast                   | Global                   | Transient success/error messages.                            |
| FeatureList             | Upcoming Features page   | Styled list of planned features.                             |

---

## 6. Responsive Strategy

**Approach:** Mobile-first. The primary users are pharmacy staff who will access the app on their phones during or between shifts.

### Breakpoints

| Breakpoint | Target            | Layout Changes                                                  |
|------------|-------------------|-----------------------------------------------------------------|
| < 640px    | Phone             | Single column. Calendar is full-width. Shift list below calendar. Modals become full-screen sheets. Nav collapses to hamburger. |
| 640-1024px | Tablet            | Two-column where useful (action cards side by side). Calendar with side panel for shift list. |
| > 1024px   | Desktop           | Max-width container (1024px). Calendar with right-side shift list panel. Modals are centered overlays. |

### Key Mobile Considerations

- **Touch targets:** All interactive elements (buttons, cards, calendar days) are at least 44x44px.
- **Native inputs:** Use native date and time inputs on mobile for the best UX -- the OS pickers are familiar and accessible.
- **Scrolling:** The calendar grid should not require horizontal scrolling. Day labels can abbreviate (M, T, W, ...) on small screens.
- **Bottom sheet modals:** Shift detail slides up from the bottom on mobile, matching platform conventions.

---

## 7. Accessibility

- All form fields have associated label elements.
- Color is not the only indicator of state -- icons and text accompany color changes (e.g., error states use red border + error icon + text message).
- Keyboard navigation works for the calendar grid (arrow keys to move between days, Enter to select).
- Modals trap focus and can be dismissed with Escape.
- Sufficient color contrast (WCAG AA minimum).

---

## 8. Visual Design Direction

No formal design system is prescribed for MVP, but the following principles apply:

- **Clean and clinical:** The audience is healthcare workers. Avoid playful/casual aesthetics. Use clear typography, generous whitespace, and a calm color palette (blues, whites, light grays).
- **Minimal chrome:** No unnecessary decoration. Every pixel should serve a purpose.
- **Consistent spacing:** Use a 4px/8px spacing scale.
- **Typography:** A single sans-serif font family (e.g., Inter, system font stack). Two weights: regular and semibold.

---

## 9. Future-Proofing

### Authentication (in scope)

- NavBar shows "Log in" / "Sign up" when unauthenticated and "Account" / "Log out" when authenticated. Admin users see a link to the admin area.
- `/account` is the user profile page with calendar sync when implemented; `/login` and `/signup` are real pages.
- When the user is logged in, the Post a Shift form omits name/email/position (filled from session); the Cover dialog omits name/email.

### Role and Location Restrictions (future)

- The FilterBar and SelectDropdown components already handle the location and role lists dynamically. When restrictions are added, the server simply returns a filtered list based on the user permissions -- no UI structural change needed.
- The "Cover This Shift" button can be conditionally disabled with a tooltip: "You are not approved to cover shifts at this location."

### SMS Notifications

- The phone field on the post form is already present but optional. When SMS is enabled, it becomes a toggleable notification preference rather than a simple input.

### Admin Dashboard

- The `/settings` placeholder page is where scheduler email config and location/role management will live. The nav link can be shown conditionally based on admin role.
