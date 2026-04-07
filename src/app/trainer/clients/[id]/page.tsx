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

  const [bodyRes, trainingRes, assessmentRes] = await Promise.all([
    supabase.from("body_records").select("*").eq("client_id", id).order("recorded_at", { ascending: false }).limit(30),
    supabase.from("training_sessions").select("*, training_sets(*)").eq("client_id", id).order("session_date", { ascending: false }).limit(20),
    supabase.from("assessments").select("*").eq("client_id", id).order("generated_at", { ascending: false }).limit(5),
  ]);

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const clientUrl = `${origin}/client/${id}`;

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <Link href="/trainer" className="text-gray-400 hover:text-white text-sm">← 一覧</Link>
        <div>
          <h1 className="text-white font-semibold">{client.name}</h1>
          {client.goal && <p className="text-xs text-gray-500">{client.goal}</p>}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* クライアントURL */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 space-y-2">
          <p className="text-xs text-gray-500">クライアント共有URL</p>
          <p className="text-sm text-green-400 break-all font-mono">{clientUrl}</p>
          <p className="text-xs text-gray-600">PIN: {client.pin}</p>
        </div>

        <TrainerClientTabs
          client={client}
          bodyRecords={bodyRes.data ?? []}
          trainingSessions={trainingRes.data ?? []}
          assessments={assessmentRes.data ?? []}
        />
      </main>
    </div>
  );
}
