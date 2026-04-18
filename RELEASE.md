# Client Fit 本番リリース手順書

作成: 2026-04-16（ピボット対応版）
対象: 稲川オーナー

---

## 概要

Client Fit（旧AYF）をリリースするために必要な手順をまとめたもの。
ドメイン取得・デプロイはローカル確認完了後の最終ステップとする。

- Supabaseプロジェクト: `cpjskwdsznfupicsqbpy`
- スタック: Next.js + Supabase + Anthropic Claude Vision API + LINE Messaging API

---

## 1. Supabase SQLマイグレーション実行

### 実行場所

https://supabase.com → プロジェクト `cpjskwdsznfupicsqbpy` → 左メニュー「SQL Editor」

### 実行順序（必ずこの順番で）

各ファイルの中身をSQL Editorに貼り付けて「Run」ボタンを押す。
`if not exists` が付いているので、すでに実行済みのものは安全にスキップされる。

| # | ファイル | 内容 |
|---|---------|------|
| 0 | `supabase/schema.sql` | ベーステーブル（初回のみ） |
| 1 | `supabase/migration-20260408-onboarding.sql` | クライアント拡張・目標設定 |
| 2 | `supabase/migration-20260409-multitenant.sql` | マルチテナント・LINE連携 |
| 3 | `supabase/migration-20260412-two-plans.sql` | LINE連携コード拡張 |
| 4 | `supabase/migration-20260413-scheduled-sessions.sql` | 予約管理テーブル |
| 5 | `supabase/migration-20260414-line-image-usage.sql` | LINE画像送信カウント |

### ファイルの場所
```
PersonalTrainer/product/allyourfit/supabase/
```

---

## 2. 環境変数の設定

### Vercelでの設定（デプロイ時）

| 変数名 | 説明 | 取得場所 |
|--------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトURL | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase匿名キー | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabaseサービスロールキー（秘匿） | Supabase → Settings → API |
| `ANTHROPIC_API_KEY` | Claude Vision APIキー | https://console.anthropic.com |
| `TRAINER_PASSWORD` | トレーナーログイン用パスワード | 任意の文字列 |
| `TRAINER_SESSION_TOKEN` | セッショントークン（32文字以上推奨） | 任意のランダム文字列 |
| `TRAINER_ID` | SupabaseのトレーナーUUID | Supabase → Table Editor → trainers |
| `NEXT_PUBLIC_APP_URL` | 本番URL | デプロイ後に設定 |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINEチャネルアクセストークン | LINE Developers Console |
| `LINE_CHANNEL_SECRET` | LINEチャネルシークレット | LINE Developers Console |
| `NEXT_PUBLIC_BILLING_ENABLED` | 課金フロー有効化フラグ | `false` |

### ローカル開発用

`.env.local.example` をコピーして `.env.local` を作成:
```
cp .env.local.example .env.local
```

---

## 3. LINE公式アカウント設定

1. https://developers.line.biz でMessaging APIチャネルを作成（または既存を流用）
2. チャネルアクセストークン・シークレットをコピー
3. Webhook URLを設定（デプロイ後）:
```
https://[本番ドメイン]/api/line/webhook
```
4. 「検証」ボタンで接続確認（200 OKが返れば成功）

---

## 4. デプロイ（最終ステップ）

### ドメイン取得
- `clientfit.com` 等を取得（デプロイ直前に実施）

### Vercelデプロイ
1. GitHubにプッシュ → Vercelで自動デプロイ
2. 環境変数を設定
3. カスタムドメインを接続

---

## 5. 動作確認チェックリスト

### 基本動作
- [ ] LPが表示される
- [ ] 「無料でトレーナー登録する」から登録できる
- [ ] トレーナーログインが成功する
- [ ] トレーナーダッシュボードが表示される

### クライアント招待フロー
- [ ] クライアント招待リンクを発行できる
- [ ] `/join/[token]` をスマホで開ける
- [ ] PINが発行される

### LINE連携
- [ ] Client Fit公式LINEにスクショを送れる
- [ ] 画像が解析されてダッシュボードに記録される
- [ ] LINEに確認メッセージが返信される
- [ ] デイリーサマリーがトレーナーに届く

### レポート送信
- [ ] コメントをクライアントのLINEに送信できる
- [ ] まとめレポートをLINE送信できる
