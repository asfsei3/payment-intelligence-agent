# 3-Minute Demo Script

> Microsoft Agent Hackathon 2026 — Payment Intelligence Agent
> Recording target: 3:00 (180 seconds)

## Setup

- Browser at the **landing page** (`/`).
- Sample CSV (80 rows) is bundled — no upload preparation needed.
- Network connection is optional. The demo works with `mock` AI mode.
- Window: at least 1280×800. Use the desktop layout.

## Timing

| Time | Section | Screen | Talking points |
| --- | --- | --- | --- |
| **0:00–0:20** | Problem | Landing page hero | サブスク事業者の決済エラー対応は、PSP管理画面・CSV・顧客対応・経営報告に分断されがちです。売上の取りこぼしの大きな要因が、この「断片化」です。 |
| **0:20–0:40** | Product | Landing page right column | Payment Intelligence Agentは、7つのAIエージェントが順に処理を進める **AI Revenue Ops Desk** です。安全確認から再発防止までを一気通貫で整理します。 |
| **0:40–1:10** | Upload & Safety | Click **「サンプルCSVで30秒デモを開始」** → Upload page | サンプルCSV80件を読み込みました。Safety Agentが事前にチェックします — PANらしき値が含まれていれば、ここで分析を停止します。今回は問題なし。**「分析を開始」**。 |
| **1:10–1:40** | Agent Timeline | `/analyze/[id]/timeline` | 7つのエージェントが順に動きます。各エージェントの所要時間・AI利用有無が記録されます。重要なのは **Rule-first, AI-assisted** という設計 — 分類や売上影響は決定的ルールで、AIは経営者向け文言と下書き生成だけに使います。 |
| **1:40–2:10** | Dashboard & Action Plan | `/analyze/[id]/dashboard` → `/action-plan` | カテゴリ別の売上影響と、優先度別のアクションプラン。各タスクには対象件数・推定金額・担当者・注意点まで自動でつきます。 |
| **2:10–2:35** | Executive Briefing & Drafts | `/briefing` (show copy buttons) → `/drafts` | 経営者向け1ページブリーフィングをAzure OpenAIで生成し、SlackやNotionにそのまま貼れる形でコピーできます。さらに、顧客対応の下書きメッセージも用意 — ただし **送信は行いません**。担当者確認を前提とした下書きです。 |
| **2:35–2:50** | Scenario Simulator | `/scenario` — click between 3 scenarios | 顧客体験重視・売上回収重視・リスク最小化の3シナリオで優先順位を切り替えできます。この設定は表示順と推奨文言だけを切り替え、決済処理やリトライ実行は行いません。 |
| **2:50–3:00** | Azure architecture & close | Architecture diagram (slide or README mermaid) | Azure Container Apps + Azure OpenAI (`gpt-4.1-mini`)、TPM上限と mock fallback でコストも安全に固定。Payment Intelligence Agent — 決済エラー対応を、AI Revenue Operations業務に。 |

## Script (read-aloud)

> サブスク事業者の決済エラー対応は、PSP管理画面、CSV、顧客対応、経営報告に分断されがちです。
> **Payment Intelligence Agent**は、これを7つのAIエージェントが一気通貫で整理する、AI Revenue Ops Deskです。
>
> サンプルCSV80件を読み込みます。Safety AgentがPANらしき値や必須カラムをチェックし、問題があれば分析を停止します。今回はOK。
>
> Agent Timelineで7つのエージェントが順に動きます。分類や売上影響は決定的ルールで処理し、AIは経営者向け文言・下書き生成だけに使う設計です。
>
> ダッシュボードでは、カテゴリ別の売上影響と、リトライ非推奨の取引が一目でわかります。
> Today's Action Planでは、優先度別に担当者と推定金額付きのタスクが並びます。
>
> 経営者向けブリーフィングは、SlackやNotionにそのまま貼れる形で書き出せます。
> 顧客対応の下書きメッセージも用意しています。ただし、本ツールは送信を行いません — 担当者確認を前提とした下書きです。
>
> Scenario Simulatorで、顧客体験重視・売上回収重視・リスク最小化の3シナリオを切り替えできます。
> あくまで表示順と文言の切り替えで、決済処理やリトライ実行は行いません。
>
> Azure Container AppsとAzure OpenAI (`gpt-4.1-mini`)で動作し、TPM上限とmock fallbackで課金リスクも構造的に抑えています。環境変数なしでも全機能が動作します。
> Payment Intelligence Agent — 決済エラー対応を、AI Revenue Operations業務に。

## Recording notes

- Use a clean browser profile (no extensions).
- Show network tab once at 1:10 to demonstrate that no PSP API is called.
- The Agent Timeline animates with ~700ms stagger; let it complete fully before moving on.
- The auto-advance from Timeline → Dashboard fires ~1.4s after the last agent reveal — you can preempt it with the **「ダッシュボードを見る」** button.
- After clicking through to `/drafts`, scroll to show all 4 drafts; emphasize the "送信を行いません" disclaimer.
- When showing the Scenario Simulator, click all 3 scenarios to demonstrate the live re-sort.
