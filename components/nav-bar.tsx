"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { Logo } from "@/components/logo";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/cn";

export function NavBar({
  links,
  email,
  avatarUrl,
  roleLabel,
  homeHref,
}: {
  links: { href: string; label: string }[];
  email?: string | null;
  avatarUrl?: string | null;
  roleLabel?: string;
  homeHref: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href={homeHref}>
            <Logo />
          </Link>
          {links.length > 0 && (
            <nav className="hidden items-center gap-1 sm:flex">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive(link.href)
                      ? "bg-surface-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {email && (
            <Link
              href="/profile"
              className="mr-1 hidden items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-surface-secondary sm:flex"
            >
              <div className="flex flex-col items-end leading-tight">
                <span className="text-xs font-medium text-foreground">{email}</span>
                {roleLabel && (
                  <span className="text-[11px] text-muted-foreground">{roleLabel}</span>
                )}
              </div>
              <Avatar src={avatarUrl} email={email} size="sm" />
            </Link>
          )}

          <ThemeToggle />

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-secondary hover:text-foreground"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>

          {(links.length > 0 || email) && (
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-secondary hover:text-foreground sm:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="h-4 w-4" />
                </button>
              </SheetTrigger>
              <SheetContent>
                <SheetTitle className="text-sm font-semibold tracking-tight text-foreground">
                  Menu
                </SheetTitle>
                <nav className="flex flex-col gap-1">
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive(link.href)
                          ? "bg-surface-secondary text-foreground"
                          : "text-muted-foreground hover:bg-surface-secondary hover:text-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive("/profile")
                        ? "bg-surface-secondary text-foreground"
                        : "text-muted-foreground hover:bg-surface-secondary hover:text-foreground"
                    )}
                  >
                    Profile
                  </Link>
                </nav>
                {email && (
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="mt-auto flex items-center gap-2 border-t border-border-subtle pt-4"
                  >
                    <Avatar src={avatarUrl} email={email} size="sm" />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium text-foreground">{email}</span>
                      {roleLabel && (
                        <span className="text-[11px] text-muted-foreground">{roleLabel}</span>
                      )}
                    </div>
                  </Link>
                )}
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
}
