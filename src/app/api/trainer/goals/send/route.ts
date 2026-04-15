import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { pushMessage } from "@/lib/line";
import { getTrainerId, verifyClientOwnership } from "@/lib/trainer-auth";

// POST /api/trainer/goals/send — ロードマップをLINEで送信
export async function POST(req: NextRequest) {
  const trainerId = await getTrainerId();
  if (!trainerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId, goalId } = await req.json();
  if (!clientId || !goalId) {
    return NextResponse.json({ error: "clientId and goalId required" }, { status: 400 });
  }

  const ownership = await verifyClientOwnership(trainerId, clientId);
  if (!ownership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createServerClient();

  // クライアント・ゴール・トレーナー名を取得
  const [clientRes, goalRes, trainerRes] = await Promise.all([
    supabase.from("clients").select("name, line_user_id").eq("id", clientId).single(),
    supabase.from("client_goals").select("*").eq("id", goalId).single(),
    supabase.from("trainers").select("name").eq("id", trainerId).single(),
  ]);

  if (!clientRes.data) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  if (!goalRes.data) return NextResponse.json({ error: "Goals not found" }, { status: 404 });

  const { name, line_user_id } = clientRes.data;
  const goals = goalRes.data;
  const trainerName = trainerRes.data?.name ?? "トレーナー";

  if (!line_user_id) {
    return NextResponse.json({ error: "クライアントがLINE連携していません" }, { status: 400 });
  }

  // ロードマップメッセージを構築
  const lines: string[] = [
    `${name} さん、お待たせしました！🎉`,
    `${trainerName} トレーナーが個別プランを作成しました📊`,
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

  lines.push(`一緒に頑張りましょう💪 — ${trainerName} トレーナー`);

  const messageText = lines.join("\n");

  // 2通目: スクショ送信のコツと月間上限ガイド
  const guideLines: string[] = [
    `📸 ここからは記録のコツをお伝えします`,
    ``,
    `フィットネスアプリのスクショをこのLINEに送るだけで自動でデータが入ります✅`,
    ``,
    `【月間の上限】`,
    `🗓 1ヶ月150枚まで（1日あたり約5枚が目安）`,
    ``,
    `【上限内に収める1日のおすすめ撮り方】`,
    `🍽 食事: 1日の合計が見える「サマリー画面」を1枚`,
    `   （あすけん・MyFitnessPal・カロミルなど、どのアプリでも"今日の合計栄養"が出る画面でOK）`,
    `💪 筋トレ: セッション全体が映る画面を1〜2枚`,
    `   （筋トレメモ・STRONG・Hevyなど）`,
    `⚖️ 体重: 体組成計の結果を1枚`,
    `🏃 有酸素: ワークアウトの結果を1枚`,
    ``,
    `→ 1日4〜5枚に収まれば月150枚以内で運用できます`,
    ``,
    `【補足】`,
    `・1食ごとに細かく送るより「1日の合計画面」1枚の方がデータが正確で枚数も節約できます`,
    `・他人の名前や個人情報が映る場合はマスキング（隠す）してから送ってOKです`,
    `・スクショの種類が違っても自動で判別するので、慣れているアプリを使って大丈夫です`,
    ``,
    `わからないことがあれば ${trainerName} トレーナーに気軽に聞いてくださいね😊`,
  ];
  const guideText = guideLines.join("\n");

  try {
    // 2通まとめて送信（goal + usage guide）
    await pushMessage(line_user_id, [
      { type: "text", text: messageText },
      { type: "text", text: guideText },
    ]);
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
