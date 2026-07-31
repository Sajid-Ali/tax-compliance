import { Card, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";

export function WithTitleAndDescription() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Reminder settings</CardTitle>
        <CardDescription>Choose how early we notify you before a filing deadline.</CardDescription>
      </CardHeader>
    </Card>
  );
}
