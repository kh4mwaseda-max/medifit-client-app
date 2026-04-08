"use client";

import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";

interface Props {
  // 最新値
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
  // 前回値
  prev_weight_kg?: number | null;
  prev_body_fat_pct?: number | null;
  prev_muscle_mass_kg?: number | null;
  // 初回値
  first_weight_kg?: number | null;
  first_body_fat_pct?: number | null;
  first_muscle_mass_kg?: number | null;
  // クライアント情報
  height_cm?: number | null;
  gender?: string | null;
  birth_year?: number | null;
  recorded_at?: string | null;
  // 目標
  target_weight_kg?: number | null;
  target_body_fat_pct?: number | null;
  // トレーニング
  lastTrainedMuscles?: string[];
}

// ── ヘルパー ─────────────────────────────────────────────────────────

const fmt = (v: number | null | undefined, dp = 1) =>
  v != null ? String(+v.toFixed(dp)) : "—";

function delta(curr: number | null | undefined, prev: number | null | undefined, dp = 1) {
  if (curr == null || prev == null) return null;
  return +(curr - prev).toFixed(dp);
}

/** 前回比/初回比セル */
function DeltaCell({ d, lowerIsBetter }: { d: number | null; lowerIsBetter?: boolean }) {
  if (d == null) {
    return <td className="py-2 px-2 text-center text-[10px] text-slate-300">—</td>;
  }
  if (d === 0) {
    return <td className="py-2 px-2 text-center text-[10px] text-slate-400">→ 0</td>;
  }
  const good = lowerIsBetter ? d < 0 : d > 0;
  return (
    <td className={`py-2 px-2 text-center text-[10px] font-bold tabular-nums ${good ? "text-blue-600" : "text-rose-500"}`}>
      {d < 0 ? "▼" : "▲"}{Math.abs(d)}
    </td>
  );
}

function bodyType(bmi: number | null, fat: number | null, gender: string | null) {
  if (!bmi || !fat) return { label: "—", cls: "bg-slate-100 text-slate-500" };
  const male = gender !== "女性" && gender !== "female";
  const highFat = male ? fat > 22 : fat > 30;
  const lowFat  = male ? fat < 10 : fat < 17;
  if (bmi < 18.5)             return { label: "やせ型",      cls: "bg-blue-50 text-blue-600" };
  if (lowFat && bmi >= 22)    return { label: "筋肉質",      cls: "bg-violet-50 text-violet-600" };
  if (highFat && bmi < 25)    return { label: "かくれ肥満",  cls: "bg-amber-50 text-amber-600" };
  if (highFat && bmi >= 25)   return { label: "肥満",        cls: "bg-rose-50 text-rose-500" };
  return                             { label: "スタンダード", cls: "bg-teal-50 text-teal-600" };
}

function fatRange(gender: string | null) {
  return gender === "女性" || gender === "female" ? "17.0–30.0%" : "10.0–22.0%";
}

function fatStatus(fat: number | null, gender: string | null) {
  if (!fat) return "";
  const male = gender !== "女性" && gender !== "female";
  if (male)  { if (fat < 10) return "低"; if (fat <= 17) return "標準"; if (fat <= 22) return "やや高"; return "高"; }
  else       { if (fat < 17) return "低"; if (fat <= 27) return "標準"; if (fat <= 32) return "やや高"; return "高"; }
}

