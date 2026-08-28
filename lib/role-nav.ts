import type { UserRole } from "@/lib/types";

export interface RoleNavConfig {
  links: { href: string; label: string }[];
  roleLabel: string;
  homeHref: string;
}

/** Nav shell config per role — shared by the three role layouts and /profile. */
export function getRoleNavConfig(role: UserRole): RoleNavConfig {
  switch (role) {
    case "admin":
      return {
        links: [
          { href: "/admin/filing-queue", label: "Filing queue" },
          { href: "/admin/rules", label: "Rules" },
          { href: "/admin/billing", label: "Billing" },
        ],
        roleLabel: "Admin",
        homeHref: "/admin/filing-queue",
      };
    case "reviewer":
      return { links: [], roleLabel: "CA reviewer", homeHref: "/review-queue" };
    case "client":
    default:
      return { links: [], roleLabel: "Company owner", homeHref: "/dashboard" };
  }
}
