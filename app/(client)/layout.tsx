import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { getRoleNavConfig } from "@/lib/role-nav";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const nav = getRoleNavConfig("client");
  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? null;

  return (
    <AppShell {...nav} email={user?.email} avatarUrl={avatarUrl}>
      {children}
    </AppShell>
  );
}
