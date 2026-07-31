"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import type { ComplianceRule } from "@/lib/types";
import { updateRule } from "@/app/admin/rules/actions";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";

export function EditRuleForm({ rule }: { rule: ComplianceRule }) {
  const [state, formAction] = useActionState(updateRule.bind(null, rule.id), null);

  useEffect(() => {
    if (!state) return;
    if (state.success && state.message) toast.success(state.message);
    else if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
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
      <Field
        label="Offset days"
        htmlFor={`offset_days_${rule.id}`}
        error={state?.fieldErrors?.offset_days}
      >
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
      <SubmitButton variant="outline" size="sm" className="self-start" pendingLabel="Saving…">
        Save
      </SubmitButton>
    </form>
  );
}
