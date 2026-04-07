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
  { id: "サマリー",     icon: "◈" },
  { id: "身体データ",   icon: "📈" },
  { id: "トレーニング", icon: "🏋" },
  { id: "食事",        icon: "🥗" },
  { id: "フォト",      icon: "📷" },
  { id: "AI分析",      icon: "✦" },
  { id: "提案",        icon: "💡" },
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

  // TODO: API有効化後はサーバーから取得
  const recommendation = getMockRecommendation();

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-[#0a0a0f] print:bg-white">

      {/* ── ヘッダー ── */}
      <header className="border-b border-white/5 print:border-gray-300 px-5 py-4 flex items-center justify-between backdrop-blur-sm sticky top-0 bg-[#0a0a0f]/90 z-10">
        <Logo />
        <div className="flex items-center gap-4">
          <DayBadge day={dayCount} />
          <button
            onClick={handlePrint}
            className="print:hidden px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs transition-colors border border-white/10"
          >
            PDF
          </button>
        </div>
      </header>

      {/* ── クライアント名・目標 ── */}
      <div className="print:hidden px-5 pt-5 pb-2">
        <p className="text-white font-semibold text-lg">{client.name}<span className="text-gray-500 font-normal text-sm ml-1">さん</span></p>
        {client.goal && (
          <p className="text-sm text-gray-500 mt-0.5">🎯 {client.goal}</p>
        )}
      </div>

      {/* ── タブナビ ── */}
      <nav className="print:hidden px-3 pt-1 pb-0 flex gap-0.5 overflow-x-auto scrollbar-none">
        {TABS.map(({ id, icon }) => {
          const active = activeTab === id;
          const hasBadge = (id === "AI分析" && assessment) || id === "提案";
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`relative flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-t-lg transition-all ${
                active
                  ? "bg-white/5 text-white border-t border-x border-white/10 -mb-px z-10"
                  : "text-gray-600 hover:text-gray-400"
              }`}
            >
              <span className="text-sm leading-none">{icon}</span>
              <span>{id}</span>
              {hasBadge && (
                <span className={`w-1.5 h-1.5 rounded-full ${id === "提案" ? "bg-amber-400" : "bg-emerald-400"}`} />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── コンテンツエリア ── */}
      <main className="px-4 py-5 max-w-2xl mx-auto space-y-4 border-t border-white/5 print:border-0">

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
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-900/40">
        <span className="text-black text-xs font-black leading-none">A</span>
      </div>
      <span className="text-white font-bold text-base tracking-tight">
        AllYourFit
      </span>
    </div>
  );
}

// ── 開始日数バッジ ────────────────────────────────────────────
function DayBadge({ day }: { day: number }) {
  return (
    <div className="text-right">
      <p className="text-[10px] text-gray-600 leading-none mb-1">開始から</p>
      <p className="text-xl font-bold text-emerald-400 leading-none">{day}<span className="text-xs font-normal text-gray-500 ml-0.5">日目</span></p>
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
    <div className="grid grid-cols-2 gap-2.5">
      <StatCard
        icon="⚖"
        label="体重変化"
        value={weightDiff ? `${wd > 0 ? "+" : ""}${weightDiff} kg` : "—"}
        sub={latest?.weight_kg ? `現在 ${latest.weight_kg} kg` : "記録なし"}
        accent={weightDiff ? (wd < 0 ? "green" : "red") : "neutral"}
      />
      <StatCard
        icon="📉"
        label="体脂肪変化"
        value={fatDiff ? `${fd > 0 ? "+" : ""}${fatDiff} %` : "—"}
        sub={latest?.body_fat_pct ? `現在 ${latest.body_fat_pct} %` : "記録なし"}
        accent={fatDiff ? (fd < 0 ? "green" : "red") : "neutral"}
      />
      <StatCard
        icon="🏋"
        label="トレーニング"
        value={`${trainingSessions.length} 回`}
        sub="直近30日間"
        accent={trainingSessions.length > 0 ? "green" : "neutral"}
      />
      <StatCard
        icon="💪"
        label="総ボリューム"
        value={totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)} t` : "—"}
        sub="直近30日間"
        accent={totalVolume > 0 ? "green" : "neutral"}
      />
      <StatCard
        icon="🍽"
        label="平均カロリー"
        value={avgCalories ? `${avgCalories} kcal` : "—"}
        sub="直近7日間"
        accent="neutral"
      />
      <StatCard
        icon="❤"
        label="コンディション"
        value={latest?.condition_score ? `${latest.condition_score} / 10` : "—"}
        sub="最新スコア"
        accent={
          latest?.condition_score >= 7 ? "green"
          : latest?.condition_score >= 4 ? "yellow"
          : latest?.condition_score ? "red"
          : "neutral"
        }
      />
    </div>
  );
}

type Accent = "green" | "red" | "yellow" | "neutral";

function StatCard({
  icon, label, value, sub, accent,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  accent: Accent;
}) {
  const valueColor: Record<Accent, string> = {
    green:   "text-emerald-400",
    red:     "text-rose-400",
    yellow:  "text-amber-400",
    neutral: "text-white",
  };
  const borderColor: Record<Accent, string> = {
    green:   "border-emerald-900/60",
    red:     "border-rose-900/60",
    yellow:  "border-amber-900/60",
    neutral: "border-white/5",
  };

  return (
    <div className={`bg-white/[0.03] rounded-2xl p-4 border ${borderColor[accent]} print:bg-gray-100 print:border-gray-300`}>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-sm leading-none">{icon}</span>
        <p className="text-[11px] text-gray-500 font-medium">{label}</p>
      </div>
      <p className={`text-2xl font-bold tracking-tight ${valueColor[accent]} print:text-black`}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}

// ── 直近セッション ────────────────────────────────────────────
function LastSession({ session, onDetail }: { session: any; onDetail: () => void }) {
  return (
    <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 font-medium">直近のトレーニング</p>
        <p className="text-xs text-gray-600">
          {format(parseISO(session.session_date), "M月d日(E)", { locale: ja })}
        </p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {Array.from(new Set(session.training_sets.map((t: any) => t.exercise_name))).map((ex: any) => {
          const sets = session.training_sets.filter((t: any) => t.exercise_name === ex);
          const vol = sets.reduce((s: number, t: any) => s + (t.weight_kg ?? 0) * (t.reps ?? 0), 0);
          return (
            <span key={ex} className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs flex items-center gap-1.5">
              <span className="text-gray-300">{ex}</span>
              {vol > 0 && <span className="text-emerald-400 font-medium">{vol}kg</span>}
            </span>
          );
        })}
      </div>
      <button onClick={onDetail} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
        詳細を見る →
      </button>
    </div>
  );
}

// ── アセスメントプレビュー ────────────────────────────────────
function AssessmentPreview({ assessment, onDetail }: { assessment: any; onDetail: () => void }) {
  const risks = [
    { key: "risk_obesity",        label: "生習病" },
    { key: "risk_musculoskeletal",label: "筋骨格" },
    { key: "risk_nutrition",      label: "栄養" },
    { key: "risk_sleep",          label: "睡眠" },
  ] as const;

  const dot: Record<string, string> = {
    low: "bg-emerald-400",
    medium: "bg-amber-400",
    high: "bg-rose-400",
  };

  return (
    <div className="bg-white/[0.03] rounded-2xl p-4 border border-emerald-900/40 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-emerald-400 font-medium">✦ AI分析</p>
        <div className="flex gap-2">
          {risks.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${dot[assessment[key]] ?? "bg-gray-600"}`} />
              <span className="text-[10px] text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-sm text-gray-300 line-clamp-3 leading-relaxed">
        {assessment.current_summary}
      </p>
      <button onClick={onDetail} className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors">
        詳細を見る →
      </button>
    </div>
  );
}
