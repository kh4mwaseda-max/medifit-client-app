import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase";
import { getTrainerId, verifyClientOwnership } from "@/lib/trainer-auth";

const anthropic = new Anthropic();

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "座りがち（PAL 1.4）",
  light: "軽め（PAL 1.6）",
  moderate: "適度（PAL 1.75）",
  active: "活発（PAL 1.9）",
};

const ACTIVITY_PAL: Record<string, number> = {
  sedentary: 1.4,
  light: 1.6,
  moderate: 1.75,
  active: 1.9,
};

// ハリス・ベネディクト改良式（Mifflin-St Jeor）
function calcBMR(weightKg: number, heightCm: number, ageYears: number, gender: string): number {
  if (gender === "female") {
    return 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5;
}

export async function POST(req: NextRequest) {
  const trainerId = await getTrainerId();
  if (!trainerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId, targetWeightKg, targetBodyFatPct, targetDate } = await req.json();
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  const ownership = await verifyClientOwnership(trainerId, clientId);
  if (!ownership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createServerClient();

  const [clientRes, bodyRes] = await Promise.all([
    supabase.from("clients").select("name, goal, height_cm, birth_year, gender, health_concerns, activity_level").eq("id", clientId).single(),
    supabase.from("body_records").select("weight_kg, body_fat_pct").eq("client_id", clientId).order("recorded_at", { ascending: false }).limit(1).single(),
  ]);

  const c = clientRes.data;
  const body = bodyRes.data;
  if (!c) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const age = c.birth_year ? new Date().getFullYear() - c.birth_year : null;
  const pal = ACTIVITY_PAL[c.activity_level ?? "moderate"] ?? 1.75;

  // 期間（達成日までの日数）を計算
  let periodDays: number | null = null;
  let periodLabel: string | null = null;
  if (targetDate) {
    const diffMs = new Date(targetDate).getTime() - Date.now();
    periodDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    if (periodDays < 60) {
      periodLabel = `約${periodDays}日`;
    } else if (periodDays < 365) {
      periodLabel = `約${Math.round(periodDays / 30)}ヶ月`;
    } else {
      const years = Math.floor(periodDays / 365);
      const months = Math.round((periodDays % 365) / 30);
      periodLabel = months > 0 ? `約${years}年${months}ヶ月` : `約${years}年`;
    }
  }

  // 目標体重との差分
  const weightDiffKg = body?.weight_kg && targetWeightKg ? Math.round((targetWeightKg - body.weight_kg) * 10) / 10 : null;

  // 基礎代謝・TDEE計算
  let bmr: number | null = null;
  let tdee: number | null = null;
  if (body?.weight_kg && c.height_cm && age && c.gender) {
    bmr = Math.round(calcBMR(body.weight_kg, c.height_cm, age, c.gender));
    tdee = Math.round(bmr * pal);
  }

  const prompt = `
あなたはパーソナルトレーナーのアシスタントAIです。
以下のクライアント情報と目標に基づいて、栄養・トレーニング目標を提案してください。

【クライアント情報】
- 名前: ${c.name}
- 身長: ${c.height_cm ?? "不明"}cm
- 現在体重: ${body?.weight_kg ?? "不明"}kg
- 現在体脂肪率: ${body?.body_fat_pct ?? "不明"}%
- 年齢: ${age ?? "不明"}歳
- 性別: ${c.gender === "male" ? "男性" : c.gender === "female" ? "女性" : "その他/不明"}
- 活動レベル: ${ACTIVITY_LABELS[c.activity_level ?? "moderate"] ?? "適度"}
- 健康上の注意: ${c.health_concerns ?? "なし"}
- 一言（本人の目標）: ${c.goal ?? "未設定"}

【計算値】
- 基礎代謝(BMR): ${bmr ?? "計算不可"} kcal
- 総消費カロリー(TDEE): ${tdee ?? "計算不可"} kcal

【トレーナーが設定した目標】
- 目標体重: ${targetWeightKg ?? "未設定"}kg${weightDiffKg != null ? `（現在から${weightDiffKg > 0 ? "+" : ""}${weightDiffKg}kg）` : ""}
- 目標体脂肪率: ${targetBodyFatPct ?? "未設定"}%
- 目標達成日: ${targetDate ?? "未設定"}
- 達成までの期間: ${periodLabel ?? "未設定"}${periodDays != null ? `（${periodDays}日間）` : ""}

【超重要・厳守事項】
- roadmap_text には必ず「達成までの期間: ${periodLabel ?? "未設定"}」を正確に反映すること
- 期間を勝手に変更したり「1年で」「1年半で」などと適当な期間を書くことは絶対禁止
- 例: 期間が3ヶ月なら「3ヶ月で◯kg減量」、6ヶ月なら「6ヶ月で◯kg減量」と必ず一致させる
- 達成可能性に懸念がある場合でも、トレーナーが設定した期間を尊重し、その期間内の現実的なアプローチを提案すること

以下のJSONフォーマットで回答してください（日本語）。数値は整数または小数で返してください:
{
  "daily_calories_kcal": 2000,
  "daily_protein_g": 150,
  "daily_fat_g": 60,
  "daily_carbs_g": 220,
  "weekly_training_sessions": 3,
  "recommended_exercises": ["スクワット", "ベンチプレス", "デッドリフト"],
  "nutrition_advice": "食事アドバイス（200字以内）",
  "roadmap_text": "クライアントへの激励メッセージ（150字以内・達成までの期間「${periodLabel ?? "未設定"}」を必ず正確に含める）"
}
JSON以外のテキストは含めないでください。
`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const rawText = message.content[0].type === "text" ? message.content[0].text : "";

  // Strip markdown code blocks if Claude wraps the JSON
  let text = rawText.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  }

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "AI parse error", raw: rawText }, { status: 500 });
  }

  return NextResponse.json({ suggestions: parsed, bmr, tdee });
}
