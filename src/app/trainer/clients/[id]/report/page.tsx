export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getTrainerId } from "@/lib/trainer-auth";
import ReportViewer from "./ReportViewer";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportPage({ params }: PageProps) {
  const trainerId = await getTrainerId();
  if (!trainerId) redirect("/trainer/login");

  const { id } = await params;
  const supabase = createServerClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, name, line_user_id")
    .eq("id", id)
    .eq("trainer_id", trainerId)
    .single();

  if (!client) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-5 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <Link href={`/trainer/clients/${id}`} className="text-slate-400 hover:text-slate-600 text-sm">← 戻る</Link>
        <div>
          <h1 className="text-slate-800 font-semibold text-sm">{client.name} のレポート</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-5">
        <ReportViewer clientId={id} clientName={client.name} lineUserId={client.line_user_id ?? null} />
      </main>
    </div>
  );
}
