"use client";

import { useState } from "react";
import Link from "next/link";
import BodyRecordForm from "./BodyRecordForm";
import TrainingForm from "./TrainingForm";
import AssessmentManager from "./AssessmentManager";
import GoalSetForm from "./GoalSetForm";
import SessionManager from "./SessionManager";
import PhotoTab from "@/components/PhotoTab";
import type { Photo } from "@/components/PhotoComparison";
import { Button, Icon, Tabs, cn } from "@/components/cf/primitives";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const LINE_FRIEND_URL = process.env.NEXT_PUBLIC_LINE_FRIEND_URL ?? "https://lin.ee/YOUR_LINE_ID";

// ─── 内部メモ ───
function InternalMemoBox({ clientId, initialMemo }: { clientId: string; initialMemo: string | null }) {
  const [memo, setMemo] = useState(initialMemo ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    await fetch(`/api/trainer/clients/${clientId}/memo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ internal_memo: memo }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2.5">
      <div className="flex items-center gap-2">
        <span className="text-base">📝</span>
        <p className="text-xs font-bold text-amber-800">引き継ぎメモ（内部用）</p>
        <span className="text-[10px] text-amber-500 ml-auto">クライアントには非表示</span>
      </div>
      <textarea
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="セッション引き継ぎ・気になる点・次回確認事項など..."
        rows={3}
        className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2.5 text-sm text-ink-800 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-300/20 resize-none placeholder:text-ink-400"
      />
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-200 text-white font-bold py-2 rounded-xl text-xs transition"
      >
        {saved ? "保存しました ✅" : saving ? "保存中..." : "メモを保存"}
      </button>
    </div>
  );
}

// ─── LINEメッセージ送信 ───
function LineMessageBox({ clientId, lineUserId, clientName }: { clientId: string; lineUserId: string | null; clientName: string }) {
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!msg.trim()) return;
    setSending(true);
    setError(null);
    const res = await fetch(`/api/trainer/clients/${clientId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg }),
    });
    if (res.ok) {
      setSent(true);
      setMsg("");
      setTimeout(() => setSent(false), 3000);
    } else {
      const d = await res.json();
      setError(d.error ?? "送信に失敗しました");
    }
    setSending(false);
  };

  if (!lineUserId) return null;

  return (
    <div className="bg-white border border-ink-200/70 rounded-2xl p-4 space-y-3 shadow-card">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[#06C755]/10 text-[#06C755] flex items-center justify-center">
          <Icon name="message-circle" />
        </div>
        <p className="text-xs font-bold text-ink-800">{clientName} さんにLINEで送る</p>
        <span className="text-[10px] bg-[#06C755]/10 text-[#06C755] border border-[#06C755]/20 px-2 py-0.5 rounded-full ml-auto font-semibold">公式経由</span>
      </div>
      <textarea
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder="メッセージを入力..."
        rows={3}
        className="w-full bg-ink-50 border border-ink-200 rounded-xl px-3 py-2.5 text-sm text-ink-800 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 resize-none"
      />
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          <Icon name="alert-circle" className="text-red-600 mt-0.5" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}
      <Button
        variant="line"
        size="md"
        className="w-full"
        icon="message-circle"
        loading={sending}
        disabled={!msg.trim()}
        onClick={send}
      >
        {sent ? "送信しました" : sending ? "送信中..." : "LINEで送信"}
      </Button>
    </div>
  );
}

const TABS = ["目標設定", "身体記録", "トレーニング", "フォト", "予約", "アセスメント"] as const;

type Phase = 1 | 2 | 3 | 4;

function getPhase(client: any, goals: any | null): Phase {
  if (!client.line_user_id) return 1;
  if (goals?.sent_at) return 4;
  if (client.onboarding_step === "intake_done") return 3;
  return 2;
}

interface Props {
  client: any;
  bodyRecords: any[];
  trainingSessions: any[];
  assessments: any[];
  goals: any | null;
  clientUrl: string;
  bodyPhotos: Photo[];
}

const PHASE_STEPS = [
  { phase: 1, label: "LINE連携", icon: "📱" },
  { phase: 2, label: "問診", icon: "📋" },
  { phase: 3, label: "目標設定", icon: "🎯" },
  { phase: 4, label: "稼働中", icon: "✅" },
] as const;

