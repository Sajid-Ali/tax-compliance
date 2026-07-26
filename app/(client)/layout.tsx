import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/nav-bar";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background">
      <NavBar links={[]} email={user?.email} roleLabel="Company owner" homeHref="/dashboard" />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
