import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { pushMessage } from "@/lib/line";

// POST /api/trainer/goals/send — ロードマップをLINEで送信
export async function POST(req: NextRequest) {
  const { clientId, goalId } = await req.json();
  if (!clientId || !goalId) {
    return NextResponse.json({ error: "clientId and goalId required" }, { status: 400 });
  }

  const supabase = createServerClient();

  // クライアントとゴールを取得
  const [clientRes, goalRes] = await Promise.all([
    supabase.from("clients").select("name, line_user_id").eq("id", clientId).single(),
    supabase.from("client_goals").select("*").eq("id", goalId).single(),
  ]);

  if (!clientRes.data) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  if (!goalRes.data) return NextResponse.json({ error: "Goals not found" }, { status: 404 });

  const { name, line_user_id } = clientRes.data;
  const goals = goalRes.data;

  if (!line_user_id) {
    return NextResponse.json({ error: "クライアントがLINE連携していません" }, { status: 400 });
  }

  // ロードマップメッセージを構築
  const lines: string[] = [
    `${name} さん、お待たせしました！🎉`,
    `トレーナーが個別プランを作成しました📊`,
    ``,
  ];

  if (goals.daily_calories_kcal || goals.daily_protein_g) {
    lines.push(`【毎日の栄養目標】`);
    if (goals.daily_calories_kcal) lines.push(`🔥 カロリー: ${goals.daily_calories_kcal} kcal`);
    if (goals.daily_protein_g)     lines.push(`💪 タンパク質: ${goals.daily_protein_g}g`);
    if (goals.daily_fat_g)         lines.push(`🫙 脂質: ${goals.daily_fat_g}g`);
    if (goals.daily_carbs_g)       lines.push(`🍚 炭水化物: ${goals.daily_carbs_g}g`);
    lines.push(``);
  }

  if (goals.nutrition_advice) {
    lines.push(`【食事・サプリアドバイス】`);
    lines.push(goals.nutrition_advice);
    lines.push(``);
  }

  if (goals.weekly_training_sessions) {
    lines.push(`【トレーニング目標】`);
    lines.push(`🏋 週${goals.weekly_training_sessions}回`);
    if (goals.recommended_exercises?.length) {
      lines.push(`推奨種目: ${goals.recommended_exercises.join("・")}`);
    }
    lines.push(``);
  }

  if (goals.target_weight_kg || goals.target_body_fat_pct) {
    lines.push(`【身体目標】`);
    if (goals.target_weight_kg)    lines.push(`⚖️ 目標体重: ${goals.target_weight_kg}kg`);
    if (goals.target_body_fat_pct) lines.push(`📉 目標体脂肪率: ${goals.target_body_fat_pct}%`);
    if (goals.target_date)         lines.push(`📅 目標日: ${goals.target_date}`);
    lines.push(``);
  }

  if (goals.roadmap_text) {
    lines.push(`【トレーナーからのメッセージ】`);
    lines.push(goals.roadmap_text);
    lines.push(``);
  }

  lines.push(`毎日スクショを送るだけで自動記録されます📸`);
  lines.push(`一緒に頑張りましょう💪`);

  const messageText = lines.join("\n");

  try {
    await pushMessage(line_user_id, messageText);
  } catch (e: any) {
    return NextResponse.json({ error: `LINE送信エラー: ${e.message}` }, { status: 500 });
  }

  // sent_at を更新
  await supabase
    .from("client_goals")
    .update({ sent_at: new Date().toISOString() })
    .eq("id", goalId);

  // onboarding_step を null にリセット（通常フローへ移行）
  await supabase
    .from("clients")
    .update({ onboarding_step: null })
    .eq("id", clientId);

  return NextResponse.json({ ok: true });
}
