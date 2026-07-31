import { Textarea } from "../../components/ui/input";

export function Default() {
  return (
    <Textarea
      placeholder="Add a note for your chartered accountant…"
      rows={4}
      className="max-w-sm"
    />
  );
}
