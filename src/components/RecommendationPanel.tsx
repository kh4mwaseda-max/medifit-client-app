"use client";

import { useState } from "react";
import type {
  RecommendationResult,
  SupplementRecommendation,
  FoodRecommendation,
  HealthRisk,
  ImprovementAction,
} from "@/lib/recommendation-engine";

const RISK_STYLES = {
  low:    { bg: "bg-teal-50",  text: "text-teal-700",  border: "border-teal-100",  bar: "bg-teal-400",  badge: "bg-teal-100 text-teal-700"  },
  medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100", bar: "bg-amber-400", badge: "bg-amber-100 text-amber-700" },
  high:   { bg: "bg-rose-50",  text: "text-rose-700",  border: "border-rose-100",  bar: "bg-rose-400",  badge: "bg-rose-100 text-rose-600"   },
};

const PRIORITY_STYLES = {
  high:   "bg-rose-50 text-rose-600 border-rose-100",
  medium: "bg-amber-50 text-amber-600 border-amber-100",
  low:    "bg-slate-50 text-slate-500 border-slate-200",
};
const PRIORITY_LABELS = { high: "優先度 高", medium: "優先度 中", low: "優先度 低" };
const RISK_LABELS     = { low: "低", medium: "中", high: "高" };
const DIFFICULTY_LABELS = { easy: "取組みやすい", medium: "中程度", hard: "ハード" };
const DIFFICULTY_STYLES = {
  easy:   "text-teal-600 bg-teal-50 border-teal-100",
  medium: "text-amber-600 bg-amber-50 border-amber-100",
  hard:   "text-rose-600 bg-rose-50 border-rose-100",
};

const CATEGORY_TABS = ["リスク分析", "サプリ・食事", "改善アクション"] as const;

interface Props {
  recommendation: RecommendationResult | null;
  isLoading?: boolean;
}

export default function RecommendationPanel({ recommendation, isLoading }: Props) {
  const [activeTab, setActiveTab] = useState<(typeof CATEGORY_TABS)[number]>("リスク分析");

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">AIが分析中...</p>
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 text-center py-14 space-y-2">
        <p className="text-slate-400">提案データがまだありません</p>
        <p className="text-sm text-slate-300">トレーナーが生成後に表示されます</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 総合スコア */}
      <OverallScore score={recommendation.overall_score} summary={recommendation.summary} />

      {/* サブタブ */}
      <nav className="bg-white rounded-2xl border border-slate-200 shadow-sm flex overflow-hidden">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              activeTab === tab
                ? "bg-blue-600 text-white"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === "リスク分析" && <RiskTab risks={recommendation.risks} />}
      {activeTab === "サプリ・食事" && (
        <SupplementFoodTab supplements={recommendation.supplements} foods={recommendation.foods} />
      )}
      {activeTab === "改善アクション" && (
        <ActionTab actions={recommendation.actions} risks={recommendation.risks} />
      )}

      <p className="text-[11px] text-slate-400 text-center">
        ※医療診断ではありません。体調に応じて医師・専門家にご相談ください。
      </p>
    </div>
  );
}

