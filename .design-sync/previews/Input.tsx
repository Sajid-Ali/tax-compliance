import { Input } from "../../components/ui/input";

export function Default() {
  return <Input placeholder="Acme Textiles (Pvt) Ltd." className="max-w-sm" />;
}

export function WithValue() {
  return <Input defaultValue="acme@example.com" className="max-w-sm" />;
}

export function Disabled() {
  return <Input placeholder="Locked while filing is in review" disabled className="max-w-sm" />;
}
