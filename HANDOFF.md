# 📋 HANDOFF — 次のチャットへの引き継ぎ

> **新しいチャットを始めるときは、まずこのファイルを読んでください。**
> 現状・残作業・Azure リソース ID・コマンドの再現方法がすべてここに集約されています。

最終更新: **2026-05-28 (JST)**
作成: 前チャットの最終アクション

---

## 1. プロジェクト概要(60秒で把握)

**Payment Intelligence Agent** — Microsoft Agent Hackathon 2026 応募プロトタイプ。

- マスク済み決済エラーCSVを起点に、7つのAIエージェントが「安全確認 → 分類 → 売上影響 → 顧客対応 → 経営報告 → 再発防止」を 1 ワークフローで処理する Next.js 14 アプリ
- **Rule-first, AI-assisted** 設計: 分類・売上計算はルール、Azure OpenAI は文章生成のみ
- 決済処理・リトライ実行・顧客送信は **行わない** (Safety positioning)
- Azure Container Apps + Azure OpenAI(`gpt-4.1-mini`)で稼働中、mock fallback 完備

詳細は [README.md](README.md) と [CHANGELOG.md](CHANGELOG.md)。

---

## 2. 現状(Done)

### ✅ アプリ実装

- 9 ページ全実装(Landing / Upload / Timeline / Dashboard / Action Plan / Briefing / Scenario / Drafts / Prevention)
- 7-Agent パイプライン(`src/lib/pipeline.ts`)
- Azure OpenAI 統合 + mock fallback(`src/lib/ai.ts`)
- Scenario Simulator(3方針)
- サンプルCSV 80件(同梱)
- AI Orchestra ブランドカラー適用(forest green + champagne gold)
- Inter + Noto Sans JP フォント

### ✅ Azure デプロイ

- Subscription: `Azure subscription 1` (PAYG にアップグレード済み、spending limit OFF)
- Region: `japaneast`
- すべて Resource Group `pia-rg` 配下

### ✅ ドキュメント整備

- README.md / CHANGELOG.md / .env.example
- docs/ 配下 10 ファイル(architecture / prompts / deploy / 2種のdemo script / zenn 関連 2種 / submission 関連 2種 / screenshots / youtube)
- 禁止語スキャナ + CI: `npm run check:forbidden`

### ✅ Git

- ローカル git 初期化済み (`master` ブランチ, 初期コミット 1 個)
- リモート未設定 — GitHub push はユーザー側で
- `git config user.name "Sei"` / `user.email "sei@local"` でローカル設定済み(上書き推奨)

---

## 3. 本番URL とリソース ID

### 🔗 本番URL(審査員アクセス用)

```
https://pia-demo-51ff8c.bluebush-37a0c845.japaneast.azurecontainerapps.io
```

### Azure リソース(すべて `pia-rg` 配下、 `japaneast` 中心)

| 種類 | 名前 | リージョン | 用途 |
| --- | --- | --- | --- |
| Resource Group | `pia-rg` | japaneast | コンテナ |
| Container Apps Environment | `pia-env` | japaneast | 実行環境 |
| Container App | `pia-demo-51ff8c` | japaneast | アプリ本体 |
| Container Registry | `piaacr51ff8c` | japaneast | Docker イメージ(現在 `pia-app:v2` 配信中) |
| Azure OpenAI | `pia-aoai-51ff8c` | **eastus** | LLM |
| AOAI Deployment | `pia-gpt-4-1-mini` | (eastus) | gpt-4.1-mini v 2025-04-14, Standard SKU, TPM cap **30** |
| Log Analytics | (自動生成) | japaneast | Container Apps ログ |

### サブスクリプション情報

```
Subscription ID:  ce6705c9-6b70-4621-84cd-60ffb88c086d
Tenant:           Default Directory (routexteamoutlook.onmicrosoft.com)
User:             routex.team@outlook.com
Subscription:     Azure subscription 1 (PAYG, $200 Free Trial credit, spendingLimit Off)
```

### 一意ID由来

すべてのリソース名末尾 `51ff8c` は、初回プロビジョン時に `openssl rand -hex 3` で生成された短いハッシュ。`/tmp/pia-suffix.txt` に保存(ターミナル再起動で消える可能性、その時は再生成して 同じ値を使うために `echo "51ff8c" > /tmp/pia-suffix.txt`)。

---

## 4. ローカル環境 (Mac)

| 項目 | 値 |
| --- | --- |
| プロジェクト | `/Users/sei/Hackathon - Payment Intelligence Agent` |
| Node | 24.14 (v20+ で OK) |
| npm | 11.9 |
| Azure CLI | `/opt/homebrew/bin/az` (2.86.0、Homebrew 経由) |
| シェル | zsh (macOS デフォルト) |
| パスにスペース | あり(`Hackathon - Payment...`)→ Bashコマンドでは必ず引用符 |

