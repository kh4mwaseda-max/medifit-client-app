import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getTrainerId } from "@/lib/trainer-auth";
import { randomBytes } from "crypto";

export async function GET() {
  const trainerId = await getTrainerId();
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
  const trainerId = await getTrainerId();
  if (!trainerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, goal, start_date } = await req.json();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const supabase = createServerClient();

  // 衝突しない6桁PINを自動生成（最大10回リトライ）
  let pin: string | null = null;
  for (let i = 0; i < 10; i++) {
    const candidate = String(100000 + (randomBytes(3).readUIntBE(0, 3) % 900000));
    const { count } = await supabase.from("clients").select("id", { count: "exact", head: true }).eq("pin", candidate);
    if ((count ?? 1) === 0) { pin = candidate; break; }
  }
  if (!pin) return NextResponse.json({ error: "PIN生成に失敗しました。再試行してください。" }, { status: 500 });

  const { data, error } = await supabase
    .from("clients")
    .insert({ trainer_id: trainerId, name, pin, goal: goal || null, start_date: start_date || new Date().toISOString().split("T")[0] })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ client: data });
}
