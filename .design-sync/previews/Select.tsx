import { Select } from '../../components/ui/input';

export function Default() {
  return (
    <Select className="max-w-sm" defaultValue="form-a">
      <option value="form-a">Form A — Annual Return</option>
      <option value="form-29">Form 29 — Change of Directors</option>
      <option value="form-3">Form 3 — Return of Allotment</option>
    </Select>
  );
}
