"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ReportData } from "@/app/api/trainer/report/route";
import { Button, Icon, Tabs, cn } from "@/components/cf/primitives";

type Period = "weekly" | "monthly";

interface Props {
  clientId: string;
  clientName: string;
  lineUserId: string | null;
}

export default function ReportViewer({ clientId, lineUserId }: Props) {
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
    const res = await fetch(
      `/api/trainer/report?clientId=${clientId}&period=${period}&offset=${offset}`,
    );
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
      <div className="bg-white border border-ink-200/70 rounded-2xl p-4 shadow-card flex flex-wrap gap-3 items-center justify-between">
        <Tabs
          variant="pill"
          tabs={[
            { value: "weekly", label: "週次" },
            { value: "monthly", label: "月次" },
          ]}
          value={period}
          onChange={(v) => {
            setPeriod(v as Period);
            setOffset(0);
          }}
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOffset((o) => o + 1)}
            aria-label="前の期間"
            title="前の期間"
            className="w-8 h-8 rounded-xl bg-ink-100 hover:bg-ink-200 text-ink-600 flex items-center justify-center transition"
          >
            <Icon name="chevron-left" />
          </button>
          <span className="text-xs text-ink-700 font-semibold min-w-[100px] text-center">
            {report?.label ?? "読み込み中..."}
          </span>
          <button
            type="button"
            onClick={() => setOffset((o) => Math.max(0, o - 1))}
            disabled={offset === 0}
            aria-label="次の期間"
            title="次の期間"
            className="w-8 h-8 rounded-xl bg-ink-100 hover:bg-ink-200 disabled:opacity-30 text-ink-600 flex items-center justify-center transition"
          >
            <Icon name="chevron-right" />
          </button>
        </div>

        <Button
          variant="line"
          size="sm"
          icon="message-circle"
          loading={sending}
          disabled={!report || !lineUserId}
          onClick={handleSend}
          title={!lineUserId ? "LINE未連携" : ""}
        >
          {sending ? "送信中..." : "LINEに送る"}
        </Button>
      </div>

      {sendResult && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl px-3 py-2.5 border text-xs",
            sendResult.startsWith("✅")
              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
              : "bg-red-50 text-red-700 border-red-100",
          )}
        >
          {sendResult}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-ink-200/70 p-12 text-center shadow-card">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : report ? (
        <ReportContent report={report} />
      ) : (
        <div className="bg-white rounded-2xl border border-ink-200/70 p-12 text-center text-ink-500 text-sm shadow-card">
          この期間のデータがありません
        </div>
      )}
    </div>
  );
}