function PhaseProgress({ phase }: { phase: Phase }) {
  return (
    <div className="bg-white border border-ink-200/70 rounded-2xl px-4 py-4 shadow-card">
      <div className="flex items-center">
        {PHASE_STEPS.map((step, i) => {
          const done = phase > step.phase;
          const active = phase === step.phase;
          return (
            <div key={step.phase} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-none">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition",
                  done && "bg-emerald-500 text-white shadow-[0_4px_12px_-4px_rgba(16,185,129,0.5)]",
                  active && "bg-brand-500 text-white shadow-[0_4px_12px_-4px_rgba(59,130,246,0.5)] ring-4 ring-brand-500/20",
                  !done && !active && "bg-ink-100 text-ink-400",
                )}>
                  {done ? <Icon name="check-circle" /> : step.icon}
                </div>
                <p className={cn(
                  "text-[10px] mt-1.5 font-semibold",
                  active ? "text-ink-800" : done ? "text-emerald-600" : "text-ink-400",
                )}>
                  {step.label}
                </p>
              </div>
              {i < PHASE_STEPS.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-2 -mt-5 transition",
                  done ? "bg-emerald-400" : "bg-ink-200",
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TrainerClientTabs({ client, bodyRecords, trainingSessions, assessments, goals, clientUrl, bodyPhotos }: Props) {
  const phase = getPhase(client, goals);
  // 初回（目標未送信）は「目標設定」、送信済みなら「身体記録」（=データダッシュボード）を初期表示
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(
    goals?.sent_at ? "身体記録" : "目標設定"
  );
  const [copied, setCopied] = useState(false);

  const shareText = `【Client Fit】${client.name} さん専用ダッシュボードのご案内

◆ ダッシュボードURL
${clientUrl}

◆ PIN（初回ログイン時に入力）
${client.pin}

◆ LINE公式を友達追加してください
${LINE_FRIEND_URL}
（友達追加後、PINをLINEに送ると連携完了です）

スクショを送るだけで食事・トレーニングが自動記録されます📊`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const intakeData = {
    height_cm: client.height_cm ?? null,
    birth_year: client.birth_year ?? null,
    gender: client.gender ?? null,
    health_concerns: client.health_concerns ?? null,
    activity_level: client.activity_level ?? null,
    latest_weight: bodyRecords[0]?.weight_kg ?? null,
    latest_body_fat: bodyRecords[0]?.body_fat_pct ?? null,
  };

  // ────────────────────────────────────────────
  // Phase 1: LINE未連携 — 招待案内のみ
  // ────────────────────────────────────────────
  if (phase === 1) {
    return (
      <div className="space-y-4">
        <PhaseProgress phase={phase} />
        {/* ガイド */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center flex-none">1</span>
            <p className="text-sm font-bold text-blue-700">招待情報を {client.name} さんに送ってください</p>
          </div>
          <p className="text-xs text-blue-500 leading-relaxed pl-1">
            下の案内文をコピーしてLINE・メール等でそのまま送信してください。<br />
            クライアントがPINをClient Fit公式LINEに送ると自動で連携されます。
          </p>
        </div>

        {/* 案内文コピー */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <p className="text-xs font-semibold text-slate-500">クライアントへの案内文（そのまま送るだけ）</p>
          <pre className="text-xs text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-xl p-4 leading-relaxed border border-slate-100 select-all">
            {shareText}
          </pre>
          <button
            type="button"
            onClick={handleCopy}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            {copied ? "✅ コピーしました！" : "📋 案内文をコピー"}
          </button>
        </div>

        {/* URL・PIN */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1.5">
          <p className="text-[10px] text-slate-400 font-medium">ダッシュボードURL</p>
          <p className="text-xs text-blue-600 break-all font-mono">{clientUrl}</p>
          <p className="text-[10px] text-slate-400 mt-2">
            PIN: <span className="font-mono font-black text-slate-600 tracking-widest text-base">{client.pin}</span>
          </p>
        </div>

        {/* LINE友達追加 */}
        <a
          href={LINE_FRIEND_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl text-sm transition-colors shadow-sm"
        >
          📱 Client Fit公式LINEを開く（転送用）
        </a>

        <p className="text-center text-[10px] text-slate-400 pb-4">
          クライアントがPINをLINEに送ると自動で連携・次のステップへ進みます
        </p>
      </div>
    );
  }

  // ────────────────────────────────────────────
  // Phase 2: LINE連携済・問診待ち
  // ────────────────────────────────────────────
  if (phase === 2) {
    return (
      <div className="space-y-4">
        <PhaseProgress phase={phase} />
        {/* 連携完了 */}
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-sm font-bold text-teal-700">STEP 1 完了 — LINE連携済み</p>
              <p className="text-xs text-teal-500 mt-0.5">{client.name} さんのLINEアカウントと連携されました</p>
            </div>
          </div>
        </div>

        {/* 次のステップ */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-full bg-slate-300 text-white font-black text-sm flex items-center justify-center flex-none">2</span>
            <p className="text-sm font-bold text-slate-600">問診・基礎データ入力待ち</p>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {client.name} さんがClient Fit公式LINEに基礎情報（身長・体重・目標など）を送信すると、<br />
            「アセスメント生成・目標設定」のステップに進めます。
          </p>
          <div className="bg-slate-50 rounded-xl px-4 py-3 text-xs text-slate-400 leading-relaxed">
            クライアントに「Client Fit公式LINEにメッセージを送って基礎情報を登録してください」と案内してください。
          </div>
        </div>

        {/* LINEメッセージ送信 */}
        <LineMessageBox clientId={client.id} lineUserId={client.line_user_id} clientName={client.name} />
      </div>
    );
  }

  // ────────────────────────────────────────────
  // Phase 3: 問診完了 — アセスメント＆目標設定
  // ────────────────────────────────────────────
  if (phase === 3) {
    return (
      <div className="space-y-5">
        <PhaseProgress phase={phase} />
        {/* バナー */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl px-5 py-4 flex items-start gap-3">
          <span className="text-2xl flex-none">🎯</span>
          <div>
            <p className="text-sm font-bold text-amber-700">基礎情報が届きました！目標設定をしましょう</p>
            <p className="text-xs text-amber-500 mt-0.5">
              {client.name} さんがLINEでデータを送信しました。<br />
              身体目標・栄養目標を設定してLINEで送ってください。
            </p>
          </div>
        </div>

        {/* 基礎データサマリー */}
        {(intakeData.height_cm || intakeData.birth_year || intakeData.gender || intakeData.health_concerns || intakeData.latest_weight) && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
            <p className="text-xs font-semibold text-slate-500 mb-1">届いた基礎データ</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              {intakeData.height_cm && (
                <div><span className="text-slate-400">身長</span> <span className="font-semibold text-slate-700 ml-1">{intakeData.height_cm} cm</span></div>
              )}
              {intakeData.latest_weight && (
                <div><span className="text-slate-400">体重</span> <span className="font-semibold text-slate-700 ml-1">{intakeData.latest_weight} kg</span></div>
              )}
              {intakeData.latest_body_fat && (
                <div><span className="text-slate-400">体脂肪率</span> <span className="font-semibold text-slate-700 ml-1">{intakeData.latest_body_fat} %</span></div>
              )}
              {intakeData.birth_year && (
                <div><span className="text-slate-400">生年</span> <span className="font-semibold text-slate-700 ml-1">{intakeData.birth_year} 年</span></div>
              )}
              {intakeData.gender && (
                <div>
                  <span className="text-slate-400">性別</span>
                  <span className="font-semibold text-slate-700 ml-1">
                    {intakeData.gender === "male" ? "男性" : intakeData.gender === "female" ? "女性" : intakeData.gender}
                  </span>
                </div>
              )}
            </div>
            {intakeData.health_concerns && (
              <div className="mt-2 bg-slate-50 rounded-xl px-3 py-2">
                <p className="text-[10px] text-slate-400">健康上の懸念・目標</p>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{intakeData.health_concerns}</p>
              </div>
            )}
          </div>
        )}

        {/* 目標設定フォーム（AIサジェスト含む） */}
        <GoalSetForm
          clientId={client.id}
          clientName={client.name}
          lineUserId={client.line_user_id ?? null}
          existingGoals={goals}
          intakeData={intakeData}
        />
      </div>
    );
  }

  // ────────────────────────────────────────────
  // Phase 4: 稼働中 — フルUI
  // ────────────────────────────────────────────
  return (
    <div>
      <PhaseProgress phase={phase} />
      <div className="mt-4" />
      {/* レポートリンク */}
      <Link
        href={`/trainer/clients/${client.id}/report`}
        className="flex items-center justify-between bg-white border border-ink-200/70 rounded-2xl px-4 py-3 shadow-card hover:border-brand-200 hover:shadow-pop transition-all group mb-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
            <Icon name="file-text" />
          </div>
          <span className="text-sm font-bold text-ink-800">週次・月次レポート</span>
        </div>
        <Icon name="chevron-right" className="text-ink-400 group-hover:text-brand-500 transition" />
      </Link>

      <div className="mb-5 overflow-x-auto">
        <Tabs
          tabs={TABS.map((t) => ({ value: t, label: t }))}
          value={activeTab}
          onChange={(v) => setActiveTab(v as (typeof TABS)[number])}
        />
      </div>

      {/* 引き継ぎメモ */}
      <div className="mb-3">
        <InternalMemoBox clientId={client.id} initialMemo={client.internal_memo ?? null} />
      </div>

      {/* LINEメッセージ */}
      <div className="mb-5">
        <LineMessageBox clientId={client.id} lineUserId={client.line_user_id ?? null} clientName={client.name} />
      </div>

      {activeTab === "目標設定" && (
        <GoalSetForm
          clientId={client.id}
          clientName={client.name}
          lineUserId={client.line_user_id ?? null}
          existingGoals={goals}
          intakeData={intakeData}
          onSent={() => setActiveTab("身体記録")}
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

      {activeTab === "フォト" && (
        <PhotoTab clientId={client.id} initialPhotos={bodyPhotos} />
      )}

      {activeTab === "予約" && (
        <SessionManager clientId={client.id} clientName={client.name} />
      )}

      {activeTab === "アセスメント" && (
        <AssessmentManager clientId={client.id} assessments={assessments} />
      )}
    </div>
  );
}

function RecentBodyRecords({ records }: { records: any[] }) {
  if (records.length === 0) return <p className="text-sm text-ink-400 text-center py-4">記録がありません</p>;

  const chartData = [...records].reverse().map((r) => ({
    date: format(parseISO(r.recorded_at), "M/d"),
    体重: r.weight_kg ? Number(r.weight_kg) : undefined,
    体脂肪率: r.body_fat_pct ? Number(r.body_fat_pct) : undefined,
  }));

  const hasWeight = records.some((r) => r.weight_kg);
  const hasBodyFat = records.some((r) => r.body_fat_pct);

  return (
    <div className="space-y-4">
      {chartData.length >= 2 && (
        <div className="bg-white rounded-2xl p-4 border border-ink-200/70 shadow-card">
          <p className="text-xs text-ink-700 font-bold mb-3">推移グラフ</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }} labelStyle={{ color: "#64748b", fontWeight: 600 }} />
              {hasWeight && hasBodyFat && <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />}
              {hasWeight && <Line type="monotone" dataKey="体重" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#3b82f6" }} connectNulls />}
              {hasBodyFat && <Line type="monotone" dataKey="体脂肪率" stroke="#f97316" strokeWidth={2} dot={{ r: 3, fill: "#f97316" }} connectNulls />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs text-ink-700 font-bold">直近の記録</p>
        {records.slice(0, 7).map((r) => (
          <div key={r.id} className="bg-white rounded-xl p-3 border border-ink-200/70 flex justify-between items-center shadow-card">
            <p className="text-xs text-ink-500 font-medium">{format(parseISO(r.recorded_at), "M月d日(E)", { locale: ja })}</p>
            <div className="flex gap-4 text-sm font-mono">
              {r.weight_kg && <span className="font-black text-ink-800">{r.weight_kg}<span className="text-xs text-ink-400 font-normal ml-0.5">kg</span></span>}
              {r.body_fat_pct && <span className="font-black text-ink-800">{r.body_fat_pct}<span className="text-xs text-ink-400 font-normal ml-0.5">%</span></span>}
              {r.condition_score && <span className="font-black text-ink-800">{r.condition_score}<span className="text-xs text-ink-400 font-normal ml-0.5">/10</span></span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentSessions({ sessions }: { sessions: any[] }) {
  if (sessions.length === 0) return <p className="text-sm text-ink-400 text-center py-4">セッションがありません</p>;
  return (
    <div className="space-y-2">
      <p className="text-xs text-ink-700 font-bold">直近のセッション</p>
      {sessions.slice(0, 7).map((s) => (
        <div key={s.id} className="bg-white rounded-xl p-3 border border-ink-200/70 shadow-card">
          <div className="flex justify-between">
            <p className="text-xs text-ink-500 font-medium">{format(parseISO(s.session_date), "M月d日(E)", { locale: ja })}</p>
            <p className="text-xs text-ink-700 font-semibold">{s.training_sets?.length ?? 0} セット</p>
          </div>
          {s.notes && <p className="text-xs text-ink-500 mt-1">{s.notes}</p>}
        </div>
      ))}
    </div>
  );
}
