import { Button } from '../../components/ui/button';

export function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">Mark as filed</Button>
      <Button variant="secondary">Save draft</Button>
      <Button variant="outline">View document</Button>
      <Button variant="ghost">Dismiss</Button>
      <Button variant="danger">Delete entity</Button>
    </div>
  );
}

export function Sizes() {
  return (
    <div className="flex items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
    </div>
  );
}

export function Disabled() {
  return (
    <div className="flex items-center gap-3">
      <Button disabled>Submitting…</Button>
    </div>
  );
}
