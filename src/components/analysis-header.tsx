import type { AnalysisResult } from "@/lib/types";
import { SCENARIO_LABEL_JA } from "@/lib/scenario";

function jpy(n: number): string {
  return `¥${n.toLocaleString("ja-JP")}`;
}

export function AnalysisHeader({ result }: { result: AnalysisResult }) {
  const counts = {
    customer: result.categories.find(
      (c) => c.classification === "customer_action_required",
    )?.count ?? 0,
    safe: result.categories.find(
      (c) => c.classification === "safe_retry_candidate",
    )?.count ?? 0,
    manual: result.categories.find(
      (c) => c.classification === "manual_review",
    )?.count ?? 0,
    dnr: result.categories.find((c) => c.classification === "do_not_retry")
      ?.count ?? 0,
  };
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
      <div>
        <span className="section-title">Analysis #{result.id.slice(0, 8)}</span>
        <h1 className="heading-1 mt-1">分析結果</h1>
        <p className="text-sm text-moss-200 mt-1">
          {result.revenue.transaction_count}件を分類: 顧客対応{counts.customer} ·
          リトライ候補{counts.safe} · 要確認{counts.manual} ·
          リトライ非推奨{counts.dnr}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5 text-xs text-moss-200">
        <div className="flex items-center gap-2">
          <span className="badge-muted">
            Scenario: {SCENARIO_LABEL_JA[result.scenario]}
          </span>
          <span
            className={
              result.ai_mode === "azure_openai" ? "badge-ok" : "badge-warn"
            }
          >
            AI: {result.ai_mode === "azure_openai" ? "Azure OpenAI" : "mock"}
          </span>
        </div>
        <span>
          総額 <span className="text-gold-300">{jpy(result.revenue.total_failed_amount)}</span>
          {" "}/ 対応余地{" "}
          <span className="text-gold-300">{jpy(result.revenue.actionable_amount)}</span>
        </span>
      </div>
    </div>
  );
}
