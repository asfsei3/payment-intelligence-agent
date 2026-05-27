# Screenshots ガイド

Zenn 記事の補助画像や、提出フォームの差し替え用画像を撮るための手順。
**動画が本命**ですが、動画が間に合わない場合の代替静止画として、または記事のサムネ用として使用できます。

> 2026-05-27 時点で、本番URLの全8ページの表示は **Chrome MCP による自動確認済み**(レイアウト崩れなし、ブランドカラー適用済み、Azure OpenAI 生成コンテンツが正しく表示されている)。

---

## 推奨撮影方法

### macOS の場合(おすすめ: ブラウザフルページ)

1. **Chrome を起動**(プロファイルは新規 or シークレットウィンドウ推奨、拡張機能の通知を避けるため)
2. **ウィンドウサイズを 1440 × 900 に固定** (撮影の見栄えが良い、Zennにも適正)
   - macOS の Chrome は WebView Resize 拡張または DevTools のデバイスモードで設定可能
3. **DevTools(`Cmd+Option+I`)→ デバイスツールバーをオン → カスタムサイズ 1440×900**
4. **DevTools コマンドパレット (`Cmd+Shift+P`)** で `Capture full size screenshot` を選択
5. Downloads に PNG が保存される

### または、お手軽 macOS スクリーンショット

- 画面サイズに合わせて Chrome を表示
- `Cmd+Shift+4` → スペースキー → ウィンドウクリック (1ウィンドウの上下フルキャプチャ)
- デスクトップに PNG が保存される

---

## 撮影リスト(8 枚)

事前にサンプル分析を1回走らせて、分析ID(URL の `/analyze/<ID>/...` 部分)をメモしておきます。

| # | ファイル名(推奨) | URL | キャプチャの狙い |
| --- | --- | --- | --- |
| 1 | `01-landing.png` | `/` | タイトル/タグライン/7-Agent Workflow/「行いません」赤カード |
| 2 | `02-upload.png` | `/upload?sample=1` | サンプル自動読み込み済み + 「ℹ デモ用に...」バナー + プレビュー表 |
| 3 | `03-timeline.png` | `/analyze/<ID>/timeline` | 7 エージェントアイコン + バッジ(rule-based / Azure OpenAI) |
| 4 | `04-dashboard.png` | `/analyze/<ID>/dashboard` | KPI 6枚 + 「リトライ非推奨」赤帯 + カテゴリ別バー |
| 5 | `05-action-plan.png` | `/analyze/<ID>/action-plan` | High Priority カード(Finance owner、推定金額付き) |
| 6 | `06-briefing.png` | `/analyze/<ID>/briefing` | Markdown プレビュー + コピーボタン |
| 7 | `07-scenario.png` | `/analyze/<ID>/scenario` | 3 シナリオカード + Top 5 比較プレビュー |
| 8 | `08-drafts.png` | `/analyze/<ID>/drafts` | 4 つの AI 生成下書き + 「自動送信を行いません」フッター |
| 9 | `09-prevention.png` | `/analyze/<ID>/prevention` | 5 つの AI 生成再発防止提案 |

(必須 1, 3, 4, 6 / 推奨 2, 5, 7, 8, 9)

---

## Zenn 記事への埋め込み方

Zenn は画像アップロード → そのURLをMarkdownに貼る、または `https://storage.googleapis.com/zenn-user-upload/...` 形式の URL を直接使えます。

```markdown
![ランディング画面](https://storage.googleapis.com/zenn-user-upload/xxxxx.png)
*ランディング: 「決済エラー対応を、AI Revenue Ops Desk に」*
```

各画像にキャプションを付けると、SEO 的にも読者にも親切。

---

## 提出フォームへの埋め込み

提出フォームでアーキテクチャ図 or サムネが求められる場合、**`01-landing.png` または `06-briefing.png`** がプロダクトを最も表現していて良い候補です。

または `docs/architecture.md` 内の mermaid を `https://mermaid.live` で SVG 化したものでも OK。
