import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AppShell links={[]} email={user?.email} roleLabel="Company owner" homeHref="/dashboard">
      {children}
    </AppShell>
  );
}
