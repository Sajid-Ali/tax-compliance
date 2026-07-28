import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';

export function Default() {
  return (
    <PageHeader
      title="Compliance calendar"
      description="Every SECP filing deadline across your entities, in one place."
      action={<Button size="sm">Add entity</Button>}
    />
  );
}
