import { Badge } from '../../components/ui/badge';

export function Tones() {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge tone="neutral">Draft</Badge>
      <Badge tone="info">In review</Badge>
      <Badge tone="warning">Due soon</Badge>
      <Badge tone="success">Filed</Badge>
      <Badge tone="danger">Overdue</Badge>
    </div>
  );
}
