import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

// データカテゴリ（アプリ種類に関わらず内容で分類）
export type DataCategory = "meal" | "training" | "body" | "cardio" | "unknown";

export interface MealResult {
  app_type: "meal";
  source_app: string;       // "あすけん" / "MyFitnessPal" / "カロミル" 等
  date: string | null;      // YYYY-MM-DD、日付不明の場合はnull
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
  advice: string;
}

export interface TrainingResult {
  app_type: "training";
  source_app: string;       // "筋トレメモ" / "STRONG" / "Hevy" 等
  date: string | null;      // YYYY-MM-DD、日付不明の場合はnull
  sets: {
    exercise_name: string;
    muscle_group: string | null;
    weight_kg: number | null;
    reps: number | null;
    set_number: number;
    rpe: number | null;     // Rate of Perceived Exertion (1-10) ある場合
  }[];
  notes: string | null;
  advice: string;
}

export interface BodyResult {
  app_type: "body";
  source_app: string;       // "タニタ" / "Withings" / "OMRON" 等
  date: string | null;      // YYYY-MM-DD、日付不明の場合はnull
  weight_kg: number | null;
  body_fat_pct: number | null;
  muscle_mass_kg: number | null;
  bmi: number | null;
  bone_mass_kg: number | null;
  visceral_fat_level: number | null;
  metabolic_age: number | null;
  advice: string;
}

export interface CardioResult {
  app_type: "cardio";
  source_app: string;       // "Strava" / "Nike Run Club" / "Garmin" 等
  date: string | null;      // YYYY-MM-DD、日付不明の場合はnull
  activity_type: string;    // "ランニング" / "サイクリング" / "ウォーキング" 等
  distance_km: number | null;
  duration_seconds: number | null;
  pace_sec_per_km: number | null;
  calories: number | null;
  avg_heart_rate: number | null;
  max_heart_rate: number | null;
  elevation_m: number | null;
  advice: string;
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

function detectMediaType(buffer: ArrayBuffer): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
  const bytes = new Uint8Array(buffer.slice(0, 4));
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return "image/png";
  if (bytes[0] === 0x47 && bytes[1] === 0x49) return "image/gif";
  if (bytes[0] === 0x52 && bytes[1] === 0x49) return "image/webp";
  return "image/jpeg"; // fallback
}

export async function analyzeScreenshot(imageBuffer: ArrayBuffer): Promise<AnalyzeResult> {
  if (imageBuffer.byteLength === 0) {
    throw new Error("Empty image buffer received from LINE");
  }
  const base64 = Buffer.from(imageBuffer).toString("base64");
  const mediaType = detectMediaType(imageBuffer);

  const prompt = `フィットネス・健康管理に関する画像を解析してください。
アプリのスクリーンショットだけでなく、体重計・血圧計などの実機の液晶画面を撮影した写真も対象です。

## STEP 1: 内容カテゴリを判定
以下の4つのカテゴリに分類してください：

- **meal（食事記録）**: カロリー・栄養素・食品名が記録されているスクショ
  対応アプリ例: あすけん、MyFitnessPal、カロミル、カロリーママ、FatSecret、Cronometer、食事ノート、Noom、Lose It!、Lifesum 等

- **training（筋トレ・ウエイト）**: 種目名・セット・重量・回数が記録されているスクショ
  対応アプリ例: 筋トレメモ、STRONG、Hevy、JEFIT、GymBook、FitNotes、Nike Training Club、BodySpace、Gymaholic、トレーニング日誌 等

- **body（体重・体組成）**: 体重・体脂肪率・筋肉量等の測定値が表示されているもの
  ★体重計・体組成計の液晶ディスプレイを直接撮影した写真も含む
  対応例: タニタ・OMRON・Withings・Renpho等の体重計実機写真、タニタHealthPlanet・Withings Health Mate・OMRON connect・Apple ヘルスケア等のアプリスクショ

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
  "total_carbs_g": 数値またはnull,
  "advice": "このデータに対する具体的な一言アドバイス（50文字以内、パーソナルトレーナーとして）"
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
  "notes": "メモがあれば文字列、なければnull",
  "advice": "このデータに対する具体的な一言アドバイス（50文字以内、パーソナルトレーナーとして）"
}

---

【body の場合】
{
  "app_type": "body",
  "source_app": "アプリ名または機器名（例: タニタHealthPlanet / OMRON体重計 / タニタBC-768 / 不明）",
  "date": "YYYY-MM-DD",
  "weight_kg": 数値またはnull,
  "body_fat_pct": 数値またはnull,
  "muscle_mass_kg": 数値またはnull,
  "bmi": 数値またはnull,
  "bone_mass_kg": 数値またはnull,
  "visceral_fat_level": 数値またはnull,
  "metabolic_age": 数値またはnull,
  "advice": "このデータに対する具体的な一言アドバイス（50文字以内、パーソナルトレーナーとして）"
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
  "elevation_m": 数値またはnull,
  "advice": "このデータに対する具体的な一言アドバイス（50文字以内、パーソナルトレーナーとして）"
}

---

【どのカテゴリにも当てはまらない場合】
{
  "app_type": "unknown",
  "reason": "判定できなかった理由"
}

---

注意事項：
- 日付が画面に明示されていない場合は "date": null にする（推測しない）
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
            source: { type: "base64", media_type: mediaType, data: base64 },
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
