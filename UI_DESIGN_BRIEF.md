# Client Fit UI設計指示書 v2（コードレビュー後・修正版）
> 担当: Mio（UIデザイン・UXリサーチ）
> 宛先: 佐藤（実装担当）
> 日付: 2026-04-12
> 前回v1は未読のコードに基づく誤認が多かった。コード全読み後に書き直し。

---

## 0. 現状の正確な把握

### 実装済みコンポーネント（再確認）

| コンポーネント | 状態 | 備考 |
|---|---|---|
| `ClientDashboard.tsx` | ✅ 実装済・大規模 | 7タブ構成、ライトテーマ（白/blue-600） |
| `BodyChart.tsx` | ✅ 実装済 | 体重/体脂肪/筋肉量の折れ線グラフ |
| `MealChart.tsx` | ✅ 実装済 | カロリー推移 + PFCバランス棒グラフ |
| `TrainingChart.tsx` | ✅ 実装済 | 要確認 |
| `PhotoComparison.tsx` | ✅ 実装済 | サイドバイサイド比較 |
| `AssessmentCard.tsx` | ✅ 実装済 | アセスメント表示 |
| `RecommendationPanel.tsx` | ✅ 実装済 | リスク分析・サプリ推奨・改善アクション |
| `DigitalTwin.tsx` | ✅ 実装済（詳細未確認） | ClientDashboardからimport |
| `PinGate.tsx` | ✅ 実装済 | PIN認証ゲート |
| `Logo.tsx` | ✅ 実装済 | ロゴ |
| `image-analyzer.ts` | ✅ 実装済・本格仕様 | Claude APIで食事/筋トレ/体重/有酸素を自動解析 |
| `line.ts` + webhookルート | ✅ 実装済 | LINEスクショ受信パイプライン稼働中 |
| `/client/[id]` ルーティング | ✅ 実装済 | PIN認証 + 全データ取得済み |
| `BodyRecordForm.tsx` | ✅ 実装済 | |
| `TrainingForm.tsx` | ✅ 実装済 | |
| `AssessmentManager.tsx` | ✅ 実装済 | |

### スキーマ確認結果（佐藤への確認事項3点 → すべてコードで解決）

1. **食事データのスキーマ** → ✅ `meal_records`テーブル完全実装済み（protein_g, fat_g, carbs_g含む）
2. **LINEスクショパイプライン** → ✅ `image-analyzer.ts`が全アプリ対応で本番稼働可能な状態
3. **クライアントルーティング** → ✅ `/client/[id]`で実装済み・PIN認証まで動いている

---

## 1. 発見した重大な設計問題

### 問題1: テーマの分断

