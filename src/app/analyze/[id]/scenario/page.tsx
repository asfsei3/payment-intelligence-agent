import { notFound } from "next/navigation";
import { getAnalysis } from "@/lib/store";
import { applyScenario } from "@/lib/pipeline";
import { AnalysisHeader } from "@/components/analysis-header";
import { AnalysisTabs } from "@/components/analysis-tabs";
import { ScenarioSwitcher } from "@/components/scenario-switcher";
import {
  SCENARIO_DESCRIPTION_JA,
  SCENARIO_LABEL_JA,
  SCENARIO_TONE_JA,
  reorderActions,
} from "@/lib/scenario";
import type { Scenario } from "@/lib/types";

interface Props {
  params: { id: string };
  searchParams: { scenario?: string };
}

function isScenario(s: string | undefined): s is Scenario {
  return s === "cx_first" || s === "revenue_first" || s === "risk_min";
}

function jpy(n: number): string {
  return `¥${n.toLocaleString("ja-JP")}`;
}

const SCENARIOS: Scenario[] = ["cx_first", "revenue_first", "risk_min"];

export default function ScenarioPage({ params, searchParams }: Props) {
  const base = getAnalysis(params.id);
  if (!base) return notFound();
  const current: Scenario = isScenario(searchParams.scenario)
    ? searchParams.scenario
    : base.scenario;
  const result = applyScenario(base, current);

  return (
    <div className="flex flex-col gap-6 pt-2">
      <AnalysisHeader result={result} />
      <AnalysisTabs analysisId={result.id} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="heading-2">Scenario Simulator</h2>
          <p className="text-sm text-moss-200/80 mt-1 max-w-2xl">
            3つの方針で優先順位と推奨文言を切り替えて比較できます。
            この設定は表示順と推奨文言を切り替えるものであり、
            <span className="text-warn">決済処理やリトライ実行は行いません</span>。
          </p>
        </div>
        <ScenarioSwitcher current={current} />
      </div>

      <section className="grid lg:grid-cols-3 gap-4">
        {SCENARIOS.map((s) => {
          const active = s === current;
          const desc = SCENARIO_DESCRIPTION_JA[s];
          return (
            <div
              key={s}
              className={
                active
                  ? "card-elev p-5 border-gold-500/40"
                  : "card p-5 opacity-90"
              }
            >
              <div className="flex items-center gap-2">
                <span
                  className={
                    active ? "badge-gold" : "badge-muted"
                  }
                >
                  {SCENARIO_LABEL_JA[s]}
                </span>
                {active && <span className="text-[11px] text-gold-300">適用中</span>}
              </div>
              <p className="mt-3 text-sm text-moss-200 leading-relaxed">{desc}</p>
            </div>
          );
        })}
      </section>

      <section className="card-elev p-5">
        <h3 className="section-title">{SCENARIO_LABEL_JA[current]} のトーン</h3>
        <p className="text-moss-100 mt-2 leading-relaxed">
          {SCENARIO_TONE_JA[current]}
        </p>
      </section>

      {/* Side-by-side preview of top actions per scenario */}
      <section>
        <h3 className="heading-2 mb-3">シナリオ別 優先順位プレビュー</h3>
        <div className="grid lg:grid-cols-3 gap-4">
          {SCENARIOS.map((s) => {
            const items = reorderActions(base.action_items, s).slice(0, 5);
            const active = s === current;
            return (
              <div
                key={s}
                className={
                  active
                    ? "card-elev p-5 border-gold-500/30"
                    : "card p-5"
                }
              >
                <div className="flex items-center justify-between">
                  <span className={active ? "badge-gold" : "badge-muted"}>
                    {SCENARIO_LABEL_JA[s]}
                  </span>
                  <span className="text-[11px] text-moss-200/60">Top 5</span>
                </div>
                <ol className="mt-3 flex flex-col gap-2.5">
                  {items.map((a, i) => (
                    <li key={a.id} className="text-sm">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[11px] text-moss-200/60 tabular-nums">
                          {i + 1}.
                        </span>
                        <span className="text-moss-100 leading-snug">
                          {a.title}
                        </span>
                      </div>
                      <div className="ml-5 mt-0.5 text-[11px] text-moss-200/70">
                        {a.priority.toUpperCase()} · {a.owner} ·{" "}
                        <span className="text-gold-300">
                          {jpy(a.estimated_amount)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>
      </section>

      <p className="text-[11px] text-moss-200/60 leading-relaxed">
        この設定は表示順と推奨文言を切り替えるものであり、決済処理やリトライ実行は行いません。
      </p>
    </div>
  );
}
