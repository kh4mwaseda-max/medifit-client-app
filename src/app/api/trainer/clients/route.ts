import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getTrainerId } from "@/lib/trainer-auth";

async function resolveTrainerId(): Promise<string | null> {
  const id = await getTrainerId();
  return id ?? process.env.TRAINER_ID ?? null;
}

export async function GET() {
  const trainerId = await resolveTrainerId();
  if (!trainerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, goal, start_date, created_at")
    .eq("trainer_id", trainerId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ clients: data });
}

export async function POST(req: NextRequest) {
  const trainerId = await resolveTrainerId();
  if (!trainerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, pin, goal, start_date } = await req.json();
  if (!name || !pin) return NextResponse.json({ error: "name and pin are required" }, { status: 400 });

  // Free プランはクライアント1人まで
  const supabase = createServerClient();
  const { data: trainer } = await supabase.from("trainers").select("plan").eq("id", trainerId).single();
  if (trainer?.plan === "free") {
    const { count } = await supabase.from("clients").select("id", { count: "exact", head: true }).eq("trainer_id", trainerId);
    if ((count ?? 0) >= 1) {
      return NextResponse.json({ error: "Free プランはクライアント1名まで。Proにアップグレードしてください。" }, { status: 403 });
    }
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({ trainer_id: trainerId, name, pin, goal: goal || null, start_date: start_date || new Date().toISOString().split("T")[0] })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ client: data });
}
