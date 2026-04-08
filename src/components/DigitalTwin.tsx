"use client";

import { useMemo } from "react";

interface Props {
  weight_kg: number | null;
  body_fat_pct: number | null;
  muscle_mass_kg: number | null;
  target_body_fat_pct?: number | null;
  target_weight_kg?: number | null;
  lastTrainedMuscles?: string[]; // ["胸", "肩", "腕"] など
  condition_score?: number | null;
}

// 筋肉グループ → SVGパス対応
const MUSCLE_GROUPS: Record<string, { id: string; label: string }> = {
  胸:   { id: "chest",     label: "胸" },
  背中: { id: "back",      label: "背中" },
  肩:   { id: "shoulder",  label: "肩" },
  腕:   { id: "arm",       label: "腕" },
  脚:   { id: "legs",      label: "脚" },
  腹:   { id: "core",      label: "腹" },
  有酸素: { id: "cardio",  label: "有酸素" },
};

function getBodyFatColor(pct: number | null): { fill: string; glow: string; label: string } {
  if (pct == null) return { fill: "#94a3b8", glow: "#94a3b8", label: "未計測" };
  if (pct < 10)   return { fill: "#f97316", glow: "#fb923c", label: "アスリート" };
  if (pct < 15)   return { fill: "#22d3ee", glow: "#67e8f9", label: "フィット" };
  if (pct < 20)   return { fill: "#34d399", glow: "#6ee7b7", label: "標準" };
  if (pct < 25)   return { fill: "#a3e635", glow: "#bef264", label: "やや高め" };
  if (pct < 30)   return { fill: "#facc15", glow: "#fde047", label: "高め" };
  return           { fill: "#f87171", glow: "#fca5a5", label: "要改善" };
}

