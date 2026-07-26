-- Bug fix: filing_deadlines was staff-write-only (deadlines_staff_write),
-- but syncDeadlinesForCompany() runs as the signed-in CLIENT when they save
-- an AGM date (app/(client)/companies/actions.ts -> setAgmRecord), so their
-- own insert/update was silently blocked by RLS. Confirmed by
-- scripts/smoke-test.ts, which failed at step 6 with 42501 before this
-- migration.
--
-- Fix: let the company owner write filing_deadlines for their OWN company,
-- but only ever into the deterministic "upcoming" status — every other
-- transition (reminder_sent, draft_ready, in_review, approved, filed,
-- overdue) is produced exclusively by the cron job or staff actions, which
-- already go through the admin (service-role) client or a staff-authed
-- session and are covered by deadlines_staff_write. This closes the
-- integrity gap where a client could otherwise self-report e.g. status =
-- 'filed' by hitting the REST API directly.

create policy "deadlines_owner_insert_upcoming" on public.filing_deadlines
for insert
with check (
  status = 'upcoming'
  and exists (
    select 1 from public.companies c
    where c.id = company_id and c.owner_user_id = auth.uid()
  )
);

create policy "deadlines_owner_update_upcoming" on public.filing_deadlines
for update
using (
  exists (
    select 1 from public.companies c
    where c.id = company_id and c.owner_user_id = auth.uid()
  )
)
with check (
  status = 'upcoming'
  and exists (
    select 1 from public.companies c
    where c.id = company_id and c.owner_user_id = auth.uid()
  )
);
