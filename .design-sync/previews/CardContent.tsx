import { Card, CardContent } from '../../components/ui/card';
import { StatusBadge } from '../../components/ui/badge';

export function Default() {
  return (
    <Card className="max-w-sm">
      <CardContent>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-foreground">Acme Textiles (Pvt) Ltd.</p>
          <StatusBadge status="filed" />
        </div>
      </CardContent>
    </Card>
  );
}
