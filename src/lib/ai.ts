// Thin Azure OpenAI client with deterministic mock fallback.
// - If AZURE_OPENAI_* env vars are missing or the call fails, we return mocks.
// - We NEVER send raw CSV rows. Only aggregated summaries flow to the model.
// - All AI-written text MUST use cautious language and avoid forbidden claims.

import type {
  ActionItem,
  AnalysisResult,
  ExecutiveBriefing,
  PreventionSuggestion,
  RevenueImpact,
  Scenario,
  SupportDraft,
} from "./types";
import { SCENARIO_LABEL_JA, SCENARIO_TONE_JA } from "./scenario";

export type AiMode = "azure_openai" | "mock";

interface AzureEnv {
  endpoint: string;
  apiKey: string;
  deployment: string;
  apiVersion: string;
}

function readAzureEnv(): AzureEnv | null {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion =
    process.env.AZURE_OPENAI_API_VERSION || "2024-08-01-preview";
  if (!endpoint || !apiKey || !deployment) return null;
  return { endpoint, apiKey, deployment, apiVersion };
}

export function aiMode(): AiMode {
  return readAzureEnv() ? "azure_openai" : "mock";
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Single chat completion call. Returns the raw assistant text on success.
async function azureChat(messages: ChatMessage[], temperature = 0.3): Promise<string> {
  const env = readAzureEnv();
  if (!env) throw new Error("azure_openai_unconfigured");
  const url = `${env.endpoint.replace(/\/$/, "")}/openai/deployments/${env.deployment}/chat/completions?api-version=${env.apiVersion}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "api-key": env.apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      messages,
      temperature,
      max_tokens: 1200,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`azure_openai_error_${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("azure_openai_empty_response");
  return content;
}

// Shared system prompt: enforces tone, scope, and forbidden terms.
const SYSTEM_PROMPT_JA = `あなたはPayment Intelligence Agentの一部として動作するアシスタントです。
あなたの役割は、サブスクリプション事業者の決済エラー対応を支援するための日本語の文章を生成することです。

必ず守るルール:
- 「自動再請求」「完全自動回収」「回収保証」「AIが学習」「機械学習モデル」「高度なAIリトライ」「AIが売上を自動回収」などの表現は使用してはいけません。
- 推測の表現は「可能性があります」「候補として管理できます」「確認が必要です」「推奨されます」「担当者確認を前提とします」を優先して使用してください。
- 決済処理・リトライ実行・顧客への自動送信を本ツールが行うとは決して書かないでください。本ツールは分析と下書きのみを行います。
- 個人情報・カード番号・実在する企業名・サービス名（Visa、Cybersourceなど）を文章中に出してはいけません。
- 出力は簡潔で実務的なビジネス日本語で書いてください。`;

interface AiSummary {
  scenario: Scenario;
  revenue: RevenueImpact;
  categoryBreakdown: { classification: string; count: number; amount: number }[];
  topErrorCodes: { error_code: string; count: number; amount: number }[];
}

function summarizeForAi(result: Pick<AnalysisResult, "categories" | "error_codes" | "revenue" | "scenario">): AiSummary {
  return {
    scenario: result.scenario,
    revenue: result.revenue,
    categoryBreakdown: result.categories.map((c) => ({
      classification: c.classification,
      count: c.count,
      amount: c.amount,
    })),
    topErrorCodes: result.error_codes.slice(0, 8),
  };
}

function jpy(n: number): string {
  return `¥${n.toLocaleString("ja-JP")}`;
}

// -------- Mock generators (always safe to use) --------------------------------

function mockBriefing(s: AiSummary, items: ActionItem[]): ExecutiveBriefing {
  const high = items.filter((i) => i.priority === "high");
  const headline = `今月の決済エラー総額は${jpy(s.revenue.total_failed_amount)}、対応余地として${jpy(s.revenue.actionable_amount)}を整理しました。`;
  const risks: string[] = [];
  if (s.revenue.do_not_retry_amount > 0) {
    risks.push(
      `リトライ非推奨に該当する取引が${jpy(s.revenue.do_not_retry_amount)}あり、明確に除外する必要があります。`,
    );
  }
  if (s.revenue.customer_action_amount > 0) {
    risks.push(
      `顧客対応が必要な取引が${jpy(s.revenue.customer_action_amount)}あり、CS側でのコミュニケーション設計が推奨されます。`,
    );
  }
  if (high.length > 0) {
    risks.push(
      `優先度の高いアクションが${high.length}件あり、今週中の着手が推奨されます。`,
    );
  }

  const next = items.slice(0, 3).map((i) => `${i.title}（${i.owner}）`);
  const prevention =
    "次月に向けて、カード期限切れ前の案内タイミングの見直しと、繰り返し発生しているsoft declineの月次確認をワークフローに組み込むことを推奨します。";

  const tone = SCENARIO_TONE_JA[s.scenario];

  const md = [
    `# 今月の決済エラー対応レポート`,
    ``,
    `**Scenario:** ${SCENARIO_LABEL_JA[s.scenario]}`,
    ``,
    `## サマリー`,
    `- 決済エラー総額: **${jpy(s.revenue.total_failed_amount)}**`,
    `- 対応余地: **${jpy(s.revenue.actionable_amount)}**`,
    `- 顧客対応が必要: ${jpy(s.revenue.customer_action_amount)}`,
    `- リトライ非推奨: ${jpy(s.revenue.do_not_retry_amount)}`,
    ``,
    `## 主なリスク`,
    ...risks.map((r) => `- ${r}`),
    ``,
    `## 推奨される次の一手`,
    ...next.map((n) => `- ${n}`),
    ``,
    `## 次月の予防アクション`,
    `- ${prevention}`,
    ``,
    `## 方針メモ`,
    `${tone}`,
    ``,
    `_本ブリーフィングは分析結果に基づく下書きです。Payment Intelligence Agentは決済処理・リトライ実行・顧客への自動送信を行いません。_`,
  ].join("\n");

  return {
    headline,
    total_failed: jpy(s.revenue.total_failed_amount),
    actionable_opportunity: jpy(s.revenue.actionable_amount),
    customer_action_required: jpy(s.revenue.customer_action_amount),
    do_not_retry_risk: jpy(s.revenue.do_not_retry_amount),
    key_risks: risks,
    recommended_next_steps: next,
    prevention_outlook: prevention,
    markdown: md,
  };
}

function mockDrafts(
  errorCodeCounts: Map<string, number>,
): SupportDraft[] {
  const drafts: Omit<SupportDraft, "affected_count">[] = [
    {
      id: "draft_expired_card",
      category: "expired_card",
      subject: "【ご案内】お支払いカードのご更新のお願い",
      applies_to_error_codes: ["expired_card", "card_update_required"],
      body:
        `いつもご利用いただきありがとうございます。\n` +
        `お客様のお支払いに使用されているクレジットカードの有効期限切れにより、最新のお支払いが完了していない可能性がございます。\n\n` +
        `お手数をおかけいたしますが、マイページよりカード情報のご更新をお願いいたします。\n` +
        `ご不明な点がございましたら、本メールへの返信にてお問い合わせください。\n\n` +
        `※ 本メッセージは下書きであり、お客様への送信前に担当者の確認を必要とします。`,
    },
    {
      id: "draft_auth_required",
      category: "authentication_required",
      subject: "【ご案内】ご本人確認（3Dセキュア）のお願い",
      applies_to_error_codes: [
        "authentication_required",
        "card_declined_authentication",
      ],
      body:
        `いつもご利用いただきありがとうございます。\n` +
        `お支払い時にカード発行会社による本人認証が必要な可能性があるとの通知を確認しております。\n\n` +
        `マイページから再度お支払い画面にお進みいただき、表示される本人認証の手続きをお願いいたします。\n` +
        `本人認証の手続きが完了しない場合、お支払いが成立しない可能性があります。\n\n` +
        `※ 本メッセージは下書きであり、お客様への送信前に担当者の確認を必要とします。`,
    },
    {
      id: "draft_payment_method_required",
      category: "payment_method_required",
      subject: "【ご案内】お支払い方法のご登録のお願い",
      applies_to_error_codes: ["payment_method_required"],
      body:
        `いつもご利用いただきありがとうございます。\n` +
        `現在のアカウントに有効なお支払い方法が登録されていないため、お支払いが完了しておりません。\n\n` +
        `引き続きサービスをご利用いただくため、マイページよりお支払い方法のご登録をお願いいたします。\n\n` +
        `※ 本メッセージは下書きであり、お客様への送信前に担当者の確認を必要とします。`,
    },
    {
      id: "draft_generic_followup",
      category: "generic_payment_failure",
      subject: "【ご案内】お支払いに関するご確認のお願い",
      applies_to_error_codes: [
        "insufficient_funds",
        "do_not_honor",
        "generic_decline",
        "temporary_failure",
        "processing_error",
        "network_error",
        "issuer_unavailable",
      ],
      body:
        `いつもご利用いただきありがとうございます。\n` +
        `直近のお支払いが正常に完了していない可能性があることを確認しております。\n\n` +
        `お時間のあるときにマイページからお支払い状況をご確認いただけますと幸いです。\n` +
        `もし状況が解消されない場合は、本メールへの返信にてお知らせください。\n\n` +
        `※ 本メッセージは下書きであり、お客様への送信前に担当者の確認を必要とします。`,
    },
  ];

  return drafts.map((d) => {
    const count = d.applies_to_error_codes.reduce(
      (s, code) => s + (errorCodeCounts.get(code) ?? 0),
      0,
    );
    return { ...d, affected_count: count };
  });
}

function mockPrevention(s: AiSummary): PreventionSuggestion[] {
  const list: PreventionSuggestion[] = [
    {
      id: "prev_expired_card",
      title: "カード期限切れ前の案内タイミングを見直す",
      detail:
        "expired_card と card_update_required の合計件数が大きい場合、期限切れの30日前と7日前の二段階で案内する運用を検討できます。",
      area: "communication",
    },
    {
      id: "prev_soft_decline",
      title: "繰り返し発生しているsoft declineを月次で確認する",
      detail:
        "insufficient_funds や temporary_failure が同一顧客で繰り返している場合、案内タイミングと再請求間隔の見直し余地があります。",
      area: "operations",
    },
    {
      id: "prev_hard_decline",
      title: "hard declineをリトライ候補から明確に除外する",
      detail:
        "stolen_card / lost_card / fraudulent / invalid_card は、リトライ対象から自動的に除外するルールをワークフローに組み込むことを推奨します。",
      area: "operations",
    },
    {
      id: "prev_status_sync",
      title: "PSPと自社DBのステータス差分を定期確認する",
      detail:
        "PSP側で更新されたサブスク状態が自社DBに反映されていないと、リトライ判断にズレが生じます。日次の差分確認を業務化することを推奨します。",
      area: "data",
    },
    {
      id: "prev_monthly_review",
      title: "決済エラー月次レビューを業務フロー化する",
      detail:
        "Payment Intelligence Agentの月次出力をベースに、CS・Finance・Opsで30分のレビューを定例化することを推奨します。",
      area: "review",
    },
  ];
  // If do_not_retry total is zero, drop that one — but for the demo keep all.
  void s;
  return list;
}

// -------- Public functions -----------------------------------------------------

export async function generateBriefing(
  result: Pick<AnalysisResult, "categories" | "error_codes" | "revenue" | "scenario">,
  actionItems: ActionItem[],
): Promise<{ briefing: ExecutiveBriefing; used_ai: boolean }> {
  const summary = summarizeForAi(result);
  if (aiMode() === "mock") {
    return { briefing: mockBriefing(summary, actionItems), used_ai: false };
  }
  try {
    const user = `以下は決済エラー分析の集計結果です。経営者向けの1ページサマリー（Markdown）を生成してください。
- 見出し: 「今月の決済エラー対応レポート」
- 含める項目: 決済エラー総額、対応余地、顧客対応が必要、リトライ非推奨、主なリスク、推奨される次の一手、次月の予防アクション
- シナリオ「${SCENARIO_LABEL_JA[summary.scenario]}」のトーンを反映してください。
- 最後に「本ブリーフィングは下書きであり、決済処理・リトライ実行・顧客への自動送信は行いません」と明記してください。

集計データ:
${JSON.stringify(summary, null, 2)}

上位アクション候補:
${JSON.stringify(actionItems.slice(0, 5).map((i) => ({ title: i.title, priority: i.priority, owner: i.owner, count: i.affected_count, amount: i.estimated_amount })), null, 2)}`;
    const md = await azureChat([
      { role: "system", content: SYSTEM_PROMPT_JA },
      { role: "user", content: user },
    ]);
    // Build the structured fields from the deterministic data; only the markdown is from AI.
    const base = mockBriefing(summary, actionItems);
    return { briefing: { ...base, markdown: md }, used_ai: true };
  } catch (err) {
    console.error("[ai] briefing fallback to mock:", err);
    return { briefing: mockBriefing(summary, actionItems), used_ai: false };
  }
}

export async function generateDrafts(
  errorCodeCounts: Map<string, number>,
): Promise<{ drafts: SupportDraft[]; used_ai: boolean }> {
  // Drafts are deterministic by default — the wording is reviewed-and-blessed
  // text. AI optionally personalizes the tone but does not change the structure.
  const base = mockDrafts(errorCodeCounts);
  if (aiMode() === "mock") return { drafts: base, used_ai: false };
  try {
    const user = `以下のカテゴリごとに、サブスクリプション事業者の顧客向けに丁寧な日本語の下書きメッセージを生成してください。
- 件数: ${[...errorCodeCounts.entries()].map(([k, v]) => `${k}=${v}`).join(", ")}
- 形式: 各カテゴリについて、subject と body を分けて返してください。
- 必ず「本メッセージは下書きであり、お客様への送信前に担当者の確認を必要とします」を末尾に含めてください。
- カテゴリ: expired_card, authentication_required, payment_method_required, generic_payment_failure
- リトライの自動実行や、当社がお支払いを代行することなどは絶対に書かないでください。

JSON形式で {"drafts":[{"category":"...","subject":"...","body":"..."}]} で返してください。`;
    const text = await azureChat([
      { role: "system", content: SYSTEM_PROMPT_JA },
      { role: "user", content: user },
    ]);
    const json = extractJson(text);
    if (json && Array.isArray(json.drafts)) {
      const overrideMap = new Map<string, { subject: string; body: string }>();
      for (const d of json.drafts) {
        if (typeof d?.category === "string" && typeof d?.subject === "string" && typeof d?.body === "string") {
          overrideMap.set(d.category, { subject: d.subject, body: d.body });
        }
      }
      const enriched = base.map((d) => {
        const o = overrideMap.get(d.category);
        return o ? { ...d, subject: o.subject, body: o.body } : d;
      });
      return { drafts: enriched, used_ai: true };
    }
    return { drafts: base, used_ai: false };
  } catch (err) {
    console.error("[ai] drafts fallback to mock:", err);
    return { drafts: base, used_ai: false };
  }
}

export async function generatePrevention(
  result: Pick<AnalysisResult, "categories" | "error_codes" | "revenue" | "scenario">,
): Promise<{ prevention: PreventionSuggestion[]; used_ai: boolean }> {
  const summary = summarizeForAi(result);
  const base = mockPrevention(summary);
  if (aiMode() === "mock") return { prevention: base, used_ai: false };
  try {
    const user = `以下は決済エラー分析の集計結果です。次月以降に向けた再発防止アクションを最大5件、日本語で提案してください。
- 形式: JSON {"suggestions":[{"title":"...","detail":"...","area":"operations|data|communication|review"}]}
- 推奨内容のみを返し、自動実行や保証の表現は使用しないでください。
- 集計データ:
${JSON.stringify(summary, null, 2)}`;
    const text = await azureChat([
      { role: "system", content: SYSTEM_PROMPT_JA },
      { role: "user", content: user },
    ]);
    const json = extractJson(text);
    if (json && Array.isArray(json.suggestions) && json.suggestions.length > 0) {
      const list: PreventionSuggestion[] = (json.suggestions as Array<{
        title?: unknown;
        detail?: unknown;
        area?: unknown;
      }>)
        .slice(0, 5)
        .map((s, i): PreventionSuggestion => {
          const area: PreventionSuggestion["area"] =
            s.area === "operations" ||
            s.area === "data" ||
            s.area === "communication" ||
            s.area === "review"
              ? s.area
              : "operations";
          return {
            id: `prev_ai_${i}`,
            title: typeof s.title === "string" ? s.title : "",
            detail: typeof s.detail === "string" ? s.detail : "",
            area,
          };
        })
        .filter((s) => s.title.length > 0 && s.detail.length > 0);
      if (list.length > 0) return { prevention: list, used_ai: true };
    }
    return { prevention: base, used_ai: false };
  } catch (err) {
    console.error("[ai] prevention fallback to mock:", err);
    return { prevention: base, used_ai: false };
  }
}

function extractJson(text: string): Record<string, unknown> | null {
  // Try direct parse, then look for a fenced block, then first {...} block.
  try {
    return JSON.parse(text);
  } catch {
    /* fall through */
  }
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      /* ignore */
    }
  }
  const brace = text.match(/\{[\s\S]*\}/);
  if (brace) {
    try {
      return JSON.parse(brace[0]);
    } catch {
      /* ignore */
    }
  }
  return null;
}
