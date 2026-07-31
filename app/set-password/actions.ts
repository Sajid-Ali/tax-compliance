"use server";

import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

/**
 * Marks the current user's profile as having a password set. Called after
 * `supabase.auth.updateUser({ password })` succeeds client-side (that call
 * itself must run in the browser — the service role isn't involved, this is
 * the signed-in user's own session).
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
  if (error) throw error;

  await logAudit(supabase, {
    actorUserId: user.id,
    action: "password_set",
    entity: "profiles",
    entityId: user.id,
  });
}
