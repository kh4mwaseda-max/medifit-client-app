export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase";
import PinGate from "@/components/PinGate";
import ClientDashboard from "@/components/ClientDashboard";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = createServerClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id, name, goal, start_date, height_cm, gender, birth_year, health_concerns")
    .eq("id", id)
    .single();

  if (!client) notFound();

  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get(`client_auth_${id}`)?.value === "1";

  if (!isAuthenticated) {
    return <PinGate clientId={id} clientName={client.name} />;
  }

  const [bodyRecords, trainingSessions, mealRecords, bodyPhotos, latestAssessment, goalsRes] =
    await Promise.all([
      supabase
        .from("body_records")
        .select("*")
        .eq("client_id", id)
        .order("recorded_at", { ascending: true })
        .limit(90),
      supabase
        .from("training_sessions")
        .select("*, training_sets(*)")
        .eq("client_id", id)
        .order("session_date", { ascending: false })
        .limit(30),
      supabase
        .from("meal_records")
        .select("*")
        .eq("client_id", id)
        .order("meal_date", { ascending: false })
        .limit(90),
      supabase
        .from("body_photos")
        .select("*")
        .eq("client_id", id)
        .order("photo_date", { ascending: false })
        .limit(52),
      supabase
        .from("assessments")
        .select("*")
        .eq("client_id", id)
        .not("published_at", "is", null)
        .order("generated_at", { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from("client_goals")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
    ]);

  return (
    <ClientDashboard
      client={client}
      bodyRecords={bodyRecords.data ?? []}
      trainingSessions={trainingSessions.data ?? []}
      mealRecords={mealRecords.data ?? []}
      bodyPhotos={bodyPhotos.data ?? []}
      assessment={latestAssessment.data ?? null}
      goals={goalsRes.data ?? null}
    />
  );
}
