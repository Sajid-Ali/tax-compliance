"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { generateFormADraft } from "@/lib/documents/form-a-template";
import type { Company, CompanyDirector, FilingDeadline } from "@/lib/types";

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

export async function generateDraft(deadlineId: string) {
  const { supabase, userId } = await requireAdmin();

  const { data: deadline, error: deadlineErr } = await supabase
    .from("filing_deadlines")
    .select("*")
    .eq("id", deadlineId)
    .single();
  if (deadlineErr || !deadline) throw deadlineErr ?? new Error("Deadline not found");
  const typedDeadline = deadline as FilingDeadline;

  const [{ data: company }, { data: directors }] = await Promise.all([
    supabase.from("companies").select("*").eq("id", typedDeadline.company_id).single(),
    supabase.from("company_directors").select("*").eq("company_id", typedDeadline.company_id),
  ]);
  if (!company) throw new Error("Company not found");

  const pdfBytes = await generateFormADraft({
    company: company as Company,
    directors: (directors ?? []) as CompanyDirector[],
    deadline: typedDeadline,
  });

  const path = `${typedDeadline.company_id}/${typedDeadline.id}/form-a-draft.pdf`;
  const { error: uploadErr } = await supabase.storage
    .from("filings")
    .upload(path, Buffer.from(pdfBytes), { contentType: "application/pdf", upsert: true });
  if (uploadErr) throw uploadErr;

  const { error: upsertErr } = await supabase
    .from("filings")
    .upsert(
      { filing_deadline_id: typedDeadline.id, draft_document_url: path },
      { onConflict: "filing_deadline_id" }
    );
  if (upsertErr) throw upsertErr;

  const { error: statusErr } = await supabase
    .from("filing_deadlines")
    .update({ status: "draft_ready" })
    .eq("id", typedDeadline.id);
  if (statusErr) throw statusErr;

  await logAudit(supabase, {
    actorUserId: userId,
    action: "draft_generated",
    entity: "filing_deadlines",
    entityId: typedDeadline.id,
    after: { draft_document_url: path },
  });

  revalidatePath("/admin/filing-queue");
}

export async function sendToReviewer(deadlineId: string) {
  const { supabase, userId } = await requireAdmin();

  const { error } = await supabase
    .from("filing_deadlines")
    .update({ status: "in_review" })
    .eq("id", deadlineId);
  if (error) throw error;

  await logAudit(supabase, {
    actorUserId: userId,
    action: "sent_to_reviewer",
    entity: "filing_deadlines",
    entityId: deadlineId,
  });

  revalidatePath("/admin/filing-queue");
  revalidatePath("/review-queue");
}

export async function markFiled(deadlineId: string, formData: FormData) {
  const { supabase, userId } = await requireAdmin();

  const { data: filing } = await supabase
    .from("filings")
    .select("*")
    .eq("filing_deadline_id", deadlineId)
    .single();

  let receiptPath: string | null = filing?.confirmation_receipt_url ?? null;
  const receipt = formData.get("receipt");
  if (receipt instanceof File && receipt.size > 0) {
    const bytes = Buffer.from(await receipt.arrayBuffer());
    receiptPath = `${filing?.filing_deadline_id ?? deadlineId}/confirmation-receipt-${Date.now()}.pdf`;
    const { error: uploadErr } = await supabase.storage
      .from("filings")
      .upload(receiptPath, bytes, { contentType: receipt.type || "application/pdf", upsert: true });
    if (uploadErr) throw uploadErr;
  }

  const { error: filingErr } = await supabase.from("filings").upsert(
    {
      filing_deadline_id: deadlineId,
      filed_at: new Date().toISOString(),
      filed_by: userId,
      confirmation_receipt_url: receiptPath,
    },
    { onConflict: "filing_deadline_id" }
  );
  if (filingErr) throw filingErr;

  const { error: statusErr } = await supabase
    .from("filing_deadlines")
    .update({ status: "filed" })
    .eq("id", deadlineId);
  if (statusErr) throw statusErr;

  await logAudit(supabase, {
    actorUserId: userId,
    action: "marked_filed",
    entity: "filing_deadlines",
    entityId: deadlineId,
    after: { confirmation_receipt_url: receiptPath },
  });

  revalidatePath("/admin/filing-queue");
  revalidatePath("/dashboard");
}
