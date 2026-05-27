# Azure Container Apps デプロイ手順(現行)

Payment Intelligence Agent を **Azure Container Apps** に **Azure CLI** でデプロイし、
**Azure OpenAI** に接続するまでの、コマンド単位の手順書。

> **これが現行手順です。** 当初は Azure App Service を予定していましたが、Free Trial アップグレード後の PAYG サブスクリプションの VM クォータがゼロで(2026-05 時点の Microsoft 仕様)、Linux App Service Plan が作成不可だったため、**Container Apps に pivot** しました。Container Apps は別クォータ系統で即時動作します。詳細は [CHANGELOG.md](../CHANGELOG.md) v0.3.0 を参照。

> 想定所要時間: **20〜30 分**(初回。ACR ビルドが約 2 分、その他は数分)

---

## 0. 前提

| 必要なもの | 確認コマンド |
| --- | --- |
| Azure サブスクリプション (PAYG、Free Trial アップグレード済み) | `az account show --query "subscriptionPolicies.spendingLimit"` → `"Off"` |
| Azure CLI 2.50+ | `az --version` |
| サインイン済み | `az login` |
| Node.js 20+ (ローカル動作確認用) | `node -v` |

> Container Apps は **ローカル Docker 不要**(ACR Tasks がクラウドで Docker ビルドする)

---

## 1. ローカルで最終動作確認

```bash
cd "/path/to/payment-intelligence-agent"
npm install
npm run check:forbidden          # 禁止語スキャン
npm run lint                     # ESLint
npm run build                    # production build (`output: 'standalone'` 必須)
ls .next/standalone/server.js    # → 存在することを確認
```

> `output: "standalone"` は `next.config.mjs` で設定済み。Dockerfile はこの出力を期待します。

---

## 2. 変数を1箇所にまとめる

`~/pia-env.sh`:

```bash
# === Azure リソース名 ===
export PIA_RG="pia-rg"
export PIA_LOCATION="japaneast"
export PIA_ENV="pia-env"                          # Container Apps Environment
export PIA_APP="pia-demo-$(whoami)"               # 全世界で一意
export PIA_ACR="piaacr$(whoami | tr -dc 'a-z0-9' | head -c 6)"  # ACR は英小数字のみ、5–50字、全世界で一意
export PIA_AOAI="pia-aoai-$(whoami)"              # Azure OpenAI 名

# === Azure OpenAI 設定 ===
export AOAI_REGION="eastus"                       # Azure OpenAI が利用可能なリージョン
export AOAI_DEPLOYMENT_NAME="gpt-4o-mini-dep"     # deployment 名(任意)
export AOAI_MODEL_NAME="gpt-4o-mini"
export AOAI_MODEL_VERSION="2024-07-18"
export AOAI_API_VERSION="2024-08-01-preview"

# === 課金保護: TPM 低めにセット ===
export AOAI_TPM_K=10                              # 10K TPM = 月数百円が物理上限
```

```bash
source ~/pia-env.sh
```

---

## 3. インフラ作成(初回のみ)

### 3.1 リソースグループ

```bash
az group create --name "$PIA_RG" --location "$PIA_LOCATION"
```

### 3.2 リソースプロバイダ登録

```bash
for rp in Microsoft.App Microsoft.ContainerRegistry Microsoft.OperationalInsights Microsoft.CognitiveServices; do
  az provider register --namespace "$rp" --wait
done
```

### 3.3 Container Apps Environment

```bash
az containerapp env create \
  --name "$PIA_ENV" \
  --resource-group "$PIA_RG" \
  --location "$PIA_LOCATION"
# Log Analytics workspace が自動生成される
```

### 3.4 ACR (Azure Container Registry, Basic SKU)

```bash
az acr create \
  --name "$PIA_ACR" \
  --resource-group "$PIA_RG" \
  --location "$PIA_LOCATION" \
  --sku Basic \
  --admin-enabled true
```

---

## 4. Docker イメージをクラウドビルド (ACR Tasks)

ローカル Docker 不要。ソースをそのまま ACR に投げて、ACR 側でビルド + push:

```bash
cd "/path/to/payment-intelligence-agent"
az acr build \
  --registry "$PIA_ACR" \
  --image "pia-app:v1" \
  --file Dockerfile .
```

所要時間: **約 2 分**。ログがリアルタイムで流れる。

確認:

```bash
az acr repository show-tags --name "$PIA_ACR" --repository pia-app -o tsv
# → v1 が表示されればOK
```

