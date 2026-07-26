"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

async function requireReviewer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "reviewer" && profile?.role !== "admin") throw new Error("Not authorized");
  return { supabase, userId: user.id };
}

export async function approveFiling(deadlineId: string) {
  const { supabase, userId } = await requireReviewer();

  const { error: filingErr } = await supabase.from("filings").upsert(
    {
      filing_deadline_id: deadlineId,
      reviewer_id: userId,
      approved_at: new Date().toISOString(),
      reviewer_notes: null,
    },
    { onConflict: "filing_deadline_id" }
  );
  if (filingErr) throw filingErr;

  const { error: statusErr } = await supabase
    .from("filing_deadlines")
    .update({ status: "approved" })
    .eq("id", deadlineId);
  if (statusErr) throw statusErr;

  await logAudit(supabase, {
    actorUserId: userId,
    action: "filing_approved",
    entity: "filing_deadlines",
    entityId: deadlineId,
  });

  revalidatePath("/review-queue");
  revalidatePath("/admin/filing-queue");
}

export async function requestChanges(deadlineId: string, formData: FormData) {
  const { supabase, userId } = await requireReviewer();
  const notes = String(formData.get("notes") ?? "").trim();

  const { error: filingErr } = await supabase.from("filings").upsert(
    { filing_deadline_id: deadlineId, reviewer_id: userId, reviewer_notes: notes || null },
    { onConflict: "filing_deadline_id" }
  );
  if (filingErr) throw filingErr;

  // Back to draft_ready so the admin sees it needs a regenerated/corrected draft.
  const { error: statusErr } = await supabase
    .from("filing_deadlines")
    .update({ status: "draft_ready" })
    .eq("id", deadlineId);
  if (statusErr) throw statusErr;

  await logAudit(supabase, {
    actorUserId: userId,
    action: "filing_changes_requested",
    entity: "filing_deadlines",
    entityId: deadlineId,
    after: { notes },
  });

  revalidatePath("/review-queue");
  revalidatePath("/admin/filing-queue");
}
