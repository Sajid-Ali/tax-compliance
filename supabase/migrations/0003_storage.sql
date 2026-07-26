-- Private bucket for Form A drafts and SECP filing confirmation receipts.
-- Only staff (admin/reviewer) touch these directly; clients never see raw
-- storage objects, only signed URLs the app hands out where appropriate.

insert into storage.buckets (id, name, public)
values ('filings', 'filings', false)
on conflict (id) do nothing;

create policy "filings_staff_read" on storage.objects
for select using (bucket_id = 'filings' and public.is_staff());

create policy "filings_staff_write" on storage.objects
for insert with check (bucket_id = 'filings' and public.is_staff());

create policy "filings_staff_update" on storage.objects
for update using (bucket_id = 'filings' and public.is_staff());
