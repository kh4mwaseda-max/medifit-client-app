"use client";

import { useState } from "react";
import BodyChart from "./BodyChart";
import TrainingChart from "./TrainingChart";
import MealChart from "./MealChart";
import PhotoComparison from "./PhotoComparison";
import AssessmentCard from "./AssessmentCard";
import RecommendationPanel from "./RecommendationPanel";
import { getMockRecommendation } from "@/lib/recommendation-engine";
import { daysSince } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

interface Props {
  client: { id: string; name: string; goal: string | null; start_date: string };
  bodyRecords: any[];
  trainingSessions: any[];
  mealRecords: any[];
  bodyPhotos: any[];
  assessment: any | null;
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
  client,
  bodyRecords,
  trainingSessions,
  mealRecords,
  bodyPhotos,
  assessment,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("サマリー");

  const latest = bodyRecords[bodyRecords.length - 1];
  const first = bodyRecords[0];
  const dayCount = daysSince(client.start_date);

  const weightDiff =
    latest && first && latest.weight_kg && first.weight_kg
      ? (latest.weight_kg - first.weight_kg).toFixed(1)
      : null;

  const fatDiff =
    latest && first && latest.body_fat_pct && first.body_fat_pct
      ? (latest.body_fat_pct - first.body_fat_pct).toFixed(1)
      : null;

  const totalVolume = trainingSessions.reduce((sum, s) => {
    return sum + (s.training_sets?.reduce((v: number, t: any) => v + (t.weight_kg ?? 0) * (t.reps ?? 0), 0) ?? 0);
  }, 0);

  const recentMeals = mealRecords.slice(0, 42);
  const mealDates = [...new Set(recentMeals.map((m: any) => m.meal_date))].slice(0, 7);
  const avgCalories =
    mealDates.length > 0
      ? Math.round(
          mealDates.reduce((sum, date) => {
            const dayTotal = recentMeals
              .filter((m: any) => m.meal_date === date)
              .reduce((s: number, m: any) => s + (m.calories ?? 0), 0);
            return sum + dayTotal;
          }, 0) / mealDates.length
        )
      : null;

  const latestSession = trainingSessions[0];
  const recommendation = getMockRecommendation();
  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">

      {/* ── ヘッダー ── */}
      <header className="bg-white border-b border-slate-200 print:border-gray-300 px-5 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <Logo />
        <div className="flex items-center gap-4">
          <DayBadge day={dayCount} />
          <button
            onClick={handlePrint}
            className="print:hidden px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-medium transition-colors border border-slate-200"
          >
            PDF
          </button>
        </div>
      </header>

      {/* ── クライアント名・目標バー ── */}
      <div className="print:hidden bg-white border-b border-slate-100 px-5 py-3">
        <p className="text-slate-800 font-semibold">
          {client.name}
          <span className="text-slate-400 font-normal text-sm ml-1">さんの健康データ</span>
        </p>
        {client.goal && (
          <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
            <span className="text-blue-500">▸</span>
            {client.goal}
          </p>
        )}
      </div>

