-- Phone number for SMS reminders (fast-follow channel alongside email — see
-- app/api/cron/reminders/route.ts). Nullable: not required at signup, and a
-- client may never set one, in which case the SMS send is skipped for them.
alter table public.profiles add column phone text;
