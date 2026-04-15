# AllYourFit（AYF）機能まとめ

> 最終更新: 2026-04-15

## コンセプト
**「スクショを送るだけで、全部わかる」統合フィットネスダッシュボード**

あすけん・筋トレMemo・STRONG・タニタ等の既存アプリのスクショをLINEに送ると、AIが自動解析してデータを一元管理。食事×トレーニング×体重×睡眠が1箇所に集まることで、個別アプリでは出せない洞察を提供する。

## 2プラン構成

| | トレーナープラン | 個人プラン |
|---|---|---|
| 対象 | パーソナルトレーナー | 一般ユーザー |
| 登録 | トレーナーがクライアントを代行登録 | 自己登録 → オンボーディング3ステップ |
| 料金 | 1名無料 / 2名目〜 ¥500/名/月 | 無料（ローンチ期間） |

## 主要機能

### 1. LINE スクショ自動取込
- LINEに画像を送るだけでClaude Vision APIが自動解析
- 対応: **食事記録（あすけん等）/ トレーニング（筋トレMemo・STRONG）/ 体組成（タニタ）/ 有酸素**
- PIN送信でアカウント連携、月150枚制限（130枚で警告通知）

### 2. クライアントダッシュボード（/client/[id]）
- **今日タブ**: 当日の体重・食事カロリー・トレーニング概要
- **記録タブ**: 体重/体脂肪/筋肉量の推移グラフ（7/30/90日切替）、トレーニングボリューム推移、食事マクロ栄養素集計
- **フォトタブ**: Before/After写真の比較表示
- **AIタブ**: アセスメントレポート、レコメンデーション、相関分析（体重×カロリー、睡眠×RPE等）

### 3. AIアセスメント・提案エンジン
- 疾患リスクインジケーター（生活習慣病・筋骨格・栄養・睡眠）
- 将来予測シミュレーション（1ヶ月・3ヶ月後）
- サプリ・食品レコメンド
- 改善策＋リスク軽減効果の予測＋改善スパン提示

### 4. トレーナー管理画面（/trainer）
- クライアント一覧（要対応フラグ・最終活動日）
- 新規クライアント追加（PIN自動発行・案内文コピー）
- 身体記録・トレーニングセッション入力フォーム
- 目標設定・ロードマップ作成 → LINEで送信
- 週次/月次レポート生成 → LINEで送信
- 招待リンク発行（/join/[token]、7日有効）

### 5. LINEオンボーディング（トレーナープラン）
- クライアントがPIN送信 → 自動で質問開始（身長・体重・体脂肪率・年齢・性別・健康上の注意点）
- 回答完了 → トレーナー側に通知バナー表示

### 6. 個人プラン オンボーディング（/onboarding）
- Step 1: コース選択（減量/ボディメイク/バルクアップ/健康維持/大会準備）
- Step 2: 目標値・達成期限・週トレーニング頻度
- Step 3: 基本情報（身長・体重・体脂肪率・生年・性別）

### 7. 医療データ連携（マイナポータルAPI）
- 特定健診情報・薬剤情報・予防接種記録の取得（UI実装済み、API申請待ち）

### 8. 決済（Stripe）
- フラグで現在OFF（`BILLING_ENABLED=false`）
- Pro: ¥500/名/月、顧客ポータルでサブスク管理

### 9. セキュリティ
- PIN認証（SHA256ハッシュ、5回失敗で15分ロック）
- トレーナーセッション管理（Cookie + DB、30日有効）
- LINE署名検証（HMAC-SHA256）
- IPレート制限（登録10回/時間）

### 10. SNSシェア・紹介
- グラフのX/Instagramシェア機能
- クライアントダッシュボードに紹介バナー

## 技術スタック
Next.js 16 / React 19 / TypeScript / Supabase / Stripe / LINE Messaging API / Claude API (Vision + Text) / Recharts / Tailwind CSS 4 / Vercel

## APIルート一覧（29本）

### 認証系
| API | 説明 |
|-----|------|
| `/api/auth/pin` | PIN認証（レート制限付き） |
| `/api/auth/magic` | マジックリンク認証 |

