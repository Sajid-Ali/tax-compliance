import { createClient } from "@/lib/supabase/server";
import type { ComplianceRule } from "@/lib/types";
import { createRule, updateRule } from "./actions";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
              <form action={updateRule.bind(null, rule.id)} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{rule.label}</p>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      name="active"
                      defaultChecked={rule.active}
                      className="accent-primary"
                    />
                    active
                  </label>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge>{rule.rule_key}</Badge>
                  <Badge>{rule.company_type}</Badge>
                  <Badge>
                    due {rule.offset_days}d after {rule.offset_from}
                  </Badge>
                </div>
                <Field label="Offset days" htmlFor={`offset_days_${rule.id}`}>
                  <Input
                    id={`offset_days_${rule.id}`}
                    type="number"
                    name="offset_days"
                    defaultValue={rule.offset_days}
                    className="w-32"
                  />
                </Field>
                <Field label="Penalty text (shown to clients)" htmlFor={`penalty_text_${rule.id}`}>
                  <Textarea
                    id={`penalty_text_${rule.id}`}
                    name="penalty_text"
                    defaultValue={rule.penalty_text ?? ""}
                    rows={2}
                  />
                </Field>
                <Button type="submit" variant="outline" size="sm" className="self-start">
                  Save
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold tracking-tight text-foreground">Add a rule</h2>
        <Card className="max-w-md">
          <CardContent className="pt-5">
            <form action={createRule} className="flex flex-col gap-4">
              <Field
                label="Rule key (unique)"
                htmlFor="rule_key"
                hint="e.g. fbr_income_tax_deadline"
              >
                <Input id="rule_key" name="rule_key" required />
              </Field>
              <Field label="Company type" htmlFor="company_type">
                <Input
                  id="company_type"
                  name="company_type"
                  defaultValue="private_limited"
                  required
                />
              </Field>
              <Field label="Label" htmlFor="label">
                <Input id="label" name="label" required />
              </Field>
              <Field label="Offset from" htmlFor="offset_from">
                <Select id="offset_from" name="offset_from" defaultValue="agm_date">
                  <option value="agm_date">AGM date</option>
                  <option value="incorporation_date">Incorporation date</option>
                  <option value="fiscal_year_end">Fiscal year end</option>
                </Select>
              </Field>
              <Field label="Offset days" htmlFor="offset_days">
                <Input id="offset_days" type="number" name="offset_days" required />
              </Field>
              <Field label="Penalty text" htmlFor="penalty_text">
                <Textarea id="penalty_text" name="penalty_text" rows={2} />
              </Field>
              <Button type="submit" className="self-start">
                Add rule
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
