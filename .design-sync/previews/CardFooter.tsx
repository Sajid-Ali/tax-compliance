import { Card, CardContent, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export function Default() {
  return (
    <Card className="max-w-sm">
      <CardContent>
        <p className="text-sm text-muted-foreground">Draft ready for your review.</p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Approve</Button>
        <Button size="sm" variant="outline">Request changes</Button>
      </CardFooter>
    </Card>
  );
}
