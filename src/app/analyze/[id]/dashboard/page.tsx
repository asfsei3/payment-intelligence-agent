import { notFound } from "next/navigation";
import { getAnalysis } from "@/lib/store";
import { applyScenario } from "@/lib/pipeline";
import { AnalysisHeader } from "@/components/analysis-header";
import { AnalysisTabs } from "@/components/analysis-tabs";
import {
  CLASSIFICATION_LABEL_JA,
  CLASSIFICATION_TONE,
} from "@/lib/classification";
import type { Classification, Scenario } from "@/lib/types";

interface Props {
  params: { id: string };
  searchParams: { scenario?: string };
}

function jpy(n: number): string {
  return `¥${n.toLocaleString("ja-JP")}`;
}

function isScenario(s: string | undefined): s is Scenario {
  return s === "cx_first" || s === "revenue_first" || s === "risk_min";
}

export default function DashboardPage({ params, searchParams }: Props) {
  const base = getAnalysis(params.id);
  if (!base) return notFound();
  const result = isScenario(searchParams.scenario)
    ? applyScenario(base, searchParams.scenario)
    : base;

  const total = result.revenue.total_failed_amount || 1;
  const maxCodeAmount =
    result.error_codes.reduce((m, e) => Math.max(m, e.amount), 0) || 1;

  return (
    <div className="flex flex-col gap-6 pt-2">
      <AnalysisHeader result={result} />
      <AnalysisTabs analysisId={result.id} />

      {/* KPI cards */}
      <section className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <Kpi label="分析対象件数" value={String(result.revenue.transaction_count)} suffix="件" tone="muted" />
        <Kpi label="決済エラー総額" value={jpy(result.revenue.total_failed_amount)} tone="gold" />
        <Kpi label="対応余地あり" value={jpy(result.revenue.actionable_amount)} tone="ok" />
        <Kpi label="顧客対応が必要" value={jpy(result.revenue.customer_action_amount)} tone="gold" />
        <Kpi label="リトライ非推奨" value={jpy(result.revenue.do_not_retry_amount)} tone="danger" />
        <Kpi label="要確認" value={jpy(result.revenue.manual_review_amount)} tone="warn" />
      </section>

      {/* Risk warning */}
      {result.revenue.do_not_retry_amount > 0 && (
        <section className="card border-danger/30 p-4 flex items-start gap-3">
          <span className="badge-danger mt-0.5">注意</span>
          <div className="text-sm text-moss-200">
            リトライ非推奨に該当する取引が{" "}
            <span className="text-danger font-semibold">
              {jpy(result.revenue.do_not_retry_amount)}
            </span>{" "}
            含まれています。これらをリトライ対象から明確に除外することが推奨されます。
          </div>
        </section>
      )}

      <section className="grid lg:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <div className="card p-5">
          <h2 className="heading-2">カテゴリ別 売上影響</h2>
          <p className="text-xs text-moss-200/70 mt-1 mb-4">
            分類エンジンが決定的ルールで判定した4カテゴリの内訳です。
          </p>
          <ul className="flex flex-col gap-3.5">
            {result.categories.map((c) => {
              const pct = Math.round((c.amount / total) * 100);
              return (
                <li key={c.classification}>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={CLASSIFICATION_TONE[c.classification]}>
                        {CLASSIFICATION_LABEL_JA[c.classification]}
                      </span>
                      <span className="text-moss-200/70 text-xs">
                        {c.count}件
                      </span>
                    </div>
                    <span className="text-gold-300 text-sm">{jpy(c.amount)}</span>
                  </div>
                  <div className="mt-1.5 h-2 rounded bg-ink-700 overflow-hidden">
                    <div
                      className={barClass(c.classification)}
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Error code breakdown (top 8) */}
        <div className="card p-5">
          <h2 className="heading-2">エラーコード別（上位8）</h2>
          <p className="text-xs text-moss-200/70 mt-1 mb-4">
            金額の大きい順に表示しています。
          </p>
          <ul className="flex flex-col gap-2.5">
            {result.error_codes.slice(0, 8).map((e) => {
              const pct = Math.round((e.amount / maxCodeAmount) * 100);
              return (
                <li key={e.error_code}>
                  <div className="flex items-center justify-between text-sm gap-2">
                    <code className="text-moss-100 text-xs">{e.error_code}</code>
                    <div className="flex items-center gap-3">
                      <span className="text-moss-200/70 text-xs">{e.count}件</span>
                      <span className="text-gold-300 text-sm">{jpy(e.amount)}</span>
                    </div>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded bg-ink-700 overflow-hidden">
                    <div
                      className={barClass(e.classification)}
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Classified transaction table (preview) */}
      <section className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="heading-2">分類済み取引（先頭20件）</h2>
          <span className="text-xs text-moss-200/70">
            全{result.transactions.length}件中
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="text-left text-gold-400/80">
                <th className="py-2 pr-3 font-medium">Transaction</th>
                <th className="py-2 pr-3 font-medium">Code</th>
                <th className="py-2 pr-3 font-medium">Category</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium text-right">Attempts</th>
                <th className="py-2 pr-3 font-medium text-right">Amount</th>
                <th className="py-2 pr-3 font-medium">Owner</th>
              </tr>
            </thead>
            <tbody>
              {result.transactions.slice(0, 20).map((t) => (
                <tr
                  key={t.transaction_id}
                  className="border-t border-gold-500/5 text-moss-200"
                >
                  <td className="py-2 pr-3 font-mono text-[11px]">
                    {t.transaction_id}
                  </td>
                  <td className="py-2 pr-3">
                    <code className="text-moss-100 text-[11px]">
                      {t.error_code}
                    </code>
                  </td>
                  <td className="py-2 pr-3">
                    <span className={CLASSIFICATION_TONE[t.classification]}>
                      {CLASSIFICATION_LABEL_JA[t.classification]}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-moss-200/80">
                    {t.subscription_status}
                  </td>
                  <td className="py-2 pr-3 text-right">{t.attempt_count}</td>
                  <td className="py-2 pr-3 text-right text-gold-300">
                    {jpy(t.amount)}
                  </td>
                  <td className="py-2 pr-3 text-moss-200/80">{t.suggested_owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  suffix,
  tone,
}: {
  label: string;
  value: string;
  suffix?: string;
  tone: "gold" | "ok" | "danger" | "warn" | "muted";
}) {
  const valueClass = {
    gold: "text-gold-300",
    ok: "text-moss-200",
    danger: "text-danger",
    warn: "text-warn",
    muted: "text-moss-100",
  }[tone];
  return (
    <div className="card p-4">
      <div className="text-[11px] uppercase tracking-wider text-moss-200/70">
        {label}
      </div>
      <div className={`mt-2 text-xl font-semibold ${valueClass}`}>
        {value}
        {suffix && <span className="text-xs text-moss-200/60 ml-1">{suffix}</span>}
      </div>
    </div>
  );
}

function barClass(c: Classification): string {
  switch (c) {
    case "customer_action_required":
      return "h-full bg-gradient-to-r from-gold-500/80 to-gold-400";
    case "safe_retry_candidate":
      return "h-full bg-gradient-to-r from-moss-400 to-moss-300";
    case "do_not_retry":
      return "h-full bg-gradient-to-r from-danger/80 to-danger";
    case "manual_review":
      return "h-full bg-gradient-to-r from-warn/80 to-warn";
  }
}
