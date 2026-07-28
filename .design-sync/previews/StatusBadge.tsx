import { StatusBadge } from '../../components/ui/badge';

export function AllStatuses() {
  return (
    <div className="flex flex-col items-start gap-2">
      <StatusBadge status="upcoming" />
      <StatusBadge status="reminder_sent" />
      <StatusBadge status="draft_ready" />
      <StatusBadge status="in_review" />
      <StatusBadge status="approved" />
      <StatusBadge status="filed" />
      <StatusBadge status="overdue" />
    </div>
  );
}
