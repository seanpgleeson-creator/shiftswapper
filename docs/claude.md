# Handoff: ShiftSwapper — resume here

Use this when picking up the project. See [docs/todo.md](todo.md) for the full checklist.

---

## Changes made (recent)

- **Feature 6 (User accounts)** implemented end-to-end:
  - **Backend:** `User` model and migration; `postedByUserId` on Shift. NextAuth (Credentials + JWT). `POST /api/auth/signup` (validation, bcrypt, role `member`, admin notification email). Login/logout via NextAuth; `GET /api/me`. POST /api/shifts and PATCH cover use session when authenticated; GET /api/shifts filters by `user.position` when member.
  - **Frontend:** `/signup`, `/login`, NavBar (Log in / Sign up vs Account / Log out), `/post` minimal form when logged in, cover dialog without name/email when logged in, calendar filtered by position when logged in. `/account` page for signed-in user.
- **Build fix:** `package.json` build script is `prisma generate && next build` so Vercel generates the Prisma client.
- **Staging:** `stage.hcmcshiftswap.com` is linked to branch `auth-admin-cal` in Vercel. Workflow: “deploy to staging” = push to `auth-admin-cal`; “deploy to production” = merge to `main` and push.

---

## System context

Shift Swapper operates **separately** from the company's UKG scheduling system. A manual transfer is required from Shift Swapper into UKG. SMS/text notifications are intended to bridge the gap (e.g. prompt poster to send the shift officially in UKG). The app is still a **non-production** tool.

---

## Planned next (from product)

- **Posting restricted to logged-in users only** — Remove or redirect the anonymous post flow; only authenticated users can post a shift.
- **Only poster (or admin) can edit/remove a shift** — New "Remove my shift" for posters; backend PATCH/DELETE with ownership check (posted_by_user_id = current user or user is admin).
- **Phone required** — For posting and signup, so SMS can be sent (e.g. to poster on cover).
- **SMS workflow** — On cover, send text notification including name of person taking the shift and a prompt to send the shift officially in UKG.

---

## Next steps when you pick up the project

1. **Fix staging (stage.hcmcshiftswap.com)**  
   Sign up and post shift currently show “Server Error” / “Something went wrong” because the Preview environment likely has no or misconfigured database or migrations.
   - In **Vercel** → Project → **Settings** → **Environment Variables**, set for **Preview** (or the `auth-admin-cal` branch): `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (e.g. `https://stage.hcmcshiftswap.com`).
   - Run migrations against the DB used by staging: `npx prisma migrate deploy` with that `DATABASE_URL` (e.g. in a one-off script or locally with staging URL in env).
   - Redeploy the `auth-admin-cal` deployment so it picks up the env vars.

2. **After staging works**  
   Test: sign up → log in → post shift (logged in, minimal form) → browse shifts (filtered by position when logged in) → cover a shift (logged in, no name/email).

3. **When ready for production**  
   Say “deploy to production”: merge `auth-admin-cal` into `main` and push. Ensure **Production** env vars and migrations are set for the main DB. Then `www.hcmcshiftswap.com` / `hcmcshiftswap.com` will serve the new code.

4. **Next feature**  
   **Feature 7 (Admin)** is the next unchecked section in [docs/todo.md](todo.md): admin role, see all shifts, add/remove shifts, signup notification to admin (latter already done in Feature 6).

5. **Login enforcement and poster-only remove**  
   Enforce login for POST /api/shifts (401 if unauthenticated). Add PATCH /api/shifts/:id (e.g. status=cancelled) or DELETE; allow only when posted_by_user_id = current user or user is admin. Frontend: /post when unauthenticated → redirect to login or "Sign in to post"; show "Remove my shift" for shifts the current user posted, with confirmation.

6. **Phone required**  
   Make phone required in signup and in the post flow (from profile or one field). Validation and UI updates.

7. **SMS notification on cover**  
   Implement SMS (e.g. Twilio) on cover: send text to poster with coverer name and prompt to send the shift officially in UKG. Env vars (e.g. TWILIO_*). Email behavior unchanged.
