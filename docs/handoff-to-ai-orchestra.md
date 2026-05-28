# Payment Intelligence Agent → ai-orchestra 連携メモ

このハッカソンプロトタイプ(`/Users/sei/Hackathon - Payment Intelligence Agent`)から、本事業 `/Users/sei/ai-orchestra` に「持っていく価値があるもの・無いもの」の棚卸し。

## 結論

**本事業の方が遥かに先に進んでいる。** ハッカソンは「**UI/UX の見せ方アイデア集**」として持ち帰るのが正解。バックエンドロジックを移植するのではなく、**3つの UX パターンだけ**を ai-orchestra 側にプラグインする。

| 項目 | ai-orchestra(本事業)| ハッカソン(プロト)| 移植可否 |
|---|---|---|---|
| CSVインポート/分類/レポート | 5 PSP対応・本番稼働 | サンプル80行のみ | ❌ ai-orchestra が上位互換 |
| AI下書き(CS文面)| Gemini で実装済 (`/src/routes_v2/ai_final.js`) | Azure OpenAI gpt-4.1-mini | ❌ 既存で十分 |
| 経営ブリーフィング | サービスあり | UI実装あり | △ UI のみ参考 |
| **7エージェント Timeline UI** | 無し(モノリシック) | あり | ✅ **持っていく** |
| **シナリオシミュレータ** | 無し | あり | ✅ **持っていく** |
| **再発防止エージェント画面** | バックエンドに stub のみ | UI 実装あり | ✅ **持っていく** |
| 課金/プラン/PSP連携 | Stripe Checkout + 4PSP本番 | 無し | ❌ ai-orchestra のみ |
| 技術スタック | Express + 静的HTML | Next.js 14 + TS + Tailwind | — |

## 持っていく価値があるもの(3点)

### 1. Agent Timeline UI(7エージェント順次実行の可視化)
- **ハッカソン側のソース**: [src/app/analyze/[id]/timeline/](../src/app/analyze/[id]/timeline/)
- **ai-orchestra 側のターゲット**: `/public/dashboard.html` の上部に「処理フロー」セクションを追加 / または Next.js移行する場合は `/src/components/agent-timeline.tsx`
- **価値**: 「AIが何をしているか」を顧客に見せる説明資料。SaaS の解約抑止/プレミアム感の演出に効く
- **実装メモ**: バックエンドは既存の `csv-import.service.js → classifier.service.js → recovery-report.service.js → ai-insights.service.js` の流れに「エージェント名」を意味付けるだけでOK。新規ロジック不要

### 2. シナリオシミュレータ(優先順位の即時並び替え)
- **ハッカソン側のソース**: [src/app/analyze/[id]/action-plan/](../src/app/analyze/[id]/action-plan/) と [src/lib/scenario.ts](../src/lib/scenario.ts)
- **ai-orchestra 側のターゲット**: 新規 `/api/scenario/reorder` エンドポイント + ダッシュボード上のトグル
- **価値**: 「経理優先」「CS優先」「金額優先」で同じデータから違う Today's Plan が出るのは商談で強い

### 3. 再発防止エージェント(briefing 画面)
- **ハッカソン側のソース**: [src/app/analyze/[id]/briefing/page.tsx](../src/app/analyze/[id]/briefing/page.tsx) と [src/lib/ai.ts](../src/lib/ai.ts) の prevention 生成部
- **ai-orchestra 側のターゲット**: `/src/services/ai-insights.service.js` の `generateOpsRecommendations()` stub を埋める + `/public/briefing.html` 新規
- **価値**: 既存ユーザーから見て「次月への打ち手」が見える = リテンション施策。AI_STRATEGY と方針一致

## 持っていかないもの(明示)

- **AI バックエンド** (Azure OpenAI): ai-orchestra は Gemini で動いている。LLM 切り替えは別議論
- **In-memory store** ([src/lib/store.ts](../src/lib/store.ts)): プロセス再起動で消える。ai-orchestra は既に JSON/SQLite 永続化済み
- **デモ動画スクリプト** ([docs/demo-script-v3.md](demo-script-v3.md)): ハッカソン審査用、本事業では不要
- **競合比較スライド** (海外/日本): ハッカソン文脈用

## Claude Code セッション用プロンプト(ai-orchestra リポジトリで使う)

```
/Users/sei/Hackathon - Payment Intelligence Agent/docs/handoff-to-ai-orchestra.md
を読んでから、「Agent Timeline UI」を ai-orchestra の dashboard.html に組み込みたい。

ハッカソン側の実装は src/app/analyze/[id]/timeline/page.tsx (Next.js/React)。
ai-orchestra は Express + 静的HTMLなので、vanilla JS + CSS で再実装する。

ステップ:
1. ハッカソンの timeline/page.tsx と関連 CSS を読んで、UI 仕様を抽出
2. ai-orchestra 側 /public/dashboard.html の上部に「処理フロー」セクション追加箇所を特定
3. 7エージェント名(安全確認/分類/売上影響/顧客対応/タスク化/経営報告/再発防止)を
   既存サービス(csv-import/classifier/recovery-report/ai-insights)にマッピングし、
   どのタイミングで「完了」状態にするか整理
4. 実装案を提示(PR を作る前にレビュー)
```

## 補足: アーキテクチャ的な提案

中長期では **ai-orchestra のフロントエンドを Next.js に移行**するのが筋。理由:
- 240KB の `dashboard.html` 単一ファイルは保守が辛い
- TS 型 + コンポーネント分割で機能追加コストが下がる
- ハッカソンの UI 資産をそのまま再利用できる

ただし営業稼働中の SaaS なので、**移行は段階的に**:
1. まず Agent Timeline / Scenario Simulator / Prevention をハッカソンと同じ Next.js で別アプリとして立てる(本事業の `/preview/` ルートなど)
2. 既存ユーザーへ「新ダッシュボード preview」として案内
3. フィードバックで詰めてから本ダッシュボードを置き換え
