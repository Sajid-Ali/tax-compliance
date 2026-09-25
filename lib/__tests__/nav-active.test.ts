import { describe, it, expect } from "vitest";
import { isNavLinkActive } from "../nav-active";

describe("isNavLinkActive", () => {
  it("matches an exact path", () => {
    expect(isNavLinkActive("/admin/filing-queue", "/admin/filing-queue")).toBe(true);
  });

  it("matches a nested path under the link", () => {
    expect(isNavLinkActive("/admin/filing-queue/123", "/admin/filing-queue")).toBe(true);
  });

  it("does not match a sibling path that merely shares a prefix string", () => {
    expect(isNavLinkActive("/admin/filing-queue-archive", "/admin/filing-queue")).toBe(false);
  });

  it("does not match an unrelated path", () => {
    expect(isNavLinkActive("/admin/rules", "/admin/filing-queue")).toBe(false);
  });

  it("returns false for a null pathname", () => {
    expect(isNavLinkActive(null, "/admin/filing-queue")).toBe(false);
  });
});
