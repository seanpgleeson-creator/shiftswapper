# Handoff: ShiftSwapper — resume here

Use this when picking up the project. See [docs/todo.md](todo.md) for the full checklist.

---

## Changes made (recent, last 24h)

- **Feature 6c (SMS)** — Twilio on cover: `src/lib/sms.ts` sends SMS to poster with coverer name and UKG prompt. Cover route calls it after emails; env `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`. If missing, SMS is skipped (log only). Response can include `sms_warning` if SMS failed.
- **Login required to view and pick up shifts** — GET /api/shifts and PATCH /api/shifts/:id/cover return 401 if unauthenticated. Unauthenticated cover (body with coverer_name/email) removed. /calendar redirects to /login when not signed in; 401 from shifts or cover also redirects to login.
- **Logo and nav** — Nav shows `public/shift-swapper-logo.svg` (h-12) instead of "ShiftSwapper" text. Nav links use uniform text (text-sm, font-medium); Sign up button and all items have consistent 44px tap targets and padding; nav wraps cleanly on mobile (see [docs/todo.md](todo.md) "Polish: Nav and branding").
- **Build:** Twilio dependency is in package.json; Prisma generate + next build for Vercel.
- **Deploy:** Production is `main`. Staging (if used) was `auth-admin-cal`; recent work has been merged to `main` and pushed.

---

## System context

Shift Swapper operates **separately** from the company's UKG scheduling system. A manual transfer is required from Shift Swapper into UKG. SMS/text notifications are intended to bridge the gap (e.g. prompt poster to send the shift officially in UKG). The app is still a **non-production** tool.

---

## Planned next (from product)

- **Feature 7 (Admin)** — Admin role; GET /api/shifts can return all shifts (e.g. status=all); admin can POST/PATCH/DELETE shifts; signup notification to admin (already done in Feature 6). Frontend: /admin or admin section, visible only when user.role === 'admin'.
- **Feature 8 (Calendar sync)** — GET /api/me/calendar (authenticated .ics feed of covered shifts); "Copy feed URL" and instructions for subscribing in calendar apps.

---

## Next steps when you pick up the project

1. **Uncommitted change**  
   `src/components/NavBar.tsx` may have local edits (uniform nav text and mobile-friendly Sign up). Commit and push if you want that on production.

2. **Staging (if used)**  
   Ensure Preview env vars and migrations are set for the branch used for staging. "Deploy to production" = merge to `main` and push.

3. **Next feature**  
   **Feature 7 (Admin)** is the next unchecked section in [docs/todo.md](todo.md).
