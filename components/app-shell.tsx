import { NavBar } from "@/components/nav-bar";
import { cn } from "@/lib/cn";
import type { RoleNavConfig } from "@/lib/role-nav";

/**
 * Shared visual chrome (fixed header + fixed sidebar + main) for all three
 * role layouts. Auth/role-guard logic stays in each (client|admin|reviewer)
 * /layout.tsx — those genuinely differ per role, only the chrome was
 * duplicated. Sidebar width (w-72) must match NavBar's `<aside>` width.
 */
export function AppShell({
  links,
  email,
  avatarUrl,
  roleLabel,
  homeHref,
  maxWidth = "max-w-3xl",
  children,
}: {
  links: RoleNavConfig["links"];
  email?: string | null;
  avatarUrl?: string | null;
  roleLabel?: string;
  homeHref: string;
  maxWidth?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <NavBar
        links={links}
        email={email}
        avatarUrl={avatarUrl}
        roleLabel={roleLabel}
        homeHref={homeHref}
      />
      <main className={cn("pt-16", links.length > 0 && "lg:pl-72")}>
        <div className={cn("mx-auto px-4 py-10 sm:px-6", maxWidth)}>{children}</div>
      </main>
    </div>
  );
}
