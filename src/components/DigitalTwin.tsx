"use client";

import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";

interface Props {
  weight_kg: number | null;
  body_fat_pct: number | null;
  muscle_mass_kg: number | null;
  bone_mass_kg?: number | null;
  bmi?: number | null;
  visceral_fat_level?: number | null;
  condition_score?: number | null;
  sleep_hours?: number | null;
  resting_heart_rate?: number | null;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  prev_weight_kg?: number | null;
  prev_body_fat_pct?: number | null;
  prev_muscle_mass_kg?: number | null;
  first_weight_kg?: number | null;
  first_body_fat_pct?: number | null;
  first_muscle_mass_kg?: number | null;
  height_cm?: number | null;
  gender?: string | null;
  birth_year?: number | null;
  recorded_at?: string | null;
  target_weight_kg?: number | null;
  target_body_fat_pct?: number | null;
  lastTrainedMuscles?: string[];
}

const fmt = (v: number | null | undefined, dp = 1) =>
  v != null ? String(+v.toFixed(dp)) : "—";

function delta(curr: number | null | undefined, prev: number | null | undefined, dp = 1) {
  if (curr == null || prev == null) return null;
  return +(curr - prev).toFixed(dp);
}

function DeltaBadge({ d, lowerIsBetter }: { d: number | null; lowerIsBetter?: boolean }) {
  if (d == null || d === 0) return <span className="text-xs text-slate-300">—</span>;
  const good = lowerIsBetter ? d < 0 : d > 0;
  return (
    <span className={`text-xs font-bold tabular-nums ${good ? "text-blue-600" : "text-rose-500"}`}>
      {d < 0 ? "▼" : "▲"}{Math.abs(d)}
    </span>
  );
}

function bodyType(bmi: number | null, fat: number | null, gender: string | null) {
  if (!bmi || !fat) return { label: "—", cls: "bg-slate-100 text-slate-500" };
  const male = gender !== "女性" && gender !== "female";
  if (bmi < 18.5)                      return { label: "やせ型",     cls: "bg-blue-50 text-blue-600" };
  if ((male ? fat < 10 : fat < 17) && bmi >= 22) return { label: "筋肉質",    cls: "bg-violet-50 text-violet-600" };
  if ((male ? fat > 22 : fat > 30) && bmi < 25)  return { label: "かくれ肥満", cls: "bg-amber-50 text-amber-600" };
  if ((male ? fat > 22 : fat > 30) && bmi >= 25) return { label: "肥満",      cls: "bg-rose-50 text-rose-500" };
  return                                          { label: "標準",     cls: "bg-teal-50 text-teal-600" };
}

function fatRange(gender: string | null) {
  return gender === "女性" || gender === "female" ? "17–30%" : "10–22%";
}

function fatStatus(fat: number | null, gender: string | null) {
  if (!fat) return "";
  const male = gender !== "女性" && gender !== "female";
  if (male) { if (fat < 10) return "低"; if (fat <= 17) return "標準"; if (fat <= 22) return "やや高"; return "高"; }
  else      { if (fat < 17) return "低"; if (fat <= 27) return "標準"; if (fat <= 32) return "やや高"; return "高"; }
}

// ── メトリクスカード ──────────────────────────────────────────────────
function MetricCard({
  label, value, unit, delta1, delta2, stdRange,
  valueColor = "text-slate-800", lowerIsBetter = false, sub,
}: {
  label: string;
  value: string;
  unit: string;
  delta1?: number | null;
  delta2?: number | null;
  stdRange?: string;
  valueColor?: string;
  lowerIsBetter?: boolean;
  sub?: string;
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        {stdRange && <p className="text-[10px] text-slate-300">{stdRange}</p>}
      </div>
      <div className="flex items-end gap-1">
        <span className={`text-2xl font-black tabular-nums leading-none ${valueColor}`}>{value}</span>
        <span className="text-xs text-slate-400 mb-0.5">{unit}</span>
        {sub && <span className="text-xs text-slate-400 mb-0.5 ml-1">{sub}</span>}
      </div>
      <div className="flex gap-3 text-[10px] text-slate-400">
        <span>前回: <DeltaBadge d={delta1 ?? null} lowerIsBetter={lowerIsBetter} /></span>
        <span>初回: <DeltaBadge d={delta2 ?? null} lowerIsBetter={lowerIsBetter} /></span>
      </div>
    </div>
  );
}

