import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { verifyLineSignature, getMessageContent, replyMessage } from "@/lib/line";
import { analyzeScreenshot, MealResult, TrainingResult, BodyResult, CardioResult } from "@/lib/image-analyzer";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-line-signature") ?? "";

  if (!verifyLineSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody);
  const events: any[] = body.events ?? [];

  await Promise.allSettled(events.map(handleEvent));

  return NextResponse.json({ ok: true });
}

async function handleEvent(event: any) {
  const { type, replyToken, source, message } = event;
  if (type !== "message") return;

  const lineUserId: string = source?.userId;
  if (!lineUserId) return;

  const supabase = createServerClient();

  // --- テキストメッセージ: PIN登録フロー ---
  if (message.type === "text") {
    const text: string = message.text.trim();
    const isPinLike = /^\d{4,6}$/.test(text);

    if (!isPinLike) {
      const { data: existing } = await supabase
        .from("clients")
        .select("id, name")
        .eq("line_user_id", lineUserId)
        .single();

      if (existing) {
        await replyMessage(
          replyToken,
          `${existing.name} さん、こんにちは！\n食事・筋トレ・体重・ランニングなど、フィットネスアプリのスクリーンショットを送ってください📸\n自動でダッシュボードに記録します✅`
        );
      } else {
        await replyMessage(
          replyToken,
          "はじめまして！\nトレーナーから共有された4〜6桁のPINコードを送ってください🔑"
        );
      }
      return;
    }

    // PINコードを受信 → クライアントを検索して紐付け
    const { data: client } = await supabase
      .from("clients")
      .select("id, name, line_user_id")
      .eq("pin", text)
      .single();

    if (!client) {
      await replyMessage(replyToken, "PINコードが正しくありません。トレーナーに確認してください。");
      return;
    }

    if (client.line_user_id && client.line_user_id !== lineUserId) {
      await replyMessage(replyToken, "このPINは既に別のアカウントで登録済みです。トレーナーにお問い合わせください。");
      return;
    }

    await supabase
      .from("clients")
      .update({ line_user_id: lineUserId })
      .eq("id", client.id);

    await replyMessage(
      replyToken,
      `${client.name} さん、登録完了です🎉\n\nフィットネスアプリのスクリーンショットを送ると自動で記録します📊\n\n対応アプリ（例）：\n🍽 食事: あすけん・MyFitnessPal・カロミル 等\n💪 筋トレ: 筋トレメモ・STRONG・Hevy 等\n⚖️ 体重: タニタ・Withings・OMRON 等\n🏃 有酸素: Strava・Nike Run・Garmin 等`
    );
    return;
  }

  // --- 画像メッセージ: スクリーンショット解析フロー ---
  if (message.type === "image") {
    const { data: client } = await supabase
      .from("clients")
      .select("id, name")
      .eq("line_user_id", lineUserId)
      .single();

    if (!client) {
      await replyMessage(
        replyToken,
        "まだ連携されていません。トレーナーから共有されたPINコードを送ってください🔑"
      );
      return;
    }

    let imageBuffer: ArrayBuffer;
    try {
      imageBuffer = await getMessageContent(message.id);
    } catch {
      await replyMessage(replyToken, "画像の取得に失敗しました。もう一度送ってください。");
      return;
    }

    let result: Awaited<ReturnType<typeof analyzeScreenshot>>;
    try {
      result = await analyzeScreenshot(imageBuffer);
    } catch {
      await supabase.from("line_parse_logs").insert({
        client_id: client.id,
        line_message_id: message.id,
        app_type: "unknown",
        raw_json: null,
        status: "failed",
        error_message: "Claude解析エラー",
      });
      await replyMessage(replyToken, "画像の解析に失敗しました。もう一度送ってください。");
      return;
    }

    if (result.app_type === "unknown") {
      await supabase.from("line_parse_logs").insert({
        client_id: client.id,
        line_message_id: message.id,
        app_type: "unknown",
        raw_json: result as any,
        status: "failed",
        error_message: (result as any).reason,
      });
      await replyMessage(
        replyToken,
        `スクリーンショットを認識できませんでした🙏\n\n対応しているアプリのスクショを送ってください：\n🍽 食事: あすけん・MyFitnessPal・カロミル 等\n💪 筋トレ: 筋トレメモ・STRONG・Hevy 等\n⚖️ 体重: タニタ・Withings・OMRON 等\n🏃 有酸素: Strava・Nike Run・Garmin 等`
      );
      return;
    }

    try {
      if (result.app_type === "meal") {
        await saveMealData(supabase, client.id, result);
      } else if (result.app_type === "training") {
        await saveTrainingData(supabase, client.id, result);
      } else if (result.app_type === "body") {
        await saveBodyData(supabase, client.id, result);
      } else if (result.app_type === "cardio") {
        await saveCardioData(supabase, client.id, result);
      }

      await supabase.from("line_parse_logs").insert({
        client_id: client.id,
        line_message_id: message.id,
        app_type: result.app_type,
        raw_json: result as any,
        status: "success",
        error_message: null,
      });

      await replyMessage(replyToken, buildConfirmMessage(result));
    } catch (e: any) {
      await supabase.from("line_parse_logs").insert({
        client_id: client.id,
        line_message_id: message.id,
        app_type: result.app_type,
        raw_json: result as any,
        status: "failed",
        error_message: e?.message ?? "DB保存エラー",
      });
      await replyMessage(replyToken, "記録の保存に失敗しました。トレーナーにお知らせください。");
    }
  }
}

