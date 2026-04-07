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
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">medifit</h1>
          <p className="text-sm text-gray-400">トレーナー管理画面</p>
        </div>
        <LogoutButton />
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold">クライアント一覧</h2>
          <Link
            href="/trainer/clients/new"
            className="bg-green-500 hover:bg-green-400 text-black text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            + 新規追加
          </Link>
        </div>

        {!clients || clients.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-gray-400">クライアントがまだいません</p>
            <Link href="/trainer/clients/new" className="text-green-400 text-sm underline">
              最初のクライアントを追加する
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {clients.map((c) => (
              <Link
                key={c.id}
                href={`/trainer/clients/${c.id}`}
                className="block bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-green-800 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{c.name}</p>
                    {c.goal && <p className="text-sm text-gray-400 mt-0.5">{c.goal}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">開始日</p>
                    <p className="text-sm text-gray-300">{formatDate(c.start_date)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
