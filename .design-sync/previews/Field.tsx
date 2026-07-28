import { Field } from '../../components/ui/input';
import { Input } from '../../components/ui/input';

export function Default() {
  return (
    <Field label="Company name" hint="As registered with SECP" htmlFor="company-name" className="max-w-sm">
      <Input id="company-name" placeholder="Acme Textiles (Pvt) Ltd." />
    </Field>
  );
}
