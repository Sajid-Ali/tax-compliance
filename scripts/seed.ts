/**
 * Seeds one demo account per role (client/admin/reviewer) plus mock
 * companies covering every filing_deadlines status, so the app can be
 * clicked through end-to-end without waiting on a real SECP registration or
 * a magic-link email. Demo accounts get a password set immediately (skips
 * the normal magic-link-first flow) since their whole purpose is instant
 * login for testing.
 *
 * Safe to re-run: deletes any previous demo users (and their data, via FK
 * cascade) by email before recreating them.
 *
 * Usage: npm run seed   (reads Supabase creds from .env.local)
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { generateFormADraft } from "../lib/documents/form-a-template";
import type { Company, CompanyDirector, FilingDeadline } from "../lib/types";

function loadEnvLocal() {
  let contents: string;
  try {
    contents = readFileSync(".env.local", "utf-8");
  } catch {
    return;
  }
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — check .env.local"
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_PASSWORD = "Demo1234!";

const DEMO_USERS = [
  { email: "admin@demo.test", role: "admin" as const, full_name: "Ayesha Khan (Admin)" },
  { email: "reviewer@demo.test", role: "reviewer" as const, full_name: "Bilal Ahmed, ACA (Reviewer)" },
  { email: "client@demo.test", role: "client" as const, full_name: "Sana Malik" },
];

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function deleteExistingDemoUsers() {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error) throw error;
  const targets = data.users.filter((u) => DEMO_USERS.some((d) => d.email === u.email));
  for (const u of targets) {
    await admin.from("companies").delete().eq("owner_user_id", u.id);
    await admin.auth.admin.deleteUser(u.id);
  }
  if (targets.length > 0) console.log(`Removed ${targets.length} previous demo user(s).`);
}

async function createDemoUser(spec: (typeof DEMO_USERS)[number]) {
  // Supabase auth itself gets a real password here regardless of the
  // has_password app-flag below — that flag only controls whether the
  // post-magic-link "set a password" prompt shows, it doesn't gate whether
  // signInWithPassword works. So demo accounts can log in via the Password
  // tab immediately, even before migration 0005 (has_password column) lands.
  const { data, error } = await admin.auth.admin.createUser({
    email: spec.email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: spec.full_name },
  });
  if (error || !data.user) throw error ?? new Error(`createUser failed for ${spec.email}`);

  const { error: roleErr } = await admin
    .from("profiles")
    .update({ role: spec.role })
    .eq("id", data.user.id);
  if (roleErr) throw roleErr;

  const { error: passwordFlagErr } = await admin
    .from("profiles")
    .update({ has_password: true })
    .eq("id", data.user.id);
  if (passwordFlagErr) {
    console.warn(
      `  ⚠ couldn't set has_password for ${spec.email} — run migration 0005_password_login.sql, then re-run seed (login still works via the Password tab in the meantime)`
    );
  }

  console.log(`  OK ${spec.role.padEnd(8)} ${spec.email}  (${data.user.id})`);
  return data.user.id;
}

type NewDeadline = {
  rule_key: string;
  due_date: string;
  status: FilingDeadline["status"];
};

async function createCompany(params: {
  ownerId: string;
  name: string;
  secp_registration_no: string;
  incorporation_date: string;
  paid_up_capital: number;
  directors: Array<{ name: string; cnic: string; designation: string }>;
  agmDate?: string;
  deadlines?: NewDeadline[];
}): Promise<Company> {
  const { data: company, error: companyErr } = await admin
    .from("companies")
    .insert({
      owner_user_id: params.ownerId,
      name: params.name,
      secp_registration_no: params.secp_registration_no,
      incorporation_date: params.incorporation_date,
      paid_up_capital: params.paid_up_capital,
      company_type: "private_limited",
    })
    .select()
    .single();
  if (companyErr || !company) throw companyErr ?? new Error("company insert failed");

  if (params.directors.length > 0) {
    const { error: directorsErr } = await admin
      .from("company_directors")
      .insert(params.directors.map((d) => ({ company_id: company.id, ...d })));
    if (directorsErr) throw directorsErr;
  }

  if (params.agmDate) {
    const { error: agmErr } = await admin
      .from("agm_records")
      .insert({ company_id: company.id, agm_date: params.agmDate });
    if (agmErr) throw agmErr;
  }

  const createdDeadlines: FilingDeadline[] = [];
  for (const d of params.deadlines ?? []) {
    const { data: deadline, error: deadlineErr } = await admin
      .from("filing_deadlines")
      .insert({
        company_id: company.id,
        rule_key: d.rule_key,
        due_date: d.due_date,
        status: d.status,
      })
      .select()
      .single();
    if (deadlineErr || !deadline) throw deadlineErr ?? new Error("deadline insert failed");
    createdDeadlines.push(deadline as FilingDeadline);
  }

  console.log(`  OK company "${params.name}" (${createdDeadlines.length} deadline(s))`);
  return company as Company;
}

async function attachDraftAndFiling(params: {
  company: Company;
  directors: CompanyDirector[];
  deadline: FilingDeadline;
  reviewerId?: string;
}) {
  const pdfBytes = await generateFormADraft({
    company: params.company,
    directors: params.directors,
    deadline: params.deadline,
  });

  const path = `${params.deadline.company_id}/${params.deadline.id}/form-a-draft.pdf`;
  const { error: uploadErr } = await admin.storage
    .from("filings")
    .upload(path, Buffer.from(pdfBytes), { contentType: "application/pdf", upsert: true });
  if (uploadErr) throw uploadErr;

  const { error: filingErr } = await admin.from("filings").insert({
    filing_deadline_id: params.deadline.id,
    draft_document_url: path,
    reviewer_id: params.reviewerId ?? null,
  });
  if (filingErr) throw filingErr;

  console.log(`  OK draft PDF generated + uploaded for "${params.company.name}"`);
}

async function main() {
  console.log("1. Clearing previous demo users (if any)...");
  await deleteExistingDemoUsers();

  console.log("2. Creating demo users...");
  const ids: Record<string, string> = {};
  for (const spec of DEMO_USERS) {
    ids[spec.role] = await createDemoUser(spec);
  }

  console.log("3. Creating mock companies for the client account...");

  await createCompany({
    ownerId: ids.client,
    name: "Alpine Textiles (Pvt) Ltd",
    secp_registration_no: "0071234",
    incorporation_date: "2019-03-11",
    paid_up_capital: 2500000,
    directors: [
      { name: "Hassan Raza", cnic: "42101-1234567-1", designation: "Director" },
      { name: "Fatima Sheikh", cnic: "42101-7654321-2", designation: "CEO / Director" },
    ],
    agmDate: isoDaysFromNow(-410),
    deadlines: [{ rule_key: "secp_form_a_deadline", due_date: isoDaysFromNow(-40), status: "overdue" }],
  });

  const meridian = await createCompany({
    ownerId: ids.client,
    name: "Meridian Traders (Pvt) Ltd",
    secp_registration_no: "0089321",
    incorporation_date: "2021-07-22",
    paid_up_capital: 1000000,
    directors: [
      { name: "Omar Farooq", cnic: "35202-9988776-3", designation: "Director" },
      { name: "Ayesha Tariq", cnic: "35202-1122334-5", designation: "Director" },
    ],
    agmDate: isoDaysFromNow(-25),
    deadlines: [{ rule_key: "secp_form_a_deadline", due_date: isoDaysFromNow(5), status: "in_review" }],
  });
  const { data: meridianDirectors } = await admin
    .from("company_directors")
    .select("*")
    .eq("company_id", meridian.id);
  await attachDraftAndFiling({
    company: meridian,
    directors: (meridianDirectors ?? []) as CompanyDirector[],
    deadline: (
      await admin.from("filing_deadlines").select("*").eq("company_id", meridian.id).single()
    ).data as FilingDeadline,
  });

  await createCompany({
    ownerId: ids.client,
    name: "Crestline Industries (Pvt) Ltd",
    secp_registration_no: "0054892",
    incorporation_date: "2017-11-02",
    paid_up_capital: 5000000,
    directors: [
      { name: "Imran Qureshi", cnic: "42301-4455667-9", designation: "Director" },
      { name: "Nadia Baig", cnic: "42301-7788990-4", designation: "Director" },
    ],
    agmDate: isoDaysFromNow(-8),
    deadlines: [
      { rule_key: "secp_form_a_deadline", due_date: isoDaysFromNow(22), status: "draft_ready" },
      {
        rule_key: "secp_form_a_deadline",
        due_date: isoDaysFromNow(-355),
        status: "filed",
      },
    ],
  });

  await createCompany({
    ownerId: ids.client,
    name: "Skyline Holdings (Pvt) Ltd",
    secp_registration_no: "0093127",
    incorporation_date: "2022-05-18",
    paid_up_capital: 750000,
    directors: [{ name: "Zainab Hussain", cnic: "42101-3344556-7", designation: "Director" }],
    agmDate: isoDaysFromNow(-15),
    deadlines: [{ rule_key: "secp_form_a_deadline", due_date: isoDaysFromNow(15), status: "approved" }],
  });

  await createCompany({
    ownerId: ids.client,
    name: "Northgate Ventures (Pvt) Ltd",
    secp_registration_no: "0099441",
    incorporation_date: "2024-01-09",
    paid_up_capital: 500000,
    directors: [{ name: "Kamran Sultan", cnic: "42201-2233445-6", designation: "Director" }],
    // No AGM recorded yet — exercises the "Add an AGM date" empty state.
  });

  console.log("\nSEED COMPLETE\n");
  console.log("Demo accounts (password login, all use the same password):");
  for (const spec of DEMO_USERS) {
    console.log(`  ${spec.role.padEnd(8)} ${spec.email}`);
  }
  console.log(`  password  ${DEMO_PASSWORD}`);
  console.log("\nSign in at /login → \"Password\" tab.\n");
}

main().catch((err) => {
  console.error("\nSEED FAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
});
