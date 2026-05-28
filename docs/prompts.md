# Prompt Design

Payment Intelligence Agent uses **three** Azure OpenAI prompts. All share a system prompt that enforces tone, scope, and forbidden-term avoidance.

## 1. Shared system prompt (Japanese)

```
あなたはPayment Intelligence Agentの一部として動作するアシスタントです。
あなたの役割は、サブスクリプション事業者の決済エラー対応を支援するための日本語の文章を生成することです。

必ず守るルール:
- 「自動再請求」「完全自動回収」「回収保証」「AIが学習」「機械学習モデル」「高度なAIリトライ」「AIが売上を自動回収」などの表現は使用してはいけません。
- 推測の表現は「可能性があります」「候補として管理できます」「確認が必要です」「推奨されます」「担当者確認を前提とします」を優先して使用してください。
- 決済処理・リトライ実行・顧客への自動送信を本ツールが行うとは決して書かないでください。本ツールは分析と下書きのみを行います。
- 個人情報・カード番号・実在する企業名・サービス名(Visa、Cybersourceなど)を文章中に出してはいけません。
- 出力は簡潔で実務的なビジネス日本語で書いてください。
```

## 2. What we DO send

Only aggregated, de-identified summaries:

```jsonc
{
  "scenario": "cx_first",                          // selected priority mode
  "revenue": {
    "total_failed_amount": 629540,
    "actionable_amount": 377300,
    "customer_action_amount": 290800,
    "do_not_retry_amount": 80100,
    "manual_review_amount": 181340,
    "currency": "JPY",
    "transaction_count": 80
  },
  "categoryBreakdown": [
    { "classification": "customer_action_required", "count": 35, "amount": 290800 },
    { "classification": "safe_retry_candidate",     "count": 20, "amount":  86500 },
    { "classification": "manual_review",            "count": 15, "amount": 181340 },
    { "classification": "do_not_retry",             "count": 10, "amount":  80100 }
  ],
  "topErrorCodes": [
    { "error_code": "expired_card",                  "count": 15, "amount": 110200, "classification": "customer_action_required" },
    { "error_code": "do_not_honor",                  "count":  8, "amount":  98400, "classification": "manual_review" },
    /* ...up to 8 entries */
  ]
}
```

## 3. What we DO NOT send

- **Raw CSV rows** — never sent
- **Customer identifiers** (`customer_id`) — never sent
- **Transaction identifiers** (`transaction_id`) — never sent
- **Timestamps** (`failed_at`, `last_success_at`) — never sent
- **Error messages** (`error_message`) — never sent
- **Anything that could re-identify a customer**

## 4. Prompt 1 — Executive Briefing

```
以下は決済エラー分析の集計結果です。経営者向けの1ページサマリー(Markdown)を生成してください。
- 見出し: 「今月の決済エラー対応レポート」
- 含める項目: 決済エラー総額、対応余地、顧客対応が必要、リトライ非推奨、主なリスク、推奨される次の一手、次月の予防アクション
- シナリオ「{scenario_label_ja}」のトーンを反映してください。
- 最後に「本ブリーフィングは下書きであり、決済処理・リトライ実行・顧客への自動送信は行いません」と明記してください。

集計データ:
{aggregated_json}

上位アクション候補:
{action_items_json}
```

**Trust boundary:** Only the Markdown body is taken from the model. The structured numbers (`total_failed`, `actionable_opportunity` etc.) are filled from deterministic data even when AI is used. This prevents number hallucination.

## 5. Prompt 2 — Customer Support Drafts

```
以下のカテゴリごとに、サブスクリプション事業者の顧客向けに丁寧な日本語の下書きメッセージを生成してください。
- 件数: {error_code_counts}
- 形式: 各カテゴリについて、subject と body を分けて返してください。
- 必ず「本メッセージは下書きであり、お客様への送信前に担当者の確認を必要とします」を末尾に含めてください。
- カテゴリ: expired_card, authentication_required, payment_method_required, generic_payment_failure
- リトライの自動実行や、当社がお支払いを代行することなどは絶対に書かないでください。

JSON形式で {"drafts":[{"category":"...","subject":"...","body":"..."}]} で返してください。
```

**Trust boundary:** Even if AI returns a draft, we only override `subject` and `body`. `category`, `applies_to_error_codes`, and `affected_count` come from deterministic mapping. Pre-blessed fallback templates are used if the AI's JSON is malformed or absent.

## 6. Prompt 3 — Prevention Suggestions

```
以下は決済エラー分析の集計結果です。次月以降に向けた再発防止アクションを最大5件、日本語で提案してください。
- 形式: JSON {"suggestions":[{"title":"...","detail":"...","area":"operations|data|communication|review"}]}
- 推奨内容のみを返し、自動実行や保証の表現は使用しないでください。
- 集計データ:
{aggregated_json}
```

**Trust boundary:** `area` is validated against a whitelist of 4 values; out-of-spec values are mapped to `"operations"`. Items with empty `title` or `detail` are dropped.

## 7. Fallback strategy

```
                       AZURE_OPENAI_* set?
                                |
                       +--------+--------+
                       | yes             | no
                       v                 v
                   call Azure         use mock
                       |
                   success?
                       |
                +------+------+
                | yes         | no
                v             v
            use response   use mock
            (with trust    (logged to
             boundaries)    server console)
```

Every AI-powered agent records `used_ai: true|false` in its `AgentRun`. The UI surfaces this so the operator always knows whether they're looking at live AI output or the deterministic template.

## 8. Why this design

| Design choice | Why |
| --- | --- |
| System prompt is the rulebook | We want forbidden terms blocked even if a future prompt is added carelessly. |
| Structured numbers from deterministic code | Number hallucination would be a credibility-killer in a Revenue Ops tool. |
| JSON-only outputs where possible | Easier to validate and reject malformed AI responses. |
| Pre-blessed templates as fallback | The mock isn't a stub — it's the canonical wording the AI is asked to refine. Demo quality is identical. |
| `used_ai` exposed in the UI | Operators must always know whether what they see is from the model or the template. Transparency builds trust. |
