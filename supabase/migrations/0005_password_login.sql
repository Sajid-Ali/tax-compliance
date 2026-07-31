-- Tracks whether a client has set a password yet. V1 auth is magic-link-only
-- on first sign-in; after that, app/set-password prompts them to set a
-- password so future logins can use email+password instead. Supabase itself
-- doesn't expose "has this user set a password" via the client SDK, so we
-- carry it here alongside role.

alter table public.profiles add column has_password boolean not null default false;
