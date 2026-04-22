# Client Fit ローンチチェックリスト

更新: 佐藤 / 2026-04-21（cf design tokens 全画面統一 + Cookie secure フラグ + Node engines 追記）

---

## 完了済み（佐藤が対応）

- [x] LP実装（トレーナー専用・料金セクション付き）
- [x] トレーナー登録・ログインフロー
- [x] クライアント招待リンク発行
- [x] LINEスクショ自動解析・記録
- [x] トレーナーLINE通知連携
- [x] デイリーサマリー配信（cron）
- [x] コメント＆レポートLINE送信
- [x] グラフSNSシェア機能
- [x] 課金UI（BILLING_ENABLED=falseで非表示）
- [x] 個人プラン関連コード削除
- [x] Client Fit ブランド名統一
- [x] ドキュメント全更新（FEATURES.md / CLAUDE.md / RELEASE.md）
- [x] note記事改訂（トレーナー向け）
- [x] ビルド成功確認
- [x] cf design tokens 全12画面統一（2026-04-21）
- [x] 認証Cookie に `secure: isProd` フラグ追加（trainer/auth・trainer/register・auth/pin の3ルート）
- [x] `package.json` に `engines.node >= 20.0.0` と `typecheck` スクリプト追加
- [x] 体型写真アップロード機能（Web・Before/After 比較・署名付きURL）— クライアント・トレーナー両面対応（2026-04-21）

---

## 佐藤CEOが対応するもの（稲川さん不要）

- [x] LINE月150枚制限の警告通知実装
- [x] ビルド・型チェック 全通過確認（2026-04-20）
- [x] 不要ファイル整理（fix.py削除・marketing/README.md追加・旧ブランド残存を全置換）
- [x] 稲川さん向け手順書最終化（OWNER_ACTIONS.md 新規作成）
- [ ] ローカル全フロー動作確認（稲川さん実機検証時に伴走）

---

## 稲川さんに実施をお願いするもの（リリース時）

👉 詳細手順は **`OWNER_ACTIONS.md`** にステップ化済み。上から順に実施するだけで本番稼働まで到達。

1. Supabase SQLマイグレーション実行（必須） — 30分
2. LINE Messaging API チャネル設定（必須） — 20分
3. Anthropic APIキー確認（必須） — 5分
4. Vercel デプロイ + 環境変数 + ドメイン接続 — 30〜60分
5. 本番動作確認（体型写真アップも含む） — 15分

合計: 約90〜120分で本番稼働。

---

## 中期対応（急がない）

- [ ] Vercel Proプランアップグレード（商用規模になったら）
- [ ] GitHubプライベートリポジトリ作成
- [ ] マイナポータルAPI申請
- [ ] カスタムドメインのメールアドレス取得
