import { addDays, formatISO, parseISO, subDays } from "date-fns";
import type { AgmRecord, Company, ComplianceRule } from "./types";

export class MissingBaseDateError extends Error {
  constructor(ruleKey: string, offsetFrom: string) {
    super(
      `Cannot compute due date for rule "${ruleKey}": no ${offsetFrom} available yet.`
    );
    this.name = "MissingBaseDateError";
  }
}

/**
 * Resolves the base date a rule's offset is measured from.
 * agm_date / fiscal_year_end come from the company's most recent AGM record;
 * incorporation_date comes from the company itself.
 */
function resolveBaseDate(
  rule: ComplianceRule,
  company: Company,
  agmRecord: AgmRecord | null
): Date {
  switch (rule.offset_from) {
    case "incorporation_date":
      return parseISO(company.incorporation_date);
    case "agm_date":
      if (!agmRecord) throw new MissingBaseDateError(rule.rule_key, "agm_date");
      return parseISO(agmRecord.agm_date);
    case "fiscal_year_end":
      if (!agmRecord?.financial_year_end) {
        throw new MissingBaseDateError(rule.rule_key, "fiscal_year_end");
      }
      return parseISO(agmRecord.financial_year_end);
    default: {
      const exhaustive: never = rule.offset_from;
      throw new Error(`Unhandled offset_from: ${exhaustive}`);
    }
  }
}

/**
 * due_date = base_date(offset_from, company | agm_record) + offset_days
 *
 * Deliberately a single deterministic function reading `compliance_rules`
 * as data. Adding FBR rules later means adding rows to that table, not
 * new branches here.
 */
export function computeDueDate(
  rule: ComplianceRule,
  company: Company,
  agmRecord: AgmRecord | null
): Date {
  const base = resolveBaseDate(rule, company, agmRecord);
  return addDays(base, rule.offset_days);
}

export function computeDueDateISO(
  rule: ComplianceRule,
  company: Company,
  agmRecord: AgmRecord | null
): string {
  return formatISO(computeDueDate(rule, company, agmRecord), { representation: "date" });
}

/**
 * Given the rules applicable to a company's type, returns one computed
 * deadline per rule that currently has a resolvable base date. Rules whose
 * base date isn't available yet (e.g. no AGM recorded) are skipped, not
 * errored — the caller (onboarding flow) is expected to prompt for the
 * missing input instead of crashing a batch job.
 */
export function computeApplicableDeadlines(
  rules: ComplianceRule[],
  company: Company,
  latestAgmRecord: AgmRecord | null
): Array<{ rule_key: string; due_date: string; source_agm_record_id: string | null }> {
  return rules
    .filter((r) => r.active && r.company_type === company.company_type)
    .flatMap((rule) => {
      try {
        return [
          {
            rule_key: rule.rule_key,
            due_date: computeDueDateISO(rule, company, latestAgmRecord),
            source_agm_record_id: rule.offset_from === "incorporation_date" ? null : latestAgmRecord?.id ?? null,
          },
        ];
      } catch (err) {
        if (err instanceof MissingBaseDateError) return [];
        throw err;
      }
    });
}

/**
 * Reminder cascade dates for a given due date, e.g. [T-30, T-14, T-7, T-1].
 * Product/ops decision, intentionally separate from the legal rule itself.
 */
export function reminderDatesFor(dueDateISO: string, offsetsDaysBefore: readonly number[]): string[] {
  const due = parseISO(dueDateISO);
  return offsetsDaysBefore
    .slice()
    .sort((a, b) => b - a) // furthest-out reminder first
    .map((days) => formatISO(subDays(due, days), { representation: "date" }));
}

/** True if today (or the given date) is on/after the due date with no filing yet. */
export function isOverdue(dueDateISO: string, today: Date = new Date()): boolean {
  return parseISO(dueDateISO).getTime() <= today.getTime();
}
