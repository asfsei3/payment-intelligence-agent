# Zenn 記事公開前チェックリスト

`docs/zenn-article-draft.md` を Zenn に公開する直前に、上から順に消化してください。

> 想定所要時間: **10〜15 分**(動画録画と Azure デプロイは完了済み)

---

## 0. 公開の前提(全部済んでいるはず)

- [x] Azure Container Apps にデプロイ済み → https://pia-demo-51ff8c.bluebush-37a0c845.japaneast.azurecontainerapps.io
- [x] 3分デモ動画を YouTube にアップロード済み → https://youtu.be/NBuOESM2GmM
- [x] GitHub リポジトリを public 公開済み → https://github.com/asfsei3/payment-intelligence-agent
- [x] アプリURL / GitHub URL は記事内に埋め込み済み
- [x] YouTube 動画ID `NBuOESM2GmM` は記事内 2 箇所に埋め込み済み

公開時に最後にやることは **frontmatter の `published: false` → `true` フリップ** だけです。

---

## 1. 公開直前にやる差し替え(1 箇所のみ)

```diff
- published: false
+ published: true
```

(`docs/zenn-article-draft.md` 6 行目)

これでローカルファイルは公開可能状態になります。Zenn にコピペで投稿してください。

---

## 2. 全文プレビュー確認(Zenn の Preview ボタンで)

- [ ] **mermaid のアーキテクチャ図** が描画される(§10. Azure構成)
- [ ] **YouTube 埋め込み** が 2 箇所とも実際の動画プレイヤーになっている(§4. 作ったもの / §14. デモ)
- [ ] コードブロック(`ts` / `mermaid`)がシンタックスハイライトされている
- [ ] **テーブル**が崩れていない(§4, §6, §9)
- [ ] `<!-- 公開前TODO -->` コメントが残っていない(grep で `公開前TODO` が 0 件)
- [ ] `<!-- TODO citation -->` が 0 件(出典は §3 に追記済)

---

## 3. 必須セクションの最終チェック

ハッカソンブリーフで「必ず含める」と指定された項目:

| 項目 | 現在の場所 | 確認 |
| --- | --- | --- |
| 市場性・解決したい課題 | §2 / §3 | [ ] |
| 実装上の工夫 | §12 | [ ] |
| アーキテクチャ | §10 | [ ] |
| プロンプトの工夫 | §11 | [ ] |
| アーキテクチャ図(mermaid) | §10 | [ ] |
| 3分デモ動画の埋め込み | §4 / §14 | [ ] |
| Azure OpenAI の使い方(fetch コード) | §10 | [ ] |
| Rule-first, AI-assisted の説明 | §6 | [ ] |
| AI 配置判断の根拠(「なぜ全部 AI にしなかったか」) | §7 | [ ] |
| BI ではなく Agent である理由 | §9 | [ ] |
| 安全性とプライバシー設計 | §13 | [ ] |
| 「決済処理・リトライ・送信を行わない」明記 | TL;DR + §6, §12, §13 | [ ] |

---

## 4. 禁止語の最終チェック

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

→ **0 件である**こと。

リポジトリ全体のスキャンは `npm run check:forbidden` で実行可能(allowlist 設定済)。

---

## 5. メタデータ

| フィールド | 値 |
| --- | --- |
| title | `Azure OpenAIで、決済エラー対応をRevenue Operations Agent化する` |
| emoji | `💳` |
| type | `tech` |
| topics | `["azure", "azureopenai", "nextjs", "typescript", "agent"]` |
| publication_name | (個人で出すなら空) |
| published_at | (未来日付の予約投稿可) |

---

## 6. 公開直後の確認

- [ ] 自分のブラウザ(ログイン状態)で記事URLを開く
- [ ] **シークレットウィンドウ**でも開いて、未ログインで見えることを確認
- [ ] スマホでも開いて、レイアウト崩れがないか確認
- [ ] mermaid 図 + 2 つの YouTube 埋め込みが動くことを確認
- [ ] 記事URL(`https://zenn.dev/.../articles/...`)をコピー → 提出フォーム E-2 に転記

---

## 7. ハッカソン提出への引き渡し

公開した記事URLを `docs/submission-form-draft.md` E-2 欄に転記して、提出フォームに進んでください。
E-3(YouTube) と E-4(GitHub) は既に確定値。

---

## 8. 公開後 2026-06-18 まで(審査期間)

ハッカソンルールにより、応募作品は **2026-06-18 まで参照可能** である必要があります。

- [ ] Zenn 記事を非公開にしない
- [ ] Azure Container App を停止しない(min-replicas=1 で常時1コンテナ稼働)
- [ ] GitHub リポジトリを private 化しない
- [ ] YouTube 動画を削除しない
- [ ] Azure OpenAI のキーをローテートしない(動かなくなる)
