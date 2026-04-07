"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, parseISO, subDays } from "date-fns";
import { ja } from "date-fns/locale";

const RANGES = ["7日", "30日", "90日"] as const;

export default function BodyChart({ records }: { records: any[] }) {
  const [range, setRange] = useState<(typeof RANGES)[number]>("30日");
  const [metric, setMetric] = useState<"weight" | "fat" | "muscle">("weight");

  const days = range === "7日" ? 7 : range === "30日" ? 30 : 90;
  const cutoff = subDays(new Date(), days);

  const filtered = records
    .filter((r) => new Date(r.recorded_at) >= cutoff)
    .map((r) => ({
      date: format(parseISO(r.recorded_at), "M/d", { locale: ja }),
      weight: r.weight_kg,
      fat: r.body_fat_pct,
      muscle: r.muscle_mass_kg,
    }));

  const metricConfig = {
    weight: { key: "weight", label: "体重 (kg)", color: "#4ade80" },
    fat: { key: "fat", label: "体脂肪率 (%)", color: "#f87171" },
    muscle: { key: "muscle", label: "筋肉量 (kg)", color: "#60a5fa" },
  };
  const m = metricConfig[metric];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(["weight", "fat", "muscle"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setMetric(k)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              metric === k
                ? "bg-green-500 text-black font-medium"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {metricConfig[k].label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 py-1 rounded-full text-xs transition-colors ${
              range === r ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-8">この期間のデータがありません</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={filtered}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111827",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey={m.key}
                stroke={m.color}
                strokeWidth={2}
                dot={{ fill: m.color, r: 3 }}
                connectNulls
                name={m.label}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
