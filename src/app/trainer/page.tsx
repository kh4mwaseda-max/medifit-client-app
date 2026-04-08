export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import { formatDate } from "@/lib/utils";

const TRAINER_ID = process.env.TRAINER_ID!;

export default async function TrainerDashboard() {
  const supabase = createServerClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, goal, start_date")
    .eq("trainer_id", TRAINER_ID)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ヘッダー */}
      <header className="bg-white border-b border-slate-200 px-5 py-3.5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center shadow-md shadow-blue-100">
            <span className="text-white text-sm font-black leading-none">A</span>
          </div>
          <div>
            <p className="text-slate-800 font-bold text-sm leading-none">AllYourFit</p>
            <p className="text-[11px] text-slate-400 leading-none mt-0.5">トレーナー管理</p>
          </div>
        </div>
        <LogoutButton />
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-slate-700 font-semibold text-sm">クライアント一覧</h2>
          <Link
            href="/trainer/clients/new"
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-blue-100"
          >
            + 追加
          </Link>
        </div>

        {!clients || clients.length === 0 ? (
          <div className="text-center py-20 space-y-3 bg-white rounded-2xl border border-slate-200">
            <p className="text-3xl">👤</p>
            <p className="text-slate-400 text-sm">クライアントがまだいません</p>
            <Link href="/trainer/clients/new" className="text-blue-500 text-sm underline">
              最初のクライアントを追加する
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {clients.map((c) => (
              <Link
                key={c.id}
                href={`/trainer/clients/${c.id}`}
                className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 hover:border-blue-200 hover:shadow-md hover:shadow-blue-50 transition-all shadow-sm"
              >
                <div>
                  <p className="text-slate-800 font-medium text-sm">{c.name}</p>
                  {c.goal && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{c.goal}</p>}
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-[10px] text-slate-400">開始日</p>
                  <p className="text-xs text-slate-600 font-medium">{formatDate(c.start_date)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