      {/* ── タブナビ ── */}
      <nav className="print:hidden bg-white border-b border-slate-200 px-2 flex overflow-x-auto">
        {TABS.map(({ id, icon, label }) => {
          const active = activeTab === id;
          const hasDot = (id === "AI分析" && assessment) || id === "提案";
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`relative flex-shrink-0 flex items-center gap-1.5 px-3.5 py-3 text-xs font-medium transition-all whitespace-nowrap ${
                active
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
              {hasDot && (
                <span className={`w-1.5 h-1.5 rounded-full ${id === "提案" ? "bg-amber-400" : "bg-blue-500"}`} />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── コンテンツ ── */}
      <main className="px-4 py-5 max-w-2xl mx-auto space-y-4">

        {/* サマリー */}
        <div className={activeTab === "サマリー" ? "block space-y-4" : "hidden print:block print:space-y-4"}>
          <StatGrid
            weightDiff={weightDiff}
            fatDiff={fatDiff}
            latest={latest}
            trainingSessions={trainingSessions}
            totalVolume={totalVolume}
            avgCalories={avgCalories}
          />
          {latestSession && latestSession.training_sets?.length > 0 && (
            <LastSession session={latestSession} onDetail={() => setActiveTab("トレーニング")} />
          )}
          {assessment && (
            <AssessmentPreview assessment={assessment} onDetail={() => setActiveTab("AI分析")} />
          )}
        </div>

        <div className={activeTab === "身体データ" ? "block" : "hidden"}>
          <BodyChart records={bodyRecords} />
        </div>
        <div className={activeTab === "トレーニング" ? "block" : "hidden"}>
          <TrainingChart sessions={trainingSessions} />
        </div>
        <div className={activeTab === "食事" ? "block" : "hidden"}>
          <MealChart records={mealRecords} />
        </div>
        <div className={activeTab === "フォト" ? "block" : "hidden"}>
          <PhotoComparison photos={bodyPhotos} />
        </div>
        <div className={activeTab === "AI分析" ? "block" : "hidden"}>
          <AssessmentCard assessment={assessment} />
        </div>
        <div className={activeTab === "提案" ? "block" : "hidden"}>
          <RecommendationPanel recommendation={recommendation} />
        </div>
      </main>
    </div>
  );
}

// ── ロゴ ──────────────────────────────────────────────────────
function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center shadow-md shadow-blue-200">
        <span className="text-white text-sm font-black leading-none">A</span>
      </div>
      <span className="text-slate-800 font-bold text-base tracking-tight">
        AllYourFit
      </span>
    </div>
  );
}

// ── 開始日数バッジ ────────────────────────────────────────────
function DayBadge({ day }: { day: number }) {
  return (
    <div className="text-right">
      <p className="text-[10px] text-slate-400 leading-none mb-1">開始から</p>
      <p className="text-xl font-bold text-blue-600 leading-none">
        {day}
        <span className="text-xs font-normal text-slate-400 ml-0.5">日目</span>
      </p>
    </div>
  );
}

// ── スタットグリッド ──────────────────────────────────────────
function StatGrid({
  weightDiff, fatDiff, latest, trainingSessions, totalVolume, avgCalories,
}: {
  weightDiff: string | null;
  fatDiff: string | null;
  latest: any;
  trainingSessions: any[];
  totalVolume: number;
  avgCalories: number | null;
}) {
  const wd = Number(weightDiff);
  const fd = Number(fatDiff);

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        label="体重変化"
        value={weightDiff ? `${wd > 0 ? "+" : ""}${weightDiff} kg` : "—"}
        sub={latest?.weight_kg ? `現在 ${latest.weight_kg} kg` : "記録なし"}
        accent={weightDiff ? (wd < 0 ? "positive" : "negative") : "neutral"}
        icon="⚖"
      />
      <StatCard
        label="体脂肪変化"
        value={fatDiff ? `${fd > 0 ? "+" : ""}${fatDiff} %` : "—"}
        sub={latest?.body_fat_pct ? `現在 ${latest.body_fat_pct} %` : "記録なし"}
        accent={fatDiff ? (fd < 0 ? "positive" : "negative") : "neutral"}
        icon="📉"
      />
      <StatCard
        label="トレーニング"
        value={`${trainingSessions.length} 回`}
        sub="直近30日間"
        accent={trainingSessions.length > 0 ? "info" : "neutral"}
        icon="🏋"
      />
      <StatCard
        label="総ボリューム"
        value={totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)} t` : "—"}
        sub="直近30日間"
        accent={totalVolume > 0 ? "info" : "neutral"}
        icon="💪"
      />
      <StatCard
        label="平均カロリー"
        value={avgCalories ? `${avgCalories} kcal` : "—"}
        sub="直近7日間"
        accent="neutral"
        icon="🍽"
      />
      <StatCard
        label="コンディション"
        value={latest?.condition_score ? `${latest.condition_score} / 10` : "—"}
        sub="最新スコア"
        accent={
          latest?.condition_score >= 7 ? "positive"
          : latest?.condition_score >= 4 ? "warn"
          : latest?.condition_score ? "negative"
          : "neutral"
        }
        icon="❤"
      />
    </div>
  );
}

type Accent = "positive" | "negative" | "warn" | "info" | "neutral";

function StatCard({
  label, value, sub, accent, icon,
}: {
  label: string; value: string; sub?: string; accent: Accent; icon: string;
}) {
  const styles: Record<Accent, { value: string; bar: string; bg: string; border: string }> = {
    positive: { value: "text-teal-600",  bar: "bg-teal-100",  bg: "bg-white", border: "border-teal-100" },
    negative: { value: "text-rose-500",  bar: "bg-rose-50",   bg: "bg-white", border: "border-rose-100" },
    warn:     { value: "text-amber-500", bar: "bg-amber-50",  bg: "bg-white", border: "border-amber-100" },
    info:     { value: "text-blue-600",  bar: "bg-blue-50",   bg: "bg-white", border: "border-blue-100" },
    neutral:  { value: "text-slate-700", bar: "bg-slate-50",  bg: "bg-white", border: "border-slate-100" },
  };
  const s = styles[accent];

  return (
    <div className={`${s.bg} ${s.bar} rounded-2xl p-4 border ${s.border} shadow-sm print:bg-gray-50 print:border-gray-200`}>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-base leading-none">{icon}</span>
        <p className="text-[11px] text-slate-400 font-medium">{label}</p>
      </div>
      <p className={`text-2xl font-bold tracking-tight ${s.value} print:text-black`}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

// ── 直近セッション ────────────────────────────────────────────
function LastSession({ session, onDetail }: { session: any; onDetail: () => void }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
          <span>🏋</span> 直近のトレーニング
        </p>
        <p className="text-xs text-slate-400">
          {format(parseISO(session.session_date), "M月d日(E)", { locale: ja })}
        </p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {Array.from(new Set(session.training_sets.map((t: any) => t.exercise_name))).map((ex: any) => {
          const sets = session.training_sets.filter((t: any) => t.exercise_name === ex);
          const vol = sets.reduce((s: number, t: any) => s + (t.weight_kg ?? 0) * (t.reps ?? 0), 0);
          return (
            <span key={ex} className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-1.5 text-xs flex items-center gap-1.5">
              <span className="text-slate-700">{ex}</span>
              {vol > 0 && <span className="text-blue-600 font-semibold">{vol}kg</span>}
            </span>
          );
        })}
      </div>
      <button onClick={onDetail} className="text-xs text-blue-500 hover:text-blue-700 transition-colors font-medium">
        詳細を見る →
      </button>
    </div>
  );
}

// ── アセスメントプレビュー ────────────────────────────────────
function AssessmentPreview({ assessment, onDetail }: { assessment: any; onDetail: () => void }) {
  const risks = [
    { key: "risk_obesity",         label: "生習病" },
    { key: "risk_musculoskeletal", label: "筋骨格" },
    { key: "risk_nutrition",       label: "栄養"   },
    { key: "risk_sleep",           label: "睡眠"   },
  ] as const;

  const dot: Record<string, string> = {
    low:    "bg-teal-400",
    medium: "bg-amber-400",
    high:   "bg-rose-500",
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-blue-600 font-semibold flex items-center gap-1">
          <span>✦</span> AI分析サマリー
        </p>
        <div className="flex gap-3">
          {risks.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${dot[assessment[key]] ?? "bg-slate-300"}`} />
              <span className="text-[10px] text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
        {assessment.current_summary}
      </p>
      <button onClick={onDetail} className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">
        詳細を見る →
      </button>
    </div>
  );
}
