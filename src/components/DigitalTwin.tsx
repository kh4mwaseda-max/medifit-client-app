"use client";

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip,
} from "recharts";

interface Props {
  weight_kg: number | null;
  body_fat_pct: number | null;
  muscle_mass_kg: number | null;
  target_body_fat_pct?: number | null;
  target_weight_kg?: number | null;
  lastTrainedMuscles?: string[];
  condition_score?: number | null;
  // 追加計測値
  bmi?: number | null;
  bone_mass_kg?: number | null;
  visceral_fat_level?: number | null;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  resting_heart_rate?: number | null;
  sleep_hours?: number | null;
}

// 体脂肪率カラーマップ
function fatColor(pct: number | null) {
  if (pct == null) return "#94a3b8";
  if (pct < 10)   return "#f97316";
  if (pct < 15)   return "#06b6d4";
  if (pct < 20)   return "#22c55e";
  if (pct < 25)   return "#84cc16";
  if (pct < 30)   return "#eab308";
  return "#ef4444";
}
function fatLabel(pct: number | null) {
  if (pct == null) return "未計測";
  if (pct < 10)   return "アスリート";
  if (pct < 15)   return "フィット";
  if (pct < 20)   return "標準";
  if (pct < 25)   return "やや高め";
  if (pct < 30)   return "高め";
  return "要改善";
}

// BMI判定
function bmiLabel(bmi: number | null) {
  if (bmi == null) return { label: "—", color: "#94a3b8" };
  if (bmi < 18.5) return { label: "低体重", color: "#60a5fa" };
  if (bmi < 25)   return { label: "標準", color: "#22c55e" };
  if (bmi < 30)   return { label: "過体重", color: "#eab308" };
  return           { label: "肥満", color: "#ef4444" };
}

// 内臓脂肪レベル判定
function visceralLabel(level: number | null) {
  if (level == null) return { label: "—", color: "#94a3b8" };
  if (level <= 9)  return { label: "標準", color: "#22c55e" };
  if (level <= 14) return { label: "やや高", color: "#eab308" };
  return           { label: "高い", color: "#ef4444" };
}

// 血圧判定
function bpLabel(sys: number | null) {
  if (sys == null) return { label: "—", color: "#94a3b8" };
  if (sys < 120)   return { label: "正常", color: "#22c55e" };
  if (sys < 130)   return { label: "正常高値", color: "#84cc16" };
  if (sys < 140)   return { label: "高値", color: "#eab308" };
  return           { label: "高血圧", color: "#ef4444" };
}

// セクションタイトル
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="h-px flex-1 bg-slate-100" />
      <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase whitespace-nowrap">{children}</p>
      <div className="h-px flex-1 bg-slate-100" />
    </div>
  );
}

