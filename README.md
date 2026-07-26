# Compliance Reminders — SECP Form A tracking (V1)

Never-miss-a-deadline SaaS for SECP-registered private limited companies. V1 covers SECP Form A/29 annual return tracking only; FBR filing types are a fast-follow (see "Adding a new filing type" below).

Full architecture/design rationale: `/Users/sajid/.claude/plans/we-have-the-details-giggly-allen.md`

## Roles

- **client** — company owner. Adds companies, directors, AGM dates; watches deadlines.
- **reviewer** — your partner CA. Approves or requests changes on generated drafts before anything is filed.
- **admin** — you. Generates drafts, sends them to review, manually files with SECP e-Services (no public filing API exists), marks filings complete, edits the compliance-rules table.

New signups default to `client` (see the `handle_new_user` trigger in the first migration). To promote your own account to `admin` and your CA's account to `reviewer`, run in the Supabase SQL editor after they've signed in once:

```sql
update public.profiles set role = 'admin' where id = '<your-auth-user-id>';
update public.profiles set role = 'reviewer' where id = '<ca-auth-user-id>';
```

## Local setup

1. **Create a Supabase project** at supabase.com (free tier is enough for V1).
2. Copy `.env.local.example` to `.env.local` and fill in the four Supabase/Resend/cron values from Project Settings → API.
3. Run the migrations against your project (Supabase SQL editor, in order, or via the Supabase CLI):
   - `supabase/migrations/0001_init.sql` — schema, RLS
   - `supabase/migrations/0002_seed_rules.sql` — seeds the one Form A rule
   - `supabase/migrations/0003_storage.sql` — private `filings` storage bucket
4. `npm install`
5. `npm run dev` — http://localhost:3000
6. `npm test` — rules engine + PDF generation unit tests (no Supabase needed for these)

## Deploying

- Vercel, with the same env vars from `.env.local.example` set in the project settings, plus `CRON_SECRET` (generate with `openssl rand -hex 32` — Vercel automatically sends it as `Authorization: Bearer $CRON_SECRET` to `/api/cron/reminders` per `vercel.json`).
- `NEXT_PUBLIC_APP_URL` (optional) — used only to build the link inside reminder emails.

## Why things are built this way

- **`compliance_rules` is a database table, not code.** Deadline rules can change, and your CA is better positioned to catch that than you are — a rule correction is an admin form submission, not a deploy. See `lib/rules-engine.ts`.
- **Filing is manually admin-assisted, not automated.** Neither SECP e-Services nor FBR IRIS exposes a public filing API — this is a permanent constraint, not a V1 shortcut.
- **`audit_log` exists specifically for liability defense.** Every state transition (draft generated, sent to reviewer, approved, filed) writes a row — this is what lets you prove a client's own data, or their CA's sign-off, drove an outcome, not your process.
- **Billing is fully manual for V1** (`subscriptions.status`/notes fields only) — no payment gateway integration until there's enough volume to justify the work.
- **Auth is magic-link only** — no password reset flow to build or support.

## Adding a new filing type (e.g. FBR income tax)

1. Add a row to `compliance_rules` via `/admin/rules` (or SQL) — no code change.
2. If it needs its own document, add a template function next to `lib/documents/form-a-template.ts` and wire it into `generateDraft` in `app/(admin)/filing-queue/actions.ts`.

That's the whole extension point — the rest of the pipeline (reminders, review, audit log) is generic across rule types already.

## Known gaps before your first real client filing

- No professional-indemnity insurance / liability-limiting ToS yet — get this before filing for a real company (see the plan doc's Security/Compliance section).
- WhatsApp reminders aren't wired up yet (email/Resend only) — BSP business verification takes 1-3 weeks, start that process in parallel.
- No self-serve payment — invoice manually and track status in `subscriptions`.
- The generated PDF is a CA review/prep sheet, not a pixel-accurate reproduction of the official SECP Form A — the actual submission still happens on SECP e-Services.
