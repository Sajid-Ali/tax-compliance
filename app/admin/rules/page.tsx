import { createClient } from "@/lib/supabase/server";
import type { ComplianceRule } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EditRuleForm } from "@/components/forms/edit-rule-form";
import { CreateRuleForm } from "@/components/forms/create-rule-form";

export default async function RulesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("compliance_rules").select("*").order("company_type");
  const rules = (data ?? []) as ComplianceRule[];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Compliance rules"
        description={
          <>
            These drive the deadline calendar — edit here when a rule changes, no deploy needed. See{" "}
            <code className="rounded bg-surface-secondary px-1 py-0.5 text-xs">
              lib/rules-engine.ts
            </code>{" "}
            for how offset_from/offset_days are applied.
          </>
        }
      />

      <div className="flex flex-col gap-3">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardContent className="pt-5">
              <EditRuleForm rule={rule} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold tracking-tight text-foreground">Add a rule</h2>
        <Card className="max-w-md">
          <CardContent className="pt-5">
            <CreateRuleForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