function ReportContent({ report }: { report: ReportData }) {
  const diffColor = (v: number | null, positiveIsGood = false) => {
    if (v == null) return "text-ink-400";
    if (v === 0) return "text-ink-500";
    const good = positiveIsGood ? v > 0 : v < 0;
    return good ? "text-emerald-600" : "text-red-500";
  };

  const pctTone = (v: number | null) => {
    if (v == null) return "bg-ink-100 text-ink-500 border-ink-200";
    if (v >= 100) return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (v >= 70) return "bg-amber-50 text-amber-700 border-amber-100";
    return "bg-red-50 text-red-700 border-red-100";
  };

  return (
    <div className="space-y-3">
      <div className="bg-white border border-ink-200/70 rounded-2xl p-5 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
            <Icon name="activity" />
          </div>
          <p className="text-sm font-bold text-ink-800">身体変化</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "体重",
              end: report.weight_end,
              diff: report.weight_diff,
              unit: "kg",
            },
            {
              label: "体脂肪率",
              end: report.body_fat_end,
              diff: report.body_fat_diff,
              unit: "%",
            },
            {
              label: "筋肉量",
              end: report.muscle_end,
              diff: report.muscle_diff,
              unit: "kg",
              posGood: true,
            },
          ].map(({ label, end, diff, unit, posGood }) => (
            <div
              key={label}
              className="bg-ink-50 rounded-xl p-3 border border-ink-200/70"
            >
              <p className="text-[10px] text-ink-500 font-medium">{label}</p>
              <p className="text-xl font-black text-ink-800 font-mono tracking-tight leading-tight mt-0.5">
                {end ?? "—"}
                <span className="text-[10px] font-normal text-ink-400 ml-0.5">
                  {end != null ? unit : ""}
                </span>
              </p>
              {diff != null && (
                <p
                  className={cn(
                    "text-[10px] font-bold mt-0.5",
                    diffColor(diff, posGood),
                  )}
                >
                  {diff > 0 ? "+" : ""}
                  {diff}
                  {unit}
                </p>
              )}
            </div>
          ))}
        </div>

        {report.body_trend.length >= 2 && (
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={90}>
              <LineChart data={report.body_trend}>
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#94a3b8", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis domain={["auto", "auto"]} hide />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 10,
                  }}
                  formatter={(v: number) => [`${v}kg`, "体重"]}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  name="体重"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="bg-white border border-ink-200/70 rounded-2xl p-5 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
            <Icon name="dumbbell" />
          </div>
          <p className="text-sm font-bold text-ink-800">トレーニング</p>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <Metric label="実施回数" value={`${report.training_sessions}回`} />
          <Metric label="総セット数" value={`${report.total_sets}set`} />
          <Metric
            label="総ボリューム"
            value={`${(report.total_volume_kg / 1000).toFixed(1)}t`}
          />
        </div>

        {report.training_achievement_pct != null && (
          <div
            className={cn(
              "text-[11px] font-bold px-3 py-1.5 rounded-xl inline-block mb-3 border",
              pctTone(report.training_achievement_pct),
            )}
          >
            目標達成率 {report.training_achievement_pct}%
          </div>
        )}

        {report.top_exercises.length > 0 && (
          <>
            <p className="text-[10px] text-ink-500 mb-2 font-semibold">
              種目別ボリューム
            </p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={report.top_exercises} layout="vertical">
                <XAxis
                  type="number"
                  tick={{ fill: "#94a3b8", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#334155", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 10,
                  }}
                  formatter={(v: number) => [
                    `${v.toLocaleString()}kg`,
                    "ボリューム",
                  ]}
                />
                <Bar dataKey="volume" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {(report.avg_calories != null || report.logged_days > 0) && (
        <div className="bg-white border border-ink-200/70 rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <Icon name="utensils" />
              </div>
              <p className="text-sm font-bold text-ink-800">食事（日平均）</p>
            </div>
            <p className="text-[10px] text-ink-500 font-medium">
              {report.logged_days}日記録
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <Metric
              label="カロリー"
              value={
                report.avg_calories != null
                  ? `${report.avg_calories} kcal`
                  : "—"
              }
            />
            <Metric
              label="タンパク質"
              value={
                report.avg_protein_g != null ? `${report.avg_protein_g}g` : "—"
              }
            />
            <Metric
              label="脂質"
              value={report.avg_fat_g != null ? `${report.avg_fat_g}g` : "—"}
            />
            <Metric
              label="炭水化物"
              value={
                report.avg_carbs_g != null ? `${report.avg_carbs_g}g` : "—"
              }
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {report.calorie_achievement_pct != null && (
              <span
                className={cn(
                  "text-[10px] font-bold px-2.5 py-1 rounded-lg border",
                  pctTone(report.calorie_achievement_pct),
                )}
              >
                カロリー達成 {report.calorie_achievement_pct}%
              </span>
            )}
            {report.protein_achievement_pct != null && (
              <span
                className={cn(
                  "text-[10px] font-bold px-2.5 py-1 rounded-lg border",
                  pctTone(report.protein_achievement_pct),
                )}
              >
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
    <div className="bg-ink-50 rounded-xl p-2.5 border border-ink-200/70">
      <p className="text-[10px] text-ink-500 font-medium">{label}</p>
      <p className="text-base font-black text-ink-800 font-mono tracking-tight leading-tight mt-0.5">
        {value}
      </p>
    </div>
  );
}