// ── 総合スコア ────────────────────────────────────────────────
function OverallScore({ score, summary }: { score: number; summary: string }) {
  const color  = score >= 75 ? "text-teal-600"  : score >= 50 ? "text-amber-500" : "text-rose-500";
  const ring   = score >= 75 ? "border-teal-300" : score >= 50 ? "border-amber-300" : "border-rose-300";
  const barClr = score >= 75 ? "bg-teal-400"    : score >= 50 ? "bg-amber-400"    : "bg-rose-400";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex gap-5 items-center">
      <div className={`shrink-0 w-20 h-20 rounded-full border-4 ${ring} flex flex-col items-center justify-center`}>
        <span className={`text-2xl font-bold ${color}`}>{score}</span>
        <span className="text-[10px] text-slate-400">/ 100</span>
      </div>
      <div className="flex-1 space-y-2">
        <p className="text-xs text-blue-600 font-semibold">総合健康スコア</p>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full ${barClr} rounded-full`} style={{ width: `${score}%` }} />
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{summary}</p>
      </div>
    </div>
  );
}

// ── リスク分析タブ ────────────────────────────────────────────
function RiskTab({ risks }: { risks: HealthRisk[] }) {
  return (
    <div className="space-y-3">
      {risks.map((r, i) => {
        const s = RISK_STYLES[r.level];
        return (
          <div key={i} className={`bg-white rounded-2xl border ${s.border} shadow-sm p-4 space-y-3`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">{r.label}</p>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${s.badge}`}>
                リスク {RISK_LABELS[r.level]}
              </span>
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1.5">
                <span>健康度スコア</span>
                <span className={s.text}>{r.current_score} / 100</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${s.bar} rounded-full`} style={{ width: `${r.current_score}%` }} />
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{r.description}</p>
          </div>
        );
      })}
    </div>
  );
}

// ── サプリ・食事タブ ──────────────────────────────────────────
function SupplementFoodTab({
  supplements, foods,
}: { supplements: SupplementRecommendation[]; foods: FoodRecommendation[] }) {
  return (
    <div className="space-y-4">
      <SectionLabel title="推奨サプリメント" />
      <div className="space-y-2.5">
        {supplements.map((s, i) => (
          <div key={i} className={`bg-white rounded-2xl border shadow-sm p-4 space-y-2 ${PRIORITY_STYLES[s.priority].split(" ")[2]}`}>
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-sm text-slate-700">{s.name}</p>
              <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium shrink-0 ${PRIORITY_STYLES[s.priority]}`}>
                {PRIORITY_LABELS[s.priority]}
              </span>
            </div>
            <p className="text-xs text-slate-500">{s.reason}</p>
            <p className="text-[11px] text-slate-400">
              <span className="text-slate-300">摂取タイミング：</span>{s.timing}
            </p>
          </div>
        ))}
      </div>

      <SectionLabel title="推奨食品" />
      <div className="space-y-2.5">
        {foods.map((f, i) => (
          <div key={i} className={`bg-white rounded-2xl border shadow-sm p-4 space-y-2 ${PRIORITY_STYLES[f.priority].split(" ")[2]}`}>
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-sm text-slate-700">{f.food_name}</p>
              <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium shrink-0 ${PRIORITY_STYLES[f.priority]}`}>
                {PRIORITY_LABELS[f.priority]}
              </span>
            </div>
            <p className="text-xs text-slate-500">{f.reason}</p>
            <p className="text-[11px] text-slate-400">
              <span className="text-slate-300">目安量：</span>{f.target_amount}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 改善アクションタブ ────────────────────────────────────────
function ActionTab({ actions, risks }: { actions: ImprovementAction[]; risks: HealthRisk[] }) {
  const riskMap = Object.fromEntries(risks.map((r) => [r.category, r.label]));

  return (
    <div className="space-y-3">
      {actions.map((a, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-slate-700 leading-snug">{a.action}</p>
            <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium shrink-0 ${DIFFICULTY_STYLES[a.difficulty]}`}>
              {DIFFICULTY_LABELS[a.difficulty]}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            対象リスク：<span className="text-slate-500">{riskMap[a.risk_category] ?? a.risk_category}</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 text-center">
              <p className="text-[11px] text-slate-400 mb-1">リスク軽減効果</p>
              <p className="text-xl font-bold text-teal-600">{a.risk_reduction_pct}%</p>
              <p className="text-[10px] text-slate-400">軽減見込み</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
              <p className="text-[11px] text-slate-400 mb-1">効果が出るまで</p>
              <p className="text-xl font-bold text-blue-600">{a.timeline_weeks}週間</p>
              <p className="text-[10px] text-slate-400">目安</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">{a.timeline_description}</p>
        </div>
      ))}
    </div>
  );
}

function SectionLabel({ title }: { title: string }) {
  return <p className="text-xs text-blue-600 font-semibold px-1">{title}</p>;
}
