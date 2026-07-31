import { EmptyState } from "../../components/ui/empty-state";
import { ShieldCheck } from "lucide-react";
import { Button } from "../../components/ui/button";

export function NoUpcomingFilings() {
  return (
    <EmptyState
      icon={ShieldCheck}
      title="You're all caught up"
      description="No SECP filings are due in the next 90 days."
    />
  );
}

export function WithAction() {
  return (
    <EmptyState
      icon={ShieldCheck}
      title="No entities yet"
      description="Add your first company to start tracking its filing deadlines."
      action={<Button size="sm">Add entity</Button>}
    />
  );
}
