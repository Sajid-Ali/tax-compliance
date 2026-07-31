# Security

## Authorization model

Row-Level Security (RLS) is the primary enforcement layer, not application code. Every table a client or reviewer can reach is scoped to `owner_user_id` (clients) or role (`reviewer`, `admin`) via Postgres policies in `supabase/migrations/0001_init.sql`. This means a bug in a Server Action's query — a missing `.eq("owner_user_id", ...)` — fails closed: the database itself won't return or accept rows outside the caller's scope, regardless of what the application code asked for.

Roles (`profiles.role`): `client`, `reviewer`, `admin`. New signups default to `client` via the `handle_new_user` trigger; promotion to `reviewer`/`admin` is a manual SQL operation (see README "Roles"), not self-service — there is no privilege-escalation path through the app itself.

## Audit trail

`audit_log` is append-only (no `UPDATE`/`DELETE` application code path writes to it other than `INSERT`) and records every filing-status transition: who acted, what changed, when. This exists specifically for liability defense — see `lib/audit.ts`.

## Known, tracked dependency vulnerabilities

As of this writing, `npm audit --audit-level=high` reports 12 high-severity findings, all transitive:

| Finding                                 | Path                                                                                                                                                   | Why it's not fixed yet                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `postcss` XSS/path-traversal advisories | Bundled inside `next@16.2.12`'s own `node_modules/next/node_modules/postcss`                                                                           | Not a direct dependency of this project — fix requires an upstream Next.js release. `npm audit fix --force` currently suggests downgrading to `next@9.3.3`, which is not a real fix (a 7-major-version downgrade).                                                                                                                                       |
| `sharp` (libvips CVEs)                  | Same — bundled inside `next`                                                                                                                           | Same as above.                                                                                                                                                                                                                                                                                                                                           |
| `brace-expansion` DoS                   | `minimatch` → `@eslint/config-array`/`@eslint/eslintrc` → `eslint-plugin-import`/`eslint-plugin-jsx-a11y`/`eslint-plugin-react` → `eslint-config-next` | These plugins currently require `eslint <10`; the actual fix is upgrading `eslint` to v10, a breaking change to lint tooling that needs its own validation pass across every rule this project depends on — tracked as separate work, not bundled into an unrelated change. This is a devDependency-only chain: it never ships in the production bundle. |

**Handling**: the CI dependency-audit job runs on every PR (`continue-on-error: true`) so these stay visible without blocking unrelated work. Re-check `npm audit` after any `next` or `eslint-config-next` version bump; drop the `continue-on-error` once the findings clear or a deliberate decision is made to accept a specific remaining risk with its own rationale.

## Data sensitivity

`company_directors.cnic` and `companies.paid_up_capital`/financial fields are the most sensitive data this system holds. They're covered by the RLS policies above; no additional column-level encryption is implemented in V1 (Supabase's at-rest encryption covers the database as a whole). Revisit column-level encryption if/when a formal PECA compliance review happens (flagged as an open item in `docs/01-secp-fbr-compliance/SRD.md` §1 in the planning repo).

## Reporting

No external security-disclosure process exists yet (pre-launch, no real customers). Add one (e.g., a `security@` contact or GitHub Security Advisories) before the first real client filing.
