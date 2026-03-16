# Handoff: ShiftSwapper — resume here

Use this when picking up the project. See [docs/todo.md](todo.md) for the full checklist and [docs/current-status.md](current-status.md) for production status.

---

## Current state (what’s done)

### Auth and verification (Feature 14)

- **Signup:** Email required. SMS is optional via “Get text when your shift is covered?” If they check it, phone is required and validated at signup. After signup → Check your email; verification link sets `email_verified = true`.
- **Verify-email redirect:** If user opted in to SMS (has phone + `sms_consent`) and is not yet phone-verified → redirect to **/verify-phone**; else → **/calendar**.
- **Access gate:** Email verification always required. Phone verification required **only** when `sms_consent && phone && !phone_verified` (redirect to /verify-phone). Users who didn’t opt in or have no phone are not sent to verify-phone.
- **Account:** Users can add or update phone via PATCH /api/me (optional `phone`). SMS section has consent toggle; if they have phone + consent but not verified, “Send code” + 6-digit verify. Once verified, no re-verification—just show phone and toggle.
- **SMS on cover:** Only when poster has `sms_consent` and `phone_verified`; Twilio sends cover notification. SMS sending is **pending Twilio toll-free number verification** in production.

### Toll-free SMS compliance (site ready for verification)

- **Footer:** ShiftSwapper (name visible), links to Privacy Policy, Terms of Service, Upcoming Features, and “Operated by Sean Gleeson.”
- **Pages:** `/privacy` (draft Privacy Policy, phone/SMS and contact SeanPGleeson@gmail.com), `/terms` (draft Terms, SMS program, STOP, contact).
- **SMS disclosure:** Signup and Account include: “By providing your phone number, you consent to receive SMS notifications from ShiftSwapper. Message & data rates may apply. Reply STOP to opt out/unsubscribe.”
- **Checklist:** [docs/toll-free-sms-compliance.md](toll-free-sms-compliance.md).

### Deploy

- **Production:** `main` branch → Vercel. Recent work (revised signup/SMS flow, privacy/terms, footer operator credit) is merged to `main` and pushed. Feature work may happen on branches (e.g. `feature/itemhub`); deploy = cherry-pick or merge to `main` and push.

---

## System context

ShiftSwapper operates **separately** from the company’s UKG scheduling system. A manual transfer is required from ShiftSwapper into UKG. SMS/text notifications are intended to bridge the gap (e.g. prompt poster to send the shift officially in UKG). The app is a **non-production** tool.

---

## Next steps when you pick up the project

1. **Twilio toll-free (manual)**  
   Resubmit or submit toll-free verification in Twilio Console; point reviewers to the live site. The site has app name, description, Privacy, Terms, SMS consent, and STOP language. Once approved: set production env `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` in Vercel, redeploy if needed, then test signup → verify email → verify phone → SMS on cover. See [current-status.md](current-status.md) and [feature-14-production-checklist.md](feature-14-production-checklist.md).

2. **Next feature (from product)**  
   **Feature 7 (Admin)** — Admin role; GET /api/shifts return all shifts; admin POST/PATCH/DELETE; /admin UI when `user.role === 'admin'`. **Feature 8 (Calendar sync)** — GET /api/me/calendar (authenticated .ics feed); “Copy feed URL” in Account. See [docs/todo.md](todo.md).

3. **Optional**  
   Review/customize draft text in `src/app/privacy/page.tsx` and `src/app/terms/page.tsx` (contact and legal wording) as needed for your organization.

---

## Key paths and docs

| Area | Path / doc |
|------|------------|
| Gate | `src/components/VerificationGate.tsx` |
| Signup | `src/app/signup/page.tsx`, `src/lib/validation.ts` |
| Verify-email redirect | `src/app/api/auth/verify-email/route.ts` |
| Account + phone | `src/app/account/page.tsx`, PATCH `src/app/api/me/route.ts` |
| Footer | `src/components/Footer.tsx` |
| Privacy / Terms | `src/app/privacy/page.tsx`, `src/app/terms/page.tsx` |
| SMS | `src/lib/sms.ts`; cover: `src/app/api/shifts/[id]/cover/route.ts` |
| Status & next steps | [current-status.md](current-status.md) |
| Toll-free checklist | [toll-free-sms-compliance.md](toll-free-sms-compliance.md) |
| Full execution list | [todo.md](todo.md) |
