import type { SupabaseClient } from "@supabase/supabase-js";
import { computeApplicableDeadlines } from "./rules-engine";
import type { AgmRecord, Company, ComplianceRule, FilingDeadline } from "./types";

/**
 * Recomputes and upserts filing_deadlines for one company from its latest
 * AGM record + the active compliance_rules for its company_type.
 *
 * Upsert rule: a company can have at most one non-"filed" deadline per
 * rule_key at a time. If one exists, its due_date is refreshed (handles the
 * client correcting a mistyped AGM date). Once a deadline is "filed", it's
 * left alone and the next AGM record produces a fresh row — that's how the
 * annual cycle advances without a cron job having to know about years.
 *
 * Called from the client's "save AGM date" action and, in a loop, from the
 * daily reminders cron so nothing is missed if a client edits data
 * out-of-band.
 */
export async function syncDeadlinesForCompany(
  supabase: SupabaseClient,
  companyId: string
): Promise<{ created: number; updated: number }> {
  const { data: company, error: companyErr } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();
  if (companyErr || !company) throw companyErr ?? new Error(`Company ${companyId} not found`);

  const { data: latestAgm } = await supabase
    .from("agm_records")
    .select("*")
    .eq("company_id", companyId)
    .order("agm_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: rules, error: rulesErr } = await supabase
    .from("compliance_rules")
    .select("*")
    .eq("company_type", (company as Company).company_type)
    .eq("active", true);
  if (rulesErr) throw rulesErr;

  const computed = computeApplicableDeadlines(
    (rules as ComplianceRule[]) ?? [],
    company as Company,
    (latestAgm as AgmRecord | null) ?? null
  );

  let created = 0;
  let updated = 0;

  for (const deadline of computed) {
    const { data: existing } = await supabase
      .from("filing_deadlines")
      .select("*")
      .eq("company_id", companyId)
      .eq("rule_key", deadline.rule_key)
      .neq("status", "filed")
      .order("due_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      const row = existing as FilingDeadline;
      if (row.due_date !== deadline.due_date) {
        const { error } = await supabase
          .from("filing_deadlines")
          .update({
            due_date: deadline.due_date,
            source_agm_record_id: deadline.source_agm_record_id,
            status: "upcoming",
          })
          .eq("id", row.id);
        if (error) throw error;
        updated++;
      }
    } else {
      const { error } = await supabase.from("filing_deadlines").insert({
        company_id: companyId,
        rule_key: deadline.rule_key,
        source_agm_record_id: deadline.source_agm_record_id,
        due_date: deadline.due_date,
        status: "upcoming",
      });
      if (error) throw error;
      created++;
    }
  }

  return { created, updated };
}
