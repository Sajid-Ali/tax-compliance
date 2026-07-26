import { describe, expect, it } from "vitest";
import {
  computeApplicableDeadlines,
  computeDueDateISO,
  MissingBaseDateError,
  reminderDatesFor,
  isOverdue,
} from "../rules-engine";
import type { AgmRecord, Company, ComplianceRule } from "../types";

const formARule: ComplianceRule = {
  id: "rule-1",
  rule_key: "secp_form_a_deadline",
  company_type: "private_limited",
  label: "SECP Form A / Form 29 — Annual Return",
  offset_from: "agm_date",
  offset_days: 30,
  penalty_text: "PKR 2,000-10,000+ escalating daily penalties.",
  active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const company: Company = {
  id: "company-1",
  owner_user_id: "user-1",
  name: "Test Pvt Ltd",
  secp_registration_no: "0123456",
  incorporation_date: "2024-03-15",
  paid_up_capital: 100000,
  company_type: "private_limited",
  status: "active",
  created_at: "2024-03-15T00:00:00Z",
  updated_at: "2024-03-15T00:00:00Z",
};

const agmRecord: AgmRecord = {
  id: "agm-1",
  company_id: "company-1",
  agm_date: "2026-06-30",
  financial_year_end: "2026-06-30",
  created_at: "2026-06-30T00:00:00Z",
};

describe("computeDueDateISO", () => {
  it("computes Form A due date as AGM date + 30 days", () => {
    expect(computeDueDateISO(formARule, company, agmRecord)).toBe("2026-07-30");
  });

  it("handles a month-end AGM date that rolls the due date into the next month", () => {
    const janAgm: AgmRecord = { ...agmRecord, agm_date: "2026-01-31" };
    expect(computeDueDateISO(formARule, company, janAgm)).toBe("2026-03-02");
  });

  it("throws MissingBaseDateError when no AGM record exists yet", () => {
    expect(() => computeDueDateISO(formARule, company, null)).toThrow(MissingBaseDateError);
  });

  it("uses incorporation_date directly when a rule is offset from it, ignoring AGM", () => {
    const incorpRule: ComplianceRule = {
      ...formARule,
      rule_key: "first_agm_deadline",
      offset_from: "incorporation_date",
      offset_days: 120,
    };
    expect(computeDueDateISO(incorpRule, company, null)).toBe("2024-07-13");
  });
});

describe("computeApplicableDeadlines", () => {
  it("returns one deadline for a matching, active rule with a resolvable base date", () => {
    const result = computeApplicableDeadlines([formARule], company, agmRecord);
    expect(result).toEqual([
      { rule_key: "secp_form_a_deadline", due_date: "2026-07-30", source_agm_record_id: "agm-1" },
    ]);
  });

  it("skips rules whose base date isn't available yet, instead of throwing", () => {
    const result = computeApplicableDeadlines([formARule], company, null);
    expect(result).toEqual([]);
  });

  it("skips rules for a different company_type", () => {
    const publicRule: ComplianceRule = {
      ...formARule,
      rule_key: "other_rule",
      company_type: "public_limited",
    };
    const result = computeApplicableDeadlines([publicRule], company, agmRecord);
    expect(result).toEqual([]);
  });

  it("skips inactive rules", () => {
    const inactiveRule: ComplianceRule = { ...formARule, active: false };
    const result = computeApplicableDeadlines([inactiveRule], company, agmRecord);
    expect(result).toEqual([]);
  });
});

describe("reminderDatesFor", () => {
  it("returns reminder dates furthest-out first for the standard T-30/14/7/1 cadence", () => {
    expect(reminderDatesFor("2026-07-30", [30, 14, 7, 1])).toEqual([
      "2026-06-30",
      "2026-07-16",
      "2026-07-23",
      "2026-07-29",
    ]);
  });
});

describe("isOverdue", () => {
  it("is false before the due date", () => {
    expect(isOverdue("2026-07-30", new Date("2026-07-29T00:00:00Z"))).toBe(false);
  });

  it("is true on or after the due date", () => {
    expect(isOverdue("2026-07-30", new Date("2026-07-30T00:00:00Z"))).toBe(true);
    expect(isOverdue("2026-07-30", new Date("2026-08-01T00:00:00Z"))).toBe(true);
  });
});
