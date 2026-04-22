# 稲川さん対応事項（Client Fit リリース最終ステップ）

作成: 2026-04-20 / 田中美咲（秘書）・佐藤次郎CEO共同整理
対象: 稲川雅也オーナー

コード側の作業は完了済み。以下の4項目が本番稼働に必要な「稲川さんしかできない」作業です。上から順に実施してください。所要時間：合計 約90〜120分。

---

## STEP 1 — Supabase SQL マイグレーション実行（30分）

**場所**: https://supabase.com → プロジェクト `cpjskwdsznfupicsqbpy` → 左メニュー「SQL Editor」

以下6ファイルの中身を SQL Editor に貼り付けて「Run」を押す。`if not exists` 付きなので再実行安全。

| 順 | ファイル（リポ内パス） |
|----|------------------------|
| 1 | `supabase/schema.sql`（初回のみ） |
| 2 | `supabase/migration-20260408-onboarding.sql` |
| 3 | `supabase/migration-20260409-multitenant.sql` |
| 4 | `supabase/migration-20260412-two-plans.sql` |
| 5 | `supabase/migration-20260413-scheduled-sessions.sql` |
| 6 | `supabase/migration-20260414-line-image-usage.sql` |

**確認**: Table Editor で `trainers` / `clients` / `body_records` / `training_sessions` / `line_parse_logs` / `line_image_usage` / `body_photos` が存在するか。Storage タブで `body-photos` バケット（Private）があるか。— **2026-04-21 時点で既に全て作成済みの想定**

**次に**: Settings → API から以下3つをコピーして保管（STEP 4で使用）

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`（秘匿）

---

## STEP 2 — LINE Messaging API チャネル設定（20分）

**場所**: https://developers.line.biz/console/

1. 既存 Client Fit チャネルを開く（新規作成でも可）
2. **Messaging API** タブで以下をコピー:
   - Channel access token（long-lived）
   - Channel secret
3. **Webhook 設定**:
   - Webhook URL は STEP 4 のデプロイ完了後に設定する（プレースホルダ: `https://[本番ドメイン]/api/line/webhook`）
   - 「Use webhook」を ON
4. **応答設定**:
   - 「応答メッセージ」OFF / 「Webhook」ON / 「あいさつメッセージ」任意

LINE公式アカウント名・アイコン・ステータスメッセージは `BRAND_GUIDE.md` の指示に沿って Client Fit 仕様に更新。

---

## STEP 3 — Anthropic API キー確認（5分）

**場所**: https://console.anthropic.com/

1. **API Keys** ページで既存キーが有効か確認（または新規発行）
2. **Usage & Billing** でクレジット残高を確認。Client Fit は Claude Vision 中心のため、初期100クライアントで月$20〜40目安
3. キーをコピーして保管（STEP 4で使用）

---

## STEP 4 — Vercel デプロイ + 環境変数設定（30〜60分）

### 4-1. GitHub リポジトリ準備

- プライベート repo を用意（まだなら `allyourfit` を `clientfit` にリネーム検討）
- `main` ブランチに push

### 4-2. Vercel プロジェクト作成

1. https://vercel.com/new で GitHub 連携 → リポジトリを Import
2. **Root Directory**: `PersonalTrainer/product/allyourfit`
3. **Framework**: Next.js（自動検出）

### 4-3. 環境変数設定（Production・Preview 両方）

`.env.local.example` を参照しつつ以下を設定:

| 変数 | 値・取得元 |
|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | STEP 1 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | STEP 1 |
| `SUPABASE_SERVICE_ROLE_KEY` | STEP 1（秘匿） |
| `ANTHROPIC_API_KEY` | STEP 3 |
| `LINE_CHANNEL_ACCESS_TOKEN` | STEP 2 |
| `LINE_CHANNEL_SECRET` | STEP 2 |
| `TRAINER_PASSWORD` | 任意のパスワード（稲川さんが決める） |
| `TRAINER_SESSION_TOKEN` | 32文字以上のランダム文字列 |
| `TRAINER_ID` | Supabase `trainers` テーブルから UUID（初回登録後に取得） |
| `NEXT_PUBLIC_APP_URL` | デプロイ後の URL |
| `NEXT_PUBLIC_BILLING_ENABLED` | `false` |

> `TRAINER_ID` は初回デプロイ後に `/trainer/register` で登録 → Supabase で確認 → 再度環境変数に設定して再デプロイ、の順。

### 4-4. ドメイン接続（任意）

- `clientfit.com` 等を Value Domain 等で取得
- Vercel の Domains で追加・DNS 設定
- `NEXT_PUBLIC_APP_URL` を本番ドメインで上書き

### 4-5. LINE Webhook URL 更新

STEP 2 のチャネル設定で Webhook URL を `https://[本番ドメイン]/api/line/webhook` に設定 → 「検証」ボタンで 200 OK を確認。

---

## STEP 5 — 本番動作確認（15分）

以下の順で稲川さん自身が確認:

- [ ] LP (`/`) が表示される
- [ ] `/trainer/register` でトレーナー登録できる
- [ ] `/trainer/login` でログインできる
- [ ] `/trainer` ダッシュボードが表示される
- [ ] 新規クライアント作成 → 招待リンク発行 → スマホでPIN入力 → `/client/[id]` が開ける
- [ ] Client Fit 公式 LINE に食事スクショを送る → ダッシュボードに反映される
- [ ] 翌朝のデイリーサマリーが LINE に届く（または `/api/cron/daily-summary` を手動叩く）
- [ ] `/client/[id]` フォトタブで体型写真をアップロード → Before/After が並ぶ（トレーナー側 `/trainer/clients/[id]` の「フォト」タブでも同じ写真が見える）

---

## 完了後の報告

STEP 1〜5が完了したら、佐藤CEOに「本番稼働開始」を報告してください。その後のフォロー（note公開・X告知・最初のトレーナー招致）は佐藤CEOが手配します。

**トラブル時**: エラーメッセージ・URL・再現手順をそのままチャットに貼り付けてください。即調査します。