export default function DigitalTwin({
  weight_kg, body_fat_pct, muscle_mass_kg,
  target_body_fat_pct, target_weight_kg,
  lastTrainedMuscles = [],
  condition_score,
}: Props) {
  const { fill, glow, label } = getBodyFatColor(body_fat_pct);

  // 筋肉量 → シルエットの"太さ"スケール (0.9〜1.08)
  const muscleScale = useMemo(() => {
    if (!muscle_mass_kg) return 1.0;
    if (muscle_mass_kg < 40) return 0.92;
    if (muscle_mass_kg < 50) return 0.96;
    if (muscle_mass_kg < 60) return 1.0;
    if (muscle_mass_kg < 70) return 1.04;
    return 1.07;
  }, [muscle_mass_kg]);

  // 直近トレーニング部位ハイライト
  const trained = new Set(
    lastTrainedMuscles.flatMap((m) => {
      const g = MUSCLE_GROUPS[m];
      return g ? [g.id] : [];
    })
  );

  const highlightColor = "#60a5fa"; // blue-400
  const highlightGlow  = "#93c5fd";

  const pulseMs = condition_score != null
    ? Math.round(1400 - condition_score * 60)  // コンディション高い → 速い脈
    : 1200;

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* ボディステータスラベル */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-[10px] font-bold px-2.5 py-1 rounded-full"
          style={{ background: `${fill}22`, color: fill, border: `1px solid ${fill}55` }}
        >
          {label}
        </span>
        {body_fat_pct != null && (
          <span className="text-[10px] text-slate-400">体脂肪 {body_fat_pct}%</span>
        )}
      </div>

      {/* SVGボディ */}
      <div className="relative" style={{ width: 180, height: 380 }}>
        {/* グロー背景 */}
        <div
          className="absolute inset-0 rounded-full opacity-20 blur-2xl transition-all duration-1000"
          style={{ background: glow, transform: "scale(0.6) translateY(10%)" }}
        />

        <svg
          viewBox="0 0 100 210"
          width={180}
          height={380}
          style={{ transform: `scaleX(${muscleScale})`, transformOrigin: "center" }}
        >
          <defs>
            {/* メイングラデーション */}
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={fill} stopOpacity="0.9" />
              <stop offset="100%" stopColor={fill} stopOpacity="0.5" />
            </linearGradient>

            {/* ハイライトグラデーション */}
            <linearGradient id="hlGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={highlightColor} stopOpacity="0.95" />
              <stop offset="100%" stopColor={highlightGlow} stopOpacity="0.7" />
            </linearGradient>

            {/* グロー filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glowStrong">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* ── 頭 ── */}
          <ellipse cx="50" cy="12" rx="9" ry="11" fill="url(#bodyGrad)" filter="url(#glow)" opacity="0.85" />

          {/* ── 首 ── */}
          <rect x="46" y="21" width="8" height="7" rx="2" fill="url(#bodyGrad)" opacity="0.8" />

          {/* ── 肩 ── */}
          <ellipse
            id="shoulder-left"
            cx="28" cy="33" rx="10" ry="7"
            fill={trained.has("shoulder") ? "url(#hlGrad)" : "url(#bodyGrad)"}
            filter={trained.has("shoulder") ? "url(#glowStrong)" : "url(#glow)"}
            opacity="0.9"
          />
          <ellipse
            id="shoulder-right"
            cx="72" cy="33" rx="10" ry="7"
            fill={trained.has("shoulder") ? "url(#hlGrad)" : "url(#bodyGrad)"}
            filter={trained.has("shoulder") ? "url(#glowStrong)" : "url(#glow)"}
            opacity="0.9"
          />

          {/* ── 胸 ── */}
          <path
            id="chest"
            d="M36 28 Q50 22 64 28 L66 48 Q50 54 34 48 Z"
            fill={trained.has("chest") ? "url(#hlGrad)" : "url(#bodyGrad)"}
            filter={trained.has("chest") ? "url(#glowStrong)" : "url(#glow)"}
            opacity="0.88"
          />

          {/* ── 腹 ── */}
          <path
            id="core"
            d="M37 48 Q50 44 63 48 L62 78 Q50 82 38 78 Z"
            fill={trained.has("core") ? "url(#hlGrad)" : "url(#bodyGrad)"}
            filter={trained.has("core") ? "url(#glowStrong)" : "url(#glow)"}
            opacity="0.82"
          />
          {/* 腹筋ライン */}
          <line x1="50" y1="48" x2="50" y2="78" stroke="white" strokeWidth="0.5" opacity="0.2" />
          <line x1="40" y1="56" x2="60" y2="56" stroke="white" strokeWidth="0.5" opacity="0.2" />
          <line x1="39" y1="65" x2="61" y2="65" stroke="white" strokeWidth="0.5" opacity="0.2" />

          {/* ── 腕（上腕） ── */}
          <ellipse
            id="arm-left-upper"
            cx="22" cy="48" rx="7" ry="14"
            fill={trained.has("arm") ? "url(#hlGrad)" : "url(#bodyGrad)"}
            filter={trained.has("arm") ? "url(#glowStrong)" : "url(#glow)"}
            opacity="0.85"
          />
          <ellipse
            id="arm-right-upper"
            cx="78" cy="48" rx="7" ry="14"
            fill={trained.has("arm") ? "url(#hlGrad)" : "url(#bodyGrad)"}
            filter={trained.has("arm") ? "url(#glowStrong)" : "url(#glow)"}
            opacity="0.85"
          />
          {/* 腕（前腕） */}
          <ellipse cx="18" cy="75" rx="5.5" ry="12" fill="url(#bodyGrad)" opacity="0.75" />
          <ellipse cx="82" cy="75" rx="5.5" ry="12" fill="url(#bodyGrad)" opacity="0.75" />
          {/* 手 */}
          <ellipse cx="17" cy="91" rx="5" ry="6" fill="url(#bodyGrad)" opacity="0.65" />
          <ellipse cx="83" cy="91" rx="5" ry="6" fill="url(#bodyGrad)" opacity="0.65" />

          {/* ── 腰・骨盤 ── */}
          <path
            d="M38 78 Q50 74 62 78 L64 92 Q50 96 36 92 Z"
            fill="url(#bodyGrad)"
            opacity="0.8"
          />

          {/* ── 脚（太もも） ── */}
          <ellipse
            id="legs-left-upper"
            cx="41" cy="112" rx="11" ry="22"
            fill={trained.has("legs") ? "url(#hlGrad)" : "url(#bodyGrad)"}
            filter={trained.has("legs") ? "url(#glowStrong)" : "url(#glow)"}
            opacity="0.85"
          />
          <ellipse
            id="legs-right-upper"
            cx="59" cy="112" rx="11" ry="22"
            fill={trained.has("legs") ? "url(#hlGrad)" : "url(#bodyGrad)"}
            filter={trained.has("legs") ? "url(#glowStrong)" : "url(#glow)"}
            opacity="0.85"
          />
          {/* 脚（ふくらはぎ） */}
          <ellipse cx="40" cy="148" rx="8.5" ry="18" fill="url(#bodyGrad)" opacity="0.78" />
          <ellipse cx="60" cy="148" rx="8.5" ry="18" fill="url(#bodyGrad)" opacity="0.78" />
          {/* 足首・足 */}
          <ellipse cx="39" cy="172" rx="6" ry="8" fill="url(#bodyGrad)" opacity="0.65" />
          <ellipse cx="61" cy="172" rx="6" ry="8" fill="url(#bodyGrad)" opacity="0.65" />
          <ellipse cx="37" cy="180" rx="9" ry="4" fill="url(#bodyGrad)" opacity="0.5" />
          <ellipse cx="63" cy="180" rx="9" ry="4" fill="url(#bodyGrad)" opacity="0.5" />

          {/* ── 心拍パルスライン ── */}
          <polyline
            points="20,100 26,100 28,94 30,106 33,96 35,100 42,100"
            fill="none"
            stroke="white"
            strokeWidth="1"
            opacity="0"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <animate attributeName="opacity" values="0;0.5;0" dur={`${pulseMs}ms`} repeatCount="indefinite" />
          </polyline>

          {/* ── 目標体脂肪アウトライン ── */}
          {target_body_fat_pct != null && body_fat_pct != null && Math.abs(target_body_fat_pct - body_fat_pct) > 1 && (
            <ellipse
              cx="50" cy="100" rx="35" ry="80"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="0.6"
              strokeDasharray="3 2"
              opacity="0.35"
            />
          )}
        </svg>

        {/* ── アノテーション：左側 ── */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-around pointer-events-none" style={{ width: 50 }}>
          {weight_kg != null && (
            <Annotation label="体重" value={`${weight_kg}kg`} align="left" y="30%" color={fill} />
          )}
          {muscle_mass_kg != null && (
            <Annotation label="筋肉量" value={`${muscle_mass_kg}kg`} align="left" y="55%" color={highlightColor} />
          )}
        </div>

        {/* ── アノテーション：右側 ── */}
        <div className="absolute right-0 top-0 h-full flex flex-col justify-around pointer-events-none" style={{ width: 50 }}>
          {body_fat_pct != null && (
            <Annotation label="体脂肪" value={`${body_fat_pct}%`} align="right" y="35%" color={fill} />
          )}
          {condition_score != null && (
            <Annotation label="コンディション" value={`${condition_score}/10`} align="right" y="60%" color="#a78bfa" />
          )}
        </div>
      </div>

      {/* ── 直近トレーニング部位バッジ ── */}
      {lastTrainedMuscles.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {lastTrainedMuscles.slice(0, 5).map((m) => (
            <span
              key={m}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${highlightColor}22`, color: highlightColor, border: `1px solid ${highlightColor}55` }}
            >
              {m}
            </span>
          ))}
          <span className="text-[9px] text-slate-400 self-center ml-0.5">最終トレーニング</span>
        </div>
      )}

      {/* ── 目標対比バー ── */}
      {target_weight_kg != null && weight_kg != null && (
        <div className="mt-3 w-full max-w-[160px]">
          <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
            <span>現在 {weight_kg}kg</span>
            <span>目標 {target_weight_kg}kg</span>
          </div>
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, Math.max(0, 100 - Math.abs(weight_kg - target_weight_kg) / weight_kg * 100 * 3))}%`,
                background: fill,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Annotation({ label, value, align, y, color }: {
  label: string; value: string; align: "left" | "right"; y: string; color: string;
}) {
  return (
    <div
      className="absolute flex flex-col"
      style={{
        top: y,
        [align]: 0,
        transform: "translateY(-50%)",
        alignItems: align === "left" ? "flex-start" : "flex-end",
      }}
    >
      <span className="text-[8px] text-slate-400 leading-none">{label}</span>
      <span className="text-[11px] font-black tabular-nums leading-tight" style={{ color }}>
        {value}
      </span>
      {/* コネクタライン */}
      <div
        className="h-px w-4 mt-0.5 opacity-40"
        style={{ background: color, marginLeft: align === "right" ? "auto" : 0 }}
      />
    </div>
  );
}
