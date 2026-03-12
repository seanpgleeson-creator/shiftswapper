# Toll-Free SMS Verification — Site Compliance Checklist

Use this checklist to get the site compliant for toll-free number verification (e.g. Twilio). Each item is what verifiers typically require on the live site.

---

## 1. App/business name — clearly visible

**Requirement:** Your app/business name should be clearly visible on the site.

**Current status:** **Partial**
- **Present:** Browser tab title is "ShiftSwapper". Nav shows the logo with alt text "Shift Swapper". Logo is the main branding; the word "ShiftSwapper" or "Shift Swapper" does not appear as visible text on the landing hero or footer.
- **Gap:** Some reviewers want the actual name in text (not only in a logo). Adding the name in the footer or under the logo on the landing page satisfies this.

**To do:**
- [x] **Done:** Footer now shows "ShiftSwapper" as visible text plus links to Privacy, Terms, and Upcoming Features.

---

## 2. What your service does — basic description

**Requirement:** A basic description of what the app does.

**Current status:** **Present**
- **Present:** Landing page has tagline: "Need a shift covered? Post it. Looking for hours? Browse open shifts." and two cards describing "Post a Shift" and "Browse Shifts". Layout metadata description: "Post and pick up pharmacy shifts."
- **Optional:** You could add one short sentence (e.g. on the landing page or in the footer) such as: "ShiftSwapper lets pharmacy team members post shifts they need covered and browse and claim open shifts."

**To do:**
- [ ] None required; optional copy improvement if you want a single-sentence "what we do" line.

---

## 3. SMS disclosure — explicit consent language

**Requirement:** Explicit language that users may receive SMS messages, e.g.:  
*"By providing your phone number, you consent to receive SMS notifications from [App Name]."*

**Current status:** **Partial**
- **Present:** Signup checkbox: "Get text when your shift is covered? Message & data rates may apply. Reply STOP to opt out." Account has "Receive SMS when my shift is covered" and description text.
- **Gap:** The exact phrase "By providing your phone number, you consent to receive SMS notifications from [App Name]" is not present. Adding it (on signup and/or Account) will satisfy most reviewers.

**To do:**
- [x] **Done:** Signup checkbox now includes: "By providing your phone number, you consent to receive SMS notifications from ShiftSwapper. Message & data rates may apply. Reply STOP to opt out."
- [x] **Done:** Account SMS section includes consent, message & data rates, and "Reply STOP to unsubscribe."

---

## 4. Privacy Policy

**Requirement:** A link to or the actual privacy policy that mentions how you handle phone numbers and data.

**Current status:** **Missing**
- There is no Privacy Policy page and no link in the nav or footer.

**To do:**
- [x] **Done:** Added `/privacy` page with draft policy (data collected, phone/SMS use, retention, contact SeanPGleeson@gmail.com) and footer link.

---

## 5. Terms of Service

**Requirement:** Basic terms covering your SMS program.

**Current status:** **Missing**
- There are no Terms of Service and no link in the nav or footer.

**To do:**
- [x] **Done:** Added `/terms` page with draft terms (service description, SMS program, message & data rates, STOP opt-out, UKG disclaimer) and footer link.

---

## 6. Opt-out language — Reply STOP to unsubscribe

**Requirement:** Mention that users can reply STOP to unsubscribe.

**Current status:** **Partial**
- **Present:** Signup checkbox includes "Reply STOP to opt out."
- **Gap:** The Account page SMS section does not mention STOP or message & data rates. Adding it there ensures opt-out is visible wherever SMS consent is managed.

**To do:**
- [x] **Done:** Account SMS section now includes "Message & data rates may apply. Reply STOP to unsubscribe."

---

## Summary

| Item                 | Status   | Action |
|----------------------|----------|--------|
| App name visible     | Done     | Footer shows "ShiftSwapper" + Privacy, Terms, Upcoming Features |
| Service description | Present  | Optional one-sentence improvement |
| SMS disclosure       | Done     | Signup and Account include consent sentence + rates + STOP |
| Privacy Policy       | Done     | `/privacy` page + footer link; contact SeanPGleeson@gmail.com |
| Terms of Service     | Done     | `/terms` page + footer link; SMS program terms included |
| Opt-out (STOP)       | Done     | Account SMS section includes rates + "Reply STOP to unsubscribe" |

---

## Implementation complete

- **App name:** ShiftSwapper (used in consent language and footer).
- **Privacy Policy:** `/privacy` page with draft text; contact SeanPGleeson@gmail.com.
- **Terms of Service:** `/terms` page with draft text including SMS program terms.
- **Contact:** SeanPGleeson@gmail.com in both Privacy and Terms.

Review and customize the draft text on `/privacy` and `/terms` for your organization before or after toll-free verification.
