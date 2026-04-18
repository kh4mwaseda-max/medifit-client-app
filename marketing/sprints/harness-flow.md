# CF ハーネスエンジニアリング フロー図

## エージェント構成

```
佐藤次郎 CEO（PersonalTrainer）
    │ 方針・優先度の指示
    ▼
橘凜（Planner）
    │ スプリントコントラクト作成
    │ prompt-tachibana.md
    ▼
┌─────────────────────────────────┐
│      Generator（選択式）         │
│                                 │
│  Kira ─── リサーチ・競合分析    │
│  Mio  ─── UI/フロント実装       │
│  佐藤 ─── バックエンド確認      │
│                                 │
│  ↓ 成果物 + 自己評価レポート    │
└─────────────────────────────────┘
    │
    ▼
Evaluator（懐疑的人格）
    │ prompt-evaluator.md
    │
    ├─── ❌ 差し戻し ──→ Generatorへ戻す（イテレーション継続）
    │         ↑__________________________________│
    │
    └─── ✅ 承認 ──→ 橘凜（次スプリント計画）
```

---

## スプリントライフサイクル

```
[橘凜] sprint-XXX-contract.md を作成
    │
    ▼
[Generator] スプリントコントラクトを読む
    │ 実装・リサーチ実施
    │ DoD自己評価を記入
    ▼
[Evaluator] コントラクトの受け入れ条件を1つずつ確認
    │
    ├── ❌ 差し戻し
    │       └── sprint-XXX-eval-N.md に差し戻し理由を記録
    │       └── GeneratorへFB → 修正 → 再提出
    │
    └── ✅ 承認
            └── sprint-XXX-eval-N.md に承認コメントを記録
            └── コントラクトの最終承認欄を記入
            └── 橘凜へ報告 → 次スプリントへ
```

---

## ファイル命名規則

| ファイル | 場所 | 作成者 |
|---------|------|-------|
| `sprint-001-contract.md` | `marketing/sprints/` | 橘凜（Planner） |
| `sprint-001-eval-1.md` | `marketing/sprints/` | Evaluator |
| `sprint-001-eval-2.md` | `marketing/sprints/` | Evaluator（2回目） |

---

## スプリント一覧（2026-04-12更新）

| Sprint | タイトル | Generator | ステータス |
|--------|---------|-----------|-----------|
| 001 | LP作成 | Mio | ✅ 承認済み |
| 002-A | Vercelデプロイ確認 | 佐藤 | ✅ 承認済み（URL生存確認） |
| 002-B | 招待フロー実装 | Mio + 佐藤 | ✅ 承認済み |
| 003 | SNSシェア機能 | Mio | ✅ 承認済み（実装確認） |
| 101 | Kiraリサーチ全5本 | Kira | ✅ 承認済み |
| 102 | LINEステップ配信シナリオ | Kira | ✅ 完了（line-scenario.md） |
| 201 | /client/[id] ダッシュボード | 佐藤 | ✅ 承認済み（実装確認） |
| 202 | Phase 0 フィードバックシート | 橘凜 | ✅ 完了（phase0-feedback-sheet.md） |

## 稲川さんに残るアクション（コードでは対応不可）

| 項目 | 内容 |
|------|------|
| note公開 | `note/note-publish-checklist.md` を確認→スクショ撮影→Xアカウント記入→公開 |
| X投稿開始 | `x-post-templates.md` から選んで投稿 |
| トレーナー声かけ | `dm-templates.md` からコピーしてDM送信 |
| LINE公式アカウント開設 | LINE Developers で Messaging API チャンネル作成 |

---

## 使い方（稲川さんへ）

各エージェントを動かすには、対応するプロンプトファイルの内容をそのまま新しいClaudeセッションに貼り付けてください。

| やりたいこと | 貼るプロンプト |
|------------|--------------|
| スプリントを設計したい | `prompts/prompt-tachibana.md` |
| リサーチを依頼したい | `prompts/prompt-kira.md` |
| UI実装を依頼したい | `prompts/prompt-mio.md` |
| 実装確認をしたい | `prompts/prompt-sato.md` |
| 成果物を評価したい | `prompts/prompt-evaluator.md` |