// ── コンポーネント ──────────────────────────────────────────────────

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

  // 計算値
  const fatMass  = weight_kg && body_fat_pct ? +(weight_kg * body_fat_pct / 100).toFixed(1) : null;
  const leanMass = weight_kg && fatMass      ? +(weight_kg - fatMass).toFixed(1)             : null;
  const calcBMI  = bmi ?? (weight_kg && heightM ? +(weight_kg / (heightM * heightM)).toFixed(1) : null);
  const smi      = muscle_mass_kg && heightM   ? +(muscle_mass_kg / (heightM * heightM)).toFixed(2) : null;

  // Mifflin-St Jeor BMR
  const bmr = (() => {
    if (!weight_kg || !height_cm || !age) return null;
    const male = gender !== "女性" && gender !== "female";
    return Math.round(10 * weight_kg + 6.25 * height_cm - 5 * age + (male ? 5 : -161));
  })();

  const bt = bodyType(calcBMI, body_fat_pct, gender ?? null);

  // 前回比
  const dW  = delta(weight_kg,    prev_weight_kg);
  const dF  = delta(body_fat_pct, prev_body_fat_pct);
  const dM  = delta(muscle_mass_kg, prev_muscle_mass_kg);
  // 初回比
  const diW = delta(weight_kg,    first_weight_kg);
  const diF = delta(body_fat_pct, first_body_fat_pct);
  const diM = delta(muscle_mass_kg, first_muscle_mass_kg);

  // 標準体重レンジ
  const weightStd = heightM
    ? `${(heightM * heightM * 18.5).toFixed(1)}–${(heightM * heightM * 25).toFixed(1)}kg`
    : "—";

  // 体型判定 (gender check for BMI/fat)
  const male = gender !== "女性" && gender !== "female";
  const smiOk = smi ? smi >= (male ? 7.0 : 5.7) : null;

  // レーダーデータ
  const radarData = [
    { axis: "筋力",    score: smi ? Math.min(100, Math.round(smi / (male ? 10 : 7) * 100)) : muscle_mass_kg ? Math.min(100, Math.round(muscle_mass_kg / 60 * 100)) : 0 },
    { axis: "体組成",  score: body_fat_pct ? Math.max(0, Math.round(100 - (body_fat_pct - (male ? 10 : 17)) * 4)) : 0 },
    { axis: "コンディション", score: condition_score ? condition_score * 10 : 0 },
    { axis: "睡眠",    score: sleep_hours ? Math.min(100, Math.round(sleep_hours / 8 * 100)) : 0 },
    { axis: "バイタル", score: resting_heart_rate ? Math.max(0, Math.round(100 - (resting_heart_rate - 40) * 1.5)) : 60 },
  ];
  const overall = Math.round(radarData.reduce((s, d) => s + d.score, 0) / radarData.length);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

      {/* ══ ヘッダーバー ══ */}
      <div className="bg-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <p className="text-[11px] font-bold text-white tracking-widest uppercase">Body Analysis</p>
          {recorded_at && (
            <p className="text-[9px] text-slate-400">
              測定 {new Date(recorded_at).toLocaleDateString("ja-JP", { year: "2-digit", month: "2-digit", day: "2-digit" })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {height_cm && <span className="text-[9px] text-slate-400">身長 {height_cm}cm</span>}
          {age        && <span className="text-[9px] text-slate-400">{age}歳</span>}
          {gender     && <span className="text-[9px] text-slate-400">{gender}</span>}
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${bt.cls}`}>{bt.label}</span>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-5">

        {/* ══ 左: 比較テーブル ══ */}
        <div className="space-y-4">

          {/* メイン計測値テーブル */}
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-collapse min-w-[420px]">
              <thead>
                <tr>
                  <th className="py-1.5 px-2 text-left text-[9px] text-slate-400 font-semibold border-b-2 border-slate-100 w-20">指標</th>
                  <th className="py-1.5 px-2 text-center text-[9px] text-slate-700 font-bold border-b-2 border-slate-100">今回</th>
                  <th className="py-1.5 px-2 text-center text-[9px] text-slate-400 font-semibold border-b-2 border-slate-100">前回比</th>
                  <th className="py-1.5 px-2 text-center text-[9px] text-slate-400 font-semibold border-b-2 border-slate-100">初回比</th>
                  <th className="py-1.5 px-2 text-right text-[9px] text-slate-300 font-semibold border-b-2 border-slate-100">標準範囲</th>
                </tr>
              </thead>
              <tbody>

                {/* 体重 */}
                <tr className="border-b border-slate-50">
                  <td className="py-2 px-2 text-slate-600 font-semibold">体重</td>
                  <td className="py-2 px-2 text-center">
                    <span className="text-base font-black text-slate-800 tabular-nums">{fmt(weight_kg)}</span>
                    <span className="text-[9px] text-slate-400 ml-0.5">kg</span>
                  </td>
                  <DeltaCell d={dW} lowerIsBetter />
                  <DeltaCell d={diW} lowerIsBetter />
                  <td className="py-2 px-2 text-right text-[9px] text-slate-300">{weightStd}</td>
                </tr>

                {/* 体脂肪率 */}
                <tr className="border-b border-slate-50 bg-slate-50/40">
                  <td className="py-2 px-2 text-slate-600 font-semibold">体脂肪率</td>
                  <td className="py-2 px-2 text-center">
                    <span className="text-base font-black text-slate-800 tabular-nums">{fmt(body_fat_pct)}</span>
                    <span className="text-[9px] text-slate-400 ml-0.5">%</span>
                    {body_fat_pct && (
                      <span className="ml-1 text-[8px] text-slate-400">({fatStatus(body_fat_pct, gender ?? null)})</span>
                    )}
                  </td>
                  <DeltaCell d={dF} lowerIsBetter />
                  <DeltaCell d={diF} lowerIsBetter />
                  <td className="py-2 px-2 text-right text-[9px] text-slate-300">{fatRange(gender ?? null)}</td>
                </tr>

                {/* 脂肪量 */}
                <tr className="border-b border-slate-50">
                  <td className="py-2 px-2 text-slate-600 font-semibold">脂肪量</td>
                  <td className="py-2 px-2 text-center">
                    <span className="text-base font-black text-slate-800 tabular-nums">{fmt(fatMass)}</span>
                    <span className="text-[9px] text-slate-400 ml-0.5">kg</span>
                  </td>
                  <td className="py-2 px-2 text-center text-[9px] text-slate-300">—</td>
                  <td className="py-2 px-2 text-center text-[9px] text-slate-300">—</td>
                  <td className="py-2 px-2 text-right text-[9px] text-slate-300">—</td>
                </tr>

                {/* 筋肉量 */}
                <tr className="border-b border-slate-50 bg-slate-50/40">
                  <td className="py-2 px-2 text-slate-600 font-semibold">筋肉量</td>
                  <td className="py-2 px-2 text-center">
                    <span className="text-base font-black text-blue-700 tabular-nums">{fmt(muscle_mass_kg)}</span>
                    <span className="text-[9px] text-slate-400 ml-0.5">kg</span>
                  </td>
                  <DeltaCell d={dM} lowerIsBetter={false} />
                  <DeltaCell d={diM} lowerIsBetter={false} />
                  <td className="py-2 px-2 text-right text-[9px] text-slate-300">
                    SMI {male ? "≥7.0" : "≥5.7"}
                  </td>
                </tr>

                {/* 除脂肪体重 */}
                <tr className="border-b border-slate-50">
                  <td className="py-2 px-2 text-slate-600 font-semibold">除脂肪量</td>
                  <td className="py-2 px-2 text-center">
                    <span className="text-base font-black text-slate-800 tabular-nums">{fmt(leanMass)}</span>
                    <span className="text-[9px] text-slate-400 ml-0.5">kg</span>
                  </td>
                  <td className="py-2 px-2 text-center text-[9px] text-slate-300">—</td>
                  <td className="py-2 px-2 text-center text-[9px] text-slate-300">—</td>
                  <td className="py-2 px-2 text-right text-[9px] text-slate-300">—</td>
                </tr>

                {/* 骨量（データあれば） */}
                {bone_mass_kg != null && (
                  <tr className="bg-slate-50/40">
                    <td className="py-2 px-2 text-slate-600 font-semibold">骨量</td>
                    <td className="py-2 px-2 text-center">
                      <span className="text-base font-black text-amber-600 tabular-nums">{fmt(bone_mass_kg)}</span>
                      <span className="text-[9px] text-slate-400 ml-0.5">kg</span>
                    </td>
                    <td className="py-2 px-2 text-center text-[9px] text-slate-300">—</td>
                    <td className="py-2 px-2 text-center text-[9px] text-slate-300">—</td>
                    <td className="py-2 px-2 text-right text-[9px] text-slate-300">2.5–3.2kg</td>
                  </tr>
                )}

              </tbody>
            </table>
          </div>

          {/* ══ キー指標 4マス ══ */}
          <div className="grid grid-cols-4 gap-2">
            {/* BMI */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
              <p className="text-[8px] text-slate-400">BMI</p>
              <p className={`text-xl font-black tabular-nums leading-tight ${calcBMI && calcBMI < 25 ? "text-teal-600" : "text-amber-500"}`}>
                {fmt(calcBMI)}
              </p>
              <p className={`text-[8px] ${calcBMI && calcBMI < 25 ? "text-teal-500" : "text-amber-400"}`}>
                {calcBMI ? (calcBMI < 18.5 ? "低体重" : calcBMI < 25 ? "標準" : calcBMI < 30 ? "過体重" : "肥満") : "—"}
              </p>
            </div>
            {/* 基礎代謝 */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
              <p className="text-[8px] text-slate-400">基礎代謝</p>
              <p className="text-xl font-black tabular-nums text-blue-600 leading-tight">{bmr ?? "—"}</p>
              <p className="text-[8px] text-slate-400">kcal</p>
            </div>
            {/* 内臓脂肪 */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
              <p className="text-[8px] text-slate-400">内臓脂肪</p>
              <p className={`text-xl font-black tabular-nums leading-tight ${
                visceral_fat_level == null ? "text-slate-300"
                : visceral_fat_level <= 9 ? "text-teal-600"
                : visceral_fat_level <= 14 ? "text-amber-500" : "text-rose-500"
              }`}>
                {visceral_fat_level ?? "—"}
              </p>
              <p className={`text-[8px] ${visceral_fat_level == null ? "text-slate-300" : visceral_fat_level <= 9 ? "text-teal-500" : "text-amber-400"}`}>
                {visceral_fat_level ? (visceral_fat_level <= 9 ? "標準" : visceral_fat_level <= 14 ? "やや高" : "高い") : "—"}
              </p>
            </div>
            {/* SMI */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
              <p className="text-[8px] text-slate-400">SMI</p>
              <p className={`text-xl font-black tabular-nums leading-tight ${smiOk === null ? "text-slate-300" : smiOk ? "text-blue-600" : "text-rose-400"}`}>
                {smi ?? "—"}
              </p>
              <p className={`text-[8px] ${smiOk === null ? "text-slate-300" : smiOk ? "text-blue-500" : "text-rose-400"}`}>
                {smiOk === null ? "—" : smiOk ? "標準以上" : "低い"}
              </p>
            </div>
          </div>

          {/* ══ 内臓脂肪レベルスケール ══ */}
          {visceral_fat_level != null && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[9px] text-slate-400 font-semibold">内臓脂肪レベル</p>
                <p className="text-[9px] font-black text-slate-700 tabular-nums">{visceral_fat_level} / 15</p>
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: 15 }).map((_, i) => {
                  const lv = i + 1;
                  const active = lv <= visceral_fat_level;
                  const color = lv <= 9 ? "#22c55e" : lv <= 14 ? "#f59e0b" : "#ef4444";
                  return (
                    <div
                      key={i}
                      className="flex-1 h-3 rounded-sm transition-all"
                      style={{ background: active ? color : "#e2e8f0" }}
                    />
                  );
                })}
              </div>
              <div className="flex text-[8px] text-slate-300 mt-0.5 px-0.5">
                <span className="flex-[9]">標準 (1–9)</span>
                <span className="flex-[5] text-center">やや高 (10–14)</span>
                <span className="flex-[1] text-right">高</span>
              </div>
            </div>
          )}

          {/* ══ バイタルサイン ══ */}
          {(systolic_bp || resting_heart_rate || sleep_hours || condition_score) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {systolic_bp && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                  <p className="text-[8px] text-slate-400">血圧</p>
                  <p className="text-sm font-black tabular-nums text-rose-500 leading-tight">
                    {systolic_bp}
                    <span className="text-[9px] font-semibold text-slate-400">/{diastolic_bp ?? "—"}</span>
                  </p>
                  <p className="text-[8px] text-slate-400">mmHg</p>
                </div>
              )}
              {resting_heart_rate && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                  <p className="text-[8px] text-slate-400">安静時心拍</p>
                  <p className="text-sm font-black tabular-nums text-rose-400 leading-tight">{resting_heart_rate}</p>
                  <p className="text-[8px] text-slate-400">bpm · {resting_heart_rate < 60 ? "アスリート" : resting_heart_rate < 70 ? "良好" : "標準"}</p>
                </div>
              )}
              {sleep_hours && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                  <p className="text-[8px] text-slate-400">睡眠時間</p>
                  <p className="text-sm font-black tabular-nums text-indigo-500 leading-tight">{sleep_hours}</p>
                  <p className="text-[8px] text-slate-400">h · {sleep_hours >= 7 ? "十分" : sleep_hours >= 6 ? "やや不足" : "不足"}</p>
                </div>
              )}
              {condition_score && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                  <p className="text-[8px] text-slate-400">コンディション</p>
                  <p className="text-sm font-black tabular-nums text-violet-500 leading-tight">
                    {condition_score}<span className="text-[8px] font-normal text-slate-400">/10</span>
                  </p>
                  <div className="flex gap-0.5 justify-center mt-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="w-1 h-1 rounded-full" style={{ background: i < condition_score ? "#7c3aed" : "#e2e8f0" }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══ 右: スコア + レーダー ══ */}
        <div className="flex flex-col gap-4 items-center">

          {/* 総合スコア */}
          <div className="text-center w-full border border-slate-100 rounded-2xl p-3 bg-slate-50">
            <p className="text-[9px] text-slate-400 uppercase tracking-widest">Overall Score</p>
            <p className="text-6xl font-black tabular-nums text-blue-600 leading-none mt-1">{overall}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">/ 100</p>
          </div>

          {/* レーダーチャート */}
          <div className="w-full">
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={65}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: 600 }} />
                <Radar dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.18} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* 各軸スコアバー */}
          <div className="w-full space-y-2">
            {radarData.map((d) => (
              <div key={d.axis}>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[9px] text-slate-500">{d.axis}</span>
                  <span className="text-[10px] font-bold text-slate-600 tabular-nums">{d.score}</span>
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

          {/* 目標対比 */}
          {(target_weight_kg || target_body_fat_pct) && (
            <div className="w-full border-t border-slate-100 pt-3 space-y-2">
              <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">目標対比</p>
              {target_weight_kg && weight_kg && (() => {
                const gap = +(weight_kg - target_weight_kg).toFixed(1);
                const pct = Math.min(100, Math.max(5, 100 - Math.abs(gap) / weight_kg * 300));
                return (
                  <div>
                    <div className="flex justify-between text-[9px] mb-0.5">
                      <span className="text-slate-400">体重</span>
                      <span className={`font-semibold ${gap > 0 ? "text-rose-500" : "text-teal-600"}`}>
                        {gap > 0 ? "残り " : "達成! "}
                        {Math.abs(gap)}kg
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })()}
              {target_body_fat_pct && body_fat_pct && (() => {
                const gap = +(body_fat_pct - target_body_fat_pct).toFixed(1);
                const pct = Math.min(100, Math.max(5, 100 - Math.abs(gap) * 8));
                return (
                  <div>
                    <div className="flex justify-between text-[9px] mb-0.5">
                      <span className="text-slate-400">体脂肪率</span>
                      <span className={`font-semibold ${gap > 0 ? "text-rose-500" : "text-teal-600"}`}>
                        {gap > 0 ? "残り " : "達成! "}
                        {Math.abs(gap)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
