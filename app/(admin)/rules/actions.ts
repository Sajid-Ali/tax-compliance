"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Not authorized");
  return { supabase, userId: user.id };
}

const ruleSchema = z.object({
  rule_key: z.string().min(2),
  company_type: z.string().min(2),
  label: z.string().min(2),
  offset_from: z.enum(["agm_date", "incorporation_date", "fiscal_year_end"]),
  offset_days: z.coerce.number().int(),
  penalty_text: z.string().optional(),
});

export async function createRule(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const parsed = ruleSchema.parse(Object.fromEntries(formData));

  const { data, error } = await supabase.from("compliance_rules").insert(parsed).select().single();
  if (error) throw error;

  await logAudit(supabase, {
    actorUserId: userId,
    action: "rule_created",
    entity: "compliance_rules",
    entityId: data.id,
    after: parsed,
  });

  revalidatePath("/admin/rules");
}

const updateSchema = z.object({
  offset_days: z.coerce.number().int(),
  penalty_text: z.string().optional(),
  active: z.coerce.boolean(),
});

export async function updateRule(ruleId: string, formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const parsed = updateSchema.parse({
    offset_days: formData.get("offset_days"),
    penalty_text: formData.get("penalty_text") ?? undefined,
    active: formData.get("active") === "on",
  });

  const { data: before } = await supabase
    .from("compliance_rules")
    .select("*")
    .eq("id", ruleId)
    .single();

  const { error } = await supabase.from("compliance_rules").update(parsed).eq("id", ruleId);
  if (error) throw error;

  await logAudit(supabase, {
    actorUserId: userId,
    action: "rule_updated",
    entity: "compliance_rules",
    entityId: ruleId,
    before,
    after: parsed,
  });

  revalidatePath("/admin/rules");
}
