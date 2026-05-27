# YouTube 動画アップロード用メタデータ

3分デモ動画を YouTube にアップする際の **タイトル / 説明文 / タグ / タイムスタンプ** のドラフト。
そのままコピペできる形で用意しています。

---

## A. タイトル候補(80字以内、SEO + クリック誘発)

### A-1 推奨

```
Payment Intelligence Agent — 決済エラー対応を7つのAIエージェントで整理する | Microsoft Agent Hackathon 2026
```

(67 字)

### A-2 シンプル版

```
【Microsoft Agent Hackathon 2026】Payment Intelligence Agent — AI Revenue Ops Desk のデモ
```

(68 字)

### A-3 ベネフィット強調版

```
サブスク決済エラー対応を、AI Revenue Ops 業務に。Payment Intelligence Agent デモ(3分)
```

(56 字)

→ **A-1 推奨**。ハッカソン名で検索される可能性 + 製品名 + 機能要約が揃う。

---

## B. 説明欄(YouTube description、5000字まで)

```
Payment Intelligence Agent — AI Revenue Ops Desk for subscription payment failures
Microsoft Agent Hackathon 2026 応募作品

▼ デモアプリ(認証不要・サンプルCSV同梱)
https://pia-demo-51ff8c.bluebush-37a0c845.japaneast.azurecontainerapps.io

▼ 解説記事(Zenn)
<公開後にURLを貼る>

▼ GitHub
<公開時にURLを貼る>

━━━━━━━━━━━━━━━━━━━━━━

🎯 解決したい課題

サブスクリプション事業者の決済エラー対応は、PSP管理画面・CSV・顧客対応・経営報告に分断されがちです。
この「断片化」が、Revenue Leakage の最大要因の一つだと考えました。

🤖 提供する解決策

マスク済み決済エラーCSV(同梱サンプル80件)を入力すると、7つのAIエージェントが順に処理:

1. Safety Agent — PANらしき値と必須カラムを検査(問題があれば分析を停止)
2. Classification Agent — エラーを4カテゴリに分類
3. Revenue Impact Agent — 売上影響と対応余地を集計
4. Customer Recovery Agent — 顧客対応下書きを生成(Azure OpenAI)
5. Ops Task Agent — 優先タスクを作成
6. Executive Reporting Agent — 経営者向けMarkdownブリーフィングを生成(Azure OpenAI)
7. Prevention Agent — 次月の運用改善提案を生成(Azure OpenAI)

📐 設計原則: Rule-first, AI-assisted

- 分類・売上計算・優先度判定は決定的ルール
- Azure OpenAIは経営者向け文章・推奨表現・下書きの生成のみ
- AIはルールベース分類を上書きしない
- AIへの送信は集計データのみ(行レベル個人識別子は送らない)

🛡 セーフティポジショニング

- 決済処理は行いません
- リトライ実行は行いません
- 顧客への自動送信は行いません
- マスク済みCSV前提(PANらしき値検出で分析停止)

🏗 技術スタック

- Next.js 14 (App Router, output: standalone) + TypeScript + Tailwind CSS
- Azure Container Apps(Linux, japaneast, min=max=1 replica)
- Azure Container Registry + ACR Tasks(クラウドビルド、ローカルDocker不要)
- Azure OpenAI (gpt-4.1-mini, TPM cap 30K で課金保護)
- Inter + Noto Sans JP (next/font/google)

━━━━━━━━━━━━━━━━━━━━━━

🎬 タイムスタンプ

0:00 イントロ・課題提起
0:20 プロダクト紹介・AI Revenue Ops Desk
0:40 サンプルCSVアップロード + Safety Agent
1:10 Agent Timeline — 7エージェント順次処理
1:40 ダッシュボード + Today's Action Plan
2:10 経営ブリーフィング + 顧客対応下書き
2:35 Scenario Simulator(3方針の優先順位切替)
2:50 Azure構成・クロージング

━━━━━━━━━━━━━━━━━━━━━━

⚠️ 本ツールは決済処理・リトライ実行・顧客への自動送信を行いません。
マスク済みCSVを分析し、推奨と下書きを生成するのみのプロトタイプです。

#MicrosoftAgentHackathon2026 #AzureOpenAI #AIエージェント #RevenueOperations #決済 #サブスク #Nextjs #TypeScript #Azure
```

