import { formatISO } from "date-fns";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncDeadlinesForCompany } from "@/lib/deadlines";
import { isOverdue, reminderDatesFor } from "@/lib/rules-engine";
import { REMINDER_OFFSETS_DAYS } from "@/lib/types";
import type { Company, FilingDeadline } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Daily job (see vercel.json): recompute every company's deadlines from its
 * latest AGM record, send any reminder due today, and flag anything past
 * its due date with no filing as overdue.
 *
 * Vercel Cron automatically sends `Authorization: Bearer $CRON_SECRET` when
 * that env var is set — this guards against anyone else hitting the route.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = formatISO(new Date(), { representation: "date" });

  // 1. Recompute deadlines for every company — covers AGM data edited since
  //    the last run and self-heals anything the client-side sync missed.
  const { data: companies, error: companiesErr } = await supabase.from("companies").select("id");
  if (companiesErr) {
    return NextResponse.json({ error: companiesErr.message }, { status: 500 });
  }

  let deadlinesCreated = 0;
  let deadlinesUpdated = 0;
  for (const c of companies ?? []) {
    const { created, updated } = await syncDeadlinesForCompany(supabase, c.id);
    deadlinesCreated += created;
    deadlinesUpdated += updated;
  }

  // 2. Evaluate every non-filed deadline for a due reminder or overdue flag.
  const { data: deadlines, error: deadlinesErr } = await supabase
    .from("filing_deadlines")
    .select("*, companies(id, name, owner_user_id)")
    .neq("status", "filed");
  if (deadlinesErr) {
    return NextResponse.json({ error: deadlinesErr.message }, { status: 500 });
  }

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  let remindersSent = 0;
  let overdueFlagged = 0;

  type DeadlineWithCompany = FilingDeadline & {
    companies: Pick<Company, "id" | "name" | "owner_user_id">;
  };

  for (const row of (deadlines ?? []) as DeadlineWithCompany[]) {
    const scheduledDates = reminderDatesFor(row.due_date, REMINDER_OFFSETS_DAYS);

    if (scheduledDates.includes(today)) {
      const { data: alreadySentToday } = await supabase
        .from("reminders_log")
        .select("id")
        .eq("filing_deadline_id", row.id)
        .gte("sent_at", `${today}T00:00:00Z`)
        .limit(1)
        .maybeSingle();

      if (!alreadySentToday) {
        const { data: ownerUser } = await supabase.auth.admin.getUserById(
          row.companies.owner_user_id
        );
        const email = ownerUser?.user?.email;

        if (resend && email) {
          await resend.emails.send({
            from: process.env.REMINDERS_FROM_EMAIL ?? "reminders@example.com",
            to: email,
            subject: `${row.companies.name}: SECP Form A due ${row.due_date}`,
            text: `Reminder: ${row.companies.name}'s SECP Form A/29 annual return is due on ${row.due_date}. Log in to confirm director details so we can prepare the draft: ${process.env.NEXT_PUBLIC_APP_URL ?? ""}/companies/${row.company_id}`,
          });
        }

        await supabase.from("reminders_log").insert({
          filing_deadline_id: row.id,
          channel: "email",
          recipient: email ?? null,
        });
        remindersSent++;

        if (row.status === "upcoming") {
          await supabase
            .from("filing_deadlines")
            .update({ status: "reminder_sent" })
            .eq("id", row.id);
        }
      }
    }

    if (isOverdue(row.due_date) && row.status !== "overdue") {
      await supabase.from("filing_deadlines").update({ status: "overdue" }).eq("id", row.id);
      overdueFlagged++;
    }
  }

  return NextResponse.json({
    ok: true,
    deadlinesCreated,
    deadlinesUpdated,
    remindersSent,
    overdueFlagged,
  });
}
