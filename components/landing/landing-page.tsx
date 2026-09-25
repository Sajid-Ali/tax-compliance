import Link from "next/link";
import { Layers, Monitor, Tags } from "lucide-react";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import { PricingToggle } from "@/components/landing/pricing-toggle";
import { FaqAccordion } from "@/components/landing/faq-accordion";

const REGULATORS = ["SECP", "FBR / IRIS", "PRA", "SRB", "EOBI", "PESSI"];

const HERO_ROWS = [
  { title: "Form A — Annual Return", due: "Due 30 Oct 2026", status: "draft_ready" },
  { title: "Sales Tax Return — Aug 2026", due: "Due 18 Sep 2026", status: "in_review" },
  { title: "Form 29 — Change of Directors", due: "Filed 04 Aug 2026", status: "filed" },
  { title: "Withholding Statement u/s 165", due: "Due 11 Sep 2026", status: "reminder_sent" },
] as const;

const FEATURES = [
  {
    n: "01",
    title: "A calendar built from your registrations",
    body: "Give us the CUIN, financial year end and which tax authorities you are registered with. Every obligation that follows from those is generated and dated, including the ones companies forget.",
    meta: "SECP · FBR · PRA · SRB · EOBI",
  },
  {
    n: "02",
    title: "Drafts prepared before the window opens",
    body: "Pro turns each obligation into a pre-filled draft from last period's figures and your uploaded ledgers, so the work waiting for you is a review rather than a start.",
    meta: "Reviewed, not retyped",
  },
  {
    n: "03",
    title: "Approvals that leave a trail",
    body: "Route a draft to the CFO, the director or the client. Every view, comment and sign-off is timestamped and kept with the filing for the retention period.",
    meta: "Exportable audit log",
  },
];

const SIDEBAR = [
  { name: "Acme Textiles (Pvt)", count: "4" },
  { name: "Lahore Foods Ltd.", count: "2" },
  { name: "Indus Logistics", count: "6" },
  { name: "Karachi Steel Works", count: "1" },
  { name: "Meezan Traders", count: "3" },
];

const STATS = [
  { label: "Due in 30 days", value: "9" },
  { label: "Drafts ready", value: "4" },
  { label: "Awaiting approval", value: "2" },
  { label: "Overdue", value: "1" },
];

const BOARD_ROWS = [
  { name: "Sales Tax Return", co: "Indus Logistics", due: "18 Sep", status: "overdue" },
  { name: "Form A — Annual Return", co: "Acme Textiles", due: "30 Oct", status: "draft_ready" },
  {
    name: "Withholding Statement u/s 165",
    co: "Lahore Foods",
    due: "11 Sep",
    status: "reminder_sent",
  },
  { name: "Income Tax Return", co: "Karachi Steel", due: "31 Dec", status: "upcoming" },
  {
    name: "Form 29 — Change of Officers",
    co: "Meezan Traders",
    due: "22 Sep",
    status: "reminder_sent",
  },
  { name: "PRA Monthly Return", co: "Indus Logistics", due: "15 Sep", status: "filed" },
] as const;

