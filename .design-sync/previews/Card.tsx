import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/ui/badge';

export function FilingCard() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>SECP Form A — Annual Return</CardTitle>
        <CardDescription>Due 30 Oct 2026 for Acme Textiles (Pvt) Ltd.</CardDescription>
      </CardHeader>
      <CardContent>
        <StatusBadge status="in_review" />
      </CardContent>
      <CardFooter>
        <Button size="sm" variant="primary">Approve</Button>
        <Button size="sm" variant="outline">View draft</Button>
      </CardFooter>
    </Card>
  );
}
