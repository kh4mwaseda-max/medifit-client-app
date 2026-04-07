"use client";

import { useState } from "react";
import BodyRecordForm from "./BodyRecordForm";
import TrainingForm from "./TrainingForm";
import AssessmentManager from "./AssessmentManager";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

const TABS = ["身体記録", "トレーニング", "アセスメント"] as const;

interface Props {
  client: any;
  bodyRecords: any[];
  trainingSessions: any[];
  assessments: any[];
}

export default function TrainerClientTabs({ client, bodyRecords, trainingSessions, assessments }: Props) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("身体記録");

  return (
    <div>
      <nav className="flex border-b border-gray-800 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm transition-colors ${
              activeTab === tab
                ? "text-green-400 border-b-2 border-green-400 font-medium"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === "身体記録" && (
        <div className="space-y-6">
          <BodyRecordForm clientId={client.id} />
          <RecentBodyRecords records={bodyRecords} />
        </div>
      )}

      {activeTab === "トレーニング" && (
        <div className="space-y-6">
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
  if (records.length === 0) return <p className="text-sm text-gray-500 text-center py-4">記録がありません</p>;

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">直近の記録</p>
      {records.slice(0, 5).map((r) => (
        <div key={r.id} className="bg-gray-900 rounded-xl p-3 border border-gray-800 flex justify-between items-center">
          <p className="text-sm text-gray-400">{format(parseISO(r.recorded_at), "M月d日", { locale: ja })}</p>
          <div className="flex gap-4 text-sm">
            {r.weight_kg && <span className="text-white">{r.weight_kg}<span className="text-gray-500 text-xs">kg</span></span>}
            {r.body_fat_pct && <span className="text-white">{r.body_fat_pct}<span className="text-gray-500 text-xs">%</span></span>}
            {r.condition_score && <span className="text-white">{r.condition_score}<span className="text-gray-500 text-xs">/10</span></span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentSessions({ sessions }: { sessions: any[] }) {
  if (sessions.length === 0) return <p className="text-sm text-gray-500 text-center py-4">セッションがありません</p>;

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">直近のセッション</p>
      {sessions.slice(0, 5).map((s) => (
        <div key={s.id} className="bg-gray-900 rounded-xl p-3 border border-gray-800">
          <div className="flex justify-between">
            <p className="text-sm text-gray-400">{format(parseISO(s.session_date), "M月d日", { locale: ja })}</p>
            <p className="text-xs text-gray-500">{s.training_sets?.length ?? 0} セット</p>
          </div>
          {s.notes && <p className="text-xs text-gray-600 mt-1">{s.notes}</p>}
        </div>
      ))}
    </div>
  );
}
