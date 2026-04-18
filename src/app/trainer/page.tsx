export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase";
import { getTrainerId } from "@/lib/trainer-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import InviteButton from "./InviteButton";
import { formatDate } from "@/lib/utils";
import Logo from "@/components/Logo";

export default async function TrainerDashboard() {
  const trainerId = await getTrainerId();
  if (!trainerId) redirect("/trainer/login");

  const supabase = createServerClient();

  const [clientsRes, trainerRes] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, goal, start_date, onboarding_step, line_user_id")
      .eq("trainer_id", trainerId)
      .order("created_at", { ascending: false }),
    supabase
      .from("trainers")
      .select("name, plan")
      .eq("id", trainerId)
      .single(),
  ]);

  const allClients = clientsRes.data ?? [];
  const trainer = trainerRes.data;

  // 最終活動日を並列取得（body_records + training_sessions の最新日）
  const clientIds = allClients.map((c) => c.id);
  let lastActivityMap: Record<string, string> = {};
  if (clientIds.length > 0) {
    const [bodyRes, trainingRes] = await Promise.all([
      supabase
        .from("body_records")
        .select("client_id, recorded_at")
        .in("client_id", clientIds)
        .order("recorded_at", { ascending: false }),
      supabase
        .from("training_sessions")
        .select("client_id, session_date")
        .in("client_id", clientIds)
        .order("session_date", { ascending: false }),
    ]);
    for (const row of bodyRes.data ?? []) {
      if (!lastActivityMap[row.client_id]) lastActivityMap[row.client_id] = row.recorded_at;
    }
    for (const row of trainingRes.data ?? []) {
      const d = row.session_date;
      const existing = lastActivityMap[row.client_id];
      if (!existing || d > existing) lastActivityMap[row.client_id] = d;
    }
  }

  // 最終活動からの経過日数
  const today_str = new Date().toISOString().split("T")[0];
  const daysSinceActivity = (clientId: string, startDate: string) => {
    const last = lastActivityMap[clientId] ?? startDate ?? today_str;
    const lastDate = last.slice(0, 10);
    return Math.floor((new Date(today_str).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
  };

  // 要対応（問診完了・プラン未送信）を上に、それ以外は最終活動日順
  const urgent = allClients.filter((c) => c.onboarding_step === "intake_done");
  const others = allClients
    .filter((c) => c.onboarding_step !== "intake_done")
    .sort((a, b) => {
      const da = lastActivityMap[a.id] ?? a.start_date ?? "";
      const db = lastActivityMap[b.id] ?? b.start_date ?? "";
      return db > da ? 1 : -1;
    });

  const isPro = trainer?.plan === "pro";
  const FREE_CLIENTS = 1; // 1名まで無料
  const paidClients = Math.max(0, allClients.length - FREE_CLIENTS);
  const canAddMore = true; // 上限なし（2名目から¥500/名/月）

  // 要対応クライアントしかいない場合は、招待/追加/料金/一覧を一旦隠して目標設定に集中させる
  const focusOnUrgent = urgent.length > 0 && others.length === 0;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ヘッダー */}
      <header className="bg-white border-b border-slate-200 px-5 py-3.5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Logo size="sm" />
          <div className="border-l border-slate-200 pl-2.5 ml-0.5">
            <p className="text-[11px] text-slate-400 leading-none">トレーナー管理</p>
            {trainer && (
              <p className="text-[10px] text-slate-600 font-semibold leading-none mt-0.5">
                {trainer.name}
                <span className={`ml-1.5 text-[8px] px-1.5 py-0.5 rounded-full font-bold ${isPro ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                  {isPro ? "Pro" : "Free"}
                </span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/trainer/settings" className="text-[11px] text-slate-400 hover:text-slate-600 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">設定</Link>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── クイックスタッツ ── */}
        {allClients.length > 0 && !focusOnUrgent && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center shadow-sm">
              <p className="text-2xl font-black text-slate-800 tabular-nums">{allClients.length}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">担当クライアント</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center shadow-sm">
              <p className="text-2xl font-black text-teal-600 tabular-nums">
                {others.filter(c => daysSinceActivity(c.id, c.start_date) <= 1).length}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">直近24h活動</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center shadow-sm">
              <p className="text-2xl font-black text-rose-400 tabular-nums">
                {others.filter(c => daysSinceActivity(c.id, c.start_date) >= 7).length}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">要フォロー</p>
            </div>
          </div>
        )}

        {/* ── 朝サマリー案内 ── */}
        {!focusOnUrgent && others.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 flex items-start gap-2.5">
            <span className="text-base">📬</span>
            <p className="text-[11px] text-blue-700 leading-relaxed">
              毎朝7時に前日のクライアント記録まとめがLINEに届きます。日中はこの画面から個別に確認できます。
            </p>
          </div>
        )}

        {/* ── 要対応バナー ── */}
        {urgent.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <p className="text-xs font-semibold text-amber-700">要対応 — 目標設定が必要です</p>
            </div>
            {urgent.map((c) => (
              <Link
                key={c.id}
                href={`/trainer/clients/${c.id}`}
                className="flex items-center justify-between bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 hover:border-amber-400 transition-all shadow-sm"
              >
                <div>
                  <p className="text-slate-800 font-semibold text-sm">{c.name}</p>
                  <p className="text-xs text-amber-600 mt-0.5">初回データ入力済み · 目標プランを設定してください</p>
                </div>
                <span className="text-amber-500 text-lg">→</span>
              </Link>
            ))}
          </div>
        )}

        {/* ── クライアント一覧ヘッダー ── */}
        {!focusOnUrgent && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-slate-700 font-semibold text-sm">クライアント一覧</h2>
            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {allClients.length}名
            </span>
            {paidClients > 0 && (
              <span className="text-[10px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                ¥{(paidClients * 500).toLocaleString()}/月
              </span>
            )}
          </div>
          {allClients.length > 0 && (
            <div className="flex items-center gap-2">
              <InviteButton />
              <Link
                href="/trainer/clients/new"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-blue-100"
              >
                + 追加
              </Link>
            </div>
          )}
        </div>
        )}

        {/* ── クライアントなし ── */}
        {focusOnUrgent ? null : allClients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <div className="text-center space-y-2">
              <p className="text-3xl">🎉</p>
              <p className="text-slate-700 font-bold text-sm">LINE連携完了！まずはクライアントを追加しましょう</p>
              <p className="text-xs text-slate-400">案内文をコピーして送るだけで簡単に始められます</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
              <p className="text-xs font-semibold text-slate-500">ここからの流れ</p>
              {[
                "「＋追加」でクライアントを登録",
                "案内文をコピーしてLINEやメールで送信",
                "クライアントがPINをLINEに送ると自動連携",
                "クライアントが基礎データを入力すると通知が届く",
                "アセスメント生成 → 目標設定 → LINEで送信して指導スタート！",
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-600">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-bold text-[10px] flex items-center justify-center flex-none mt-0.5">{i + 1}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <Link
              href="/trainer/clients/new"
              className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm transition-colors shadow-sm shadow-blue-100"
            >
              + 最初のクライアントを追加する
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {others.map((c) => {
              const days = daysSinceActivity(c.id, c.start_date);
              const activityStatus =
                days <= 1 ? { dot: "bg-teal-400", badge: null } :
                days <= 3 ? { dot: "bg-amber-400", badge: null } :
                days <= 7 ? { dot: "bg-orange-400", badge: { label: `${days}日間未記録`, cls: "bg-orange-50 text-orange-500 border-orange-200" } } :
                            { dot: "bg-rose-400",   badge: { label: `${days}日間未記録`, cls: "bg-rose-50 text-rose-500 border-rose-200" } };

              return (
              <Link
                key={c.id}
                href={`/trainer/clients/${c.id}`}
                className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 hover:border-blue-200 hover:shadow-md hover:shadow-blue-50 transition-all shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-none ${activityStatus.dot}`} />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-slate-800 font-medium text-sm">{c.name}</p>
                      {!c.line_user_id && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400 border border-slate-200">LINE未連携</span>
                      )}
                      {activityStatus.badge && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${activityStatus.badge.cls}`}>{activityStatus.badge.label}</span>
                      )}
                    </div>
                    {c.goal && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{c.goal}</p>}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4 space-y-0.5">
                  {lastActivityMap[c.id] ? (
                    <>
                      <p className="text-[10px] text-slate-400">最終更新</p>
                      <p className="text-xs text-slate-600 font-medium">{formatDate(lastActivityMap[c.id])}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-[10px] text-slate-400">開始日</p>
                      <p className="text-xs text-slate-600 font-medium">{formatDate(c.start_date)}</p>
                    </>
                  )}
                </div>
              </Link>
              );
            })}
          </div>
        )}

        {/* ── 料金案内 ── */}
        {!focusOnUrgent && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-600 mb-1.5">料金</p>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-slate-800">1名まで無料</span>
            <span className="text-xs text-slate-400">· 2名目から ¥500/名/月</span>
          </div>
          {paidClients > 0 && (
            <p className="text-xs text-blue-600 mt-1">現在 {paidClients}名分 ¥{(paidClients * 500).toLocaleString()}/月が発生します</p>
          )}
        </div>
        )}
      </main>
    </div>
  );
}
