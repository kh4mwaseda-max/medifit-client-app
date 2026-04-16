export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { getTrainerId } from "@/lib/trainer-auth";
import SetupGuide from "./SetupGuide";

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const trainerId = await getTrainerId();
  if (!trainerId) redirect("/trainer/login");

  const supabase = createServerClient();
  const { data: trainer } = await supabase
    .from("trainers")
    .select("id, name, plan, user_type, line_channel_access_token")
    .eq("id", trainerId)
    .single();

  if (!trainer) redirect("/trainer/login");

  const params = await searchParams;
  const isIndividual = trainer.user_type === "individual" || params.mode === "individual";
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/line/webhook/${trainerId}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-lg mx-auto px-4 py-10">
        <SetupGuide trainer={trainer} webhookUrl={webhookUrl} isIndividual={isIndividual} />
      </main>
    </div>
  );
}
