"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

const MEAL_LABEL: Record<string, string> = {
  breakfast: "朝食",
  lunch: "昼食",
  dinner: "夕食",
  snack: "間食",
};

export default function MealChart({ records }: { records: any[] }) {
  // 日付ごとに集計
  const byDate = useMemo(() => {
    const map: Record<string, { calories: number; protein: number; fat: number; carbs: number; items: any[] }> = {};
    for (const r of records) {
      if (!map[r.meal_date]) map[r.meal_date] = { calories: 0, protein: 0, fat: 0, carbs: 0, items: [] };
      map[r.meal_date].calories += r.calories ?? 0;
      map[r.meal_date].protein += r.protein_g ?? 0;
      map[r.meal_date].fat += r.fat_g ?? 0;
      map[r.meal_date].carbs += r.carbs_g ?? 0;
      map[r.meal_date].items.push(r);
    }
    return map;
  }, [records]);

  const dailyData = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, d]) => ({
      date: format(parseISO(date), "M/d", { locale: ja }),
      fullDate: date,
      カロリー: Math.round(d.calories),
      たんぱく質: Math.round(d.protein),
      脂質: Math.round(d.fat),
      炭水化物: Math.round(d.carbs),
    }));

  // 直近の食事リスト（日付ごとにグループ）
  const recentDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a)).slice(0, 7);

  if (records.length === 0) {
    return <p className="text-center py-12 text-gray-500">食事データがありません</p>;
  }

  return (
    <div className="space-y-6">
      {/* カロリー推移グラフ */}
      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
        <p className="text-xs text-gray-400 mb-4">日別カロリー推移 (kcal)</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: "8px", fontSize: 12 }}
              formatter={(v: number) => [`${v} kcal`, "カロリー"]}
            />
            <Bar dataKey="カロリー" fill="#fb923c" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* PFC推移グラフ */}
      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
        <p className="text-xs text-gray-400 mb-4">PFCバランス推移 (g)</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: "8px", fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
            <Bar dataKey="たんぱく質" fill="#4ade80" radius={[2, 2, 0, 0]} stackId="pfc" />
            <Bar dataKey="脂質" fill="#facc15" radius={[0, 0, 0, 0]} stackId="pfc" />
            <Bar dataKey="炭水化物" fill="#60a5fa" radius={[2, 2, 0, 0]} stackId="pfc" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 直近の食事リスト */}
      <div className="space-y-4">
        <p className="text-xs text-gray-400">食事記録</p>
        {recentDates.map((date) => {
          const d = byDate[date];
          const mealsByType = d.items.reduce((acc: Record<string, any[]>, item: any) => {
            if (!acc[item.meal_type]) acc[item.meal_type] = [];
            acc[item.meal_type].push(item);
            return acc;
          }, {});

          return (
            <div key={date} className="bg-gray-900 rounded-2xl p-4 border border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white">
                  {format(parseISO(date), "M月d日(E)", { locale: ja })}
                </p>
                <div className="flex gap-3 text-xs">
                  <span className="text-orange-400">{Math.round(d.calories)} kcal</span>
                  <span className="text-green-400">P {Math.round(d.protein)}g</span>
                  <span className="text-yellow-400">F {Math.round(d.fat)}g</span>
                  <span className="text-blue-400">C {Math.round(d.carbs)}g</span>
                </div>
              </div>
              {(["breakfast", "lunch", "dinner", "snack"] as const).map((type) => {
                const items = mealsByType[type];
                if (!items?.length) return null;
                return (
                  <div key={type}>
                    <p className="text-xs text-gray-500 mb-1">{MEAL_LABEL[type]}</p>
                    <div className="space-y-1">
                      {items.map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-gray-300">{item.food_name}</span>
                          {item.calories != null && (
                            <span className="text-gray-500">{item.calories} kcal</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
