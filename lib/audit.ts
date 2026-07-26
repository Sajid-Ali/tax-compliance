import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Writes one audit_log row. Call this on every state transition that
 * matters for liability (filing approved, filing marked as filed, deadline
 * date corrected) — this table is the evidence trail if a client ever
 * disputes who approved or changed what.
 */
export async function logAudit(
  supabase: SupabaseClient,
  params: {
    actorUserId: string | null;
    action: string;
    entity: string;
    entityId: string | null;
    before?: unknown;
    after?: unknown;
  }
) {
  const { error } = await supabase.from("audit_log").insert({
    actor_user_id: params.actorUserId,
    action: params.action,
    entity: params.entity,
    entity_id: params.entityId,
    before: params.before ?? null,
    after: params.after ?? null,
  });
  if (error) throw error;
}
