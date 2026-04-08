"use client";

import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

const RISK_LABELS = { low: "低", medium: "中", high: "高" };

const RISK_STYLES = {
  low:    { bg: "bg-teal-50",   text: "text-teal-700",  border: "border-teal-100",  badge: "bg-teal-100 text-teal-700"  },
  medium: { bg: "bg-amber-50",  text: "text-amber-700", border: "border-amber-100", badge: "bg-amber-100 text-amber-700" },
  high:   { bg: "bg-rose-50",   text: "text-rose-700",  border: "border-rose-100",  badge: "bg-rose-100 text-rose-600"   },
};

export default function AssessmentCard({ assessment }: { assessment: any | null }) {
  if (!assessment) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm text-center py-14 space-y-2">
        <p className="text-slate-400">アセスメントはまだ作成されていません</p>
        <p className="text-sm text-slate-300">トレーナーが生成後に表示されます</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
          <span className="text-blue-500">✦</span> AIアセスメントレポート
        </h2>
        <p className="text-xs text-slate-400">
          {format(parseISO(assessment.generated_at), "M月d日", { locale: ja })}
        </p>
      </div>

      <Section title="現状分析">
        <p className="text-sm text-slate-600 leading-relaxed">{assessment.current_summary}</p>
      </Section>

      <div className="grid grid-cols-2 gap-3">
        <Section title="1ヶ月後の予測">
          <p className="text-sm text-slate-600 leading-relaxed">{assessment.prediction_1m}</p>
        </Section>
        <Section title="3ヶ月後の予測">
          <p className="text-sm text-slate-600 leading-relaxed">{assessment.prediction_3m}</p>
        </Section>
      </div>

      {/* リスク */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <p className="text-xs text-blue-600 font-semibold">健康リスク指標</p>
        <p className="text-[11px] text-slate-400">
          ※医療診断ではありません。専門医への相談を推奨します。
        </p>
        <div className="grid grid-cols-2 gap-2">
          <RiskBadge label="生活習慣病リスク" level={assessment.risk_obesity} />
          <RiskBadge label="筋骨格系リスク" level={assessment.risk_musculoskeletal} />
          <RiskBadge label="栄養バランス" level={assessment.risk_nutrition} />
          <RiskBadge label="睡眠・疲労" level={assessment.risk_sleep} />
        </div>
      </div>

      <Section title="今週のアクションプラン">
        <p className="text-sm text-slate-600 leading-relaxed">{assessment.action_plan}</p>
      </Section>

      {assessment.trainer_notes && (
        <Section title="トレーナーからのメモ">
          <p className="text-sm text-slate-600 leading-relaxed">{assessment.trainer_notes}</p>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2">
      <p className="text-xs text-blue-600 font-semibold">{title}</p>
      {children}
    </div>
  );
}

function RiskBadge({ label, level }: { label: string; level: "low" | "medium" | "high" }) {
  const s = RISK_STYLES[level];
  return (
    <div className={`rounded-xl p-3 border ${s.bg} ${s.border}`}>
      <p className="text-[11px] text-slate-400 mb-1">{label}</p>
      <p className={`font-bold text-sm ${s.text}`}>{RISK_LABELS[level]}</p>
    </div>
  );
}