---

## C. YouTube タグ(15個推奨、各 30 字以内)

```
Microsoft Agent Hackathon 2026
Azure OpenAI
AIエージェント
Multi-Agent Workflow
Revenue Operations
決済エラー
サブスクリプション
Azure Container Apps
Next.js
TypeScript
gpt-4.1-mini
ハッカソン
Rule-first AI-assisted
Payment Intelligence Agent
Japanese AI Demo
```

---

## D. タイムスタンプ(動画内チャプター用)

YouTube は **タイトル付きタイムスタンプを説明欄に書くと自動でチャプター化** されます。`0:00 - イントロ` 形式で書くだけ。

```
0:00 イントロ — 課題提起
0:20 プロダクト紹介
0:40 サンプルCSVアップロード
1:10 Agent Timeline
1:40 ダッシュボード + Action Plan
2:10 経営ブリーフィング + 顧客対応下書き
2:35 Scenario Simulator
2:50 Azure構成・クロージング
```

(上の説明欄テキストにも含めてあります)

---

## E. サムネイル文言案(画像生成 or 既存画像オーバーレイ用)

サムネを別途作る場合の文字要素案。1440 × 1080 px (16:9 比) で。

### Layout A: タイトル前面

```
Payment Intelligence Agent
─────
決済エラー対応を、AI Revenue Ops Desk に。
─────
7つの AI エージェントで、1ワークフローに。
─────
Microsoft Agent Hackathon 2026
```

カラー: 背景 `#0d2b1e` / アクセント `#c9a84c` / テキスト `#e8efe9`

### Layout B: スクリーンショット背景 + バッジ

ランディング or ブリーフィング画面を半透明オーバーレイ + 右上に「Microsoft Agent Hackathon 2026」金色バッジ + 左下にタイトル

→ `docs/screenshots/01-landing.png` または `06-briefing.png` をベースに

### Layout C: AI エージェントアイコン並び

🛡 🧭 📊 ✉ 📋 📈 🔁 を横一列で、その下にタイトル

→ Agentic 感を一目で伝えられる

---

## F. 公開設定

| 項目 | 推奨値 |
| --- | --- |
| 公開設定 | **限定公開**(URL を知っている人のみ。ハッカソン提出には十分) or 公開 |
| カテゴリ | 科学と技術 |
| 言語 | 日本語 |
| 字幕 | 自動生成で可(時間あれば手動修正で精度UP) |
| 子供向けか | いいえ |
| コメント | 許可(任意) |

---

## G. 公開直後の確認

- [ ] 動画URL が シークレットウィンドウで再生できる
- [ ] スマホでも再生できる
- [ ] チャプター(タイムスタンプ)が動画再生バーに反映されている
- [ ] サムネが意図通り表示されている
- [ ] 説明欄のリンクがクリック可能
- [ ] 動画URLを `docs/zenn-publish-checklist.md` の差し替え対象としてメモ

---

## H. このファイルの使い方

1. 動画録画完了
2. YouTube Studio で新規アップロード
3. 上の A-1 タイトルをコピー → 貼り付け
4. 上の B 説明文をコピー → 貼り付け(URL 3 箇所は実値に置換)
5. 上の C タグから 15 個コピー → 貼り付け
6. サムネは E のレイアウトを参考にデザイン(または `docs/screenshots/01-landing.png` をそのまま使用)
7. 公開設定 = 限定公開 → 公開
8. 動画URLを Zenn 記事と提出フォームに転記
