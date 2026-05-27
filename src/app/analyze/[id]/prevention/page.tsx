import { notFound } from "next/navigation";
import { getAnalysis } from "@/lib/store";
import { applyScenario } from "@/lib/pipeline";
import { AnalysisHeader } from "@/components/analysis-header";
import { AnalysisTabs } from "@/components/analysis-tabs";
import type { PreventionSuggestion, Scenario } from "@/lib/types";

interface Props {
  params: { id: string };
  searchParams: { scenario?: string };
}

function isScenario(s: string | undefined): s is Scenario {
  return s === "cx_first" || s === "revenue_first" || s === "risk_min";
}

const AREA_LABEL_JA: Record<PreventionSuggestion["area"], string> = {
  operations: "Operations",
  data: "Data",
  communication: "Communication",
  review: "Review",
};

const AREA_TONE: Record<PreventionSuggestion["area"], string> = {
  operations: "badge-gold",
  data: "badge-ok",
  communication: "badge-muted",
  review: "badge-warn",
};

export default function PreventionPage({ params, searchParams }: Props) {
  const base = getAnalysis(params.id);
  if (!base) return notFound();
  const result = isScenario(searchParams.scenario)
    ? applyScenario(base, searchParams.scenario)
    : base;

  return (
    <div className="flex flex-col gap-6 pt-2">
      <AnalysisHeader result={result} />
      <AnalysisTabs analysisId={result.id} />

      <div>
        <h2 className="heading-2">再発防止提案</h2>
        <p className="text-sm text-moss-200/80 mt-1 max-w-2xl">
          今月の傾向に基づく、次月以降に向けた運用改善提案です。
          いずれもPayment Intelligence Agentが自動実行するものではなく、社内の業務フローで運用することを想定しています。
        </p>
      </div>

      <section className="grid md:grid-cols-2 gap-4">
        {result.prevention.map((p) => (
          <article key={p.id} className="card-elev p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold text-moss-100 leading-snug">
                {p.title}
              </h3>
              <span className={AREA_TONE[p.area]}>{AREA_LABEL_JA[p.area]}</span>
            </div>
            <p className="text-sm text-moss-200 leading-relaxed">{p.detail}</p>
          </article>
        ))}
      </section>

      <p className="text-[11px] text-moss-200/60 leading-relaxed">
        提案はすべて推奨であり、担当者の判断・既存業務フローでの運用を前提としています。
      </p>
    </div>
  );
}
