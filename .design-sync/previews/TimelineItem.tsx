import { Timeline, TimelineItem } from '../../components/ui/timeline';

export function States() {
  return (
    <Timeline>
      <TimelineItem state="done" title="Done" meta="Step 1" />
      <TimelineItem state="current" title="Current" meta="Step 2" />
      <TimelineItem state="upcoming" title="Upcoming" meta="Step 3" />
      <TimelineItem state="danger" title="Overdue" meta="Step 4" isLast />
    </Timeline>
  );
}
