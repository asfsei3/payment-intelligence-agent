# Submission Checklist — Microsoft Agent Hackathon 2026

このリストは、応募時に確認しておきたい項目のチェックリストです。

## 必須

- [ ] **Working app URL** (Azure Container Apps)
  - 現行: `https://pia-demo-51ff8c.bluebush-37a0c845.japaneast.azurecontainerapps.io`
  - `npm run build && npm run start` でローカルでも動作確認済み
- [ ] **Zenn article URL**
  - 下書き: [docs/zenn-article-draft.md](zenn-article-draft.md)
  - 公開後にURLをここに記入
- [ ] **3-minute YouTube demo embedded in article**
  - スクリプト: [docs/demo-script-3min.md](demo-script-3min.md)
  - 動画URLをZenn記事内の動画埋め込みリンクに記入
- [ ] **Architecture diagram in article**
  - Mermaid記法でREADMEと[docs/architecture.md](architecture.md)に同梱
- [ ] **GitHub repository URL** (optional but recommended)
- [ ] **Demo credentials**: not required — sample CSV is bundled and accessible without login
- [ ] **App availability until 2026-06-18** — keep Azure Container App running (min-replicas=1 で常時稼働)

## コンテンツ規約

- [ ] **No pre-existing proprietary code**
  - 新規Next.js scaffold、外部依存は `next` / `react` / `papaparse` / `tailwindcss` のみ
- [ ] **No real customer / payment data**
  - sample CSV は完全に合成データ (顧客ID `cus_*`、取引ID `txn_*`)
  - 氏名・電話番号・メール・PAN・CVC は一切含まない
- [ ] **Forbidden terms grep check** (run before submission):
  ```bash
  grep -rEi "(自動再請求|完全自動回収|回収保証|AIが学習|機械学習モデル|高度なAIリトライ|AIが売上を自動回収|Visa|Cybersource|RecoverAI)" \
    src/ docs/ README.md sample/ || echo "OK — no forbidden terms"
  ```

## 動作確認

- [ ] `AZURE_OPENAI_*` 4変数を Azure Container App に登録(API key は Container App secret として `secretref:` 参照)
- [ ] **Mock fallback tested** — 環境変数を消した状態でも全画面が正常に動く
- [ ] **Mobile/desktop display checked**
  - デスクトップ (1280px以上): 確認済み
  - モバイル (375px): 確認済み (KPIカードが2列、テーブルが横スクロール)
- [ ] **PAN block tested** — Luhn有効なカード番号入りCSVで分析が停止することを確認
- [ ] **Sample CSV walkthrough** — Landing → Upload (sample) → Timeline → Dashboard → 全タブを通過

## 提出物の最終チェック

- [ ] Zenn記事に動画埋め込みリンクが入っている
- [ ] Zenn記事にarchitecture mermaidが入っている
- [ ] Zenn記事の冒頭で「決済処理・リトライ実行・自動送信を行わない」と明記
- [ ] App URL がZenn記事内に明記されている
- [ ] 応募フォームに上記URL群をすべて入力
