/**
 * End-to-end smoke test against a real Supabase project: creates a throwaway
 * user, exercises the exact client flow (create company -> record AGM date
 * -> sync deadlines), verifies the computed due date, then deletes
 * everything it created.
 *
 * Usage: npm run smoke-test   (reads Supabase creds from .env.local)
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { syncDeadlinesForCompany } from "../lib/deadlines";

// Minimal inline .env.local loader — tsx's --env-file forwarding is
// unreliable when executing a file (vs. -e), and a full dotenv dependency
// is unjustified for parsing five KEY=VALUE lines.
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
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY — check .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  const testEmail = `smoke-test-${Date.now()}@example.com`;
  const testPassword = randomUUID();
  let userId: string | null = null;

  try {
    console.log("1. Creating throwaway test user...");
    const { data: userData, error: userErr } = await admin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });
    if (userErr || !userData.user) throw userErr ?? new Error("no user returned");
    userId = userData.user.id;
    console.log(`   OK user ${userId}`);

    console.log("2. Checking handle_new_user trigger created a profile row...");
    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (profileErr || !profile) {
      throw new Error(
        `No profile row found — is migration 0001_init.sql (the handle_new_user trigger) applied? ${profileErr?.message ?? ""}`
      );
    }
    console.log(`   OK profile exists, role=${profile.role}`);

    console.log("3. Signing in as the test user (RLS-respecting client, same as the app uses)...");
    const client = createClient(url!, anonKey!);
    const { data: signInData, error: signInErr } = await client.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    if (signInErr || !signInData.session) throw signInErr ?? new Error("sign-in failed");
    console.log("   OK signed in");

    console.log("4. Creating a company as this client (mirrors createCompany action)...");
    const { data: company, error: companyErr } = await client
      .from("companies")
      .insert({
        owner_user_id: userId,
        name: "Smoke Test Pvt Ltd",
        secp_registration_no: "SMOKE-0001",
        incorporation_date: "2024-01-15",
        paid_up_capital: 100000,
        company_type: "private_limited",
      })
      .select()
      .single();
    if (companyErr || !company) throw companyErr ?? new Error("company insert failed");
    console.log(`   OK company ${company.id}`);

    console.log("5. Recording an AGM date of 2026-06-30 (mirrors setAgmRecord action)...");
    const { error: agmErr } = await client
      .from("agm_records")
      .insert({ company_id: company.id, agm_date: "2026-06-30" });
    if (agmErr) throw agmErr;
    console.log("   OK AGM record created");

    console.log("6. Syncing filing deadlines via the real rules engine (lib/deadlines.ts)...");
    const { created, updated } = await syncDeadlinesForCompany(client, company.id);
    console.log(`   OK sync: ${created} created, ${updated} updated`);

    console.log("7. Verifying the computed deadline...");
    const { data: deadlines, error: deadlinesErr } = await client
      .from("filing_deadlines")
      .select("*")
      .eq("company_id", company.id);
    if (deadlinesErr) throw deadlinesErr;
    if (!deadlines || deadlines.length !== 1) {
      throw new Error(`Expected exactly 1 filing_deadlines row, got ${deadlines?.length ?? 0}`);
    }

    const deadline = deadlines[0];
    const expectedDueDate = "2026-07-30"; // 2026-06-30 AGM + 30 days
    if (deadline.due_date !== expectedDueDate) {
      throw new Error(`due_date mismatch: expected ${expectedDueDate}, got ${deadline.due_date}`);
    }
    if (deadline.rule_key !== "secp_form_a_deadline") {
      throw new Error(`Unexpected rule_key: ${deadline.rule_key} — is 0002_seed_rules.sql applied?`);
    }

    console.log(`   OK deadline correct: rule=${deadline.rule_key} due_date=${deadline.due_date} status=${deadline.status}`);
    console.log("\nSMOKE TEST PASSED\n");
  } finally {
    if (userId) {
      console.log("Cleaning up test data...");
      await admin.from("companies").delete().eq("owner_user_id", userId); // cascades directors/agm_records/filing_deadlines
      await admin.auth.admin.deleteUser(userId);
      console.log("   OK cleanup done");
    }
  }
}

main().catch((err) => {
  console.error("\nSMOKE TEST FAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
});
