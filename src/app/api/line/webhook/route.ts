import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { verifyLineSignature, getMessageContent, replyMessage } from "@/lib/line";
import { analyzeScreenshot, AskenResult, KintoreResult } from "@/lib/image-analyzer";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-line-signature") ?? "";

  if (!verifyLineSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody);
  const events: any[] = body.events ?? [];

  // イベントを並列処理（LINEは200を素早く返すことを期待するが30s以内なら問題なし）
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
      // すでに登録済みかチェック
      const { data: existing } = await supabase
        .from("clients")
        .select("id, name")
        .eq("line_user_id", lineUserId)
        .single();

      if (existing) {
        await replyMessage(
          replyToken,
          `${existing.name} さん、こんにちは！\nあすけんか筋トレメモのスクリーンショットを送ってください📸\n自動でダッシュボードに記録します✅`
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
      `${client.name} さん、登録完了です🎉\nあすけんか筋トレメモのスクリーンショットを送ると、自動でダッシュボードに記録します📊`
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

    // LINE画像を取得
    let imageBuffer: ArrayBuffer;
    try {
      imageBuffer = await getMessageContent(message.id);
    } catch {
      await replyMessage(replyToken, "画像の取得に失敗しました。もう一度送ってください。");
      return;
    }

    // Claude Visionで解析
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
        "あすけんまたは筋トレメモのスクリーンショットを送ってください📱\n（他のアプリの画像は対応していません）"
      );
      return;
    }

    // DBに保存
    try {
      if (result.app_type === "asken") {
        await saveAskenData(supabase, client.id, result);
      } else {
        await saveKintoreData(supabase, client.id, result);
      }

      await supabase.from("line_parse_logs").insert({
        client_id: client.id,
        line_message_id: message.id,
        app_type: result.app_type,
        raw_json: result as any,
        status: "success",
        error_message: null,
      });

      const confirmMsg = buildConfirmMessage(result);
      await replyMessage(replyToken, confirmMsg);
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

async function saveAskenData(supabase: ReturnType<typeof createServerClient>, clientId: string, data: AskenResult) {
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

async function saveKintoreData(supabase: ReturnType<typeof createServerClient>, clientId: string, data: KintoreResult) {
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
    rpe: null,
  }));

  if (sets.length > 0) {
    const { error } = await supabase.from("training_sets").insert(sets);
    if (error) throw new Error(error.message);
  }
}

function buildConfirmMessage(result: AskenResult | KintoreResult): string {
  if (result.app_type === "asken") {
    const lines = [
      `✅ 食事記録を保存しました（${result.date}）`,
      result.total_calories != null ? `🔥 合計 ${result.total_calories} kcal` : null,
      result.total_protein_g != null ? `💪 P: ${result.total_protein_g}g` : null,
      result.total_fat_g != null ? `🫙 F: ${result.total_fat_g}g` : null,
      result.total_carbs_g != null ? `🍚 C: ${result.total_carbs_g}g` : null,
      `\n${result.meals.length} 品目を記録しました📊`,
    ].filter(Boolean);
    return lines.join("\n");
  } else {
    const exercises = [...new Set(result.sets.map((s) => s.exercise_name))];
    return [
      `✅ トレーニングを記録しました（${result.date}）`,
      `💪 ${exercises.join("・")}`,
      `📊 ${result.sets.length} セット記録`,
    ].join("\n");
  }
}
