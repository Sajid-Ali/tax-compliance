"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

const FAQS = [
  {
    q: "Do you file on our behalf?",
    a: "No. We prepare the draft, track the deadline and keep the approval trail. Submission stays with your authorised signatory or your consultant, who files through IRIS or the SECP eServices portal.",
  },
  {
    q: "What happens when the trial ends?",
    a: "Nothing is charged automatically — there's no card on file to begin with. If you don't move to a paid plan, the account drops to Starter and keeps your history and documents.",
  },
  {
    q: "Can we move between plans?",
    a: "Yes. Sign in and pick a new plan from the billing page, or email sales — plan changes and invoicing are handled by our team while billing is fully manual.",
  },
  {
    q: "Where is our data held?",
    a: "Documents and filing records are encrypted at rest. You can export the full vault as a dated ZIP at any time, and deletion requests are completed within seven days.",
  },
  {
    q: "Does the Firm plan support sub-accounts for clients?",
    a: "Each client company gets its own portal with your firm's branding. Clients see only their own obligations, and approvals from them are recorded against the filing.",
  },
  {
    q: "How do we pay from a company account?",
    a: "By bank transfer against an invoice raised by our team — email sales@compliancereminders.pk with your NTN and we'll set it up.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="border-t border-border">
      {FAQS.map((faq, i) => {
        const open = openIndex === i;
        return (
          <div key={faq.q} className="border-b border-border">
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
              className="flex w-full cursor-pointer items-center justify-between gap-6 py-5 text-left text-[15px] font-medium tracking-tight text-foreground"
            >
              <span>{faq.q}</span>
              <span
                className={cn(
                  "shrink-0 font-mono text-lg text-muted-foreground transition-transform duration-150",
                  open && "rotate-45"
                )}
                aria-hidden
              >
                +
              </span>
            </button>
            {open && (
              <p className="max-w-2xl pb-6 pr-10 text-sm leading-relaxed text-muted-foreground text-pretty">
                {faq.a}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