現状：
- **トレーナー側（trainer/）**: ダークテーマ（black/gray-900、green-500アクセント）
- **クライアント側（ClientDashboard）**: **ライトテーマ**（bg-[#f0f4f8]、white card、blue-600アクセント）

これは意図的な設計か？

**Mio判断:** クライアント向けはライトテーマのほうが正しい。理由：
- クライアントはジムではなく自宅のスマホで見る（明るい環境）
- 医療・健康系サービスは白ベースが信頼感を与える（参照: WHOOP, TrueCoach, MyPTHub全てライト）
- トレーナーは業務ツール = ダーク、クライアントはビューアー = ライト、で役割分担が成立している

**→ 佐藤：現状のライト/ダーク分断は維持する。クライアント画面はライトで統一。**

### 問題2: タブが7個（多すぎ）

現状のClientDashboardのタブ：
```
サマリー / 身体データ / トレーニング / 食事 / フォト / AI分析 / 提案
```

**参照サービスの標準:**
- WHOOP: 5タブ（Sleep / Recovery / Strain / Stress / Coach）
- TrueCoach: クライアントビューは3〜4セクション
- MyFitnessPal: 多タブが原因でUX評価が低い（反面教師）

**Mio判断:** 7タブは多すぎる。スクロールが横に出て、3タブ目以降が押されなくなる。

**→ 佐藤：以下の統合案を検討して実装する。**

```
現状 7タブ → 推奨 4タブへ統合

[今日] ← サマリー（ファーストビュー強化）
[記録] ← 身体データ + トレーニング + 食事 を1画面にまとめる
[フォト] ← 現状維持
[AI] ← AI分析 + 提案 を統合
```

---

## 2. 実装すべき差別化機能（相関グラフ）

これが未実装かつKira確定のコアバリュー。データは全て揃っているのに可視化がない。

### 2-A. 体重 × カロリー収支の重ね表示

`meal_records`の日別合計カロリーと`body_records`の体重を同一グラフに重ねる。

```tsx
// ClientDashboardのサマリータブ、または「記録」タブ下部に追加
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// データ準備（page.tsxかClientDashboard内で計算）
const correlationData = mergeByDate(bodyRecords, mealRecords);
// → [{ date: "4/1", weight_kg: 68.2, calorie_balance: -250 }, ...]

<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
  <p className="text-xs text-blue-600 font-semibold mb-3">体重 × カロリー収支</p>
  <ResponsiveContainer width="100%" height={200}>
    <ComposedChart data={correlationData}>
      <Bar dataKey="calorie_balance" fill="#93c5fd" opacity={0.7} name="カロリー収支(kcal)" radius={[3,3,0,0]} />
      <Line dataKey="weight_kg" stroke="#3b82f6" strokeWidth={2} dot={false} name="体重(kg)" yAxisId="right" />
      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#3b82f6" }} axisLine={false} tickLine={false} />
      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
    </ComposedChart>
  </ResponsiveContainer>
  <p className="text-[11px] text-slate-400 mt-2">
    💡 カロリーが少ない週に体重が下がる傾向を確認できます
  </p>
</div>
```

### 2-B. 睡眠時間 × 翌日RPE

`body_records.sleep_hours`と翌日の`training_sets.rpe`を対応させる。

```tsx
// データ計算ロジック（ClientDashboard内）
const sleepRpeData = bodyRecords
  .map((b: any) => {
    const nextDay = addDays(parseISO(b.recorded_at), 1).toISOString().split("T")[0];
    const nextSession = trainingSessions.find((s: any) => s.session_date === nextDay);
    const avgRpe = nextSession?.training_sets?.length > 0
      ? nextSession.training_sets.reduce((sum: number, t: any) => sum + (t.rpe ?? 0), 0) / nextSession.training_sets.length
      : null;
    return { sleep: b.sleep_hours, rpe: avgRpe };
  })
  .filter((d: any) => d.sleep != null && d.rpe != null);

// ScatterChartで可視化
```

### 2-C. 週別タンパク質達成率 × 筋肉量変化

週単位に集計して傾向を示す。目標タンパク質は`client_goals`から取得可能。

---

## 3. 「今日」タブのファーストビュー強化

現状のサマリータブは`ProgressHeroCard`と`DigitalTwin`が主役。  
Kiraの確定事項「今日の3指標をファーストビューに」を実現するため、**先頭に3枚KPIカードを追加**する。

```tsx
// サマリータブの一番上（ProgressHeroCardの前）に挿入

// 今日の食事データ
const todayMeals = mealRecords.filter((m: any) => m.meal_date === today);
const todayProtein = todayMeals.reduce((sum: number, m: any) => sum + (m.protein_g ?? 0), 0);
const proteinGoal = goals?.target_protein_g ?? 150;

// 今日のトレーニング
const todaySession = trainingSessions.find((s: any) => s.session_date === today);

// 今日の体重
const todayBody = bodyRecords.find((b: any) => b.recorded_at === today);
const prevBody = bodyRecords[bodyRecords.length - 2];

<div className="grid grid-cols-3 gap-2">
  {/* 体重カード */}
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 text-center">
    <p className="text-[10px] text-slate-400 mb-1">今日の体重</p>
    <p className="text-xl font-bold text-slate-800">{todayBody?.weight_kg ?? "—"}</p>
    <p className="text-[10px] text-slate-400">kg</p>
    {prevBody?.weight_kg && todayBody?.weight_kg && (
      <p className={`text-xs font-medium mt-1 ${
        todayBody.weight_kg < prevBody.weight_kg ? "text-teal-500" : "text-rose-400"
      }`}>
        {todayBody.weight_kg > prevBody.weight_kg ? "+" : ""}
        {(todayBody.weight_kg - prevBody.weight_kg).toFixed(1)}
      </p>
    )}
  </div>

  {/* タンパク質カード */}
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 text-center">
    <p className="text-[10px] text-slate-400 mb-1">P達成率</p>
    <p className="text-xl font-bold text-slate-800">
      {proteinGoal > 0 ? Math.round((todayProtein / proteinGoal) * 100) : "—"}
    </p>
    <p className="text-[10px] text-slate-400">%</p>
    <div className="mt-1 h-1 bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-teal-400 rounded-full"
        style={{ width: `${Math.min(100, (todayProtein / proteinGoal) * 100)}%` }}
      />
    </div>
  </div>

  {/* トレーニングカード */}
  <div className={`rounded-2xl border shadow-sm p-3 text-center ${
    todaySession ? "bg-teal-50 border-teal-100" : "bg-white border-slate-200"
  }`}>
    <p className="text-[10px] text-slate-400 mb-1">今日のトレ</p>
    <p className={`text-xl font-bold ${todaySession ? "text-teal-600" : "text-slate-300"}`}>
      {todaySession ? "✓" : "—"}
    </p>
    <p className={`text-[10px] mt-1 ${todaySession ? "text-teal-500" : "text-slate-400"}`}>
      {todaySession ? "実施済み" : "未記録"}
    </p>
  </div>
</div>
```

---

## 4. 実装優先順位（修正版）

前回v1は現状を誤認していたため全面修正。

| 優先 | タスク | 工数感 | 理由 |
|------|--------|--------|------|
| 1 | 「今日」タブ先頭に3枚KPIカード追加 | 小 | Kira確定・データ全部揃ってる |
| 2 | 体重×カロリー相関グラフ追加 | 中 | 差別化の核。データ揃ってる |
| 3 | タブ7個→4個に統合 | 中 | UX改善、離脱率直結 |
| 4 | 睡眠×翌日RPE相関グラフ | 中 | 差別化の核2本目 |
| 5 | DigitalTwinのレビューと軽量化検討 | 小〜中 | 重くなければ現状維持でOK |

---

## 4-B. 橘（マーケ）からの追加依頼（2026-04-12）

### 追加タスク1: LP改修（最優先・マーケ要件）

`/app/page.tsx` を以下の仕様で全面書き換える。

#### カラーパレット（Mio決定）

```
背景:        bg-slate-950  (#0f172a)
カードBG:    bg-slate-900  (#0f172a より少し明るい)
アクセント:  text-blue-400 / bg-blue-500 （既存 blue-600 より明るく、ダーク背景に映える）
サブテキスト: text-slate-400
ボーダー:    border-slate-800
グラデ見出し: from-white to-slate-400 (bg-clip-text)
```

#### セクション構成

```
① ナビ（既存維持・背景のみ変更）
② ヒーロー
③ Before/After
④ 3つの特徴
⑤ コース紹介（5種）
⑥ フッター
```

#### ② ヒーロー セクション仕様

```tsx
// バッジ
<span className="text-[11px] font-bold text-blue-400 bg-blue-950 px-3 py-1 rounded-full border border-blue-800">
  🎉 ローンチ記念 · 全機能無料で使えます
</span>

// キャッチコピー（変更）
<h1>
  スクショを送るだけで、<br />
  <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
    "なぜ？"が分かる。
  </span>
</h1>

// サブコピー
<p>あすけん・STRONG・タニタ…バラバラなアプリを統合。
AIが食事×トレーニング×睡眠の相関を分析します。</p>

// CTAボタン 2本
<Link href="/trainer/register">
  トレーナーとして使う
</Link>
<Link href="/trainer/register">
  {/* 個人オンボーディング未実装のため暫定でregisterへ。実装後に差し替え */}
  個人で使う
</Link>
```

#### ③ Before/After セクション仕様

```tsx
// 矢印で「変換」を視覚化するレイアウト
<div className="flex items-center gap-4">
  {/* Before: 複数アプリアイコン（モック） */}
  <div className="space-y-2">
    <MockAppCard icon="🥗" name="あすけん" color="green" />
    <MockAppCard icon="💪" name="STRONG" color="orange" />
    <MockAppCard icon="⚖️" name="タニタ" color="blue" />
  </div>

  <span className="text-2xl text-slate-600">→</span>

  {/* After: Client Fitダッシュボードのミニプレビュー */}
  <div className="bg-white rounded-2xl p-3 shadow-lg w-40">
    <p className="text-[10px] text-slate-400 mb-2">統合ダッシュボード</p>
    <div className="space-y-1">
      <div className="h-2 bg-teal-100 rounded-full"><div className="h-2 bg-teal-400 rounded-full w-4/5"/></div>
      <div className="h-2 bg-blue-100 rounded-full"><div className="h-2 bg-blue-400 rounded-full w-3/5"/></div>
      <div className="h-2 bg-orange-100 rounded-full"><div className="h-2 bg-orange-400 rounded-full w-2/3"/></div>
    </div>
    <p className="text-[9px] text-slate-400 mt-2">💡 先週より体重-0.8kg</p>
  </div>
</div>
```

#### ⑤ コース紹介 セクション仕様

```tsx
const COURSES = [
  { icon: "🔥", name: "減量",     desc: "体重・体脂肪率を落とす",         accent: "text-orange-400" },
  { icon: "✨", name: "ボディメイク", desc: "見た目を引き締める・整える",   accent: "text-pink-400"   },
  { icon: "💪", name: "バルクアップ", desc: "筋肉・体重を本格的に増やす",   accent: "text-blue-400"   },
  { icon: "🌿", name: "健康維持",  desc: "生活習慣病予防・長期的な健康管理", accent: "text-teal-400"   },
  { icon: "🏆", name: "大会準備",  desc: "コンテスト・大会ピーキング",     accent: "text-yellow-400" },
];

// 横スクロールカード（モバイル）or 2列グリッド（PC）
```

### 追加タスク2: 招待フロー（バックエンド含む）

コードに招待機能が存在しないことを確認した。以下を実装する。

```
DB変更:
  clients テーブルに invite_token text unique カラムを追加

API追加:
  POST /api/trainer/invite
    → invite_token = nanoid(12) を生成してDBに保存
    → { url: "https://[本番ドメイン]/join/[token]" } を返す

新ページ追加:
  /join/[token]/page.tsx
    → tokenからtrainer_idを取得
    → trainer_id付きで /trainer/register に遷移（またはそのまま登録フォームを表示）

UIに追加:
  トレーナーダッシュボード（/trainer/clients/）に「招待リンク発行」ボタン
  → クリックでURLをクリップボードコピー + 「コピーしました」トースト
```

## 5. 触らなくていいもの

- `image-analyzer.ts` — 完成度高い。触るな
- `line.ts` / LINEウェブフック — 稼働中。触るな
- Stripe関連 — フラグOFFのまま温存
- `RecommendationPanel.tsx` — 完成度高い。触るな
- `PhotoComparison.tsx` — 現状維持

---

## 6. デザインルール（確定版）

### クライアント画面（`/client/`）
```
背景: bg-[#f0f4f8]（薄いグレー）
カード: bg-white, border border-slate-200, shadow-sm
アクセント: blue-600 / teal-500
成功: text-teal-600, bg-teal-50
警告: text-amber-500, bg-amber-50
危険: text-rose-500, bg-rose-50
角丸: rounded-2xl
フォント: 数値強調 text-xl〜2xl font-bold, ラベル text-[10px]〜text-xs text-slate-400
```

### トレーナー画面（`/trainer/`）
```
背景: bg-black
カード: bg-gray-900, border border-gray-800
アクセント: green-500
角丸: rounded-xl / rounded-2xl
← 現状維持
```

---

## 7. 相関データ計算ヘルパー（佐藤が実装する）

`src/lib/correlation.ts` として切り出す。

```ts
import { parseISO, format, addDays } from "date-fns";

/** 日付文字列をキーに body_records と meal_records をマージ */
export function buildWeightCalorieCorrelation(
  bodyRecords: any[],
  mealRecords: any[],
  targetCalories: number | null,
) {
  const mealByDate: Record<string, number> = {};
  for (const m of mealRecords) {
    mealByDate[m.meal_date] = (mealByDate[m.meal_date] ?? 0) + (m.calories ?? 0);
  }
  return bodyRecords
    .filter((b) => b.weight_kg != null)
    .map((b) => ({
      date: format(parseISO(b.recorded_at), "M/d"),
      weight_kg: b.weight_kg,
      total_calories: mealByDate[b.recorded_at] ?? null,
      calorie_balance: targetCalories && mealByDate[b.recorded_at]
        ? mealByDate[b.recorded_at] - targetCalories
        : null,
    }));
}

/** body_records の sleep_hours と翌日のセッション平均RPEをペアにする */
export function buildSleepRpeCorrelation(
  bodyRecords: any[],
  trainingSessions: any[],
) {
  const sessionByDate: Record<string, number> = {};
  for (const s of trainingSessions) {
    const sets = s.training_sets ?? [];
    const rpeValues = sets.map((t: any) => t.rpe).filter((r: any) => r != null);
    if (rpeValues.length > 0) {
      sessionByDate[s.session_date] = rpeValues.reduce((a: number, b: number) => a + b, 0) / rpeValues.length;
    }
  }
  return bodyRecords
    .filter((b) => b.sleep_hours != null)
    .map((b) => {
      const nextDay = format(addDays(parseISO(b.recorded_at), 1), "yyyy-MM-dd");
      return {
        sleep_hours: b.sleep_hours,
        next_rpe: sessionByDate[nextDay] ?? null,
        date: b.recorded_at,
      };
    })
    .filter((d) => d.next_rpe != null);
}
```
