"use client";

import { useState } from "react";
import BodyChart from "./BodyChart";
import TrainingChart from "./TrainingChart";
import MealChart from "./MealChart";
import PhotoComparison from "./PhotoComparison";
import AssessmentCard from "./AssessmentCard";
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

const TABS = ["サマリー", "身体データ", "トレーニング", "食事", "フォト比較", "アセスメント"] as const;

export default function ClientDashboard({
  client,
  bodyRecords,
  trainingSessions,
  mealRecords,
  bodyPhotos,
  assessment,
}: Props) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("サマリー");

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

  // 直近7日の平均カロリー
  const recentMeals = mealRecords.slice(0, 42);
  const mealDates = [...new Set(recentMeals.map((m: any) => m.meal_date))].slice(0, 7);
  const avgCalories = mealDates.length > 0
    ? Math.round(
        mealDates.reduce((sum, date) => {
          const dayTotal = recentMeals.filter((m: any) => m.meal_date === date).reduce((s: number, m: any) => s + (m.calories ?? 0), 0);
          return sum + dayTotal;
        }, 0) / mealDates.length
      )
    : null;

  const latestSession = trainingSessions[0];

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-gray-950 print:bg-white">
      {/* ヘッダー */}
      <header className="border-b border-gray-800 print:border-gray-300 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white print:text-black">medifit</h1>
          <p className="text-sm text-gray-400 print:text-gray-600">{client.name} さんの進捗レポート</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500 print:text-gray-500">開始から</p>
            <p className="text-xl font-bold text-green-400">{dayCount}日目</p>
          </div>
          <button
            onClick={handlePrint}
            className="print:hidden px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-xl transition-colors"
          >
            PDF保存
          </button>
        </div>
      </header>

      {/* タブ（印刷時は非表示） */}
      <nav className="print:hidden border-b border-gray-800 px-4 flex gap-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm whitespace-nowrap transition-colors ${
              activeTab === tab
                ? "text-green-400 border-b-2 border-green-400 font-medium"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab}
            {tab === "アセスメント" && assessment && (
              <span className="ml-1 w-2 h-2 rounded-full bg-green-400 inline-block" />
            )}
          </button>
        ))}
      </nav>

      {/* コンテンツ */}
      <main className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* 印刷時はサマリーを常に表示 */}
        <div className={activeTab === "サマリー" ? "block" : "hidden print:block"}>
          {client.goal && (
            <div className="bg-gray-900 print:bg-gray-100 rounded-2xl p-4 border border-gray-800 print:border-gray-300 mb-6">
              <p className="text-xs text-gray-500 mb-1">目標</p>
              <p className="text-white print:text-black">{client.goal}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="体重変化"
              value={weightDiff ? `${Number(weightDiff) > 0 ? "+" : ""}${weightDiff} kg` : "—"}
              sub={latest?.weight_kg ? `現在 ${latest.weight_kg} kg` : ""}
              positive={Number(weightDiff) < 0}
            />
            <StatCard
              label="体脂肪変化"
              value={fatDiff ? `${Number(fatDiff) > 0 ? "+" : ""}${fatDiff} %` : "—"}
              sub={latest?.body_fat_pct ? `現在 ${latest.body_fat_pct} %` : ""}
              positive={Number(fatDiff) < 0}
            />
            <StatCard
              label="トレーニング"
              value={`${trainingSessions.length} 回`}
              sub="直近30日間"
            />
            <StatCard
              label="総ボリューム"
              value={totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)}t` : "—"}
              sub="直近30日間"
              positive={totalVolume > 0}
            />
            <StatCard
              label="平均カロリー"
              value={avgCalories ? `${avgCalories} kcal` : "—"}
              sub="直近7日間"
            />
            <StatCard
              label="コンディション"
              value={latest?.condition_score ? `${latest.condition_score} / 10` : "—"}
              sub="最新スコア"
              positive={latest?.condition_score >= 7}
            />
          </div>

          {latestSession && latestSession.training_sets?.length > 0 && (
            <div className="bg-gray-900 print:bg-gray-100 rounded-2xl p-4 border border-gray-800 print:border-gray-300 space-y-2 mt-6">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">直近のトレーニング</p>
                <p className="text-xs text-gray-600">
                  {format(parseISO(latestSession.session_date), "M月d日(E)", { locale: ja })}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {Array.from(new Set(latestSession.training_sets.map((t: any) => t.exercise_name))).map((ex: any) => {
                  const sets = latestSession.training_sets.filter((t: any) => t.exercise_name === ex);
                  const vol = sets.reduce((s: number, t: any) => s + (t.weight_kg ?? 0) * (t.reps ?? 0), 0);
                  return (
                    <span key={ex} className="bg-gray-800 print:bg-gray-200 rounded-xl px-3 py-1.5 text-xs">
                      <span className="text-white print:text-black">{ex}</span>
                      <span className="text-green-400 ml-2">{vol}kg</span>
                    </span>
                  );
                })}
              </div>
              <button onClick={() => setActiveTab("トレーニング")} className="print:hidden text-xs text-gray-500 underline">
                詳細を見る →
              </button>
            </div>
          )}

          {assessment && (
            <div className="bg-gray-900 print:bg-gray-100 rounded-2xl p-4 border border-green-900 print:border-gray-300 mt-6">
              <p className="text-xs text-green-400 mb-2">最新アセスメント</p>
              <p className="text-sm text-gray-300 print:text-gray-700 line-clamp-3 print:line-clamp-none">{assessment.current_summary}</p>
              <button
                onClick={() => setActiveTab("アセスメント")}
                className="print:hidden mt-3 text-xs text-green-400 underline"
              >
                詳細を見る →
              </button>
            </div>
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

        <div className={activeTab === "フォト比較" ? "block" : "hidden"}>
          <PhotoComparison photos={bodyPhotos} />
        </div>

        <div className={activeTab === "アセスメント" ? "block" : "hidden"}>
          <AssessmentCard assessment={assessment} />
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  positive,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
}) {
  return (
    <div className="bg-gray-900 print:bg-gray-100 rounded-2xl p-4 border border-gray-800 print:border-gray-300">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p
        className={`text-2xl font-bold ${
          positive === true
            ? "text-green-400"
            : positive === false
            ? "text-red-400"
            : "text-white print:text-black"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}
