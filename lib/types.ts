// Hand-written types mirroring supabase/migrations/0001_init.sql.
// If you generate types via `supabase gen types typescript`, prefer that
// and keep this file only for shapes that don't map 1:1 to a table row.

export type UserRole = "client" | "reviewer" | "admin";

export type FilingStatus =
  | "upcoming"
  | "reminder_sent"
  | "draft_ready"
  | "in_review"
  | "approved"
  | "filed"
  | "overdue";

export type ReminderChannel = "email" | "sms" | "whatsapp";

export type OffsetFromType = "agm_date" | "incorporation_date" | "fiscal_year_end";

export type SubscriptionStatus = "trial" | "active" | "past_due" | "cancelled";

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface Company {
  id: string;
  owner_user_id: string;
  name: string;
  secp_registration_no: string;
  incorporation_date: string; // ISO date
  paid_up_capital: number;
  company_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyDirector {
  id: string;
  company_id: string;
  name: string;
  cnic: string;
  designation: string;
  created_at: string;
}

export interface AgmRecord {
  id: string;
  company_id: string;
  agm_date: string; // ISO date
  financial_year_end: string | null;
  created_at: string;
}

export interface ComplianceRule {
  id: string;
  rule_key: string;
  company_type: string;
  label: string;
  offset_from: OffsetFromType;
  offset_days: number;
  penalty_text: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FilingDeadline {
  id: string;
  company_id: string;
  rule_key: string;
  source_agm_record_id: string | null;
  due_date: string; // ISO date
  status: FilingStatus;
  created_at: string;
  updated_at: string;
}

export interface Filing {
  id: string;
  filing_deadline_id: string;
  draft_document_url: string | null;
  reviewer_id: string | null;
  reviewer_notes: string | null;
  approved_at: string | null;
  filed_at: string | null;
  filed_by: string | null;
  confirmation_receipt_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReminderLog {
  id: string;
  filing_deadline_id: string;
  channel: ReminderChannel;
  sent_at: string;
  recipient: string | null;
}

export interface Subscription {
  id: string;
  company_id: string;
  plan: string;
  status: SubscriptionStatus;
  monthly_amount_pkr: number;
  last_invoiced_at: string | null;
  last_paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  actor_user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  before: unknown;
  after: unknown;
  created_at: string;
}

// Reminder cadence, in days-before-due-date. Kept out of the DB because it's
// a product/ops decision, not a legal rule — change it here, no migration needed.
export const REMINDER_OFFSETS_DAYS = [30, 14, 7, 1] as const;
