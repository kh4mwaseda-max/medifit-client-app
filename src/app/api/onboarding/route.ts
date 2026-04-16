import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getTrainerId } from "@/lib/trainer-auth";
import { randomBytes } from "crypto";

/**
 * POST /api/onboarding
 * [DEPRECATED] 個人プランは廃止済み。トレーナープランのみ。
 * このAPIは後方互換のために残しているが、新規利用は非推奨。
 * クライアントのオンボーディングはLINE Webhook経由で行う。
 * Returns: { clientId, clientPin }
 */
export async function POST(req: NextRequest) {
  const trainerId = await getTrainerId();
  if (!trainerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    // Step 1
    course,
    // Step 2
    target_weight_kg,
    target_body_fat_pct,
    target_date,
    weekly_training_sessions,
    // Step 3
    height_cm,
    current_weight_kg,
    current_body_fat_pct,
    birth_year,
    gender,
    name,
  } = await req.json();

  const supabase = createServerClient();

  // トレーナー情報取得（名前を使う）
  const { data: trainer } = await supabase.from("trainers").select("name").eq("id", trainerId).single();
  const clientName = name || trainer?.name || "ユーザー";

  // 既存のクライアント確認
  const { data: existing } = await supabase
    .from("clients")
    .select("id, pin")
    .eq("trainer_id", trainerId)
    .limit(1)
    .single();

  let clientId: string;
  let clientPin: string;

  if (existing) {
    clientId = existing.id;
    clientPin = existing.pin;
    // 既存クライアントを更新
    await supabase.from("clients").update({
      name: clientName,
      height_cm: height_cm ?? null,
      birth_year: birth_year ?? null,
      gender: gender ?? null,
      course: course ?? null,
      onboarding_step: "done",
    }).eq("id", clientId);
  } else {
    // PINを生成
    let pin: string | null = null;
    for (let i = 0; i < 10; i++) {
      const candidate = String(100000 + (randomBytes(3).readUIntBE(0, 3) % 900000));
      const { count } = await supabase.from("clients").select("id", { count: "exact", head: true }).eq("pin", candidate);
      if ((count ?? 1) === 0) { pin = candidate; break; }
    }
    if (!pin) return NextResponse.json({ error: "PIN生成に失敗しました" }, { status: 500 });

    const { data: newClient, error: clientError } = await supabase
      .from("clients")
      .insert({
        trainer_id: trainerId,
        name: clientName,
        pin,
        height_cm: height_cm ?? null,
        birth_year: birth_year ?? null,
        gender: gender ?? null,
        course: course ?? null,
        onboarding_step: "done",
        start_date: new Date().toISOString().split("T")[0],
      })
      .select("id, pin")
      .single();

    if (clientError || !newClient) {
      return NextResponse.json({ error: clientError?.message ?? "Client creation failed" }, { status: 500 });
    }
    clientId = newClient.id;
    clientPin = newClient.pin;
  }

  // 初回 body_record 保存
  if (current_weight_kg) {
    await supabase.from("body_records").upsert(
      {
        client_id: clientId,
        recorded_at: new Date().toISOString().split("T")[0],
        weight_kg: current_weight_kg,
        body_fat_pct: current_body_fat_pct ?? null,
      },
      { onConflict: "client_id,recorded_at" }
    );
  }

  // client_goals 保存
  await supabase.from("client_goals").delete().eq("client_id", clientId);
  await supabase.from("client_goals").insert({
    client_id: clientId,
    trainer_id: trainerId,
    target_weight_kg: target_weight_kg ?? null,
    target_body_fat_pct: target_body_fat_pct ?? null,
    target_date: target_date ?? null,
    weekly_training_sessions: weekly_training_sessions ?? null,
    trainer_notes: course ? `コース: ${course}` : null,
  });

  return NextResponse.json({ clientId, clientPin });
}
