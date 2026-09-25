import { Clock3, CheckCircle2, FileWarning } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Company, Filing, FilingDeadline } from "@/lib/types";
import { effectiveStatus } from "@/lib/rules-engine";
import { computeReviewQueueStats } from "@/lib/review-queue-stats";
import { PageHeader } from "@/components/ui/page-header";
import { ReviewQueueTable } from "@/components/tables/review-queue-table";

type Row = FilingDeadline & {
  companies: Pick<Company, "name" | "secp_registration_no">;
  filings: Filing | null;
};

function KpiTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-surface p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-secondary text-muted-foreground">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default async function ReviewQueuePage() {
  const supabase = await createClient();

  // Queue view: only what's actionable right now.
  const { data } = await supabase
    .from("filing_deadlines")
    .select("*, companies(name, secp_registration_no), filings(*)")
    .eq("status", "in_review")
    .order("due_date", { ascending: true });
  const rows = (data ?? []) as Row[];

  // Stats view: broader window so "approved today" / "changes requested"
  // rows (which have already left in_review) are counted too.
  const { data: statsData } = await supabase
    .from("filing_deadlines")
    .select("status, due_date, filings(approved_at, reviewer_notes)")
    .in("status", ["in_review", "draft_ready", "approved"]);
  // `as unknown as` — postgrest-js can't infer the filings embed is a single
  // nullable object (not an array) without a wired Database generic; the
  // schema's filings.filing_deadline_id UNIQUE constraint is what actually
  // guarantees the single-object shape at runtime (see supabase/migrations/
  // 0001_init.sql).
  const statsRows = (
    (statsData ?? []) as unknown as Array<{
      status: FilingDeadline["status"];
      due_date: string;
      filings: Pick<Filing, "approved_at" | "reviewer_notes"> | null;
    }>
  ).map((r) => ({
    // effectiveStatus, not the raw column — a draft_ready/approved row whose
    // due_date has already passed reads as overdue everywhere else in the
    // app (dashboard-summary, filing-queue-table); the KPI tiles must agree,
    // per this plan's own Review Focus item on effectiveStatus consistency.
    status: effectiveStatus(r.status, r.due_date),
    approved_at: r.filings?.approved_at ?? null,
    reviewer_notes: r.filings?.reviewer_notes ?? null,
  }));
  const stats = { ...computeReviewQueueStats(statsRows), pendingCount: rows.length };

  const rowsWithUrls = await Promise.all(
    rows.map(async (row) => {
      const draftPath = row.filings?.draft_document_url;
      if (!draftPath) return { row, url: null };
      const { data: signed } = await supabase.storage
        .from("filings")
        .createSignedUrl(draftPath, 600);
      return { row, url: signed?.signedUrl ?? null };
    })
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pending your review"
        description="Approve or send back drafts before they're filed."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiTile icon={Clock3} label="Pending review" value={stats.pendingCount} />
        <KpiTile icon={CheckCircle2} label="Approved today" value={stats.approvedTodayCount} />
        <KpiTile icon={FileWarning} label="Changes requested" value={stats.changesRequestedCount} />
      </div>
      <ReviewQueueTable rowsWithUrls={rowsWithUrls} />
    </div>
  );
}
