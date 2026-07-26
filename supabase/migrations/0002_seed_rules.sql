-- Seed the one rule V1 needs: SECP Form A/29 annual return, due 30 days after the AGM.
-- Adding FBR rules later is a new row here, not a code change — see lib/rules-engine.ts.

insert into public.compliance_rules (rule_key, company_type, label, offset_from, offset_days, penalty_text)
values (
  'secp_form_a_deadline',
  'private_limited',
  'SECP Form A / Form 29 — Annual Return',
  'agm_date',
  30,
  'Late filing: PKR 2,000-10,000+ escalating daily penalties. Sustained non-compliance can lead to the company being declared "defaulting," bank account freezes, and strike-off under Companies Act 2017 Section 426.'
);
