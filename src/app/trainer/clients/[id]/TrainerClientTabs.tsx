"use client";

import { useState } from "react";
import BodyRecordForm from "./BodyRecordForm";
import TrainingForm from "./TrainingForm";
import AssessmentManager from "./AssessmentManager";
import GoalSetForm from "./GoalSetForm";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

const TABS = ["目標設定", "身体記録", "トレーニング", "アセスメント"] as const;

interface Props {
  client: any;
  bodyRecords: any[];
  trainingSessions: any[];
  assessments: any[];
  goals: any | null;
}

export default function TrainerClientTabs({ client, bodyRecords, trainingSessions, assessments, goals }: Props) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(
    client.onboarding_step === "intake_done" ? "目標設定" : "目標設定"
  );

  const intakeData = {
    height_cm: client.height_cm ?? null,
    birth_year: client.birth_year ?? null,
    gender: client.gender ?? null,
    health_concerns: client.health_concerns ?? null,
    latest_weight: bodyRecords[0]?.weight_kg ?? null,
    latest_body_fat: bodyRecords[0]?.body_fat_pct ?? null,
  };

  return (
    <div>
      {/* インテーク完了バナー */}
      {client.onboarding_step === "intake_done" && !goals?.sent_at && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-2">
          <span className="text-amber-500 text-lg">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-amber-700">初回データ入力完了 — 目標設定が必要です</p>
            <p className="text-xs text-amber-500">{client.name} さんがLINEでデータを入力しました。目標プランを設定してLINEで送ってください。</p>
          </div>
        </div>
      )}

      <nav className="flex border-b border-slate-200 mb-5">
        {TABS.map((tab) => {
          const hasBadge = tab === "目標設定" && client.onboarding_step === "intake_done" && !goals?.sent_at;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-3 text-xs font-medium transition-colors ${
                activeTab === tab
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab}
              {hasBadge && (
                <span className="absolute top-2 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </button>
          );
        })}
      </nav>

      {activeTab === "目標設定" && (
        <GoalSetForm
          clientId={client.id}
          clientName={client.name}
          lineUserId={client.line_user_id ?? null}
          existingGoals={goals}
          intakeData={intakeData}
        />
      )}

      {activeTab === "身体記録" && (
        <div className="space-y-5">
          <BodyRecordForm clientId={client.id} />
          <RecentBodyRecords records={bodyRecords} />
        </div>
      )}

      {activeTab === "トレーニング" && (
        <div className="space-y-5">
          <TrainingForm clientId={client.id} />
          <RecentSessions sessions={trainingSessions} />
        </div>
      )}

      {activeTab === "アセスメント" && (
        <AssessmentManager clientId={client.id} assessments={assessments} />
      )}
    </div>
  );
}

function RecentBodyRecords({ records }: { records: any[] }) {
  if (records.length === 0) return <p className="text-sm text-slate-400 text-center py-4">記録がありません</p>;
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400 font-medium">直近の記録</p>
      {records.slice(0, 7).map((r) => (
        <div key={r.id} className="bg-white rounded-xl p-3 border border-slate-200 flex justify-between items-center">
          <p className="text-xs text-slate-500">{format(parseISO(r.recorded_at), "M月d日(E)", { locale: ja })}</p>
          <div className="flex gap-4 text-sm">
            {r.weight_kg && (
              <span className="font-semibold text-slate-700">
                {r.weight_kg}<span className="text-xs text-slate-400 font-normal">kg</span>
              </span>
            )}
            {r.body_fat_pct && (
              <span className="font-semibold text-slate-700">
                {r.body_fat_pct}<span className="text-xs text-slate-400 font-normal">%</span>
              </span>
            )}
            {r.condition_score && (
              <span className="font-semibold text-slate-700">
                {r.condition_score}<span className="text-xs text-slate-400 font-normal">/10</span>
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentSessions({ sessions }: { sessions: any[] }) {
  if (sessions.length === 0) return <p className="text-sm text-slate-400 text-center py-4">セッションがありません</p>;
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400 font-medium">直近のセッション</p>
      {sessions.slice(0, 7).map((s) => (
        <div key={s.id} className="bg-white rounded-xl p-3 border border-slate-200">
          <div className="flex justify-between">
            <p className="text-xs text-slate-500">{format(parseISO(s.session_date), "M月d日(E)", { locale: ja })}</p>
            <p className="text-xs text-slate-400">{s.training_sets?.length ?? 0} セット</p>
          </div>
          {s.notes && <p className="text-xs text-slate-400 mt-1">{s.notes}</p>}
        </div>
      ))}
    </div>
  );
}
