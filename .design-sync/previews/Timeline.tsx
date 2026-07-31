import { Timeline, TimelineItem } from "../../components/ui/timeline";

export function FilingProgress() {
  return (
    <Timeline>
      <TimelineItem state="done" title="Reminder sent" meta="12 Sep 2026" />
      <TimelineItem state="done" title="Draft prepared by CA" meta="20 Sep 2026" />
      <TimelineItem
        state="current"
        title="Awaiting your approval"
        subtitle="Review the draft before it's filed."
      />
      <TimelineItem state="upcoming" title="Filed with SECP" isLast />
    </Timeline>
  );
}
