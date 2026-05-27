import type {
  Classification,
  Owner,
  RiskLevel,
  SubscriptionStatus,
  Transaction,
} from "./types";

// Error code → category mapping. Deterministic. Single source of truth.
export const ERROR_CODE_CATEGORIES: Record<string, Classification> = {
  // Safe retry candidates
  insufficient_funds: "safe_retry_candidate",
  temporary_failure: "safe_retry_candidate",
  processing_error: "safe_retry_candidate",
  network_error: "safe_retry_candidate",
  issuer_unavailable: "safe_retry_candidate",

  // Customer action required
  expired_card: "customer_action_required",
  authentication_required: "customer_action_required",
  card_declined_authentication: "customer_action_required",
  payment_method_required: "customer_action_required",
  card_update_required: "customer_action_required",

  // Do not retry
  stolen_card: "do_not_retry",
  lost_card: "do_not_retry",
  fraudulent: "do_not_retry",
  invalid_card: "do_not_retry",
  pickup_card: "do_not_retry",
  restricted_card: "do_not_retry",

  // Manual review
  do_not_honor: "manual_review",
  generic_decline: "manual_review",
  unknown: "manual_review",
};

const SAFE_RETRY_MAX_ATTEMPTS = 2;
const SAFE_RETRY_OK_STATUSES: SubscriptionStatus[] = ["active", "past_due"];

export function classifyTransaction(input: {
  error_code: string;
  attempt_count: number;
  subscription_status: string;
}): { classification: Classification; explanation: string } {
  const code = input.error_code?.toLowerCase().trim();
  const base = ERROR_CODE_CATEGORIES[code] ?? "manual_review";

  // Safe retry candidates degrade to manual review when conditions don't hold.
  if (base === "safe_retry_candidate") {
    const status = (input.subscription_status?.toLowerCase() ??
      "") as SubscriptionStatus;
    const tooManyAttempts = input.attempt_count > SAFE_RETRY_MAX_ATTEMPTS;
    const inactiveSub = !SAFE_RETRY_OK_STATUSES.includes(status);

    if (tooManyAttempts && inactiveSub) {
      return {
        classification: "manual_review",
        explanation: `エラー種別はリトライ候補ですが、試行回数${input.attempt_count}回・サブスク状態${input.subscription_status}のため、担当者確認が推奨されます。`,
      };
    }
    if (tooManyAttempts) {
      return {
        classification: "manual_review",
        explanation: `エラー種別はリトライ候補ですが、試行回数が${input.attempt_count}回を超えているため、担当者確認が推奨されます。`,
      };
    }
    if (inactiveSub) {
      return {
        classification: "manual_review",
        explanation: `エラー種別はリトライ候補ですが、サブスク状態が${input.subscription_status}のため、担当者確認が推奨されます。`,
      };
    }
    return {
      classification: "safe_retry_candidate",
      explanation: `一時的なエラーで、試行回数・サブスク状態ともにリトライ候補として管理できます（担当者確認を前提とします）。`,
    };
  }

  if (base === "customer_action_required") {
    return {
      classification: "customer_action_required",
      explanation: `${code} は顧客側の対応（カード更新・本人認証など）が必要なエラーです。リトライ単独では解消しない可能性があります。`,
    };
  }

  if (base === "do_not_retry") {
    return {
      classification: "do_not_retry",
      explanation: `${code} はリトライを避けるべきエラーです。リスク管理の観点から、リトライ対象から除外し、財務側で記録することが推奨されます。`,
    };
  }

  return {
    classification: "manual_review",
    explanation: `${code || "未分類"} は担当者による確認が必要なエラーです。`,
  };
}

export function ownerFor(classification: Classification): Owner {
  switch (classification) {
    case "customer_action_required":
      return "CS";
    case "safe_retry_candidate":
      return "Ops";
    case "do_not_retry":
      return "Finance";
    case "manual_review":
      return "Ops";
  }
}

export function riskFor(
  classification: Classification,
  attempt_count: number,
): RiskLevel {
  if (classification === "do_not_retry") return "high";
  if (classification === "manual_review")
    return attempt_count > 2 ? "high" : "medium";
  if (classification === "customer_action_required") return "medium";
  return "low";
}

export function recommendedActionFor(classification: Classification): string {
  switch (classification) {
    case "safe_retry_candidate":
      return "リトライ候補として管理（担当者確認を前提）";
    case "customer_action_required":
      return "顧客にカード更新・本人認証の案内を送付";
    case "do_not_retry":
      return "リトライ対象から除外し、財務側で記録";
    case "manual_review":
      return "担当者による個別確認";
  }
}

export function buildTransaction(input: {
  transaction_id: string;
  customer_id: string;
  amount: number;
  currency: string;
  failed_at: string;
  error_code: string;
  error_message: string;
  attempt_count: number;
  last_success_at: string;
  subscription_status: string;
}): Transaction {
  const { classification, explanation } = classifyTransaction(input);
  return {
    ...input,
    classification,
    recommended_action: recommendedActionFor(classification),
    risk_level: riskFor(classification, input.attempt_count),
    suggested_owner: ownerFor(classification),
    explanation,
  };
}

export const CLASSIFICATION_LABEL_JA: Record<Classification, string> = {
  safe_retry_candidate: "リトライ候補",
  customer_action_required: "顧客対応が必要",
  do_not_retry: "リトライ非推奨",
  manual_review: "要確認",
};

export const CLASSIFICATION_TONE: Record<Classification, string> = {
  safe_retry_candidate: "badge-ok",
  customer_action_required: "badge-gold",
  do_not_retry: "badge-danger",
  manual_review: "badge-warn",
};
