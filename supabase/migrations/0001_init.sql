-- SECP/FBR Compliance-as-a-Service — initial schema
-- Actors: client (company owner), reviewer (partner CA), admin (you)

create extension if not exists pgcrypto;

-- =========================================================
-- Enums
-- =========================================================

create type public.user_role as enum ('client', 'reviewer', 'admin');

create type public.filing_status as enum (
  'upcoming',
  'reminder_sent',
  'draft_ready',
  'in_review',
  'approved',
  'filed',
  'overdue'
);

create type public.reminder_channel as enum ('email', 'sms', 'whatsapp');

create type public.offset_from_type as enum (
  'agm_date',
  'incorporation_date',
  'fiscal_year_end'
);

create type public.subscription_status as enum ('trial', 'active', 'past_due', 'cancelled');

-- =========================================================
-- Profiles (role carrier; mirrors auth.users)
-- =========================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role public.user_role not null default 'client',
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- security definer helpers so RLS policies can check role without recursive RLS on profiles
create function public.is_staff()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'reviewer')
  );
$$;

create function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- =========================================================
-- Core tables
-- =========================================================

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  secp_registration_no text not null,
  incorporation_date date not null,
  paid_up_capital numeric(14, 2) not null default 0,
  company_type text not null default 'private_limited',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index companies_owner_idx on public.companies (owner_user_id);

create table public.company_directors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  cnic text not null,
  designation text not null default 'Director',
  created_at timestamptz not null default now()
);

create index company_directors_company_idx on public.company_directors (company_id);

create table public.agm_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  agm_date date not null,
  financial_year_end date,
  created_at timestamptz not null default now()
);

create index agm_records_company_idx on public.agm_records (company_id);

-- compliance_rules: legal deadline rules as admin-editable DATA, not code.
-- V1 seeds exactly one row (SECP Form A/29). Adding FBR later means adding rows here.
create table public.compliance_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null unique,
  company_type text not null default 'private_limited',
  label text not null,
  offset_from public.offset_from_type not null,
  offset_days integer not null,
  penalty_text text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.filing_deadlines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  rule_key text not null references public.compliance_rules (rule_key),
  source_agm_record_id uuid references public.agm_records (id),
  due_date date not null,
  status public.filing_status not null default 'upcoming',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index filing_deadlines_company_idx on public.filing_deadlines (company_id);
create index filing_deadlines_due_date_idx on public.filing_deadlines (due_date);
create index filing_deadlines_status_idx on public.filing_deadlines (status);

