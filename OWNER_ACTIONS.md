# 稲川さん対応事項（Client Fit リリース最終ステップ）

作成: 2026-04-20 / 田中美咲（秘書）・佐藤次郎CEO共同整理
**更新: 2026-04-24** — 本日リリースに向けてPGEハーネスで監査・修正済み
対象: 稲川雅也オーナー

コード側の作業は完了済み。以下の4項目が本番稼働に必要な「稲川さんしかできない」作業です。上から順に実施してください。所要時間：合計 約90〜120分。

---

## 🆕 2026-04-24 事前準備（田中側で完了済み）

監査の結果、以下を修正・追加しました。**Supabase マイグレーション実行時に反映されます。**

- CRON_SECRET 未設定時に Cron 認証がスキップされる脆弱性 → 必須化
- `increment_line_image_count` RPC 関数を `migration-20260414-line-image-usage.sql` に追加（画像カウントの race condition を防止）
- `.env.local.example` に抜けていた環境変数を追加: `CRON_SECRET` / `NEXT_PUBLIC_LINE_FRIEND_URL` / `STRIPE_*`

### 稲川さん用・生成済みランダムトークン（そのままコピペ可）

```env
TRAINER_SESSION_TOKEN=d8943daa31f89a9c4231c9e363b3778effe21493d23461f4af042e0e1c0f6b35
CRON_SECRET=622f299a1a1a0ac0cff924d22e1110604c575d5fee059d521a44ec2d3a8e63b3
```

（万が一このファイルが外部に漏洩する場合は再発行してください。念のため `openssl rand -hex 32` で再生成可）

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
| `TRAINER_SESSION_TOKEN` | 上記の生成済みトークンを使用 |
| `TRAINER_ID` | `3072f02e-d70e-4e3a-a67b-55e88981351c`（`migration-20260409-multitenant.sql` で既存レコード作成済み） |
| `NEXT_PUBLIC_APP_URL` | デプロイ後の URL（例: `https://[project].vercel.app`） |
| `NEXT_PUBLIC_BILLING_ENABLED` | `false` |
| `BILLING_ENABLED` | `false`（サーバー側ガード用・NEXT_PUBLIC_と別） |
| `CRON_SECRET` | 上記の生成済みトークンを使用。**未設定だと本日デイリーサマリーが全401になります** |
| `NEXT_PUBLIC_LINE_FRIEND_URL` | LINE Official Account Manager → 友だち追加QR → URL |

> `TRAINER_ID` は既に `migration-20260409-multitenant.sql` 内で既存レコード（名前: `masaya4887`）として作成済み。再デプロイ不要。

### 4-4. ドメイン接続（任意）

- `clientfit.com` 等を Value Domain 等で取得
- Vercel の Domains で追加・DNS 設定
- `NEXT_PUBLIC_APP_URL` を本番ドメインで上書き

### 4-5. LINE Webhook URL 更新

STEP 2 のチャネル設定で Webhook URL を `https://[本番ドメイン]/api/line/webhook` に設定 → 「検証」ボタンで 200 OK を確認。

> ⚠️ 注意: コード内には `/api/line/webhook/[trainerId]` （将来の複数トレーナー展開用）も存在しますが、本日リリースでは **パラメータなしの `/api/line/webhook`** を使ってください。`[trainerId]` 版は将来 B2B の各トレーナーが独自 LINE チャネルを設定するときに使います。

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

---

## 🟡 既知の制約（リリース時点で未解決・本番運用上の注意）

2026-04-24 Evaluator（疑似ユーザー動線レビュー）による指摘から、**致命的ではないが稲川さんに認識しておいて欲しい**制約。

### 1. トレーナーログインは LINE マジックリンク専用

- `/trainer/login` は公式LINEに「ログイン」と送信する方式のみ対応。
- 稲川さん本人は既存レコード（`masaya4887` パスワード）が DB に残っているが、UI からはその入力欄がないため LINE 連携経由でログインする必要がある。
- 初回: 公式LINEを友だち追加 → LINE連携コードで連携 → 以降「ログイン」送信で毎回マジックリンクを受信

### 2. 新規クライアント追加の動線が2系統ある

- (A) `/trainer/clients/new` — PINのみ発行（招待URLなし）
- (B) ダッシュボードの「招待リンク発行」ボタン — PIN + 招待URL両方発行
- **(B) を使ってください**。(A) はレガシー動線で、クライアントには公式LINE友だち追加→PIN送信が必要。

### 3. スクショ送信時のリアルタイム通知は未実装

- クライアントがスクショを送っても、トレーナーには**翌朝のデイリーサマリーまで通知は来ない**。
- ダッシュボードを自発的に開いて確認する運用。

### 4. LINE月150枚制限はトレーナー単位

- 複数クライアントの合計で150枚/月。超えると `/api/line/webhook` がブロックする。
- 130枚で警告通知が稲川さんのLINEに届く（`line_notify_user_id` 設定が前提）。

### 5. デイリーサマリーは LINE連携済みトレーナーのみに届く

- `line_notify_user_id` 未設定のトレーナーには無言スキップ。
- 稲川さん本人が公式LINEを友だち追加してトレーナー連携コードを入力すること。

### 6. ボディフォトURL は24時間有効

- 署名付きURLは再訪時に都度発行。ブックマーク保存したURLは翌日切れる。
- ダッシュボードを開き直せば自動で再発行されるため実運用では問題なし。

### 7. 招待リンクの有効期限は7日

- 7日過ぎると `/join/[token]` が「リンクが無効です」表示。再発行はダッシュボードの「招待リンク発行」から。

### 8. 招待リンク経由の登録直後は PIN 再入力不要（2026-04-24 修正）

- Join完了時に `client_auth_${id}` Cookie が自動発行される。
- 24時間を超えて再訪した場合は PIN 入力が必要。

### 9. ログアウト後のクライアント側再アクセスは PIN 入力必須

- ダッシュボード `/client/[id]` は PIN認証で保護。
- 5回失敗で15分ロック。

### 10. LP の「エントリープラン ¥0・今後数百円」は暫定コピー

- 実装上は `BILLING_ENABLED=false` で全員無料・機能制限なし。
- 課金ON時の「1名制限」「Pro ¥500/月〜」表記は **BILLING_ENABLED=true** にした瞬間に表示される。切り替え前に LP/設定画面のコピー整合を稲川さんが再確認すること。

### 11. 画像解析失敗時のメッセージは汎用的

- Claude Vision エラーも「認識できないアプリ」も同じ文言が返る。ユーザーが原因を誤解する可能性あり。

詳細な監査レポート: `marketing/sprints/` 配下にPGE評価ログを保管予定。
