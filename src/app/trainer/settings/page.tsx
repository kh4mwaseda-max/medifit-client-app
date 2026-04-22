export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { getTrainerId } from "@/lib/trainer-auth";
import { TrainerShell } from "@/components/cf/TrainerShell";
import TrainerSettingsForm from "./TrainerSettingsForm";

export default async function TrainerSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const trainerId = await getTrainerId();
  if (!trainerId) redirect("/trainer/login");

  const supabase = createServerClient();
  const { data: trainer } = await supabase
    .from("trainers")
    .select(
      "id, name, email, plan, line_notify_user_id, stripe_customer_id, stripe_subscription_id",
    )
    .eq("id", trainerId)
    .single();

  if (!trainer) notFound();

  const params = await searchParams;
  const justUpgraded = params.upgraded === "1";

  return (
    <TrainerShell
      active="settings"
      title="設定"
      subtitle="プロフィール・LINE連携・課金"
      trainerName={trainer.name ?? "トレーナー"}
      trainerEmail={trainer.email ?? undefined}
    >
      <div className="max-w-3xl">
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
      </div>
    </TrainerShell>
  );
}
