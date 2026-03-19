# Handoff: ShiftSwap — resume here

Use this when picking up the project. See [docs/todo.md](todo.md) for the full checklist and [docs/current-status.md](current-status.md) for production status.

---

## Current state (what's done)

### Auth and verification (Feature 14)

- **Signup:** Email required. SMS is optional via "Get text when your shift is covered?" If checked, phone is required and validated at signup.
- **Verify-email redirect:** If user opted into SMS (phone + `sms_consent`) and is not phone-verified -> redirect to **/verify-phone**; else -> **/calendar**.
- **Access gate:** Email verification is always required. Phone verification is required only when `sms_consent && phone && !phone_verified`.
- **Account:** Users can add/update phone via PATCH `/api/me`; SMS verify flow appears only when needed.
- **SMS on cover:** Sent only when poster has `sms_consent` and `phone_verified`; Twilio still pending toll-free approval.

### Toll-free compliance and branding updates (new)

- Product branding is now **ShiftSwap** (user-facing copy updated across UI, SMS/email text, and calendar descriptions).
- Footer now shows **ShiftSwap**, includes **About** link, and states: "Built and operated by Sean Gleeson."
- New public **/about** page includes business description and visible contact info:
  - Address: 20475 Summerville Road, Deephaven, MN 55331
  - Phone: 952-393-6886
  - Email: sean@hcmcshiftswap.com
- Privacy and Terms pages updated to ShiftSwap branding, domain email, mailing address, and phone; draft wording removed.
- Verification gate now allows `/about`, `/privacy`, `/terms` so these pages remain reachable for review.

### Sentry and bug reporting (Feature 15)

- **Sentry SDK:** `@sentry/nextjs` integrated with `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, and `src/instrumentation.ts`.
- **Error boundaries:** Root, global, calendar, and account error boundaries capture exceptions to Sentry.
- **Bug report:** `/bug-report` page + POST `/api/bug-report`; nav includes "Report a Bug" for authenticated users.
- **Sentry project setup in progress:** org `shift-swap`, project `javascript-nextjs`; env vars need to be finalized in Vercel and deployed.

### Deploy status

- Production deploy target: `main` branch -> Vercel.
- Latest work in this session updates branding/compliance and Twilio-readiness; commit and push are still required.

---

## System context

ShiftSwap operates separately from the company's UKG scheduling system. A manual transfer is required from ShiftSwap into UKG. SMS/text notifications bridge that gap (e.g., prompt poster to send shift officially in UKG).

---

## Immediate next steps

1. **Commit and deploy current changes**
   - Commit all branding/compliance/Sentry updates and push to `main`.
   - Confirm Vercel deployment succeeds.

2. **Finalize Sentry activation**
   - In Vercel set: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG=shift-swap`, `SENTRY_PROJECT=javascript-nextjs`, and optional `SENTRY_AUTH_TOKEN`.
   - Redeploy and verify via `/bug-report` submission and Sentry Issues.

3. **Complete Twilio toll-free resubmission**
   - Ensure domain mailbox/forwarding works for `sean@hcmcshiftswap.com`.
   - Update Twilio Business Profile + submission fields to match **ShiftSwap** branding.
   - Add explicit explanation: product brand is ShiftSwap; `hcmcshiftswap.com` is the HCMC-specific deployment.
   - Resubmit and share verification link with Twilio support contact.

4. **After toll-free approval**
   - Set/verify `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` in Vercel.
   - Run production verification flow test end-to-end.

---

## Key paths and docs

| Area | Path / doc |
|------|------------|
| Gate | `src/components/VerificationGate.tsx` |
| Signup | `src/app/signup/page.tsx`, `src/lib/validation.ts` |
| Verify-email redirect | `src/app/api/auth/verify-email/route.ts` |
| Account + phone | `src/app/account/page.tsx`, PATCH `src/app/api/me/route.ts` |
| About/Privacy/Terms | `src/app/about/page.tsx`, `src/app/privacy/page.tsx`, `src/app/terms/page.tsx` |
| Footer | `src/components/Footer.tsx` |
| SMS | `src/lib/sms.ts`; cover route: `src/app/api/shifts/[id]/cover/route.ts` |
| Email templates | `src/lib/email.ts` |
| Sentry config | `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation.ts`, `next.config.ts` |
| Error boundaries | `src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/calendar/error.tsx`, `src/app/account/error.tsx` |
| Bug report | `src/app/bug-report/page.tsx`, `src/app/api/bug-report/route.ts` |
| Execution checklist | [todo.md](todo.md) |
| Status doc | [current-status.md](current-status.md) |
| Toll-free checklist | [toll-free-sms-compliance.md](toll-free-sms-compliance.md) |
