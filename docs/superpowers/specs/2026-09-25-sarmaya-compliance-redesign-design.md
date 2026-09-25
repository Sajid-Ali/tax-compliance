# Sarmaya Compliance visual redesign

**Status:** Approved for planning
**Date:** 2026-09-25

## Context

A Google Stitch project ("PakComply: SECP/FBR Compliance Manager") produced 5 real
screen mockups (HTML + screenshot each), a logo mark, and a `DESIGN.md` brand spec,
downloaded to `/Users/sajid/Desktop/stitch_pakcomply_secp_fbr_compliance_manager/`:

- `founder_compliance_command_center` → maps to `app/(client)/dashboard`
- `ca_reviewer_workbench_statutory_gate` → maps to `app/(reviewer)/review-queue`
- `compliance_rules_engine_surcharge_simulator` → maps to `app/admin/rules`
- `ops_filing_execution_desk` → maps to `app/admin/filing-queue`
- `authentication_company_onboarding` → maps to `app/login` + `app/(client)/companies/new`

The live app (`secp-fbr-compliance`) already has a mature, hand-built design system
(indigo/violet gradient SaaS look, soft "glow" shadows, Geist Sans, full light/dark mode,
documented with contrast-ratio rationale in `app/globals.css`) and a shared top-nav shell
(`AppShell`/`NavBar`) reused across three role-scoped route groups
(`(client)`, `(reviewer)`, `admin`).

This spec covers porting the Stitch visual identity into the real, data-bound app —
**a visual/structural redesign, not a feature build.**

## Decisions

Confirmed with the user during brainstorming:

1. **Full design-system replace** — the emerald/slate "Institutional Modernism" palette,
   Plus Jakarta Sans, sharp radii, and flat minimal shadows replace the current
   indigo/violet system everywhere (not "inspiration only").
2. **App-wide rollout** — token + primitive changes apply globally via `globals.css` and
   `components/ui/*`, not just the 5 mapped routes, to avoid a visually split app.
3. **Dark mode is derived**, not dropped — new dark values follow the same hue family and
   contrast approach as the existing dark theme.
4. **Icons stay `lucide-react`** — Material Symbols icons in the mockups are mapped to their
   closest lucide equivalents; no new external font/icon dependency.
5. **Shell is rebuilt** as a fixed sidebar + top header (matching the mockups), not restyled
   in place as a top nav.
6. **No fake role-switcher** — the mockup's "Client/Founder · CA/CS Reviewer · Ops/Filing
   Desk" tab pill is dropped. Each user sees only their own role's nav (real RBAC, not a
   cosmetic switcher).
7. **Brand renamed to Sarmaya Compliance** — name + logo mark adopted app-wide (metadata,
   README, login/landing copy, `components/logo.tsx`).
8. **Execution order**: foundation (tokens + brand + existing primitives) → new shared
   primitives → shell rebuild → screen-by-screen → sweep remaining pages.
9. **No fabricated data or trust claims.** Several mockup widgets assume data/integrations
   that don't exist in `lib/types.ts` or the real page code (see "Explicitly out of scope"
   below). Visual and structural language is ported; invented metrics, badges, and features
   are not.

## 1. Design tokens (`app/globals.css`)

Source of truth: the actual rendered `screen.png` files + `DESIGN.md` prose. The mockups'
inline Tailwind config JSON is Stitch's auto-generated Material palette and drifts from
both — reconciled toward what's actually visible and what the brand prose intends.

### Light

