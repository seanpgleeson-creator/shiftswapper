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
