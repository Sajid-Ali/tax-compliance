"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, LayoutGrid, Send, Scale, CreditCard } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/logo";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SidebarNavItem } from "@/components/ui/sidebar-nav-item";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { isNavLinkActive } from "@/lib/nav-active";
import type { RoleNavConfig } from "@/lib/role-nav";

const ICON_MAP: Record<RoleNavConfig["links"][number]["icon"], LucideIcon> = {
  grid: LayoutGrid,
  send: Send,
  scale: Scale,
  "credit-card": CreditCard,
};

function UserMenu({
  email,
  avatarUrl,
  roleLabel,
}: {
  email?: string | null;
  avatarUrl?: string | null;
  roleLabel?: string;
}) {
  if (!email) return null;
  return (
    <Link
      href="/profile"
      className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-surface-secondary"
    >
      <div className="hidden flex-col items-end leading-tight sm:flex">
        <span className="text-xs font-medium text-foreground">{email}</span>
        {roleLabel && <span className="text-[11px] text-muted-foreground">{roleLabel}</span>}
      </div>
      <Avatar src={avatarUrl} email={email} size="sm" />
    </Link>
  );
}

function SidebarNav({ links }: { links: RoleNavConfig["links"] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 px-3">
      {links.map((link) => (
        <SidebarNavItem
          key={link.href}
          href={link.href}
          label={link.label}
          icon={ICON_MAP[link.icon]}
          active={isNavLinkActive(pathname, link.href)}
        />
      ))}
    </nav>
  );
}

export function NavBar({
  links,
  email,
  avatarUrl,
  roleLabel,
  homeHref,
}: {
  links: RoleNavConfig["links"];
  email?: string | null;
  avatarUrl?: string | null;
  roleLabel?: string;
  homeHref: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Fixed top header — full width, above the sidebar */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {links.length > 0 && (
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-secondary hover:text-foreground lg:hidden"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="h-4 w-4" />
            </button>
          )}
          <Link href={homeHref}>
            <Logo />
          </Link>
        </div>

        <div className="flex items-center gap-1.5">
          <UserMenu email={email} avatarUrl={avatarUrl} roleLabel={roleLabel} />
          <ThemeToggle />
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-secondary hover:text-foreground"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>

      {/* Fixed left sidebar — desktop only (lg:flex); tablet and mobile use the Sheet below */}
      {links.length > 0 && (
        <aside className="fixed inset-y-0 left-0 top-16 z-20 hidden w-72 flex-col gap-1 border-r border-border bg-surface py-4 lg:flex">
          <SidebarNav links={links} />
        </aside>
      )}

      {/* Mobile off-canvas nav */}
      {links.length > 0 && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent>
            <SheetTitle className="text-sm font-semibold tracking-tight text-foreground">
              Menu
            </SheetTitle>
            <div onClick={() => setMobileOpen(false)}>
              <SidebarNav links={links} />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