// ── スモールスタットカード ─────────────────────────────────────────────
function StatCard({ label, value, unit, sub, color = "text-slate-800" }: {
  label: string; value: string | number; unit?: string; sub?: string; color?: string;
}) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-xl font-black tabular-nums leading-tight mt-0.5 ${color}`}>{value}</p>
      {unit && <p className="text-[10px] text-slate-400">{unit}</p>}
      {sub  && <p className="text-[10px] text-slate-400">{sub}</p>}
    </div>
  );
}

export default function DigitalTwin({
  weight_kg, body_fat_pct, muscle_mass_kg, bone_mass_kg,
  bmi, visceral_fat_level, condition_score, sleep_hours,
  resting_heart_rate, systolic_bp, diastolic_bp,
  prev_weight_kg, prev_body_fat_pct, prev_muscle_mass_kg,
  first_weight_kg, first_body_fat_pct, first_muscle_mass_kg,
  height_cm, gender, birth_year, recorded_at,
  target_weight_kg, target_body_fat_pct,
  lastTrainedMuscles = [],
}: Props) {
  const age     = birth_year ? new Date().getFullYear() - birth_year : null;
  const heightM = height_cm ? height_cm / 100 : null;

  const fatMass  = weight_kg && body_fat_pct ? +(weight_kg * body_fat_pct / 100).toFixed(1) : null;
  const leanMass = weight_kg && fatMass      ? +(weight_kg - fatMass).toFixed(1)             : null;
  const calcBMI  = bmi ?? (weight_kg && heightM ? +(weight_kg / (heightM * heightM)).toFixed(1) : null);
  const smi      = muscle_mass_kg && heightM   ? +(muscle_mass_kg / (heightM * heightM)).toFixed(2) : null;
  const male     = gender !== "女性" && gender !== "female";

  const bmr = (() => {
    if (!weight_kg || !height_cm || !age) return null;
    return Math.round(10 * weight_kg + 6.25 * height_cm - 5 * age + (male ? 5 : -161));
  })();

  const bt   = bodyType(calcBMI, body_fat_pct, gender ?? null);
  const smiOk = smi ? smi >= (male ? 7.0 : 5.7) : null;
  const weightStd = heightM
    ? `${(heightM * heightM * 18.5).toFixed(1)}–${(heightM * heightM * 25).toFixed(1)}kg`
    : undefined;

  const radarData = [
    { axis: "筋力",         score: smi ? Math.min(100, Math.round(smi / (male ? 10 : 7) * 100)) : muscle_mass_kg ? Math.min(100, Math.round(muscle_mass_kg / 60 * 100)) : 0 },
    { axis: "体組成",       score: body_fat_pct ? Math.max(0, Math.round(100 - (body_fat_pct - (male ? 10 : 17)) * 4)) : 0 },
    { axis: "コンディション", score: condition_score ? condition_score * 10 : 0 },
    { axis: "睡眠",         score: sleep_hours ? Math.min(100, Math.round(sleep_hours / 8 * 100)) : 0 },
    { axis: "バイタル",     score: resting_heart_rate ? Math.max(0, Math.round(100 - (resting_heart_rate - 40) * 1.5)) : 60 },
  ];
  const overall = Math.round(radarData.reduce((s, d) => s + d.score, 0) / radarData.length);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

      {/* ヘッダー */}
      <div className="bg-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <p className="text-xs font-bold text-white tracking-widest uppercase">Body Analysis</p>
          {recorded_at && (
            <p className="text-xs text-slate-400">
              {new Date(recorded_at).toLocaleDateString("ja-JP", { year: "2-digit", month: "2-digit", day: "2-digit" })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {height_cm && <span className="text-xs text-slate-400">{height_cm}cm</span>}
          {age        && <span className="text-xs text-slate-400">{age}歳</span>}
          {gender     && <span className="text-xs text-slate-400">{gender}</span>}
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${bt.cls}`}>{bt.label}</span>
        </div>
      </div>

      <div className="p-4 space-y-4">

        {/* ── メトリクスカードグリッド ── */}
        <div className="grid grid-cols-2 gap-2.5">
          <MetricCard
            label="体重" value={fmt(weight_kg)} unit="kg"
            delta1={delta(weight_kg, prev_weight_kg)}
            delta2={delta(weight_kg, first_weight_kg)}
            stdRange={weightStd} lowerIsBetter
          />
          <MetricCard
            label="体脂肪率" value={fmt(body_fat_pct)} unit="%"
            delta1={delta(body_fat_pct, prev_body_fat_pct)}
            delta2={delta(body_fat_pct, first_body_fat_pct)}
            stdRange={fatRange(gender ?? null)} lowerIsBetter
            sub={body_fat_pct ? `(${fatStatus(body_fat_pct, gender ?? null)})` : undefined}
          />
          <MetricCard
            label="筋肉量" value={fmt(muscle_mass_kg)} unit="kg"
            delta1={delta(muscle_mass_kg, prev_muscle_mass_kg)}
            delta2={delta(muscle_mass_kg, first_muscle_mass_kg)}
            stdRange={`SMI≥${male ? "7.0" : "5.7"}`}
            valueColor={smiOk === false ? "text-rose-500" : "text-blue-700"}
          />
          <MetricCard
            label="除脂肪量" value={fmt(leanMass)} unit="kg"
            valueColor="text-slate-700"
          />
          {fatMass != null && (
            <MetricCard label="脂肪量" value={fmt(fatMass)} unit="kg" lowerIsBetter />
          )}
          {bone_mass_kg != null && (
            <MetricCard label="骨量" value={fmt(bone_mass_kg)} unit="kg" stdRange="2.5–3.2kg" valueColor="text-amber-600" />
          )}
        </div>

        {/* ── キー指標 4マス ── */}
        <div className="grid grid-cols-4 gap-2">
          <StatCard
            label="BMI" value={fmt(calcBMI)}
            color={calcBMI && calcBMI < 25 ? "text-teal-600" : "text-amber-500"}
            sub={calcBMI ? (calcBMI < 18.5 ? "低体重" : calcBMI < 25 ? "標準" : calcBMI < 30 ? "過体重" : "肥満") : undefined}
          />
          <StatCard label="基礎代謝" value={bmr ?? "—"} unit="kcal" color="text-blue-600" />
          <StatCard
            label="内臓脂肪" value={visceral_fat_level ?? "—"}
            color={visceral_fat_level == null ? "text-slate-300" : visceral_fat_level <= 9 ? "text-teal-600" : visceral_fat_level <= 14 ? "text-amber-500" : "text-rose-500"}
            sub={visceral_fat_level ? (visceral_fat_level <= 9 ? "標準" : visceral_fat_level <= 14 ? "やや高" : "高い") : undefined}
          />
          <StatCard
            label="SMI" value={smi ?? "—"}
            color={smiOk === null ? "text-slate-300" : smiOk ? "text-blue-600" : "text-rose-400"}
            sub={smiOk === null ? undefined : smiOk ? "標準以上" : "低い"}
          />
        </div>

        {/* ── 内臓脂肪レベルスケール ── */}
        {visceral_fat_level != null && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-slate-500 font-semibold">内臓脂肪レベル</p>
              <p className="text-xs font-black text-slate-700 tabular-nums">{visceral_fat_level} / 15</p>
            </div>
            <div className="flex gap-0.5">
              {Array.from({ length: 15 }).map((_, i) => {
                const lv = i + 1;
                const active = lv <= visceral_fat_level;
                const color = lv <= 9 ? "#22c55e" : lv <= 14 ? "#f59e0b" : "#ef4444";
                return (
                  <div key={i} className="flex-1 h-3 rounded-sm" style={{ background: active ? color : "#e2e8f0" }} />
                );
              })}
            </div>
            <div className="flex text-xs text-slate-300 mt-1 px-0.5">
              <span className="flex-[9]">標準 (1–9)</span>
              <span className="flex-[5] text-center">やや高 (10–14)</span>
              <span className="flex-[1] text-right">高</span>
            </div>
          </div>
        )}

        {/* ── バイタルサイン ── */}
        {(systolic_bp || resting_heart_rate || sleep_hours || condition_score) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {systolic_bp && (
              <StatCard
                label="血圧"
                value={`${systolic_bp}/${diastolic_bp ?? "—"}`}
                unit="mmHg"
                color="text-rose-500"
              />
            )}
            {resting_heart_rate && (
              <StatCard
                label="安静時心拍" value={resting_heart_rate} unit="bpm"
                color="text-rose-400"
                sub={resting_heart_rate < 60 ? "アスリート" : resting_heart_rate < 70 ? "良好" : "標準"}
              />
            )}
            {sleep_hours && (
              <StatCard
                label="睡眠" value={sleep_hours} unit="h"
                color="text-indigo-500"
                sub={sleep_hours >= 7 ? "十分" : sleep_hours >= 6 ? "やや不足" : "不足"}
              />
            )}
            {condition_score && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                <p className="text-xs text-slate-500">コンディション</p>
                <p className="text-xl font-black tabular-nums text-violet-500 leading-tight mt-0.5">
                  {condition_score}<span className="text-xs font-normal text-slate-400">/10</span>
                </p>
                <div className="flex gap-0.5 justify-center mt-1.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i < condition_score ? "#7c3aed" : "#e2e8f0" }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── レーダー + スコア ── */}
        <div className="border border-slate-100 rounded-2xl p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Score</p>
            <p className="text-3xl font-black text-blue-600 tabular-nums leading-none">{overall}<span className="text-xs font-normal text-slate-400">/100</span></p>
          </div>

          <div className="grid grid-cols-[1fr_140px] gap-3 items-center">
            {/* スコアバー */}
            <div className="space-y-2">
              {radarData.map((d) => (
                <div key={d.axis}>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-xs text-slate-500">{d.axis}</span>
                    <span className="text-xs font-bold text-slate-600 tabular-nums">{d.score}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${d.score}%`,
                        background: d.score >= 70 ? "#3b82f6" : d.score >= 50 ? "#f59e0b" : "#ef4444",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* レーダーチャート */}
            <ResponsiveContainer width="100%" height={140}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={50}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: "#94a3b8", fontSize: 8, fontWeight: 600 }} />
                <Radar dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.18} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── 目標対比 ── */}
        {(target_weight_kg || target_body_fat_pct) && (
          <div className="border border-slate-100 rounded-xl p-3 space-y-2.5">
            <p className="text-xs text-slate-500 font-semibold">目標対比</p>
            {target_weight_kg && weight_kg && (() => {
              const gap = +(weight_kg - target_weight_kg).toFixed(1);
              const pct = Math.min(100, Math.max(5, 100 - Math.abs(gap) / weight_kg * 300));
              return (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">体重</span>
                    <span className={`font-semibold ${gap > 0 ? "text-rose-500" : "text-teal-600"}`}>
                      {gap > 0 ? `残り ${Math.abs(gap)}kg` : `達成! ${Math.abs(gap)}kg超過`}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })()}
            {target_body_fat_pct && body_fat_pct && (() => {
              const gap = +(body_fat_pct - target_body_fat_pct).toFixed(1);
              const pct = Math.min(100, Math.max(5, 100 - Math.abs(gap) * 8));
              return (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">体脂肪率</span>
                    <span className={`font-semibold ${gap > 0 ? "text-rose-500" : "text-teal-600"}`}>
                      {gap > 0 ? `残り ${Math.abs(gap)}%` : `達成! ${Math.abs(gap)}%超過`}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
