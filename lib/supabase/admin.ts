import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. BYPASSES RLS entirely.
 *
 * Only import this from trusted server-only code (the reminders cron route,
 * admin filing actions) — never from anything reachable by a Client
 * Component. The `server-only` import above makes an accidental client
 * bundle a build error, not just a runtime leak.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
