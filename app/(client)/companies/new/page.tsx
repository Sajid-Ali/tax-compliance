import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createCompany } from "../actions";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NewCompanyPage() {
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
        <PageHeader
          title="Add a company"
          description="We'll use this to compute your Form A deadline."
        />
      </div>

      <Card className="max-w-lg">
        <CardContent className="pt-5">
          <form action={createCompany} className="flex flex-col gap-4">
            <Field label="Company name" htmlFor="name">
              <Input id="name" name="name" required placeholder="Acme Pvt Ltd" />
            </Field>
            <Field label="SECP registration number" htmlFor="secp_registration_no">
              <Input
                id="secp_registration_no"
                name="secp_registration_no"
                required
                placeholder="0123456"
              />
            </Field>
            <Field label="Incorporation date" htmlFor="incorporation_date">
              <Input id="incorporation_date" type="date" name="incorporation_date" required />
            </Field>
            <Field
              label="Paid-up capital (PKR)"
              htmlFor="paid_up_capital"
              hint="Under PKR 1,000,000 means no mandatory auditor yet."
            >
              <Input
                id="paid_up_capital"
                type="number"
                name="paid_up_capital"
                min={0}
                defaultValue={0}
              />
            </Field>
            <Button type="submit" className="mt-2 self-start">
              Add company
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
