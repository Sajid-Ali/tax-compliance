# Sarmaya Compliance Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the Google Stitch "Sarmaya Compliance" visual identity (emerald/slate institutional palette, Plus Jakarta Sans, sharp radii, flat bordered cards, fixed sidebar shell) into the live `secp-fbr-compliance` Next.js app, replacing the current indigo/violet gradient design system app-wide, without fabricating any data, metrics, or integration status the app doesn't actually have.

**Architecture:** Token-first: rewrite `app/globals.css` and the shared `components/ui/*` primitives once, so every page inherits the new look immediately. Then add a small set of new shared primitives for genuinely new UI patterns (step rail, gate row, slider, sidebar item). Then rebuild the shell (`AppShell`/`NavBar`) as a fixed sidebar. Then apply the result screen-by-screen to the 5 mapped routes, wiring only real data. Finish with a visual sweep of everything else, which inherits the new tokens automatically since it's already token-driven.

**Tech Stack:** Next.js 16.3.3 (App Router, Server Components), React 19, Tailwind CSS v4 (`@theme inline` token generation), TypeScript, Supabase (Postgres + RLS), `next/font/google`, Radix UI (`@radix-ui/react-dialog` via the existing `Sheet`/`Dialog` wrappers), `@tanstack/react-table`, `lucide-react`, `clsx`/`cn`, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-25-sarmaya-compliance-redesign-design.md`

## Global Constraints

- Full design-system replace: new tokens/fonts/radii/shadows apply app-wide via `app/globals.css` and `components/ui/*`, not just the 5 mapped screens.
- No gradient, no glow — `Button`'s primary variant, `Logo`, and every other surface use flat solid fills. `--primary-btn-from`, `--primary-btn-to`, and `--shadow-elevation-glow` are removed from `app/globals.css`; every remaining reference to them in the codebase must be fixed in the same task that removes them (Task 1.1 + Task 1.8), not left dangling until a later phase.
- `Card` and `DataTable`'s table wrapper switch from borderless-shadow to `border border-border` with **no resting shadow**. `shadow-elevation-md`/`-lg` are reserved for genuinely floating surfaces (`Dialog`, `Sheet`, dropdowns) only.
- Icons stay `lucide-react` — no new icon font or external font dependency beyond Plus Jakarta Sans (self-hosted via `next/font/google`).
- No fake role-switcher, no "Statutory Health %", no "Govt Regulatory Sandbox Verified" / "SSL 256-Bit" badges, no `PortalStatusRadar`, no cryptographic/SHA256 audit-trail claims, no capital-tiered slider-driven penalty math, no 4-step onboarding (POA/Subscription steps don't exist), no phone-OTP auth. If a mockup widget has no real data or feature behind it, it is not built — see the spec's "Explicitly out of scope" section.
- Existing component prop APIs are preserved wherever the spec says "restyle" (not "rebuild") — callers do not need to change.
- `npm run typecheck`, `npm run lint`, and `npm run test` must pass after every task that touches `.ts`/`.tsx` files. `npm run smoke-test` (hits real Supabase/Twilio/Resend) is out of scope for this work.
- Do not commit anything to git as part of these tasks — the user's stated preference is no commits unless explicitly asked. Steps below stop at "verify," not "commit."

## Review Focus

1. **Dark mode regressions** — every screen touched in Phase 4 must still render correctly with `data-theme="dark"` set on `<html>`, since dark values are derived, not sourced from a mockup. Task 1.1's dark-mode contrast is spot-checked in Task 4.6 (final dark-mode pass) across dashboard and login.
2. **Removed-token dangling references** — any leftover `var(--color-primary-btn-from)`, `var(--color-primary-btn-to)`, or `shadow-elevation-glow` class after Phase 1 renders as an invisible/no-op fill, not a build error, so it's easy to miss. Task 1.8's grep-based verification step exists specifically to catch this.
3. **RLS-gated data showing empty instead of erroring** — the new review-queue stats (Task 4.2) and filing-queue audit panel (Task 4.4) query tables (`audit_log`) gated by `is_staff()`. A client-role user hitting these routes is already redirected by the layout guards, but the queries themselves must not throw for staff with zero rows — tested with an empty-array case.
4. **`effectiveStatus` vs raw `status` mismatch** — `FilingDeadline.status` in the DB can lag the visually-correct status (only a daily cron flips it to `overdue`). Every new component that renders filing status (`VerificationGateRow` wiring, review-queue KPI tiles) must derive from `effectiveStatus(status, due_date)`, matching the existing pattern in `dashboard-summary.tsx` and `filing-queue-table.tsx`, not the raw DB column.
5. **Sidebar active-link matching on nested routes** — `SidebarNavItem`'s active state must match `/admin/filing-queue/anything` as active for the `/admin/filing-queue` link (prefix match), not just exact equality, mirroring the existing `NavBar`'s `isActive` helper — tested directly since it's easy to regress to `===`.

---

## Phase 1 — Foundation: tokens, brand, existing primitives

### Task 1.1: Rewrite design tokens in `app/globals.css`

**Files:**
- Modify: `app/globals.css` (entire `:root`, dark `@media`/`[data-theme="dark"]` blocks, `:root[data-theme="light"]`, and `@theme inline` blocks — full file currently spans lines 1–290)

**Interfaces:**
- Produces: CSS custom properties consumed by every component via Tailwind utility classes (`bg-primary`, `text-foreground`, `border-border`, `rounded-md`, `shadow-elevation-sm`, etc.) — same property *names* as before, new *values*. `--primary-btn-from`, `--primary-btn-to`, `--shadow-glow`, `--shadow-elevation-glow` are removed entirely (no replacement name).

- [ ] **Step 1: Replace the light `:root` block (lines 4–65)**

```css
:root {
  /* Surfaces — Institutional Modernism: flat white cards on a barely-tinted
     canvas, separated by a 1px hairline border, not a soft shadow. Ground
     truth is the Stitch mockup screenshots + DESIGN.md, reconciled where
     the two drifted (see spec). */
  --background: #faf8ff;
  --surface: #ffffff;
  --surface-secondary: #f2f3ff;
  --border: #e2e8f0;
  --border-subtle: #eef1f6;

  /* Text — deep slate obsidian, not warm black */
  --foreground: #0f172a;
  --muted-foreground: #64748b;

  /* Brand — flat statutory emerald. No gradient, no glow: the institutional
     tone reads as sovereign/restrained, not "bold modern SaaS." */
  --primary: #0d5c3a;
  --primary-hover: #0a482d;
  --primary-active: #073521;
  --primary-foreground: #ffffff;
  --ring: #10b981;

  /* Status */
  --success: #10b981;
  --success-bg: #ecfdf5;
  --success-border: #a7f3d0;
  --warning: #d97706;
  --warning-bg: #fef3c7;
  --warning-border: #fde68a;
  --danger: #dc2626;
  --danger-bg: #fee2e2;
  --danger-border: #fecaca;
  /* Not in DESIGN.md — kept for the existing "info" status tone (e.g. "in
     review"). An unobtrusive slate-blue consistent with the neutral palette. */
  --info: #2563eb;
  --info-bg: #eff6ff;
  --info-border: #bfdbfe;

  /* Elevation — DESIGN.md Tier 1/2/3: cards get a hairline border and ZERO
     resting shadow; shadow is reserved for flyouts (Tier 2) and modals
     (Tier 3). This is a deliberate reversal of the previous shadow-only
     card treatment. */
  --shadow-sm: 0 1px 2px rgb(15 23 42 / 0.04);
  --shadow-md:
    0 4px 12px -2px rgb(15 23 42 / 0.06), 0 2px 6px -1px rgb(15 23 42 / 0.04);
  --shadow-lg:
    0 20px 25px -5px rgb(15 23 42 / 0.12), 0 8px 10px -6px rgb(15 23 42 / 0.06);
  --overlay: rgb(15 23 42 / 0.6);
}
```

- [ ] **Step 2: Replace the dark `@media (prefers-color-scheme: dark)` block (lines 67–109)**

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    /* Derived, not sourced from a mockup — keeps the emerald hue family
       rather than going neutral-gray, so dark mode still reads as the same
       brand. Status colors reuse the previous dark theme's values since
       they already sit comfortably in this palette. */
    --background: #0a0f0d;
    --surface: #121815;
    --surface-secondary: #1a211d;
    --border: #2a322d;
    --border-subtle: #212820;

    --foreground: #eff3f0;
    --muted-foreground: #9aa79e;

    /* Bright mint on dark, not the deep light-mode emerald — that hue is
       too dark to read as an accent against a near-black background. Text
       on it is dark, not white: #34D399 is light enough that white text
       fails 4.5:1 contrast. */
    --primary: #34d399;
    --primary-hover: #6ee7b7;
    --primary-active: #10b981;
    --primary-foreground: #052e1c;
    --ring: #34d399;

    --success: #37d391;
    --success-bg: #0f2a1d;
    --success-border: #17402c;
    --warning: #f0b64a;
    --warning-bg: #2e2408;
    --warning-border: #493a10;
    --danger: #ee8479;
    --danger-bg: #2d1512;
    --danger-border: #49211a;
    --info: #7c92ff;
    --info-bg: #171e35;
    --info-border: #253158;

    --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.3);
    --shadow-md: 0 4px 12px -2px rgb(0 0 0 / 0.4), 0 2px 6px -1px rgb(0 0 0 / 0.3);
    --shadow-lg: 0 20px 25px -5px rgb(0 0 0 / 0.55), 0 8px 10px -6px rgb(0 0 0 / 0.4);
    --overlay: rgb(0 0 0 / 0.7);
  }
}
```