| Token                  | Value                                                                         | Notes                                                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `--background`         | `#FAF8FF`                                                                     | page canvas                                                                                                                            |
| `--surface`            | `#FFFFFF`                                                                     | cards, sidebar, header                                                                                                                 |
| `--surface-secondary`  | `#F2F3FF`                                                                     | subtle chip/pill backgrounds                                                                                                           |
| `--border`             | `#E2E8F0`                                                                     | card hairline (DESIGN.md Tier 1)                                                                                                       |
| `--border-subtle`      | `#EEF1F6`                                                                     | dividers                                                                                                                               |
| `--foreground`         | `#0F172A`                                                                     | deep slate obsidian                                                                                                                    |
| `--muted-foreground`   | `#64748B`                                                                     |                                                                                                                                        |
| `--primary`            | `#0D5C3A`                                                                     | flat, no gradient                                                                                                                      |
| `--primary-hover`      | `#0A482D`                                                                     |                                                                                                                                        |
| `--primary-active`     | `#073521`                                                                     |                                                                                                                                        |
| `--primary-foreground` | `#FFFFFF`                                                                     |                                                                                                                                        |
| `--ring`               | `#10B981`                                                                     | focus ring, matches DESIGN.md button spec                                                                                              |
| `--success`            | `#10B981`                                                                     |                                                                                                                                        |
| `--success-bg`         | `#ECFDF5`                                                                     |                                                                                                                                        |
| `--success-border`     | `#A7F3D0`                                                                     |                                                                                                                                        |
| `--warning`            | `#D97706`                                                                     |                                                                                                                                        |
| `--warning-bg`         | `#FEF3C7`                                                                     |                                                                                                                                        |
| `--warning-border`     | `#FDE68A`                                                                     |                                                                                                                                        |
| `--danger`             | `#DC2626`                                                                     |                                                                                                                                        |
| `--danger-bg`          | `#FEE2E2`                                                                     |                                                                                                                                        |
| `--danger-border`      | `#FECACA`                                                                     |                                                                                                                                        |
| `--info`               | `#2563EB`                                                                     | not in DESIGN.md; kept for existing `info` status tone (e.g. "in review") — unobtrusive slate-blue consistent with the neutral palette |
| `--info-bg`            | `#EFF6FF`                                                                     |                                                                                                                                        |
| `--info-border`        | `#BFDBFE`                                                                     |                                                                                                                                        |
| `--shadow-sm`          | `0 1px 2px rgb(15 23 42 / 0.04)`                                              | near-none; cards rely on border, not shadow                                                                                            |
| `--shadow-md`          | `0 4px 12px -2px rgb(15 23 42 / 0.06), 0 2px 6px -1px rgb(15 23 42 / 0.04)`   | Tier 2: flyouts/dropdowns (verbatim DESIGN.md)                                                                                         |
| `--shadow-lg`          | `0 20px 25px -5px rgb(15 23 42 / 0.12), 0 8px 10px -6px rgb(15 23 42 / 0.06)` | Tier 3: modals (verbatim DESIGN.md)                                                                                                    |
| `--overlay`            | `rgb(15 23 42 / 0.6)`                                                         | modal backdrop                                                                                                                         |

`--shadow-elevation-glow` and `--primary-btn-from`/`--primary-btn-to` (gradient stops) are
**removed** — no glow anywhere in the institutional look. `Button`'s primary variant and
`Logo` switch to flat solid `--primary` fills.

### Dark (derived — no mockup source)

Keeps the emerald hue family rather than going neutral-gray, so dark mode still reads as
the same brand. Status colors (`success`/`warning`/`danger`/`info`) reuse the existing
dark-theme values since they already sit comfortably in this palette.

| Token                  | Value                                                                                                                            | Notes                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `--background`         | `#0A0F0D`                                                                                                                        | near-black, faint green tint                                               |
| `--surface`            | `#121815`                                                                                                                        |                                                                            |
| `--surface-secondary`  | `#1A211D`                                                                                                                        |                                                                            |
| `--border`             | `#2A322D`                                                                                                                        |                                                                            |
| `--border-subtle`      | `#212820`                                                                                                                        |                                                                            |
| `--foreground`         | `#EFF3F0`                                                                                                                        |                                                                            |
| `--muted-foreground`   | `#9AA79E`                                                                                                                        |                                                                            |
| `--primary`            | `#34D399`                                                                                                                        | bright mint — echoes the mockups' secondary/accent mint                    |
| `--primary-hover`      | `#6EE7B7`                                                                                                                        |                                                                            |
| `--primary-active`     | `#10B981`                                                                                                                        |                                                                            |
| `--primary-foreground` | `#052E1C`                                                                                                                        | dark text on the bright mint fill — white fails contrast at this lightness |
| `--ring`               | `#34D399`                                                                                                                        |                                                                            |
| `--success`            | `#37D391` / bg `#0F2A1D` / border `#17402C`                                                                                      | reused from current dark theme                                             |
| `--warning`            | `#F0B64A` / bg `#2E2408` / border `#493A10`                                                                                      | reused from current dark theme                                             |
| `--danger`             | `#EE8479` / bg `#2D1512` / border `#49211A`                                                                                      | reused from current dark theme                                             |
| `--info`               | `#7C92FF` / bg `#171E35` / border `#253158`                                                                                      | reused from current dark theme                                             |
| `--shadow-sm/md/lg`    | same shape as light, `rgb(0 0 0 / …)` in place of `rgb(15 23 42 / …)`, opacities raised ~1.5x per the existing dark-mode pattern |                                                                            |
| `--overlay`            | `rgb(0 0 0 / 0.7)`                                                                                                               |                                                                            |

