"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

export default function TrainingChart({ sessions }: { sessions: any[] }) {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  // 全種目を抽出
  const exercises = Array.from(
    new Set(sessions.flatMap((s) => s.training_sets?.map((t: any) => t.exercise_name) ?? []))
  );

  // 週次ボリューム集計
  const weeklyVolume = sessions.slice(0, 12).reverse().map((s) => ({
    date: format(parseISO(s.session_date), "M/d", { locale: ja }),
    volume: s.training_sets?.reduce(
      (sum: number, t: any) => sum + (t.weight_kg ?? 0) * (t.reps ?? 0),
      0
    ) ?? 0,
  }));

  // 種目別最高重量推移
  const exerciseHistory = selectedExercise
    ? sessions
        .filter((s) => s.training_sets?.some((t: any) => t.exercise_name === selectedExercise))
        .reverse()
        .map((s) => {
          const sets = s.training_sets?.filter((t: any) => t.exercise_name === selectedExercise);
          const maxWeight = Math.max(...(sets?.map((t: any) => t.weight_kg ?? 0) ?? [0]));
          return {
            date: format(parseISO(s.session_date), "M/d", { locale: ja }),
            maxWeight,
          };
        })
    : [];

  if (sessions.length === 0) {
    return <p className="text-center py-12 text-gray-500">トレーニングデータがありません</p>;
  }

  return (
    <div className="space-y-6">
      {/* 週次ボリューム */}
      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
        <p className="text-xs text-gray-400 mb-4">トレーニングボリューム推移</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={weeklyVolume}>
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

      {/* 種目別 */}
      {exercises.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">種目別の最高重量推移</p>
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
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <p className="text-xs text-gray-400 mb-4">{selectedExercise} - 最高重量 (kg)</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={exerciseHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: "8px", fontSize: 12 }} />
                  <Bar dataKey="maxWeight" fill="#60a5fa" radius={[4, 4, 0, 0]} name="最高重量 (kg)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
