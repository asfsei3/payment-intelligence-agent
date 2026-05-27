// Domain types for Payment Intelligence Agent.
// Rule-first, AI-assisted: classification + risk are deterministic;
// only narrative/wording fields are populated by AI.

export type Classification =
  | "safe_retry_candidate"
  | "customer_action_required"
  | "do_not_retry"
  | "manual_review";

export type RiskLevel = "low" | "medium" | "high";

export type Owner = "CS" | "Finance" | "Ops";

export type Scenario = "cx_first" | "revenue_first" | "risk_min";

export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "paused"
  | "canceled"
  | "trialing";

export interface RawTransaction {
  transaction_id: string;
  customer_id: string;
  amount: string;
  currency: string;
  failed_at: string;
  error_code: string;
  error_message: string;
  attempt_count: string;
  last_success_at: string;
  subscription_status: string;
}

export interface Transaction {
  transaction_id: string;
  customer_id: string;
  amount: number;
  currency: string;
  failed_at: string;
  error_code: string;
  error_message: string;
  attempt_count: number;
  last_success_at: string;
  subscription_status: SubscriptionStatus | string;
  classification: Classification;
  recommended_action: string;
  risk_level: RiskLevel;
  suggested_owner: Owner;
  explanation: string;
}

export interface CategoryBreakdown {
  classification: Classification;
  count: number;
  amount: number;
}

export interface ErrorCodeBreakdown {
  error_code: string;
  count: number;
  amount: number;
  classification: Classification;
}

export interface RevenueImpact {
  total_failed_amount: number;
  actionable_amount: number;
  customer_action_amount: number;
  do_not_retry_amount: number;
  manual_review_amount: number;
  currency: string;
  transaction_count: number;
}

export interface ActionItem {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  reason: string;
  affected_count: number;
  estimated_amount: number;
  owner: Owner;
  caution?: string;
  error_codes: string[];
}

export interface ExecutiveBriefing {
  headline: string;
  total_failed: string;
  actionable_opportunity: string;
  customer_action_required: string;
  do_not_retry_risk: string;
  key_risks: string[];
  recommended_next_steps: string[];
  prevention_outlook: string;
  markdown: string;
}

export interface SupportDraft {
  id: string;
  category: string;
  subject: string;
  body: string;
  applies_to_error_codes: string[];
  affected_count: number;
}

export interface PreventionSuggestion {
  id: string;
  title: string;
  detail: string;
  area: "operations" | "data" | "communication" | "review";
}

export type AgentName =
  | "safety"
  | "classification"
  | "revenue_impact"
  | "customer_recovery"
  | "ops_task"
  | "executive_reporting"
  | "prevention";

export interface AgentRun {
  agent: AgentName;
  label_ja: string;
  label_en: string;
  status: "ok" | "warning" | "blocked";
  message_ja: string;
  duration_ms: number;
  used_ai: boolean;
}

export interface SafetyReport {
  blocked: boolean;
  pan_like_detected: boolean;
  missing_columns: string[];
  total_rows: number;
  notes: string[];
}

export interface AnalysisResult {
  id: string;
  created_at: string;
  scenario: Scenario;
  safety: SafetyReport;
  transactions: Transaction[];
  categories: CategoryBreakdown[];
  error_codes: ErrorCodeBreakdown[];
  revenue: RevenueImpact;
  action_items: ActionItem[];
  briefing: ExecutiveBriefing;
  drafts: SupportDraft[];
  prevention: PreventionSuggestion[];
  agent_runs: AgentRun[];
  ai_mode: "azure_openai" | "mock";
}

export const REQUIRED_COLUMNS: ReadonlyArray<keyof RawTransaction> = [
  "transaction_id",
  "customer_id",
  "amount",
  "currency",
  "failed_at",
  "error_code",
  "error_message",
  "attempt_count",
  "last_success_at",
  "subscription_status",
];