### トレーナー認証・登録
| API | 説明 |
|-----|------|
| `/api/trainer/register` | 新規トレーナー登録 |
| `/api/trainer/auth` | トレーナーログイン |
| `/api/trainer/line-link-code` | ログイン用ワンタイムリンク生成 |

### クライアント管理
| API | 説明 |
|-----|------|
| `/api/trainer/clients` | クライアント一覧取得/新規追加 |
| `/api/trainer/clients/[id]/memo` | クライアントメモ更新 |
| `/api/trainer/clients/[id]/message` | クライアントへLINEメッセージ送信 |

### LINE Webhook
| API | 説明 |
|-----|------|
| `/api/line/webhook/[trainerId]` | トレーナー別Webhook（スクショ解析・オンボーディング） |
| `/api/line/webhook` | グローバルWebhook（フォールバック） |

### AI・データ処理
| API | 説明 |
|-----|------|
| `/api/assessment/generate` | アセスメント生成（トレーナー用） |
| `/api/assessment/self-generate` | アセスメント生成（個人用） |
| `/api/recommendation/generate` | レコメンデーション生成（実装予定） |

### トレーニング・目標・レポート
| API | 説明 |
|-----|------|
| `/api/trainer/training` | トレーニングセッション取得/作成 |
| `/api/trainer/body-record` | 身体計測データ取得/作成 |
| `/api/trainer/assessment` | アセスメント取得/生成 |
| `/api/trainer/goals` | 目標取得/作成/更新 |
| `/api/trainer/goals/send` | 目標をLINEで送信 |
| `/api/trainer/report` | レポート取得/生成 |
| `/api/trainer/report/send` | レポートをLINEで送信 |

### 招待・オンボーディング
| API | 説明 |
|-----|------|
| `/api/trainer/invite` | 招待トークン生成（7日有効） |
| `/api/join/[token]` | 招待トークン検証/クライアント登録 |
| `/api/onboarding` | 個人プランオンボーディング完了処理 |

### 決済
| API | 説明 |
|-----|------|
| `/api/stripe/checkout` | Proプラン購入フロー開始 |
| `/api/stripe/portal` | 顧客ポータル起動 |
| `/api/stripe/webhook` | Stripe Webhook |

### 開発・テスト用
| API | 説明 |
|-----|------|
| `/api/_reset` | 全データリセット（`ALLOW_RESET=true` 必要） |
| `/api/_migrate` | DB移行処理（開発用） |

## 開発・テスト用機能

### ソロテストモード（`SOLO_TEST_MODE=true`）
1つのLINEアカウントでトレーナー・クライアント両方の通知を受け取れるモード。
`SOLO_TEST_MODE=true` を環境変数に設定すると、トレーナー向けpush通知がクライアントのLINEに `【トレーナー通知】` プレフィックス付きで届く。

### データリセットAPI（`POST /api/_reset`）
`ALLOW_RESET=true` を環境変数に設定し、`POST /api/_reset` を呼ぶと全データ（トレーナー・クライアント・記録）を削除。

## データモデル（主要テーブル）

| テーブル | 用途 |
|---------|------|
| `trainers` | トレーナー基本情報・LINE/Stripe連携 |
| `clients` | クライアント情報・PIN・LINE連携・オンボーディング状態 |
| `body_records` | 身体計測（体重・体脂肪・筋肉量・血圧・睡眠・コンディション） |
| `training_sessions` | トレーニングセッション（親） |
| `training_sets` | トレーニングセット（子: 種目・重量・回数・RPE） |
| `meal_records` | 食事記録（カロリー・PFC） |
| `body_photos` | ボディフォト |
| `assessments` | AIアセスメント（リスク評価・行動計画） |
| `client_goals` | 目標・ロードマップ |
| `line_parse_logs` | LINE画像解析ログ |
| `trainer_sessions` | トレーナーセッション管理 |
| `pin_attempts` | PIN認証レート制限 |
| `register_attempts` | 登録IPレート制限 |
