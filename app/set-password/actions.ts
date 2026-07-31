"use server";

import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

/**
 * Marks the current user's profile as having a password set. Called after
 * `supabase.auth.updateUser({ password })` succeeds client-side (that call
 * itself must run in the browser — the service role isn't involved, this is
 * the signed-in user's own session).
 *
 * Deliberately doesn't throw if the update fails — most commonly because
 * migration 0005_password_login.sql (has_password column) hasn't been run
 * yet. The password itself is already set in Supabase Auth at that point;
 * failing to flip this flag should never block the user from continuing.
 * It just means the post-magic-link prompt will show again next time.
 */
export async function markPasswordSet() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({ has_password: true })
    .eq("id", user.id);
  if (error) {
    console.error(
      "markPasswordSet: couldn't update has_password (is migration 0005_password_login.sql applied?)",
      error.message
    );
    return;
  }

  await logAudit(supabase, {
    actorUserId: user.id,
    action: "password_set",
    entity: "profiles",
    entityId: user.id,
  });
}
