"use client";

import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

const RISK_LABELS = { low: "低", medium: "中", high: "高" };
const RISK_COLORS = {
  low: "bg-green-900 text-green-300 border-green-800",
  medium: "bg-yellow-900 text-yellow-300 border-yellow-800",
  high: "bg-red-900 text-red-300 border-red-800",
};

export default function AssessmentCard({ assessment }: { assessment: any | null }) {
  if (!assessment) {
    return (
      <div className="text-center py-12 space-y-2">
        <p className="text-gray-400">アセスメントはまだ作成されていません</p>
        <p className="text-sm text-gray-600">トレーナーが生成後に表示されます</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-white">AIアセスメントレポート</h2>
        <p className="text-xs text-gray-500">
          {format(parseISO(assessment.generated_at), "M月d日", { locale: ja })}
        </p>
      </div>

      {/* 現状分析 */}
      <Section title="現状分析">
        <p className="text-sm text-gray-300 leading-relaxed">{assessment.current_summary}</p>
      </Section>

      {/* 将来予測 */}
      <Section title="1ヶ月後の予測">
        <p className="text-sm text-gray-300 leading-relaxed">{assessment.prediction_1m}</p>
      </Section>
      <Section title="3ヶ月後の予測">
        <p className="text-sm text-gray-300 leading-relaxed">{assessment.prediction_3m}</p>
      </Section>

      {/* リスク */}
      <Section title="健康リスク指標">
        <p className="text-xs text-gray-500 mb-3">
          ※医療診断ではありません。専門医への相談を推奨します。
        </p>
        <div className="grid grid-cols-2 gap-2">
          <RiskBadge label="生活習慣病リスク" level={assessment.risk_obesity} />
          <RiskBadge label="筋骨格系リスク" level={assessment.risk_musculoskeletal} />
          <RiskBadge label="栄養バランスリスク" level={assessment.risk_nutrition} />
          <RiskBadge label="睡眠・疲労リスク" level={assessment.risk_sleep} />
        </div>
      </Section>

      {/* アクションプラン */}
      <Section title="今週のアクションプラン">
        <p className="text-sm text-gray-300 leading-relaxed">{assessment.action_plan}</p>
      </Section>

      {assessment.trainer_notes && (
        <Section title="トレーナーからのメモ">
          <p className="text-sm text-gray-300 leading-relaxed">{assessment.trainer_notes}</p>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 space-y-2">
      <p className="text-xs text-green-400 font-medium">{title}</p>
      {children}
    </div>
  );
}

function RiskBadge({ label, level }: { label: string; level: "low" | "medium" | "high" }) {
  return (
    <div className={`rounded-xl p-3 border ${RISK_COLORS[level]}`}>
      <p className="text-xs mb-1 opacity-70">{label}</p>
      <p className="font-bold">{RISK_LABELS[level]}</p>
    </div>
  );
}
