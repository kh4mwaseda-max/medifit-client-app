export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import TrainerClientTabs from "./TrainerClientTabs";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TrainerClientPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (!client) notFound();

  const [bodyRes, trainingRes, assessmentRes, goalsRes] = await Promise.all([
    supabase.from("body_records").select("*").eq("client_id", id).order("recorded_at", { ascending: false }).limit(30),
    supabase.from("training_sessions").select("*, training_sets(*)").eq("client_id", id).order("session_date", { ascending: false }).limit(20),
    supabase.from("assessments").select("*").eq("client_id", id).order("generated_at", { ascending: false }).limit(5),
    supabase.from("client_goals").select("*").eq("client_id", id).order("created_at", { ascending: false }).limit(1).single(),
  ]);

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const clientUrl = `${origin}/client/${id}`;
  const goals = goalsRes.data ?? null;

  // LINE連携ステータス
  const lineStatus = client.line_user_id
    ? client.onboarding_step === "intake_done"
      ? { label: "初回データ入力済・プラン待ち", color: "text-amber-600 bg-amber-50 border-amber-200" }
      : client.onboarding_step?.startsWith("pending_")
        ? { label: "問診進行中", color: "text-blue-600 bg-blue-50 border-blue-200" }
        : { label: "LINE連携済・稼働中", color: "text-teal-600 bg-teal-50 border-teal-200" }
    : { label: "LINE未連携", color: "text-slate-500 bg-slate-50 border-slate-200" };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-5 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <Link href="/trainer" className="text-slate-400 hover:text-slate-600 text-sm">← 一覧</Link>
        <div className="flex-1">
          <h1 className="text-slate-800 font-semibold">{client.name}</h1>
          {client.goal && <p className="text-xs text-slate-400 mt-0.5">{client.goal}</p>}
        </div>
        <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${lineStatus.color}`}>
          {lineStatus.label}
        </span>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* レポートリンク */}
        <Link
          href={`/trainer/clients/${id}/report`}
          className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm hover:border-blue-200 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">📊</span>
            <span className="text-sm font-medium text-slate-700">週次・月次レポート</span>
          </div>
          <span className="text-slate-300 group-hover:text-blue-400 transition-colors">›</span>
        </Link>

        {/* クライアントURL・PIN */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
          <p className="text-[10px] text-slate-400 font-medium">クライアント共有URL</p>
          <p className="text-xs text-blue-600 break-all font-mono">{clientUrl}</p>
          <div className="flex items-center gap-3">
            <p className="text-[10px] text-slate-400">PIN: <span className="font-mono font-bold text-slate-600 tracking-widest">{client.pin}</span></p>
            {client.intake_completed_at && (
              <p className="text-[10px] text-slate-400">
                問診完了: {new Date(client.intake_completed_at).toLocaleDateString("ja-JP")}
              </p>
            )}
          </div>
        </div>

        <TrainerClientTabs
          client={client}
          bodyRecords={bodyRes.data ?? []}
          trainingSessions={trainingRes.data ?? []}
          assessments={assessmentRes.data ?? []}
          goals={goals}
        />
      </main>
    </div>
  );
}
