// /demo — テスト太郎の実データを表示するデモページ
import ClientDashboard from "@/components/ClientDashboard";
import { createServerClient } from "@/lib/supabase";

// デモ専用UUID（本番DBには存在しないID）
const DEMO_CLIENT_ID = "00000000-0000-0000-0000-000000000001";

export const revalidate = 0;

export default async function DemoPage() {
  const supabase = createServerClient();

  const [clientRes, bodyRes, trainingRes, mealRes, photoRes, assessmentRes, goalsRes] = await Promise.all([
    supabase.from("clients").select("id, name, goal, start_date, height_cm, gender, birth_year, health_concerns").eq("id", DEMO_CLIENT_ID).single(),
    supabase.from("body_records").select("*").eq("client_id", DEMO_CLIENT_ID).order("recorded_at", { ascending: true }),
    supabase.from("training_sessions").select("*, training_sets(*)").eq("client_id", DEMO_CLIENT_ID).order("session_date", { ascending: false }).limit(30),
    supabase.from("meal_records").select("*").eq("client_id", DEMO_CLIENT_ID).order("meal_date", { ascending: false }).limit(90),
    supabase.from("body_photos").select("*").eq("client_id", DEMO_CLIENT_ID).order("taken_at", { ascending: false }).limit(20),
    supabase.from("assessments").select("*").eq("client_id", DEMO_CLIENT_ID).order("generated_at", { ascending: false }).limit(1),
    supabase.from("client_goals").select("*").eq("client_id", DEMO_CLIENT_ID).order("created_at", { ascending: false }).limit(1).single(),
  ]);

  const client = clientRes.data ?? { id: DEMO_CLIENT_ID, name: "テスト太郎", goal: "体脂肪15%を目指す", start_date: new Date().toISOString().split("T")[0] };

  return (
    <div>
      <div className="bg-grad-brand px-4 py-2 text-center print:hidden">
        <p className="text-white text-[11px] font-bold">
          🎯 デモページ — テスト太郎のリアルデータを表示しています
        </p>
      </div>
      <ClientDashboard
        client={client}
        bodyRecords={bodyRes.data ?? []}
        trainingSessions={trainingRes.data ?? []}
        mealRecords={mealRes.data ?? []}
        bodyPhotos={photoRes.data ?? []}
        assessment={assessmentRes.data?.[0] ?? null}
        goals={goalsRes.data ?? null}
      />
    </div>
  );
}
