export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getTrainerId } from "@/lib/trainer-auth";
import TrainerClientTabs from "./TrainerClientTabs";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TrainerClientPage({ params }: PageProps) {
  const trainerId = await getTrainerId();
  if (!trainerId) redirect("/trainer/login");

  const { id } = await params;
  const supabase = createServerClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("trainer_id", trainerId)
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

  // LINE連携ステータス（ヘッダー表示用）
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
        <TrainerClientTabs
          client={client}
          bodyRecords={bodyRes.data ?? []}
          trainingSessions={trainingRes.data ?? []}
          assessments={assessmentRes.data ?? []}
          goals={goals}
          clientUrl={clientUrl}
        />
      </main>
    </div>
  );
}