### よく使うコマンド

```bash
# 開発
npm run dev                    # localhost:3000 (or 3001)
npm run build                  # production build (output: standalone)
npm run start                  # production server
npm run lint                   # ESLint
npm run check:forbidden        # 禁止語スキャナ
npm run sample:generate        # サンプルCSV再生成

# Azure CLI(brewでインストール済、PATH追加要)
export PATH="/opt/homebrew/bin:$PATH"
az account show

# 本番URL動作確認
curl -s -o /dev/null -w "%{http_code}\n" https://pia-demo-51ff8c.bluebush-37a0c845.japaneast.azurecontainerapps.io/
```

---

## 5. 再デプロイ手順(コード変更を反映)

```bash
cd "/Users/sei/Hackathon - Payment Intelligence Agent"
export PATH="/opt/homebrew/bin:$PATH"
SUFFIX=51ff8c    # 既存リソース名末尾
ACR_NAME="piaacr$SUFFIX"
APP_NAME="pia-demo-$SUFFIX"

# 1. ローカル検証
npm run build && npm run check:forbidden && npm run lint

# 2. ACR cloud build(新タグ。前回は v2、次は v3 など)
NEW_TAG="v3"
az acr build --registry "$ACR_NAME" --image "pia-app:$NEW_TAG" --file Dockerfile .

# 3. Container App をロール
az containerapp update --name "$APP_NAME" --resource-group "pia-rg" \
  --image "$ACR_NAME.azurecr.io/pia-app:$NEW_TAG"

# 4. 反映確認(30秒〜2分かかる)
URL="https://pia-demo-51ff8c.bluebush-37a0c845.japaneast.azurecontainerapps.io"
curl -s "$URL/" | grep -o "30秒デモを開始"
```

詳細手順: [docs/deploy-container-apps.md](docs/deploy-container-apps.md)

---

## 6. 残作業(ユーザー側)

提出までにユーザー側で必要な作業を **優先度順** に。

### 🔴 必須(これがないと提出できない)

1. **動画録画** ([docs/demo-recording-operator-script.md](docs/demo-recording-operator-script.md) の 33 カット表通り)
2. **YouTube アップロード**([docs/youtube-video-metadata.md](docs/youtube-video-metadata.md) のタイトル/説明文/タグをコピペ)
3. **Zenn 記事公開**([docs/zenn-publish-checklist.md](docs/zenn-publish-checklist.md) の TODO 5箇所を実URLに置換 → published: true)
4. **提出フォーム送信**([docs/submission-form-draft.md](docs/submission-form-draft.md) を見ながら転記)

### 🟡 推奨(質を上げる)

5. **GitHub リポジトリ作成 + push**(現在は local commit のみ)
   ```bash
   gh repo create payment-intelligence-agent --public --source=. --push
   # または
   git remote add origin git@github.com:<your-handle>/payment-intelligence-agent.git
   git push -u origin master
   ```
6. **Always-On 設定確認**(Container Apps は min=1 で常時稼働、特別な設定不要)
7. **スクリーンショット撮影**([docs/screenshots/README.md](docs/screenshots/README.md) を参照、Zenn記事に貼ると見栄えUP)
8. **モバイル目視確認**(Chrome DevTools の iPhone 13 サイズで Landing と Dashboard を見ておく)

### 🟢 オプション(時間があれば)

9. **動画字幕の手動修正**(YouTube 自動字幕は精度低め)
10. **コスト監視アラート設定**(Azure Portal で月 ¥3,000 アラート)

---

## 7. 残作業(チャットでやれること)

新しいチャットで以下を頼めば、私が引き続き対応できます:

- 「もう一度本番URLの全画面スクリーンショットを撮って見せて」(Chrome MCP)
- 「実装上の問題が見つかったから修正してデプロイし直して」(コード編集 + ACR build + containerapp update)
- 「コスト monitoring を仕込みたい」(Azure CLI で予算アラート作成)
- 「Zenn記事をレビューして」(read + 改善提案)
- 「提出直前の最終ダブルチェック」(全docs通読 + 整合性確認 + 禁止語スキャン)
- 「動画台本を見直したい」(demo-script の改善)

---

## 8. 重要な制約・注意点

### コスト

- **月見込み: 約 ¥5,800**(Container Apps + ACR + AOAI + Logs)
- **Free Trial 残クレジット: ¥30,500**(5ヶ月分の余裕)
- AOAI TPM 30K cap で課金暴走を構造的に防止 → 超えたら 429 → mock fallback
- 期日(2026-06-18)後は `az group delete --name pia-rg --yes --no-wait` ですべて消える

### セキュリティ

