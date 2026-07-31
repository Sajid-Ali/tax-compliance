"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/lib/action-state";
import { Field, Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function AgmForm({
  action,
  defaultValues,
  submitLabel = "Save AGM date",
  onSuccess,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: { agm_date: string; financial_year_end?: string | null };
  submitLabel?: string;
  onSuccess?: () => void;
}) {
  const [state, formAction] = useActionState(action, null);

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      if (state.message) toast.success(state.message);
      onSuccess?.();
    } else if (state.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-4">
      <Field label="AGM date" htmlFor="agm_date" error={state?.fieldErrors?.agm_date}>
        <Input
          id="agm_date"
          type="date"
          name="agm_date"
          required
          defaultValue={defaultValues?.agm_date}
          aria-invalid={!!state?.fieldErrors?.agm_date}
        />
      </Field>
      <Field label="Financial year end (optional)" htmlFor="financial_year_end">
        <Input
          id="financial_year_end"
          type="date"
          name="financial_year_end"
          defaultValue={defaultValues?.financial_year_end ?? undefined}
        />
      </Field>
      <SubmitButton size="sm" className="self-start">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