- [ ] **Step 3: Replace `:root[data-theme="dark"]` (lines 114–146) with the same values as Step 2's block**, and `:root[data-theme="light"]` (lines 148–180) with the same values as Step 1's block. (Both manual-override blocks must mirror their automatic counterpart exactly — that's the existing pattern, keeping it means copying the same value lists, not re-deriving them.)

- [ ] **Step 4: Update the `@theme inline` block (lines 182–237)** — remove the `--color-primary-btn-from`, `--color-primary-btn-to`, and `--shadow-elevation-glow` lines entirely (no replacement), remove `--color-primary-glow` (light/dark palettes above no longer define `--primary-glow`), and change the radius scale:

```css
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
```

  (`--font-sans`/`--font-mono`/`--ease-snap` lines are unchanged here — the font *values* they reference change in Task 1.2, not this file.)

- [ ] **Step 5: Verify**

Run: `npm run typecheck && npm run lint`
Expected: both pass — this file has no TS, so this mainly confirms no other task's leftover code broke; if either fails, it's pre-existing and unrelated to this step (CSS-only change).

Run: `grep -rn "primary-btn-from\|primary-btn-to\|elevation-glow\|color-primary-glow" app/globals.css`
Expected: no matches.

---

### Task 1.2: Switch to Plus Jakarta Sans and rebrand metadata in `app/layout.tsx`

**Files:**
- Modify: `app/layout.tsx` (full file, 51 lines)

**Interfaces:**
- Produces: `--font-plus-jakarta-sans` CSS variable, applied as `--font-sans` (already wired in Task 1.1's untouched `@theme inline` lines: `--font-sans: var(--font-geist-sans);` → must become `--font-sans: var(--font-plus-jakarta-sans);`). Geist Mono stays as `--font-mono`.

- [ ] **Step 1: Update the font imports and variable name**

Replace:
```tsx
import { Geist, Geist_Mono } from "next/font/google";
```
with:
```tsx
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
```

Replace:
```tsx
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
```
with:
```tsx
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});
```

Update the `<html>` className from `` `${geistSans.variable} ${geistMono.variable} h-full antialiased` `` to `` `${plusJakartaSans.variable} ${geistMono.variable} h-full antialiased` ``.

- [ ] **Step 2: Update `app/globals.css`'s `--font-sans` line** (part of the `@theme inline` block from Task 1.1, easy to miss since it's a different file):

```css
  --font-sans: var(--font-plus-jakarta-sans);
  --font-mono: var(--font-geist-mono);
```

- [ ] **Step 3: Rebrand the page metadata**

Replace:
```tsx
export const metadata: Metadata = {
  title: "Compliance Reminders — SECP Form A tracking",
  description: "Never miss an SECP annual filing deadline again.",
};
```
with:
```tsx
export const metadata: Metadata = {
  title: "Sarmaya Compliance — SECP Form A tracking",
  description: "Never miss an SECP annual filing deadline again.",
};
```

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run lint`
Expected: both pass.

Run: `npm run dev` (or reuse a running dev server), open `http://localhost:3000` in a browser, inspect a heading with devtools — the computed `font-family` should list "Plus Jakarta Sans" first.
Expected: Plus Jakarta Sans renders; no FOUC/layout shift (next/font guarantees this).

---

### Task 1.3: Rebuild `components/logo.tsx` with the Sarmaya Compliance mark

**Files:**
- Modify: `components/logo.tsx` (full file, 24 lines)

**Interfaces:**
- Consumes: nothing new.
- Produces: same prop API as before — `Logo({ className?, size?: "sm" | "lg" })` — so `app/login/page.tsx`'s `<Logo size="lg" />` and `NavBar`'s `<Logo />` (Task 3.2) don't need changes.

- [ ] **Step 1: Replace the component with the real SVG mark**

Source: `/Users/sajid/Desktop/stitch_pakcomply_secp_fbr_compliance_manager/sarmaya_compliance_logo/code.html` (shield + checkmark badge, "Sarmaya**Compliance**" wordmark). Adapted to flat `--primary` (no glow) and the existing `size` API:

```tsx
import { cn } from "@/lib/cn";

export function Logo({ className, size = "sm" }: { className?: string; size?: "sm" | "lg" }) {
  const dims = size === "lg" ? 44 : 28;
  const text = size === "lg" ? "text-xl font-bold tracking-tight" : "text-sm font-semibold tracking-tight";
  const tagline = size === "lg" ? "text-[11px]" : "text-[9px]";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg width={dims} height={dims} viewBox="0 0 56 56" fill="none" aria-hidden>
        <rect width="56" height="56" rx="12" className="fill-primary" />
        <path
          d="M28 12L40 18V30C40 37.5 35 42 28 44C21 42 16 37.5 16 30V18L28 12Z"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M23 28L27 32L34 24"
          className="stroke-success"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex flex-col leading-none">
        <span className={cn(text, "text-foreground")}>
          Sarmaya<span className="text-primary">Compliance</span>
        </span>
        {size === "lg" && (
          <span className={cn(tagline, "mt-1 tracking-wide text-muted-foreground uppercase")}>
            SECP &amp; FBR Annual Automation
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint`
Expected: both pass.

Visual check: open `/login` in the dev server — the large logo should show the emerald shield-with-checkmark mark, "Sarmaya**Compliance**" wordmark (second word in `--primary`), and the tagline beneath it. Compare against `sarmaya_compliance_logo/screen.png`.

---

### Task 1.4: Rename brand text app-wide

**Files:**
- Modify: `README.md:1`
- Modify: `app/login/page.tsx:229`
- Modify: `components/landing/landing-page.tsx:395`

**Interfaces:** none — plain text replacement.

- [ ] **Step 1: `README.md:1`**

Replace:
```markdown
# Compliance Reminders — SECP Form A tracking (V1)
```
with:
```markdown
# Sarmaya Compliance — SECP Form A tracking (V1)
```

- [ ] **Step 2: `app/login/page.tsx:229`**

Replace:
```tsx
            <p className="text-sm text-muted-foreground">Sign in to Compliance Reminders.</p>
```
with:
```tsx
            <p className="text-sm text-muted-foreground">Sign in to Sarmaya Compliance.</p>
```

- [ ] **Step 3: `components/landing/landing-page.tsx:395`**

Replace:
```tsx
          <span>Compliance Reminders is a filing assistant. It does not provide legal or tax advice.</span>
```
with:
```tsx
          <span>Sarmaya Compliance is a filing assistant. It does not provide legal or tax advice.</span>
```

- [ ] **Step 4: Verify**

Run: `grep -rn "Compliance Reminders" --include="*.tsx" --include="*.ts" --include="*.md" . --exclude-dir=node_modules`
Expected: no matches anywhere in the repo.

Run: `npm run typecheck && npm run lint`
Expected: both pass.

---

### Task 1.5: Restyle `Button` — flat primary, no gradient/glow

**Files:**
- Modify: `components/ui/button.tsx:8-18` (the `variantClasses` map)

**Interfaces:**
- Consumes: `--color-primary`, `--color-primary-hover`, `--color-primary-active`, `--color-primary-foreground`, `--shadow-elevation-sm` (all defined in Task 1.1).
- Produces: same `buttonVariants(opts)` and `<Button>` API as before (`variant`, `size`, `loading`, all existing props unchanged) — no caller changes needed anywhere in the app.

- [ ] **Step 1: Replace the `variantClasses` map**

```tsx
const variantClasses: Record<Variant, string> = {
  // Flat solid fill — Institutional Modernism has no gradient/glow
  // anywhere; the primary action reads as authoritative through color and
  // weight, not shine.
  primary: "bg-primary text-primary-foreground shadow-elevation-sm hover:bg-primary-hover active:bg-primary-active",
  secondary: "bg-surface-secondary text-foreground hover:bg-border border border-border",
  outline: "bg-surface text-foreground border border-border hover:bg-surface-secondary",
  ghost: "text-foreground hover:bg-surface-secondary",
  danger: "bg-danger text-white hover:opacity-90 shadow-elevation-sm",
};
```

  (Also remove the lift/press micro-interaction from `buttonVariants`'s base string, lines 28–29 — the institutional tone doesn't use it. Replace:
  ```tsx
    "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-[background-color,color,transform,box-shadow,filter] duration-150 ease-snap cursor-pointer active:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
  ```
  with:
  ```tsx
    "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors duration-150 ease-snap cursor-pointer",
    "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
  ```
  — note `rounded-lg` → `rounded-md`, matching DESIGN.md's 8px button radius.)

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint`
Expected: both pass.

Run: `grep -n "primary-btn-from\|primary-btn-to\|elevation-glow" components/ui/button.tsx`
Expected: no matches.

Visual check: any page with a primary button (e.g. `/login`'s "Send magic link") should render a flat emerald button with no gradient/glow, 8px corners.

---

### Task 1.6: Restyle `Card` and `DataTable`'s wrapper — bordered, no resting shadow

**Files:**
- Modify: `components/ui/card.tsx:4-19` (the `Card` function only)
- Modify: `components/ui/data-table.tsx:91` (the table wrapper `<div>`)

**Interfaces:**
- Produces: same `Card`/`CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter` exports and props as before.

- [ ] **Step 1: Replace `Card` in `components/ui/card.tsx`**

```tsx
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      // Flat + bordered, not shadow-lifted — DESIGN.md Tier 1: a 1px
      // hairline border and zero resting shadow keeps document boundaries
      // sharp, matching a legal/statutory-document reading register.
      className={cn("rounded-md border border-border bg-surface", className)}
      {...props}
    />
  );
}
```

  (`CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter` below it are unchanged — they don't reference shadow or radius.)

- [ ] **Step 2: Update the `DataTable` wrapper in `components/ui/data-table.tsx:91`**

Replace:
```tsx
      <div className="overflow-x-auto rounded-lg bg-surface shadow-elevation-sm">
