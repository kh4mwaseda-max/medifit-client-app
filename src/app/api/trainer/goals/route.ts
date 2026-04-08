import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const TRAINER_ID = process.env.TRAINER_ID!;

// GET /api/trainer/goals?clientId=xxx
export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("client_goals")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ goals: data ?? null });
}

// POST /api/trainer/goals — 作成 or 置き換え
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { clientId, ...fields } = body;

  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  const supabase = createServerClient();

  // 既存を削除して新規INSERT（シンプルに最新1件管理）
  await supabase.from("client_goals").delete().eq("client_id", clientId);

  const { data, error } = await supabase
    .from("client_goals")
    .insert({
      client_id: clientId,
      trainer_id: TRAINER_ID,
      daily_calories_kcal: fields.daily_calories_kcal ?? null,
      daily_protein_g: fields.daily_protein_g ?? null,
      daily_fat_g: fields.daily_fat_g ?? null,
      daily_carbs_g: fields.daily_carbs_g ?? null,
      weekly_training_sessions: fields.weekly_training_sessions ?? null,
      recommended_exercises: fields.recommended_exercises ?? null,
      target_weight_kg: fields.target_weight_kg ?? null,
      target_body_fat_pct: fields.target_body_fat_pct ?? null,
      target_muscle_kg: fields.target_muscle_kg ?? null,
      target_date: fields.target_date ?? null,
      roadmap_text: fields.roadmap_text ?? null,
      trainer_notes: fields.trainer_notes ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ goals: data });
}
