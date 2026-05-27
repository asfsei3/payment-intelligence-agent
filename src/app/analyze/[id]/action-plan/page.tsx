import { notFound } from "next/navigation";
import { getAnalysis } from "@/lib/store";
import { applyScenario } from "@/lib/pipeline";
import { AnalysisHeader } from "@/components/analysis-header";
import { AnalysisTabs } from "@/components/analysis-tabs";
import { ScenarioSwitcher } from "@/components/scenario-switcher";
import type { ActionItem, Scenario } from "@/lib/types";

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

const PRIORITY_LABEL_JA: Record<ActionItem["priority"], string> = {
  high: "High Priority",
  medium: "Medium Priority",
  low: "Low Priority",
};

const PRIORITY_BADGE: Record<ActionItem["priority"], string> = {
  high: "badge-danger",
  medium: "badge-gold",
  low: "badge-ok",
};

export default function ActionPlanPage({ params, searchParams }: Props) {
  const base = getAnalysis(params.id);
  if (!base) return notFound();
  const result = isScenario(searchParams.scenario)
    ? applyScenario(base, searchParams.scenario)
    : base;

  const groups: Record<ActionItem["priority"], ActionItem[]> = {
    high: [],
    medium: [],
    low: [],
  };
  for (const a of result.action_items) groups[a.priority].push(a);

  return (
    <div className="flex flex-col gap-6 pt-2">
      <AnalysisHeader result={result} />
      <AnalysisTabs analysisId={result.id} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="heading-2">Today&apos;s Action Plan</h2>
          <p className="text-sm text-moss-200/80 mt-1 max-w-2xl">
            分類エンジンの結果から自動生成した、本日着手可能なタスクです。
            並び順はシナリオに応じて切り替わります。
          </p>
        </div>
        <ScenarioSwitcher current={result.scenario} />
      </div>

      <section className="flex flex-col gap-6">
        {(Object.keys(groups) as ActionItem["priority"][]).map((p) => {
          const list = groups[p];
          if (list.length === 0) return null;
          return (
            <div key={p} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className={PRIORITY_BADGE[p]}>{PRIORITY_LABEL_JA[p]}</span>
                <span className="text-xs text-moss-200/70">{list.length}件</span>
              </div>
              <ul className="grid md:grid-cols-2 gap-3">
                {list.map((a, i) => (
                  <li key={a.id} className="card p-5 flex flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[11px] text-moss-200/60 tabular-nums">
                          #{i + 1}
                        </span>
                        <h3 className="text-base font-semibold text-moss-100">
                          {a.title}
                        </h3>
                      </div>
                      <span className="badge-muted whitespace-nowrap">
                        {a.owner}
                      </span>
                    </div>
                    <p className="text-sm text-moss-200 leading-relaxed">
                      {a.reason}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-moss-200/80 pt-1">
                      <span>対象 <span className="text-moss-100">{a.affected_count}件</span></span>
                      <span>·</span>
                      <span>
                        推定金額{" "}
                        <span className="text-gold-300">{jpy(a.estimated_amount)}</span>
                      </span>
                      <span>·</span>
                      <span className="font-mono text-[11px] text-moss-200/70">
                        {a.error_codes.join(", ")}
                      </span>
                    </div>
                    {a.caution && (
                      <p className="text-[11px] text-warn/90 border-t border-warn/20 pt-2 mt-1 leading-snug">
                        注意: {a.caution}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      <p className="text-[11px] text-moss-200/60 leading-relaxed">
        Payment Intelligence Agentは、ここで提案するアクションを自動実行しません。
        実際のリトライ・顧客への送信は担当者の確認後に既存ワークフローでご対応ください。
      </p>
    </div>
  );
}