- API key は Container App **secret** として保存、env var は `secretref:aoai-key` で参照(平文露出なし)
- `.env.local` は `.gitignore` で除外済み、誤コミットしない
- 本リポジトリには実 API key を一切含めない

### 禁止語ポリシー

- `npm run check:forbidden` で常時クリーン保つ(現在: clean / 41 files / 8 allowlist)
- 「自動再請求」「回収保証」「AIが学習」など、UI/コードに混入させない
- ドキュメント内の参照(allowlist 8 ファイル)は許容

### 機能変更を加えるとき

- 必ず `npm run build` で型チェック → `npm run check:forbidden` → ACR build → Container App update
- `next.config.mjs` の `output: "standalone"` は **絶対に外さない**(Dockerfile が standalone 出力を前提)
- `src/lib/store.ts` の `globalThis` 経由ストアは Next.js dev mode 対策(消さない)
- ブランドカラー (`#1a4731`, `#c9a84c`) は `tailwind.config.ts` で集中管理

---

## 9. ファイル所在マップ

| 何を編集したい? | どのファイル |
| --- | --- |
| ランディングのコピー | `src/app/page.tsx` |
| アップロード画面の挙動 | `src/app/upload/upload-client.tsx` |
| Agent Timeline のアニメ | `src/app/analyze/[id]/timeline/timeline-client.tsx` |
| 各エージェントの動作 | `src/lib/pipeline.ts` |
| 分類ルール | `src/lib/classification.ts` |
| PAN 検出ロジック | `src/lib/csv.ts` |
| AI プロンプト | `src/lib/ai.ts`(`SYSTEM_PROMPT_JA` 等) |
| ブランドカラー | `tailwind.config.ts` |
| サンプルCSV | `sample/payment_failures_sample.csv` ← `scripts/generate-sample.mjs` から自動生成 |
| Zenn記事 | `docs/zenn-article-draft.md` |
| デプロイ手順 | `docs/deploy-container-apps.md` |

---

## 10. テストデータ

### 本番URLで使える操作

```bash
# 1. サンプルCSVを取得
curl -s https://pia-demo-51ff8c.bluebush-37a0c845.japaneast.azurecontainerapps.io/api/sample > sample.csv

# 2. 分析を実行(JSON で結果取得)
curl -X POST https://pia-demo-51ff8c.bluebush-37a0c845.japaneast.azurecontainerapps.io/api/analyze \
  -H "content-type: application/json" \
  -d "$(jq -n --arg csv "$(cat sample.csv)" '{csv: $csv, scenario: "cx_first"}')"

# 3. 既存分析の取得
curl -s https://pia-demo-51ff8c.bluebush-37a0c845.japaneast.azurecontainerapps.io/api/analysis/<ID>
```

### PAN 検出のテスト

```bash
echo 'transaction_id,customer_id,amount,currency,failed_at,error_code,error_message,attempt_count,last_success_at,subscription_status
txn_x,cus_x,1000,JPY,2026-05-01T00:00:00Z,expired_card,4242424242424242,1,2026-04-01T00:00:00Z,active' > /tmp/bad.csv

curl -X POST https://pia-demo-51ff8c.bluebush-37a0c845.japaneast.azurecontainerapps.io/api/analyze \
  -H "content-type: application/json" \
  -d "$(jq -n --arg csv "$(cat /tmp/bad.csv)" '{csv: $csv, scenario: "cx_first"}')" \
  | jq '.result.safety'
# → blocked: true, pan_like_detected: true が返る
```

---

## 11. このプロジェクトの「歴史」

時系列で何があったかは [CHANGELOG.md](CHANGELOG.md) を参照。主要な転換点:

- **v0.1.0** (2026-05-26): 初版 — Next.js 9 ページ + 7 エージェント + mock 動作確認
- **v0.2.0** (2026-05-27): 検収パスで UI 強化 + 禁止語スキャナ追加
- **v0.3.0** (2026-05-27): **App Service → Container Apps への pivot**(VM クォータ問題)
- **v0.4.0** (2026-05-27): AI Orchestra ブランド適用 + UX C(サンプル CSV 両立フロー)
- **v0.5.0** (2026-05-27): **Azure OpenAI 統合完了** + docs 全面整理 + CHANGELOG/HANDOFF 作成

---

## 12. 連絡・引き継ぎテンプレ

新しいチャットに頼むときの定型文:

```
Payment Intelligence Agent のプロジェクトを継続します。
プロジェクトパス: /Users/sei/Hackathon - Payment Intelligence Agent
HANDOFF.md を読んで現状を把握した上で、以下を頼みます:

<具体的な依頼>
```

「HANDOFF.md を読んで」が魔法のフレーズです。次のチャットがこのファイルを読めば、すぐに作業継続できます。

---

**おつかれさまでした。提出までもう少しです。** 🎯
