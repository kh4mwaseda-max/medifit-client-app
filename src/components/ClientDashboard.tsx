"use client";

import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { format, parseISO, subDays } from "date-fns";
import { ja } from "date-fns/locale";
import BodyChart from "./BodyChart";
import TrainingChart from "./TrainingChart";
import MealChart from "./MealChart";
import PhotoComparison from "./PhotoComparison";
import AssessmentCard from "./AssessmentCard";
import RecommendationPanel from "./RecommendationPanel";
import { getMockRecommendation, type RecommendationResult, type PHRInput } from "@/lib/recommendation-engine";
import { daysSince } from "@/lib/utils";
import Logo from "./Logo";
import DigitalTwin from "./DigitalTwin";

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

const TABS = [
  { id: "サマリー",     icon: "◈",  label: "サマリー"     },
  { id: "身体データ",   icon: "📈", label: "身体データ"   },
  { id: "トレーニング", icon: "🏋", label: "トレーニング" },
  { id: "食事",        icon: "🥗",  label: "食事"        },
  { id: "フォト",      icon: "📷",  label: "フォト"      },
  { id: "AI分析",      icon: "✦",  label: "AI分析"      },
  { id: "提案",        icon: "💡",  label: "提案"        },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ClientDashboard({
  client, bodyRecords, trainingSessions, mealRecords, bodyPhotos, assessment, goals,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("サマリー");
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(getMockRecommendation());
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);

  const dayCount = daysSince(client.start_date);

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
    <div className="min-h-screen bg-[#f0f4f8] print:bg-white font-sans">

      {/* ══ ヘッダー ══════════════════════════════════════════════ */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-20 shadow-sm print:shadow-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[9px] text-slate-400 leading-none">START DAY</p>
              <p className="text-lg font-black text-blue-600 leading-none tabular-nums">
                {dayCount}<span className="text-xs font-normal text-slate-400 ml-0.5">d</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="print:hidden px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-400 text-[11px] font-medium transition-colors"
            >
              PDF
            </button>
          </div>
        </div>
      </header>

      {/* ══ クライアントバー ══════════════════════════════════════ */}
      <div className="print:hidden bg-white border-b border-slate-100 px-4 py-2.5">
        <div className="max-w-7xl mx-auto">
          <p className="text-slate-800 font-semibold text-sm">
            {client.name}
            <span className="text-slate-400 font-normal text-xs ml-1.5">さんの健康ダッシュボード</span>
          </p>
          {client.goal && (
            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
              <span className="text-blue-400">▸</span>{client.goal}
            </p>
          )}
        </div>
      </div>

      {/* ══ タブナビ ══════════════════════════════════════════════ */}
      <nav className="print:hidden bg-white border-b border-slate-200 px-2 sticky top-[57px] z-10">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          {TABS.map(({ id, icon, label }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex-shrink-0 flex items-center gap-1 px-3.5 py-2.5 text-[11px] font-medium transition-all whitespace-nowrap border-b-2 ${
                  active
                    ? "text-blue-600 border-blue-600"
                    : "text-slate-400 border-transparent hover:text-slate-600"
                }`}
              >
                <span className="text-base leading-none">{icon}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ══ メインコンテンツ ══════════════════════════════════════ */}
      <main className="max-w-7xl mx-auto px-4 py-4 space-y-3">

        {/* ── サマリー ── */}
        <div className={activeTab === "サマリー" ? "block space-y-3" : "hidden print:block print:space-y-3"}>

          {/* メイン2カラム: 左=デジタルツイン / 右=KPI+グラフ */}
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-3 items-start">

            {/* ── デジタルツインパネル ── */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col items-center">
              <p className="text-[10px] font-semibold text-slate-400 tracking-widest mb-4 uppercase">Digital Twin</p>
              <DigitalTwin
                weight_kg={latestBody?.weight_kg ?? null}
                body_fat_pct={latestBody?.body_fat_pct ?? null}
                muscle_mass_kg={latestBody?.muscle_mass_kg ?? null}
                target_body_fat_pct={goals?.target_body_fat_pct ?? null}
                target_weight_kg={goals?.target_weight_kg ?? null}
                condition_score={latestBody?.condition_score ?? null}
                lastTrainedMuscles={
                  trainingSessions[0]?.training_sets
                    ? ([...new Set(trainingSessions[0].training_sets.map((t: any) => t.muscle_group).filter(Boolean))] as string[])
                    : []
                }
              />
              {latestBody && (
                <p className="text-[9px] text-slate-300 mt-3">
                  最終計測: {format(parseISO(latestBody.recorded_at), "M月d日", { locale: ja })}
                </p>
              )}
            </div>

            {/* ── 右カラム: KPI + グラフ ── */}
            <div className="space-y-3">
              {/* KPIグリッド */}
              <KPIGrid
                latestBody={latestBody}
                weightDiff={weightDiff}
                fatDiff={fatDiff}
                trainingSessions={trainingSessions}
                totalVolume={totalVolume}
                avgCalories={avgCalories}
                goals={goals}
              />

              {/* 体重グラフ ＋ PFC */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {bodyRecords.length >= 3 && (
                  <WeightSparkCard records={bodyRecords} goals={goals} />
                )}
                {avgCalories != null && (
                  <PFCBarCard mealRecords={recentMeals} goals={goals} />
                )}
              </div>

              {/* 直近トレーニング ＋ アセスメント */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {trainingSessions[0]?.training_sets?.length > 0 && (
                  <LastSessionCard session={trainingSessions[0]} />
                )}
                {assessment && (
                  <AssessmentPreviewCard assessment={assessment} onDetail={() => setActiveTab("AI分析")} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── 身体データ ── */}
        <div className={activeTab === "身体データ" ? "block space-y-3" : "hidden"}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <BodyChart records={bodyRecords} />
            </div>
            {latestBody && (
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                <BodyMetricsGrid record={latestBody} goals={goals} inline />
              </div>
            )}
          </div>
        </div>

        {/* ── トレーニング ── */}
        <div className={activeTab === "トレーニング" ? "block" : "hidden"}>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <TrainingChart sessions={trainingSessions} />
          </div>
        </div>

        {/* ── 食事 ── */}
        <div className={activeTab === "食事" ? "block" : "hidden"}>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <MealChart records={mealRecords} />
          </div>
        </div>

        {/* ── フォト ── */}
        <div className={activeTab === "フォト" ? "block" : "hidden"}>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <PhotoComparison photos={bodyPhotos} />
          </div>
        </div>

        {/* ── AI分析 ── */}
        <div className={activeTab === "AI分析" ? "block" : "hidden"}>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <AssessmentCard assessment={assessment} />
          </div>
        </div>

        {/* ── 提案 ── */}
        <div className={activeTab === "提案" ? "block space-y-3" : "hidden"}>
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] text-slate-400">
              {recommendation
                ? `生成: ${new Date(recommendation.generated_at).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
                : ""}
            </p>
            <button
              type="button"
              onClick={handleGenerateRecommendation}
              disabled={recLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
            >
              {recLoading
                ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>分析中...</span></>
                : <><span>✦</span><span>AIで再生成</span></>
              }
            </button>
          </div>
          {recError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs text-rose-600">
              {recError}
            </div>
          )}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <RecommendationPanel recommendation={recommendation} isLoading={recLoading} />
          </div>
        </div>
      </main>
    </div>
  );
}

// ══ KPI グリッド ═══════════════════════════════════════════════════

function KPIGrid({ latestBody, weightDiff, fatDiff, trainingSessions, totalVolume, avgCalories, goals }: any) {
  const wd = Number(weightDiff);
  const fd = Number(fatDiff);

  const cards = [
    {
      label: "体重", unit: "kg",
      value: latestBody?.weight_kg ?? null,
      delta: weightDiff != null ? `${wd > 0 ? "+" : ""}${weightDiff}` : null,
      deltaGood: wd <= 0,
      target: goals?.target_weight_kg ?? null,
      icon: "⚖",
    },
    {
      label: "体脂肪率", unit: "%",
      value: latestBody?.body_fat_pct ?? null,
      delta: fatDiff != null ? `${fd > 0 ? "+" : ""}${fatDiff}` : null,
      deltaGood: fd <= 0,
      target: goals?.target_body_fat_pct ?? null,
      icon: "📉",
    },
    {
      label: "筋肉量", unit: "kg",
      value: latestBody?.muscle_mass_kg ?? null,
      delta: null,
      deltaGood: true,
      target: goals?.target_muscle_kg ?? null,
      icon: "💪",
    },
    {
      label: "トレーニング", unit: "回 / 週",
      value: (() => {
        const last7 = trainingSessions.filter((s: any) =>
          new Date(s.session_date) >= subDays(new Date(), 7)
        ).length;
        return last7 || null;
      })(),
      delta: null,
      deltaGood: true,
      target: goals?.weekly_training_sessions ?? null,
      icon: "🏋",
    },
    {
      label: "総ボリューム", unit: "t",
      value: totalVolume > 0 ? +(totalVolume / 1000).toFixed(1) : null,
      delta: null,
      deltaGood: true,
      target: null,
      icon: "🔋",
    },
    {
      label: "平均カロリー", unit: "kcal",
      value: avgCalories,
      delta: null,
      deltaGood: true,
      target: goals?.daily_calories_kcal ?? null,
      icon: "🍽",
    },
    {
      label: "コンディション", unit: "/ 10",
      value: latestBody?.condition_score ?? null,
      delta: null,
      deltaGood: true,
      target: null,
      icon: "❤",
    },
    {
      label: "睡眠", unit: "h",
      value: latestBody?.sleep_hours ?? null,
      delta: null,
      deltaGood: true,
      target: null,
      icon: "🌙",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
      {cards.map((c) => (
        <KPICard key={c.label} {...c} />
      ))}
    </div>
  );
}

function KPICard({ label, unit, value, delta, deltaGood, target, icon }: {
  label: string; unit: string;
  value: number | null; delta: string | null; deltaGood: boolean;
  target: number | null; icon: string;
}) {
  const progress = value != null && target != null
    ? Math.min(100, Math.max(0, 100 - Math.abs((value - target) / target) * 100))
    : null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm relative overflow-hidden">
      {/* 背景グロー */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-transparent pointer-events-none" />

      <div className="flex items-start justify-between mb-2">
        <p className="text-[10px] text-slate-400 font-medium leading-tight">{label}</p>
        <span className="text-base leading-none">{icon}</span>
      </div>

      <p className="text-2xl font-black text-slate-800 tabular-nums leading-none">
        {value != null ? value : <span className="text-slate-300 text-lg">—</span>}
        {value != null && <span className="text-[10px] font-normal text-slate-400 ml-0.5">{unit}</span>}
      </p>

      <div className="flex items-center gap-2 mt-1.5">
        {delta != null && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
            deltaGood ? "bg-teal-50 text-teal-600" : "bg-rose-50 text-rose-500"
          }`}>
            {delta}
          </span>
        )}
        {target != null && value != null && (
          <span className="text-[9px] text-slate-300">
            目標 {target}{unit.split(" ")[0]}
          </span>
        )}
      </div>

      {/* 目標達成度バー */}
      {progress != null && (
        <div className="mt-2 h-0.5 bg-slate-100 rounded-full">
          <div
            className="h-full bg-blue-400 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ══ 体重スパークライン ═════════════════════════════════════════════

function WeightSparkCard({ records, goals }: { records: any[]; goals: any }) {
  const data = records.slice(-30).map((r) => ({
    date: format(parseISO(r.recorded_at), "M/d"),
    weight: r.weight_kg,
  }));

  const min = Math.min(...data.map((d) => d.weight ?? 0));
  const max = Math.max(...data.map((d) => d.weight ?? 0));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-500">体重推移</p>
        <div className="flex items-center gap-3 text-[10px] text-slate-400">
          <span>最小 <strong className="text-teal-600">{min}kg</strong></span>
          <span>最大 <strong className="text-rose-400">{max}kg</strong></span>
          {goals?.target_weight_kg && (
            <span>目標 <strong className="text-blue-500">{goals.target_weight_kg}kg</strong></span>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={100}>
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis domain={["auto", "auto"]} hide />
          <Tooltip
            contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 11 }}
            formatter={(v: number) => [`${v}kg`, "体重"]}
          />
          {goals?.target_weight_kg && (
            <ReferenceLine y={goals.target_weight_kg} stroke="#3b82f6" strokeDasharray="4 2" strokeWidth={1} />
          )}
          <Line type="monotone" dataKey="weight" stroke="#2563eb" strokeWidth={2} dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ══ 直近セッション ═════════════════════════════════════════════════

function LastSessionCard({ session }: { session: any }) {
  const grouped: Record<string, any[]> = {};
  for (const s of session.training_sets ?? []) {
    const k = s.exercise_name ?? "不明";
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(s);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
          <span>🏋</span> 直近のトレーニング
        </p>
        <p className="text-[10px] text-slate-400">
          {format(parseISO(session.session_date), "M月d日(E)", { locale: ja })}
        </p>
      </div>
      <div className="space-y-2.5">
        {Object.entries(grouped).map(([exercise, sets]) => {
          const vol = sets.reduce((s, t) => s + (t.weight_kg ?? 0) * (t.reps ?? 0), 0);
          const maxW = Math.max(...sets.map((t) => t.weight_kg ?? 0));
          return (
            <div key={exercise} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-700">{exercise}</span>
                <span className="text-[10px] text-slate-400">{sets.length}set</span>
              </div>
              <div className="flex gap-3 text-[11px]">
                <span className="text-slate-500">最高 <strong className="text-slate-700">{maxW}kg</strong></span>
                <span className="text-blue-600 font-semibold">Vol {vol.toLocaleString()}kg</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══ 食事PFCバーカード ═════════════════════════════════════════════

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
    { label: "P タンパク質", val: protein, unit: "g", target: tp, color: "bg-blue-500" },
    { label: "F 脂質",       val: fat,     unit: "g", target: tf, color: "bg-amber-400" },
    { label: "C 炭水化物",   val: carbs,   unit: "g", target: tc, color: "bg-teal-500" },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
          <span>🥗</span> 平均PFC（直近7日）
        </p>
        <div className="text-[11px] text-slate-500">
          {calories} kcal
          {tkal && <span className="text-slate-300 ml-1">/ 目標 {tkal}</span>}
        </div>
      </div>
      <div className="space-y-2.5">
        {bars.map(({ label, val, unit, target, color }) => {
          const p = pct(val, target);
          return (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-slate-500">{label}</span>
                <span className="text-[11px] font-semibold text-slate-700">
                  {val}{unit}
                  {target && <span className="text-[9px] font-normal text-slate-300 ml-1">/ {target}{unit}</span>}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${color} rounded-full transition-all`}
                  style={{ width: p != null ? `${Math.min(p, 100)}%` : "0%" }}
                />
              </div>
              {p != null && (
                <p className={`text-[9px] mt-0.5 text-right ${p >= 100 ? "text-teal-500" : p >= 70 ? "text-amber-500" : "text-rose-400"}`}>
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

// ══ 最新計測値グリッド（身体データタブ） ══════════════════════════

function BodyMetricsGrid({ record, goals, inline }: { record: any; goals: any; inline?: boolean }) {
  const metrics = [
    { label: "体重",       value: record.weight_kg,          unit: "kg", target: goals?.target_weight_kg },
    { label: "体脂肪率",   value: record.body_fat_pct,       unit: "%",  target: goals?.target_body_fat_pct },
    { label: "筋肉量",     value: record.muscle_mass_kg,     unit: "kg", target: goals?.target_muscle_kg },
    { label: "収縮期血圧", value: record.systolic_bp,        unit: "mmHg", target: null },
    { label: "拡張期血圧", value: record.diastolic_bp,       unit: "mmHg", target: null },
    { label: "安静時心拍", value: record.resting_heart_rate, unit: "bpm", target: null },
    { label: "睡眠",       value: record.sleep_hours,        unit: "h",  target: null },
    { label: "コンディション", value: record.condition_score, unit: "/10", target: null },
  ].filter((m) => m.value != null);

  if (metrics.length === 0) return null;

  const inner = (
    <>
      <p className="text-xs font-semibold text-slate-500 mb-3">最新計測値 · {format(parseISO(record.recorded_at), "M月d日", { locale: ja })}</p>
      <div className="grid grid-cols-2 gap-2">
        {metrics.map(({ label, value, unit, target }) => (
          <div key={label} className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
            <p className="text-[9px] text-slate-400">{label}</p>
            <p className="text-lg font-black text-slate-800 tabular-nums leading-tight">
              {value}<span className="text-[9px] font-normal text-slate-400 ml-0.5">{unit}</span>
            </p>
            {target != null && (
              <p className="text-[9px] text-slate-300">目標 {target}{unit}</p>
            )}
          </div>
        ))}
      </div>
    </>
  );

  if (inline) return inner;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mt-3">
      {inner}
    </div>
  );
}

// ══ アセスメントプレビュー ═════════════════════════════════════════

function AssessmentPreviewCard({ assessment, onDetail }: { assessment: any; onDetail: () => void }) {
  const risks = [
    { key: "risk_obesity",         label: "生習病" },
    { key: "risk_musculoskeletal", label: "筋骨格" },
    { key: "risk_nutrition",       label: "栄養"   },
    { key: "risk_sleep",           label: "睡眠"   },
  ] as const;

  const riskColor: Record<string, string> = {
    low: "text-teal-500 bg-teal-50 border-teal-200",
    medium: "text-amber-500 bg-amber-50 border-amber-200",
    high: "text-rose-500 bg-rose-50 border-rose-200",
  };

  return (
    <div className="bg-white border border-blue-100 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-blue-600 flex items-center gap-1">
          <span>✦</span> AI分析サマリー
        </p>
        <div className="flex gap-1.5">
          {risks.map(({ key, label }) => (
            <span
              key={key}
              className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${riskColor[assessment[key]] ?? "bg-slate-50 text-slate-400 border-slate-200"}`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{assessment.current_summary}</p>
      <button
        type="button"
        onClick={onDetail}
        className="mt-2 text-[11px] text-blue-500 hover:text-blue-700 font-medium transition-colors"
      >
        詳細を見る →
      </button>
    </div>
  );
}
