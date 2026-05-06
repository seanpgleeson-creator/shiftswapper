# ShiftSwap — Current Status & Next Steps

Use this doc to jump back in. Last updated after Twilio toll-free verification approved.

---

## What's done

### Feature 14: Email and phone verification

**Shipped and working in production:**

- **Email verification**
  - Signup sends verification email via Resend.
  - User is redirected to **Check your email** (`/check-email`); link in email sets `email_verified = true`. **Redirect after verify-email:** If user **opted in to SMS at signup** (has phone + `sms_consent`) and is **not yet phone-verified** → redirect to **/verify-phone**; else → **/calendar**.
  - Resend domain **hcmcshiftswap.com** verified (DKIM + SPF in Vercel DNS); **RESEND_FROM** set to `ShiftSwap <noreply@hcmcshiftswap.com>` so emails can go to any address.
  - If the first email doesn't send, the Check your email page shows a warning and a **Resend verification email** button (POST `/api/auth/resend-verification-email`).
- **Access gate**
  - **Email:** Logged-in users who have not verified email are sent to `/check-email`.
  - **Phone:** Redirect to `/verify-phone` **only** when the user has **opted in to SMS** (`sms_consent` true), has a **phone** number on file, and **has not** verified it (`phone_verified` false). Users who did not opt in or have no phone are not redirected to verify-phone.
- **Phone verification**
  - Backend and UI are in place: POST `/api/auth/send-phone-code`, POST `/api/auth/verify-phone`, and `/verify-phone` page with 6-digit code entry and "Resend code."
  - **Twilio toll-free verification is approved.** SMS is ready to activate — confirm env vars in Vercel and redeploy.

**Database and deploy:**

- Migration `20260310000000_add_email_phone_verification` applied in production (users have `email_verified`, `phone_verified`, and verification token/code columns).
- Feature 14 code is deployed to production (GitHub `main` → Vercel).

---

## Next steps (when you return)

### 1. Activate Twilio SMS in production

- **Current:** Toll-free number verification **approved**.
- **Steps:**
  - Confirm production env vars are set in Vercel: **TWILIO_ACCOUNT_SID**, **TWILIO_AUTH_TOKEN**, **TWILIO_PHONE_NUMBER** (`+18443144554`).
  - Redeploy if env vars were just added.
  - **Test end-to-end:** Sign up with SMS opted in → verify email → `/verify-phone` → "Send code" → confirm SMS arrives → enter code → confirm app access granted.
  - Confirm a poster receives SMS when their shift is covered.
- **Reference:** [docs/feature-14-production-checklist.md](feature-14-production-checklist.md) (Step 3 and Step 4).

### 2. Verify full Feature 14 flow in production

Once SMS is confirmed working:

1. **Sign up with SMS opted in:** Use a new email, check "Get text when your shift is covered?" and enter phone. Submit → **Check your email** → click link → redirect to **Verify phone** → Send code → enter code → access app.
2. **Sign up without SMS:** Do not check the SMS box (phone optional). Submit → Check your email → click link → redirect straight to **/calendar** (no verify-phone).
3. Confirm that when a poster has not verified phone (or did not opt in), they do **not** receive SMS when their shift is covered (cover flow still works; only SMS is gated).

### 3. Optional follow-ups

- **Resend:** Already using verified domain and RESEND_FROM; no change needed unless you add another domain.
- **Vercel DNS:** TXT/MX records for Resend are in place; no action unless you change domains.
- **Docs:** [docs/todo.md](todo.md), [docs/backend.md](backend.md), [docs/ui.md](ui.md), and [docs/feature-14-production-checklist.md](feature-14-production-checklist.md) are updated to match current behavior.

---

## Quick reference

| Area               | Status  | Notes |
|--------------------|---------|-------|
| Email verification | Done    | Resend domain verified; verify-email redirects to /verify-phone (if opted in + phone + not verified) or /calendar. |
| Phone verification | Ready   | Twilio toll-free approved; activate by confirming env vars in Vercel. |
| Access gate        | Done    | Email required; phone required only when sms_consent && phone && !phone_verified. |
| SMS on cover       | Ready   | Requires sms_consent and phone_verified; Twilio approved. |
| Account add phone  | Done    | PATCH /api/me accepts optional phone; Account shows "Add phone" when no phone; verify once, no re-verification when already verified. |
| Sentry             | Done    | @sentry/nextjs installed; config files, error boundaries (root, calendar, account), instrumentation hook. Needs DSN env var in Vercel. |
| Bug report         | Done    | /bug-report page + POST /api/bug-report; "Report a Bug" in nav (authenticated). Logs + Sentry.captureMessage. |

---

## Doc index

- **Product and scope:** [docs/prd.md](prd.md)
- **UI and flows:** [docs/ui.md](ui.md)
- **API and data:** [docs/backend.md](backend.md)
- **Execution checklist:** [docs/todo.md](todo.md)
- **Feature 14 deploy and troubleshooting:** [docs/feature-14-production-checklist.md](feature-14-production-checklist.md)
