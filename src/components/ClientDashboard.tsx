"use client";

import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ScatterChart, Scatter,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { format, parseISO, subDays } from "date-fns";
import { ja } from "date-fns/locale";
import BodyChart from "./BodyChart";
import TrainingChart from "./TrainingChart";
import MealChart from "./MealChart";
import PhotoTab from "./PhotoTab";
import AssessmentCard from "./AssessmentCard";
import RecommendationPanel from "./RecommendationPanel";
import { getMockRecommendation, type RecommendationResult, type PHRInput } from "@/lib/recommendation-engine";
import { daysSince } from "@/lib/utils";
import Logo from "./Logo";
import DigitalTwin from "./DigitalTwin";
import { buildWeightCalorieCorrelation, buildSleepRpeCorrelation } from "@/lib/correlation";
import ShareButton from "./ShareButton";
import { cn } from "@/components/cf/primitives";

interface Props {
  client: {
    id: string;
    name: string;
    goal: string | null;
    start_date: string;
    height_cm?: number | null;
    gender?: string | null;
    birth_year?: number | null;
    health_concerns?: string | null;
  };
  bodyRecords: any[];
  trainingSessions: any[];
  mealRecords: any[];
  bodyPhotos: any[];
  assessment: any | null;
  goals?: any | null;
}

