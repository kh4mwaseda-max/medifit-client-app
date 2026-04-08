"use client";

import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { ReportData } from "@/app/api/trainer/report/route";

type Period = "weekly" | "monthly";

interface Props {
  clientId: string;
  clientName: string;
  lineUserId: string | null;
}

export default function ReportViewer({ clientId, clientName, lineUserId }: Props) {
  const [period, setPeriod] = useState<Period>("weekly");
  const [offset, setOffset] = useState(0);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, [period, offset]);

  async function fetchReport() {
    setLoading(true);
    setSendResult(null);
    const res = await fetch(`/api/trainer/report?clientId=${clientId}&period=${period}&offset=${offset}`);
    const data = await res.json();
    setReport(data.report ?? null);
    setLoading(false);
  }

  async function handleSend() {
    if (!report) return;
    setSending(true);
    setSendResult(null);
    const res = await fetch("/api/trainer/report/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, report }),
    });
    const data = await res.json();
    setSendResult(res.ok ? "✅ LINEに送信しました" : `❌ ${data.error}`);
    setSending(false);
  }

  return (
    <div className="space-y-4">
      {/* コントロールバー */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        {/* 期間切替 */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {(["weekly", "monthly"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => { setPeriod(p); setOffset(0); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                period === p ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {p === "weekly" ? "週次" : "月次"}
            </button>
          ))}
        </div>

        {/* 前後ナビ */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOffset((o) => o + 1)}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-sm flex items-center justify-center transition-colors"
          >
            ‹
          </button>
          <span className="text-xs text-slate-500 min-w-[100px] text-center">
            {report?.label ?? "読み込み中..."}
          </span>
          <button
            type="button"
            onClick={() => setOffset((o) => Math.max(0, o - 1))}
            disabled={offset === 0}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-500 text-sm flex items-center justify-center transition-colors"
          >
            ›
          </button>
        </div>

        {/* LINE送信 */}
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !report || !lineUserId}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold rounded-xl transition-colors"
          title={!lineUserId ? "LINE未連携" : ""}
        >
          {sending ? "送信中..." : "LINEに送る"}
        </button>
      </div>

      {sendResult && (
        <div className={`text-xs px-4 py-3 rounded-xl border ${
          sendResult.startsWith("✅")
            ? "bg-teal-50 border-teal-200 text-teal-700"
            : "bg-rose-50 border-rose-200 text-rose-600"
        }`}>
          {sendResult}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : report ? (
        <ReportContent report={report} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          この期間のデータがありません
        </div>
      )}
    </div>
  );
}

function ReportContent({ report }: { report: ReportData }) {
  const diffColor = (v: number | null, positiveIsGood = false) => {
    if (v == null) return "text-slate-400";
    if (v === 0) return "text-slate-500";
    const good = positiveIsGood ? v > 0 : v < 0;
    return good ? "text-teal-600" : "text-rose-500";
  };

  const pctBg = (v: number | null) => {
    if (v == null) return "bg-slate-100 text-slate-400";
    if (v >= 100) return "bg-teal-50 text-teal-600 border border-teal-200";
    if (v >= 70)  return "bg-amber-50 text-amber-600 border border-amber-200";
    return "bg-rose-50 text-rose-500 border border-rose-200";
  };

  return (
    <div className="space-y-3">

      {/* 身体変化カード */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <p className="text-xs font-semibold text-slate-500 mb-3">⚖️ 身体変化</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "体重", end: report.weight_end, diff: report.weight_diff, unit: "kg" },
            { label: "体脂肪率", end: report.body_fat_end, diff: report.body_fat_diff, unit: "%" },
            { label: "筋肉量", end: report.muscle_end, diff: report.muscle_diff, unit: "kg", posGood: true },
          ].map(({ label, end, diff, unit, posGood }) => (
            <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[9px] text-slate-400">{label}</p>
              <p className="text-xl font-black text-slate-800 tabular-nums leading-tight">
                {end ?? "—"}<span className="text-[9px] font-normal text-slate-400">{end != null ? unit : ""}</span>
              </p>
              {diff != null && (
                <p className={`text-[10px] font-semibold ${diffColor(diff, posGood)}`}>
                  {diff > 0 ? "+" : ""}{diff}{unit}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* 体重推移グラフ */}
        {report.body_trend.length >= 2 && (
          <div className="mt-3">
            <ResponsiveContainer width="100%" height={90}>
              <LineChart data={report.body_trend}>
                <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis domain={["auto", "auto"]} hide />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 10 }}
                  formatter={(v: number) => [`${v}kg`, "体重"]}
                />
                <Line type="monotone" dataKey="weight" stroke="#2563eb" strokeWidth={2} dot={false} connectNulls name="体重" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* トレーニングカード */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <p className="text-xs font-semibold text-slate-500 mb-3">🏋️ トレーニング</p>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <Metric label="実施回数" value={`${report.training_sessions}回`} />
          <Metric label="総セット数" value={`${report.total_sets}set`} />
          <Metric label="総ボリューム" value={`${(report.total_volume_kg / 1000).toFixed(1)}t`} />
        </div>

        {report.training_achievement_pct != null && (
          <div className={`text-[11px] font-semibold px-3 py-1.5 rounded-xl inline-block mb-3 ${pctBg(report.training_achievement_pct)}`}>
            目標達成率 {report.training_achievement_pct}%
          </div>
        )}

        {/* 種目別ボリューム棒グラフ */}
        {report.top_exercises.length > 0 && (
          <>
            <p className="text-[10px] text-slate-400 mb-2">種目別ボリューム</p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={report.top_exercises} layout="vertical">
                <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 10 }}
                  formatter={(v: number) => [`${v.toLocaleString()}kg`, "ボリューム"]}
                />
                <Bar dataKey="volume" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {/* 食事カード */}
      {(report.avg_calories != null || report.logged_days > 0) && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-500">🥗 食事（日平均）</p>
            <p className="text-[10px] text-slate-400">{report.logged_days}日記録</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <Metric label="カロリー" value={report.avg_calories != null ? `${report.avg_calories} kcal` : "—"} />
            <Metric label="タンパク質" value={report.avg_protein_g != null ? `${report.avg_protein_g}g` : "—"} />
            <Metric label="脂質" value={report.avg_fat_g != null ? `${report.avg_fat_g}g` : "—"} />
            <Metric label="炭水化物" value={report.avg_carbs_g != null ? `${report.avg_carbs_g}g` : "—"} />
          </div>

          <div className="flex gap-2 flex-wrap">
            {report.calorie_achievement_pct != null && (
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-xl ${pctBg(report.calorie_achievement_pct)}`}>
                カロリー達成 {report.calorie_achievement_pct}%
              </span>
            )}
            {report.protein_achievement_pct != null && (
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-xl ${pctBg(report.protein_achievement_pct)}`}>
                タンパク質達成 {report.protein_achievement_pct}%
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
      <p className="text-[9px] text-slate-400">{label}</p>
      <p className="text-base font-black text-slate-800 tabular-nums leading-tight">{value}</p>
    </div>
  );
}
