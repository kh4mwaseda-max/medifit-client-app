import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { verifyLineSignature, getMessageContent, replyMessage, pushMessage } from "@/lib/line";
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

// ── オンボーディング質問文 ────────────────────────────────────────

const ONBOARDING_QUESTIONS: Record<string, string> = {
  pending_height:
    "📏 身長を教えてください（cm）\n例: 175",
  pending_weight:
    "⚖️ 現在の体重を教えてください（kg）\n例: 75.5",
  pending_body_fat:
    "📊 体脂肪率はわかりますか？\n例: 18.5\n\n※ わからない場合は「スキップ」と送ってください",
  pending_age:
    "🎂 年齢を教えてください\n例: 32",
  pending_gender:
    "👤 性別を教えてください\n「男性」「女性」「その他」のいずれかを送ってください",
  pending_health:
    "🏥 健康上の注意点や持病はありますか？\n例: 膝が弱い、高血圧\n\n※ 特になければ「なし」と送ってください",
};

// ── イベントハンドラ ──────────────────────────────────────────────

async function handleEvent(event: any) {
  const { type, replyToken, source, message } = event;
  if (type !== "message") return;

  const lineUserId: string = source?.userId;
  if (!lineUserId) return;

  const supabase = createServerClient();

  // ── 登録済みクライアントかチェック ──
  const { data: client } = await supabase
    .from("clients")
    .select("id, name, line_user_id, onboarding_step, height_cm, pin")
    .eq("line_user_id", lineUserId)
    .single();

  // ── オンボーディング進行中 ──
  if (client && client.onboarding_step?.startsWith("pending_")) {
    if (message.type === "image") {
      const q = ONBOARDING_QUESTIONS[client.onboarding_step];
      await replyMessage(replyToken, `📝 まず以下の質問にお答えください：\n\n${q}`);
      return;
    }
    if (message.type === "text") {
      await handleOnboardingStep(supabase, client, message.text.trim(), replyToken);
      return;
    }
    return;
  }

  // ── intake_done: トレーナープラン待ち ──
  if (client && client.onboarding_step === "intake_done") {
    if (message.type === "text") {
      await replyMessage(
        replyToken,
        `${client.name} さん、トレーナーがデータを確認中です📊\nプランが決まり次第お知らせします。\n\nもうしばらくお待ちください🙏`
      );
      return;
    }
    if (message.type === "image") {
      await replyMessage(
        replyToken,
        `${client.name} さん、トレーナーからのプラン待ちです。\nプランが届いたらスクショを送ってくださいね📸`
      );
      return;
    }
    return;
  }

  // ── テキストメッセージ: PIN登録 or 通常グリーティング ──
  if (message.type === "text") {
    const text: string = message.text.trim();
    const isPinLike = /^\d{4,6}$/.test(text);

    if (!isPinLike) {
      if (client) {
        await replyMessage(
          replyToken,
          `${client.name} さん、こんにちは！\n食事・筋トレ・体重・ランニングなど、フィットネスアプリのスクリーンショットを送ってください📸\n自動でダッシュボードに記録します✅`
        );
      } else {
        await replyMessage(
          replyToken,
          "はじめまして！\nトレーナーから共有された4〜6桁のPINコードを送ってください🔑"
        );
      }
      return;
    }

    // PINコード受信 → クライアント検索＆紐付け
    const { data: pinClient } = await supabase
      .from("clients")
      .select("id, name, line_user_id")
      .eq("pin", text)
      .single();

    if (!pinClient) {
      await replyMessage(replyToken, "PINコードが正しくありません。トレーナーに確認してください。");
      return;
    }

    if (pinClient.line_user_id && pinClient.line_user_id !== lineUserId) {
      await replyMessage(replyToken, "このPINは既に別のアカウントで登録済みです。トレーナーにお問い合わせください。");
      return;
    }

    // LINE連携 + オンボーディング開始
    await supabase
      .from("clients")
      .update({ line_user_id: lineUserId, onboarding_step: "pending_height" })
      .eq("id", pinClient.id);

    await replyMessage(
      replyToken,
      `${pinClient.name} さん、LINE連携完了です🎉\n\n初回のデータを入力していただきます（約2分）\nトレーナーが最適なプランを作成します📊\n\n${ONBOARDING_QUESTIONS.pending_height}`
    );
    return;
  }

  // ── 画像メッセージ: スクリーンショット解析 ──
  if (message.type === "image") {
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
    } catch (e: any) {
      const errMsg = e?.message ?? e?.toString() ?? "Claude解析エラー";
      console.error("analyzeScreenshot error:", errMsg);
      await supabase.from("line_parse_logs").insert({
        client_id: client.id,
        line_message_id: message.id,
        app_type: "unknown",
        raw_json: null,
        status: "failed",
        error_message: errMsg,
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
        `スクリーンショットを認識できませんでした🙏\n\n対応アプリのスクショを送ってください：\n🍽 食事: あすけん・MyFitnessPal・カロミル 等\n💪 筋トレ: 筋トレメモ・STRONG・Hevy 等\n⚖️ 体重: タニタ・Withings・OMRON 等\n🏃 有酸素: Strava・Nike Run・Garmin 等`
      );
      return;
    }

    try {
      if (result.app_type === "meal")     await saveMealData(supabase, client.id, result);
      if (result.app_type === "training") await saveTrainingData(supabase, client.id, result);
      if (result.app_type === "body")     await saveBodyData(supabase, client.id, result);
      if (result.app_type === "cardio")   await saveCardioData(supabase, client.id, result);

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

// ── オンボーディング各ステップ処理 ───────────────────────────────

async function handleOnboardingStep(
  supabase: any,
  client: any,
  text: string,
  replyToken: string
) {
  const step = client.onboarding_step;

  switch (step) {
    case "pending_height": {
      const val = parseFloat(text.replace(/[^0-9.]/g, ""));
      if (isNaN(val) || val < 50 || val > 250) {
        await replyMessage(replyToken, `身長は50〜250の数字で入力してください。\n例: 175\n\n${ONBOARDING_QUESTIONS.pending_height}`);
        return;
      }
      await supabase.from("clients").update({ height_cm: val, onboarding_step: "pending_weight" }).eq("id", client.id);
      await replyMessage(replyToken, `身長 ${val}cm を記録しました✅\n\n${ONBOARDING_QUESTIONS.pending_weight}`);
      break;
    }

    case "pending_weight": {
      const val = parseFloat(text.replace(/[^0-9.]/g, ""));
      if (isNaN(val) || val < 20 || val > 300) {
        await replyMessage(replyToken, `体重は20〜300の数字で入力してください。\n例: 75.5\n\n${ONBOARDING_QUESTIONS.pending_weight}`);
        return;
      }
      // 初回body_recordとして保存
      await supabase.from("body_records").insert({
        client_id: client.id,
        recorded_at: new Date().toISOString().split("T")[0],
        weight_kg: val,
      });
      await supabase.from("clients").update({ onboarding_step: "pending_body_fat" }).eq("id", client.id);
      await replyMessage(replyToken, `体重 ${val}kg を記録しました✅\n\n${ONBOARDING_QUESTIONS.pending_body_fat}`);
      break;
    }

    case "pending_body_fat": {
      const isSkip = /スキップ|skip|わからない|不明/i.test(text);
      if (!isSkip) {
        const val = parseFloat(text.replace(/[^0-9.]/g, ""));
        if (isNaN(val) || val < 1 || val > 60) {
          await replyMessage(replyToken, `体脂肪率は1〜60の数字で入力するか「スキップ」と送ってください。\n\n${ONBOARDING_QUESTIONS.pending_body_fat}`);
          return;
        }
        // 直近のbody_recordに体脂肪率を追加
        const { data: latestRecord } = await supabase
          .from("body_records")
          .select("id")
          .eq("client_id", client.id)
          .order("recorded_at", { ascending: false })
          .limit(1)
          .single();
        if (latestRecord) {
          await supabase.from("body_records").update({ body_fat_pct: val }).eq("id", latestRecord.id);
        }
        await supabase.from("clients").update({ onboarding_step: "pending_age" }).eq("id", client.id);
        await replyMessage(replyToken, `体脂肪率 ${val}% を記録しました✅\n\n${ONBOARDING_QUESTIONS.pending_age}`);
      } else {
        await supabase.from("clients").update({ onboarding_step: "pending_age" }).eq("id", client.id);
        await replyMessage(replyToken, `わかりました！スキップします✅\n\n${ONBOARDING_QUESTIONS.pending_age}`);
      }
      break;
    }

    case "pending_age": {
      const val = parseInt(text.replace(/[^0-9]/g, ""), 10);
      if (isNaN(val) || val < 10 || val > 100) {
        await replyMessage(replyToken, `年齢は10〜100の数字で入力してください。\n例: 32\n\n${ONBOARDING_QUESTIONS.pending_age}`);
        return;
      }
      const birth_year = new Date().getFullYear() - val;
      await supabase.from("clients").update({ birth_year, onboarding_step: "pending_gender" }).eq("id", client.id);
      await replyMessage(replyToken, `${val}歳 を記録しました✅\n\n${ONBOARDING_QUESTIONS.pending_gender}`);
      break;
    }

    case "pending_gender": {
      let gender: "male" | "female" | "other" | null = null;
      if (/男性|男|male|m/i.test(text)) gender = "male";
      else if (/女性|女|female|f/i.test(text)) gender = "female";
      else if (/その他|other|x/i.test(text)) gender = "other";

      if (!gender) {
        await replyMessage(replyToken, `「男性」「女性」「その他」のいずれかを送ってください。\n\n${ONBOARDING_QUESTIONS.pending_gender}`);
        return;
      }
      const genderLabel = { male: "男性", female: "女性", other: "その他" }[gender];
      await supabase.from("clients").update({ gender, onboarding_step: "pending_health" }).eq("id", client.id);
      await replyMessage(replyToken, `${genderLabel} を記録しました✅\n\n${ONBOARDING_QUESTIONS.pending_health}`);
      break;
    }

    case "pending_health": {
      const concerns = /なし|none|特になし|ありません/i.test(text) ? null : text;
      const now = new Date().toISOString();
      await supabase.from("clients").update({
        health_concerns: concerns,
        onboarding_step: "intake_done",
        intake_completed_at: now,
      }).eq("id", client.id);

      // トレーナーにプッシュ通知
      await notifyTrainerIntakeComplete(client.id, client.name, supabase);

      await replyMessage(
        replyToken,
        `ご入力ありがとうございます！🎉\n\n以下のデータを受け取りました：\n📏 身長・体重・体脂肪率\n🎂 年齢・性別\n🏥 健康上の注意点\n\nトレーナーが確認の上、個別の目標プランをお送りします📊\nもうしばらくお待ちください🙏`
      );
      break;
    }
  }
}

// ── トレーナーへの通知 ────────────────────────────────────────────

async function notifyTrainerIntakeComplete(clientId: string, clientName: string, supabase: any) {
  const trainerLineId = process.env.TRAINER_LINE_USER_ID;
  if (!trainerLineId) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const dashUrl = `${appUrl}/trainer/clients/${clientId}`;

  await pushMessage(
    trainerLineId,
    `📋 ${clientName} さんの初回データ入力が完了しました！\n\n目標プランを設定してください：\n${dashUrl}`
  ).catch(() => {}); // 通知失敗はサイレント
}

// ── DB保存ヘルパー ────────────────────────────────────────────────

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

  const { error } = await supabase.from("training_sets").insert({
    session_id: session.id,
    exercise_name: data.activity_type,
    muscle_group: "有酸素",
    weight_kg: data.distance_km,
    reps: data.duration_seconds ? Math.round(data.duration_seconds / 60) : null,
    set_number: 1,
    rpe: null,
  });
  if (error) throw new Error(error.message);
}

// ── ユーティリティ ────────────────────────────────────────────────

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
        result.advice ? `\n💬 ${result.advice}` : null,
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
        result.advice ? `\n💬 ${result.advice}` : null,
      ].filter(Boolean).join("\n");
    }
    case "body": {
      const lines = [
        `✅ 体重・体組成を記録しました（${result.date}）`,
        `📱 ${result.source_app}`,
        result.weight_kg != null ? `⚖️ 体重: ${result.weight_kg}kg` : null,
        result.body_fat_pct != null ? `📉 体脂肪率: ${result.body_fat_pct}%` : null,
        result.muscle_mass_kg != null ? `💪 筋肉量: ${result.muscle_mass_kg}kg` : null,
        result.advice ? `\n💬 ${result.advice}` : null,
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
        result.advice ? `\n💬 ${result.advice}` : null,
      ].filter(Boolean);
      return lines.join("\n");
    }
  }
}
