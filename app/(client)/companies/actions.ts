"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { syncDeadlinesForCompany } from "@/lib/deadlines";
import { logAudit } from "@/lib/audit";
import { type ActionState, zodFieldErrors } from "@/lib/action-state";

const companySchema = z.object({
  name: z.string().min(2, "Enter the company's registered name."),
  secp_registration_no: z.string().min(1, "SECP registration number is required."),
  incorporation_date: z.string().min(1, "Incorporation date is required."),
  paid_up_capital: z.coerce.number().min(0, "Must be zero or more."),
});

export async function createCompany(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You've been signed out — refresh and sign in again." };

  const parsed = companySchema.safeParse({
    name: formData.get("name"),
    secp_registration_no: formData.get("secp_registration_no"),
    incorporation_date: formData.get("incorporation_date"),
    paid_up_capital: formData.get("paid_up_capital") || 0,
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const { data, error } = await supabase
    .from("companies")
    .insert({ ...parsed.data, owner_user_id: user.id, company_type: "private_limited" })
    .select()
    .single();
  if (error) return { error: error.message };

  await logAudit(supabase, {
    actorUserId: user.id,
    action: "company_created",
    entity: "companies",
    entityId: data.id,
    after: parsed.data,
  });

  redirect(`/companies/${data.id}`);
}

const directorSchema = z.object({
  name: z.string().min(2, "Enter the director's full name."),
  cnic: z.string().min(5, "Enter a valid CNIC."),
  designation: z.string().min(2, "Designation is required."),
});

export async function addDirector(
  companyId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const parsed = directorSchema.safeParse({
    name: formData.get("name"),
    cnic: formData.get("cnic"),
    designation: formData.get("designation") || "Director",
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const { error } = await supabase
    .from("company_directors")
    .insert({ company_id: companyId, ...parsed.data });
  if (error) return { error: error.message };

  revalidatePath(`/companies/${companyId}`);
  return { success: true, message: "Director added." };
}

export async function updateDirector(
  companyId: string,
  directorId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const parsed = directorSchema.safeParse({
    name: formData.get("name"),
    cnic: formData.get("cnic"),
    designation: formData.get("designation") || "Director",
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const { error } = await supabase
    .from("company_directors")
    .update(parsed.data)
    .eq("id", directorId)
    .eq("company_id", companyId);
  if (error) return { error: error.message };

  await logAudit(supabase, {
    actorUserId: user?.id ?? null,
    action: "director_updated",
    entity: "company_directors",
    entityId: directorId,
    after: parsed.data,
  });

  revalidatePath(`/companies/${companyId}`);
  return { success: true, message: "Director updated." };
}

export async function deleteDirector(companyId: string, directorId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("company_directors")
    .delete()
    .eq("id", directorId)
    .eq("company_id", companyId);
  if (error) throw error;

  await logAudit(supabase, {
    actorUserId: user?.id ?? null,
    action: "director_removed",
    entity: "company_directors",
    entityId: directorId,
  });

  revalidatePath(`/companies/${companyId}`);
}

const agmSchema = z.object({
  agm_date: z.string().min(1, "AGM date is required."),
  financial_year_end: z.string().optional(),
});

export async function setAgmRecord(
  companyId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const parsed = agmSchema.safeParse({
    agm_date: formData.get("agm_date"),
    financial_year_end: formData.get("financial_year_end") || undefined,
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const { error } = await supabase.from("agm_records").insert({
    company_id: companyId,
    agm_date: parsed.data.agm_date,
    financial_year_end: parsed.data.financial_year_end ?? null,
  });
  if (error) return { error: error.message };

  const { created, updated } = await syncDeadlinesForCompany(supabase, companyId);

  await logAudit(supabase, {
    actorUserId: user?.id ?? null,
    action: "agm_recorded_deadlines_synced",
    entity: "companies",
    entityId: companyId,
    after: { ...parsed.data, deadlines_created: created, deadlines_updated: updated },
  });

  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/dashboard");
  return { success: true, message: "AGM date saved — deadlines recalculated." };
}

export async function updateAgmRecord(
  companyId: string,
  agmId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const parsed = agmSchema.safeParse({
    agm_date: formData.get("agm_date"),
    financial_year_end: formData.get("financial_year_end") || undefined,
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const { error } = await supabase
    .from("agm_records")
    .update({
      agm_date: parsed.data.agm_date,
      financial_year_end: parsed.data.financial_year_end ?? null,
    })
    .eq("id", agmId)
    .eq("company_id", companyId);
  if (error) return { error: error.message };

  const { created, updated } = await syncDeadlinesForCompany(supabase, companyId);

  await logAudit(supabase, {
    actorUserId: user?.id ?? null,
    action: "agm_record_updated_deadlines_synced",
    entity: "agm_records",
    entityId: agmId,
    after: { ...parsed.data, deadlines_created: created, deadlines_updated: updated },
  });

  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/dashboard");
  return { success: true, message: "AGM record updated — deadlines recalculated." };
}

export async function deleteAgmRecord(companyId: string, agmId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("agm_records")
    .delete()
    .eq("id", agmId)
    .eq("company_id", companyId);
  if (error) throw error;

  const { created, updated } = await syncDeadlinesForCompany(supabase, companyId);

  await logAudit(supabase, {
    actorUserId: user?.id ?? null,
    action: "agm_record_removed_deadlines_synced",
    entity: "agm_records",
    entityId: agmId,
    after: { deadlines_created: created, deadlines_updated: updated },
  });

  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/dashboard");
}
