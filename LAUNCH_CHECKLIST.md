# AYF ローンチチェックリスト
**作成: 佐藤 / 2026-04-12**
**対象: 稲川オーナー**

---

## ✅ 完了済み（佐藤が対応）

- [x] `https://allyourfit.com` 本番稼働
- [x] LP（ランディングページ）実装・デプロイ
- [x] トレーナー登録・ログインフロー
- [x] 個人プランオンボーディング（3ステップ）
- [x] クライアント招待リンク発行
- [x] LINEスクショ自動解析・記録
- [x] トレーナーLINE通知連携
- [x] グラフSNSシェア機能
- [x] 課金UI（BILLING_ENABLED=falseで非表示）
- [x] Vercel環境変数 `NEXT_PUBLIC_APP_URL=https://allyourfit.com` 更新

---

## 🔴 稲川さんに実施をお願いしたいもの

### 1. Supabase SQLマイグレーション実行（必須）

[supabase.com](https://supabase.com) → `cpjskwdsznfupicsqbpy` プロジェクト → SQL Editor

以下の順番でファイルの中身を貼り付けて実行してください：

```
1. supabase/migration-20260408-onboarding.sql
2. supabase/migration-20260409-multitenant.sql
3. supabase/migration-20260412-two-plans.sql
```

（すでに実行済みのものは `if not exists` があるのでスキップされます）

### 2. LINEのWebhook URL更新（必須）

[LINE Developers](https://developers.line.biz) → Messaging APIチャネル → Webhook URL

```
変更前: https://medifit-client-app.vercel.app/api/line/webhook
変更後: https://allyourfit.com/api/line/webhook
```

### 3. note記事の公開（橘が準備中）

`marketing/note/note-publish-checklist.md` 参照。
残り2点:
- Xアカウント名を教えてもらえれば橘が差し替えます
- ダッシュボードのスクショを撮って橘に渡す

### 4. X投稿テンプレートの確認

`marketing/note/x-post-templates.md` を確認。
note公開後すぐ投稿できる文章を用意してあります。

---

## 🟡 中期対応（急がない）

- [ ] Vercel Pro プランへのアップグレード（月$20、商用規模になったら）
- [ ] GitHub Privateリポジトリ作成（総務対応中）
- [ ] VPS環境構築（総務対応中）
- [ ] マイナポータルAPI申請（`myna-portal-api-application-draft.md` 参照）
- [ ] カスタムドメインのメールアドレス取得（`info@allyourfit.com` 等）

---

## 🟢 今すぐ試せること

1. `https://allyourfit.com` を開く → LPを確認
2. 「トレーナーとして無料登録」から登録してみる
3. クライアント招待リンクを発行して、自分のスマホで `/join/[token]` を開いてみる
4. LINE公式アカウントにあすけんのスクショを送ってみる

