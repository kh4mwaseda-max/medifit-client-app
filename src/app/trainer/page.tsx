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
    <div className="min-h-screen bg-[#0a0a0f]">

      {/* ヘッダー */}
      <header className="border-b border-white/5 px-5 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0f]/90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-900/40">
            <span className="text-black text-sm font-black leading-none">A</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">AllYourFit</p>
            <p className="text-[11px] text-gray-500 leading-none mt-0.5">トレーナー管理画面</p>
          </div>
        </div>
        <LogoutButton />
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold">クライアント</h2>
          <Link
            href="/trainer/clients/new"
            className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            + 追加
          </Link>
        </div>

        {!clients || clients.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <p className="text-3xl">👤</p>
            <p className="text-gray-400 text-sm">クライアントがまだいません</p>
            <Link href="/trainer/clients/new" className="text-emerald-400 text-sm underline">
              最初のクライアントを追加する
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {clients.map((c) => (
              <Link
                key={c.id}
                href={`/trainer/clients/${c.id}`}
                className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-2xl p-4 hover:border-emerald-900/60 hover:bg-white/5 transition-all"
              >
                <div>
                  <p className="text-white font-medium text-sm">{c.name}</p>
                  {c.goal && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{c.goal}</p>}
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-[10px] text-gray-600">開始日</p>
                  <p className="text-xs text-gray-400">{formatDate(c.start_date)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
