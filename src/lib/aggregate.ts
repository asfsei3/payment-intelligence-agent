import { CLASSIFICATION_LABEL_JA } from "./classification";
import type {
  ActionItem,
  CategoryBreakdown,
  Classification,
  ErrorCodeBreakdown,
  Owner,
  RevenueImpact,
  Transaction,
} from "./types";

export function aggregateCategories(txs: Transaction[]): CategoryBreakdown[] {
  const map = new Map<Classification, { count: number; amount: number }>();
  for (const t of txs) {
    const e = map.get(t.classification) ?? { count: 0, amount: 0 };
    e.count += 1;
    e.amount += t.amount;
    map.set(t.classification, e);
  }
  // Stable order: align with the priority story we tell elsewhere.
  const order: Classification[] = [
    "customer_action_required",
    "safe_retry_candidate",
    "manual_review",
    "do_not_retry",
  ];
  return order
    .filter((c) => map.has(c))
    .map((c) => ({ classification: c, ...map.get(c)! }));
}

export function aggregateErrorCodes(
  txs: Transaction[],
): ErrorCodeBreakdown[] {
  const map = new Map<
    string,
    { count: number; amount: number; classification: Classification }
  >();
  for (const t of txs) {
    const key = t.error_code || "unknown";
    const e = map.get(key) ?? {
      count: 0,
      amount: 0,
      classification: t.classification,
    };
    e.count += 1;
    e.amount += t.amount;
    map.set(key, e);
  }
  return [...map.entries()]
    .map(([error_code, v]) => ({ error_code, ...v }))
    .sort((a, b) => b.amount - a.amount);
}

export function revenueImpact(txs: Transaction[]): RevenueImpact {
  let total = 0;
  let actionable = 0;
  let customer = 0;
  let dnr = 0;
  let manual = 0;
  for (const t of txs) {
    total += t.amount;
    if (t.classification === "safe_retry_candidate") actionable += t.amount;
    if (t.classification === "customer_action_required") {
      customer += t.amount;
      actionable += t.amount;
    }
    if (t.classification === "do_not_retry") dnr += t.amount;
    if (t.classification === "manual_review") manual += t.amount;
  }
  const currency = txs[0]?.currency ?? "JPY";
  return {
    total_failed_amount: total,
    actionable_amount: actionable,
    customer_action_amount: customer,
    do_not_retry_amount: dnr,
    manual_review_amount: manual,
    currency,
    transaction_count: txs.length,
  };
}

function ownerForCategory(c: Classification): Owner {
  if (c === "customer_action_required") return "CS";
  if (c === "safe_retry_candidate") return "Ops";
  if (c === "do_not_retry") return "Finance";
  return "Ops";
}

// Build deterministic action items grouped by error code, then prioritize.
export function buildActionItems(txs: Transaction[]): ActionItem[] {
  // group by (classification, error_code)
  type Bucket = {
    classification: Classification;
    error_code: string;
    txs: Transaction[];
  };
  const buckets = new Map<string, Bucket>();
  for (const t of txs) {
    const k = `${t.classification}::${t.error_code}`;
    const b = buckets.get(k) ?? {
      classification: t.classification,
      error_code: t.error_code,
      txs: [],
    };
    b.txs.push(t);
    buckets.set(k, b);
  }

  const items: ActionItem[] = [];
  let i = 0;
  for (const b of buckets.values()) {
    const amount = b.txs.reduce((s, t) => s + t.amount, 0);
    const count = b.txs.length;
    const owner = ownerForCategory(b.classification);
    let priority: ActionItem["priority"] = "medium";
    let title = "";
    let reason = "";
    let caution: string | undefined;

    switch (b.classification) {
      case "customer_action_required": {
        priority = amount > 100_000 ? "high" : "medium";
        title = humanTitleForCustomerCode(b.error_code, count);
        reason =
          "リトライ単独では解消しない可能性があります。顧客側でのカード更新や本人認証の対応が必要です。";
        break;
      }
      case "safe_retry_candidate": {
        priority = amount > 200_000 ? "high" : count > 10 ? "medium" : "low";
        title = `${b.error_code} の${count}件をリトライ候補として整理する`;
        reason =
          "一時的なエラーであり、試行回数とサブスク状態の条件を満たすため、リトライ候補として管理できます。担当者確認を前提とします。";
        caution =
          "リトライ実行はPayment Intelligence Agentでは行いません。実際の再請求はPSP管理画面または既存ワークフローでご対応ください。";
        break;
      }
      case "do_not_retry": {
        priority = "high";
        title = `${b.error_code} の${count}件をリトライ対象から明確に除外する`;
        reason =
          "リスク管理の観点から、これらの取引はリトライ対象に含めず、財務側で記録しておくことが推奨されます。";
        caution = "Fraud調査が必要な場合は社内の調査フローに沿ってご確認ください。";
        break;
      }
      case "manual_review": {
        priority = count > 5 ? "medium" : "low";
        title = `${b.error_code || "未分類"} の${count}件を担当者で確認する`;
        reason =
          "自動分類では判断が難しいため、担当者による個別確認が推奨されます。";
        break;
      }
    }

    items.push({
      id: `act_${i++}`,
      priority,
      title,
      reason,
      affected_count: count,
      estimated_amount: amount,
      owner,
      caution,
      error_codes: [b.error_code],
    });
  }

  // Stable priority sort: high → medium → low, then by amount desc
  const order = { high: 0, medium: 1, low: 2 } as const;
  items.sort(
    (a, b) =>
      order[a.priority] - order[b.priority] ||
      b.estimated_amount - a.estimated_amount,
  );
  return items;
}

function humanTitleForCustomerCode(code: string, count: number): string {
  switch (code) {
    case "expired_card":
      return `expired_card の顧客${count}件にカード更新案内を送る`;
    case "authentication_required":
    case "card_declined_authentication":
      return `${code} の顧客${count}件に本人認証フローの再案内を送る`;
    case "payment_method_required":
      return `payment_method_required の顧客${count}件に支払い方法登録の依頼を送る`;
    case "card_update_required":
      return `card_update_required の顧客${count}件にカード情報更新の依頼を送る`;
    default:
      return `${code} の顧客${count}件に対応案内を送る`;
  }
}

export const CATEGORY_LABEL_JA = CLASSIFICATION_LABEL_JA;
