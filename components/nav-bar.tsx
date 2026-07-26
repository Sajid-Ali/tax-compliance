"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/cn";

export function NavBar({
  links,
  email,
  roleLabel,
  homeHref,
}: {
  links: { href: string; label: string }[];
  email?: string | null;
  roleLabel?: string;
  homeHref: string;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href={homeHref}>
            <Logo />
          </Link>
          {links.length > 0 && (
            <nav className="hidden items-center gap-1 sm:flex">
              {links.map((link) => {
                const active = pathname === link.href || pathname?.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-surface-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {email && (
            <div className="hidden flex-col items-end leading-tight sm:flex">
              <span className="text-xs font-medium text-foreground">{email}</span>
              {roleLabel && <span className="text-[11px] text-muted-foreground">{roleLabel}</span>}
            </div>
          )}
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-secondary hover:text-foreground"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
