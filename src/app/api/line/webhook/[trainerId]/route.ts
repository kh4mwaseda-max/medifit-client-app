/**
 * トレーナー専用動的Webhook
 * /api/line/webhook/[trainerId]
 * 各トレーナーが自分のLINE公式アカウントのWebhook URLにこれを設定する
 */
import { NextRequest, NextResponse, after } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { verifyLineSignature, getMessageContent, replyMessage, pushMessage } from "@/lib/line";
import { analyzeScreenshot, MealResult, TrainingResult, BodyResult, CardioResult } from "@/lib/image-analyzer";
import { incrementImageCount, getImageCount, checkAndWarnIfNearLimit } from "@/lib/line-usage";
import { randomMachoLine } from "@/lib/macho-quotes";

interface RouteParams { params: Promise<{ trainerId: string }> }

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { trainerId } = await params;
  const rawBody = await req.text();
  const signature = req.headers.get("x-line-signature") ?? "";

  // トレーナーのLINE credentials取得
  const supabase = createServerClient();
  const { data: trainer } = await supabase
    .from("trainers")
    .select("id, line_channel_access_token, line_channel_secret, line_notify_user_id, plan")
    .eq("id", trainerId)
    .single();

  if (!trainer) return NextResponse.json({ error: "Trainer not found" }, { status: 404 });

  // credentials: トレーナー独自設定 → フォールバックは env（稲川さん本人用）
  const token  = trainer.line_channel_access_token ?? process.env.LINE_CHANNEL_ACCESS_TOKEN!;
  const secret = trainer.line_channel_secret        ?? process.env.LINE_CHANNEL_SECRET!;

  if (!verifyLineSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody);
  const events: any[] = body.events ?? [];

  // LINE Webhookは10秒以内のレスポンスが必須。
  // Claude Vision解析は時間がかかるため、即200返却してバックグラウンドで処理する。
  after(async () => {
    const results = await Promise.allSettled(events.map((e) => handleEvent(e, trainerId, token, supabase)));
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(`[webhook ${trainerId}] event#${i} failed:`, r.reason);
      }
    });
  });

  return NextResponse.json({ ok: true });
}

// ── オンボーディング質問文 ───────────────────────────────────────────

const ONBOARDING_QUESTIONS: Record<string, string> = {
  pending_height:    "📏 身長を教えてください（cm）\n例: 175",
  pending_weight:    "⚖️ 現在の体重を教えてください（kg）\n例: 75.5",
  pending_body_fat:  "📊 体脂肪率はわかりますか？\n例: 18.5\n\n※ わからない場合は「スキップ」と送ってください",
  pending_age:       "🎂 年齢を教えてください\n例: 32",
  pending_gender:    "👤 性別を教えてください\n「男性」「女性」「その他」のいずれかを送ってください",
  pending_health:    "🏥 健康上の注意点や持病はありますか？\n例: 膝が弱い、高血圧\n\n※ 特になければ「なし」と送ってください",
};

// ── イベントハンドラ ────────────────────────────────────────────────