create table public.filings (
  id uuid primary key default gen_random_uuid(),
  filing_deadline_id uuid not null unique references public.filing_deadlines (id) on delete cascade,
  draft_document_url text,
  reviewer_id uuid references auth.users (id),
  reviewer_notes text,
  approved_at timestamptz,
  filed_at timestamptz,
  filed_by uuid references auth.users (id),
  confirmation_receipt_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reminders_log (
  id uuid primary key default gen_random_uuid(),
  filing_deadline_id uuid not null references public.filing_deadlines (id) on delete cascade,
  channel public.reminder_channel not null,
  sent_at timestamptz not null default now(),
  recipient text
);

create index reminders_log_deadline_idx on public.reminders_log (filing_deadline_id);

-- subscriptions: manual/invoice-based billing for V1, no payment-gateway schema yet
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies (id) on delete cascade,
  plan text not null default 'standard',
  status public.subscription_status not null default 'trial',
  monthly_amount_pkr numeric(10, 2) not null default 5000,
  last_invoiced_at timestamptz,
  last_paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- audit_log: the actual liability defense — every filing state change must be traceable
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users (id),
  action text not null,
  entity text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_entity_idx on public.audit_log (entity, entity_id);

-- =========================================================
-- updated_at triggers
-- =========================================================

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger companies_set_updated_at before update on public.companies
for each row execute procedure public.set_updated_at();

create trigger compliance_rules_set_updated_at before update on public.compliance_rules
for each row execute procedure public.set_updated_at();

create trigger filing_deadlines_set_updated_at before update on public.filing_deadlines
for each row execute procedure public.set_updated_at();

create trigger filings_set_updated_at before update on public.filings
for each row execute procedure public.set_updated_at();

create trigger subscriptions_set_updated_at before update on public.subscriptions
for each row execute procedure public.set_updated_at();

-- =========================================================
-- Row Level Security
-- =========================================================

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_directors enable row level security;
alter table public.agm_records enable row level security;
alter table public.compliance_rules enable row level security;
alter table public.filing_deadlines enable row level security;
alter table public.filings enable row level security;
alter table public.reminders_log enable row level security;
alter table public.subscriptions enable row level security;
alter table public.audit_log enable row level security;

-- profiles
create policy "profiles_select_own_or_staff" on public.profiles
for select using (id = auth.uid() or public.is_staff());

create policy "profiles_update_own" on public.profiles
for update using (id = auth.uid());

-- companies
create policy "companies_select" on public.companies
for select using (owner_user_id = auth.uid() or public.is_staff());

create policy "companies_insert" on public.companies
for insert with check (owner_user_id = auth.uid());

create policy "companies_update" on public.companies
for update using (owner_user_id = auth.uid() or public.is_staff());

-- company_directors
create policy "directors_select" on public.company_directors
for select using (
  exists (
    select 1 from public.companies c
    where c.id = company_id and (c.owner_user_id = auth.uid() or public.is_staff())
  )
);

create policy "directors_write" on public.company_directors
for all using (
  exists (
    select 1 from public.companies c
    where c.id = company_id and (c.owner_user_id = auth.uid() or public.is_staff())
  )
) with check (
  exists (
    select 1 from public.companies c
    where c.id = company_id and (c.owner_user_id = auth.uid() or public.is_staff())
  )
);

-- agm_records
create policy "agm_select" on public.agm_records
for select using (
  exists (
    select 1 from public.companies c
    where c.id = company_id and (c.owner_user_id = auth.uid() or public.is_staff())
  )
);

create policy "agm_write" on public.agm_records
for all using (
  exists (
    select 1 from public.companies c
    where c.id = company_id and (c.owner_user_id = auth.uid() or public.is_staff())
  )
) with check (
  exists (
    select 1 from public.companies c
    where c.id = company_id and (c.owner_user_id = auth.uid() or public.is_staff())
  )
);

-- compliance_rules: any authenticated user can read (needed to explain deadlines to clients);
-- only admin can write.
create policy "rules_select_all_authenticated" on public.compliance_rules
for select using (auth.role() = 'authenticated');

create policy "rules_admin_write" on public.compliance_rules
for all using (public.is_admin()) with check (public.is_admin());

-- filing_deadlines
create policy "deadlines_select" on public.filing_deadlines
for select using (
  exists (
    select 1 from public.companies c
    where c.id = company_id and (c.owner_user_id = auth.uid() or public.is_staff())
  )
);

create policy "deadlines_staff_write" on public.filing_deadlines
for all using (public.is_staff()) with check (public.is_staff());

-- filings
create policy "filings_select" on public.filings
for select using (
  exists (
    select 1 from public.filing_deadlines fd
    join public.companies c on c.id = fd.company_id
    where fd.id = filing_deadline_id and (c.owner_user_id = auth.uid() or public.is_staff())
  )
);

create policy "filings_staff_write" on public.filings
for all using (public.is_staff()) with check (public.is_staff());

-- reminders_log: internal/staff only
create policy "reminders_staff_select" on public.reminders_log
for select using (public.is_staff());

create policy "reminders_staff_write" on public.reminders_log
for all using (public.is_staff()) with check (public.is_staff());

-- subscriptions
create policy "subscriptions_select" on public.subscriptions
for select using (
  exists (
    select 1 from public.companies c
    where c.id = company_id and (c.owner_user_id = auth.uid() or public.is_staff())
  )
);

create policy "subscriptions_staff_write" on public.subscriptions
for all using (public.is_staff()) with check (public.is_staff());

-- audit_log: staff read everything; any authenticated actor can write an entry for their own action
create policy "audit_staff_select" on public.audit_log
for select using (public.is_staff());

create policy "audit_insert_any_authenticated" on public.audit_log
for insert with check (auth.role() = 'authenticated');
