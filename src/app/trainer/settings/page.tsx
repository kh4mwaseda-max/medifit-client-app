export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import TrainerSettingsForm from "./TrainerSettingsForm";

export default async function TrainerSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const cookieStore = await cookies();
  const trainerId = cookieStore.get("trainer_id")?.value ?? process.env.TRAINER_ID;
  if (!trainerId) redirect("/trainer/login");

  const supabase = createServerClient();
  const { data: trainer } = await supabase
    .from("trainers")
    .select("id, name, email, plan, line_notify_user_id, stripe_customer_id, stripe_subscription_id")
    .eq("id", trainerId)
    .single();

  if (!trainer) notFound();

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/line/webhook/${trainerId}`;
  const params = await searchParams;
  const justUpgraded = params.upgraded === "1";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-5 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <a href="/trainer" className="text-slate-400 hover:text-slate-600 text-sm">← 戻る</a>
          <h1 className="text-slate-800 font-semibold text-sm">設定</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        <TrainerSettingsForm
          trainer={{
            id: trainer.id,
            name: trainer.name ?? "",
            email: trainer.email ?? "",
            plan: trainer.plan ?? "free",
            line_notify_user_id: trainer.line_notify_user_id ?? "",
            stripe_customer_id: trainer.stripe_customer_id ?? null,
          }}
          justUpgraded={justUpgraded}
        />
      </main>
    </div>
  );
}
