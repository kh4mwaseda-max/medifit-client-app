export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import { formatDate } from "@/lib/utils";
import Logo from "@/components/Logo";

export default async function TrainerDashboard() {
  const cookieStore = await cookies();
  const trainerId = cookieStore.get("trainer_id")?.value ?? process.env.TRAINER_ID!;
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

  // 要対応（問診完了・プラン未送信）を上に
  const urgent = allClients.filter((c) => c.onboarding_step === "intake_done");
  const others = allClients.filter((c) => c.onboarding_step !== "intake_done");

  const isPro = trainer?.plan === "pro";
  const clientLimit = isPro ? 10 : 1;
  const canAddMore = allClients.length < clientLimit;

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-slate-700 font-semibold text-sm">クライアント一覧</h2>
            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {allClients.length}/{clientLimit}名
            </span>
          </div>
          {canAddMore ? (
            <Link
              href="/trainer/clients/new"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-blue-100"
            >
              + 追加
            </Link>
          ) : (
            <Link
              href="/trainer/settings"
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              {isPro ? "上限達成" : "↑ Proへ"}
            </Link>
          )}
        </div>

        {/* ── クライアントなし ── */}
        {allClients.length === 0 ? (
          <div className="text-center py-20 space-y-3 bg-white rounded-2xl border border-slate-200">
            <p className="text-3xl">👤</p>
            <p className="text-slate-400 text-sm">クライアントがまだいません</p>
            <Link href="/trainer/clients/new" className="text-blue-500 text-sm underline">
              最初のクライアントを追加する
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {others.map((c) => (
              <Link
                key={c.id}
                href={`/trainer/clients/${c.id}`}
                className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 hover:border-blue-200 hover:shadow-md hover:shadow-blue-50 transition-all shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-none ${c.line_user_id ? "bg-teal-400" : "bg-slate-200"}`} />
                  <div>
                    <p className="text-slate-800 font-medium text-sm">{c.name}</p>
                    {c.goal && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{c.goal}</p>}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-[10px] text-slate-400">開始日</p>
                  <p className="text-xs text-slate-600 font-medium">{formatDate(c.start_date)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ── Freeプランアップセル ── */}
        {!isPro && (
          <Link
            href="/trainer/settings"
            className="block bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Proプランで複数クライアント管理</p>
                <p className="text-[11px] text-blue-200 mt-0.5">¥2,980/月 · 14日間無料 · いつでも解約可</p>
              </div>
              <span className="text-white text-lg">→</span>
            </div>
          </Link>
        )}
      </main>
    </div>
  );
}
