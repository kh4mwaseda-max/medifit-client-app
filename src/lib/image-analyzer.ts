import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

// データカテゴリ（アプリ種類に関わらず内容で分類）
export type DataCategory = "meal" | "training" | "body" | "cardio" | "unknown";

export interface MealResult {
  app_type: "meal";
  source_app: string;       // "あすけん" / "MyFitnessPal" / "カロミル" 等
  date: string;             // YYYY-MM-DD
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

export interface TrainingResult {
  app_type: "training";
  source_app: string;       // "筋トレメモ" / "STRONG" / "Hevy" 等
  date: string;             // YYYY-MM-DD
  sets: {
    exercise_name: string;
    muscle_group: string | null;
    weight_kg: number | null;
    reps: number | null;
    set_number: number;
    rpe: number | null;     // Rate of Perceived Exertion (1-10) ある場合
  }[];
  notes: string | null;
}

export interface BodyResult {
  app_type: "body";
  source_app: string;       // "タニタ" / "Withings" / "OMRON" 等
  date: string;             // YYYY-MM-DD
  weight_kg: number | null;
  body_fat_pct: number | null;
  muscle_mass_kg: number | null;
  bmi: number | null;
  bone_mass_kg: number | null;
  visceral_fat_level: number | null;
  metabolic_age: number | null;
}

export interface CardioResult {
  app_type: "cardio";
  source_app: string;       // "Strava" / "Nike Run Club" / "Garmin" 等
  date: string;             // YYYY-MM-DD
  activity_type: string;    // "ランニング" / "サイクリング" / "ウォーキング" 等
  distance_km: number | null;
  duration_seconds: number | null;
  pace_sec_per_km: number | null;
  calories: number | null;
  avg_heart_rate: number | null;
  max_heart_rate: number | null;
  elevation_m: number | null;
}

export type AnalyzeResult =
  | MealResult
  | TrainingResult
  | BodyResult
  | CardioResult
  | { app_type: "unknown"; reason: string };

// 後方互換 (webhook routeが参照)
export type AskenResult = MealResult;
export type KintoreResult = TrainingResult;

export async function analyzeScreenshot(imageBuffer: ArrayBuffer): Promise<AnalyzeResult> {
  const base64 = Buffer.from(imageBuffer).toString("base64");

  const prompt = `このフィットネス・健康管理アプリのスクリーンショットを解析してください。

## STEP 1: 内容カテゴリを判定
以下の4つのカテゴリに分類してください：

- **meal（食事記録）**: カロリー・栄養素・食品名が記録されているスクショ
  対応アプリ例: あすけん、MyFitnessPal、カロミル、カロリーママ、FatSecret、Cronometer、食事ノート、Noom、Lose It!、Lifesum 等

- **training（筋トレ・ウエイト）**: 種目名・セット・重量・回数が記録されているスクショ
  対応アプリ例: 筋トレメモ、STRONG、Hevy、JEFIT、GymBook、FitNotes、Nike Training Club、BodySpace、Gymaholic、トレーニング日誌 等

- **body（体重・体組成）**: 体重・体脂肪率・筋肉量等の測定値が表示されているスクショ
  対応アプリ例: タニタHealthPlanet、Withings Health Mate、OMRON connect、Finc、 体重記録アプリ、RenphoアプリiPhone・Apple ヘルスケア（体重グラフ）等

- **cardio（有酸素・アクティビティ）**: 走行距離・時間・ペース・消費カロリーが記録されているスクショ
  対応アプリ例: Strava、Nike Run Club、Garmin Connect、adidas Running(Runtastic)、RUNKEEPER、Apple ワークアウト、Google Fit、YAMAP、SUUNTOアプリ 等

## STEP 2: 該当カテゴリのJSONを返す
JSON以外のテキストは絶対に含めないでください。

---

【meal の場合】
{
  "app_type": "meal",
  "source_app": "アプリ名（例: あすけん）",
  "date": "YYYY-MM-DD",
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

---

【training の場合】
{
  "app_type": "training",
  "source_app": "アプリ名（例: STRONG）",
  "date": "YYYY-MM-DD",
  "sets": [
    {
      "exercise_name": "種目名（日本語に変換）",
      "muscle_group": "部位またはnull",
      "weight_kg": 数値またはnull,
      "reps": 数値またはnull,
      "set_number": 1から始まる連番,
      "rpe": 数値またはnull
    }
  ],
  "notes": "メモがあれば文字列、なければnull"
}

---

【body の場合】
{
  "app_type": "body",
  "source_app": "アプリ名（例: タニタHealthPlanet）",
  "date": "YYYY-MM-DD",
  "weight_kg": 数値またはnull,
  "body_fat_pct": 数値またはnull,
  "muscle_mass_kg": 数値またはnull,
  "bmi": 数値またはnull,
  "bone_mass_kg": 数値またはnull,
  "visceral_fat_level": 数値またはnull,
  "metabolic_age": 数値またはnull
}

---

【cardio の場合】
{
  "app_type": "cardio",
  "source_app": "アプリ名（例: Strava）",
  "date": "YYYY-MM-DD",
  "activity_type": "ランニング|ウォーキング|サイクリング|水泳|その他",
  "distance_km": 数値またはnull,
  "duration_seconds": 秒数またはnull,
  "pace_sec_per_km": 秒数またはnull,
  "calories": 数値またはnull,
  "avg_heart_rate": 数値またはnull,
  "max_heart_rate": 数値またはnull,
  "elevation_m": 数値またはnull
}

---

【どのカテゴリにも当てはまらない場合】
{
  "app_type": "unknown",
  "reason": "判定できなかった理由"
}

---

注意事項：
- 日付が画面にない場合は今日の日付（${new Date().toISOString().split("T")[0]}）を使用
- 数値は単位を除いた数字のみ（例: "250kcal" → 250, "5km" → 5）
- 読み取れない値はnullにする
- 複数の食事・種目・セットが表示されていれば全て抽出する
- meal_typeは画面の区分から判定（朝食→breakfast、昼食→lunch、夕食→dinner、間食→snack）
- duration_secondsはmm:ss表記を秒に変換（例: "32:15" → 1935）
- pace_sec_per_kmは/kmのペース表記を秒に変換（例: "5'30\"/km" → 330）
- 英語表記の種目名は日本語に変換（例: "Bench Press" → "ベンチプレス"）`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
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

  // JSONブロック抽出
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ?? text.match(/(\{[\s\S]*\})/);
  const jsonText = jsonMatch ? jsonMatch[1] : text;

  return JSON.parse(jsonText.trim()) as AnalyzeResult;
}
