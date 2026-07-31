import { Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Company, FilingDeadline } from "@/lib/types";
import { generateDraft, markFiled, sendToReviewer } from "./actions";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

type Row = FilingDeadline & { companies: Pick<Company, "name" | "secp_registration_no"> };

export default async function FilingQueuePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("filing_deadlines")
    .select("*, companies(name, secp_registration_no)")
    .neq("status", "filed")
    .order("due_date", { ascending: true });

  const rows = (data ?? []) as Row[];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Filing queue"
        description="Generate drafts, route them for review, and mark filings complete."
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="All caught up"
          description="Nothing pending — everything is filed or upcoming."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-elevation-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-foreground">{row.companies.name}</p>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>SECP #{row.companies.secp_registration_no}</span>
                  <span>·</span>
                  <span>Due {row.due_date}</span>
                  <StatusBadge status={row.status} />
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {(row.status === "upcoming" ||
                  row.status === "reminder_sent" ||
                  row.status === "overdue") && (
                  <form action={generateDraft.bind(null, row.id)}>
                    <Button type="submit" variant="outline" size="sm">
                      Generate draft
                    </Button>
                  </form>
                )}
                {row.status === "draft_ready" && (
                  <form action={sendToReviewer.bind(null, row.id)}>
                    <Button type="submit" variant="outline" size="sm">
                      Send to CA reviewer
                    </Button>
                  </form>
                )}
                {row.status === "in_review" && (
                  <span className="rounded-md bg-warning-bg px-3 py-1.5 text-sm text-warning">
                    Waiting on CA review
                  </span>
                )}
                {row.status === "approved" && (
                  <form
                    action={markFiled.bind(null, row.id)}
                    className="flex flex-col items-end gap-2 sm:flex-row sm:items-center"
                  >
                    <input
                      type="file"
                      name="receipt"
                      accept="application/pdf,image/*"
                      className="max-w-[180px] text-xs text-muted-foreground file:mr-2 file:rounded-md file:border-0 file:bg-surface-secondary file:px-2 file:py-1 file:text-xs file:font-medium file:text-foreground"
                    />
                    <Button type="submit" size="sm">
                      Mark filed
                    </Button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
