"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

export default function TrainingChart({ sessions }: { sessions: any[] }) {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [chartMode, setChartMode] = useState<"volume" | "maxWeight">("volume");

  // 全種目を抽出
  const exercises = Array.from(
    new Set(sessions.flatMap((s) => s.training_sets?.map((t: any) => t.exercise_name) ?? []))
  );

  // セッション総ボリューム推移
  const sessionVolume = sessions.slice(0, 12).reverse().map((s) => ({
    date: format(parseISO(s.session_date), "M/d", { locale: ja }),
    volume: s.training_sets?.reduce(
      (sum: number, t: any) => sum + (t.weight_kg ?? 0) * (t.reps ?? 0),
      0
    ) ?? 0,
  }));

  // 種目別グラフデータ
  const exerciseHistory = selectedExercise
    ? sessions
        .filter((s) => s.training_sets?.some((t: any) => t.exercise_name === selectedExercise))
        .reverse()
        .map((s) => {
          const sets = s.training_sets?.filter((t: any) => t.exercise_name === selectedExercise) ?? [];
          const maxWeight = sets.length ? Math.max(...sets.map((t: any) => t.weight_kg ?? 0)) : 0;
          const volume = sets.reduce((sum: number, t: any) => sum + (t.weight_kg ?? 0) * (t.reps ?? 0), 0);
          return {
            date: format(parseISO(s.session_date), "M/d", { locale: ja }),
            maxWeight,
            volume,
          };
        })
    : [];

  if (sessions.length === 0) {
    return <p className="text-center py-12 text-gray-500">トレーニングデータがありません</p>;
  }

  const latestSession = sessions[0];

  return (
    <div className="space-y-6">
      {/* セッション総ボリューム */}
      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
        <p className="text-xs text-gray-400 mb-4">セッション総ボリューム推移 (kg)</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={sessionVolume}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: "8px", fontSize: 12 }}
              formatter={(v: number) => [`${v.toLocaleString()} kg`, "総ボリューム"]}
            />
            <Bar dataKey="volume" fill="#4ade80" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 直近セッション詳細 */}
      {latestSession && latestSession.training_sets?.length > 0 && (
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">直近セッション詳細</p>
            <p className="text-xs text-gray-600">
              {format(parseISO(latestSession.session_date), "M月d日(E)", { locale: ja })}
            </p>
          </div>
          <ExerciseBreakdown sets={latestSession.training_sets} />
        </div>
      )}

      {/* 種目別グラフ */}
      {exercises.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">種目別推移</p>

          {/* 種目選択 */}
          <div className="flex gap-2 flex-wrap">
            {exercises.map((ex) => (
              <button
                key={ex}
                onClick={() => setSelectedExercise(selectedExercise === ex ? null : ex)}
                className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                  selectedExercise === ex
                    ? "bg-green-500 text-black font-medium"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {ex}
              </button>
            ))}
          </div>

          {selectedExercise && exerciseHistory.length > 0 && (
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 space-y-3">
              {/* ボリューム/最高重量 切り替え */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">{selectedExercise}</p>
                <div className="flex bg-gray-800 rounded-lg p-0.5 gap-0.5">
                  {(["volume", "maxWeight"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setChartMode(mode)}
                      className={`px-3 py-1 rounded-md text-xs transition-colors ${
                        chartMode === mode ? "bg-gray-600 text-white" : "text-gray-500"
                      }`}
                    >
                      {mode === "volume" ? "ボリューム" : "最高重量"}
                    </button>
                  ))}
                </div>
              </div>

              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={exerciseHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: "8px", fontSize: 12 }}
                    formatter={(v: number) => [
                      chartMode === "volume" ? `${v.toLocaleString()} kg` : `${v} kg`,
                      chartMode === "volume" ? "ボリューム" : "最高重量",
                    ]}
                  />
                  <Bar
                    dataKey={chartMode}
                    fill={chartMode === "volume" ? "#4ade80" : "#60a5fa"}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExerciseBreakdown({ sets }: { sets: any[] }) {
  // 種目ごとにグループ化
  const grouped = sets.reduce((acc: Record<string, any[]>, set: any) => {
    const name = set.exercise_name ?? "不明";
    if (!acc[name]) acc[name] = [];
    acc[name].push(set);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([exercise, exSets]) => {
        const volume = exSets.reduce((sum, s) => sum + (s.weight_kg ?? 0) * (s.reps ?? 0), 0);
        const maxWeight = Math.max(...exSets.map((s) => s.weight_kg ?? 0));
        return (
          <div key={exercise}>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-sm text-white font-medium">{exercise}</p>
              <div className="flex gap-3 text-xs text-gray-500">
                <span>最高 {maxWeight}kg</span>
                <span className="text-green-400 font-medium">Vol {volume.toLocaleString()}kg</span>
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {exSets.map((s, i) => (
                <span
                  key={i}
                  className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded-lg"
                >
                  {s.weight_kg}kg × {s.reps}rep
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