// 4タブに統合
const TABS = [
  { id: "今日",   icon: "◈",  label: "今日"   },
  { id: "記録",   icon: "📈", label: "記録"   },
  { id: "フォト", icon: "📷", label: "フォト" },
  { id: "AI",     icon: "✦",  label: "AI"     },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ClientDashboard({
  client, bodyRecords, trainingSessions, mealRecords, bodyPhotos, assessment, goals,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("今日");
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(getMockRecommendation());
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);

  const dayCount = daysSince(client.start_date);
  const today = new Date().toISOString().split("T")[0];

  // 最新・最初の身体記録
  const latestBody = bodyRecords[bodyRecords.length - 1];
  const firstBody = bodyRecords[0];

  const weightDiff = latestBody?.weight_kg && firstBody?.weight_kg
    ? +(latestBody.weight_kg - firstBody.weight_kg).toFixed(1) : null;
  const fatDiff = latestBody?.body_fat_pct && firstBody?.body_fat_pct
    ? +(latestBody.body_fat_pct - firstBody.body_fat_pct).toFixed(1) : null;

  // 直近7日の平均食事カロリー
  const recentMeals = mealRecords.slice(0, 42);
  const mealDates = [...new Set(recentMeals.map((m: any) => m.meal_date))].slice(0, 7);
  const avgCalories = mealDates.length > 0
    ? Math.round(mealDates.reduce((sum, date) => {
        return sum + recentMeals.filter((m: any) => m.meal_date === date).reduce((s: number, m: any) => s + (m.calories ?? 0), 0);
      }, 0) / mealDates.length)
    : null;

  const totalSets = trainingSessions.reduce((sum, s) => sum + (s.training_sets?.length ?? 0), 0);
  const totalVolume = trainingSessions.reduce((sum, s) =>
    sum + (s.training_sets?.reduce((v: number, t: any) => v + (t.weight_kg ?? 0) * (t.reps ?? 0), 0) ?? 0), 0);

  // 今日のデータ
  const todayMeals = mealRecords.filter((m: any) => m.meal_date === today);
  const todayProtein = todayMeals.reduce((sum: number, m: any) => sum + (m.protein_g ?? 0), 0);
  const proteinGoal = goals?.daily_protein_g ?? 150;
  const todaySession = trainingSessions.find((s: any) => s.session_date === today);
  const todayBody = bodyRecords.find((b: any) => b.recorded_at === today) ?? latestBody;
  const prevBody = bodyRecords[bodyRecords.length - 2];

  // 相関データ
  const weightCalorieData = buildWeightCalorieCorrelation(
    bodyRecords,
    mealRecords,
    goals?.daily_calories_kcal ?? null,
  );
  const sleepRpeData = buildSleepRpeCorrelation(bodyRecords, trainingSessions);

  async function handleGenerateRecommendation() {
    setRecLoading(true);
    setRecError(null);
    try {
      const mdates = [...new Set(mealRecords.map((m: any) => m.meal_date))];
      const avg = (key: string) => mdates.length > 0
        ? mdates.reduce((sum, d) => sum + mealRecords.filter((m: any) => m.meal_date === d).reduce((s: number, m: any) => s + (m[key] ?? 0), 0), 0) / mdates.length
        : null;

      const phrInput: PHRInput = {
        client: { name: client.name, goal: client.goal, start_date: client.start_date },
        latest_body: latestBody ? {
          weight_kg: latestBody.weight_kg ?? null,
          body_fat_pct: latestBody.body_fat_pct ?? null,
          muscle_mass_kg: latestBody.muscle_mass_kg ?? null,
          blood_pressure_sys: latestBody.systolic_bp ?? null,
          blood_pressure_dia: latestBody.diastolic_bp ?? null,
          sleep_hours: latestBody.sleep_hours ?? null,
          condition_score: latestBody.condition_score ?? null,
        } : null,
        body_trend: bodyRecords.slice(0, 30).map((b: any) => ({
          weight_kg: b.weight_kg ?? null, body_fat_pct: b.body_fat_pct ?? null, recorded_at: b.recorded_at,
        })),
        training_sessions: trainingSessions.slice(0, 10).map((s: any) => ({
          session_date: s.session_date,
          training_sets: (s.training_sets ?? []).map((t: any) => ({
            exercise_name: t.exercise_name, weight_kg: t.weight_kg ?? null, reps: t.reps ?? null,
          })),
        })),
        meal_summary: mdates.length > 0 ? {
          avg_calories: avg("calories"),
          avg_protein_g: avg("protein_g"),
          avg_fat_g: avg("fat_g"),
          avg_carbs_g: avg("carbs_g"),
        } : null,
      };

      const res = await fetch("/api/recommendation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phrInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "API error");
      setRecommendation(data.recommendation);
    } catch (e: any) {
      setRecError(e.message);
    } finally {
      setRecLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink-50 print:bg-white font-sans">

      {/* ══ ヘッダー ══════════════════════════════════════════════ */}
      <header className="bg-white border-b border-ink-200 px-4 py-3 sticky top-0 z-20 shadow-card print:shadow-none">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[9px] text-ink-400 font-medium leading-none uppercase tracking-widest">Start Day</p>
              <p className="text-lg font-black text-brand-600 leading-none font-mono tracking-tight mt-0.5">
                {dayCount}<span className="text-xs font-normal text-ink-400 ml-0.5">d</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              aria-label="PDF出力"
              className="print:hidden px-3 py-1.5 rounded-xl bg-ink-100 hover:bg-ink-200 text-ink-500 text-[11px] font-semibold transition-colors"
            >
              PDF
            </button>
          </div>
        </div>
      </header>

      {/* ══ クライアントバー ══════════════════════════════════════ */}
      <div className="print:hidden bg-white border-b border-ink-100 px-4 py-2.5">
        <div className="max-w-2xl mx-auto">
          <p className="text-ink-800 font-bold text-sm">
            {client.name}
            <span className="text-ink-400 font-normal text-xs ml-1.5">さんの健康ダッシュボード</span>
          </p>
          {client.goal && (
            <p className="text-[11px] text-ink-500 mt-0.5 flex items-center gap-1">
              <span className="text-brand-500">▸</span>{client.goal}
            </p>
          )}
        </div>
      </div>

      {/* ══ タブナビ（4タブ） ════════════════════════════════════ */}
      <nav className="print:hidden bg-white border-b border-ink-200 px-2 sticky top-[57px] z-10">
        <div className="max-w-2xl mx-auto flex">
          {TABS.map(({ id, icon, label }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 py-2.5 text-[12px] font-semibold transition-all border-b-2 relative",
                  active
                    ? "text-brand-600 border-brand-500"
                    : "text-ink-400 border-transparent hover:text-ink-700",
                )}
              >
                <span className="text-base leading-none">{icon}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ══ メインコンテンツ ══════════════════════════════════════ */}
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-3">

        {/* ── 今日タブ ── */}
        <div className={activeTab === "今日" ? "block space-y-3" : "hidden print:block print:space-y-3"}>

          {/* ① トレーナーからのメッセージ */}
          {(goals?.roadmap_text || goals?.trainer_notes) && (
            <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 shadow-card">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">💬</span>
                <p className="text-xs font-bold text-brand-700">トレーナーからのメッセージ</p>
              </div>
              {goals?.roadmap_text && (
                <p className="text-sm text-ink-700 whitespace-pre-line leading-relaxed">{goals.roadmap_text}</p>
              )}
              {goals?.trainer_notes && goals.trainer_notes !== goals.roadmap_text && (
                <p className="text-xs text-ink-500 mt-2 whitespace-pre-line">{goals.trainer_notes}</p>
              )}
            </div>
          )}

          {/* ② 今日の3枚KPIカード（ファーストビュー） */}
          <div className="grid grid-cols-3 gap-2">
            {/* 体重カード */}
            <div className="bg-white rounded-2xl border border-ink-200/70 shadow-card p-3 text-center">
              <p className="text-[10px] text-ink-500 font-medium mb-1">今日の体重</p>
              <p className="text-xl font-black text-ink-800 font-mono tracking-tight">
                {todayBody?.weight_kg ?? "—"}
              </p>
              <p className="text-[10px] text-ink-400">kg</p>
              {prevBody?.weight_kg && todayBody?.weight_kg && (
                <p className={cn(
                  "text-xs font-bold mt-1",
                  todayBody.weight_kg < prevBody.weight_kg ? "text-emerald-600" : "text-red-500",
                )}>
                  {todayBody.weight_kg > prevBody.weight_kg ? "+" : ""}
                  {(todayBody.weight_kg - prevBody.weight_kg).toFixed(1)}
                </p>
              )}
            </div>

            {/* タンパク質カード */}
            <div className="bg-white rounded-2xl border border-ink-200/70 shadow-card p-3 text-center">
              <p className="text-[10px] text-ink-500 font-medium mb-1">P達成率</p>
              <p className="text-xl font-black text-ink-800 font-mono tracking-tight">
                {todayMeals.length > 0 && proteinGoal > 0
                  ? Math.round((todayProtein / proteinGoal) * 100)
                  : "—"}
              </p>
              <p className="text-[10px] text-ink-400">%</p>
              {todayMeals.length > 0 && (
                <div className="mt-1 h-1 bg-ink-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (todayProtein / proteinGoal) * 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* トレーニングカード */}
            <div className={cn(
              "rounded-2xl border shadow-card p-3 text-center",
              todaySession ? "bg-emerald-50 border-emerald-100" : "bg-white border-ink-200/70",
            )}>
              <p className="text-[10px] text-ink-500 font-medium mb-1">今日のトレ</p>
              <p className={cn("text-xl font-black", todaySession ? "text-emerald-600" : "text-ink-300")}>
                {todaySession ? "✓" : "—"}
              </p>
              <p className={cn("text-[10px] mt-1 font-medium", todaySession ? "text-emerald-600" : "text-ink-400")}>
                {todaySession ? "実施済み" : "未記録"}
              </p>
            </div>
          </div>

          {/* ② 開始からの変化ヒーローカード */}
          <ProgressHeroCard
            firstBody={firstBody}
            latestBody={latestBody}
            dayCount={dayCount}
            goals={goals}
            lastSession={trainingSessions[0] ?? null}
          />

          {/* ③ DigitalTwin Body Analysis */}
          <DigitalTwin
            weight_kg={latestBody?.weight_kg ?? null}
            body_fat_pct={latestBody?.body_fat_pct ?? null}
            muscle_mass_kg={latestBody?.muscle_mass_kg ?? null}
            bmi={latestBody?.bmi ?? null}
            bone_mass_kg={latestBody?.bone_mass_kg ?? null}
            visceral_fat_level={latestBody?.visceral_fat_level ?? null}
            condition_score={latestBody?.condition_score ?? null}
            sleep_hours={latestBody?.sleep_hours ?? null}
            resting_heart_rate={latestBody?.resting_heart_rate ?? null}
            systolic_bp={latestBody?.systolic_bp ?? null}
            diastolic_bp={latestBody?.diastolic_bp ?? null}
            prev_weight_kg={bodyRecords[bodyRecords.length - 2]?.weight_kg ?? null}
            prev_body_fat_pct={bodyRecords[bodyRecords.length - 2]?.body_fat_pct ?? null}
            prev_muscle_mass_kg={bodyRecords[bodyRecords.length - 2]?.muscle_mass_kg ?? null}
            first_weight_kg={firstBody?.weight_kg ?? null}
            first_body_fat_pct={firstBody?.body_fat_pct ?? null}
            first_muscle_mass_kg={firstBody?.muscle_mass_kg ?? null}
            height_cm={client.height_cm ?? null}
            gender={client.gender ?? null}
            birth_year={client.birth_year ?? null}
            recorded_at={latestBody?.recorded_at ?? null}
            target_weight_kg={goals?.target_weight_kg ?? null}
            target_body_fat_pct={goals?.target_body_fat_pct ?? null}
            lastTrainedMuscles={
              trainingSessions[0]?.training_sets
                ? ([...new Set(trainingSessions[0].training_sets.map((t: any) => t.muscle_group).filter(Boolean))] as string[])
                : []
            }
          />

          {/* ④ 体重 × カロリー収支 相関グラフ（Client Fit差別化の核） */}
          {weightCalorieData.length >= 3 && (
            <div className="bg-white rounded-2xl border border-ink-200/70 shadow-card p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-ink-600 flex items-center gap-1">
                  <span>📊</span> 体重 × カロリー収支
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-[9px] text-ink-400">統合分析</p>
                  <ShareButton
                    targetId="chart-weight-calorie"
                    shareText={`【Client Fit記録】${client.name}の体重×カロリー収支グラフ`}
                  />
                </div>
              </div>
              <p className="text-[9px] text-ink-400 mb-3">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-brand-500 inline-block" />青線 = 体重(kg)
                </span>
                <span className="ml-3 inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-brand-100 inline-block" />
                  青棒 = カロリー収支(kcal)
                </span>
              </p>
              <div id="chart-weight-calorie">
              <ResponsiveContainer width="100%" height={160}>
                <ComposedChart data={weightCalorieData}>
                  <Bar
                    dataKey="calorie_balance"
                    fill="#93c5fd"
                    opacity={0.7}
                    name="カロリー収支(kcal)"
                    radius={[3, 3, 0, 0]}
                    yAxisId="cal"
                  />
                  <Line
                    dataKey="weight_kg"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name="体重(kg)"
                    yAxisId="weight"
                    connectNulls
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    yAxisId="cal"
                    tick={{ fontSize: 9, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <YAxis
                    yAxisId="weight"
                    orientation="right"
                    tick={{ fontSize: 9, fill: "#3b82f6" }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-ink-400 mt-2">
                💡 カロリーが少ない週に体重が下がる傾向を確認できます
              </p>
            </div>
          )}

          {/* ⑤ コンディション × ボリューム */}
          <ConditionVolumeChart
            bodyRecords={bodyRecords}
            trainingSessions={trainingSessions}
          />

          {/* ⑥ 直近トレ + アセスメントプレビュー */}
          <div className="space-y-3">
            {trainingSessions[0]?.training_sets?.length > 0 && (
              <LastSessionCard
                session={trainingSessions[0]}
                allSessions={trainingSessions}
              />
            )}
            {assessment ? (
              <AssessmentPreviewCard assessment={assessment} onDetail={() => setActiveTab("AI")} />
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab("AI")}
                className="w-full bg-grad-brand rounded-2xl p-4 text-left shadow-card hover:shadow-pop transition-all"
              >
                <div className="flex items-center justify-between text-white">
                  <div>
                    <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">AI分析</p>
                    <p className="text-sm font-bold mt-0.5">AIアセスメントを生成する</p>
                    <p className="text-[11px] text-white/80 mt-0.5">食事・体重・トレーニングを統合分析して改善提案を表示</p>
                  </div>
                  <span className="text-2xl">✦</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* ── 記録タブ（身体 + トレーニング + 食事） ── */}
        <div className={activeTab === "記録" ? "block space-y-4" : "hidden"}>

          {/* 身体データ */}
          <section>
            <div className="flex items-center justify-between px-1 mb-2">
              <p className="text-[10px] font-bold text-ink-500 uppercase tracking-widest">身体データ</p>
              <ShareButton
                targetId="chart-body"
                shareText={`【Client Fit記録】${client.name}の体重推移グラフ`}
              />
            </div>
            <div id="chart-body" className="bg-white rounded-2xl p-4 border border-ink-200/70 shadow-card">
              <BodyChart records={bodyRecords} />
            </div>
            {latestBody && (
              <div className="bg-white rounded-2xl p-4 border border-ink-200/70 shadow-card mt-2">
                <BodyMetricsGrid record={latestBody} goals={goals} inline />
              </div>
            )}
          </section>

          {/* トレーニング */}
          <section>
            <p className="text-[10px] font-bold text-ink-500 uppercase tracking-widest mb-2 px-1">トレーニング</p>
            <div className="bg-white rounded-2xl p-4 border border-ink-200/70 shadow-card">
              <TrainingChart sessions={trainingSessions} />
            </div>
          </section>

          {/* 食事 */}
          <section>
            <p className="text-[10px] font-bold text-ink-500 uppercase tracking-widest mb-2 px-1">食事・栄養</p>
            <div className="bg-white rounded-2xl p-4 border border-ink-200/70 shadow-card">
              <MealChart records={mealRecords} />
            </div>
            {avgCalories != null && (
              <div className="mt-2">
                <PFCBarCard mealRecords={recentMeals} goals={goals} />
              </div>
            )}
          </section>

          {/* 睡眠 × 翌日RPE 相関（データがあれば） */}
          {sleepRpeData.length >= 4 && (
            <section>
              <p className="text-[10px] font-bold text-ink-500 uppercase tracking-widest mb-2 px-1">相関分析</p>
              <div className="bg-white rounded-2xl border border-ink-200/70 shadow-card p-4">
                <p className="text-xs font-bold text-ink-600 mb-1">睡眠時間 × 翌日RPE</p>
                <p className="text-[9px] text-ink-400 mb-3">睡眠不足がトレーニング強度に影響しているか確認</p>
                <ResponsiveContainer width="100%" height={160}>
                  <ScatterChart>
                    <XAxis
                      dataKey="sleep_hours"
                      name="睡眠時間"
                      unit="h"
                      tick={{ fontSize: 9, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      label={{ value: "睡眠(h)", position: "insideBottomRight", fontSize: 9, fill: "#94a3b8" }}
                    />
                    <YAxis
                      dataKey="next_rpe"
                      name="翌日RPE"
                      tick={{ fontSize: 9, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      domain={[1, 10]}
                      label={{ value: "RPE", angle: -90, position: "insideLeft", fontSize: 9, fill: "#94a3b8" }}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }}
                      formatter={(v: any, name: string) => [v, name]}
                    />
                    <Scatter data={sleepRpeData} fill="#3b82f6" opacity={0.6} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}
        </div>

        {/* ── フォトタブ ── */}
        <div className={activeTab === "フォト" ? "block" : "hidden"}>
          <PhotoTab clientId={client.id} initialPhotos={bodyPhotos} />
        </div>

        {/* ── AIタブ（分析 + 提案） ── */}
        <div className={activeTab === "AI" ? "block space-y-3" : "hidden"}>

          {/* AI分析 */}
          <section>
            <p className="text-[10px] font-bold text-ink-500 uppercase tracking-widest mb-2 px-1">AIアセスメント</p>
            <div className="bg-white rounded-2xl p-4 border border-ink-200/70 shadow-card">
              <AssessmentCard assessment={assessment} clientId={client.id} />
            </div>
          </section>

          {/* AI提案 */}
          <section>
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-[10px] font-bold text-ink-500 uppercase tracking-widest">AI提案</p>
              <div className="flex items-center gap-2">
                {recommendation && (
                  <p className="text-[10px] text-ink-400">
                    {new Date(recommendation.generated_at).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleGenerateRecommendation}
                  disabled={recLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white text-[11px] font-bold rounded-xl transition-colors shadow-card"
                >
                  {recLoading
                    ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>分析中...</span></>
                    : <><span>✦</span><span>再生成</span></>
                  }
                </button>
              </div>
            </div>
            {recError && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-700 mb-2">
                {recError}
              </div>
            )}
            <div className="bg-white rounded-2xl border border-ink-200/70 shadow-card overflow-hidden">
              <RecommendationPanel recommendation={recommendation} isLoading={recLoading} />
            </div>
          </section>
        </div>

        {/* ── 紹介バナー ── */}
        <ReferralBanner clientId={client.id} />

      </main>
    </div>
  );
}

// ══ 紹介バナー ════════════════════════════════════════════════════════

function ReferralBanner({ clientId }: { clientId: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/client/${clientId}`;

  const copy = () => {
    navigator.clipboard.writeText(
      `Client Fitで食事・トレーニング・体重を一元管理中！\nスクショをLINEに送るだけで自動記録されます。\n${url}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 flex items-center justify-between gap-3 print:hidden shadow-card">
      <div>
        <p className="text-xs font-bold text-brand-700">友達に紹介する</p>
        <p className="text-[10px] text-ink-500 mt-0.5">Client Fitを使っている友達・仲間を招待しよう</p>
      </div>
      <button
        type="button"
        onClick={copy}
        className="flex-none text-[11px] font-bold bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl transition-colors whitespace-nowrap shadow-glow"
      >
        {copied ? "✓ コピー済み" : "🔗 リンクをコピー"}
      </button>
    </div>
  );
}

// ══ 開始からの変化ヒーローカード ════════════════════════════════════

function ProgressHeroCard({
  firstBody, latestBody, dayCount, goals, lastSession,
}: {
  firstBody: any; latestBody: any; dayCount: number; goals: any; lastSession: any;
}) {
  if (!firstBody || !latestBody || firstBody === latestBody) return null;

  const weightDiff = latestBody.weight_kg != null && firstBody.weight_kg != null
    ? +(latestBody.weight_kg - firstBody.weight_kg).toFixed(1) : null;
  const fatDiff = latestBody.body_fat_pct != null && firstBody.body_fat_pct != null
    ? +(latestBody.body_fat_pct - firstBody.body_fat_pct).toFixed(1) : null;
  const muscleDiff = latestBody.muscle_mass_kg != null && firstBody.muscle_mass_kg != null
    ? +(latestBody.muscle_mass_kg - firstBody.muscle_mass_kg).toFixed(1) : null;

  if (weightDiff == null && fatDiff == null) return null;

  const remainingKg = goals?.target_weight_kg != null && latestBody.weight_kg != null
    ? +(latestBody.weight_kg - goals.target_weight_kg).toFixed(1) : null;

  return (
    <div className="bg-grad-brand rounded-2xl p-5 shadow-pop text-white">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-white/80 uppercase tracking-widest font-bold">開始からの変化</p>
          {weightDiff != null && (
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-6xl font-black font-mono tracking-tight leading-none">
                {weightDiff > 0 ? "+" : ""}{weightDiff}
              </span>
              <span className="text-xl text-white/80 font-bold">kg</span>
            </div>
          )}
          <p className="text-[11px] text-white/80 mt-2">
            {dayCount}日間 · スタート {firstBody.weight_kg}kg → 現在 {latestBody.weight_kg}kg
          </p>
          {remainingKg != null && Math.abs(remainingKg) > 0.1 && (
            <p className="text-[11px] text-amber-200 mt-1">
              目標まで残り <strong>{Math.abs(remainingKg)}kg</strong>
            </p>
          )}
        </div>
        <div className="space-y-3 text-right">
          {fatDiff != null && (
            <div>
              <p className="text-[9px] text-white/70">体脂肪率</p>
              <p className={cn("text-2xl font-black font-mono tracking-tight", fatDiff < 0 ? "text-emerald-200" : "text-red-200")}>
                {fatDiff > 0 ? "+" : ""}{fatDiff}
                <span className="text-xs font-normal text-white/80">%</span>
              </p>
            </div>
          )}
          {muscleDiff != null && (
            <div>
              <p className="text-[9px] text-white/70">筋肉量</p>
              <p className={cn("text-2xl font-black font-mono tracking-tight", muscleDiff > 0 ? "text-emerald-200" : "text-red-200")}>
                {muscleDiff > 0 ? "+" : ""}{muscleDiff}
                <span className="text-xs font-normal text-white/80">kg</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══ コンディション × ボリューム相関グラフ ════════════════════════════

function ConditionVolumeChart({
  bodyRecords, trainingSessions,
}: {
  bodyRecords: any[]; trainingSessions: any[];
}) {
  const volByDate = new Map<string, number>();
  for (const s of trainingSessions) {
    const vol = s.training_sets?.reduce(
      (sum: number, t: any) => sum + (t.weight_kg ?? 0) * (t.reps ?? 0), 0
    ) ?? 0;
    const d = s.session_date;
    volByDate.set(d, (volByDate.get(d) ?? 0) + vol);
  }

  const data = bodyRecords
    .filter((b) => b.condition_score != null)
    .map((b) => {
      const date = b.recorded_at.slice(0, 10);
      return {
        date: format(parseISO(b.recorded_at), "M/d"),
        condition: b.condition_score as number,
        volume: +(((volByDate.get(date) ?? 0) / 1000).toFixed(1)),
      };
    })
    .slice(-20);

  if (data.length < 3) return null;

  return (
    <div className="bg-white border border-ink-200/70 rounded-2xl p-4 shadow-card">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-bold text-ink-600 flex items-center gap-1">
          <span>📊</span> コンディション × ボリューム
        </p>
        <p className="text-[9px] text-ink-400">追い込みすぎチェック</p>
      </div>
      <p className="text-[9px] text-ink-400 mb-3">
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />紫線 = コンディション(0–10)</span>
        <span className="ml-3 inline-flex items-center gap-1"><span className="w-2 h-2 rounded bg-brand-100 inline-block" />青棒 = トレボリューム(t)</span>
      </p>
      <ResponsiveContainer width="100%" height={130}>
        <ComposedChart data={data}>
          <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis yAxisId="cond" domain={[0, 10]} tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} width={16} />
          <YAxis yAxisId="vol" orientation="right" tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} width={28} unit="t" />
          <Tooltip
            contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 10 }}
            formatter={(v: number, name: string) =>
              name === "コンディション" ? [`${v}/10`, name] : [`${v}t`, name]
            }
          />
          <Bar yAxisId="vol" dataKey="volume" fill="#dbeafe" radius={[2, 2, 0, 0]} name="ボリューム" />
          <Line
            yAxisId="cond"
            type="monotone"
            dataKey="condition"
            stroke="#7c3aed"
            strokeWidth={2}
            dot={{ fill: "#7c3aed", r: 2 }}
            name="コンディション"
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ══ 直近セッション ═══════════════════════════════════════════════════

function LastSessionCard({ session, allSessions }: { session: any; allSessions: any[] }) {
  const grouped: Record<string, any[]> = {};
  for (const s of session.training_sets ?? []) {
    const k = s.exercise_name ?? "不明";
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(s);
  }

  const daysSinceSession = Math.floor(
    (Date.now() - new Date(session.session_date).getTime()) / (1000 * 60 * 60 * 24)
  );

  const prevBest = new Map<string, number>();
  for (const s of allSessions.slice(1)) {
    for (const t of s.training_sets ?? []) {
      if (!t.exercise_name) continue;
      const cur = prevBest.get(t.exercise_name) ?? 0;
      if ((t.weight_kg ?? 0) > cur) prevBest.set(t.exercise_name, t.weight_kg);
    }
  }

  return (
    <div className="bg-white border border-ink-200/70 rounded-2xl p-4 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-ink-600 flex items-center gap-1">
          <span>🏋</span> 直近のトレーニング
        </p>
        <div className="text-right">
          <p className="text-[10px] text-ink-400">
            {format(parseISO(session.session_date), "M月d日(E)", { locale: ja })}
          </p>
          {daysSinceSession === 0 ? (
            <p className="text-[9px] text-emerald-600 font-bold">今日</p>
          ) : (
            <p className="text-[9px] text-ink-400">前回から {daysSinceSession}日</p>
          )}
        </div>
      </div>
      <div className="space-y-2.5">
        {Object.entries(grouped).map(([exercise, sets]) => {
          const vol = sets.reduce((s, t) => s + (t.weight_kg ?? 0) * (t.reps ?? 0), 0);
          const maxW = Math.max(...sets.map((t) => t.weight_kg ?? 0));
          const isPR = prevBest.has(exercise) && maxW > (prevBest.get(exercise) ?? 0);
          const isFirst = !prevBest.has(exercise);
          return (
            <div key={exercise} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-ink-700">{exercise}</span>
                <span className="text-[10px] text-ink-400">{sets.length}set</span>
                {isPR && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">🏆 PR</span>
                )}
                {isFirst && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-100">NEW</span>
                )}
              </div>
              <div className="flex gap-3 text-[11px] shrink-0">
                <span className="text-ink-500">最高 <strong className="text-ink-700">{maxW}kg</strong></span>
                <span className="text-brand-600 font-bold">Vol {vol.toLocaleString()}kg</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══ 食事PFCバーカード ════════════════════════════════════════════════

function PFCBarCard({ mealRecords, goals }: { mealRecords: any[]; goals: any }) {
  const dates = [...new Set(mealRecords.map((m: any) => m.meal_date))].slice(0, 7);
  const avg = (key: string) => dates.length > 0
    ? Math.round(dates.reduce((sum, d) => {
        return sum + mealRecords.filter((m: any) => m.meal_date === d).reduce((s: number, m: any) => s + (m[key] ?? 0), 0);
      }, 0) / dates.length)
    : 0;

  const protein = avg("protein_g");
  const fat = avg("fat_g");
  const carbs = avg("carbs_g");
  const calories = avg("calories");

  const tp = goals?.daily_protein_g ?? null;
  const tf = goals?.daily_fat_g ?? null;
  const tc = goals?.daily_carbs_g ?? null;
  const tkal = goals?.daily_calories_kcal ?? null;

  const pct = (val: number, target: number | null) =>
    target ? Math.min(120, Math.round((val / target) * 100)) : null;

  const bars = [
    { label: "P タンパク質", val: protein, unit: "g", target: tp, color: "bg-brand-500" },
    { label: "F 脂質",       val: fat,     unit: "g", target: tf, color: "bg-amber-400" },
    { label: "C 炭水化物",   val: carbs,   unit: "g", target: tc, color: "bg-emerald-500" },
  ];

  return (
    <div className="bg-white border border-ink-200/70 rounded-2xl p-4 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-ink-600 flex items-center gap-1">
          <span>🥗</span> 平均PFC（直近7日）
        </p>
        <div className="text-[11px] text-ink-500">
          {calories} kcal
          {tkal && <span className="text-ink-400 ml-1">/ 目標 {tkal}</span>}
        </div>
      </div>
      <div className="space-y-2.5">
        {bars.map(({ label, val, unit, target, color }) => {
          const p = pct(val, target);
          return (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-ink-500">{label}</span>
                <span className="text-[11px] font-bold text-ink-700">
                  {val}{unit}
                  {target && <span className="text-[9px] font-normal text-ink-400 ml-1">/ {target}{unit}</span>}
                </span>
              </div>
              <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${color} rounded-full transition-all`}
                  style={{ width: p != null ? `${Math.min(p, 100)}%` : "0%" }}
                />
              </div>
              {p != null && (
                <p className={cn("text-[9px] mt-0.5 text-right font-semibold", p >= 100 ? "text-emerald-600" : p >= 70 ? "text-amber-600" : "text-red-500")}>
                  {p}%
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══ 最新計測値グリッド（記録タブ） ════════════════════════════════════

function BodyMetricsGrid({ record, goals, inline }: { record: any; goals: any; inline?: boolean }) {
  const metrics = [
    { label: "体重",          value: record.weight_kg,          unit: "kg",   target: goals?.target_weight_kg },
    { label: "体脂肪率",      value: record.body_fat_pct,       unit: "%",    target: goals?.target_body_fat_pct },
    { label: "筋肉量",        value: record.muscle_mass_kg,     unit: "kg",   target: goals?.target_muscle_kg },
    { label: "収縮期血圧",    value: record.systolic_bp,        unit: "mmHg", target: null },
    { label: "拡張期血圧",    value: record.diastolic_bp,       unit: "mmHg", target: null },
    { label: "安静時心拍",    value: record.resting_heart_rate, unit: "bpm",  target: null },
    { label: "睡眠",          value: record.sleep_hours,        unit: "h",    target: null },
    { label: "コンディション", value: record.condition_score,   unit: "/10",  target: null },
  ].filter((m) => m.value != null);

  if (metrics.length === 0) return null;

  const inner = (
    <>
      <p className="text-xs font-bold text-ink-600 mb-3">
        最新計測値 · {format(parseISO(record.recorded_at), "M月d日", { locale: ja })}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {metrics.map(({ label, value, unit, target }) => (
          <div key={label} className="bg-ink-50 rounded-xl p-2.5 border border-ink-200/70">
            <p className="text-[9px] text-ink-500 font-medium">{label}</p>
            <p className="text-lg font-black text-ink-800 font-mono tracking-tight leading-tight">
              {value}<span className="text-[9px] font-normal text-ink-400 ml-0.5">{unit}</span>
            </p>
            {target != null && (
              <p className="text-[9px] text-ink-400">目標 {target}{unit}</p>
            )}
          </div>
        ))}
      </div>
    </>
  );

  if (inline) return inner;

  return (
    <div className="bg-white border border-ink-200/70 rounded-2xl p-4 shadow-card mt-3">
      {inner}
    </div>
  );
}

// ══ アセスメントプレビュー ════════════════════════════════════════════

function AssessmentPreviewCard({ assessment, onDetail }: { assessment: any; onDetail: () => void }) {
  const risks = [
    { key: "risk_obesity",         label: "生習病" },
    { key: "risk_musculoskeletal", label: "筋骨格" },
    { key: "risk_nutrition",       label: "栄養"   },
    { key: "risk_sleep",           label: "睡眠"   },
  ] as const;

  const riskColor: Record<string, string> = {
    low: "text-emerald-700 bg-emerald-50 border-emerald-100",
    medium: "text-amber-700 bg-amber-50 border-amber-100",
    high: "text-red-700 bg-red-50 border-red-100",
  };

  return (
    <div className="bg-white border border-brand-100 rounded-2xl p-4 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-brand-600 flex items-center gap-1">
          <span>✦</span> AI分析サマリー
        </p>
        <div className="flex gap-1.5">
          {risks.map(({ key, label }) => (
            <span
              key={key}
              className={cn(
                "text-[9px] font-bold px-2 py-0.5 rounded-full border",
                riskColor[assessment[key]] ?? "bg-ink-100 text-ink-500 border-ink-200",
              )}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
      <p className="text-xs text-ink-700 leading-relaxed line-clamp-3">{assessment.current_summary}</p>
      <button
        type="button"
        onClick={onDetail}
        className="mt-2 text-[11px] text-brand-600 hover:text-brand-700 font-bold transition-colors"
      >
        詳細を見る →
      </button>
    </div>
  );
}
