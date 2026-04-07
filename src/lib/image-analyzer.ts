import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export type AppType = "asken" | "kintore" | "unknown";

export interface AskenResult {
  app_type: "asken";
  date: string;           // YYYY-MM-DD
  meals: {
    meal_type: "breakfast" | "lunch" | "dinner" | "snack";
    food_name: string;
    calories: number | null;
    protein_g: number | null;
    fat_g: number | null;
    carbs_g: number | null;
  }[];
  total_calories: number | null;
  total_protein_g: number | null;
  total_fat_g: number | null;
  total_carbs_g: number | null;
}

export interface KintoreResult {
  app_type: "kintore";
  date: string;           // YYYY-MM-DD
  sets: {
    exercise_name: string;
    muscle_group: string | null;
    weight_kg: number | null;
    reps: number | null;
    set_number: number;
  }[];
  notes: string | null;
}

export type AnalyzeResult = AskenResult | KintoreResult | { app_type: "unknown"; reason: string };

export async function analyzeScreenshot(imageBuffer: ArrayBuffer): Promise<AnalyzeResult> {
  const base64 = Buffer.from(imageBuffer).toString("base64");

  const prompt = `このスクリーンショットを解析してください。

まず、このスクリーンショットがどのアプリのものか判定してください：
- **あすけん**: 食事記録・栄養管理アプリ（食事名、カロリー、PFCが表示されている）
- **筋トレメモ**: トレーニング記録アプリ（種目名、重量、回数、セット数が表示されている）
- **unknown**: 上記以外

判定結果に応じて、以下のJSONのどちらかを返してください。JSON以外のテキストは含めないでください。

【あすけんの場合】
{
  "app_type": "asken",
  "date": "YYYY-MM-DD（画面に日付があれば。なければ今日の日付を入れる）",
  "meals": [
    {
      "meal_type": "breakfast|lunch|dinner|snack",
      "food_name": "食品名",
      "calories": 数値またはnull,
      "protein_g": 数値またはnull,
      "fat_g": 数値またはnull,
      "carbs_g": 数値またはnull
    }
  ],
  "total_calories": 数値またはnull,
  "total_protein_g": 数値またはnull,
  "total_fat_g": 数値またはnull,
  "total_carbs_g": 数値またはnull
}

【筋トレメモの場合】
{
  "app_type": "kintore",
  "date": "YYYY-MM-DD（画面に日付があれば。なければ今日の日付）",
  "sets": [
    {
      "exercise_name": "種目名（日本語）",
      "muscle_group": "部位またはnull",
      "weight_kg": 数値またはnull,
      "reps": 数値またはnull,
      "set_number": 1から始まる連番
    }
  ],
  "notes": "メモがあれば文字列、なければnull"
}

【どちらでもない場合】
{
  "app_type": "unknown",
  "reason": "判定できなかった理由"
}

注意：
- meal_typeはスクリーンショットの区分から判定（朝食→breakfast、昼食→lunch、夕食→dinner、間食→snack）
- 複数の食事や種目が表示されていれば全て抽出する
- 数値は単位を除いた数値のみ（例: "250kcal" → 250）
- 読み取れない値はnullにする`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: "image/jpeg", data: base64 },
          },
          { type: "text", text: prompt },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  // JSONブロックが含まれる場合は抽出
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ?? text.match(/(\{[\s\S]*\})/);
  const jsonText = jsonMatch ? jsonMatch[1] : text;

  return JSON.parse(jsonText.trim()) as AnalyzeResult;
}
