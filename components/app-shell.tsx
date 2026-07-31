import { NavBar } from "@/components/nav-bar";
import { cn } from "@/lib/cn";

/**
 * Shared visual chrome (nav + main wrapper) for all three role layouts.
 * Auth/role-guard logic stays in each (client|admin|reviewer)/layout.tsx —
 * those genuinely differ per role, only the chrome around them was
 * duplicated.
 */
export function AppShell({
  links,
  email,
  roleLabel,
  homeHref,
  maxWidth = "max-w-3xl",
  children,
}: {
  links: { href: string; label: string }[];
  email?: string | null;
  roleLabel?: string;
  homeHref: string;
  maxWidth?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <NavBar links={links} email={email} roleLabel={roleLabel} homeHref={homeHref} />
      <main className={cn("mx-auto px-4 py-10 sm:px-6", maxWidth)}>{children}</main>
    </div>
  );
}
