import { Card, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";

export function Default() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Form A — Annual Return</CardTitle>
        <CardDescription>Filed once a year within 30 days of the AGM.</CardDescription>
      </CardHeader>
    </Card>
  );
}
