# Changelog

Payment Intelligence Agent の変更履歴。提出までのスナップショットを時系列で記録します。

書式は [Keep a Changelog](https://keepachangelog.com/) を参考に、ハッカソン提出向けに簡略化。
日付は JST。

---

## [v0.5.0] — 2026-05-27 (現在)

### Added

- **Azure OpenAI 統合**: 本番 Container App に環境変数を設定し、ライブ呼び出し動作確認
- **CHANGELOG.md**: 本ファイル(変更履歴)
- **docs 再編**: Container Apps 現実に合わせて全面リライト

### Changed

- **デプロイ先**: Azure App Service → **Azure Container Apps**(App Service の VM クォータがゼロのため pivot。Container Apps は別クォータ系統で即時動作)
- **`docs/azure-deploy-final.md` → `docs/deploy-container-apps.md`**(中身も Container Apps 用に書き直し)
- **`README.md` のデプロイ章 / アーキテクチャ章**: Container Apps + ACR の実構成を反映
- **`docs/architecture.md`**: Azure サブグラフを `Container Apps` + `Container Registry` に更新
- **`docs/zenn-article-draft.md` のセクション 7「Azure構成」**: 同上
- **`docs/submission-form-draft.md` の D-1「Azure サービス」**: 同上

### Removed

- なし(`docs/azure-deploy-final.md` は rename によりファイル名のみ変更)

---

## [v0.4.0] — 2026-05-27

### Added

- **AI Orchestra ブランド適用**: フォレストグリーン (#1a4731) + シャンパンゴールド (#c9a84c) のカラーパレットに移行。フォントは Inter + Noto Sans JP を `next/font/google` 経由で導入
- **UX C(サンプルCSV両立フロー)**:
  - ランディングに「↓ サンプルCSVをダウンロード」ボタン追加(2箇所)
  - `/api/sample?download=1` で `Content-Disposition: attachment` を返す
  - `/upload?sample=1` で「自動読み込みしました」のバナー表示
  - ユーザーがファイル差し替えるとバナー消滅
- **本番 URL 確定** (Container Apps): `https://pia-demo-51ff8c.bluebush-37a0c845.japaneast.azurecontainerapps.io`

### Changed

- `tailwind.config.ts`: 色トークン全更新 (ink / gold / danger)
- `src/app/layout.tsx`: `next/font/google` で Inter + Noto Sans JP を CSS 変数化
- `src/app/globals.css`: 背景グラデーション色を新ブランドに合わせる

---

## [v0.3.0] — 2026-05-27

### Added

- **Azure Container Apps へのデプロイ完了**: `pia-demo-51ff8c` (japaneast, B1-equivalent Consumption profile, min=max=1 replica)
- **Dockerfile** (Next.js 14 standalone, multi-stage Alpine, 非root実行)
- **`.dockerignore`** (node_modules, .next, .git, docs 除外)
- **`public/` ディレクトリ** (Next.js Dockerfile の `COPY --from=builder /app/public` を成立させるための空ディレクトリ)
- **ACR (`piaacr51ff8c.azurecr.io`)** に `pia-app:v1` / `pia-app:v2` をクラウドビルド(ローカル Docker 不要)

### Changed

- `next.config.mjs`: `output: "standalone"` を追加(コンテナ向け軽量ビルド)

### Removed

- なし

---

## [v0.2.0] — 2026-05-27

### Added

- **検収パスの修正一式** (UI 強化、Azure 対応、Zenn 記事補完、禁止語スキャナ、デモ収録台本、提出フォームドラフト)
- **`docs/azure-deploy-final.md`** (この時点では App Service 想定)
- **`docs/zenn-publish-checklist.md`** (公開前 TODO 一覧)
- **`docs/demo-recording-operator-script.md`** (33カット秒単位の操作台本)
- **`docs/submission-form-draft.md`** (提出フォーム用ドラフト群)
- **`scripts/check-forbidden-terms.mjs`** + `npm run check:forbidden`(禁止語スキャナ、CI 用)
- **`.env.example`**: コメント拡充
- **ランディング刷新**: 「30秒で見える流れ」4ステップ、「行いません」赤カード、ハッカソン審査員向け末尾CTA
- **Agent Timeline**: 各エージェントに専用アイコン(🛡 🧭 📊 ✉ 📋 📈 🔁)、フッターに凡例「Rule-first, AI-assisted」

### Changed

- `package.json`: `engines.node >= 20.0.0` 追加、`sample:generate` / `check:forbidden` スクリプト追加
- `src/lib/store.ts`: `globalThis` 経由でモジュール間共有(Next.js dev mode 対策)

### Fixed

- `src/lib/classification.ts`: `"自動再請求"` という禁止語を含む説明文を書き換え

---

## [v0.1.0] — 2026-05-26 (初版)

### Added

- **Next.js 14 + TypeScript + Tailwind プロジェクトをゼロから構築**
- **9 ページ**: Landing / Upload / Agent Timeline / Dashboard / Action Plan / Briefing / Scenario / Drafts / Prevention
- **7-Agent パイプライン** (`src/lib/pipeline.ts`):
  1. Safety Agent — PAN(Luhn)+必須カラム検査
  2. Classification Agent — 4カテゴリ分類
  3. Revenue Impact Agent — 売上影響集計
  4. Customer Recovery Agent — 顧客対応下書き (AI)
  5. Ops Task Agent — 優先タスク生成
  6. Executive Reporting Agent — 経営者向けブリーフィング (AI)
  7. Prevention Agent — 再発防止提案 (AI)
- **Azure OpenAI クライアント** (`src/lib/ai.ts`): mock fallback 付き、生 CSV を送らない設計
- **Scenario Simulator**: 顧客体験/売上回収/リスク最小化の 3 視点でアクション並べ替え
- **サンプル CSV** (80件、すべて合成データ、PII / PAN なし) + 生成スクリプト
- **README + docs 一式** (architecture, prompts, demo-script, zenn-article-draft, submission-checklist)
- **deterministic mock 応答**: Azure OpenAI 未設定でも全画面完全動作

---

## 戦略・設計の中核

詳細は [README.md](README.md) と [docs/architecture.md](docs/architecture.md) を参照。
要点だけ:

- **Rule-first, AI-assisted**: 分類・売上計算・優先度判定は決定的ルール。AI は経営者向け文章・下書き・推奨表現の生成のみ。AI は決して分類を上書きしない
- **Safety positioning**: 決済処理・リトライ実行・顧客送信は行わない。PANらしき値検出で分析停止
- **Mock fallback**: Azure OpenAI 環境変数なしでもデモが必ず動く
- **No proprietary code**: AI Orchestra 等の社内コードは再利用していない。視覚的なブランドカラー・フォントのみ調和

---

## 命名規約

- バージョン: `MAJOR.MINOR.PATCH`
  - `MAJOR`: 提出フェーズ (v0 = ハッカソン提出, v1 = ポスト・提出のメジャー機能追加)
  - `MINOR`: 新機能 / 大きな UI 変更 / アーキテクチャ変更
  - `PATCH`: バグ修正・小さな文言修正
- 日付: JST、`YYYY-MM-DD`
- セクション: `Added / Changed / Deprecated / Removed / Fixed / Security`
