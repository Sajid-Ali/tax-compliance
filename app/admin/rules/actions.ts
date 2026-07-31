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

const ruleSchema = z.object({
  rule_key: z.string().min(2, "Rule key is required."),
  company_type: z.string().min(2, "Company type is required."),
  label: z.string().min(2, "Label is required."),
  offset_from: z.enum(["agm_date", "incorporation_date", "fiscal_year_end"]),
  offset_days: z.coerce.number().int("Must be a whole number."),
  penalty_text: z.string().optional(),
});

export async function createRule(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, userId } = await requireAdmin();
  const parsed = ruleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const { data, error } = await supabase
    .from("compliance_rules")
    .insert(parsed.data)
    .select()
    .single();
  if (error) return { error: error.message };

  await logAudit(supabase, {
    actorUserId: userId,
    action: "rule_created",
    entity: "compliance_rules",
    entityId: data.id,
    after: parsed.data,
  });

  revalidatePath("/admin/rules");
  return { success: true, message: `Rule "${parsed.data.label}" added.` };
}

const updateSchema = z.object({
  offset_days: z.coerce.number().int("Must be a whole number."),
  penalty_text: z.string().optional(),
  active: z.coerce.boolean(),
});

export async function updateRule(
  ruleId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, userId } = await requireAdmin();
  const parsed = updateSchema.safeParse({
    offset_days: formData.get("offset_days"),
    penalty_text: formData.get("penalty_text") ?? undefined,
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const { data: before } = await supabase
    .from("compliance_rules")
    .select("*")
    .eq("id", ruleId)
    .single();

  const { error } = await supabase.from("compliance_rules").update(parsed.data).eq("id", ruleId);
  if (error) return { error: error.message };

  await logAudit(supabase, {
    actorUserId: userId,
    action: "rule_updated",
    entity: "compliance_rules",
    entityId: ruleId,
    before,
    after: parsed.data,
  });

  revalidatePath("/admin/rules");
  return { success: true, message: "Rule updated." };
}
