"use client";

import { useState, useEffect, useCallback } from "react";
import { format, parseISO, isPast, isFuture } from "date-fns";
import { ja } from "date-fns/locale";

interface Session {
  id: string;
  scheduled_at: string;
  duration_min: number;
  notes: string | null;
  status: "scheduled" | "completed" | "cancelled";
}

interface Props {
  clientId: string;
  clientName: string;
}

export default function SessionManager({ clientId, clientName }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ date: "", time: "10:00", duration: "60", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/trainer/sessions?client_id=${clientId}`);
    if (!res.ok) {
      const d = await res.json();
      if (d.error?.includes("relation") || d.error?.includes("does not exist")) {
        setTableError(true);
      } else {
        setError(d.error ?? "読み込みエラー");
      }
    } else {
      const d = await res.json();
      setSessions(d.sessions ?? []);
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.date || !form.time) return;
    setSubmitting(true);
    setError(null);
    const scheduled_at = new Date(`${form.date}T${form.time}:00`).toISOString();
    const res = await fetch("/api/trainer/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, scheduled_at, duration_min: Number(form.duration), notes: form.notes || null }),
    });
    if (res.ok) {
      setAdding(false);
      setForm({ date: "", time: "10:00", duration: "60", notes: "" });
      await load();
    } else {
      const d = await res.json();
      setError(d.error ?? "追加に失敗しました");
    }
    setSubmitting(false);
  };

  const updateStatus = async (id: string, status: Session["status"]) => {
    await fetch("/api/trainer/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setSessions((prev) => prev.map((s) => s.id === id ? { ...s, status } : s));
  };

  const remove = async (id: string) => {
    await fetch(`/api/trainer/sessions?id=${id}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  if (tableError) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-2">
        <p className="text-sm font-bold text-amber-700">⚠️ テーブル未作成</p>
        <p className="text-xs text-amber-600">
          Supabase SQL Editorで <code className="bg-amber-100 px-1 rounded">migration-20260413-scheduled-sessions.sql</code> を実行してください。
        </p>
      </div>
    );
  }

  const upcoming = sessions.filter((s) => s.status === "scheduled" && isFuture(parseISO(s.scheduled_at)));
  const past = sessions.filter((s) => s.status !== "scheduled" || isPast(parseISO(s.scheduled_at)));

  return (
    <div className="space-y-4">
      {/* 追加ボタン */}
      {!adding ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-2xl text-sm transition-colors"
        >
          ＋ セッションを予約する
        </button>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <p className="text-sm font-bold text-slate-700">📅 {clientName} さんの予約を追加</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">日付</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">時刻</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-500">所要時間（分）</label>
            <select
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            >
              {[30, 45, 60, 90, 120].map((m) => (
                <option key={m} value={m}>{m}分</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-500">メモ（任意）</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="例: 下半身メイン、体重測定あり"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {error && <p className="text-xs text-rose-500">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="flex-1 bg-slate-100 text-slate-500 font-semibold py-2.5 rounded-xl text-sm"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={submitting || !form.date}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              {submitting ? "追加中..." : "予約を追加"}
            </button>
          </div>
        </div>
      )}

      {/* 直近予約 */}
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {upcoming.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500">予定</p>
              {upcoming.map((s) => (
                <SessionCard key={s.id} session={s} onStatus={updateStatus} onDelete={remove} />
              ))}
            </div>
          )}

          {past.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-400">過去のセッション</p>
              {past.slice(0, 5).map((s) => (
                <SessionCard key={s.id} session={s} onStatus={updateStatus} onDelete={remove} past />
              ))}
            </div>
          )}

          {sessions.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">予約がありません</p>
          )}
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, onStatus, onDelete, past = false }: {
  session: Session;
  onStatus: (id: string, status: Session["status"]) => void;
  onDelete: (id: string) => void;
  past?: boolean;
}) {
  const dt = parseISO(session.scheduled_at);
  const statusColor = {
    scheduled: "text-blue-600 bg-blue-50 border-blue-200",
    completed: "text-teal-600 bg-teal-50 border-teal-200",
    cancelled: "text-slate-400 bg-slate-50 border-slate-200",
  }[session.status];
  const statusLabel = { scheduled: "予定", completed: "完了", cancelled: "キャンセル" }[session.status];

  return (
    <div className={`bg-white rounded-2xl p-4 border shadow-sm space-y-2 ${past ? "border-slate-100 opacity-70" : "border-slate-200"}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700">
            {format(dt, "M月d日(E) HH:mm", { locale: ja })}
          </p>
          <p className="text-xs text-slate-400">{session.duration_min}分</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
          {statusLabel}
        </span>
      </div>
      {session.notes && <p className="text-xs text-slate-500">{session.notes}</p>}
      {!past && session.status === "scheduled" && (
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => onStatus(session.id, "completed")}
            className="flex-1 text-xs bg-teal-50 text-teal-600 border border-teal-200 rounded-lg py-1.5 font-semibold hover:bg-teal-100 transition-colors"
          >
            完了にする
          </button>
          <button
            type="button"
            onClick={() => onDelete(session.id)}
            className="text-xs bg-slate-50 text-slate-400 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-rose-50 hover:text-rose-400 hover:border-rose-200 transition-colors"
          >
            削除
          </button>
        </div>
      )}
    </div>
  );
}
