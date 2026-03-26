# ShiftSwap UI Design Audit

**Date:** March 26, 2026  
**Scope:** All 15 pages and 4 shared components  
**Auditor:** /audit skill (impeccable)

---

## Audit Health Score

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 2 | Modal focus trap missing; no skip link; `aria-hidden` on error icons |
| 2 | Performance | 3 | No expensive animations; minor memoization gaps; no lazy loading needed |
| 3 | Responsive Design | 2 | Calendar filter bar overflows on mobile; location pill row has no wrapping budget |
| 4 | Theming | 1 | Zero design tokens; no CSS custom properties; pure Tailwind utilities hard-coded throughout |
| 5 | Anti-Patterns | 2 | Two-card grid on landing, generic rounded cards with shadows — textbook AI slop tells |
| **Total** | | **10/20** | **Acceptable (significant work needed)** |

---

## Anti-Patterns Verdict

**Does this look AI-generated? Yes — immediately.**

Specific tells present:

1. **Identical card grid on landing** — two `rounded-lg border bg-white shadow-sm` cards side by side with heading + body text. This is the most recognizable AI layout pattern.
2. **Generic rounded rectangles with drop shadows** — used on every container: landing cards, success cards, account sections, admin add-shift panel. All `rounded-lg border border-slate-200 bg-white shadow-sm`.
3. **Centered everything** — landing hero is `text-center`, success states are centered, error pages are centered. No asymmetry, no left-anchored hierarchy.
4. **Redundant copy** — landing `<h1>` restates the two card titles verbatim. The page heading and the card headings say the same thing.
5. **Blue-on-white primary buttons everywhere** — `bg-blue-600 text-white` is the only primary button style used across all 15 pages. No visual hierarchy variation.

The interface is functional and well-structured, but it has no distinctive personality. It looks like the output of "build me a healthcare scheduling app" with no further design direction.

---

## Executive Summary

- **Audit Health Score: 10/20 (Acceptable — significant work needed)**
- **Issues found:** P0: 0 / P1: 6 / P2: 9 / P3: 7
- **Top critical issues:**
  1. Modal focus trap is not implemented — keyboard users can tab behind the shift detail overlay
  2. No font is declared — the app renders in the browser default (usually Times New Roman on unstyled fallback, or system-ui with no intentional choice)
  3. Zero design tokens — all colors, spacing, and typography are raw Tailwind utilities with no abstraction layer
  4. Calendar filter bar (10 location pills + role dropdown) has no mobile layout strategy and will overflow horizontally on small screens
  5. `ErrorIcon` SVG is copy-pasted into 4 separate page files with no shared component

- **Recommended next steps (priority order):**
  1. Fix modal focus trap (P1 accessibility blocker)
  2. Declare a font (P1 — affects every page)
  3. Extract shared components: `ErrorIcon`, `Button`, `FormField` (P2 — reduces duplication)
  4. Fix calendar filter bar mobile overflow (P2 responsive)
  5. Run `/typeset` to establish intentional typography
  6. Run `/extract` to build a token layer
  7. Run `/adapt` to fix mobile calendar layout
  8. Run `/bolder` or `/distill` to give the interface a distinctive personality
  9. Run `/polish` as final pass

---

## Detailed Findings by Severity

### P1 — Major (fix before release)

---

**[P1] Modal focus trap not implemented**

- **Location:** `src/app/calendar/page.tsx` — the shift detail overlay (lines ~421–718)
- **Category:** Accessibility
- **Impact:** When the shift detail modal opens, keyboard users can Tab past the modal and interact with the calendar behind it. Screen reader users may not know a modal is open. This breaks the WCAG 2.1 success criterion 2.1.2 (No Keyboard Trap) in the opposite direction — focus escapes rather than being contained.
- **WCAG/Standard:** WCAG 2.1 SC 2.1.2, ARIA Authoring Practices Guide — Dialog (Modal) Pattern
- **Evidence:** The modal sets `role="dialog"` and `aria-modal="true"` correctly, and Escape key dismissal is implemented. However, there is no `focus()` call when the modal opens, no `tabIndex` management, and no focus sentinel elements to wrap Tab/Shift-Tab cycles.
- **Recommendation:** On modal open, move focus to the first interactive element inside the modal container. Add a focus trap loop: when Tab is pressed on the last focusable element, wrap to the first; when Shift-Tab on the first, wrap to the last. On close, return focus to the trigger element. Libraries like `focus-trap-react` handle this in ~5 lines, or implement manually with `querySelectorAll` on focusable selectors.
- **Suggested command:** `/harden`

