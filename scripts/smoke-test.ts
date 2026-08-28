/**
 * End-to-end smoke test against a real Supabase project: creates a throwaway
 * user, exercises the exact client flow (create company -> record AGM date
 * -> sync deadlines -> generate draft -> send to reviewer -> approve ->
 * mark filed), verifies the computed due date and every status/audit_log
 * transition along the way, then deletes everything it created.
 *
 * Steps 8+ (draft through filed) write the same rows the real admin/reviewer
 * server actions write (lib/documents/form-a-template.ts + generateDraft /
 * sendToReviewer / approveFiling / markFiled in their respective actions.ts
 * files), but do so directly via the admin (service-role) client instead of
 * calling those "use server" functions — this is a standalone script with no
 * request/cookie session for requireAdmin()/requireReviewer() to read, same
 * reasoning already documented for the admin client below. It verifies the
 * pipeline's data/audit mechanics, not the role-gate checks themselves.
 *
 * Usage: npm run smoke-test   (reads Supabase creds from .env.local)
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { syncDeadlinesForCompany } from "../lib/deadlines";
import { generateFormADraft } from "../lib/documents/form-a-template";
import type { Company, CompanyDirector, FilingDeadline } from "../lib/types";

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
    const value = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY — check .env.local"
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const testEmail = `smoke-test-${Date.now()}@example.com`;
  const testPassword = randomUUID();
  let userId: string | null = null;
  let draftPath: string | undefined;
  let receiptPath: string | undefined;

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
      throw new Error(
        `Unexpected rule_key: ${deadline.rule_key} — is 0002_seed_rules.sql applied?`
      );
    }

    console.log(
      `   OK deadline correct: rule=${deadline.rule_key} due_date=${deadline.due_date} status=${deadline.status}`
    );

    console.log("8. Adding a director (mirrors addDirector action)...");
    const { error: directorErr } = await client.from("company_directors").insert({
      company_id: company.id,
      name: "Test Director",
      cnic: "12345-1234567-1",
      designation: "Director",
    });
    if (directorErr) throw directorErr;
    const { data: directors } = await client
      .from("company_directors")
      .select("*")
      .eq("company_id", company.id);
    console.log(`   OK ${directors?.length ?? 0} director(s) recorded`);

    console.log("9. Generating the Form A draft (mirrors generateDraft action)...");
    const pdfBytes = await generateFormADraft({
      company: company as Company,
      directors: (directors ?? []) as CompanyDirector[],
      deadline: deadline as FilingDeadline,
    });
    draftPath = `${company.id}/${deadline.id}/form-a-draft.pdf`;
    const { error: uploadErr } = await admin.storage
      .from("filings")
      .upload(draftPath, Buffer.from(pdfBytes), { contentType: "application/pdf", upsert: true });
    if (uploadErr) throw uploadErr;
    const { error: draftUpsertErr } = await admin
      .from("filings")
      .upsert(
        { filing_deadline_id: deadline.id, draft_document_url: draftPath },
        { onConflict: "filing_deadline_id" }
      );
    if (draftUpsertErr) throw draftUpsertErr;
    const { error: draftStatusErr } = await admin
      .from("filing_deadlines")
      .update({ status: "draft_ready" })
      .eq("id", deadline.id);
    if (draftStatusErr) throw draftStatusErr;
    await admin.from("audit_log").insert({
      actor_user_id: userId,
      action: "draft_generated",
      entity: "filing_deadlines",
      entity_id: deadline.id,
      after: { draft_document_url: draftPath },
    });
    console.log("   OK draft generated, uploaded, status=draft_ready");

    console.log("10. Sending to reviewer (mirrors sendToReviewer action)...");
    const { error: reviewStatusErr } = await admin
      .from("filing_deadlines")
      .update({ status: "in_review" })
      .eq("id", deadline.id);
    if (reviewStatusErr) throw reviewStatusErr;
    await admin.from("audit_log").insert({
      actor_user_id: userId,
      action: "sent_to_reviewer",
      entity: "filing_deadlines",
      entity_id: deadline.id,
    });
    console.log("   OK status=in_review");

    console.log("11. Approving the filing (mirrors approveFiling action)...");
    const approvedAt = new Date().toISOString();
    const { error: approveErr } = await admin.from("filings").upsert(
      {
        filing_deadline_id: deadline.id,
        reviewer_id: userId,
        approved_at: approvedAt,
        reviewer_notes: null,
      },
      { onConflict: "filing_deadline_id" }
    );
    if (approveErr) throw approveErr;
    const { error: approveStatusErr } = await admin
      .from("filing_deadlines")
      .update({ status: "approved" })
      .eq("id", deadline.id);
    if (approveStatusErr) throw approveStatusErr;
    await admin.from("audit_log").insert({
      actor_user_id: userId,
      action: "filing_approved",
      entity: "filing_deadlines",
      entity_id: deadline.id,
    });
    console.log("   OK status=approved");

    console.log("12. Marking filed (mirrors markFiled action)...");
    const filedAt = new Date().toISOString();
    receiptPath = `${deadline.id}/confirmation-receipt-${Date.now()}.pdf`;
    const { error: receiptUploadErr } = await admin.storage
      .from("filings")
      .upload(receiptPath, Buffer.from("smoke-test-receipt"), {
        contentType: "application/pdf",
        upsert: true,
      });
    if (receiptUploadErr) throw receiptUploadErr;
    const { error: filedErr } = await admin.from("filings").upsert(
      {
        filing_deadline_id: deadline.id,
        filed_at: filedAt,
        filed_by: userId,
        confirmation_receipt_url: receiptPath,
      },
      { onConflict: "filing_deadline_id" }
    );
    if (filedErr) throw filedErr;
    const { error: filedStatusErr } = await admin
      .from("filing_deadlines")
      .update({ status: "filed" })
      .eq("id", deadline.id);
    if (filedStatusErr) throw filedStatusErr;
    await admin.from("audit_log").insert({
      actor_user_id: userId,
      action: "marked_filed",
      entity: "filing_deadlines",
      entity_id: deadline.id,
      after: { confirmation_receipt_url: receiptPath },
    });
    console.log("   OK status=filed");

    console.log("13. Verifying final state + audit trail...");
    const { data: finalDeadline, error: finalErr } = await admin
      .from("filing_deadlines")
      .select("*")
      .eq("id", deadline.id)
      .single();
    if (finalErr || !finalDeadline) throw finalErr ?? new Error("Deadline vanished");
    if (finalDeadline.status !== "filed") {
      throw new Error(`Expected status "filed", got "${finalDeadline.status}"`);
    }

    const { data: finalFiling, error: finalFilingErr } = await admin
      .from("filings")
      .select("*")
      .eq("filing_deadline_id", deadline.id)
      .single();
    if (finalFilingErr || !finalFiling) throw finalFilingErr ?? new Error("Filing row missing");
    if (!finalFiling.filed_at || !finalFiling.approved_at || !finalFiling.draft_document_url) {
      throw new Error("Filing row is missing expected fields after the full pipeline");
    }

    const { data: auditRows, error: auditErr } = await admin
      .from("audit_log")
      .select("action")
      .eq("entity", "filing_deadlines")
      .eq("entity_id", deadline.id)
      .order("created_at", { ascending: true });
    if (auditErr) throw auditErr;
    const expectedActions = [
      "draft_generated",
      "sent_to_reviewer",
      "filing_approved",
      "marked_filed",
    ];
    const actualActions = (auditRows ?? []).map((r) => r.action);
    for (const action of expectedActions) {
      if (!actualActions.includes(action)) {
        throw new Error(
          `Missing expected audit_log entry "${action}" — got: ${actualActions.join(", ")}`
        );
      }
    }
    console.log(`   OK filing pipeline complete, audit_log: ${actualActions.join(" -> ")}`);

    console.log("\nSMOKE TEST PASSED\n");
  } finally {
    if (userId) {
      console.log("Cleaning up test data...");
      if (draftPath) await admin.storage.from("filings").remove([draftPath]);
      if (receiptPath) await admin.storage.from("filings").remove([receiptPath]);
      // audit_log.actor_user_id has no ON DELETE CASCADE to auth.users (a
      // liability trail shouldn't silently vanish when an account is
      // deleted) — clear rows this run created before deleting the user, or
      // deleteUser below fails on the FK.
      await admin.from("audit_log").delete().eq("actor_user_id", userId);
      await admin.from("companies").delete().eq("owner_user_id", userId); // cascades directors/agm_records/filing_deadlines/filings
      await admin.auth.admin.deleteUser(userId);
      console.log("   OK cleanup done");
    }
  }
}

main().catch((err) => {
  console.error("\nSMOKE TEST FAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
});