// スコアゲージ（水平バー）
function GaugeBar({ value, max, color, label, unit }: {
  value: number | null; max: number; color: string; label: string; unit: string;
}) {
  const pct = value != null ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-baseline mb-0.5">
        <span className="text-[9px] text-slate-400">{label}</span>
        <span className="text-[11px] font-black text-slate-700 tabular-nums">
          {value ?? "—"}<span className="text-[8px] font-normal text-slate-400 ml-0.5">{unit}</span>
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// 数値バッジ
function MetricBadge({ label, value, unit, color, sub }: {
  label: string; value: number | null | string; unit: string; color: string; sub?: string;
}) {
  return (
    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex flex-col">
      <p className="text-[8px] text-slate-400 leading-none mb-1">{label}</p>
      <p className="text-xl font-black tabular-nums leading-none" style={{ color }}>
        {value ?? "—"}
        <span className="text-[9px] font-normal text-slate-400 ml-0.5">{unit}</span>
      </p>
      {sub && <p className="text-[8px] mt-0.5" style={{ color }}>{sub}</p>}
    </div>
  );
}

export default function DigitalTwin({
  weight_kg, body_fat_pct, muscle_mass_kg,
  target_body_fat_pct, target_weight_kg,
  lastTrainedMuscles = [], condition_score,
  bmi, bone_mass_kg, visceral_fat_level,
  systolic_bp, diastolic_bp, resting_heart_rate, sleep_hours,
}: Props) {
  const fc = fatColor(body_fat_pct);
  const fl = fatLabel(body_fat_pct);
  const bmiInfo = bmiLabel(bmi ?? (weight_kg && muscle_mass_kg ? +(weight_kg / ((1.7) ** 2)).toFixed(1) : null));
  const visInfo = visceralLabel(visceral_fat_level ?? null);
  const bpInfo  = bpLabel(systolic_bp ?? null);

  // 体組成内訳（推定）
  const fatMass    = weight_kg && body_fat_pct ? +(weight_kg * body_fat_pct / 100).toFixed(1) : null;
  const leanMass   = weight_kg && fatMass ? +(weight_kg - fatMass).toFixed(1) : null;

  // レーダーチャートデータ（5軸スコア）
  const radarData = [
    { axis: "筋力",     score: muscle_mass_kg ? Math.min(100, Math.round(muscle_mass_kg / 70 * 100)) : 0 },
    { axis: "体組成",   score: body_fat_pct   ? Math.max(0, Math.round(100 - (body_fat_pct - 10) * 4)) : 0 },
    { axis: "心肺",     score: resting_heart_rate ? Math.max(0, Math.round(100 - (resting_heart_rate - 40) * 1.2)) : 0 },
    { axis: "コンディション", score: condition_score ? condition_score * 10 : 0 },
    { axis: "睡眠",     score: sleep_hours ? Math.min(100, Math.round(sleep_hours / 8 * 100)) : 0 },
  ];

  // 総合スコア
  const overallScore = Math.round(radarData.reduce((s, d) => s + d.score, 0) / radarData.length);

  // 筋肉部位バーチャートデータ
  const muscleGroupData = [
    { name: "胸",   trained: lastTrainedMuscles.includes("胸") },
    { name: "背中", trained: lastTrainedMuscles.includes("背中") },
    { name: "肩",   trained: lastTrainedMuscles.includes("肩") },
    { name: "脚",   trained: lastTrainedMuscles.includes("脚") },
    { name: "腕",   trained: lastTrainedMuscles.includes("腕") },
    { name: "腹",   trained: lastTrainedMuscles.includes("腹") },
  ].map((d) => ({ ...d, value: d.trained ? 85 + Math.random() * 15 : 30 + Math.random() * 40 }));

  return (
    <div className="w-full space-y-3 text-left">

      {/* ══ ヘッダー：総合スコア ══ */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] text-slate-400 uppercase tracking-widest">Overall Score</p>
          <div className="flex items-baseline gap-1.5">
            <p className="text-5xl font-black tabular-nums leading-none" style={{ color: fc }}>
              {overallScore}
            </p>
            <p className="text-xs text-slate-400">/ 100</p>
          </div>
        </div>
        {/* 体脂肪ステータス */}
        <div className="text-right">
          <span
            className="text-[10px] font-bold px-3 py-1.5 rounded-full"
            style={{ background: `${fc}18`, color: fc, border: `1px solid ${fc}40` }}
          >
            {fl}
          </span>
          {body_fat_pct != null && (
            <p className="text-xs font-black tabular-nums mt-1" style={{ color: fc }}>
              体脂肪率 {body_fat_pct}%
            </p>
          )}
        </div>
      </div>

      {/* ══ 主要指標グリッド ══ */}
      <div className="grid grid-cols-3 gap-2">
        <MetricBadge label="体重"   value={weight_kg}    unit="kg" color="#334155" sub={target_weight_kg ? `目標 ${target_weight_kg}kg` : undefined} />
        <MetricBadge label="筋肉量" value={muscle_mass_kg} unit="kg" color="#3b82f6" />
        <MetricBadge label="除脂肪体重" value={leanMass}  unit="kg" color="#6366f1" />
        <MetricBadge label="脂肪量" value={fatMass}      unit="kg" color={fc} />
        <MetricBadge label="骨量"   value={bone_mass_kg ?? null} unit="kg" color="#f59e0b" />
        <MetricBadge
          label="BMI"
          value={bmi ?? (weight_kg ? +(weight_kg / (1.70 ** 2)).toFixed(1) : null)}
          unit=""
          color={bmiInfo.color}
          sub={bmiInfo.label}
        />
      </div>

      {/* ══ レーダーチャート ══ */}
      <div>
        <SectionTitle>フィットネス総合評価</SectionTitle>
        <ResponsiveContainer width="100%" height={160}>
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={60}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: 600 }}
            />
            <Radar
              dataKey="score"
              stroke={fc}
              fill={fc}
              fillOpacity={0.2}
              strokeWidth={1.5}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* ══ 体組成バー ══ */}
      <div>
        <SectionTitle>体組成内訳</SectionTitle>
        <div className="space-y-2">
          <GaugeBar value={body_fat_pct}     max={40}   color={fc}        label="体脂肪率"      unit="%" />
          <GaugeBar value={muscle_mass_kg}   max={80}   color="#3b82f6"   label="筋肉量"        unit="kg" />
          {bone_mass_kg && <GaugeBar value={bone_mass_kg} max={4} color="#f59e0b" label="骨量" unit="kg" />}
        </div>
        {/* 脂肪 vs 筋肉 比率バー */}
        {weight_kg && fatMass && leanMass && (
          <div className="mt-2">
            <p className="text-[8px] text-slate-400 mb-1">脂肪 vs 除脂肪 比率</p>
            <div className="h-2.5 rounded-full overflow-hidden flex">
              <div
                className="h-full transition-all duration-700"
                style={{ width: `${body_fat_pct}%`, background: fc }}
              />
              <div
                className="h-full flex-1"
                style={{ background: "#3b82f6" }}
              />
            </div>
            <div className="flex justify-between text-[8px] mt-0.5">
              <span style={{ color: fc }}>脂肪 {fatMass}kg</span>
              <span style={{ color: "#3b82f6" }}>除脂肪 {leanMass}kg</span>
            </div>
          </div>
        )}
      </div>

      {/* ══ 筋肉部位アクティビティ ══ */}
      {lastTrainedMuscles.length > 0 && (
        <div>
          <SectionTitle>部位別アクティビティ</SectionTitle>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={muscleGroupData} layout="vertical" margin={{ left: 0, right: 8 }}>
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} width={24} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 9 }}
                formatter={(v: number) => [`${Math.round(v)}%`, "活性度"]}
              />
              <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={8}>
                {muscleGroupData.map((d, i) => (
                  <Cell key={i} fill={d.trained ? "#3b82f6" : "#e2e8f0"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ══ バイタルサイン ══ */}
      {(systolic_bp || resting_heart_rate || sleep_hours) && (
        <div>
          <SectionTitle>バイタル・コンディション</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {systolic_bp && (
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                <p className="text-[8px] text-slate-400">血圧</p>
                <p className="text-base font-black tabular-nums leading-none" style={{ color: bpInfo.color }}>
                  {systolic_bp}/{diastolic_bp ?? "—"}
                  <span className="text-[8px] font-normal text-slate-400 ml-0.5">mmHg</span>
                </p>
                <p className="text-[8px] mt-0.5" style={{ color: bpInfo.color }}>{bpInfo.label}</p>
              </div>
            )}
            {resting_heart_rate && (
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                <p className="text-[8px] text-slate-400">安静時心拍</p>
                <p className="text-base font-black tabular-nums leading-none text-rose-500">
                  {resting_heart_rate}
                  <span className="text-[8px] font-normal text-slate-400 ml-0.5">bpm</span>
                </p>
                <p className="text-[8px] text-rose-400 mt-0.5">
                  {resting_heart_rate < 60 ? "アスリート域" : resting_heart_rate < 70 ? "良好" : resting_heart_rate < 80 ? "標準" : "やや高め"}
                </p>
              </div>
            )}
            {sleep_hours && (
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                <p className="text-[8px] text-slate-400">睡眠</p>
                <p className="text-base font-black tabular-nums leading-none text-indigo-500">
                  {sleep_hours}
                  <span className="text-[8px] font-normal text-slate-400 ml-0.5">h</span>
                </p>
                <p className="text-[8px] text-indigo-400 mt-0.5">
                  {sleep_hours >= 7 ? "十分" : sleep_hours >= 6 ? "やや不足" : "不足"}
                </p>
              </div>
            )}
            {condition_score && (
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                <p className="text-[8px] text-slate-400">コンディション</p>
                <p className="text-base font-black tabular-nums leading-none text-violet-500">
                  {condition_score}
                  <span className="text-[8px] font-normal text-slate-400 ml-0.5">/ 10</span>
                </p>
                {/* ドット表示 */}
                <div className="flex gap-0.5 mt-1">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: i < condition_score ? "#7c3aed" : "#e2e8f0" }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ 内臓脂肪レベル ══ */}
      {visceral_fat_level != null && (
        <div>
          <SectionTitle>内臓脂肪レベル</SectionTitle>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-black tabular-nums" style={{ color: visInfo.color }}>
              {visceral_fat_level}
            </p>
            <div className="flex-1">
              <div className="flex justify-between text-[8px] text-slate-300 mb-0.5">
                <span>標準</span><span>やや高</span><span>高い</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden flex">
                <div className="flex-1 bg-green-200 rounded-l-full" />
                <div className="w-8 bg-yellow-200" />
                <div className="w-8 bg-red-200 rounded-r-full" />
              </div>
              {/* インジケーター */}
              <div className="relative h-2 mt-0.5">
                <div
                  className="absolute w-1 h-2 rounded-full transition-all"
                  style={{
                    left: `${Math.min(95, (visceral_fat_level / 20) * 100)}%`,
                    background: visInfo.color,
                  }}
                />
              </div>
            </div>
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${visInfo.color}18`, color: visInfo.color }}
            >
              {visInfo.label}
            </span>
          </div>
        </div>
      )}

      {/* ══ 目標対比 ══ */}
      {(target_weight_kg || target_body_fat_pct) && (
        <div>
          <SectionTitle>目標達成度</SectionTitle>
          <div className="space-y-2">
            {target_weight_kg && weight_kg && (
              <div>
                <div className="flex justify-between text-[9px] mb-0.5">
                  <span className="text-slate-400">体重</span>
                  <span className="font-semibold text-slate-600">
                    {weight_kg}kg → 目標 {target_weight_kg}kg
                    <span className="ml-1 font-black" style={{ color: weight_kg > target_weight_kg ? "#ef4444" : "#22c55e" }}>
                      ({weight_kg > target_weight_kg ? "-" : "+"}{Math.abs(+(weight_kg - target_weight_kg).toFixed(1))}kg)
                    </span>
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(5, 100 - Math.abs(weight_kg - target_weight_kg) / weight_kg * 500))}%`,
                      background: "#22c55e",
                    }}
                  />
                </div>
              </div>
            )}
            {target_body_fat_pct && body_fat_pct && (
              <div>
                <div className="flex justify-between text-[9px] mb-0.5">
                  <span className="text-slate-400">体脂肪率</span>
                  <span className="font-semibold text-slate-600">
                    {body_fat_pct}% → 目標 {target_body_fat_pct}%
                    <span className="ml-1 font-black" style={{ color: body_fat_pct > target_body_fat_pct ? "#ef4444" : "#22c55e" }}>
                      ({body_fat_pct > target_body_fat_pct ? "-" : "+"}{Math.abs(+(body_fat_pct - target_body_fat_pct).toFixed(1))}%)
                    </span>
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(5, 100 - Math.abs(body_fat_pct - target_body_fat_pct) * 8))}%`,
                      background: fc,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
