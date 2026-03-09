# Feature 14 (Email & Phone Verification) — Production Checklist

**Current status:** Email verification is **live** (Resend domain verified, RESEND_FROM set). Phone/SMS verification is **pending** — code and UI are deployed, but Twilio toll-free number verification is still in progress, so "Send code" and cover SMS will not work until that completes. See [current-status.md](current-status.md) for a full summary and next steps.

## What should happen for a new signup

1. User fills out signup form and submits.
2. Account is created; user is signed in automatically.
3. User is **redirected to /check-email** (“Check your email”).
4. User receives an **email** with a “Verify your email” link.
5. User clicks the link → email is verified → redirected to **/verify-phone**.
6. User clicks “Send code” → receives **SMS** with 6-digit code.
7. User enters code on /verify-phone → phone verified → can use the app (e.g. /post, /calendar).

If step 3 doesn’t happen (user goes to home or elsewhere), or no email/SMS is received, use this checklist.

---

## Step 1: Deploy the latest code

- Commit and push all Feature 14 code to the branch that deploys to production (e.g. `main`).
- Trigger a new deployment (e.g. Vercel redeploy from the dashboard or push to GitHub).
- Wait for the build to finish and the production URL to update.

**Check:** After deploy, open production and sign up with a **new** email. Right after submit you should be sent to **/check-email** (URL bar shows `.../check-email`). If you still go to the home page, the old build is still being served — redeploy or clear cache.

---

## Step 2: Run the database migration in production

The app needs the new columns on the `users` table: `email_verified`, `phone_verified`, and the token/code columns.

- In your **production** database (e.g. Neon, Vercel Postgres), run:
  ```bash
  npx prisma migrate deploy
  ```
  Use the **production** `DATABASE_URL` (e.g. set it in your shell or in a `.env.production` that you load only for this command). Do **not** use your local `.env` if it points to a local DB.

- If you use a hosted DB (Neon, etc.), you can run this from your laptop with production `DATABASE_URL` in the environment, or from your CI/deploy if you have a “migrate” step.

**Check:** After migrating, signup should still work. If signup starts failing with a database/column error, the migration did not apply correctly to the DB that production uses.

---

## Step 3: Set production environment variables

Your production app (e.g. Vercel) needs these so verification email and SMS work and the link is correct.

| Variable | Where to set (e.g. Vercel) | Example value |
|----------|----------------------------|----------------|
| **NEXTAUTH_URL** | Production env vars | `https://your-production-domain.com` (no trailing slash) |
| **RESEND_API_KEY** | Production env vars | From Resend dashboard → API Keys |
| **RESEND_FROM** | Optional | e.g. `ShiftSwapper <noreply@yourdomain.com>` |
| **TWILIO_ACCOUNT_SID** | Production env vars | From Twilio Console |
| **TWILIO_AUTH_TOKEN** | Production env vars | From Twilio Console |
| **TWILIO_PHONE_NUMBER** | Production env vars | E.164 number, e.g. `+15551234567` |

- **NEXTAUTH_URL** must be the exact URL users use to open your app in production. The verification link in the email is built from this. If it’s wrong or missing, the link will be broken or point to localhost.
- **RESEND_***: Without `RESEND_API_KEY`, the verification email is not sent (signup still succeeds, but no email).
- **TWILIO_***: Without these, “Send code” on /verify-phone will fail to send the SMS.

After adding or changing any variable, **redeploy** so the new values are used.

---

## Step 4: Quick test in production

1. Use an **incognito/private** window (or a different browser).
2. Go to your **production** URL and open the signup page.
3. Sign up with a **new** email and phone (not one already in the DB).
4. Confirm:
   - You are redirected to **/check-email**.
   - You receive the verification **email** (check spam if needed).
   - The link in the email opens your **production** site and sends you to **/verify-phone**.
   - “Send code” sends an **SMS**; entering the code lets you into the app.

If any step fails, re-check the matching step above (deploy, migration, or env vars).

---

## Summary

| Issue | What to do |
|-------|------------|
| No redirect to /check-email after signup | Deploy latest code (Step 1). |
| Verification link missing or wrong | Set **NEXTAUTH_URL** in production (Step 3) and redeploy. |
| No verification email | Set **RESEND_API_KEY** (and optional RESEND_FROM) in production (Step 3) and redeploy. |
| No SMS code | Set **TWILIO_*** in production (Step 3) and redeploy. Until Twilio toll-free verification is complete, SMS will not send. |
| Signup or verification errors about DB columns | Run **prisma migrate deploy** against production DB (Step 2). |
| **Verification email never arrives** | See “Verification email not arriving?” below. Use “Resend verification email” on the Check your email page to try again. |

---

## Verification email not arriving?

- **Check spam/junk** and “Promotions” (Gmail). The email is sent from **ShiftSwapper (onboarding@resend.dev)** unless you set `RESEND_FROM`.
- **Resend free tier:** When using the default sender `onboarding@resend.dev`, Resend may only deliver to the **email address that owns your Resend account** until you verify a domain. If signups use a different address, the email may not be delivered.
  - **Fix:** In [Resend](https://resend.com) → **Domains**, add and verify your domain (e.g. `hcmcshiftswap.com`). Then set **RESEND_FROM** in production to e.g. `ShiftSwapper <noreply@hcmcshiftswap.com>`. After that, verification emails can be sent to any address.
- **Resend dashboard:** In Resend → **Emails** (or Logs), check whether the verification email was sent, delivered, or bounced. That will show if the failure is on Resend’s side or the recipient’s.
- **App change:** If the first send failed, the “Check your email” page now shows a warning and a **Resend verification email** button so the user can request another email without creating a new account.
