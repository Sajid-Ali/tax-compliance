import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/nav-bar";

export default async function ReviewerLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "reviewer" && profile.role !== "admin")) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background">
      <NavBar links={[]} email={user?.email} roleLabel="CA reviewer" homeHref="/review-queue" />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
