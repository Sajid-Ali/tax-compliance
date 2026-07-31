import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/** Exchanges the magic-link code for a session, then routes by role. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Fetched separately from has_password below: role always exists, but
      // has_password depends on migration 0005_password_login.sql having
      // been run. Combining them in one .select() meant a missing column
      // failed the *entire* query — silently breaking role-based routing,
      // not just the password prompt.
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user?.id)
        .single();
      if (profileErr) {
        console.error("auth/callback: couldn't read profile role", profileErr.message);
      }

      const landing =
        redirectTo ??
        (profile?.role === "admin"
          ? "/admin/filing-queue"
          : profile?.role === "reviewer"
            ? "/review-queue"
            : "/dashboard");

      // First login via magic link: prompt to set a password so future
      // sign-ins don't require waiting on another email. Best-effort — if
      // has_password isn't queryable yet (migration not applied), skip the
      // prompt rather than breaking the login.
      const { data: passwordFlag, error: passwordFlagErr } = await supabase
        .from("profiles")
        .select("has_password")
        .eq("id", user?.id)
        .single();
      if (passwordFlagErr) {
        console.error(
          "auth/callback: couldn't read has_password (is migration 0005_password_login.sql applied?)",
          passwordFlagErr.message
        );
      } else if (passwordFlag && !passwordFlag.has_password) {
        return NextResponse.redirect(
          `${origin}/set-password?next=${encodeURIComponent(landing)}`
        );
      }

      return NextResponse.redirect(`${origin}${landing}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
