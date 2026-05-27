import type { ActionItem, Scenario } from "./types";

export const SCENARIO_LABEL_JA: Record<Scenario, string> = {
  cx_first: "顧客体験重視",
  revenue_first: "売上回収重視",
  risk_min: "リスク最小化",
};

export const SCENARIO_DESCRIPTION_JA: Record<Scenario, string> = {
  cx_first:
    "顧客側の対応が必要な取引（カード更新、本人認証など）を最優先に並べ替えます。",
  revenue_first:
    "対応余地が大きい取引（リトライ候補・顧客対応）を金額順で前に出します。",
  risk_min:
    "リトライ非推奨・要確認の取引を前に出し、安全側の運用を強調します。",
};

export const SCENARIO_TONE_JA: Record<Scenario, string> = {
  cx_first:
    "顧客との関係性を損なわない案内を優先します。リトライよりも先にコミュニケーションを整える方針です。",
  revenue_first:
    "回収余地の大きい取引から順に処理します。リトライ判断は担当者確認を前提とし、自動実行は行いません。",
  risk_min:
    "リスクのある取引を先に確認し、リトライ非推奨を明確に除外します。回収より安全運用を優先します。",
};

const ORDER: Record<
  Scenario,
  Record<string, number>
> = {
  cx_first: {
    customer_action_required: 0,
    safe_retry_candidate: 1,
    manual_review: 2,
    do_not_retry: 3,
  },
  revenue_first: {
    safe_retry_candidate: 0,
    customer_action_required: 1,
    manual_review: 2,
    do_not_retry: 3,
  },
  risk_min: {
    do_not_retry: 0,
    manual_review: 1,
    customer_action_required: 2,
    safe_retry_candidate: 3,
  },
};

// We classify items by error_code → classification mapping that's already baked
// into the action item itself via its content. To keep the dependency simple,
// we re-derive the classification from the wording of the title.
function classifyAction(item: ActionItem): string {
  if (item.title.startsWith("expired_card")) return "customer_action_required";
  if (item.title.includes("リトライ候補")) return "safe_retry_candidate";
  if (item.title.includes("リトライ対象から明確に除外"))
    return "do_not_retry";
  if (item.title.includes("担当者で確認")) return "manual_review";
  return "customer_action_required";
}

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 } as const;

export function reorderActions(
  items: ActionItem[],
  scenario: Scenario,
): ActionItem[] {
  const ordering = ORDER[scenario];
  return [...items].sort((a, b) => {
    const ra = ordering[classifyAction(a)] ?? 99;
    const rb = ordering[classifyAction(b)] ?? 99;
    if (ra !== rb) return ra - rb;
    if (PRIORITY_RANK[a.priority] !== PRIORITY_RANK[b.priority])
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    return b.estimated_amount - a.estimated_amount;
  });
}
