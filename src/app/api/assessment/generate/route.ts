import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase";

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  const { clientId } = await req.json();
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  const supabase = createServerClient();

  // クライアント情報を取得
  const clientRes = await supabase
    .from("clients")
    .select("name, goal, start_date")
    .eq("id", clientId)
    .single();

  if (clientRes.error || !clientRes.data) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const c = clientRes.data as any;

  // その他データを並列取得
  const bodyRes = await supabase
    .from("body_records")
    .select("*")
    .eq("client_id", clientId)
    .order("recorded_at", { ascending: false })
    .limit(30);

  const trainingRes = await supabase
    .from("training_sessions")
    .select("*, training_sets(*)")
    .eq("client_id", clientId)
    .order("session_date", { ascending: false })
    .limit(20);

  const mealRes = await supabase
    .from("meal_records")
    .select("*")
    .eq("client_id", clientId)
    .order("meal_date", { ascending: false })
    .limit(30);

  const bodyRecords: any[] = bodyRes.data ?? [];
  const trainingSessions: any[] = trainingRes.data ?? [];
  const mealRecords: any[] = mealRes.data ?? [];

  const latest = bodyRecords[0];
  const oldest = bodyRecords[bodyRecords.length - 1];

  const prompt = `
あなたはパーソナルトレーナーのアシスタントAIです。
以下のクライアントデータをもとに、アセスメントレポートをJSON形式で生成してください。

【クライアント基本情報】
- 名前: ${c.name}
- 目標: ${c.goal ?? "未設定"}
- 開始日: ${c.start_date}

【身体データ（最新）】
${latest ? `
- 体重: ${latest.weight_kg ?? "未記録"} kg
- 体脂肪率: ${latest.body_fat_pct ?? "未記録"} %
- 筋肉量: ${latest.muscle_mass_kg ?? "未記録"} kg
- 収縮期血圧: ${latest.systolic_bp ?? "未記録"} mmHg
- 睡眠時間: ${latest.sleep_hours ?? "未記録"} 時間
- コンディションスコア: ${latest.condition_score ?? "未記録"} / 10
` : "データなし"}

【身体データ（開始時）】
${oldest && oldest.id !== latest?.id ? `
- 体重: ${oldest.weight_kg ?? "未記録"} kg
- 体脂肪率: ${oldest.body_fat_pct ?? "未記録"} %
` : "開始時データなし"}

【直近トレーニングセッション数】${trainingSessions.length} 回

【食事データ概要（直近30日）】
${mealRecords.length > 0
  ? `平均カロリー: ${Math.round(mealRecords.reduce((s: number, m: any) => s + (m.calories ?? 0), 0) / mealRecords.length)} kcal/食`
  : "データなし"
}

以下のJSONフォーマットで回答してください（日本語）:
{
  "current_summary": "現状の総合評価（200字以内）",
  "prediction_1m": "現トレンドが続いた場合の1ヶ月後の予測（150字以内）",
  "prediction_3m": "3ヶ月後の予測と見た目・数値の変化（200字以内）",
  "risk_obesity": "low | medium | high",
  "risk_musculoskeletal": "low | medium | high",
  "risk_nutrition": "low | medium | high",
  "risk_sleep": "low | medium | high",
  "action_plan": "今週取り組む具体的な1〜3のアクション（200字以内）"
}
JSON以外のテキストは含めないでください。
`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "AI parse error", raw: text }, { status: 500 });
  }

  const { data: saved, error } = await supabase
    .from("assessments")
    .insert({
      client_id: clientId,
      generated_at: new Date().toISOString(),
      published_at: null,
      ...parsed,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ assessment: saved });
}
