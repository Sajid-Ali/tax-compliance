/**
 * True if `pathname` is `href` or a path nested under it. Guards the
 * "sibling path shares a string prefix" bug (`/admin/filing-queue-archive`
 * must NOT match `/admin/filing-queue`) by requiring a `/` boundary.
 */
export function isNavLinkActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}
