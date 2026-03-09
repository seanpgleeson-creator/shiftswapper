# ShiftSwapper — Current Status & Next Steps

Use this doc to jump back in. Last updated after Option C (phone verification opt-in; Account SMS settings).

---

## Weekend summary: what’s done

### Feature 14: Email and phone verification (partially live)

**Shipped and working in production:**

- **Email verification**
  - Signup sends verification email via Resend.
  - User is redirected to **Check your email** (`/check-email`); link in email sets `email_verified = true` and redirects user to the app (`/calendar`).
  - Resend domain **hcmcshiftswap.com** verified (DKIM + SPF in Vercel DNS); **RESEND_FROM** set to `ShiftSwapper <noreply@hcmcshiftswap.com>` so emails can go to any address.
  - If the first email doesn’t send, the Check your email page shows a warning and a **Resend verification email** button (POST `/api/auth/resend-verification-email`).
- **Access gate**
  - Logged-in users who haven’t verified email are sent to `/check-email`; after email is verified, they’re sent to `/verify-phone` until `phone_verified` is true.
- **Phone verification (code and UI only)**
  - Backend and UI are in place: POST `/api/auth/send-phone-code`, POST `/api/auth/verify-phone`, and `/verify-phone` page with 6-digit code entry and “Resend code.”
  - SMS sending is **not** working yet in production because **Twilio toll-free number verification is still in progress**. Until that’s approved, “Send code” will fail or not deliver.

**Database and deploy:**

- Migration `20260310000000_add_email_phone_verification` applied in production (users have `email_verified`, `phone_verified`, and verification token/code columns).
- Feature 14 code is deployed to production (GitHub `main` → Vercel).

---

## Next steps (when you return)

### 1. Finish Twilio for SMS (phone verification + cover notifications)

- **Current:** Waiting on **toll-free verification** in Twilio. Until the toll-free number is verified, the app cannot send SMS (verification codes or “shift covered” messages).
- **When Twilio is approved:**
  - Ensure production env has **TWILIO_ACCOUNT_SID**, **TWILIO_AUTH_TOKEN**, and **TWILIO_PHONE_NUMBER** (the verified toll-free number in E.164, e.g. `+18443144554`).
  - Redeploy so the app uses the new number.
  - **Test:** Sign up (or use an existing unverified user) → verify email → on `/verify-phone` click “Send code” → confirm SMS arrives and entering the code sets `phone_verified` and grants access.
- **Reference:** [docs/feature-14-production-checklist.md](feature-14-production-checklist.md) (Step 3 and Step 4).

### 2. Verify full Feature 14 flow in production

Once SMS works:

1. Sign up with a new email/phone.
2. Confirm redirect to **Check your email** and that the verification email arrives (from `noreply@hcmcshiftswap.com`).
3. Click the link → confirm redirect to **Verify phone**.
4. Click “Send code” → receive SMS → enter code → confirm access to app (e.g. `/post`, `/calendar`).
5. Confirm that when a poster has not verified phone, they do **not** receive SMS when their shift is covered (cover flow still works; only SMS is gated).

### 3. Optional follow-ups

- **Resend:** Already using verified domain and RESEND_FROM; no change needed unless you add another domain.
- **Vercel DNS:** TXT/MX records for Resend are in place; no action unless you change domains.
- **Docs:** [docs/todo.md](todo.md), [docs/backend.md](backend.md), [docs/ui.md](ui.md), and [docs/feature-14-production-checklist.md](feature-14-production-checklist.md) are updated to match current behavior and remaining SMS dependency.

---

## Quick reference

| Area              | Status | Notes |
|-------------------|--------|--------|
| Email verification| Done   | Resend domain verified; RESEND_FROM set; verify-email redirects to /calendar. |
| Phone verification| Opt-in | Offered in Account only; does not block access. Twilio may be pending for sending. |
| Access gate       | Done   | Email-only; redirects to /check-email when email not verified. |
| SMS on cover      | Pending| Requires sms_consent and phone_verified; same Twilio number. |

---

## Doc index

- **Product and scope:** [docs/prd.md](prd.md)
- **UI and flows:** [docs/ui.md](ui.md)
- **API and data:** [docs/backend.md](backend.md)
- **Execution checklist:** [docs/todo.md](todo.md)
- **Feature 14 deploy and troubleshooting:** [docs/feature-14-production-checklist.md](feature-14-production-checklist.md)
