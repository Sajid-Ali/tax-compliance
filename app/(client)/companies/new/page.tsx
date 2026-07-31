import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { AddCompanyForm } from "@/components/forms/add-company-form";

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
          <AddCompanyForm />
        </CardContent>
      </Card>
    </div>
  );
}
