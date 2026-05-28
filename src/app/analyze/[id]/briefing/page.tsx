import { notFound } from "next/navigation";
import { getAnalysis } from "@/lib/store";
import { applyScenario } from "@/lib/pipeline";
import { AnalysisHeader } from "@/components/analysis-header";
import { AnalysisTabs } from "@/components/analysis-tabs";
import { ScenarioSwitcher } from "@/components/scenario-switcher";
import { BriefingActions } from "./briefing-actions";
import type { Scenario } from "@/lib/types";

interface Props {
  params: { id: string };
  searchParams: { scenario?: string };
}

function isScenario(s: string | undefined): s is Scenario {
  return s === "cx_first" || s === "revenue_first" || s === "risk_min";
}

export default function BriefingPage({ params, searchParams }: Props) {
  const base = getAnalysis(params.id);
  if (!base) return notFound();
  const result = isScenario(searchParams.scenario)
    ? applyScenario(base, searchParams.scenario)
    : base;
  const b = result.briefing;

  return (
    <div className="flex flex-col gap-6 pt-2">
      <AnalysisHeader result={result} />
      <AnalysisTabs analysisId={result.id} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="heading-2">今月の決済エラー対応レポート</h2>
          <p className="text-sm text-moss-200/80 mt-1 max-w-2xl">
            Azure OpenAIを用いて生成した経営者向けの1ページサマリーです（mock応答もサポート）。
            内容はScenarioに応じてトーンが変化します。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ScenarioSwitcher current={result.scenario} />
          <BriefingActions markdown={b.markdown} />
        </div>
      </div>

      <section className="grid lg:grid-cols-4 gap-3">
        <BriefStat label="決済エラー総額" value={b.total_failed} />
        <BriefStat label="対応余地" value={b.actionable_opportunity} tone="gold" />
        <BriefStat label="顧客対応が必要" value={b.customer_action_required} />
        <BriefStat label="リトライ非推奨" value={b.do_not_retry_risk} tone="danger" />
      </section>

      <section className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
        <div className="card-elev p-6">
          <h3 className="section-title">ヘッドライン</h3>
          <p className="text-moss-100 mt-2 leading-relaxed">
            {b.headline}
          </p>

          <h3 className="section-title mt-6">主なリスク</h3>
          <ul className="mt-2 flex flex-col gap-2 text-sm text-moss-200">
            {b.key_risks.length === 0 ? (
              <li>—</li>
            ) : (
              b.key_risks.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-danger">•</span> {r}
                </li>
              ))
            )}
          </ul>

          <h3 className="section-title mt-6">推奨される次の一手</h3>
          <ul className="mt-2 flex flex-col gap-2 text-sm text-moss-200">
            {b.recommended_next_steps.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-gold-300">→</span> {r}
              </li>
            ))}
          </ul>

          <h3 className="section-title mt-6">次月の予防アクション</h3>
          <p className="mt-2 text-sm text-moss-200 leading-relaxed">
            {b.prevention_outlook}
          </p>
        </div>

        <div className="card p-5">
          <h3 className="section-title">Markdownプレビュー</h3>
          <pre className="mt-3 text-[11px] leading-relaxed text-moss-200 whitespace-pre-wrap break-words font-mono max-h-[480px] overflow-auto">
            {b.markdown}
          </pre>
        </div>
      </section>

      <p className="text-[11px] text-moss-200/60 leading-relaxed">
        本ブリーフィングは下書きです。Payment Intelligence Agentは決済処理・リトライ実行・顧客への自動送信を行いません。
      </p>
    </div>
  );
}

function BriefStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "gold" | "danger";
}) {
  const cls =
    tone === "gold"
      ? "text-gold-300"
      : tone === "danger"
        ? "text-danger"
        : "text-moss-100";
  return (
    <div className="card p-4">
      <div className="text-[11px] uppercase tracking-wider text-moss-200/70">
        {label}
      </div>
      <div className={`mt-2 text-lg font-semibold ${cls}`}>{value}</div>
    </div>
  );
}