```
with:
```tsx
      <div className="overflow-x-auto rounded-md border border-border bg-surface">
```

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run lint`
Expected: both pass.

Visual check: any page with a `Card` or `DataTable` (e.g. `/admin/rules`, `/dashboard`) should show a white panel with a visible 1px border and no drop shadow.

---

### Task 1.7: Restyle `Input`/`Select`/`Textarea` radius

**Files:**
- Modify: `components/ui/input.tsx:10-14` (the `fieldBase` string only)

**Interfaces:** same `Input`/`Textarea`/`Select`/`Label`/`Field` exports and props as before.

- [ ] **Step 1: Change the radius in `fieldBase`**

Replace:
```tsx
const fieldBase =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors " +
```
with:
```tsx
const fieldBase =
  "w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors " +
```

  (DESIGN.md: form controls fixed at 4px — `--radius-sm` from Task 1.1 — sharper than cards/buttons, matching the "precision legal instrument" shape language.)

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint`
Expected: both pass.

Visual check: any form input (e.g. `/login`'s email field) should show visibly sharper corners than the surrounding card.

---

### Task 1.8: Neutralize orphaned gradient references in `dashboard-summary.tsx` and `pricing-toggle.tsx`

This is a **mechanical, minimal** fix only — it exists so Phase 1 doesn't leave these two files rendering an invisible gradient (since Task 1.1 removed `--primary-btn-from`/`--primary-btn-to`/`--shadow-elevation-glow` entirely). Their full restyle happens in Phase 4 (Task 4.1) and Phase 5 (sweep) respectively — do not do more than this here.

**Files:**
- Modify: `components/dashboard-summary.tsx:62`
- Modify: `components/landing/pricing-toggle.tsx:118`

**Interfaces:** none.

- [ ] **Step 1: `components/dashboard-summary.tsx:62`**

Replace:
```tsx
              ? "bg-[linear-gradient(135deg,var(--color-primary-btn-from)_0%,var(--color-primary-btn-to)_100%)] shadow-elevation-glow"
```
with:
```tsx
              ? "bg-primary shadow-elevation-sm"
```

- [ ] **Step 2: `components/landing/pricing-toggle.tsx:118`**

Replace:
```tsx
                <div className="absolute -top-3 left-7 rounded-full bg-[linear-gradient(135deg,var(--color-primary-btn-from)_0%,var(--color-primary-btn-to)_100%)] px-3 py-1 text-[10.5px] font-semibold tracking-wide text-primary-foreground uppercase">
```
with:
```tsx
                <div className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-[10.5px] font-semibold tracking-wide text-primary-foreground uppercase">
```

- [ ] **Step 3: Verify**

Run: `grep -rln "primary-btn-from\|primary-btn-to\|elevation-glow" --include="*.tsx" --include="*.ts" --include="*.css" app components 2>/dev/null`
Expected: **no output** — this is the check that Phase 1 left zero dangling references to the removed tokens anywhere in the codebase.

Run: `npm run typecheck && npm run lint && npm run test`
Expected: all three pass. This is the Phase 1 exit gate — every file touched so far compiles, lints, and the existing vitest suite (`lib/__tests__/rules-engine.test.ts`, `lib/documents/__tests__/form-a-template.test.ts`) still passes untouched.

---

## Phase 2 — New shared primitives

### Task 2.1: `getStepState` pure function + `StepIndicator` component

**Files:**
- Create: `lib/step-state.ts`
- Create: `lib/__tests__/step-state.test.ts`
- Create: `components/ui/step-indicator.tsx`

**Interfaces:**
- Produces: `getStepState(stepIndex: number, currentIndex: number): "completed" | "in-progress" | "pending"`, and `StepIndicator({ steps: string[]; currentIndex: number; className?: string })`.
- Consumed by: Task 4.6 (company detail page setup-completeness rail).

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/step-state.test.ts
import { describe, it, expect } from "vitest";
import { getStepState } from "../step-state";

describe("getStepState", () => {
  it("marks steps before the current index as completed", () => {
    expect(getStepState(0, 2)).toBe("completed");
    expect(getStepState(1, 2)).toBe("completed");
  });

  it("marks the current index as in-progress", () => {
    expect(getStepState(2, 2)).toBe("in-progress");
  });

  it("marks steps after the current index as pending", () => {
    expect(getStepState(3, 2)).toBe("pending");
  });

  it("marks every step completed when currentIndex is past the last step", () => {
    expect(getStepState(3, 4)).toBe("completed");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/__tests__/step-state.test.ts`
Expected: FAIL — `Cannot find module '../step-state'`

- [ ] **Step 3: Write the implementation**

```ts
// lib/step-state.ts
export type StepState = "completed" | "in-progress" | "pending";

/** Pure step-state derivation shared by StepIndicator and its callers. */
export function getStepState(stepIndex: number, currentIndex: number): StepState {
  if (stepIndex < currentIndex) return "completed";
  if (stepIndex === currentIndex) return "in-progress";
  return "pending";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/__tests__/step-state.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Build the `StepIndicator` component**

```tsx
// components/ui/step-indicator.tsx
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { getStepState } from "@/lib/step-state";

