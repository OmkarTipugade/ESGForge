// ──────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  company_code: string;
  role: "ADMIN" | "ANALYST" | "VIEWER";
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: "ADMIN" | "ANALYST" | "VIEWER";
  company_name: string;
}

// ──────────────────────────────────────────────
// Emission Records
// ──────────────────────────────────────────────
export type Scope = "SCOPE_1" | "SCOPE_2" | "SCOPE_3";

export type RecordStatus =
  | "PENDING"
  | "FLAGGED"
  | "APPROVED"
  | "REJECTED"
  | "LOCKED";

export interface EmissionRecord {
  id: number;
  scope: Scope;
  scope_3_category: number | null;
  activity_type: string;
  raw_quantity: string;
  raw_unit: string;
  normalized_quantity: string;
  normalized_unit: string;
  co2e_kg: string | null;
  activity_start_date: string;
  activity_end_date: string | null;
  status: RecordStatus;
  flag_reasons: string[];
  source_type: string;
  source_filename: string;
  facility_name: string | null;
  created_at: string;
}

export interface EmissionRecordDetail extends EmissionRecord {
  emission_factor: string | null;
  emission_factor_source: string;
  reviewer_name: string | null;
  reviewed_at: string | null;
  review_notes: string;
  source_row_number: number;
  raw_data: Record<string, unknown>;
  audit_history: AuditLogEntry[];
  updated_at: string;
}

export interface ReviewAction {
  action: "APPROVE" | "REJECT" | "FLAG";
  notes?: string;
  flag_reasons?: string[];
}

export interface BulkApproveRequest {
  record_ids: number[];
  notes?: string;
}

export interface LockRequest {
  record_ids: number[];
}

export interface BulkApproveResponse {
  approved_count: number;
  requested_count: number;
}

export interface LockResponse {
  locked_count: number;
  requested_count: number;
}

// ──────────────────────────────────────────────
// Data Sources
// ──────────────────────────────────────────────
export type SourceType = "SAP_FUEL" | "UTILITY_ELECTRICITY" | "TRAVEL";

export type SourceStatus =
  | "UPLOADED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "PARTIALLY_FAILED";

export interface DataSource {
  id: number;
  source_type: SourceType;
  original_filename: string;
  status: SourceStatus;
  total_rows: number;
  successful_rows: number;
  failed_rows: number;
  error_summary: Record<string, string>;
  error_categories: Record<string, number>;
  processing_error: string;
  uploaded_by_name: string;
  uploaded_at: string;
  processed_at: string | null;
}

// ──────────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────────
export interface DashboardSummary {
  total_records: number;
  total_co2e_kg: number;
  by_status: Record<string, number>;
  by_scope: Record<string, number>;
  by_source_type: Record<string, number>;
}


export interface AuditLogEntry {
  id: number;
  action: string;
  field_name: string;
  old_value: string;
  new_value: string;
  performed_by_name: string;
  timestamp: string;
}

// ──────────────────────────────────────────────
// Pagination (DRF PageNumberPagination)
// ──────────────────────────────────────────────
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ──────────────────────────────────────────────
// Filters
// ──────────────────────────────────────────────
export interface RecordFilters {
  status?: RecordStatus;
  scope?: Scope;
  source_type?: SourceType;
  source_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  ordering?: string;
  search?: string;
}

export interface SourceFilters {
  source_type?: SourceType;
  status?: SourceStatus;
  page?: number;
}
