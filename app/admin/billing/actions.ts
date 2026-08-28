"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { type ActionState, zodFieldErrors } from "@/lib/action-state";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") throw new Error("Not authorized");
  return { supabase, userId: user.id };
}

const updateSchema = z.object({
  status: z.enum(["trial", "active", "past_due", "cancelled"]),
  monthly_amount_pkr: z.coerce.number().min(0, "Must be zero or more."),
  notes: z.string().optional(),
});

export async function updateSubscription(
  companyId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, userId } = await requireAdmin();
  const parsed = updateSchema.safeParse({
    status: formData.get("status"),
    monthly_amount_pkr: formData.get("monthly_amount_pkr"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const { data: before } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("company_id", companyId)
    .single();
  if (!before) return { error: "No subscription found for this company." };

  const { error } = await supabase
    .from("subscriptions")
    .update({ ...parsed.data, notes: parsed.data.notes ?? null })
    .eq("company_id", companyId);
  if (error) return { error: error.message };

  await logAudit(supabase, {
    actorUserId: userId,
    action: "subscription_updated",
    entity: "subscriptions",
    entityId: before.id,
    before,
    after: parsed.data,
  });

  revalidatePath("/admin/billing");
  return { success: true, message: "Subscription updated." };
}

export async function markInvoiced(companyId: string) {
  const { supabase, userId } = await requireAdmin();

  const { data: current } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("company_id", companyId)
    .single();
  if (!current) throw new Error("No subscription found for this company.");

  const invoicedAt = new Date().toISOString();
  const { error } = await supabase
    .from("subscriptions")
    .update({ last_invoiced_at: invoicedAt })
    .eq("company_id", companyId);
  if (error) throw error;

  await logAudit(supabase, {
    actorUserId: userId,
    action: "subscription_invoiced",
    entity: "subscriptions",
    entityId: current.id,
    after: { last_invoiced_at: invoicedAt },
  });

  revalidatePath("/admin/billing");
}

export async function markPaid(companyId: string) {
  const { supabase, userId } = await requireAdmin();

  const { data: current } = await supabase
    .from("subscriptions")
    .select("id, status")
    .eq("company_id", companyId)
    .single();
  if (!current) throw new Error("No subscription found for this company.");

  // A payment clears a trial or a past-due balance; leave "cancelled"
  // alone — reactivating a cancelled subscription is a status change the
  // admin should make explicitly via the edit form, not a side effect of
  // recording a payment.
  const nextStatus =
    current.status === "trial" || current.status === "past_due" ? "active" : current.status;

  const paidAt = new Date().toISOString();
  const { error } = await supabase
    .from("subscriptions")
    .update({ last_paid_at: paidAt, status: nextStatus })
    .eq("company_id", companyId);
  if (error) throw error;

  await logAudit(supabase, {
    actorUserId: userId,
    action: "subscription_paid",
    entity: "subscriptions",
    entityId: current.id,
    after: { last_paid_at: paidAt, status: nextStatus },
  });

  revalidatePath("/admin/billing");
}