async function saveMealData(supabase: any, clientId: string, data: MealResult) {
  const records = data.meals.map((meal) => ({
    client_id: clientId,
    meal_date: data.date,
    meal_type: meal.meal_type,
    food_name: meal.food_name,
    calories: meal.calories,
    protein_g: meal.protein_g,
    fat_g: meal.fat_g,
    carbs_g: meal.carbs_g,
  }));
  if (records.length > 0) {
    const { error } = await supabase.from("meal_records").insert(records);
    if (error) throw new Error(error.message);
  }
}

async function saveTrainingData(supabase: any, clientId: string, data: TrainingResult) {
  const { data: session, error: sessionError } = await supabase
    .from("training_sessions")
    .insert({ client_id: clientId, session_date: data.date, notes: data.notes })
    .select()
    .single();
  if (sessionError) throw new Error(sessionError.message);

  const sets = data.sets.map((s) => ({
    session_id: session.id,
    exercise_name: s.exercise_name,
    muscle_group: s.muscle_group,
    weight_kg: s.weight_kg,
    reps: s.reps,
    set_number: s.set_number,
    rpe: s.rpe ?? null,
  }));
  if (sets.length > 0) {
    const { error } = await supabase.from("training_sets").insert(sets);
    if (error) throw new Error(error.message);
  }
}

async function saveBodyData(supabase: any, clientId: string, data: BodyResult) {
  const { error } = await supabase.from("body_records").insert({
    client_id: clientId,
    recorded_at: data.date,
    weight_kg: data.weight_kg,
    body_fat_pct: data.body_fat_pct,
    muscle_mass_kg: data.muscle_mass_kg,
  });
  if (error) throw new Error(error.message);
}

async function saveCardioData(supabase: any, clientId: string, data: CardioResult) {
  // 有酸素はtraining_sessionに保存（ペース・距離等はnotesに格納）
  const notes = [
    data.distance_km != null ? `距離: ${data.distance_km}km` : null,
    data.duration_seconds != null ? `時間: ${formatDuration(data.duration_seconds)}` : null,
    data.pace_sec_per_km != null ? `ペース: ${formatPace(data.pace_sec_per_km)}/km` : null,
    data.calories != null ? `消費: ${data.calories}kcal` : null,
    data.avg_heart_rate != null ? `平均HR: ${data.avg_heart_rate}bpm` : null,
  ].filter(Boolean).join(" / ");

  const { data: session, error: sessionError } = await supabase
    .from("training_sessions")
    .insert({ client_id: clientId, session_date: data.date, notes })
    .select()
    .single();
  if (sessionError) throw new Error(sessionError.message);

  // セットとして1行だけ記録
  const { error } = await supabase.from("training_sets").insert({
    session_id: session.id,
    exercise_name: data.activity_type,
    muscle_group: "有酸素",
    weight_kg: data.distance_km,   // 距離をweight_kg列に代用
    reps: data.duration_seconds ? Math.round(data.duration_seconds / 60) : null, // 分数をrepsに代用
    set_number: 1,
    rpe: null,
  });
  if (error) throw new Error(error.message);
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60);
  const s = secPerKm % 60;
  return `${m}'${String(s).padStart(2, "0")}`;
}

function buildConfirmMessage(result: MealResult | TrainingResult | BodyResult | CardioResult): string {
  switch (result.app_type) {
    case "meal": {
      const lines = [
        `✅ 食事記録を保存しました（${result.date}）`,
        `📱 ${result.source_app}`,
        result.total_calories != null ? `🔥 合計 ${result.total_calories} kcal` : null,
        result.total_protein_g != null ? `💪 P: ${result.total_protein_g}g` : null,
        result.total_fat_g != null ? `🫙 F: ${result.total_fat_g}g` : null,
        result.total_carbs_g != null ? `🍚 C: ${result.total_carbs_g}g` : null,
        `\n${result.meals.length} 品目を記録しました📊`,
      ].filter(Boolean);
      return lines.join("\n");
    }
    case "training": {
      const exercises = [...new Set(result.sets.map((s) => s.exercise_name))];
      return [
        `✅ トレーニングを記録しました（${result.date}）`,
        `📱 ${result.source_app}`,
        `💪 ${exercises.join("・")}`,
        `📊 ${result.sets.length} セット記録`,
      ].join("\n");
    }
    case "body": {
      const lines = [
        `✅ 体重・体組成を記録しました（${result.date}）`,
        `📱 ${result.source_app}`,
        result.weight_kg != null ? `⚖️ 体重: ${result.weight_kg}kg` : null,
        result.body_fat_pct != null ? `📉 体脂肪率: ${result.body_fat_pct}%` : null,
        result.muscle_mass_kg != null ? `💪 筋肉量: ${result.muscle_mass_kg}kg` : null,
      ].filter(Boolean);
      return lines.join("\n");
    }
    case "cardio": {
      const lines = [
        `✅ ${result.activity_type}を記録しました（${result.date}）`,
        `📱 ${result.source_app}`,
        result.distance_km != null ? `📍 距離: ${result.distance_km}km` : null,
        result.duration_seconds != null ? `⏱ 時間: ${formatDuration(result.duration_seconds)}` : null,
        result.pace_sec_per_km != null ? `🏃 ペース: ${formatPace(result.pace_sec_per_km)}/km` : null,
        result.calories != null ? `🔥 消費: ${result.calories}kcal` : null,
      ].filter(Boolean);
      return lines.join("\n");
    }
  }
}