/**
 * Marketing landing page shown at "/" to signed-out visitors (see
 * app/page.tsx). All dashboard/company data on this page is illustrative
 * sample content, not real customer data — same treatment as the login
 * page's hero glow and the design system's own component previews.
 */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border-subtle bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-5 px-5 py-2.5 sm:px-8">
          <Logo />
          <nav className="hidden items-center gap-7 text-[13px] text-muted-foreground sm:flex">
            <a href="#features" className="hover:text-foreground">
              What you get
            </a>
            <a href="#dashboard" className="hover:text-foreground">
              Inside Pro
            </a>
            <a href="#pricing" className="hover:text-foreground">
              Plans
            </a>
            <a href="#faq" className="hover:text-foreground">
              Questions
            </a>
          </nav>
          <div className="flex items-center gap-2.5">
            <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Sign in
            </Link>
            <Link href="/login" className={buttonVariants({ variant: "primary", size: "sm" })}>
              Start free trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-[8%] top-[-14%] h-[480px] w-[480px] rounded-full bg-primary/20 blur-[130px]" />
          <div className="absolute right-[6%] top-[-4%] h-[380px] w-[380px] rounded-full bg-primary/15 blur-[110px]" />
        </div>
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-surface-secondary px-3.5 py-1.5 text-xs font-medium text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Pro is now open to all companies
            </div>
            <h1 className="mt-6 text-4xl leading-[1.05] font-semibold tracking-tighter text-balance text-foreground sm:text-6xl">
              Never miss another SECP or FBR deadline.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground text-pretty">
              Pro tracks every filing your company owes, prepares the draft before it is due, and
              routes it for approval. You see what is due, who is on it, and what a slip would cost.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/login" className={buttonVariants({ variant: "primary" })}>
                Start 14-day Pro trial
              </Link>
              <a href="#pricing" className={buttonVariants({ variant: "outline" })}>
                Compare plans
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              No card required. Cancel from the billing page in one click.
            </p>
          </div>

          <div className="relative">
            <div
              aria-hidden
              className="absolute -right-4 -top-4 h-56 w-56 rounded-full bg-primary/20 blur-[48px]"
            />
            <div className="relative overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
                <div>
                  <div className="text-[13px] font-semibold tracking-tight text-foreground">
                    Acme Textiles (Pvt) Ltd.
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    NTN 4821093-6 · CUIN 0098231
                  </div>
                </div>
                <Badge tone="info">Pro</Badge>
              </div>
              <div className="flex flex-col">
                {HERO_ROWS.map((row) => (
                  <div
                    key={row.title}
                    className="flex items-center justify-between gap-4 border-b border-border-subtle px-5 py-3.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium tracking-tight text-foreground">
                        {row.title}
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        {row.due}
                      </div>
                    </div>
                    <StatusBadge status={row.status} className="shrink-0" />
                  </div>
                ))}
              </div>
              <div className="flex items-baseline justify-between bg-surface-secondary px-5 py-4">
                <span className="text-xs text-muted-foreground">
                  Penalty exposure avoided this year
                </span>
                <span className="font-mono text-[15px] font-semibold text-foreground">
                  Rs 1,240,000
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Regulator strip */}
      <div className="border-y border-border-subtle">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-8 px-5 py-5 sm:px-8">
          <span className="text-xs text-muted-foreground">Filing calendars maintained for</span>
          <div className="flex flex-wrap items-center gap-8 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {REGULATORS.map((r) => (
              <span key={r}>{r}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-26">
        <SectionLabel icon={Layers} label="What you get" />
        <h2 className="mt-5 max-w-xl text-3xl leading-tight font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
          The free plan reminds you. Pro does the work.
        </h2>
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.n} className="rounded-2xl border border-border bg-surface p-7">
              <div className="flex h-8.5 w-8.5 items-center justify-center rounded-[10px] bg-surface-secondary font-mono text-[13px] font-semibold text-foreground">
                {f.n}
              </div>
              <h3 className="mt-5 text-[17px] font-semibold tracking-tight text-foreground">
                {f.title}
              </h3>
              <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground text-pretty">
                {f.body}
              </p>
              <div className="mt-5 border-t border-border-subtle pt-4 font-mono text-[11px] text-muted-foreground">
                {f.meta}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Inside Pro board preview */}
      <section id="dashboard" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-26">
        <SectionLabel icon={Monitor} label="Inside Pro" />
        <div className="mt-5 flex flex-wrap items-end justify-between gap-8">
          <h2 className="max-w-lg text-3xl leading-tight font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
            One board for every company you are responsible for.
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground text-pretty">
            Sorted by what bites first. Overdue at the top, then the returns whose windows close
            this month.
          </p>
        </div>

        <div className="mt-12 overflow-x-auto rounded-[20px] border border-border bg-surface">
          <div className="flex items-center gap-2 border-b border-border-subtle bg-surface-secondary px-5 py-3.5">
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
            <span className="ml-3 font-mono text-[11px] text-muted-foreground">
              app.compliancereminders.pk/board
            </span>
          </div>
          <div className="grid min-w-[880px] grid-cols-[232px_1fr]">
            <aside className="flex flex-col gap-1.5 border-r border-border-subtle p-5">
              <div className="px-2.5 pb-2 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                Companies
              </div>
              {SIDEBAR.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-[13px] tracking-tight"
                >
                  <span className="truncate">{s.name}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{s.count}</span>
                </div>
              ))}
              <div className="mt-auto border-t border-border-subtle pt-3.5 text-[11px] leading-relaxed text-muted-foreground">
                Firm plan adds unlimited client companies and a shared inbox.
              </div>
            </aside>
            <div className="p-7">
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                {STATS.map((st) => (
                  <div
                    key={st.label}
                    className="rounded-md border border-border-subtle bg-surface-secondary px-4 py-3.5"
                  >
                    <div className="text-[11px] text-muted-foreground">{st.label}</div>
                    <div className="mt-1.5 font-mono text-[22px] font-semibold tracking-tight text-foreground">
                      {st.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 overflow-hidden rounded-md border border-border-subtle">
                <div className="grid grid-cols-[2.2fr_1fr_1fr_1fr] gap-4 bg-surface-secondary px-4 py-2.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                  <span>Obligation</span>
                  <span>Company</span>
                  <span>Due</span>
                  <span>Status</span>
                </div>
                {BOARD_ROWS.map((b) => (
                  <div
                    key={b.name + b.co}
                    className="grid grid-cols-[2.2fr_1fr_1fr_1fr] items-center gap-4 border-t border-border-subtle px-4 py-3 text-[12.5px]"
                  >
                    <span className="font-medium tracking-tight text-foreground">{b.name}</span>
                    <span className="text-muted-foreground">{b.co}</span>
                    <span className="font-mono text-muted-foreground">{b.due}</span>
                    <span>
                      <StatusBadge status={b.status} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-26">
        <SectionLabel icon={Tags} label="Plans" />
        <h2 className="mt-5 max-w-lg text-3xl leading-tight font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
          Priced per company, not per filing.
        </h2>
        <div className="mt-11">
          <PricingToggle />
        </div>

        <div className="mt-20 border-t border-border-subtle pt-16">
          <h3 className="max-w-lg text-xl font-semibold tracking-tight text-balance text-foreground">
            Three steps, and your calendar is already populated.
          </h3>
          <div className="mt-10 max-w-xl">
            <Timeline>
              <TimelineItem
                state="done"
                title="Pick a plan"
                subtitle="Company count decides the tier. You can change it later — email sales to adjust."
                meta="1 min"
              />
              <TimelineItem
                state="current"
                title="Confirm company details"
                subtitle="CUIN, NTN, financial year end and registrations. We build the calendar from these."
                meta="3 min"
              />
              <TimelineItem
                state="upcoming"
                title="Invite your team"
                subtitle="Add the CFO, directors or your consultant so approvals have somewhere to route."
                meta="2 min"
                isLast
              />
            </Timeline>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-26">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-16">
          <div>
            <SectionLabel icon={Tags} label="Questions" />
            <h2 className="mt-5 text-3xl leading-tight font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
              Before you upgrade.
            </h2>
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-muted-foreground">
              Anything else, write to support@compliancereminders.pk — answered within a working
              day.
            </p>
          </div>
          <FaqAccordion />
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8 sm:pb-24">
        <div className="flex flex-wrap items-center justify-between gap-10 rounded-[22px] bg-foreground px-8 py-12 sm:px-14 sm:py-16">
          <div>
            <h2 className="max-w-lg text-3xl leading-tight font-semibold tracking-tight text-balance text-background sm:text-[38px]">
              Start the trial before the next return window opens.
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-background/70">
              Fourteen days of Pro on one company. We import your obligations on day one.
            </p>
          </div>
          <div className="flex flex-none flex-col gap-2.5">
            <Link href="/login" className={buttonVariants({ variant: "primary" })}>
              Start 14-day Pro trial
            </Link>
            <a
              href="mailto:sales@compliancereminders.pk"
              className="inline-flex h-10 items-center justify-center rounded-full border border-background/35 px-4.5 text-[13.5px] font-medium text-background hover:border-background"
            >
              Talk to sales
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-border-subtle">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-8 px-5 py-8 text-xs text-muted-foreground sm:px-8">
          <Logo />
          <span>
            Sarmaya Compliance is a filing assistant. It does not provide legal or tax advice.
          </span>
        </div>
      </footer>
    </div>
  );
}
