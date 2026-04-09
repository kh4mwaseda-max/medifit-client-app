export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import SetupGuide from "./SetupGuide";

export default async function SetupPage() {
  const cookieStore = await cookies();
  const trainerId = cookieStore.get("trainer_id")?.value ?? process.env.TRAINER_ID;
  if (!trainerId) redirect("/trainer/login");

  const supabase = createServerClient();
  const { data: trainer } = await supabase
    .from("trainers")
    .select("id, name, plan, line_channel_access_token")
    .eq("id", trainerId)
    .single();

  if (!trainer) redirect("/trainer/login");

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/line/webhook/${trainerId}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-lg mx-auto px-4 py-10">
        <SetupGuide trainer={trainer} webhookUrl={webhookUrl} />
      </main>
    </div>
  );
}