Both variants keep the existing `:root[data-theme="…"]` + `prefers-color-scheme` structure
already in `globals.css` — only the values change, not the mechanism.

### Typography, radius, shape

- `--font-sans` → Plus Jakarta Sans, loaded via `next/font/google` in `app/layout.tsx`
  (self-hosted, replacing the mockups' Google Fonts CDN `<link>`). Replaces Geist Sans.
- `--font-mono` stays Geist Mono — used for CUIN/NTN/registration-number strings. Plus
  Jakarta Sans isn't monospace and neither `DESIGN.md` nor the mockups specify an
  alternative.
- Numeric/tabular fields (deadlines, amounts) get Tailwind's `tabular-nums` class applied
  directly where they appear — not a global body rule — matching DESIGN.md's "zero-jitter
  alignment" intent without affecting prose text.
- `--radius-sm: 0.25rem` (4px, inputs), `--radius-md: 0.5rem` (8px, cards/buttons),
  `--radius-lg: 0.75rem` (12px, nav items/larger panels). Pills keep Tailwind's built-in
  `rounded-full` (9999px) as they do today — unaffected by this scale.

### Card treatment (architectural flip)

Today's `Card` (`components/ui/card.tsx`) is deliberately borderless, using
`shadow-elevation-md` alone to read as "lifted" (documented in-code as a Linear/Stripe-style
choice). The mockups do the opposite: flat cards, a 1px hairline `--border`, **zero
drop-shadow at rest**, shadow reserved only for flyouts/modals (Tier 2/3). `Card` changes to
`border border-border bg-surface` with no resting shadow; `shadow-elevation-md`/`-lg` are
kept only for genuinely floating surfaces (`Dialog`, `Sheet`, dropdowns).

## 2. Brand identity

- Product name → **Sarmaya Compliance**, everywhere `"Compliance Reminders"` currently
  appears: `app/layout.tsx` metadata, `README.md`, `app/login/page.tsx`,
  `components/logo.tsx`, `components/landing/landing-page.tsx`.
- `components/logo.tsx` rebuilt from the SVG in
  `sarmaya_compliance_logo/code.html` (shield+checkmark badge, "Sarmaya**Compliance**"
  wordmark, "SECP & FBR ANNUAL AUTOMATION" tagline), replacing the current `ShieldCheck`
  icon + text lockup. Keeps the existing `size="sm" | "lg"` prop API so call sites don't
  need touching beyond visual result.
- The generated headshot image (`professional_headshot_portrait_of_a_pakistani_...`) is
  stock/AI-generated, not a real user — it is **not** wired in as a real avatar. The
  existing `Avatar` component (initials/email-based fallback) is unchanged.

## 3. New shared primitives (`components/ui/`)

Each is a narrow, single-purpose, token-driven component with a typed prop API (no raw
mockup HTML/mock data copied in):

- **`StepIndicator`** — horizontal segmented rail; states: completed (solid + check),
  in-progress (hollow ring + pulse), pending (dashed). Ships with the 2 real onboarding
  steps (Company Profile, Directors) — not the mockup's 4 (POA and Subscription don't exist
  as onboarding steps today).
- **`VerificationGateRow`** — one gate-check line (icon, label, status, actor/timestamp).
  Renders real filing state (`reviewer_notes`, `approved_at`, `filed_at`, `filed_by`) — used
  by review-queue and filing-queue.
- **`SimulatorSlider`** — labeled range input + live numeric readout. Built for future use;
  not wired to a real calculation for v1 (see "Explicitly out of scope").
- **`PortalStatusRadar`** — **not built.** No real SECP/FBR/1Link integration status exists;
  a decorative status widget would be a fabricated trust claim. Dropped from scope.
- **`SidebarNavItem`** — icon + label nav row, active/hover states, used by the rebuilt
  `NavBar`.

## 4. Shell rebuild (`components/app-shell.tsx`, `components/nav-bar.tsx`, `lib/role-nav.ts`)

- `AppShell` becomes: fixed header (h-16, full width) + fixed left sidebar (w-72 desktop →
  icon-rail ~64px tablet → off-canvas via the existing `Sheet` component on mobile) + main
  content with `pl-72` (desktop) to clear the sidebar.
- **Header**: new Sarmaya logo, `ThemeToggle`, user menu (avatar/email/role/sign-out — same
  content as today, restyled). Dropped: FY badge, notification bell with fake unread dot,
  "SSL 256-Bit" and "Govt Regulatory Sandbox Verified" badges — none backed by real state.