---

## 5. Container App 作成

```bash
ACR_USER=$(az acr credential show --name "$PIA_ACR" --query username -o tsv)
ACR_PASS=$(az acr credential show --name "$PIA_ACR" --query "passwords[0].value" -o tsv)

az containerapp create \
  --name "$PIA_APP" \
  --resource-group "$PIA_RG" \
  --environment "$PIA_ENV" \
  --image "$PIA_ACR.azurecr.io/pia-app:v1" \
  --target-port 3000 \
  --ingress external \
  --registry-server "$PIA_ACR.azurecr.io" \
  --registry-username "$ACR_USER" \
  --registry-password "$ACR_PASS" \
  --cpu 0.5 --memory 1.0Gi \
  --min-replicas 1 --max-replicas 1
# ↑ min=max=1 にして autoscale を無効化(コスト固定化)
```

URL 取得:

```bash
PIA_URL=$(az containerapp show --name "$PIA_APP" --resource-group "$PIA_RG" \
  --query "properties.configuration.ingress.fqdn" -o tsv)
echo "https://$PIA_URL"
```

---

## 6. 起動確認

```bash
# 数秒待ってから:
curl -s -o /dev/null -w "%{http_code}\n" "https://$PIA_URL/"
# → 200 が返ればOK

curl -s "https://$PIA_URL/api/sample" | head -3
# → CSV ヘッダが返ればOK
```

この時点で `AI: mock` モードで全機能が動きます(`/upload?sample=1` → 分析 → 全タブ)。

---

## 7. Azure OpenAI リソース作成 + 接続

### 7.1 Azure OpenAI リソース

Azure OpenAI が **`japaneast` で空きがない** ことがあるため、**`eastus`** など別リージョンを使うのが現実的:

```bash
az cognitiveservices account create \
  --name "$PIA_AOAI" \
  --resource-group "$PIA_RG" \
  --location "$AOAI_REGION" \
  --kind "OpenAI" \
  --sku "S0" \
  --custom-domain "$PIA_AOAI" \
  --yes
```

### 7.2 モデルデプロイ(`gpt-4o-mini`、TPM 低め=課金保護)

```bash
az cognitiveservices account deployment create \
  --name "$PIA_AOAI" \
  --resource-group "$PIA_RG" \
  --deployment-name "$AOAI_DEPLOYMENT_NAME" \
  --model-name "$AOAI_MODEL_NAME" \
  --model-version "$AOAI_MODEL_VERSION" \
  --model-format OpenAI \
  --sku-name "Standard" \
  --sku-capacity "$AOAI_TPM_K"
# capacity = K TPM (10 = 10,000 tokens/min cap, Azure 側で強制制限)
```

### 7.3 接続情報を取得

```bash
AOAI_ENDPOINT=$(az cognitiveservices account show --name "$PIA_AOAI" --resource-group "$PIA_RG" --query "properties.endpoint" -o tsv)
AOAI_KEY=$(az cognitiveservices account keys list --name "$PIA_AOAI" --resource-group "$PIA_RG" --query "key1" -o tsv)
echo "endpoint: $AOAI_ENDPOINT"
echo "deployment: $AOAI_DEPLOYMENT_NAME"
```

### 7.4 Container App に環境変数を設定

```bash
az containerapp update \
  --name "$PIA_APP" \
  --resource-group "$PIA_RG" \
  --set-env-vars \
    "AZURE_OPENAI_ENDPOINT=$AOAI_ENDPOINT" \
    "AZURE_OPENAI_API_KEY=secretref:aoai-key" \
    "AZURE_OPENAI_DEPLOYMENT=$AOAI_DEPLOYMENT_NAME" \
    "AZURE_OPENAI_API_VERSION=$AOAI_API_VERSION" \
  --secrets "aoai-key=$AOAI_KEY"
# API key は secret として保存し、env var からは secretref で参照(平文露出回避)
```

> `--secrets` で先に登録 → `secretref:` で参照、という Container Apps の安全パターン。

### 7.5 動作確認

```bash
# 30秒ほど待ってから(設定反映のための再ロール):
curl -s "https://$PIA_URL/" | grep -oE "AI: (mock|Azure OpenAI)"
# → 出力されないが、ブラウザで /analyze/<id>/timeline を見て
#    各エージェントに「Azure OpenAI」バッジが出ればOK
```

