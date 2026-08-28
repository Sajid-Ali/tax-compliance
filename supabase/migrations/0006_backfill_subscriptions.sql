-- Backfill: every company should have exactly one subscriptions row
-- (company_id is UNIQUE — see 0001_init.sql). Companies created before this
-- migration predate the subscription-on-signup insert added to
-- app/(client)/companies/actions.ts::createCompany. Column defaults
-- (plan 'standard', status 'trial', monthly_amount_pkr 5000) apply.
insert into public.subscriptions (company_id)
select c.id
from public.companies c
where not exists (
  select 1 from public.subscriptions s where s.company_id = c.id
);
