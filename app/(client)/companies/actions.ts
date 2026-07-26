"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { syncDeadlinesForCompany } from "@/lib/deadlines";
import { logAudit } from "@/lib/audit";

const companySchema = z.object({
  name: z.string().min(2),
  secp_registration_no: z.string().min(1),
  incorporation_date: z.string().min(1),
  paid_up_capital: z.coerce.number().min(0),
});

export async function createCompany(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const parsed = companySchema.parse({
    name: formData.get("name"),
    secp_registration_no: formData.get("secp_registration_no"),
    incorporation_date: formData.get("incorporation_date"),
    paid_up_capital: formData.get("paid_up_capital") || 0,
  });

  const { data, error } = await supabase
    .from("companies")
    .insert({ ...parsed, owner_user_id: user.id, company_type: "private_limited" })
    .select()
    .single();
  if (error) throw error;

  await logAudit(supabase, {
    actorUserId: user.id,
    action: "company_created",
    entity: "companies",
    entityId: data.id,
    after: parsed,
  });

  redirect(`/companies/${data.id}`);
}

const directorSchema = z.object({
  name: z.string().min(2),
  cnic: z.string().min(5),
  designation: z.string().min(2),
});

export async function addDirector(companyId: string, formData: FormData) {
  const supabase = await createClient();
  const parsed = directorSchema.parse({
    name: formData.get("name"),
    cnic: formData.get("cnic"),
    designation: formData.get("designation") || "Director",
  });

  const { error } = await supabase
    .from("company_directors")
    .insert({ company_id: companyId, ...parsed });
  if (error) throw error;

  revalidatePath(`/companies/${companyId}`);
}

const agmSchema = z.object({
  agm_date: z.string().min(1),
  financial_year_end: z.string().optional(),
});

export async function setAgmRecord(companyId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const parsed = agmSchema.parse({
    agm_date: formData.get("agm_date"),
    financial_year_end: formData.get("financial_year_end") || undefined,
  });

  const { error } = await supabase.from("agm_records").insert({
    company_id: companyId,
    agm_date: parsed.agm_date,
    financial_year_end: parsed.financial_year_end ?? null,
  });
  if (error) throw error;

  const { created, updated } = await syncDeadlinesForCompany(supabase, companyId);

  await logAudit(supabase, {
    actorUserId: user?.id ?? null,
    action: "agm_recorded_deadlines_synced",
    entity: "companies",
    entityId: companyId,
    after: { ...parsed, deadlines_created: created, deadlines_updated: updated },
  });

  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/dashboard");
}