- **Sidebar**: role's own nav links only, via `SidebarNavItem`. `RoleNavConfig` (in
  `lib/role-nav.ts`) gains an `icon` field per link. No entity-switcher card (no "active
  company" concept outside `/companies/[id]`) and no "Statutory Health %" widget (no such
  field in `lib/types.ts`).
- No role-switcher tab pill (Decision 6).
- Mobile reuses the existing `Sheet`-based pattern already in `NavBar`, with the new item
  list.

## 5. Per-screen plan

1. **Dashboard** (`app/(client)/dashboard/page.tsx`, `components/dashboard-summary.tsx`,
   `components/tables/companies-table.tsx`) — restyle to new tokens + bordered flat cards.
   Keeps the existing company-list IA; the mockup's single-entity dossier view doesn't fit a
   multi-company list and isn't adopted structurally.
2. **Review queue** (`app/(reviewer)/review-queue/page.tsx`,
   `components/tables/review-queue-table.tsx`) — add a KPI row (pending / approved today /
   flagged / avg turnaround), computed server-side from real `filings`/`filing_deadlines`
   columns. Restyle the table; show each row's real state via `VerificationGateRow`.
3. **Rules** (`app/admin/rules/page.tsx`, `create-rule-form.tsx`, `edit-rule-form.tsx`) —
   restyle rule cards to the sharp-radius bordered look; add a static penalty-preview panel
   rendering the rule's real `penalty_text`. No interactive slider simulator (see below).
4. **Filing queue** (`app/admin/filing-queue/page.tsx`,
   `components/tables/filing-queue-table.tsx`) — two-column "queue rail + execution stage"
   layout: left rail of compact deadline cards (status-colored left border for
   overdue/warning, per DESIGN.md's inset-border alert pattern), right panel showing the
   selected row's real detail via `VerificationGateRow`. No portal-radar widget.
5. **Login/onboarding** (`app/login/page.tsx`, `components/forms/add-company-form.tsx`,
   `components/forms/director-form.tsx`, `app/(client)/companies/new/page.tsx`) — restyle
   login card + logo; Google OAuth and magic-link stay functionally identical (no phone-OTP
   build-out). `companies/new` gets a real 2-step `StepIndicator` wrapping the existing two
   forms.
6. **Sweep** (billing, profile, set-password, landing page, AGM/avatar/name/phone/password
   forms, `data-table`, `timeline`, dialogs, `empty-state`, `error-state`, `toaster`,
   `pdf-preview-dialog`, `file-dropzone`, `section-label`) — no structural changes; these
   already read CSS custom properties and inherit new tokens automatically. Visual
   spot-check only, no dedicated rewrite.

## 6. Verification

- `npm run typecheck` and `npm run lint` after each phase.
- `npm run test` (vitest) must keep passing — component prop APIs are preserved wherever
  noted above.
- Visual check via the dev server against the 5 `screen.png` references, desktop-first (per
  the mockups' own breakpoints), plus a light mobile/tablet pass for the new responsive
  sidebar.
- Dark-mode toggle check on 2–3 screens (e.g. dashboard, login) since dark is derived, not
  sourced from a mockup.
- No new automated visual/screenshot tests. `npm run smoke-test` (hits real
  Supabase/Twilio/Resend) is not relevant to a visual redesign and is not run as part of
  this work.

## Explicitly out of scope

These mockup elements assume data, integrations, or flows that don't exist in the current
schema (`lib/types.ts`) or backend, and are **not** built as part of this redesign:

- Live SECP/FBR/1Link portal integration status ("Portal Status Radar").
- "Govt Regulatory Sandbox Verified" and "SSL 256-Bit" trust badges.
- Cryptographic/hashed immutable audit trail (SHA256 ledger) — `ReminderLog` has no such
  shape.
- Paid-up-capital-tiered, slider-driven penalty/surcharge calculation — `ComplianceRule`
  only has `penalty_text` (string) + `offset_days`; no fine-calculation engine exists in
  `lib/rules-engine.ts`.
- "Statutory Health %" metric — no such field.
- 4-step onboarding (Digital POA, Subscription steps) — only Company Profile and Directors
  exist as real steps today.
- Pakistani mobile SMS-OTP login with telco selection (Jazz/Zong/Telenor) — current auth is
  Google OAuth + email magic-link; building phone-OTP auth is a separate feature, not a
  restyle.
- Fake role-switcher tabs (Client/Founder · CA/CS Reviewer · Ops/Filing Desk) — dropped per
  Decision 6.

If any of these are wanted later, they're feature work with their own design/spec, not part
of this visual port.
