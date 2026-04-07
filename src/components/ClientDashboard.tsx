"use client";

import { useState } from "react";
import BodyChart from "./BodyChart";
import TrainingChart from "./TrainingChart";
import PhotoComparison from "./PhotoComparison";
import AssessmentCard from "./AssessmentCard";
import { formatDate, daysSince } from "@/lib/utils";

interface Props {
  client: { id: string; name: string; goal: string | null; start_date: string };
  bodyRecords: any[];
  trainingSessions: any[];
  mealRecords: any[];
  bodyPhotos: any[];
  assessment: any | null;
}

const TABS = ["サマリー", "身体データ", "トレーニング", "フォト比較", "アセスメント"] as const;

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

  return (
    <div className="min-h-screen bg-gray-950">
      {/* ヘッダー */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">medifit</h1>
          <p className="text-sm text-gray-400">{client.name} さんの進捗レポート</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">開始から</p>
          <p className="text-xl font-bold text-green-400">{dayCount}日目</p>
        </div>
      </header>

      {/* タブ */}
      <nav className="border-b border-gray-800 px-4 flex gap-1 overflow-x-auto">
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
        {activeTab === "サマリー" && (
          <>
            {client.goal && (
              <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
                <p className="text-xs text-gray-500 mb-1">目標</p>
                <p className="text-white">{client.goal}</p>
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
                label="コンディション"
                value={latest?.condition_score ? `${latest.condition_score} / 10` : "—"}
                sub="最新スコア"
                positive={latest?.condition_score >= 7}
              />
            </div>

            {assessment && (
              <div className="bg-gray-900 rounded-2xl p-4 border border-green-900">
                <p className="text-xs text-green-400 mb-2">最新アセスメント</p>
                <p className="text-sm text-gray-300 line-clamp-3">{assessment.current_summary}</p>
                <button
                  onClick={() => setActiveTab("アセスメント")}
                  className="mt-3 text-xs text-green-400 underline"
                >
                  詳細を見る →
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === "身体データ" && (
          <BodyChart records={bodyRecords} />
        )}

        {activeTab === "トレーニング" && (
          <TrainingChart sessions={trainingSessions} />
        )}

        {activeTab === "フォト比較" && (
          <PhotoComparison photos={bodyPhotos} />
        )}

        {activeTab === "アセスメント" && (
          <AssessmentCard assessment={assessment} />
        )}
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
    <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p
        className={`text-2xl font-bold ${
          positive === true
            ? "text-green-400"
            : positive === false
            ? "text-red-400"
            : "text-white"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}