async function handleEvent(event: any, trainerId: string, token: string, supabase: any) {
  const { type, replyToken, source, message } = event;
  if (type !== "message") return;

  const lineUserId: string = source?.userId;
  if (!lineUserId) return;

  // このトレーナーのクライアントかチェック
  const { data: client } = await supabase
    .from("clients")
    .select("id, name, line_user_id, onboarding_step, height_cm, pin")
    .eq("line_user_id", lineUserId)
    .eq("trainer_id", trainerId)
    .single();

  // オンボーディング進行中
  if (client?.onboarding_step?.startsWith("pending_")) {
    if (message.type === "image") {
      await replyMessage(replyToken, `📝 まず質問にお答えください：\n\n${ONBOARDING_QUESTIONS[client.onboarding_step]}`, token);
      return;
    }
    if (message.type === "text") {
      await handleOnboardingStep(supabase, client, message.text.trim(), replyToken, trainerId, token);
      return;
    }
    return;
  }

  // intake_done: プラン待ち
  if (client?.onboarding_step === "intake_done") {
    await replyMessage(replyToken,
      `${client.name} さん、トレーナーがデータを確認中です📊\nプランが決まり次第お知らせします🙏`, token);
    return;
  }

  // テキスト: PIN登録
  if (message.type === "text") {
    const text: string = message.text.trim();

    if (!/^\d{4,6}$/.test(text)) {
      if (client) {
        await replyMessage(replyToken,
          `${client.name} さん、こんにちは！\nフィットネスアプリのスクリーンショットを送ってください📸`, token);
      } else {
        await replyMessage(replyToken,
          "はじめまして！\nトレーナーから共有された4〜6桁のPINコードを送ってください🔑", token);
      }
      return;
    }

    // PINコード → このトレーナーのクライアントで検索
    const { data: pinClient } = await supabase
      .from("clients")
      .select("id, name, line_user_id")
      .eq("pin", text)
      .eq("trainer_id", trainerId)
      .single();

    if (!pinClient) {
      await replyMessage(replyToken, "PINコードが正しくありません。トレーナーに確認してください。", token);
      return;
    }
    if (pinClient.line_user_id && pinClient.line_user_id !== lineUserId) {
      await replyMessage(replyToken, "このPINは既に別のアカウントで登録済みです。", token);
      return;
    }

    await supabase.from("clients")
      .update({ line_user_id: lineUserId, onboarding_step: "pending_height" })
      .eq("id", pinClient.id);

    await replyMessage(replyToken,
      `${pinClient.name} さん、LINE連携完了です🎉\n\n初回データを入力します（約2分）\n\n${ONBOARDING_QUESTIONS.pending_height}`, token);
    return;
  }

  // 画像: スクリーンショット解析
  if (message.type === "image") {
    if (!client) {
      await replyMessage(replyToken, "まだ連携されていません。PINコードを送ってください🔑", token);
      return;
    }

    // 月間画像送信上限チェック（トレーナー単位）
    const currentCount = await getImageCount(trainerId);
    if (currentCount >= 150) {
      const { data: trainerForBlock } = await supabase
        .from("trainers")
        .select("line_notify_user_id, line_channel_access_token")
        .eq("id", trainerId)
        .single();
      await checkAndWarnIfNearLimit(
        trainerId,
        currentCount,
        trainerForBlock?.line_notify_user_id,
        trainerForBlock?.line_channel_access_token ?? token,
        client.line_user_id
      );
      await replyMessage(replyToken, "今月の画像送信上限（150枚）に達しました📊\n来月またお送りください🙏", token);
      return;
    }

    let imageBuffer: ArrayBuffer;
    try {
      imageBuffer = await getMessageContent(message.id, token);
    } catch {
      await replyMessage(replyToken, "画像の取得に失敗しました。もう一度送ってください。", token);
      return;
    }

    let result: Awaited<ReturnType<typeof analyzeScreenshot>>;
    try {
      result = await analyzeScreenshot(imageBuffer);
    } catch (e: any) {
      await supabase.from("line_parse_logs").insert({
        client_id: client.id, line_message_id: message.id,
        app_type: "unknown", raw_json: null, status: "failed",
        error_message: e?.message ?? "Claude解析エラー",
      });
      await replyMessage(replyToken, "画像の解析に失敗しました。", token);
      return;
    }

    if (result.app_type === "unknown") {
      await supabase.from("line_parse_logs").insert({
        client_id: client.id, line_message_id: message.id,
        app_type: "unknown", raw_json: result as any, status: "failed",
        error_message: (result as any).reason,
      });
      await replyMessage(replyToken,
        `スクリーンショットを認識できませんでした🙏\n\n対応アプリ:\n🍽 食事: あすけん・MyFitnessPal 等\n💪 筋トレ: 筋トレメモ・Hevy 等\n⚖️ 体重: タニタ・Withings 等\n🏃 有酸素: Strava・Garmin 等`, token);
      return;
    }

    try {
      if (result.app_type === "meal")     await saveMealData(supabase, client.id, result);
      if (result.app_type === "training") await saveTrainingData(supabase, client.id, result);
      if (result.app_type === "body")     await saveBodyData(supabase, client.id, result);
      if (result.app_type === "cardio")   await saveCardioData(supabase, client.id, result);

      await supabase.from("line_parse_logs").insert({
        client_id: client.id, line_message_id: message.id,
        app_type: result.app_type, raw_json: result as any, status: "success",
      });

      // 画像送信カウントをインクリメントし、上限に近づいたらトレーナー・クライアントへ警告
      try {
        const newCount = await incrementImageCount(trainerId);
        const { data: trainerForWarn } = await supabase
          .from("trainers")
          .select("line_notify_user_id, line_channel_access_token")
          .eq("id", trainerId)
          .single();
        const usageStatus = await checkAndWarnIfNearLimit(
          trainerId,
          newCount,
          trainerForWarn?.line_notify_user_id,
          trainerForWarn?.line_channel_access_token ?? token,
          client.line_user_id
        );
        // クライアントへも残り枚数を通知（警告しきい値に達したとき）
        if (usageStatus === "warn" && client.line_user_id) {
          const remaining = 150 - newCount;
          await pushMessage(
            client.line_user_id,
            `⚠️ 今月の記録送信が${newCount}枚になりました。上限150枚まであと${remaining}枚です。\n月をまたいだらリセットされます📅`,
            token
          ).catch((e) => console.error("[line-usage] push client warn error:", e));
        }
      } catch (usageErr: any) {
        console.error("[line-usage] count increment error:", usageErr?.message);
      }

      await replyMessage(replyToken, buildConfirmMessage(result), token);
    } catch (e: any) {
      await supabase.from("line_parse_logs").insert({
        client_id: client.id, line_message_id: message.id,
        app_type: result.app_type, raw_json: result as any, status: "failed",
        error_message: e?.message ?? "DB保存エラー",
      });
      await replyMessage(replyToken, "記録の保存に失敗しました。", token);
    }
  }
}

