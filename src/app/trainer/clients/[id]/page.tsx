export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getTrainerId } from "@/lib/trainer-auth";
import { Logo, Icon, Avatar, Badge } from "@/components/cf/primitives";
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

  const [bodyRes, trainingRes, assessmentRes, goalsRes, photoRes] = await Promise.all([
    supabase
      .from("body_records")
      .select("*")
      .eq("client_id", id)
      .order("recorded_at", { ascending: false })
      .limit(30),
    supabase
      .from("training_sessions")
      .select("*, training_sets(*)")
      .eq("client_id", id)
      .order("session_date", { ascending: false })
      .limit(20),
    supabase
      .from("assessments")
      .select("*")
      .eq("client_id", id)
      .order("generated_at", { ascending: false })
      .limit(5),
    supabase
      .from("client_goals")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("body_photos")
      .select("*")
      .eq("client_id", id)
      .order("photo_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(52),
  ]);

  const photoRows = photoRes.data ?? [];
  const photosWithUrls = await Promise.all(
    photoRows.map(async (p: any) => {
      const { data: signed } = await supabase.storage
        .from("body-photos")
        .createSignedUrl(p.storage_path, 60 * 60 * 24);
      return { ...p, signed_url: signed?.signedUrl ?? null };
    }),
  );

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const clientUrl = `${origin}/client/${id}`;
  const goals = goalsRes.data ?? null;

  const lineStatus: {
    label: string;
    tone: "emerald" | "amber" | "brand" | "slate";
  } = client.line_user_id
    ? client.onboarding_step === "intake_done"
      ? { label: "プラン待ち", tone: "amber" }
      : client.onboarding_step?.startsWith("pending_")
        ? { label: "問診中", tone: "brand" }
        : { label: "稼働中", tone: "emerald" }
    : { label: "LINE未連携", tone: "slate" };

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="h-16 bg-white border-b border-ink-200 sticky top-0 z-10 flex items-center px-4 sm:px-6 gap-3">
        <Link
          href="/trainer"
          className="h-9 w-9 rounded-xl hover:bg-ink-100 flex items-center justify-center text-ink-600 shrink-0"
        >
          <Icon name="chevron-left" />
        </Link>
        <div className="hidden sm:flex">
          <Logo />
        </div>
        <div className="hidden sm:block h-6 w-px bg-ink-200" />
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Avatar name={client.name} size={36} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-black text-[15px] text-ink-800 truncate">
                {client.name}
              </h1>
              <Badge tone={lineStatus.tone} dot={lineStatus.tone === "slate" ? undefined : (lineStatus.tone as "emerald" | "amber" | "brand")}>
                {lineStatus.label}
              </Badge>
            </div>
            {client.goal && (
              <p className="text-[11px] text-ink-500 truncate">{client.goal}</p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        <TrainerClientTabs
          client={client}
          bodyRecords={bodyRes.data ?? []}
          trainingSessions={trainingRes.data ?? []}
          assessments={assessmentRes.data ?? []}
          goals={goals}
          clientUrl={clientUrl}
          bodyPhotos={photosWithUrls}
        />
      </main>
    </div>
  );
}
