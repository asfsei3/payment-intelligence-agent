# Zenn 記事公開前チェックリスト

`docs/zenn-article-draft.md` を Zenn に公開する直前に、このリストを上から順に消化してください。

> 想定所要時間: **20〜30 分**(動画録画と Azure デプロイは別途)

---

## 0. 公開の前提

公開する **前に** 揃っていること:

- [ ] Azure Container Apps にデプロイ済み(`docs/deploy-container-apps.md`)
- [ ] 公開アプリURLが取得済み(例: `https://pia-demo-51ff8c.bluebush-37a0c845.japaneast.azurecontainerapps.io`)
- [ ] **アプリが今この瞬間も動いている**(`curl <URL>` で 200 が返る)
- [ ] 3分デモ動画を録画し、YouTube に **限定公開以上** でアップロード済み(`docs/demo-recording-operator-script.md`)
- [ ] YouTube 動画IDをメモした(例: `dQw4w9WgXcQ`)
- [ ] GitHub リポジトリを **public** で公開済み(任意。public 推奨)

これらが揃っていない場合は、まずそちらを完了させてから戻ってきてください。

---

## 1. Zenn 記事の差し替え箇所(全 5 箇所)

`docs/zenn-article-draft.md` 内の `<!-- 公開前TODO -->` コメントを順に潰します。

### 1.1 frontmatter: 公開フラグ

```diff
- published: false
+ published: true
```

行: **6 行目**

### 1.2 冒頭 TL;DR 直後: デモアプリURL

```diff
- <!-- 公開前TODO: 下のリンクを公開アプリURLに置き換え -->
- 🔗 デモアプリ: `https://<your-app>.azurewebsites.net`
+ 🔗 デモアプリ: https://pia-demo-51ff8c.bluebush-37a0c845.japaneast.azurecontainerapps.io
+ (Azure Container Apps の FQDN。固定で変わりません)
```

行: **35〜36 行目**

> Zenn の Markdown では裸URLが自動でリンクになります。バッククォートを外すこと。

### 1.3 セクション 3「作ったもの」: 動画埋め込み(1箇所目)

```diff
- <!-- 公開前TODO: 3分YouTubeデモを公開し、下を埋め込みリンクに差し替え -->
-
- `[YouTube埋め込み: 3分デモ動画]`
-
- 例: `https://www.youtube.com/embed/<video_id>`
+ @[youtube](dQw4w9WgXcQ)
```

行: **50〜54 行目**

> Zenn は `@[youtube](VIDEO_ID)` 記法で公式に YouTube 埋め込みをサポート。

### 1.4 セクション 11「デモ」: 動画埋め込み(2箇所目)

```diff
- <!-- 公開前TODO: 3分デモ動画を録画して YouTube にアップロード -->
-
- 3分のデモ動画はこちら:
-
- `[YouTube埋め込み: 3分デモ動画]`
-
- スクリプト全文は GitHub の `docs/demo-script-3min.md` に掲載しています。
+ 3分のデモ動画はこちら:
+
+ @[youtube](dQw4w9WgXcQ)
+
+ スクリプト全文は GitHub の `docs/demo-script-3min.md` に掲載しています。
```

行: **262〜268 行目**

### 1.5 末尾: GitHub リポジトリURL

```diff
- GitHub リポジトリ: <!-- 公開前TODO: GitHub URL を記入 -->
+ GitHub リポジトリ: https://github.com/<your-handle>/payment-intelligence-agent
```

行: **283 行目**

---

## 2. 全文プレビュー確認

Zenn の **Preview** ボタンで以下を目視確認:

- [ ] mermaid のアーキテクチャ図が描画される(セクション 7)
- [ ] YouTube 埋め込みが 2 箇所とも実際の動画プレイヤーになっている(セクション 3, 11)
- [ ] コードブロック(`ts` / `mermaid`)がシンタックスハイライトされている
- [ ] テーブル(セクション 3, 5)が崩れていない
- [ ] `<!-- 公開前TODO -->` コメントが残っていない(grep で `公開前TODO` を検索して 0 件であること)

---

## 3. 必須セクションの最終チェック

ハッカソンブリーフで「必ず含める」と指定された項目:

| 項目 | 現在の場所 | 確認 |
| --- | --- | --- |
| 実装上の工夫 | セクション 9 | [ ] |
| アーキテクチャ | セクション 7 | [ ] |
| プロンプトの工夫 | セクション 8 | [ ] |
| アーキテクチャ図(mermaid) | セクション 7 | [ ] |
| 3分デモ動画の埋め込み位置 | セクション 3, 11 | [ ] |
| Azure OpenAI の使い方 | セクション 7(fetchコード) | [ ] |
| Rule-first, AI-assisted の説明 | セクション 5 | [ ] |
| 安全性とプライバシー設計 | セクション 10 | [ ] |
| 「決済処理・リトライ・送信を行わない」明記 | TL;DR + セクション 5, 9, 10 | [ ] |

---

## 4. 禁止語の最終チェック

Zenn 記事の本文(公開前TODO修正済)に対して:

```bash
grep -nE "(自動再請求|完全自動回収|回収保証|AIが学習|機械学習モデル|高度なAIリトライ|AIが売上を自動回収|RecoverAI)" docs/zenn-article-draft.md | \
  grep -vE "(禁止|「.*」など|System Prompt に書き切る)"
```

→ **0 件である**こと。

ヒットする場合は文脈確認(「禁止」リストの中の参照ならOK、それ以外なら書き換え)。

`Visa` `Cybersource` も同様にチェック:

```bash
grep -nE "\b(Visa|Cybersource)\b" docs/zenn-article-draft.md
```

→ **0 件である**こと(禁止語リストの説明として出ているのは meta-references なので allowlist の `architecture.md` / `prompts.md` / `submission-checklist.md` のみで許可)。

---

## 5. メタデータ

Zenn の記事メタを最終確認:

| フィールド | 推奨値 |
| --- | --- |
| title | `Azure OpenAIで、決済エラー対応をRevenue Operations Agent化する` |
| emoji | `💳` |
| type | `tech` |
| topics | `["azure", "azureopenai", "nextjs", "typescript", "agent"]` |
| publication_name | (個人で出すなら空。Publication なら指定) |
| published_at | (未来日付の予約投稿可) |

---

## 6. 公開直後の確認

公開ボタンを押した直後に:

- [ ] 自分のブラウザ(ログイン状態)で記事URLを開く
- [ ] **シークレットウィンドウ**でも開いて、未ログインで見えることを確認
- [ ] スマホでも開いて、レイアウト崩れがないか確認
- [ ] mermaid 図 + 2 つの YouTube 埋め込みが動くことを確認
- [ ] 記事URLをコピー(ハッカソン提出フォームに使う)

---

## 7. ハッカソン提出への引き渡し

公開した記事URLを `docs/submission-form-draft.md` に転記して、提出フォームに進んでください。

---

## 8. 公開後 6 月 18 日まで

ハッカソンルールにより、応募作品は **2026-06-18 まで参照可能** である必要があります。

- [ ] Zenn 記事を非公開にしない
- [ ] Azure Container App を停止しない(min-replicas=1 で常時1コンテナ稼働)
- [ ] GitHub リポジトリを private 化しない
- [ ] YouTube 動画を削除しない
- [ ] Azure OpenAI のキーをローテートしない(動かなくなる)
- [ ] サブスクリプションのクレジット残量を月初に確認(B1 × 30日 = 約 ¥1,800)
