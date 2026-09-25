import type { UserRole } from "@/lib/types";

export interface RoleNavConfig {
  links: { href: string; label: string; icon: "grid" | "send" | "scale" | "credit-card" }[];
  roleLabel: string;
  homeHref: string;
}

/** Nav shell config per role — shared by the three role layouts and /profile. */
export function getRoleNavConfig(role: UserRole): RoleNavConfig {
  switch (role) {
    case "admin":
      return {
        links: [
          { href: "/admin/filing-queue", label: "Filing queue", icon: "send" },
          { href: "/admin/rules", label: "Rules", icon: "scale" },
          { href: "/admin/billing", label: "Billing", icon: "credit-card" },
        ],
        roleLabel: "Admin",
        homeHref: "/admin/filing-queue",
      };
    case "reviewer":
      return { links: [], roleLabel: "CA reviewer", homeHref: "/review-queue" };
    case "client":
    default:
      return {
        links: [{ href: "/dashboard", label: "Dashboard", icon: "grid" }],
        roleLabel: "Company owner",
        homeHref: "/dashboard",
      };
  }
}
