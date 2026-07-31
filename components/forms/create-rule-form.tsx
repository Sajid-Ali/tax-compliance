"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { createRule } from "@/app/admin/rules/actions";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function CreateRuleForm() {
  const [state, formAction] = useActionState(createRule, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      if (state.message) toast.success(state.message);
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <Field
        label="Rule key (unique)"
        htmlFor="rule_key"
        hint="e.g. fbr_income_tax_deadline"
        error={state?.fieldErrors?.rule_key}
      >
        <Input
          id="rule_key"
          name="rule_key"
          required
          aria-invalid={!!state?.fieldErrors?.rule_key}
        />
      </Field>
      <Field label="Company type" htmlFor="company_type" error={state?.fieldErrors?.company_type}>
        <Input id="company_type" name="company_type" defaultValue="private_limited" required />
      </Field>
      <Field label="Label" htmlFor="label" error={state?.fieldErrors?.label}>
        <Input id="label" name="label" required aria-invalid={!!state?.fieldErrors?.label} />
      </Field>
      <Field label="Offset from" htmlFor="offset_from">
        <Select id="offset_from" name="offset_from" defaultValue="agm_date">
          <option value="agm_date">AGM date</option>
          <option value="incorporation_date">Incorporation date</option>
          <option value="fiscal_year_end">Fiscal year end</option>
        </Select>
      </Field>
      <Field label="Offset days" htmlFor="offset_days" error={state?.fieldErrors?.offset_days}>
        <Input id="offset_days" type="number" name="offset_days" required />
      </Field>
      <Field label="Penalty text" htmlFor="penalty_text">
        <Textarea id="penalty_text" name="penalty_text" rows={2} />
      </Field>
      <SubmitButton className="self-start" pendingLabel="Adding…">
        Add rule
      </SubmitButton>
    </form>
  );
}
