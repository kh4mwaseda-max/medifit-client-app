# AYF（All Your Fit）本番リリース手順書

作成: 2026-04-14
対象: 稲川オーナー

---

## 概要

このドキュメントは、AYFを本番環境（https://allyourfit.com）でリリースするために稲川さんが実施する手順をまとめたものです。

- Supabaseプロジェクト: `cpjskwdsznfupicsqbpy`
- 本番URL: https://allyourfit.com
- スタック: Next.js + Supabase + Anthropic Claude Vision API + LINE Messaging API

---

## 1. Supabase SQLマイグレーション実行

### 実行場所

https://supabase.com → プロジェクト `cpjskwdsznfupicsqbpy` → 左メニュー「SQL Editor」

### 実行順序（必ずこの順番で）

各ファイルの中身をSQL Editorに貼り付けて「Run」ボタンを押してください。
`if not exists` が付いているので、すでに実行済みのものは安全にスキップされます。

**ステップ 1: ベーススキーマ（初回のみ・まだ実行していない場合）**
```
ファイル: supabase/schema.sql
内容: trainers / clients など基本テーブルの作成
```

**ステップ 2: オンボーディング対応**
```
ファイル: supabase/migration-20260408-onboarding.sql
内容: clients テーブル拡張（身長・性別・生年・健康懸念）、client_goals テーブル追加
```

**ステップ 3: マルチテナント対応**
```
ファイル: supabase/migration-20260409-multitenant.sql
内容: trainers テーブルに name / password_hash / plan / LINE連携トークン追加
```

**ステップ 4: 2プランデザイン対応**
```
ファイル: supabase/migration-20260412-two-plans.sql
内容: トレーナーLINE連携コード・個人プランオンボーディング対応
```

**ステップ 5: 予約・セッション管理**
```
ファイル: supabase/migration-20260413-scheduled-sessions.sql
内容: scheduled_sessions テーブル追加（トレーナーとクライアントの予約管理）
```

**ステップ 6: LINE画像送信カウント（最新）**
```
ファイル: supabase/migration-20260414-line-image-usage.sql
内容: line_image_usage テーブル追加（トレーナーごとの月次LINE画像送信数管理）
```

### ファイルの場所

すべて以下のフォルダにあります:
```
c:\Users\user\Documents\InagawaMasayaProject\PersonalTrainer\product\allyourfit\supabase\
```

---

## 2. 環境変数の設定

### Vercelでの設定方法

1. https://vercel.com にログイン
2. `allyourfit` プロジェクトを開く
3. 「Settings」→「Environment Variables」を開く
4. 以下の変数を設定（`.env.local.example` が参考ファイル）

| 変数名 | 説明 | 取得場所 |
|--------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトURL | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase匿名キー | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabaseサービスロールキー（秘匿） | Supabase → Settings → API |
| `ANTHROPIC_API_KEY` | Claude Vision APIキー | https://console.anthropic.com |
| `TRAINER_PASSWORD` | トレーナーログイン用パスワード | 任意の文字列を設定 |
| `TRAINER_SESSION_TOKEN` | セッショントークン（32文字以上推奨） | 任意のランダム文字列 |
| `TRAINER_ID` | SupabaseのトレーナーUUID | Supabase → Table Editor → trainers |
| `NEXT_PUBLIC_APP_URL` | 本番URL | `https://allyourfit.com`（設定済み） |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINEチャネルアクセストークン | LINE Developers Console |
| `LINE_CHANNEL_SECRET` | LINEチャネルシークレット | LINE Developers Console |
| `NEXT_PUBLIC_BILLING_ENABLED` | 課金フロー有効化フラグ | `false`（ローンチ時はfalseのまま） |

### ローカル開発用

`.env.local.example` をコピーして `.env.local` を作成し、上記の値を記入:
```
cp .env.local.example .env.local
```

---

## 3. Vercelデプロイ手順

### 自動デプロイの確認

通常はGitHubへのpushで自動デプロイされます。

1. https://vercel.com → `allyourfit` プロジェクト
2. 「Deployments」タブでデプロイ状態を確認
3. 最新のデプロイが「Ready」になっていれば完了

### 手動デプロイが必要な場合

ローカルから手動デプロイする場合（Vercel CLIが必要）:
```
cd C:\Users\user\Documents\InagawaMasayaProject\PersonalTrainer\product\allyourfit
npx vercel --prod
```

---

## 4. LINE Webhook URL設定

### 設定手順

1. https://developers.line.biz にログイン
2. 該当のMessaging APIチャネルを開く
3. 「Messaging API設定」タブ → 「Webhook URL」を以下に更新:

**変更前:**
```
https://medifit-client-app.vercel.app/api/line/webhook
```

**変更後:**
```
https://allyourfit.com/api/line/webhook
```

4. 「更新」をクリック
5. 「検証」ボタンで接続確認（200 OKが返れば成功）

---

## 5. 動作確認チェックリスト

### 基本動作

- [ ] https://allyourfit.com を開いてLPが表示される
- [ ] 「トレーナーとして無料登録」から登録できる
- [ ] トレーナーログインが成功する
- [ ] ダッシュボードが表示される

### クライアント招待フロー

- [ ] クライアント招待リンクを発行できる
- [ ] 発行したリンク（`/join/[token]`）をスマホで開ける
- [ ] クライアントのオンボーディング（身長・体重・目標入力）が完了できる

### LINE連携

- [ ] LINE公式アカウントにあすけんのスクショを送れる
- [ ] Webhookが受信される（Vercelのログで確認）
- [ ] 画像が解析されてダッシュボードに記録される
- [ ] LINEにフィードバックメッセージが返信される

### マイグレーション確認

- [ ] Supabase → Table Editor で `scheduled_sessions` テーブルが存在する
- [ ] Supabase → Table Editor で `line_image_usage` テーブルが存在する
- [ ] Supabase → Table Editor で `client_goals` テーブルが存在する

---

## 補足情報

### マイグレーションファイル一覧（実行順）

| # | ファイル名 | 日付 | 主な変更内容 |
|---|-----------|------|-------------|
| 0 | schema.sql | ベース | trainers / clients 基本テーブル |
| 1 | migration-20260408-onboarding.sql | 2026-04-08 | オンボーディング・目標設定 |
| 2 | migration-20260409-multitenant.sql | 2026-04-09 | マルチテナント・LINE連携 |
| 3 | migration-20260412-two-plans.sql | 2026-04-12 | 2プラン対応・個人プラン |
| 4 | migration-20260413-scheduled-sessions.sql | 2026-04-13 | 予約・セッション管理 |
| 5 | migration-20260414-line-image-usage.sql | 2026-04-14 | LINE画像送信カウント |

### 課金フロー有効化について

現時点では `NEXT_PUBLIC_BILLING_ENABLED=false` でローンチします。
課金フローを有効化する場合は、Vercelの環境変数を `true` に変更してデプロイするだけです（Stripe設定が完了してから）。

### 参考ドキュメント

- `LAUNCH_CHECKLIST.md` — ローンチチェックリスト（佐藤作成）
- `CLAUDE.md` — AYF開発コンテキスト・エージェント構成
- `.env.local.example` — 環境変数テンプレート
- `supabase/schema.sql` — ベーススキーマ
