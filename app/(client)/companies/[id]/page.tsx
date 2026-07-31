import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, ClipboardList, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type {
  AgmRecord,
  Company,
  CompanyDirector,
  FilingDeadline,
  FilingStatus,
} from "@/lib/types";
import { addDirector, setAgmRecord } from "../actions";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import { DirectorsTable } from "@/components/tables/directors-table";
import { AgmTable } from "@/components/tables/agm-table";
import { DirectorForm } from "@/components/forms/director-form";
import { AgmForm } from "@/components/forms/agm-form";

const TIMELINE_STATE: Record<FilingStatus, "done" | "current" | "upcoming" | "danger"> = {
  upcoming: "upcoming",
  reminder_sent: "upcoming",
  draft_ready: "current",
  in_review: "current",
  approved: "current",
  filed: "done",
  overdue: "danger",
};

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: company } = await supabase.from("companies").select("*").eq("id", id).single();
  if (!company) notFound();

  const [{ data: directors }, { data: agmRecords }, { data: deadlines }] = await Promise.all([
    supabase
      .from("company_directors")
      .select("*")
      .eq("company_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("agm_records")
      .select("*")
      .eq("company_id", id)
      .order("agm_date", { ascending: false }),
    supabase
      .from("filing_deadlines")
      .select("*, compliance_rules(label)")
      .eq("company_id", id)
      .order("due_date", { ascending: true }),
  ]);

  const typedCompany = company as Company;
  const typedDirectors = (directors ?? []) as CompanyDirector[];
  const typedAgm = (agmRecords ?? []) as AgmRecord[];
  const typedDeadlines = (deadlines ?? []) as Array<
    FilingDeadline & { compliance_rules: { label: string } | null }
  >;

  const boundAddDirector = addDirector.bind(null, id);
  const boundSetAgm = setAgmRecord.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/dashboard"
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {typedCompany.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            SECP #{typedCompany.secp_registration_no} · Incorporated{" "}
            {typedCompany.incorporation_date}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <SectionLabel icon={ClipboardList} label="Filing deadlines" />
        </CardHeader>
        <CardContent>
          {typedDeadlines.length === 0 ? (
            <p className="rounded-lg bg-warning-bg px-3 py-2 text-sm text-warning">
              No deadline yet — record an AGM date below to compute the Form A due date.
            </p>
          ) : (
            <Timeline>
              {typedDeadlines.map((d, i) => (
                <TimelineItem
                  key={d.id}
                  state={TIMELINE_STATE[d.status]}
                  isLast={i === typedDeadlines.length - 1}
                  meta={d.due_date}
                  title={d.compliance_rules?.label ?? d.rule_key}
                  subtitle={<StatusBadge status={d.status} className="mt-1" />}
                />
              ))}
            </Timeline>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-3">
          <SectionLabel icon={CalendarClock} label="AGM records" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <CardDescription>
            Form A/29 is due 30 days after the AGM. Record the AGM date (past or scheduled) to get
            an exact due date and reminder cascade.
          </CardDescription>
          <AgmTable companyId={id} records={typedAgm} />
          <div className="border-t border-border-subtle pt-4">
            <AgmForm action={boundSetAgm} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-3">
          <SectionLabel icon={UserRound} label="Directors" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <CardDescription>Needed to pre-fill your Form A draft.</CardDescription>
          <DirectorsTable companyId={id} directors={typedDirectors} />
          <div className="border-t border-border-subtle pt-4">
            <DirectorForm action={boundAddDirector} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
