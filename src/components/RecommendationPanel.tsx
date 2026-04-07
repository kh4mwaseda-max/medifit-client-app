"use client";

import { useState } from "react";
import type {
  RecommendationResult,
  SupplementRecommendation,
  FoodRecommendation,
  HealthRisk,
  ImprovementAction,
} from "@/lib/recommendation-engine";

const RISK_COLORS = {
  low: { bg: "bg-green-900/40", text: "text-green-300", border: "border-green-800", badge: "bg-green-800 text-green-200" },
  medium: { bg: "bg-yellow-900/40", text: "text-yellow-300", border: "border-yellow-800", badge: "bg-yellow-800 text-yellow-200" },
  high: { bg: "bg-red-900/40", text: "text-red-300", border: "border-red-800", badge: "bg-red-800 text-red-200" },
};

const PRIORITY_COLORS = {
  high: "bg-red-900/40 text-red-300 border-red-800",
  medium: "bg-yellow-900/40 text-yellow-300 border-yellow-800",
  low: "bg-gray-800 text-gray-400 border-gray-700",
};

const PRIORITY_LABELS = { high: "優先度 高", medium: "優先度 中", low: "優先度 低" };
const RISK_LABELS = { low: "低", medium: "中", high: "高" };
const DIFFICULTY_LABELS = { easy: "取組みやすい", medium: "中程度", hard: "ハード" };
const DIFFICULTY_COLORS = { easy: "text-green-400", medium: "text-yellow-400", hard: "text-red-400" };

const CATEGORY_TABS = ["サプリ・食事", "リスク分析", "改善アクション"] as const;

interface Props {
  recommendation: RecommendationResult | null;
  isLoading?: boolean;
}

export default function RecommendationPanel({ recommendation, isLoading }: Props) {
  const [activeTab, setActiveTab] = useState<(typeof CATEGORY_TABS)[number]>("リスク分析");

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">AIが分析中...</p>
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className="text-center py-12 space-y-2">
        <p className="text-gray-400">提案データがまだありません</p>
        <p className="text-sm text-gray-600">トレーナーが生成後に表示されます</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 総合スコア */}
      <OverallScore score={recommendation.overall_score} summary={recommendation.summary} />

      {/* サブタブ */}
      <nav className="flex border-b border-gray-800">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm whitespace-nowrap transition-colors ${
              activeTab === tab
                ? "text-green-400 border-b-2 border-green-400 font-medium"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === "サプリ・食事" && (
        <SupplementFoodTab
          supplements={recommendation.supplements}
          foods={recommendation.foods}
        />
      )}
      {activeTab === "リスク分析" && (
        <RiskTab risks={recommendation.risks} />
      )}
      {activeTab === "改善アクション" && (
        <ActionTab actions={recommendation.actions} risks={recommendation.risks} />
      )}

      <p className="text-xs text-gray-600 text-center">
        ※医療診断ではありません。体調に応じて医師・専門家にご相談ください。
      </p>
    </div>
  );
}

// ── 総合スコア ────────────────────────────────────────────────
function OverallScore({ score, summary }: { score: number; summary: string }) {
  const color =
    score >= 75 ? "text-green-400" : score >= 50 ? "text-yellow-400" : "text-red-400";
  const ring =
    score >= 75 ? "border-green-500" : score >= 50 ? "border-yellow-500" : "border-red-500";

  return (
    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 flex gap-5 items-center">
      <div
        className={`shrink-0 w-20 h-20 rounded-full border-4 ${ring} flex flex-col items-center justify-center`}
      >
        <span className={`text-2xl font-bold ${color}`}>{score}</span>
        <span className="text-xs text-gray-500">/ 100</span>
      </div>
      <div>
        <p className="text-xs text-green-400 font-medium mb-1">総合健康スコア</p>
        <p className="text-sm text-gray-300 leading-relaxed">{summary}</p>
      </div>
    </div>
  );
}

// ── サプリ・食事タブ ──────────────────────────────────────────
function SupplementFoodTab({
  supplements,
  foods,
}: {
  supplements: SupplementRecommendation[];
  foods: FoodRecommendation[];
}) {
  return (
    <div className="space-y-5">
      <Section title="推奨サプリメント">
        <div className="space-y-3">
          {supplements.map((s, i) => (
            <div
              key={i}
              className={`rounded-xl p-4 border ${PRIORITY_COLORS[s.priority]}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-medium text-sm text-white">{s.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 border ${PRIORITY_COLORS[s.priority]}`}>
                  {PRIORITY_LABELS[s.priority]}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-1">{s.reason}</p>
              <p className="text-xs text-gray-500">
                <span className="text-gray-600">摂取タイミング: </span>
                {s.timing}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="推奨食品">
        <div className="space-y-3">
          {foods.map((f, i) => (
            <div
              key={i}
              className={`rounded-xl p-4 border ${PRIORITY_COLORS[f.priority]}`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-medium text-sm text-white">{f.food_name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 border ${PRIORITY_COLORS[f.priority]}`}>
                  {PRIORITY_LABELS[f.priority]}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-1">{f.reason}</p>
              <p className="text-xs text-gray-500">
                <span className="text-gray-600">目安量: </span>
                {f.target_amount}
              </p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ── リスク分析タブ ────────────────────────────────────────────
function RiskTab({ risks }: { risks: HealthRisk[] }) {
  return (
    <div className="space-y-3">
      {risks.map((r, i) => {
        const c = RISK_COLORS[r.level];
        return (
          <div key={i} className={`rounded-2xl p-4 border ${c.bg} ${c.border}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-white">{r.label}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${c.badge}`}>
                リスク {RISK_LABELS[r.level]}
              </span>
            </div>
            {/* スコアバー */}
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>健康度スコア</span>
                <span className={c.text}>{r.current_score} / 100</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    r.level === "low" ? "bg-green-500" : r.level === "medium" ? "bg-yellow-500" : "bg-red-500"
                  }`}
                  style={{ width: `${r.current_score}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">{r.description}</p>
          </div>
        );
      })}
    </div>
  );
}

// ── 改善アクションタブ ────────────────────────────────────────
function ActionTab({
  actions,
  risks,
}: {
  actions: ImprovementAction[];
  risks: HealthRisk[];
}) {
  const riskMap = Object.fromEntries(risks.map((r) => [r.category, r.label]));

  return (
    <div className="space-y-3">
      {actions.map((a, i) => (
        <div key={i} className="bg-gray-900 rounded-2xl p-4 border border-gray-800 space-y-3">
          {/* ヘッダー */}
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-white leading-snug">{a.action}</p>
            <span className={`text-xs shrink-0 ${DIFFICULTY_COLORS[a.difficulty]}`}>
              {DIFFICULTY_LABELS[a.difficulty]}
            </span>
          </div>

          {/* 対象リスク */}
          <p className="text-xs text-gray-500">
            対象: <span className="text-gray-400">{riskMap[a.risk_category] ?? a.risk_category}</span>
          </p>

          {/* 効果・期間 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">リスク軽減効果</p>
              <p className="text-xl font-bold text-green-400">{a.risk_reduction_pct}%</p>
              <p className="text-xs text-gray-600">軽減見込み</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">効果が出るまで</p>
              <p className="text-xl font-bold text-white">{a.timeline_weeks}週間</p>
              <p className="text-xs text-gray-600">目安</p>
            </div>
          </div>

          {/* タイムライン詳細 */}
          <p className="text-xs text-gray-500 leading-relaxed">{a.timeline_description}</p>
        </div>
      ))}
    </div>
  );
}

// ── 共通セクション ────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-green-400 font-medium">{title}</p>
      {children}
    </div>
  );
}