---

**[P1] No font declared — browser default rendering**

- **Location:** `src/app/layout.tsx` (line 20), `src/app/globals.css` (lines 1–4)
- **Category:** Accessibility / Theming
- **Impact:** `globals.css` contains only three Tailwind directives. No `font-family` is set anywhere — not in `tailwind.config.ts` (theme is empty), not in `globals.css`, not in the `<body>` className. The `antialiased` class on `<body>` applies `-webkit-font-smoothing: antialiased` but does not set a font. The actual rendered font depends entirely on the browser default, which varies by OS and browser. On some systems this will be a serif font. The PRD specifies "single sans-serif, two weights" — this is not implemented.
- **WCAG/Standard:** Not a WCAG violation, but a significant quality and readability gap
- **Recommendation:** Add `font-sans` to the `<body>` className (Tailwind's default system font stack: `ui-sans-serif, system-ui, -apple-system, ...`) as a minimum. Better: choose an intentional web font (e.g. Inter via `next/font/google`) and configure it in `tailwind.config.ts` as the default sans font. This is a one-file change with high impact.
- **Suggested command:** `/typeset`

---

**[P1] Admin confirm dialog missing ARIA label**

- **Location:** `src/app/admin/page.tsx` — remove confirm modal (line ~431)
- **Category:** Accessibility
- **Impact:** The admin remove/cancel confirmation dialog has `role="dialog"` and `aria-modal="true"` but no `aria-labelledby` or `aria-label`. Screen readers will announce the dialog without a name, leaving users without context about what they opened.
- **WCAG/Standard:** WCAG 2.1 SC 4.1.2; ARIA spec requires accessible name on `role="dialog"`
- **Evidence:** `<div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">` — no `aria-labelledby`
- **Recommendation:** Add `aria-labelledby="admin-remove-dialog-title"` to the dialog div and `id="admin-remove-dialog-title"` to the `<h2>` inside it. Same fix needed for the calendar modal's remove confirm sub-view (the `<h2 id="shift-detail-title">` is already present on the main modal but the `aria-labelledby` on the container is correct there).
- **Suggested command:** `/harden`

---

**[P1] No skip-to-content link**

- **Location:** `src/app/layout.tsx`
- **Category:** Accessibility
- **Impact:** Keyboard and screen reader users must Tab through the entire NavBar (up to 7 links depending on auth state) before reaching page content on every page load. This is a significant friction point for users who rely on keyboard navigation.
- **WCAG/Standard:** WCAG 2.1 SC 2.4.1 (Bypass Blocks) — Level A
- **Recommendation:** Add a visually hidden skip link as the first focusable element in `layout.tsx`: `<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-blue-600 focus:rounded">Skip to content</a>`. Add `id="main-content"` to the `<main>` element.
- **Suggested command:** `/harden`

---

**[P1] `aria-hidden` on error icons suppresses accessible error context**

- **Location:** `src/app/post/page.tsx`, `src/app/login/page.tsx`, `src/app/signup/page.tsx`, `src/app/verify-phone/page.tsx` — `ErrorIcon` component (line ~9 in each)
- **Category:** Accessibility
- **Impact:** `ErrorIcon` uses `aria-hidden` (correct — the icon is decorative alongside text). However, in some error message patterns the icon is the only visual indicator of error state at a glance. This is actually fine since the text message accompanies it. The real issue is that the `<p>` error messages do not have `role="alert"` or `aria-live="polite"`, so screen readers are not notified when errors appear dynamically after form submission. The calendar page cover/remove error `<p>` elements do have `role="alert"` — this is inconsistent.
- **WCAG/Standard:** WCAG 2.1 SC 4.1.3 (Status Messages)
- **Evidence:** In `post/page.tsx`, inline field errors like `<p className="mt-1 flex items-start gap-1.5 text-sm text-red-600">` have no `role="alert"`. The toast banner does have `role="alert"`. Inconsistent.
- **Recommendation:** Add `role="alert"` to all dynamically-injected inline field error `<p>` elements. Alternatively, use `aria-describedby` on each input pointing to its error message container (even when empty), and let the content change trigger the announcement.
- **Suggested command:** `/harden`

---

**[P1] Password field has no strength indicator or requirements visible before blur**

- **Location:** `src/app/signup/page.tsx` (line ~248–268)
- **Category:** Accessibility / UX
- **Impact:** The password field shows "At least 8 characters" as hint text below the field, but this is only visible after the user has already focused the field. The `minLength={8}` HTML attribute provides browser-level validation but no feedback until form submission. If the user enters a short password and submits, the server-side error is the only feedback path. The submit button disabled logic does not check password length, meaning a 1-character password will not disable the button.
- **WCAG/Standard:** WCAG 2.1 SC 3.3.1 (Error Identification)
- **Evidence:** Submit button disabled condition (lines ~271–279) checks `!form.password` but not `form.password.length >= 8`
- **Recommendation:** Add `form.password.length < 8` to the submit disabled condition. Show the "At least 8 characters" hint always, not only after focus. Consider adding a visible error on blur if length < 8.
- **Suggested command:** `/harden`

---

### P2 — Minor (fix in next pass)

---

**[P2] Calendar filter bar overflows on mobile**

- **Location:** `src/app/calendar/page.tsx` (lines ~228–261)
- **Category:** Responsive Design
- **Impact:** The filter bar renders 10 location pill buttons in a `flex flex-wrap` row, plus a role dropdown. On a 375px phone, the pills will wrap across many rows, pushing the calendar grid far down the page. The pills use abbreviated names (`.replace(" Pharmacy", "")`) which helps, but "Brooklyn Park", "St. Anthony", "Richfield", "North Loop", "Enhanced Care", "Speciality" all remain long. The combined row is likely 600–800px wide before wrapping.
- **Recommendation:** On mobile, collapse the location filter into a disclosure (expandable section) or a multi-select dropdown/sheet. The pill row works well on tablet and desktop. Use a `hidden sm:flex` / `sm:hidden` pattern to show a compact "Filter" button on mobile that opens a bottom sheet or popover with the full filter options.
- **Suggested command:** `/adapt`

---

**[P2] Calendar day cells may fall below 44px touch target on narrow viewports**

- **Location:** `src/app/calendar/page.tsx` (lines ~329–379)
- **Category:** Responsive Design / Accessibility
- **Impact:** Day cells use `aspect-square min-w-[44px]`. The `min-w-[44px]` ensures a minimum width, but on a 320px phone with 7 columns and `gap-1` (4px × 6 = 24px gaps), available width per cell is `(320 - 32px padding - 24px gaps) / 7 = ~37.7px`. The `aspect-square` will then render the cell at ~38×38px — below the 44×44px WCAG touch target requirement.
- **WCAG/Standard:** WCAG 2.5.5 (Target Size) — Level AAA; iOS/Android HIG recommend 44×44pt minimum
- **Recommendation:** Use `min-w-[40px] min-h-[40px]` with a slightly reduced calendar container max-width, or reduce `gap-1` to `gap-0.5` on mobile, or use `w-full` cells with the container constraining the grid. Alternatively, abbreviate day headers to single letters (S, M, T, W, T, F, S) on mobile to reclaim space.
- **Suggested command:** `/adapt`

---

**[P2] `ErrorIcon` duplicated across 4 page files**

- **Location:** `src/app/post/page.tsx` (line 7), `src/app/login/page.tsx` (line 8), `src/app/signup/page.tsx` (line 8), `src/app/verify-phone/page.tsx` (line 8)
- **Category:** Performance / Maintainability
- **Impact:** The same 12-line SVG component is copy-pasted verbatim into 4 files. This increases bundle size marginally (each file bundles its own copy), but more importantly it creates a maintenance burden — any change to the icon requires 4 edits. It also signals that component extraction discipline is not established.
- **Recommendation:** Extract to `src/components/ErrorIcon.tsx` and import it in all 4 locations. While extracting, also consider a generic `Icon` component or an `Alert` component that combines the icon + message pattern used consistently throughout.
- **Suggested command:** `/extract`

---

**[P2] `formatTime` and `getMonthRange` duplicated between calendar and admin pages**

- **Location:** `src/app/calendar/page.tsx` (lines 20–34), `src/app/admin/page.tsx` (lines 20–34)
- **Category:** Performance / Maintainability
- **Impact:** `formatTime` and `getMonthRange` are identical functions copy-pasted between the two largest page files. Any bug fix or timezone change must be applied in both places.
- **Recommendation:** Extract to `src/lib/utils.ts` (or `src/lib/time.ts`) and import in both pages.
- **Suggested command:** `/extract`

---

**[P2] Calendar page is 721 lines with no component extraction**

- **Location:** `src/app/calendar/page.tsx`
- **Category:** Performance / Maintainability
- **Impact:** The entire calendar UI — grid, filter bar, shift list panel, shift detail modal, cover flow, remove flow — is a single 721-line component with 20+ `useState` hooks. This makes the file hard to navigate, prevents code splitting (the entire modal code is always bundled even when not shown), and makes testing individual flows impossible. React's reconciler also has to diff a very large component tree on every state update.
- **Recommendation:** Extract at minimum: `ShiftDetailModal` (the overlay + all its sub-views), `CalendarGrid` (the 7-column grid), `FilterBar` (location pills + role dropdown), and `ShiftListPanel` (the selected-day shift list). This would reduce the main page to ~150 lines and enable lazy loading of the modal with `React.lazy`.
- **Suggested command:** `/extract`

---

**[P2] Account phone input "Add phone" button is below 44px touch target**

- **Location:** `src/app/account/page.tsx` (line ~194–199)
- **Category:** Responsive Design / Accessibility
- **Impact:** The "Add phone" and "Add phone number" inline form buttons use `min-h-[40px]` (not 44px). The "Verify" and "Send code" buttons in the phone verification section also use `min-h-[40px]`. This is 4px below the minimum touch target requirement.
- **WCAG/Standard:** WCAG 2.5.5; iOS/Android HIG
- **Recommendation:** Change `min-h-[40px]` to `min-h-[44px]` on all three buttons in `account/page.tsx`.
- **Suggested command:** `/adapt`

---

**[P2] NavBar has no mobile hamburger — wraps to multiple lines on small screens**

- **Location:** `src/components/NavBar.tsx`
- **Category:** Responsive Design
- **Impact:** The nav uses `flex flex-wrap` which causes links to wrap to a second row on narrow screens. When authenticated, there are up to 5 nav items (Home, Post a Shift, Browse Shifts, Account, Report a Bug, Log out) plus the logo. On a 375px phone, these will wrap to 2–3 rows, consuming significant vertical space at the top of every page. The PRD specifies "nav collapses to hamburger" on mobile.
- **Recommendation:** Implement a hamburger menu for screens below `sm` (640px). The logo stays visible; a hamburger icon button toggles a dropdown or slide-in drawer with the nav links. This is a meaningful UX improvement for the primary mobile audience.
- **Suggested command:** `/adapt`

---

**[P2] Shift date displayed as raw ISO string in shift detail modal**

- **Location:** `src/app/calendar/page.tsx` — cover success view and shift detail view (lines ~487, ~554)
- **Category:** Accessibility / UX
- **Impact:** `detailShift.shift_date` is rendered directly as `"2026-03-26"` (ISO format). Users see a machine-readable date string rather than a human-readable format like "Wednesday, March 26, 2026". This is especially jarring in the "You're covering this shift!" success screen where the date is the most prominent piece of information.
- **Recommendation:** Format the date using `new Date(shift_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })` or use `luxon` (already in dependencies) for consistent formatting.
- **Suggested command:** `/clarify`

---

**[P2] No loading skeleton — "Loading…" plain text on every async page**

- **Location:** `src/app/post/page.tsx` (line 178), `src/app/account/page.tsx` (line 141), `src/app/admin/page.tsx` (line 198), `src/app/calendar/page.tsx` (implicit via `loading` state), `src/components/VerificationGate.tsx` (line 69)
- **Category:** Performance / UX
- **Impact:** Every page that fetches data shows a plain `<p className="text-slate-600">Loading…</p>` during the async wait. This causes layout shift when content loads and provides no visual indication of what is loading. For the calendar page in particular, the shift from "Loading…" to a full calendar grid is a jarring layout change.
- **Recommendation:** Replace "Loading…" text with skeleton screens that match the approximate shape of the loaded content. At minimum, use animated pulse placeholders (`animate-pulse bg-slate-200 rounded`) for the main content areas.
- **Suggested command:** `/delight`

---

### P3 — Polish (nice-to-fix)

---

**[P3] No dark mode support**

- **Location:** `src/app/globals.css`, `tailwind.config.ts`
- **Category:** Theming
- **Impact:** The app has no dark mode. `tailwind.config.ts` has an empty `theme.extend` with no `darkMode` configuration. All backgrounds are hard-coded white/slate-50. Healthcare workers may use their phones in dark environments (e.g. night shifts) where a white-dominant UI is uncomfortable.
- **Recommendation:** Enable `darkMode: 'media'` in `tailwind.config.ts` and add `dark:` variants to the most prominent background and text classes. This is most impactful after design tokens are established.
- **Suggested command:** `/colorize`

---

**[P3] Upcoming features page lists SMS as "upcoming" but it is already implemented**

- **Location:** `src/app/upcoming-features/page.tsx` (line ~16–20)
- **Category:** UX / Copy
- **Impact:** The upcoming features list includes "SMS/Text Notifications" as a future feature, but SMS notification infrastructure is already built (pending Twilio toll-free approval). This creates a misleading impression for users who have already opted in to SMS at signup.
- **Recommendation:** Update the copy to reflect current status: "SMS/Text Notifications — In progress. You can opt in at signup; notifications will activate once our phone number is verified." Or remove it from the upcoming list entirely and add a status note on the account page.
- **Suggested command:** `/clarify`

---

**[P3] Redundant copy on landing page**

- **Location:** `src/app/page.tsx`
- **Category:** Anti-Pattern / UX
- **Impact:** The `<h1>` reads "Need a shift covered? Post it. Looking for hours? Browse open shifts." The two cards below it are titled "Post a Shift" and "Browse Shifts" — restating the same information. The card descriptions then add a third layer of the same content. This is the "redundant copy" anti-pattern from the frontend-design skill.
- **Recommendation:** The `<h1>` should be a punchy brand statement, not a description of the two buttons. The cards should describe the *value* of each action, not restate the action name. Example: `<h1>` → "Shift coverage, simplified." Cards → "Post a Shift: Share a shift you can't work. A teammate can pick it up in one tap." / "Browse Shifts: See what's available and claim a shift that fits your schedule."
- **Suggested command:** `/clarify`

---

**[P3] No visible focus styles on interactive elements**

- **Location:** All pages — Tailwind's default focus ring behavior
- **Category:** Accessibility
- **Impact:** Tailwind v3 removes the default browser focus outline by default (via `outline: 2px solid transparent` in preflight). The codebase uses `focus:ring-2 focus:ring-blue-500` on form inputs and submit buttons, which is good. However, nav links, calendar day buttons, location pill buttons, and card links do not have explicit `focus:` classes. These elements will have no visible focus indicator for keyboard users.
- **WCAG/Standard:** WCAG 2.1 SC 2.4.7 (Focus Visible) — Level AA
- **Recommendation:** Add `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none` to the `linkClass` in NavBar, to calendar day buttons, and to location pill buttons. Alternatively, add a global focus style in `globals.css`: `*:focus-visible { outline: 2px solid #3b82f6; outline-offset: 2px; }`.
- **Suggested command:** `/harden`

---

**[P3] `prose` class applied without `@tailwindcss/typography` plugin**

- **Location:** `src/app/privacy/page.tsx` (line 14), `src/app/terms/page.tsx` (line 14)
- **Category:** Performance / Theming
- **Impact:** Both policy pages use `className="prose prose-slate text-slate-700 ..."`. The `prose` class requires the `@tailwindcss/typography` plugin, which is not installed (`package.json` devDependencies does not include it, and `tailwind.config.ts` has an empty `plugins: []` array). The `prose` class will have no effect — it will not apply the typographic styles intended for long-form content.
- **Recommendation:** Either install `@tailwindcss/typography` (`npm install -D @tailwindcss/typography`) and add `require('@tailwindcss/typography')` to `tailwind.config.ts` plugins, or remove the `prose` class and apply explicit typography styles to the policy page content.
- **Suggested command:** `/typeset`

---

**[P3] Admin table has no horizontal scroll protection on mobile**

- **Location:** `src/app/admin/page.tsx` (line ~372)
- **Category:** Responsive Design
- **Impact:** The admin shifts table has 8 columns (Date, Time, Location, Role, Poster, Status, Coverer, Actions). The `overflow-x-auto` wrapper is present, which prevents page-level overflow. However, the table cells have no `max-width` or truncation, so long location names like "Brooklyn Park Pharmacy" will force the table to be very wide. On mobile, the admin table is essentially unusable without horizontal scrolling.
- **Recommendation:** Since admin is likely a desktop-only use case, add a note in the UI ("Best viewed on desktop") or implement a card-based list view for mobile that collapses the table into per-shift cards with key fields.
- **Suggested command:** `/adapt`

---

**[P3] No `<html lang>` attribute on error boundary**

- **Location:** `src/app/global-error.tsx`
- **Category:** Accessibility
- **Impact:** The global error boundary renders its own `<html>` and `<body>` elements (required by Next.js for global errors). If this file exists and doesn't set `lang="en"`, screen readers cannot determine the document language. (The root layout sets `lang="en"` but global-error bypasses it.)
- **Recommendation:** Verify `src/app/global-error.tsx` includes `<html lang="en">`. This is a one-character fix with meaningful accessibility impact.
- **Suggested command:** `/harden`

---

## Patterns & Systemic Issues

### 1. Zero design token layer

Every color, spacing value, and typography choice is a raw Tailwind utility class. There are no CSS custom properties, no `tailwind.config.ts` theme extensions, and no semantic token names. This means:
- Changing the primary color (`blue-600`) requires a global find-and-replace across 15 files
- There is no way to express semantic intent (e.g. "danger", "success", "muted") vs. visual intent (e.g. "red-600")
- Dark mode is impossible to add without touching every file
- The `globals.css` is 3 lines

**Affects:** All 15 pages and 4 components. Fix with `/extract` to establish a token layer.

### 2. Component extraction discipline not established

`ErrorIcon` is duplicated 4 times. `formatTime` and `getMonthRange` are duplicated twice. The 721-line calendar page contains 5 logical components inline. There are no shared form field, button, or card components despite identical patterns appearing on every page. Every page re-implements the same `rounded-lg border border-slate-200 bg-white p-6 shadow-sm` card container.

**Affects:** Maintainability, bundle efficiency, testability. Fix with `/extract`.

### 3. Inconsistent touch target sizing

The PRD specifies 44×44px minimum touch targets. Most primary buttons correctly use `min-h-[44px]`. However, account page action buttons use `min-h-[40px]`, the "Send code" text link on verify-phone has no minimum height, and calendar day cells may fall below 44px on narrow viewports. The inconsistency suggests the 44px requirement was applied during initial development but not enforced as a convention.

**Affects:** `account/page.tsx`, `verify-phone/page.tsx`, `calendar/page.tsx`. Fix with `/adapt`.

### 4. Accessibility effort is partial and inconsistent

The codebase shows genuine accessibility effort: `role="dialog"`, `aria-modal="true"`, `aria-label` on nav buttons, `role="alert"` on some error messages, `aria-labelledby` on the main calendar modal, keyboard Escape handling. But this effort is incomplete: the admin dialog has no `aria-labelledby`, inline field errors lack `role="alert"`, there is no skip link, focus is not managed on modal open/close, and focus styles are missing on non-form interactive elements.

**Affects:** All interactive pages. Fix with `/harden`.

---

## Positive Findings

1. **Touch targets on primary buttons are correct.** All primary `<button>` and `<Link>` elements that are CTAs use `min-h-[44px]`, which meets the PRD requirement and WCAG 2.5.5.

2. **Error states use more than color.** Form errors consistently combine a red border, an error icon, and a text message — not just color. This meets WCAG SC 1.4.1 (Use of Color).

3. **Keyboard Escape dismissal on modals.** Both the calendar shift detail modal and the admin remove confirmation implement `keydown` listeners for Escape key dismissal. This is correct ARIA dialog behavior.

4. **Semantic HTML is used well.** `<header>`, `<nav>`, `<main>`, `<footer>`, `<section>`, `<dl>/<dt>/<dd>` for profile data, `<ul>/<li>` for nav and shift lists, `<table>` with `<thead>/<tbody>/<th scope="col">` in admin. The heading hierarchy is consistent (`h1` → `h2`) across all pages.

5. **Form labels are present on all inputs.** Every `<input>`, `<select>`, and `<textarea>` has an associated `<label>` with matching `htmlFor`/`id`. Required fields use both `*` visual indicator and the `required` HTML attribute where appropriate.

6. **API data is never over-fetched.** The calendar page correctly fetches shifts only for the visible month range and re-fetches on month navigation. No unnecessary data is loaded.

7. **No expensive CSS animations.** The app uses `transition` for hover effects on cards and buttons (opacity/shadow/border-color) — all compositor-friendly properties. No `width`, `height`, `top`, or `left` animations.

8. **Consistent error envelope pattern.** All API errors follow the documented `{ error, code, fields? }` envelope, and the frontend handles field-level errors by mapping them back to the correct form fields. This is solid UX for form validation.

9. **Verification gate is well-structured.** `VerificationGate.tsx` correctly handles the email-verified and phone-verified states, allows public paths, and avoids flash-of-content by showing a loading state while checking. The allowed paths list is easy to extend.

10. **`aria-label` on icon-only nav buttons.** The calendar prev/next month arrow buttons (`←` / `→`) correctly use `aria-label="Previous month"` and `aria-label="Next month"`, making them accessible to screen readers.

---

## Recommended Actions

In priority order (P0 first, then P1, then P2):

1. **[P1] `/harden`** — Fix modal focus trap in `calendar/page.tsx`, add skip-to-content link in `layout.tsx`, add `aria-labelledby` to admin dialog, add `role="alert"` to inline field errors, fix password validation in `signup/page.tsx`, verify `global-error.tsx` has `lang="en"`, add `focus-visible` styles to nav links and pill buttons
2. **[P1] `/typeset`** — Declare a font family (add `font-sans` or a web font via `next/font`), fix `prose` class by installing `@tailwindcss/typography` or removing it from privacy/terms pages
3. **[P2] `/extract`** — Extract `ErrorIcon` to shared component, extract `formatTime`/`getMonthRange` to `src/lib/time.ts`, extract `ShiftDetailModal`, `CalendarGrid`, `FilterBar`, `ShiftListPanel` from the 721-line calendar page, extract reusable `Button` and `FormField` components
4. **[P2] `/adapt`** — Fix calendar filter bar mobile overflow (collapse to disclosure/sheet on mobile), fix account page button touch targets (`min-h-[40px]` → `min-h-[44px]`), implement hamburger nav for mobile, add admin table mobile card view
5. **[P2] `/clarify`** — Format ISO dates as human-readable strings in shift detail views, update upcoming-features page SMS copy to reflect current status, rewrite landing page `<h1>` and card descriptions to eliminate redundant copy
6. **[P2] `/delight`** — Replace "Loading…" text with skeleton screens on calendar, account, and post pages
7. **[P3] `/extract`** → **`/colorize`** — After establishing a token layer, add dark mode variants for the most prominent surfaces
8. **[P3] `/bolder`** — Give the interface a distinctive visual personality; address the AI slop tells (identical card grid, generic shadows, centered everything, single button style)
9. **[P1–P3] `/polish`** — Final pass after all fixes: alignment, spacing consistency, micro-detail review

> You can ask me to run these one at a time, all at once, or in any order you prefer.
>
> Re-run `/audit` after fixes to see your score improve.
