# Client Fit ブランドガイド

## カラーパレット

| 用途 | カラー | HEX |
|------|--------|-----|
| プライマリブルー | 青 | `#3b82f6` |
| アクセントシアン | 水色 | `#0ea5e9` |
| グラデーション | プライマリ→アクセント | `#3b82f6 → #0ea5e9` |
| ダークBG | LP背景 | `#0a0f1e` |
| テキスト白 | 見出し | `#ffffff` |
| テキスト薄 | 本文 | `#94a3b8` |
| テキスト極薄 | 補足 | `#64748b` |

## ロゴ

### ロゴマーク
- 青→シアンのグラデーション角丸正方形
- 白いフィットネス人体シルエット（腕を上げたポーズ）
- 下部に心電図ライン

### ロゴテキスト
- **フォント**: System UI, font-weight: 900 (font-black)
- **テキスト**: `Client Fit`
- **サブタイトル**: `CLIENT MANAGEMENT FOR TRAINERS`

### ファイル
| ファイル | サイズ | 用途 |
|---------|--------|------|
| `public/logo-mark.svg` | 512x512 | マスターSVG |
| `public/favicon.png` | 32x32 | ブラウザタブ |
| `public/icon-192.png` | 192x192 | PWA |
| `public/icon.png` | 512x512 | PWA |
| `public/apple-touch-icon.png` | 180x180 | iOS |
| `public/og-image.svg` | 1200x630 | SNSシェア用OGP |

### LINE用アイコン
- サイズ: 640x640px
- `scripts/generate-icons.html` をブラウザで開いて「LINE プロフィール」をダウンロード

## アイコン生成方法

`scripts/generate-icons.html` をブラウザで開くと、全サイズのアイコンをPNGでダウンロードできる。

1. ブラウザで `scripts/generate-icons.html` を開く
2. 各カードの「ダウンロード」ボタンでPNGを保存
3. `public/` フォルダに配置

## LINE公式アカウント設定

既存LINE公式アカウントの設定をClient Fit仕様に変更（新規作成不要）:

| 設定項目 | 変更内容 |
|---------|---------|
| アカウント名 | `Client Fit` |
| プロフィール画像 | `line-icon-640.png`（生成ツールからDL） |
| ステータスメッセージ | `トレーナー向けクライアント管理ツール` |
| 説明文 | `スクショをLINEに送るだけ。AIが自動解析してダッシュボードに反映。` |
