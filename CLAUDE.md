# AYF（All Your Fit）— 開発コンテキスト

## プロダクト概要
- **名称**: AYF（All Your Fit）
- **コンセプト**: スクショを送るだけで「なぜ？」を教えてくれる統合フィットネスダッシュボード
- **差別化**: 食事×トレーニング×体重の相関分析（あすけん・STRONG単独では不可能）
- **スタック**: Next.js + Supabase + Claude Vision API + LINE Messaging API

## エージェントチーム

| エージェント | 役割 | プロンプトファイル |
|------------|------|--------------------|
| 橘凜 | Planner（スプリント設計・進行管理） | `marketing/prompts/prompt-tachibana.md` |
| Kira | Generator — リサーチ担当 | `marketing/prompts/prompt-kira.md` |
| Mio | Generator — UI/フロント実装担当 | `marketing/prompts/prompt-mio.md` |
| 佐藤 | Generator — バックエンド実装確認担当 | `marketing/prompts/prompt-sato.md` |
| Evaluator | 品質評価担当（懐疑的人格） | `marketing/prompts/prompt-evaluator.md` |

## ハーネスエンジニアリングルール

このプロジェクトは **Planner → Generator → Evaluator** のイテレーションループで動く。

### 基本フロー
```
橘凜（Planner）
    ↓ スプリントコントラクト作成（marketing/sprints/sprint-XXX-contract.md）
Generator（Kira / Mio / 佐藤）
    ↓ 実装・成果物提出 + 自己評価レポート記入
Evaluator
    ↓ 懐疑的評価 → 承認 or 差し戻し
    ↓（差し戻しの場合）Generatorへ戻す
    ↓（承認の場合）次スプリントへ
```

### 必須ルール
1. **スプリントコントラクトなしで着手禁止** — 受け入れ条件（DoD）が未定義の作業はしない
2. **Generator は提出時に必ず自己評価を記入** — コントラクトの自己評価欄を埋めること
3. **Evaluator は「問題なし」を即断しない** — 実際に操作・確認した根拠を示すこと
4. **1発完了を目指さない** — 5〜15回のイテレーションを前提とする
5. **差し戻しは正常** — 差し戻しはバグではなくプロセスの一部

### スプリント管理
- テンプレート: `marketing/sprints/sprint-contract-template.md`
- スプリントファイル: `marketing/sprints/sprint-XXX-contract.md`
- 評価ログ: `marketing/sprints/sprint-XXX-eval-N.md`

## ディレクトリ構成（marketing配下）
```
marketing/
├── prompts/          # 各エージェントのプロンプト
├── requests/         # エージェント間の依頼書
├── research/         # Kiraのリサーチ成果物
├── sprints/          # スプリントコントラクト・評価ログ
└── acquisition-plan.md  # ユーザー獲得計画
```

## 現在のフェーズ
- Phase 0: 0→10人（2026年4〜5月）
- 優先タスク: Vercelデプロイ・LP作成・トレーナー声かけ開始
- マッスルゲート（2026/5/17）前後が最大のチャンス
