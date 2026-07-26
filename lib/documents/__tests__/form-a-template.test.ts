import { describe, expect, it } from "vitest";
import { generateFormADraft } from "../form-a-template";
import type { Company, CompanyDirector, FilingDeadline } from "../../types";

const company: Company = {
  id: "company-1",
  owner_user_id: "user-1",
  name: "Test Pvt Ltd",
  secp_registration_no: "0123456",
  incorporation_date: "2024-03-15",
  paid_up_capital: 100000,
  company_type: "private_limited",
  status: "active",
  created_at: "2024-03-15T00:00:00Z",
  updated_at: "2024-03-15T00:00:00Z",
};

const directors: CompanyDirector[] = [
  { id: "d1", company_id: "company-1", name: "Jane Doe", cnic: "42101-1234567-1", designation: "Director", created_at: "" },
];

const deadline: FilingDeadline = {
  id: "fd-1",
  company_id: "company-1",
  rule_key: "secp_form_a_deadline",
  source_agm_record_id: "agm-1",
  due_date: "2026-07-30",
  status: "draft_ready",
  created_at: "",
  updated_at: "",
};

describe("generateFormADraft", () => {
  it("produces a valid PDF byte stream", async () => {
    const bytes = await generateFormADraft({ company, directors, deadline });
    expect(bytes.byteLength).toBeGreaterThan(0);
    const header = Buffer.from(bytes.slice(0, 5)).toString("utf-8");
    expect(header).toBe("%PDF-");
  });

  it("still produces a PDF when there are no directors yet", async () => {
    const bytes = await generateFormADraft({ company, directors: [], deadline });
    expect(bytes.byteLength).toBeGreaterThan(0);
  });
});
