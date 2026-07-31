import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AppShell
      links={[
        { href: "/admin/filing-queue", label: "Filing queue" },
        { href: "/admin/rules", label: "Rules" },
      ]}
      email={user?.email}
      roleLabel="Admin"
      homeHref="/admin/filing-queue"
      maxWidth="max-w-4xl"
    >
      {children}
    </AppShell>
  );
}
