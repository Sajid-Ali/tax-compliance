"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const ANNUAL_DISCOUNT_PCT = 20;

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    monthly: 0,
    featured: false,
    tagline: "One company, watched. Reminders by email and WhatsApp.",
    cta: "Use Starter",
    includes: "Includes",
    features: [
      "1 company",
      "Full SECP + FBR calendar",
      "Email and WhatsApp reminders",
      "2 users",
      "Filing history log",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 7500,
    featured: true,
    tagline: "Drafts, approvals and an audit trail for a growing company.",
    cta: "Start 14-day trial",
    includes: "Everything in Starter, plus",
    features: [
      "Up to 3 companies",
      "Pre-filled draft returns",
      "Approval workflow with audit trail",
      "Penalty exposure tracking",
      "Document vault with retention",
      "10 users",
      "Priority support",
    ],
  },
  {
    id: "firm",
    name: "Firm",
    monthly: 24000,
    featured: false,
    tagline: "For consultants filing on behalf of a book of clients.",
    cta: "Choose Firm",
    includes: "Everything in Pro, plus",
    features: [
      "Unlimited client companies",
      "Client portal with branded reminders",
      "Bulk filing dashboard",
      "Per-client billing export",
      "API and Excel import",
      "Unlimited users",
      "Named account manager",
    ],
  },
] as const;

const RS = (n: number) => "Rs " + n.toLocaleString("en-US");
const effAnnualMonthly = (monthly: number) =>
  Math.round((monthly * (1 - ANNUAL_DISCOUNT_PCT / 100)) / 100) * 100;

export function PricingToggle() {
  const [annual, setAnnual] = useState(true);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3.5">
        <div className="inline-flex rounded-full border border-border bg-surface-secondary p-1">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={cn(
              "cursor-pointer rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors",
              !annual ? "bg-surface text-foreground shadow-elevation-sm" : "text-muted-foreground"
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={cn(
              "cursor-pointer rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors",
              annual ? "bg-surface text-foreground shadow-elevation-sm" : "text-muted-foreground"
            )}
          >
            Annual
          </button>
        </div>
        <span className="text-sm text-muted-foreground">Save {ANNUAL_DISCOUNT_PCT}% annually</span>
      </div>

      <div className="mt-11 grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const m = annual ? effAnnualMonthly(plan.monthly) : plan.monthly;
          const isFree = plan.monthly === 0;
          return (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-2xl border border-border bg-surface px-7 pb-8 pt-8",
                plan.featured && "ring-1 ring-primary"
              )}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-[10.5px] font-semibold tracking-wide text-primary-foreground uppercase">
                  Most popular
                </div>
              )}
              <div className="text-[15px] font-semibold tracking-tight text-foreground">
                {plan.name}
              </div>
              <p className="mt-2 min-h-10 text-[13px] leading-relaxed text-muted-foreground text-pretty">
                {plan.tagline}
              </p>
              <div className="mt-6 flex flex-wrap items-baseline gap-2">
                <span className="whitespace-nowrap font-mono text-4xl font-semibold tracking-tight text-foreground">
                  {isFree ? "Rs 0" : RS(m)}
                </span>
                <span className="whitespace-nowrap text-[13px] text-muted-foreground">
                  {isFree ? "forever" : "/ month"}
                </span>
              </div>
              <div className="mt-1.5 min-h-4 font-mono text-[11.5px] text-muted-foreground">
                {!isFree && (annual ? `billed annually · ${RS(m * 12)}/yr` : "billed monthly")}
              </div>
              <div className="mt-6">
                <Link
                  href="/login"
                  className={buttonVariants({
                    variant: plan.featured ? "primary" : "outline",
                    className: "w-full",
                  })}
                >
                  {plan.cta}
                </Link>
              </div>
              <div className="mt-6 flex flex-col gap-2.5 border-t border-border-subtle pt-5">
                <div className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  {plan.includes}
                </div>
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2.5 text-[13px] leading-snug">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2.4} />
                    <span className="text-pretty">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        Prices exclude sales tax on services. Annual plans are invoiced once and can be paid by bank
        transfer.
      </p>
    </div>
  );
}