`AI: mock` のままならログを確認:

```bash
az containerapp logs show --name "$PIA_APP" --resource-group "$PIA_RG" --tail 50
```

`[ai] briefing fallback to mock: ...` が出ていれば、Azure OpenAI 呼び出しがエラーで mock に落ちている。エラー詳細で対処。

---

## 8. デモ動画収録時の安定化(任意)

```bash
# min replicas を1で固定(scale-to-zero を防ぐ → コールドスタートなし)
az containerapp update --name "$PIA_APP" --resource-group "$PIA_RG" \
  --min-replicas 1 --max-replicas 1
# ↑ 既にこの状態だが、後で変えた場合の戻し方
```

---

## 9. 再デプロイ(コード修正反映)

```bash
cd "/path/to/payment-intelligence-agent"
# 1. ビルド検証
npm run build

# 2. ACR build(タグを上げる)
az acr build --registry "$PIA_ACR" --image "pia-app:v2" --file Dockerfile .

# 3. Container App を新イメージにロール
az containerapp update --name "$PIA_APP" --resource-group "$PIA_RG" \
  --image "$PIA_ACR.azurecr.io/pia-app:v2"
```

URL は不変。Container App が新しい revision を作成し、トラフィックを切り替える。

---

## 10. リソース削除(審査終了後 — 2026-06-18 以降)

```bash
az group delete --name "$PIA_RG" --yes --no-wait
```

リソースグループごと削除すれば、Container App、ACR、Container Apps Environment、Log Analytics、Azure OpenAI、すべて消えて課金停止。

---

## 11. トラブルシューティング

| 症状 | 原因 | 対応 |
| --- | --- | --- |
| `az appservice plan create` が `Total VMs: 0` で失敗 | Free Trial / 新規 PAYG の VM クォータ 0 | App Service ではなく **Container Apps** を使う(本手順) |
| `az acr build` が `MissingSubscriptionRegistration` | Microsoft.ContainerRegistry 未登録 | §3.2 を実行 |
| Dockerfile build が `COPY failed: stat app/public: file does not exist` | `public/` ディレクトリがリポジトリにない | `mkdir -p public && touch public/.gitkeep` |
| Container App 作成は成功するが `502` | コンテナが port 3000 で listen していない | Dockerfile の `ENV PORT=3000` と `EXPOSE 3000` を確認 |
| `AI: mock` から抜けない | 環境変数のいずれかが空、または Azure OpenAI deployment 名がモデル名と混同 | §7.5 のログ確認、`AZURE_OPENAI_DEPLOYMENT` は **deployment 名** であってモデル名ではない |
| Azure OpenAI 作成が `429 SubscriptionQuotaExceeded` | 当該リージョンの Azure OpenAI クォータゼロ | 別リージョン(`eastus2` / `swedencentral`)で再試行 |
| Azure OpenAI 呼び出しが 429 (TPM exceeded) | 設計通り(課金保護として TPM 制限を低めに設定) | mock fallback で運用継続 or §7.2 の `--sku-capacity` を上げる |

---

## 12. コスト目安(2026 年時点)

| リソース | 月コスト目安 (24h × 30日) | 備考 |
| --- | --- | --- |
| Container App (0.5 vCPU × 1 GiB × min=1) | 約 **¥4,000** | Consumption profile, 無料枠 180k vCPU-sec を超過分のみ |
| Azure Container Registry (Basic) | 約 **¥800** | ストレージ 10 GB + ビルド時間 |
| Container Apps Environment + Log Analytics | 約 **¥500** | 軽い使用 |
| Azure OpenAI (`gpt-4o-mini`, TPM=10K) | 0〜**¥500** | TPM 上限が低いので物理的に課金が膨らまない |
| **合計** | 約 **¥5,800/月** | Free Trial 残クレジット **¥30,500** で約 5 ヶ月分 |

ハッカソン期間(〜2026-06-18, 約 23 日)なら **¥4,500** 程度。クレジット内で完全に収まる。

---

## 13. このファイルの使い方

- 初回は §1 → §11 まで順に
- 2回目以降は §9 だけ
- 設定だけ変える場合は §7.4 だけ(Container App 再起動は自動)
- 削除したい場合は §10 だけ
- 不安なときは §6 と §7.5 を順に流してから動画収録に入る、を推奨

詳細な背景と設計判断は [README.md](../README.md) と [CHANGELOG.md](../CHANGELOG.md) を参照。
