export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getTrainerId } from "@/lib/trainer-auth";
import { Logo, Icon } from "@/components/cf/primitives";
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
    <div className="min-h-screen bg-ink-50">
      <header className="h-16 bg-white border-b border-ink-200 sticky top-0 z-10 flex items-center px-4 sm:px-6 gap-3">
        <Link
          href={`/trainer/clients/${id}`}
          className="h-9 w-9 rounded-xl hover:bg-ink-100 flex items-center justify-center text-ink-600 shrink-0"
        >
          <Icon name="chevron-left" />
        </Link>
        <div className="hidden sm:flex">
          <Logo />
        </div>
        <div className="hidden sm:block h-6 w-px bg-ink-200" />
        <div className="min-w-0">
          <h1 className="font-black text-[15px] text-ink-800 truncate">
            {client.name} のレポート
          </h1>
          <p className="text-[11px] text-ink-500">週次・月次の推移サマリー</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
        <ReportViewer
          clientId={id}
          clientName={client.name}
          lineUserId={client.line_user_id ?? null}
        />
      </main>
    </div>
  );
}
