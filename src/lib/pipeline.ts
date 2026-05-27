// 7-agent orchestration. Rule-first; AI only enriches narrative fields.
// Deterministic pieces (safety, classification, revenue, action items) run first
// so the system stays predictable even if AI calls fail.

import { aggregateCategories, aggregateErrorCodes, buildActionItems, revenueImpact } from "./aggregate";
import { aiMode, generateBriefing, generateDrafts, generatePrevention } from "./ai";
import { buildTransaction } from "./classification";
import { parseCsv, safetyCheck } from "./csv";
import { reorderActions } from "./scenario";
import type {
  AgentRun,
  AnalysisResult,
  Scenario,
  Transaction,
} from "./types";

function newId(): string {
  // Short, URL-safe id. Crypto.randomUUID would also work in node 20+.
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${ts}_${rand}`;
}

function timed<T>(fn: () => T | Promise<T>): Promise<{ value: T; duration_ms: number }> {
  const start = Date.now();
  return Promise.resolve()
    .then(fn)
    .then((value) => ({ value, duration_ms: Date.now() - start }));
}

export interface RunOptions {
  scenario?: Scenario;
}

export async function runAnalysis(
  csvText: string,
  options: RunOptions = {},
): Promise<AnalysisResult> {
  const scenario: Scenario = options.scenario ?? "cx_first";
  const id = newId();
  const created_at = new Date().toISOString();
  const agent_runs: AgentRun[] = [];

  // ---- Agent 1: Safety -------------------------------------------------------
  const safetyTimed = await timed(() => {
    const parsed = parseCsv(csvText);
    const report = safetyCheck(parsed);
    return { parsed, report };
  });
  const { parsed, report: safety } = safetyTimed.value;

  if (safety.blocked) {
    agent_runs.push({
      agent: "safety",
      label_ja: "Safety Agent",
      label_en: "Safety Agent",
      status: "blocked",
      message_ja:
        safety.pan_like_detected
          ? "PANらしき値を検出したため、分析を停止しました。マスク済みのCSVをご利用ください。"
          : `必須カラムが不足しています: ${safety.missing_columns.join(", ")}`,
      duration_ms: safetyTimed.duration_ms,
      used_ai: false,
    });
    return {
      id,
      created_at,
      scenario,
      safety,
      transactions: [],
      categories: [],
      error_codes: [],
      revenue: {
        total_failed_amount: 0,
        actionable_amount: 0,
        customer_action_amount: 0,
        do_not_retry_amount: 0,
        manual_review_amount: 0,
        currency: "JPY",
        transaction_count: 0,
      },
      action_items: [],
      briefing: {
        headline: "分析は安全のため停止されました。",
        total_failed: "—",
        actionable_opportunity: "—",
        customer_action_required: "—",
        do_not_retry_risk: "—",
        key_risks: safety.notes,
        recommended_next_steps: [
          "マスク済みCSV（カード番号やCVCを含まないファイル）に差し替えてください。",
          "必須カラムが揃っているか確認してください。",
        ],
        prevention_outlook: "—",
        markdown: `# 分析停止\n\nSafety Agentが分析を停止しました。\n\n${safety.notes.map((n) => `- ${n}`).join("\n")}`,
      },
      drafts: [],
      prevention: [],
      agent_runs,
      ai_mode: aiMode(),
    };
  }

  agent_runs.push({
    agent: "safety",
    label_ja: "Safety Agent",
    label_en: "Safety Agent",
    status: "ok",
    message_ja: `PANらしき値は検出されませんでした。${safety.total_rows}件を対象に分析を継続します。`,
    duration_ms: safetyTimed.duration_ms,
    used_ai: false,
  });

  // ---- Agent 2: Classification -----------------------------------------------
  const classifyTimed = await timed(() => {
    const txs: Transaction[] = parsed.rows.map((r) =>
      buildTransaction({
        transaction_id: String(r.transaction_id ?? ""),
        customer_id: String(r.customer_id ?? ""),
        amount: Number(r.amount ?? 0) || 0,
        currency: String(r.currency ?? "JPY"),
        failed_at: String(r.failed_at ?? ""),
        error_code: String(r.error_code ?? "unknown")
          .toLowerCase()
          .trim(),
        error_message: String(r.error_message ?? ""),
        attempt_count: Number(r.attempt_count ?? 1) || 1,
        last_success_at: String(r.last_success_at ?? ""),
        subscription_status: String(r.subscription_status ?? "active")
          .toLowerCase()
          .trim(),
      }),
    );
    return txs;
  });
  const transactions = classifyTimed.value;

  const categories = aggregateCategories(transactions);
  agent_runs.push({
    agent: "classification",
    label_ja: "Classification Agent",
    label_en: "Classification Agent",
    status: "ok",
    message_ja: `${transactions.length}件の決済エラーを${categories.length}カテゴリに分類しました。`,
    duration_ms: classifyTimed.duration_ms,
    used_ai: false,
  });

  // ---- Agent 3: Revenue Impact -----------------------------------------------
  const revenueTimed = await timed(() => revenueImpact(transactions));
  const revenue = revenueTimed.value;
  const error_codes = aggregateErrorCodes(transactions);

  agent_runs.push({
    agent: "revenue_impact",
    label_ja: "Revenue Impact Agent",
    label_en: "Revenue Impact Agent",
    status: "ok",
    message_ja: `決済エラー総額 ¥${revenue.total_failed_amount.toLocaleString("ja-JP")} のうち、対応余地は ¥${revenue.actionable_amount.toLocaleString("ja-JP")} です。`,
    duration_ms: revenueTimed.duration_ms,
    used_ai: false,
  });

  // ---- Agent 4: Customer Recovery --------------------------------------------
  const customerActionCount = transactions.filter(
    (t) => t.classification === "customer_action_required",
  ).length;

  const errorCodeCounts = new Map<string, number>();
  for (const t of transactions) {
    errorCodeCounts.set(
      t.error_code,
      (errorCodeCounts.get(t.error_code) ?? 0) + 1,
    );
  }

  const draftsTimed = await timed(() => generateDrafts(errorCodeCounts));
  const draftsResult = draftsTimed.value;

  agent_runs.push({
    agent: "customer_recovery",
    label_ja: "Customer Recovery Agent",
    label_en: "Customer Recovery Agent",
    status: "ok",
    message_ja: `顧客対応が必要な${customerActionCount}件を抽出し、用途別の下書きを${draftsResult.drafts.length}件用意しました。`,
    duration_ms: draftsTimed.duration_ms,
    used_ai: draftsResult.used_ai,
  });

  // ---- Agent 5: Ops Task -----------------------------------------------------
  const opsTimed = await timed(() => buildActionItems(transactions));
  const baseActions = opsTimed.value;
  const action_items = reorderActions(baseActions, scenario);

  agent_runs.push({
    agent: "ops_task",
    label_ja: "Ops Task Agent",
    label_en: "Ops Task Agent",
    status: "ok",
    message_ja: `担当者向けの優先タスクを${action_items.length}件作成しました。優先度高: ${action_items.filter((a) => a.priority === "high").length}件。`,
    duration_ms: opsTimed.duration_ms,
    used_ai: false,
  });

  // ---- Agent 6: Executive Reporting (AI) -------------------------------------
  const briefingTimed = await timed(() =>
    generateBriefing(
      { categories, error_codes, revenue, scenario },
      action_items,
    ),
  );
  const briefingResult = briefingTimed.value;

  agent_runs.push({
    agent: "executive_reporting",
    label_ja: "Executive Reporting Agent",
    label_en: "Executive Reporting Agent",
    status: "ok",
    message_ja: briefingResult.used_ai
      ? "Azure OpenAIを用いて経営者向けブリーフィングを生成しました。"
      : "経営者向けブリーフィングを生成しました（mock応答）。",
    duration_ms: briefingTimed.duration_ms,
    used_ai: briefingResult.used_ai,
  });

  // ---- Agent 7: Prevention (AI) ----------------------------------------------
  const prevTimed = await timed(() =>
    generatePrevention({ categories, error_codes, revenue, scenario }),
  );
  const preventionResult = prevTimed.value;

  agent_runs.push({
    agent: "prevention",
    label_ja: "Prevention Agent",
    label_en: "Prevention Agent",
    status: "ok",
    message_ja: `次月の運用改善提案を${preventionResult.prevention.length}件作成しました。`,
    duration_ms: prevTimed.duration_ms,
    used_ai: preventionResult.used_ai,
  });

  return {
    id,
    created_at,
    scenario,
    safety,
    transactions,
    categories,
    error_codes,
    revenue,
    action_items,
    briefing: briefingResult.briefing,
    drafts: draftsResult.drafts,
    prevention: preventionResult.prevention,
    agent_runs,
    ai_mode: aiMode(),
  };
}

// Light reanalysis when only the scenario changes — avoids re-running AI calls.
export function applyScenario(
  result: AnalysisResult,
  scenario: Scenario,
): AnalysisResult {
  if (result.scenario === scenario) return result;
  return {
    ...result,
    scenario,
    action_items: reorderActions(result.action_items, scenario),
  };
}