// ── オンボーディング ─────────────────────────────────────────────────

async function handleOnboardingStep(supabase: any, client: any, text: string, replyToken: string, trainerId: string, token: string) {
  const step = client.onboarding_step;

  switch (step) {
    case "pending_height": {
      const val = parseFloat(text.replace(/[^0-9.]/g, ""));
      if (isNaN(val) || val < 50 || val > 250) {
        await replyMessage(replyToken, `身長は50〜250cmで入力してください。\n${ONBOARDING_QUESTIONS.pending_height}`, token); return;
      }
      await supabase.from("clients").update({ height_cm: val, onboarding_step: "pending_weight" }).eq("id", client.id);
      await replyMessage(replyToken, `身長 ${val}cm ✅\n\n${ONBOARDING_QUESTIONS.pending_weight}`, token);
      break;
    }
    case "pending_weight": {
      const val = parseFloat(text.replace(/[^0-9.]/g, ""));
      if (isNaN(val) || val < 20 || val > 300) {
        await replyMessage(replyToken, `体重は20〜300kgで入力してください。\n${ONBOARDING_QUESTIONS.pending_weight}`, token); return;
      }
      await supabase.from("body_records").insert({
        client_id: client.id, recorded_at: new Date().toISOString().split("T")[0], weight_kg: val,
      });
      await supabase.from("clients").update({ onboarding_step: "pending_body_fat" }).eq("id", client.id);
      await replyMessage(replyToken, `体重 ${val}kg ✅\n\n${ONBOARDING_QUESTIONS.pending_body_fat}`, token);
      break;
    }
    case "pending_body_fat": {
      const isSkip = /スキップ|skip|わからない|不明/i.test(text);
      if (!isSkip) {
        const val = parseFloat(text.replace(/[^0-9.]/g, ""));
        if (isNaN(val) || val < 1 || val > 60) {
          await replyMessage(replyToken, `体脂肪率は1〜60%で入力するか「スキップ」と送ってください。`, token); return;
        }
        const { data: rec } = await supabase.from("body_records").select("id").eq("client_id", client.id).order("recorded_at", { ascending: false }).limit(1).single();
        if (rec) await supabase.from("body_records").update({ body_fat_pct: val }).eq("id", rec.id);
        await supabase.from("clients").update({ onboarding_step: "pending_age" }).eq("id", client.id);
        await replyMessage(replyToken, `体脂肪率 ${val}% ✅\n\n${ONBOARDING_QUESTIONS.pending_age}`, token);
      } else {
        await supabase.from("clients").update({ onboarding_step: "pending_age" }).eq("id", client.id);
        await replyMessage(replyToken, `スキップ ✅\n\n${ONBOARDING_QUESTIONS.pending_age}`, token);
      }
      break;
    }
    case "pending_age": {
      const val = parseInt(text.replace(/[^0-9]/g, ""), 10);
      if (isNaN(val) || val < 10 || val > 100) {
        await replyMessage(replyToken, `年齢は10〜100の数字で入力してください。`, token); return;
      }
      await supabase.from("clients").update({ birth_year: new Date().getFullYear() - val, onboarding_step: "pending_gender" }).eq("id", client.id);
      await replyMessage(replyToken, `${val}歳 ✅\n\n${ONBOARDING_QUESTIONS.pending_gender}`, token);
      break;
    }
    case "pending_gender": {
      let gender: string | null = null;
      if (/男性|男|male/i.test(text)) gender = "male";
      else if (/女性|女|female/i.test(text)) gender = "female";
      else if (/その他|other/i.test(text)) gender = "other";
      if (!gender) { await replyMessage(replyToken, `「男性」「女性」「その他」で送ってください。`, token); return; }
      const label = { male: "男性", female: "女性", other: "その他" }[gender]!;
      await supabase.from("clients").update({ gender, onboarding_step: "pending_health" }).eq("id", client.id);
      await replyMessage(replyToken, `${label} ✅\n\n${ONBOARDING_QUESTIONS.pending_health}`, token);
      break;
    }
    case "pending_health": {
      const concerns = /なし|none|特になし|ありません/i.test(text) ? null : text;
      await supabase.from("clients").update({
        health_concerns: concerns, onboarding_step: "intake_done",
        intake_completed_at: new Date().toISOString(),
      }).eq("id", client.id);

      // トレーナーに通知（ソロテストモード: クライアントのLINEに送る）
      const { data: tr } = await supabase.from("trainers").select("line_notify_user_id, line_channel_access_token").eq("id", trainerId).single();
      const isSolo = process.env.SOLO_TEST_MODE === "true";
      const notifyTarget = isSolo ? client.line_user_id : tr?.line_notify_user_id;
      if (notifyTarget) {
        const notifyToken = tr?.line_channel_access_token ?? process.env.LINE_CHANNEL_ACCESS_TOKEN!;
        const url = `${process.env.NEXT_PUBLIC_APP_URL}/trainer/clients/${client.id}`;
        await pushMessage(notifyTarget,
          `${isSolo ? "【トレーナー通知】" : ""}📋 ${client.name} さんの初回データ入力が完了しました！\n目標プランを設定してください：\n${url}`, notifyToken).catch(() => {});
      }

      await replyMessage(replyToken,
        `ご入力ありがとうございます！🎉\n\nデータを受け取りました。トレーナーが個別の目標プランをお送りします📊\nもうしばらくお待ちください🙏`, token);
      break;
    }
  }
}

