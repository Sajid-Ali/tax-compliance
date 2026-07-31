import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";

export default async function ReviewerLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "reviewer" && profile.role !== "admin")) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AppShell
      links={[]}
      email={user?.email}
      roleLabel="CA reviewer"
      homeHref="/review-queue"
      maxWidth="max-w-4xl"
    >
      {children}
    </AppShell>
  );
}