export function StepIndicator({
  steps,
  currentIndex,
  className,
}: {
  steps: string[];
  currentIndex: number;
  className?: string;
}) {
  return (
    <ol className={cn("flex items-center", className)}>
      {steps.map((step, i) => {
        const state = getStepState(i, currentIndex);
        const isLast = i === steps.length - 1;
        return (
          <li key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  state === "completed" && "bg-primary text-primary-foreground",
                  state === "in-progress" && "border-2 border-primary text-primary",
                  state === "pending" && "border border-dashed border-border text-muted-foreground"
                )}
              >
                {state === "completed" ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "whitespace-nowrap text-xs font-medium",
                  state === "pending" ? "text-muted-foreground" : "text-foreground"
                )}
              >
                {step}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "mx-2 h-px flex-1",
                  state === "completed" ? "bg-primary" : "border-t border-dashed border-border"
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
```

- [ ] **Step 6: Verify**

Run: `npm run typecheck && npm run lint && npx vitest run lib/__tests__/step-state.test.ts`
Expected: all pass.

---

### Task 2.2: `deriveFilingGates` pure function + `VerificationGateRow` component

**Files:**
- Create: `lib/gates.ts`
- Create: `lib/__tests__/gates.test.ts`
- Create: `components/ui/verification-gate-row.tsx`

**Interfaces:**
- Consumes: `Filing`, `FilingStatus` from `lib/types.ts`; `effectiveStatus` from `lib/rules-engine.ts`.
- Produces: `type GateStatus = "pending" | "passed" | "blocked"`, `interface GateInfo { label: string; status: GateStatus; timestamp?: string | null }`, `deriveFilingGates(filing: Pick<Filing, "reviewer_notes" | "approved_at" | "filed_at"> | null, deadlineStatus: FilingStatus): GateInfo[]`, and `VerificationGateRow({ gate: GateInfo; className?: string })`.
- Consumed by: Task 4.2 (review-queue), Task 4.4 (filing-queue).

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/gates.test.ts
import { describe, it, expect } from "vitest";
import { deriveFilingGates } from "../gates";

describe("deriveFilingGates", () => {
  it("shows all gates pending before a draft exists", () => {
    const gates = deriveFilingGates(null, "upcoming");
    expect(gates.map((g) => g.status)).toEqual(["pending", "pending", "pending"]);
  });

  it("marks the draft gate passed once a draft is ready, review still pending", () => {
    const gates = deriveFilingGates(null, "draft_ready");
    expect(gates[0].status).toBe("passed");
    expect(gates[1].status).toBe("pending");
  });

  it("marks the review gate blocked when the reviewer left notes without approving", () => {
    const gates = deriveFilingGates(
      { reviewer_notes: "NTN mismatch, please correct", approved_at: null, filed_at: null },
      "draft_ready"
    );
    expect(gates[1].status).toBe("blocked");
  });

  it("marks the review gate passed once approved, carrying the approval timestamp", () => {
    const gates = deriveFilingGates(
      { reviewer_notes: null, approved_at: "2026-09-01T10:00:00Z", filed_at: null },
      "approved"
    );
    expect(gates[1].status).toBe("passed");
    expect(gates[1].timestamp).toBe("2026-09-01T10:00:00Z");
  });

  it("marks the filed gate passed once filed_at is set", () => {
    const gates = deriveFilingGates(
      { reviewer_notes: null, approved_at: "2026-09-01T10:00:00Z", filed_at: "2026-09-02T09:00:00Z" },
      "filed"
    );
    expect(gates[2].status).toBe("passed");
    expect(gates[2].timestamp).toBe("2026-09-02T09:00:00Z");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/__tests__/gates.test.ts`
Expected: FAIL — `Cannot find module '../gates'`

- [ ] **Step 3: Write the implementation**

```ts
// lib/gates.ts
import type { Filing, FilingStatus } from "./types";

export type GateStatus = "pending" | "passed" | "blocked";

export interface GateInfo {
  label: string;
  status: GateStatus;
  timestamp?: string | null;
}

/**
 * Maps the real filing/deadline state to the 3 gates a filing passes
 * through. Deliberately reads only the fields the schema actually has
 * (reviewer_notes/approved_at/filed_at) — no invented gate types.
 */
export function deriveFilingGates(
  filing: Pick<Filing, "reviewer_notes" | "approved_at" | "filed_at"> | null,
  deadlineStatus: FilingStatus
): GateInfo[] {
  const draftPending = deadlineStatus === "upcoming" || deadlineStatus === "reminder_sent";

  const reviewStatus: GateStatus = filing?.approved_at
    ? "passed"
    : filing?.reviewer_notes
      ? "blocked"
      : "pending";

  return [
    { label: "Draft generated", status: draftPending ? "pending" : "passed" },
    { label: "CA / CS review", status: reviewStatus, timestamp: filing?.approved_at ?? null },
    { label: "Filed with SECP", status: filing?.filed_at ? "passed" : "pending", timestamp: filing?.filed_at ?? null },
  ];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/__tests__/gates.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Build the `VerificationGateRow` component**

```tsx
// components/ui/verification-gate-row.tsx
import { CheckCircle2, Circle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import type { GateInfo } from "@/lib/gates";

export function VerificationGateRow({ gate, className }: { gate: GateInfo; className?: string }) {
  const Icon = gate.status === "passed" ? CheckCircle2 : gate.status === "blocked" ? AlertTriangle : Circle;
  const iconClass =
    gate.status === "passed" ? "text-success" : gate.status === "blocked" ? "text-danger" : "text-muted-foreground";

  return (
    <div className={cn("flex items-center justify-between gap-3 py-2", className)}>
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4 shrink-0", iconClass)} />
        <span className="text-sm font-medium text-foreground">{gate.label}</span>
      </div>
      {gate.timestamp && (
        <span className="text-xs tabular-nums text-muted-foreground">
          {new Date(gate.timestamp).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Verify**

Run: `npm run typecheck && npm run lint && npx vitest run lib/__tests__/gates.test.ts`
Expected: all pass.

---

### Task 2.3: `SimulatorSlider` component

**Files:**
- Create: `components/ui/simulator-slider.tsx`

**Interfaces:**
- Produces: `SimulatorSlider({ label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (value: number) => void; className?: string })`. Purely presentational/controlled — no derived logic, so no pure-function extraction or test (nothing to unit-test beyond "does onChange fire," which is React-event plumbing already covered by the browser interaction, not business logic).

- [ ] **Step 1: Build the component**

```tsx
// components/ui/simulator-slider.tsx
import { cn } from "@/lib/cn";

export function SimulatorSlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  className,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {value.toLocaleString()}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-secondary accent-primary"
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint`
Expected: both pass. (No usage yet — this primitive is built for future use per the spec; it is not wired into the rules screen, which gets a static preview instead. See Task 4.3.)

---

### Task 2.4: `isNavLinkActive` pure function + `SidebarNavItem` component

**Files:**
- Create: `lib/nav-active.ts`
- Create: `lib/__tests__/nav-active.test.ts`
- Create: `components/ui/sidebar-nav-item.tsx`

**Interfaces:**
- Produces: `isNavLinkActive(pathname: string | null, href: string): boolean` and `SidebarNavItem({ href: string; label: string; icon: LucideIcon; active: boolean })`.
- Consumed by: Task 3.2 (`NavBar` rebuild).

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/nav-active.test.ts
import { describe, it, expect } from "vitest";
import { isNavLinkActive } from "../nav-active";

describe("isNavLinkActive", () => {
  it("matches an exact path", () => {
    expect(isNavLinkActive("/admin/filing-queue", "/admin/filing-queue")).toBe(true);
  });

  it("matches a nested path under the link", () => {
    expect(isNavLinkActive("/admin/filing-queue/123", "/admin/filing-queue")).toBe(true);
  });

  it("does not match a sibling path that merely shares a prefix string", () => {
    expect(isNavLinkActive("/admin/filing-queue-archive", "/admin/filing-queue")).toBe(false);
  });

  it("does not match an unrelated path", () => {
    expect(isNavLinkActive("/admin/rules", "/admin/filing-queue")).toBe(false);
  });

  it("returns false for a null pathname", () => {
    expect(isNavLinkActive(null, "/admin/filing-queue")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/__tests__/nav-active.test.ts`
Expected: FAIL — `Cannot find module '../nav-active'`

- [ ] **Step 3: Write the implementation**

```ts
// lib/nav-active.ts
/**
 * True if `pathname` is `href` or a path nested under it. Guards the
 * "sibling path shares a string prefix" bug (`/admin/filing-queue-archive`
 * must NOT match `/admin/filing-queue`) by requiring a `/` boundary.
 */
export function isNavLinkActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/__tests__/nav-active.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Build the `SidebarNavItem` component**

```tsx
// components/ui/sidebar-nav-item.tsx
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function SidebarNavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary font-semibold"
          : "text-muted-foreground hover:bg-surface-secondary hover:text-foreground"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}
```

- [ ] **Step 6: Verify**

Run: `npm run typecheck && npm run lint && npx vitest run lib/__tests__/nav-active.test.ts`
Expected: all pass.

---

## Phase 3 — Shell rebuild

### Task 3.1: Add an `icon` field to `RoleNavConfig` in `lib/role-nav.ts`

**Files:**
- Modify: `lib/role-nav.ts` (full file, 27 lines)

**Interfaces:**
- Consumes: `LucideIcon` type from `lucide-react`.
- Produces: `RoleNavConfig.links` items gain `icon: LucideIcon`; `getRoleNavConfig(role)` signature unchanged.
- Consumed by: Task 3.2 (`NavBar`).

- [ ] **Step 1: Replace the file**

```ts
// lib/role-nav.ts
import { LayoutGrid, Send, Scale, CreditCard } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UserRole } from "@/lib/types";

export interface RoleNavConfig {
  links: { href: string; label: string; icon: LucideIcon }[];
  roleLabel: string;
  homeHref: string;
}

/** Nav shell config per role — shared by the three role layouts and /profile. */
export function getRoleNavConfig(role: UserRole): RoleNavConfig {
  switch (role) {
    case "admin":
      return {
        links: [
          { href: "/admin/filing-queue", label: "Filing queue", icon: Send },
          { href: "/admin/rules", label: "Rules", icon: Scale },
          { href: "/admin/billing", label: "Billing", icon: CreditCard },
        ],
        roleLabel: "Admin",
        homeHref: "/admin/filing-queue",
      };
    case "reviewer":
      return { links: [], roleLabel: "CA reviewer", homeHref: "/review-queue" };
    case "client":
    default:
      return {
        links: [{ href: "/dashboard", label: "Dashboard", icon: LayoutGrid }],
        roleLabel: "Company owner",
        homeHref: "/dashboard",
      };
  }
}
```

  (The `reviewer` role keeps an empty `links` array, matching current behavior — `/review-queue` is its only page today, same as before this change. The `client` role previously had `links: []` too, relying on the logo-as-home-link alone; it now gets one explicit `Dashboard` entry since the sidebar shell shows nav items as a list, not a single logo-click — an empty sidebar would look broken. This is a minimal, honest addition: the link already existed as `homeHref`, it's just now also visible as a nav row.)

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint`
Expected: both pass — this will show type errors in `nav-bar.tsx` until Task 3.2 lands (expected; both tasks land together in the same session before the phase-exit test run).

---

### Task 3.2: Rebuild `NavBar` as the fixed sidebar

**Files:**
- Modify: `components/nav-bar.tsx` (full file, 153 lines → replaced)

**Interfaces:**
- Consumes: `RoleNavConfig` (Task 3.1), `SidebarNavItem` (Task 2.4), `isNavLinkActive` (Task 2.4), existing `Logo`, `Avatar`, `ThemeToggle`, `Sheet`/`SheetContent`/`SheetTrigger`/`SheetTitle`.
- Produces: same `NavBar({ links, email, avatarUrl, roleLabel, homeHref })` prop signature as before — `AppShell` (Task 3.3) doesn't need its call site changed, only its internal composition.

- [ ] **Step 1: Replace the file**

```tsx
// components/nav-bar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { Logo } from "@/components/logo";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SidebarNavItem } from "@/components/ui/sidebar-nav-item";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { isNavLinkActive } from "@/lib/nav-active";
import type { RoleNavConfig } from "@/lib/role-nav";

function UserMenu({
  email,
  avatarUrl,
  roleLabel,
}: {
  email?: string | null;
  avatarUrl?: string | null;
  roleLabel?: string;
}) {
  if (!email) return null;
  return (
    <Link
      href="/profile"
      className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-surface-secondary"
    >
      <div className="hidden flex-col items-end leading-tight sm:flex">
        <span className="text-xs font-medium text-foreground">{email}</span>
        {roleLabel && <span className="text-[11px] text-muted-foreground">{roleLabel}</span>}
      </div>
      <Avatar src={avatarUrl} email={email} size="sm" />
    </Link>
  );
}

function SidebarNav({ links }: { links: RoleNavConfig["links"] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 px-3">
      {links.map((link) => (
        <SidebarNavItem
          key={link.href}
          href={link.href}
          label={link.label}
          icon={link.icon}
          active={isNavLinkActive(pathname, link.href)}
        />
      ))}
    </nav>
  );
}

export function NavBar({
  links,
  email,
  avatarUrl,
  roleLabel,
  homeHref,
}: {
  links: RoleNavConfig["links"];
  email?: string | null;
  avatarUrl?: string | null;
  roleLabel?: string;
  homeHref: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Fixed top header — full width, above the sidebar */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {links.length > 0 && (
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-secondary hover:text-foreground lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          )}
          <Link href={homeHref}>
            <Logo />
          </Link>
        </div>

        <div className="flex items-center gap-1.5">
          <UserMenu email={email} avatarUrl={avatarUrl} roleLabel={roleLabel} />
          <ThemeToggle />
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-secondary hover:text-foreground"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>

      {/* Fixed left sidebar — desktop/tablet only; mobile uses the Sheet below */}
      {links.length > 0 && (
        <aside className="fixed inset-y-0 left-0 top-16 z-20 hidden w-72 flex-col gap-1 border-r border-border bg-surface py-4 lg:flex">
          <SidebarNav links={links} />
        </aside>
      )}

      {/* Mobile off-canvas nav */}
      {links.length > 0 && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent>
            <SheetTitle className="text-sm font-semibold tracking-tight text-foreground">
              Menu
            </SheetTitle>
            <div onClick={() => setMobileOpen(false)}>
              <SidebarNav links={links} />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
```

  Note: the `reviewer` role (empty `links`) renders the header alone, no sidebar/hamburger — same visible behavior as today's top-nav for that role (it had `links: []` too), just without a sidebar rail. This matches the spec ("role's own nav links only") — an empty list means nothing to show.

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint`
Expected: both pass — `AppShell` (Task 3.3) still expects the old `<main className="mx-auto ...">` wrapper; the next task updates it to match this new fixed-header/fixed-sidebar layout.

---

### Task 3.3: Rebuild `AppShell` for the fixed sidebar layout

**Files:**
- Modify: `components/app-shell.tsx` (full file, 39 lines)

**Interfaces:**
- Produces: same `AppShell({ links, email, avatarUrl, roleLabel, homeHref, maxWidth?, children })` prop signature as before — the three role layouts (`app/(client)/layout.tsx`, `app/(reviewer)/layout.tsx`, `app/admin/layout.tsx`) need **no changes**.

- [ ] **Step 1: Replace the file**

```tsx
// components/app-shell.tsx
import { NavBar } from "@/components/nav-bar";
import { cn } from "@/lib/cn";
import type { RoleNavConfig } from "@/lib/role-nav";

/**
 * Shared visual chrome (fixed header + fixed sidebar + main) for all three
 * role layouts. Auth/role-guard logic stays in each (client|admin|reviewer)
 * /layout.tsx — those genuinely differ per role, only the chrome was
 * duplicated. Sidebar width (w-72) must match NavBar's `<aside>` width.
 */
export function AppShell({
  links,
  email,
  avatarUrl,
  roleLabel,
  homeHref,
  maxWidth = "max-w-3xl",
  children,
}: {
  links: RoleNavConfig["links"];
  email?: string | null;
  avatarUrl?: string | null;
  roleLabel?: string;
  homeHref: string;
  maxWidth?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <NavBar links={links} email={email} avatarUrl={avatarUrl} roleLabel={roleLabel} homeHref={homeHref} />
      <main className={cn("pt-16", links.length > 0 && "lg:pl-72")}>
        <div className={cn("mx-auto px-4 py-10 sm:px-6", maxWidth)}>{children}</div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint`
Expected: both pass.

---

### Task 3.4: Confirm the three role layouts against the rebuilt shell

**Files:**
- Verify (no expected changes): `app/(client)/layout.tsx`, `app/(reviewer)/layout.tsx`, `app/admin/layout.tsx`

**Interfaces:** none — this task is a verification-only checkpoint, the phase-exit gate for Phase 3.

- [ ] **Step 1: Confirm no changes are needed**

Read all three files. Each calls `<AppShell {...nav} email={...} avatarUrl={...} maxWidth="...">` where `nav = getRoleNavConfig(role)`. Since `RoleNavConfig`'s shape only gained a field (`icon` on each link item) and `AppShell`'s prop signature is unchanged, these three files should typecheck with zero edits.

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint && npm run test`
Expected: all three pass. This is the Phase 3 exit gate.

Visual check: run the dev server, sign in as each role (client/reviewer/admin — or inspect via the existing seed script `npm run seed` if you need seeded users), confirm:
- Header is fixed at the top, full width, 64px tall.
- Client and admin roles show a fixed left sidebar (w-72) with their own nav items only, icons + labels, active item highlighted.
- Reviewer role shows the header only, no sidebar (empty links list) — same as before this phase.
- Resizing to mobile width hides the sidebar and shows a hamburger button that opens the off-canvas `Sheet` with the same nav items.
- No fake role-switcher tab pill anywhere.

---

## Phase 4 — Screen-by-screen

### Task 4.1: Dashboard restyle

**Files:**
- Modify: `components/dashboard-summary.tsx` (full visual pass — Task 1.8 already fixed the one dangling gradient reference; this task finishes the restyle)
- Modify: `components/tables/companies-table.tsx` (visual only — icon container radius)

**Interfaces:** no prop signature changes to either component.

- [ ] **Step 1: Finish `dashboard-summary.tsx`'s tile treatment**

The `badgeClasses`/`underlineClasses` gradient maps (lines 36–50) reference `--color-info-bg`/`--color-info-border`/etc. gradients, which still exist as tokens (only the *primary* gradient tokens were removed) — but per the "no gradient anywhere" constraint, flatten these too for consistency with the rest of the redesign. Replace lines 36–50:

```tsx
  const badgeClasses = {
    hero: "bg-white/15 text-white",
    info: "bg-info-bg text-info",
    warning: "bg-warning-bg text-warning",
    danger: "bg-danger-bg text-danger",
  };

  const underlineClasses = {
    hero: "bg-white/40",
    info: "bg-info",
    warning: "bg-warning",
    danger: "bg-danger",
  };
```

  And the tile container's tone classes (line 61, already partially fixed in Task 1.8) — confirm it now reads:

```tsx
            tile.tone === "hero"
              ? "bg-primary shadow-elevation-sm"
              : cn(
                  "border bg-surface",
                  tile.tone === "danger" && overdue > 0 ? "border-danger-border" : "border-border"
                )
```

  (drops `shadow-elevation-sm hover:shadow-elevation-md` from the non-hero branch — flat bordered cards per the Phase 1 `Card` treatment — and `rounded-xl` on line 59 becomes `rounded-md` to match the new radius scale.)

- [ ] **Step 2: `companies-table.tsx` icon container radius**

Replace (line 30):
```tsx
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-secondary text-muted-foreground">
```
This is already `rounded-md` — no change needed. Confirm and move on.

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run lint`
Expected: both pass.

Visual check: `/dashboard` — the 4 summary tiles should show a flat emerald hero tile (no gradient) and 3 flat bordered tiles, all sharing the sidebar-shell layout from Phase 3. Compare structure against `founder_compliance_command_center/screen.png`'s KPI row (colors/shell differ per the spec's IA decision — the list view is kept, not the single-entity dossier).

Dark-mode check: toggle `ThemeToggle`, confirm the hero tile's flat `bg-primary` (bright mint in dark mode per Task 1.1) still has readable dark text (`--primary-foreground: #052e1c`).

---

### Task 4.2: Review queue — real KPI stats + gate rows

**Files:**
- Create: `lib/review-queue-stats.ts`
- Create: `lib/__tests__/review-queue-stats.test.ts`
- Modify: `app/(reviewer)/review-queue/page.tsx` (broaden the query, compute stats, render a KPI row)
- Modify: `components/tables/review-queue-table.tsx` (add a gate-row expansion per `VerificationGateRow`)

**Interfaces:**
- Consumes: `Filing`, `FilingDeadline`, `FilingStatus` from `lib/types.ts`; `effectiveStatus` from `lib/rules-engine.ts`; `deriveFilingGates` (Task 2.2).
- Produces: `interface ReviewQueueStats { pendingCount: number; approvedTodayCount: number; changesRequestedCount: number }`, `computeReviewQueueStats(rows: Array<{ status: FilingStatus; approved_at: string | null; reviewer_notes: string | null }>, today?: Date): ReviewQueueStats`.

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/review-queue-stats.test.ts
import { describe, it, expect } from "vitest";
import { computeReviewQueueStats } from "../review-queue-stats";

const today = new Date("2026-09-25T12:00:00Z");

describe("computeReviewQueueStats", () => {
  it("returns all-zero stats for an empty queue", () => {
    expect(computeReviewQueueStats([], today)).toEqual({
      pendingCount: 0,
      approvedTodayCount: 0,
      changesRequestedCount: 0,
    });
  });

  it("counts in_review rows as pending", () => {
    const rows = [
      { status: "in_review" as const, approved_at: null, reviewer_notes: null },
      { status: "in_review" as const, approved_at: null, reviewer_notes: null },
      { status: "approved" as const, approved_at: "2026-09-25T09:00:00Z", reviewer_notes: null },
    ];
    expect(computeReviewQueueStats(rows, today).pendingCount).toBe(2);
  });

  it("counts rows approved today, excluding rows approved on other days", () => {
    const rows = [
      { status: "approved" as const, approved_at: "2026-09-25T09:00:00Z", reviewer_notes: null },
      { status: "approved" as const, approved_at: "2026-09-24T09:00:00Z", reviewer_notes: null },
    ];
    expect(computeReviewQueueStats(rows, today).approvedTodayCount).toBe(1);
  });

  it("counts draft_ready rows with reviewer notes as changes requested", () => {
    const rows = [
      { status: "draft_ready" as const, approved_at: null, reviewer_notes: "Fix NTN" },
      { status: "draft_ready" as const, approved_at: null, reviewer_notes: null },
    ];
    expect(computeReviewQueueStats(rows, today).changesRequestedCount).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/__tests__/review-queue-stats.test.ts`
Expected: FAIL — `Cannot find module '../review-queue-stats'`

- [ ] **Step 3: Write the implementation**

```ts
// lib/review-queue-stats.ts
import { isSameDay, parseISO } from "date-fns";
import type { FilingStatus } from "./types";

export interface ReviewQueueStats {
  pendingCount: number;
  approvedTodayCount: number;
  changesRequestedCount: number;
}

/**
 * Real aggregate counts only — no invented metrics. `approvedTodayCount`
 * and `changesRequestedCount` require a broader query than the review-queue
 * page's own `status = in_review` filter (see Task 4.2 Step 4), since those
 * rows have already left that status by definition.
 */
export function computeReviewQueueStats(
  rows: Array<{ status: FilingStatus; approved_at: string | null; reviewer_notes: string | null }>,
  today: Date = new Date()
): ReviewQueueStats {
  return rows.reduce<ReviewQueueStats>(
    (acc, row) => {
      if (row.status === "in_review") acc.pendingCount += 1;
      if (row.approved_at && isSameDay(parseISO(row.approved_at), today)) acc.approvedTodayCount += 1;
      if (row.status === "draft_ready" && row.reviewer_notes) acc.changesRequestedCount += 1;
      return acc;
    },
    { pendingCount: 0, approvedTodayCount: 0, changesRequestedCount: 0 }
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/__tests__/review-queue-stats.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Broaden the page query and render a KPI row**

Replace `app/(reviewer)/review-queue/page.tsx` in full:

```tsx
import { Clock3, CheckCircle2, FileWarning } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Company, Filing, FilingDeadline } from "@/lib/types";
import { effectiveStatus } from "@/lib/rules-engine";
import { computeReviewQueueStats } from "@/lib/review-queue-stats";
import { PageHeader } from "@/components/ui/page-header";
import { ReviewQueueTable } from "@/components/tables/review-queue-table";

type Row = FilingDeadline & {
  companies: Pick<Company, "name" | "secp_registration_no">;
  filings: Filing | null;
};

function KpiTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-surface p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-secondary text-muted-foreground">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default async function ReviewQueuePage() {
  const supabase = await createClient();

  // Queue view: only what's actionable right now.
  const { data } = await supabase
    .from("filing_deadlines")
    .select("*, companies(name, secp_registration_no), filings(*)")
    .eq("status", "in_review")
    .order("due_date", { ascending: true });
  const rows = (data ?? []) as Row[];

  // Stats view: broader window so "approved today" / "changes requested"
  // rows (which have already left in_review) are counted too.
  const { data: statsData } = await supabase
    .from("filing_deadlines")
    .select("status, due_date, filings(approved_at, reviewer_notes)")
    .in("status", ["in_review", "draft_ready", "approved"]);
  const statsRows = ((statsData ?? []) as Array<{
    status: FilingDeadline["status"];
    due_date: string;
    filings: Pick<Filing, "approved_at" | "reviewer_notes"> | null;
  }>).map((r) => ({
    // effectiveStatus, not the raw column — a draft_ready/approved row whose
    // due_date has already passed reads as overdue everywhere else in the
    // app (dashboard-summary, filing-queue-table); the KPI tiles must agree,
    // per this plan's own Review Focus item on effectiveStatus consistency.
    status: effectiveStatus(r.status, r.due_date),
    approved_at: r.filings?.approved_at ?? null,
    reviewer_notes: r.filings?.reviewer_notes ?? null,
  }));
  const stats = computeReviewQueueStats(statsRows);

  const rowsWithUrls = await Promise.all(
    rows.map(async (row) => {
      const draftPath = row.filings?.draft_document_url;
      if (!draftPath) return { row, url: null };
      const { data: signed } = await supabase.storage
        .from("filings")
        .createSignedUrl(draftPath, 600);
      return { row, url: signed?.signedUrl ?? null };
    })
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pending your review"
        description="Approve or send back drafts before they're filed."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiTile icon={Clock3} label="Pending review" value={stats.pendingCount} />
        <KpiTile icon={CheckCircle2} label="Approved today" value={stats.approvedTodayCount} />
        <KpiTile icon={FileWarning} label="Changes requested" value={stats.changesRequestedCount} />
      </div>
      <ReviewQueueTable rowsWithUrls={rowsWithUrls} />
    </div>
  );
}
```

- [ ] **Step 6: Add gate rows to `review-queue-table.tsx`**

In `components/tables/review-queue-table.tsx`, import `deriveFilingGates` and `VerificationGateRow`, then add an expanded sub-row beneath the "company" cell showing the 3 gates. Insert after the `import` block:

```tsx
import { deriveFilingGates } from "@/lib/gates";
import { VerificationGateRow } from "@/components/ui/verification-gate-row";
```

  Also confirm `effectiveStatus` is imported (it isn't currently, since this file only reads raw `.status`/`.due_date` today) — add `import { effectiveStatus } from "@/lib/rules-engine";` alongside the other imports.

Replace the `"company"` column's `cell` (lines 54–62) with:

```tsx
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <p className="font-medium text-foreground">{row.original.row.companies.name}</p>
            <p className="text-xs text-muted-foreground">
              SECP #{row.original.row.companies.secp_registration_no} · Due{" "}
              {row.original.row.due_date}
            </p>
            <div className="mt-1 flex flex-col divide-y divide-border-subtle">
              {deriveFilingGates(
                row.original.row.filings,
                effectiveStatus(row.original.row.status, row.original.row.due_date)
              ).map((gate) => (
                <VerificationGateRow key={gate.label} gate={gate} />
              ))}
            </div>
          </div>
        ),
```

  (`effectiveStatus`, not the raw `.status` column — consistent with Review Focus item #4 and the fix applied to `computeReviewQueueStats`'s inputs above. Functionally this table's query already filters to `status = "in_review"` so the two are equivalent today, but deriving from raw status here would silently break the moment this table's query ever widens, so it's fixed at the source.)

- [ ] **Step 7: Verify**

Run: `npm run typecheck && npm run lint && npx vitest run lib/__tests__/review-queue-stats.test.ts`
Expected: all pass.

Visual check: `/review-queue` (as a reviewer/admin user) shows 3 real KPI tiles above the table, and each queue row expands to show its 3 real verification gates. Compare structure (not the fabricated metrics) against `ca_reviewer_workbench_statutory_gate/screen.png`.

---

### Task 4.3: Rules page restyle + static penalty preview

**Files:**
- Modify: `app/admin/rules/page.tsx` (full file, 48 lines)

**Interfaces:** no changes to `EditRuleForm`/`CreateRuleForm` prop signatures — they're wrapped, not modified.

- [ ] **Step 1: Add a penalty-preview panel per rule**

Replace the rule-mapping block (lines 28–35):

```tsx
      <div className="flex flex-col gap-3">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardContent className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <EditRuleForm rule={rule} />
              </div>
              {rule.penalty_text && (
                <div className="w-full shrink-0 rounded-md border border-warning-border bg-warning-bg p-3 sm:w-64">
                  <p className="text-xs font-semibold uppercase tracking-wide text-warning">
                    Penalty if missed
                  </p>
                  <p className="mt-1 text-sm text-foreground">{rule.penalty_text}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
```

  (This is a **static** preview of the rule's real `penalty_text` string — not an interactive slider simulator. `SimulatorSlider` from Task 2.3 is not used here; there is no fine-calculation engine to drive it, per the spec's out-of-scope list.)

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint`
Expected: both pass.

Visual check: `/admin/rules` — each rule card now shows its edit form plus a bordered amber panel with the rule's real penalty text (when set). Compare visual language (bordered card, amber warning tone) against `compliance_rules_engine_surcharge_simulator/screen.png`'s fine-breakdown card — structure only, not the interactive slider math.

---

### Task 4.4: Filing queue — two-column layout + real audit trail

While researching this task, `lib/audit.ts` and the `audit_log` table (migration `0001_init.sql:193-204`, RLS policy `audit_staff_select` granting `select` to `is_staff()`) were found to already exist and are already written to by `approveFiling`/`requestChanges` (`app/(reviewer)/review-queue/actions.ts`). This is real data the spec's "no cryptographic audit trail" exclusion didn't know about — so this task adds an honest (non-cryptographic, no SHA256 claim) audit panel backed by it, which is a small positive deviation from the spec's out-of-scope list, not a fabrication.

**Files:**
- Modify: `app/admin/filing-queue/page.tsx` (full file, 45 lines)
- Modify: `components/tables/filing-queue-table.tsx` (visual pass only — status-colored left border)

**Interfaces:**
- Consumes: `deriveFilingGates` (Task 2.2), `VerificationGateRow` (Task 2.2).

- [ ] **Step 1: Restructure the page into a two-column layout with a real audit panel**

Replace `app/admin/filing-queue/page.tsx` in full:

```tsx
import { createClient } from "@/lib/supabase/server";
import type { Company, Filing, FilingDeadline } from "@/lib/types";
import { deriveFilingGates } from "@/lib/gates";
import { PageHeader } from "@/components/ui/page-header";
import { VerificationGateRow } from "@/components/ui/verification-gate-row";
import { FilingQueueTable } from "@/components/tables/filing-queue-table";

type Row = FilingDeadline & {
  companies: Pick<Company, "name" | "secp_registration_no">;
  filings: Filing | null;
};

interface AuditRow {
  id: string;
  action: string;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

export default async function FilingQueuePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("filing_deadlines")
    .select("*, companies(name, secp_registration_no), filings(*)")
    .neq("status", "filed")
    .order("due_date", { ascending: true });

  const rows = (data ?? []) as Row[];

  const rowsWithUrls = await Promise.all(
    rows.map(async (row) => {
      const draftPath = row.filings?.draft_document_url;
      if (!draftPath) return { row, draftUrl: null };
      const { data: signed } = await supabase.storage
        .from("filings")
        .createSignedUrl(draftPath, 600);
      return { row, draftUrl: signed?.signedUrl ?? null };
    })
  );

  const { data: auditData } = await supabase
    .from("audit_log")
    .select("id, action, created_at, profiles(full_name)")
    .eq("entity", "filing_deadlines")
    .order("created_at", { ascending: false })
    .limit(8);
  const auditRows = (auditData ?? []) as unknown as AuditRow[];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Filing queue"
        description="Generate drafts, route them for review, and mark filings complete."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FilingQueueTable rowsWithUrls={rowsWithUrls} />
        </div>
        <div className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Recent activity</h2>
          {auditRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No filing activity recorded yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border-subtle">
              {auditRows.map((entry) => (
                <li key={entry.id} className="flex flex-col gap-0.5 py-2 text-sm">
                  <span className="text-foreground">{entry.action.replaceAll("_", " ")}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {entry.profiles?.full_name ?? "System"} ·{" "}
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
```

  (Uses `rows[0]`'s gates via `deriveFilingGates` is intentionally **not** wired here as a separate per-row detail drawer — that would require client-side row-selection state, which is a bigger structural change than this task's "two-column layout" scope calls for. Instead, `FilingQueueTable`'s existing per-row `ActionsCell` (unchanged) already surfaces the equivalent real state inline. If a future task wants the full "select a row, see its gates in a side panel" interaction from the mockup, that's a follow-up, not part of this restyle.)

- [ ] **Step 2: Status-colored left border on `filing-queue-table.tsx` rows**

In `components/tables/filing-queue-table.tsx`, `DataTable` doesn't currently expose a per-row className hook — rather than extend that shared primitive's API for one table, add the accent directly to the "status" column's cell (simpler, scoped to this table only). Replace the `"status"` column definition (lines 117–126):

```tsx
      {
        id: "status",
        header: "Status",
        accessorFn: (r) => effectiveStatus(r.row.status, r.row.due_date),
        cell: ({ row }) => {
          const status = effectiveStatus(row.original.row.status, row.original.row.due_date);
          return (
            <div
              className={cn(
                "border-l-2 pl-2",
                status === "overdue" ? "border-danger" : status === "draft_ready" ? "border-warning" : "border-transparent"
              )}
            >
              <StatusBadge status={status} />
            </div>
          );
        },
      },
```

  (This file does not currently import `cn` — add `import { cn } from "@/lib/cn";` to its import block.)

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run lint`
Expected: both pass.

Visual check: `/admin/filing-queue` shows the table on the left (2/3 width) and a real "Recent activity" panel on the right (1/3 width) listing actual `audit_log` rows (or "No filing activity recorded yet." if the seed data has none). Overdue/draft-ready rows show a colored left accent in the status cell. Compare column-layout structure against `ops_filing_execution_desk/screen.png` — the panel's content is real activity, not the mockup's cryptographic ledger copy.

---

### Task 4.5: Login page restyle

**Files:**
- Modify: `app/login/page.tsx:213-285` (the `LoginCard` function's JSX only — auth logic in `GoogleButton`/`MagicLinkForm`/`PasswordForm` is untouched)

**Interfaces:** none — visual only, no prop/behavior changes.

- [ ] **Step 1: Replace the hero glow and card treatment**

Replace lines 213–233 (the `<main>` open through the card's opening `<div>`):

```tsx
    <main className="relative flex min-h-screen items-center justify-center px-4">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-7 text-center">
          <Logo size="lg" />
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-extrabold tracking-tighter text-foreground">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">Sign in to Sarmaya Compliance.</p>
          </div>
        </div>

        <div className="flex flex-col gap-5 rounded-md border border-border bg-surface p-6">
```

  (Drops the `overflow-hidden` and the two blurred gradient-glow `<div>`s entirely — no glow anywhere per the Global Constraints. `shadow-elevation-lg` → `border border-border`, no shadow, consistent with the flat-card treatment. The `Welcome back` / brand text stays as already updated in Task 1.4.)

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint`
Expected: both pass.

Visual check: `/login` shows a flat bordered card, no background glow blobs, new logo, "Sign in to Sarmaya Compliance." Google OAuth and magic-link/password tabs still function identically (unchanged logic).

Dark-mode check: toggle `ThemeToggle` on this page — card border and text should remain legible against the dark background.

---

### Task 4.6: Company detail page — real setup-completeness `StepIndicator`

Correction from the spec: the spec described a "2-step `StepIndicator` wrapping `add-company-form` + `director-form` on `companies/new`." Researching `app/(client)/companies/new/page.tsx` during planning found it only renders `AddCompanyForm` — `DirectorForm` lives on the separate `companies/[id]` detail/management page instead, alongside AGM records and the filing-deadlines timeline. There is no single-page 2-step wizard to wrap. The honest mapping is a **setup-completeness rail on `companies/[id]`**, driven by real data (a company profile always exists once this page renders; directors/AGM/deadlines are each present-or-not) — using the same `StepIndicator` component, applied where the real flow actually lives.

**Files:**
- Modify: `app/(client)/companies/[id]/page.tsx` (add one rail; existing sections unchanged)

**Interfaces:**
- Consumes: `StepIndicator` (Task 2.1).

- [ ] **Step 1: Insert the rail below the page header**

After the header `<div>` block (ends at line 87, right before the "Filing deadlines" `<Card>` at line 89), insert:

```tsx
      <StepIndicator
        steps={["Company profile", "Directors added", "AGM recorded", "Deadline computed"]}
        currentIndex={
          typedDeadlines.length > 0 ? 4 : typedAgm.length > 0 ? 2 : typedDirectors.length > 0 ? 1 : 0
        }
        className="rounded-md border border-border bg-surface p-4"
      />
```

  Add the import alongside the other component imports near the top of the file:

```tsx
import { StepIndicator } from "@/components/ui/step-indicator";
```

  (`currentIndex` logic: company profile is step 0 and is always complete by the time this page renders (the row exists), so the rail starts at least "in progress" on step 0. Once directors exist, step 1 is done and step 2 ("AGM recorded") becomes in-progress → `currentIndex: 1`. Once an AGM record exists, `currentIndex: 2` marks step 2 done and step 3 in-progress. Once a deadline is computed, `currentIndex: 4` marks all 4 steps complete — there's no step 5, so `getStepState` treats every index as `< 4`, all "completed," which is correct: nothing left pending.)

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint`
Expected: both pass.

Visual check: open a company detail page for a company with no directors/AGM/deadlines yet — the rail shows step 0 in-progress, the rest pending. Add a director via the existing form, reload — step 1 completes, step 2 goes in-progress. This is real, not simulated, state.

---

## Phase 5 — Sweep remaining pages

### Task 5.1: Visual sweep of everything not touched above

These pages/components already read the CSS custom properties changed in Phase 1 and inherit the new tokens automatically — this task is verification plus small class-level fixes only, no structural rewrites, per the spec.

**Files (verify, fix only if a visual issue is found):**
- `app/admin/billing/page.tsx`, `app/profile/page.tsx`, `app/set-password/page.tsx`, `app/(client)/companies/new/page.tsx`, `components/landing/landing-page.tsx`, `components/landing/faq-accordion.tsx`, `components/landing/pricing-toggle.tsx`
- `components/forms/*.tsx` (`add-company-form`, `agm-form`, `avatar-upload-form`, `change-password-form`, `director-form`, `edit-subscription-form`, `name-form`, `phone-form`)
- `components/tables/agm-table.tsx`, `components/tables/directors-table.tsx`
- `components/ui/empty-state.tsx`, `components/ui/error-state.tsx`, `components/ui/confirm-dialog.tsx`, `components/ui/dialog.tsx`, `components/ui/timeline.tsx`, `components/ui/section-label.tsx`, `components/ui/file-dropzone.tsx`, `components/ui/pdf-preview-dialog.tsx`, `components/ui/toaster.tsx`, `components/ui/skeleton.tsx`, `components/ui/animated-number.tsx`, `components/ui/submit-button.tsx`, `components/ui/confirm-submit.tsx`

- [ ] **Step 1: Grep for any remaining hardcoded `rounded-xl`/`rounded-lg` on card-like surfaces that should now be `rounded-md`, and any remaining `shadow-elevation-md`/`-lg` on non-floating surfaces**

Run: `grep -rn "rounded-xl\|shadow-elevation-md\|shadow-elevation-lg" components/ui components/forms components/tables components/landing app/admin app/profile app/set-password "app/(client)/companies"`

Review each hit: floating surfaces (`Dialog`, `Sheet`, dropdown menus, toasts) keep `shadow-elevation-md`/`-lg` — that's correct per the Global Constraints. Flat surfaces (cards, panels, table wrappers) that still show `rounded-xl` or a resting shadow should be changed to `rounded-md` / `border border-border` with no shadow, matching Task 1.6's `Card` treatment. Fix any found.

- [ ] **Step 2: Visual pass in the browser**

Run the dev server and visit each page in the list above (as the appropriate role — `npm run seed` provides seeded test users if needed). For each: confirm Plus Jakarta Sans renders, colors match the new emerald/slate palette (no leftover indigo/violet), buttons are flat (no gradient/glow), cards are bordered with no resting shadow, and dark mode (toggle `ThemeToggle`) still reads correctly.

- [ ] **Step 3: Final verification**

Run: `npm run typecheck && npm run lint && npm run test`
Expected: all three pass — this is the plan's final exit gate.

Run: `grep -rln "primary-btn-from\|primary-btn-to\|elevation-glow\|Compliance Reminders" --include="*.tsx" --include="*.ts" --include="*.md" . --exclude-dir=node_modules --exclude-dir=docs`
Expected: no output (the `docs` exclusion is just to avoid matching this plan's and the spec's own explanatory prose about the old name/tokens).