// ── DB保存 ──────────────────────────────────────────────────────────

async function saveMealData(supabase: any, clientId: string, data: MealResult) {
  const records = data.meals.map((m) => ({
    client_id: clientId, meal_date: data.date, meal_type: m.meal_type,
    food_name: m.food_name, calories: m.calories,
    protein_g: m.protein_g, fat_g: m.fat_g, carbs_g: m.carbs_g,
  }));
  if (records.length > 0) { const { error } = await supabase.from("meal_records").insert(records); if (error) throw new Error(error.message); }
}

async function saveTrainingData(supabase: any, clientId: string, data: TrainingResult) {
  const { data: session, error } = await supabase.from("training_sessions")
    .insert({ client_id: clientId, session_date: data.date, notes: data.notes }).select().single();
  if (error) throw new Error(error.message);
  const sets = data.sets.map((s) => ({ session_id: session.id, exercise_name: s.exercise_name, muscle_group: s.muscle_group, weight_kg: s.weight_kg, reps: s.reps, set_number: s.set_number, rpe: s.rpe ?? null }));
  if (sets.length > 0) { const { error: e } = await supabase.from("training_sets").insert(sets); if (e) throw new Error(e.message); }
}

async function saveBodyData(supabase: any, clientId: string, data: BodyResult) {
  const { error } = await supabase.from("body_records").insert({ client_id: clientId, recorded_at: data.date, weight_kg: data.weight_kg, body_fat_pct: data.body_fat_pct, muscle_mass_kg: data.muscle_mass_kg });
  if (error) throw new Error(error.message);
}

