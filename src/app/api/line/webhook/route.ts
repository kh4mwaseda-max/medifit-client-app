import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { verifyLineSignature, getMessageContent, replyMessage, pushMessage, inviteLinkMessage, loginLinkMessage } from "@/lib/line";
import { analyzeScreenshot, MealResult, TrainingResult, BodyResult, CardioResult } from "@/lib/image-analyzer";
import { incrementImageCount, getImageCount, checkAndWarnIfNearLimit } from "@/lib/line-usage";
import { randomMachoLine } from "@/lib/macho-quotes";
import { randomBytes } from "crypto";

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
  pending_activity:
    "🏃 普段の活動レベルを教えてください\n\n以下から数字を送ってください：\n1️⃣ 座りがち（デスクワーク中心）\n2️⃣ 軽め（週1〜2回の軽い運動）\n3️⃣ 適度（週3〜5回の運動）\n4️⃣ 活発（週6〜7回 or 肉体労働）",
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
    .select("id, name, line_user_id, onboarding_step, height_cm, pin, trainer_id, pending_image_data")
    .eq("line_user_id", lineUserId)
    .single();

  // ── 連携済みトレーナーかチェック ──
  const { data: trainerRows } = await supabase
    .from("trainers")
    .select("id, name")
    .eq("line_notify_user_id", lineUserId)
    .limit(1);
  const connectedTrainer = trainerRows?.[0] ?? null;

  // 連携済みトレーナーが「ログイン」を送った → マジックリンク発行
  if (connectedTrainer && message.type === "text" && message.text.trim() === "ログイン") {
    const magicToken = randomBytes(32).toString("hex");
    const magicExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10分
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    await supabase
      .from("trainers")
      .update({ magic_token: magicToken, magic_token_expires_at: magicExpires })
      .eq("id", connectedTrainer.id);

    await replyMessage(replyToken, loginLinkMessage(`${appUrl}/api/auth/magic?token=${magicToken}`));
    return;
  }

  // 連携済みトレーナーが「招待」を送った → 新クライアント招待リンク自動発行
  // ── 日付確認待ち ──
  if (client && client.onboarding_step === "pending_date") {
    if (message.type === "text") {
      await handleDateConfirm(supabase, client, message.text.trim(), replyToken);
      return;
    }
    if (message.type === "image") {
      await replyMessage(replyToken, `📅 先ほどの記録の日付を教えてください\n例: 昨日、4/9、4月9日`);
      return;
    }
    return;
  }

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

  // ── テキストメッセージ: トレーナーLINE連携コード or PIN登録 or 通常グリーティング ──
  if (message.type === "text") {
    const text: string = message.text.trim();

    // トレーナー連携コード（6桁英数字大文字）の検出
    const isTrainerCode = /^[A-Z0-9]{6}$/.test(text);
    if (isTrainerCode && !client) {
      const { data: trainerWithCode } = await supabase
        .from("trainers")
        .select("id, name, line_link_code_expires_at")
        .eq("line_link_code", text)
        .single();

      if (trainerWithCode) {
        const isExpired = new Date(trainerWithCode.line_link_code_expires_at) < new Date();
        if (isExpired) {
          await replyMessage(replyToken, "連携コードの有効期限が切れています。\nダッシュボードで新しいコードを発行してください。");
        } else {
          // LINE連携完了
          await supabase
            .from("trainers")
            .update({
              line_notify_user_id: lineUserId,
              line_link_code: null,
              line_link_code_expires_at: null,
            })
            .eq("id", trainerWithCode.id);

          const trainerUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/trainer`;
          await replyMessage(replyToken,
            `✅ LINE通知の連携が完了しました！\n\n${trainerWithCode.name} さん、ようこそ Client Fit へ！\n\n【これからの流れ】\n1️⃣ 管理画面の「＋追加」でクライアントを登録\n2️⃣ 案内文をコピーしてクライアントへ送信\n3️⃣ クライアントがPINを公式LINEに送ると自動連携\n4️⃣ クライアントが基礎データを入力 → ここに通知\n5️⃣ アセスメント生成 → 目標設定 → LINEで送信\n\n📋 管理画面\n${trainerUrl}`
          );
        }
        return;
      }
    }

    const isPinLike = /^\d{4,6}$/.test(text);

    // 既に連携済みのユーザーはPIN再登録させない
    if (client) {
      // onboarding_stepがnull（異常状態）→ オンボーディング再開
      if (!client.onboarding_step) {
        await supabase.from("clients").update({ onboarding_step: "pending_height" }).eq("id", client.id);
        await replyMessage(replyToken, `${client.name} さん、引き続きよろしくお願いします！\n初回データを入力してください。\n\n${ONBOARDING_QUESTIONS.pending_height}`);
      } else {
        await replyMessage(
          replyToken,
          `${client.name} さん、こんにちは！\n食事・筋トレ・体重・ランニングなど、フィットネスアプリのスクリーンショットを送ってください📸\n自動でダッシュボードに記録します✅`
        );
      }
      return;
    }

    if (!isPinLike) {
      await replyMessage(
        replyToken,
        "はじめまして！\nトレーナーから共有された4〜6桁のPINコードを送ってください🔑"
      );
      return;
    }

    // PINコード受信 → クライアント検索＆紐付け（未連携ユーザーのみ）
    const { data: pinClient } = await supabase
      .from("clients")
      .select("id, name, line_user_id, trainer_id, goal")
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

    // トレーナー名を取得
    const { data: pinTrainer } = await supabase
      .from("trainers")
      .select("name")
      .eq("id", pinClient.trainer_id)
      .single();
    const trainerName = pinTrainer?.name ?? "トレーナー";

    // 一言メッセージ（goal フィールド）
    const goalLine = (pinClient as any).goal ? `\n\n💬 ${trainerName}より: ${(pinClient as any).goal}` : "";

    await replyMessage(
      replyToken,
      `${pinClient.name} さん、LINE連携完了です🎉\n\n${trainerName} トレーナーがあなたを招待しました。\n最適なプランを一緒に作っていきましょう！${goalLine}\n\n━━━━━━━━━━━━\n初回のデータを入力していただきます（約2分）\n\n${ONBOARDING_QUESTIONS.pending_height}`
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

    // 月間画像送信上限チェック（トレーナー単位・150枚/月）
    const currentCount = await getImageCount(client.trainer_id);
    if (currentCount >= 150) {
      const { data: trainerForBlock } = await supabase
        .from("trainers")
        .select("line_notify_user_id")
        .eq("id", client.trainer_id)
        .single();
      await checkAndWarnIfNearLimit(client.trainer_id, currentCount, trainerForBlock?.line_notify_user_id, undefined, client.line_user_id);
      await replyMessage(replyToken, `${client.name} さん、今月の記録上限（150枚）に達しました📊\n来月またお送りください🙏`);
      return;
    }

    // 重複チェック（同じLINEメッセージIDは処理済みとしてスキップ）
    const { count: alreadyProcessed } = await supabase
      .from("line_parse_logs")
      .select("id", { count: "exact", head: true })
      .eq("line_message_id", message.id);
    if ((alreadyProcessed ?? 0) > 0) {
      await replyMessage(replyToken, "この画像はすでに記録済みです✅");
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

    // 日付が読み取れなかった場合は確認を求める
    if (!result.date) {
      await supabase.from("clients").update({
        pending_image_data: result,
        onboarding_step: "pending_date",
      }).eq("id", client.id);
      await replyMessage(replyToken, `📅 記録を読み取りました！\nこのデータは何日のものですか？\n例: 昨日、4/9、4月9日`);
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

      // 画像送信カウントをインクリメントし、上限に近づいたらトレーナー・クライアントへ警告
      try {
        const newCount = await incrementImageCount(client.trainer_id);
        const { data: trainerForWarn } = await supabase
          .from("trainers")
          .select("line_notify_user_id")
          .eq("id", client.trainer_id)
          .single();
        const usageStatus = await checkAndWarnIfNearLimit(client.trainer_id, newCount, trainerForWarn?.line_notify_user_id, undefined, client.line_user_id);
        // クライアントへも残り枚数を通知（警告しきい値に達したとき）
        if (usageStatus === "warn" && client.line_user_id) {
          const remaining = 150 - newCount;
          await pushMessage(
            client.line_user_id,
            `⚠️ 今月の記録送信が${newCount}枚になりました。上限150枚まであと${remaining}枚です。\n月をまたいだらリセットされます📅`
          ).catch((e) => console.error("[line-usage] push client warn error:", e));
        }
      } catch (usageErr: any) {
        console.error("[line-usage] count increment error:", usageErr?.message);
      }

      // 個別通知はスパムになるので送らない（毎朝の日次サマリーで集約）
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

// ── 日付確認処理 ─────────────────────────────────────────────────

async function handleDateConfirm(supabase: any, client: any, text: string, replyToken: string) {
  const date = parseUserDate(text);
  if (!date) {
    await replyMessage(replyToken, `日付が読み取れませんでした😅\n以下の形式で送ってください：\n例: 昨日、一昨日、4/9、4月9日`);
    return;
  }

  const pendingData = client.pending_image_data;
  if (!pendingData) {
    await supabase.from("clients").update({ onboarding_step: null }).eq("id", client.id);
    await replyMessage(replyToken, `保存するデータが見つかりませんでした。もう一度スクショを送ってください。`);
    return;
  }

  const dataWithDate = { ...pendingData, date };

  try {
    if (dataWithDate.app_type === "meal")     await saveMealData(supabase, client.id, dataWithDate);
    if (dataWithDate.app_type === "training") await saveTrainingData(supabase, client.id, dataWithDate);
    if (dataWithDate.app_type === "body")     await saveBodyData(supabase, client.id, dataWithDate);
    if (dataWithDate.app_type === "cardio")   await saveCardioData(supabase, client.id, dataWithDate);

    await supabase.from("clients").update({ pending_image_data: null, onboarding_step: null }).eq("id", client.id);
    await replyMessage(replyToken, `${date} の記録を保存しました✅`);
  } catch {
    await replyMessage(replyToken, "保存に失敗しました。もう一度スクショを送ってください。");
  }
}

function parseUserDate(text: string): string | null {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  if (/今日|きょう/.test(text)) return fmt(today);
  if (/昨日|きのう/.test(text)) { today.setDate(today.getDate() - 1); return fmt(today); }
  if (/一昨日|おととい/.test(text)) { today.setDate(today.getDate() - 2); return fmt(today); }

  // 4/9 or 4月9日
  const m = text.match(/(\d{1,2})[\/月](\d{1,2})/);
  if (m) {
    const month = parseInt(m[1]);
    const day = parseInt(m[2]);
    const year = today.getFullYear();
    const d = new Date(year, month - 1, day);
    if (!isNaN(d.getTime())) return fmt(d);
  }
  return null;
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
      await supabase.from("clients").update({
        health_concerns: concerns,
        onboarding_step: "pending_activity",
      }).eq("id", client.id);
      await replyMessage(replyToken, `${concerns ? `「${concerns}」を記録しました✅` : "わかりました✅"}\n\n${ONBOARDING_QUESTIONS.pending_activity}`);
      break;
    }

    case "pending_activity": {
      const activityMap: Record<string, string> = {
        "1": "sedentary",
        "2": "light",
        "3": "moderate",
        "4": "active",
        "座りがち": "sedentary",
        "軽め": "light",
        "適度": "moderate",
        "活発": "active",
      };
      const key = text.replace(/[①②③④]/g, (c) => ({ "①": "1", "②": "2", "③": "3", "④": "4" }[c] ?? c));
      const activityLevel = activityMap[key] ?? activityMap[key.charAt(0)];

      if (!activityLevel) {
        await replyMessage(replyToken, `1〜4の数字で送ってください。\n\n${ONBOARDING_QUESTIONS.pending_activity}`);
        return;
      }

      const activityLabel: Record<string, string> = {
        sedentary: "座りがち",
        light: "軽め",
        moderate: "適度",
        active: "活発",
      };

      const now = new Date().toISOString();
      await supabase.from("clients").update({
        activity_level: activityLevel,
        onboarding_step: "intake_done",
        intake_completed_at: now,
      }).eq("id", client.id);

      // トレーナーにプッシュ通知
      await notifyTrainerIntakeComplete(client.id, client.name, client.trainer_id, supabase, client.line_user_id);

      // 最新の体重・体脂肪率を取得してサマリーに含める
      const { data: bodyRecord } = await supabase
        .from("body_records")
        .select("weight_kg, body_fat_pct")
        .eq("client_id", client.id)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .single();

      const { data: latestClient } = await supabase
        .from("clients")
        .select("height_cm, birth_year, gender, health_concerns")
        .eq("id", client.id)
        .single();

      // トレーナー名を取得
      const { data: trainerForSummary } = await supabase
        .from("trainers")
        .select("name")
        .eq("id", client.trainer_id)
        .single();
      const trainerNameForSummary = trainerForSummary?.name ?? "トレーナー";

      const age = latestClient?.birth_year ? new Date().getFullYear() - latestClient.birth_year : null;
      const genderLabel = latestClient?.gender === "male" ? "男性" : latestClient?.gender === "female" ? "女性" : "その他";

      const summaryLines = [
        `ご入力ありがとうございます！🎉`,
        ``,
        `📋 入力内容の確認：`,
        latestClient?.height_cm ? `📏 身長: ${latestClient.height_cm}cm` : null,
        bodyRecord?.weight_kg ? `⚖️ 体重: ${bodyRecord.weight_kg}kg` : null,
        bodyRecord?.body_fat_pct ? `📉 体脂肪率: ${bodyRecord.body_fat_pct}%` : null,
        age ? `🎂 年齢: ${age}歳` : null,
        latestClient?.gender ? `👤 性別: ${genderLabel}` : null,
        `🏃 活動レベル: ${activityLabel[activityLevel]}`,
        latestClient?.health_concerns ? `🏥 健康上の注意: ${latestClient.health_concerns}` : `🏥 健康上の注意: なし`,
        ``,
        `${trainerNameForSummary} トレーナーが確認の上、個別の目標プランをお送りします📊\nもうしばらくお待ちください🙏`,
      ].filter(Boolean).join("\n");

      await replyMessage(replyToken, summaryLines);
      break;
    }
  }
}

// ── トレーナーへの通知 ────────────────────────────────────────────

async function notifyTrainerIntakeComplete(clientId: string, clientName: string, trainerId: string, supabase: any, clientLineUserId?: string) {
  const { data: trainer } = await supabase
    .from("trainers")
    .select("line_notify_user_id")
    .eq("id", trainerId)
    .single();

  // ソロテストモード: トレーナー通知もクライアントのLINEに送る
  const isSolo = process.env.SOLO_TEST_MODE === "true";
  const trainerLineId: string | null = isSolo
    ? (clientLineUserId ?? trainer?.line_notify_user_id ?? null)
    : (trainer?.line_notify_user_id ?? null);
  if (!trainerLineId) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const dashUrl = `${appUrl}/trainer/clients/${clientId}`;

  await pushMessage(
    trainerLineId,
    `${isSolo ? "【トレーナー通知】" : ""}📋 ${clientName}さんの初回データ入力が完了しました！\n\n目標プランを設定してください👇\n${dashUrl}`
  ).catch(() => {});
}

async function notifyTrainerScreenshot(
  trainerId: string,
  clientId: string,
  clientName: string,
  appType: string,
  supabase: any,
  clientLineUserId?: string,
) {
  if (!trainerId) return;

  const { data: trainer } = await supabase
    .from("trainers")
    .select("line_notify_user_id")
    .eq("id", trainerId)
    .single();

  // ソロテストモード: トレーナー通知もクライアントのLINEに送る
  const isSolo = process.env.SOLO_TEST_MODE === "true";
  const trainerLineId: string | null = isSolo
    ? (clientLineUserId ?? trainer?.line_notify_user_id ?? null)
    : (trainer?.line_notify_user_id ?? null);
  if (!trainerLineId) return;

  const typeLabel: Record<string, string> = {
    meal: "食事記録",
    training: "トレーニング",
    body: "体重・体組成",
    cardio: "有酸素運動",
  };
  const label = typeLabel[appType] ?? "記録";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const dashUrl = `${appUrl}/trainer/clients/${clientId}`;

  await pushMessage(
    trainerLineId,
    `${isSolo ? "【トレーナー通知】" : ""}📲 ${clientName} さんが${label}を記録しました\n${dashUrl}`
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
    const { error } = await supabase
      .from("meal_records")
      .upsert(records, { onConflict: "client_id,meal_date,meal_type,food_name" });
    if (error) throw new Error(error.message);
  }
}

async function saveTrainingData(supabase: any, clientId: string, data: TrainingResult) {
  // 同日のセッションを使い回す（なければ作成）
  const { data: session, error: sessionError } = await supabase
    .from("training_sessions")
    .upsert(
      { client_id: clientId, session_date: data.date, notes: data.notes },
      { onConflict: "client_id,session_date,notes" }
    )
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
    const { error } = await supabase
      .from("training_sets")
      .upsert(sets, { onConflict: "session_id,exercise_name,set_number" });
    if (error) throw new Error(error.message);
  }
}

async function saveBodyData(supabase: any, clientId: string, data: BodyResult) {
  const { error } = await supabase
    .from("body_records")
    .upsert(
      { client_id: clientId, recorded_at: data.date, weight_kg: data.weight_kg, body_fat_pct: data.body_fat_pct, muscle_mass_kg: data.muscle_mass_kg },
      { onConflict: "client_id,recorded_at" }
    );
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
        `\n${randomMachoLine()}`,
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
