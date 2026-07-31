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
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, has_password")
        .eq("id", user?.id)
        .single();

      const landing =
        redirectTo ??
        (profile?.role === "admin"
          ? "/admin/filing-queue"
          : profile?.role === "reviewer"
            ? "/review-queue"
            : "/dashboard");

      // First login via magic link: prompt to set a password so future
      // sign-ins don't require waiting on another email.
      if (profile && !profile.has_password) {
        return NextResponse.redirect(
          `${origin}/set-password?next=${encodeURIComponent(landing)}`
        );
      }

      return NextResponse.redirect(`${origin}${landing}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
