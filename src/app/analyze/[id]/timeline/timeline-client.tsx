"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AgentName, AgentRun } from "@/lib/types";

interface Props {
  analysisId: string;
  runs: AgentRun[];
  aiMode: "azure_openai" | "mock";
}

const AGENT_ICON: Record<AgentName, string> = {
  safety: "🛡",
  classification: "🧭",
  revenue_impact: "📊",
  customer_recovery: "✉",
  ops_task: "📋",
  executive_reporting: "📈",
  prevention: "🔁",
};

const AGENT_ROLE_JA: Record<AgentName, string> = {
  safety: "PANらしき値・必須カラムを確認",
  classification: "エラーコードを4カテゴリに分類",
  revenue_impact: "売上影響と対応余地を集計",
  customer_recovery: "顧客対応候補と下書きを生成",
  ops_task: "担当者向け優先タスクを作成",
  executive_reporting: "経営者向けブリーフィングを生成",
  prevention: "次月の運用改善提案を作成",
};

// Animate one agent reveal at a time; auto-advance to dashboard at the end.
export function TimelineClient({ analysisId, runs, aiMode }: Props) {
  const router = useRouter();
  const [revealed, setRevealed] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const reveal = (i: number, delay: number) => {
      const t = setTimeout(() => setRevealed(i + 1), delay);
      timersRef.current.push(t);
    };
    runs.forEach((_, i) => reveal(i, 700 + i * 650));
    return () => {
      for (const t of timersRef.current) clearTimeout(t);
      timersRef.current = [];
    };
  }, [runs]);

  useEffect(() => {
    if (revealed >= runs.length && autoAdvance) {
      const t = setTimeout(() => {
        router.push(`/analyze/${analysisId}/dashboard`);
      }, 1400);
      return () => clearTimeout(t);
    }
  }, [revealed, runs.length, autoAdvance, router, analysisId]);

  const done = revealed >= runs.length;

  return (
    <div className="card-elev p-5 md:p-7">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-xs text-moss-200">
          <span className="inline-flex items-center gap-2">
            <span
              className={
                done
                  ? "h-2 w-2 rounded-full bg-moss-300"
                  : "h-2 w-2 rounded-full bg-gold-400 animate-pulse-dot"
              }
            />
            {done ? "全エージェントが完了しました" : "処理中…"}
          </span>
          <span className="text-moss-200/60">·</span>
          <span className="text-moss-200/80">
            AI: {aiMode === "azure_openai" ? "Azure OpenAI" : "mock fallback"}
          </span>
        </div>
        {done && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoAdvance(false)}
              className="btn-ghost text-xs"
              hidden={!autoAdvance}
            >
              自動遷移を停止
            </button>
            <button
              type="button"
              onClick={() =>
                router.push(`/analyze/${analysisId}/dashboard`)
              }
              className="btn-primary text-xs px-3 py-1.5"
            >
              ダッシュボードを見る →
            </button>
          </div>
        )}
      </div>

      <ol className="relative">
        {/* vertical rail */}
        <span
          aria-hidden
          className="absolute left-[19px] top-3 bottom-3 w-px bg-gradient-to-b from-gold-500/30 via-moss-400/20 to-transparent"
        />
        {runs.map((r, i) => {
          const shown = i < revealed;
          const isActive = i === revealed - 1 && !done;
          const icon = AGENT_ICON[r.agent] ?? "•";
          return (
            <li
              key={r.agent}
              className={`relative pl-14 pr-2 py-3.5 ${
                shown ? "animate-fade-up" : "opacity-30"
              }`}
            >
              <span
                className={
                  isActive
                    ? "absolute left-0 top-2.5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500/15 border border-gold-500/60 text-lg shadow-glow animate-pulse-dot"
                    : shown
                      ? "absolute left-0 top-2.5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-moss-400/15 border border-moss-400/40 text-lg"
                      : "absolute left-0 top-2.5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-ink-700 border border-gold-500/10 text-lg grayscale opacity-50"
                }
              >
                {icon}
              </span>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-[10px] text-moss-200/60 font-mono">
                  #{String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-moss-100 font-medium">{r.label_ja}</span>
                {r.used_ai && (
                  <span className="badge-gold text-[10px]">
                    Azure OpenAI
                  </span>
                )}
                {!r.used_ai && shown && (
                  <span className="badge-muted text-[10px]">rule-based</span>
                )}
                {shown && (
                  <span className="ml-auto text-[11px] text-moss-200/60 tabular-nums">
                    {r.duration_ms}ms {shown && !isActive ? "✓" : ""}
                  </span>
                )}
              </div>
              <p
                className={
                  shown
                    ? "text-sm text-moss-200 leading-relaxed mt-0.5"
                    : "text-sm text-moss-200/40 leading-relaxed mt-0.5"
                }
              >
                {shown ? r.message_ja : "待機中…"}
              </p>
              {shown && (
                <p className="text-[11px] text-moss-200/55 mt-1">
                  {AGENT_ROLE_JA[r.agent]}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-5 pt-4 border-t border-gold-500/10 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-moss-200/70">
        <span>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold-300 mr-1.5 align-middle" />
          Azure OpenAI = AI生成
        </span>
        <span>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-moss-300 mr-1.5 align-middle" />
          rule-based = 決定的ルール
        </span>
        <span className="ml-auto text-moss-200/55">
          Rule-first, AI-assisted — 分類・売上影響はルール、文章生成のみAI
        </span>
      </div>
    </div>
  );
}