async function saveCardioData(supabase: any, clientId: string, data: CardioResult) {
  const notes = [data.distance_km != null ? `距離: ${data.distance_km}km` : null, data.duration_seconds != null ? `時間: ${fmtDur(data.duration_seconds)}` : null, data.calories != null ? `消費: ${data.calories}kcal` : null].filter(Boolean).join(" / ");
  const { data: session, error } = await supabase.from("training_sessions").insert({ client_id: clientId, session_date: data.date, notes }).select().single();
  if (error) throw new Error(error.message);
  await supabase.from("training_sets").insert({ session_id: session.id, exercise_name: data.activity_type, muscle_group: "有酸素", weight_kg: data.distance_km, reps: data.duration_seconds ? Math.round(data.duration_seconds / 60) : null, set_number: 1 });
}

function fmtDur(s: number) { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60; return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`; }
function fmtPace(s: number) { return `${Math.floor(s / 60)}'${String(s % 60).padStart(2, "0")}`; }

function buildConfirmMessage(result: MealResult | TrainingResult | BodyResult | CardioResult): string {
  switch (result.app_type) {
    case "meal": return [`✅ 食事記録を保存しました（${result.date}）`, result.total_calories != null ? `🔥 ${result.total_calories} kcal` : null, result.total_protein_g != null ? `💪 P: ${result.total_protein_g}g` : null, `📊 ${result.meals.length}品目`, result.advice ? `\n💬 ${result.advice}` : null].filter(Boolean).join("\n");
    case "training": return [`✅ トレーニングを記録しました（${result.date}）`, `💪 ${[...new Set(result.sets.map((s) => s.exercise_name))].join("・")}`, `📊 ${result.sets.length}セット`, result.advice ? `\n💬 ${result.advice}` : null, `\n${randomMachoLine()}`].filter(Boolean).join("\n");
    case "body": return [`✅ 体重・体組成を記録しました（${result.date}）`, result.weight_kg != null ? `⚖️ ${result.weight_kg}kg` : null, result.body_fat_pct != null ? `📉 ${result.body_fat_pct}%` : null, result.advice ? `\n💬 ${result.advice}` : null].filter(Boolean).join("\n");
    case "cardio": return [`✅ ${result.activity_type}を記録しました（${result.date}）`, result.distance_km != null ? `📍 ${result.distance_km}km` : null, result.duration_seconds != null ? `⏱ ${fmtDur(result.duration_seconds)}` : null, result.pace_sec_per_km != null ? `🏃 ${fmtPace(result.pace_sec_per_km)}/km` : null].filter(Boolean).join("\n");
  }
}
