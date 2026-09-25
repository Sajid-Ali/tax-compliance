import { createClient } from "@/lib/supabase/server";
import type { Company, Filing, FilingDeadline } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { FilingQueueTable } from "@/components/tables/filing-queue-table";

type Row = FilingDeadline & {
  companies: Pick<Company, "name" | "secp_registration_no">;
  filings: Filing | null;
};

interface AuditRow {
  id: string;
  action: string;
  created_at: string;
  actor_user_id: string | null;
}

export default async function FilingQueuePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("filing_deadlines")
    .select("*, companies(name, secp_registration_no), filings(*)")
    .neq("status", "filed")
    .order("due_date", { ascending: true });

  const rows = (data ?? []) as Row[];

  const rowsWithUrls = await Promise.all(
    rows.map(async (row) => {
      const draftPath = row.filings?.draft_document_url;
      if (!draftPath) return { row, draftUrl: null };
      const { data: signed } = await supabase.storage
        .from("filings")
        .createSignedUrl(draftPath, 600);
      return { row, draftUrl: signed?.signedUrl ?? null };
    })
  );

  const { data: auditData } = await supabase
    .from("audit_log")
    .select("id, action, created_at, actor_user_id")
    .eq("entity", "filing_deadlines")
    .order("created_at", { ascending: false })
    .limit(8);
  const auditRows = (auditData ?? []) as AuditRow[];

  const actorIds = [
    ...new Set(auditRows.map((r) => r.actor_user_id).filter((id): id is string => id !== null)),
  ];
  const { data: profilesData } = actorIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", actorIds)
    : { data: [] };
  const profileNameById = new Map((profilesData ?? []).map((p) => [p.id, p.full_name]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Filing queue"
        description="Generate drafts, route them for review, and mark filings complete."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FilingQueueTable rowsWithUrls={rowsWithUrls} />
        </div>
        <div className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Recent activity</h2>
          {auditRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No filing activity recorded yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border-subtle">
              {auditRows.map((entry) => (
                <li key={entry.id} className="flex flex-col gap-0.5 py-2 text-sm">
                  <span className="text-foreground">{entry.action.replaceAll("_", " ")}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {(entry.actor_user_id ? profileNameById.get(entry.actor_user_id) : null) ??
                      "System"}{" "}
                    · {new Date(entry.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
