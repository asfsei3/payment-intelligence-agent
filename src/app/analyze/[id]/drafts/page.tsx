import { notFound } from "next/navigation";
import { getAnalysis } from "@/lib/store";
import { applyScenario } from "@/lib/pipeline";
import { AnalysisHeader } from "@/components/analysis-header";
import { AnalysisTabs } from "@/components/analysis-tabs";
import { DraftCopy } from "./draft-copy";
import type { Scenario } from "@/lib/types";

interface Props {
  params: { id: string };
  searchParams: { scenario?: string };
}

function isScenario(s: string | undefined): s is Scenario {
  return s === "cx_first" || s === "revenue_first" || s === "risk_min";
}

export default function DraftsPage({ params, searchParams }: Props) {
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
        <h2 className="heading-2">顧客対応下書き</h2>
        <p className="text-sm text-moss-200/80 mt-1 max-w-2xl">
          顧客対応が必要な取引向けに用意した下書きです。
          <span className="text-warn">
            Payment Intelligence Agentは顧客への自動送信を行いません。
          </span>
          担当者の確認を前提とした文面です。
        </p>
      </div>

      <section className="grid lg:grid-cols-2 gap-4">
        {result.drafts.map((d) => (
          <article key={d.id} className="card-elev p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-moss-100">
                  {d.subject}
                </h3>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-moss-200/70">
                  <span className="badge-muted">{d.category}</span>
                  <span>対象 {d.affected_count}件</span>
                </div>
              </div>
              <DraftCopy subject={d.subject} body={d.body} />
            </div>
            <pre className="text-[12px] leading-relaxed text-moss-200 whitespace-pre-wrap break-words font-sans bg-ink-900/60 rounded-md border border-gold-500/10 p-4">
              {d.body}
            </pre>
            <div className="text-[11px] text-moss-200/60">
              対応コード: {d.applies_to_error_codes.map((c) => (
                <code key={c} className="font-mono text-moss-200/80 mr-1">
                  {c}
                </code>
              ))}
            </div>
          </article>
        ))}
      </section>

      <p className="text-[11px] text-moss-200/60 leading-relaxed">
        この文面は担当者確認を前提とした下書きです。Payment Intelligence Agentは顧客への自動送信を行いません。
      </p>
    </div>
  );
}
