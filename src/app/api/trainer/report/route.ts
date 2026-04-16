import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getTrainerId, verifyClientOwnership } from "@/lib/trainer-auth";
import { subDays, subMonths, format, startOfWeek, endOfWeek } from "date-fns";
import { ja } from "date-fns/locale";

export type ReportPeriod = "weekly" | "monthly";

export interface ReportData {
  period: ReportPeriod;
  label: string;             // "4月1日〜4月7日"
  from: string;              // YYYY-MM-DD
  to: string;                // YYYY-MM-DD

  // 身体変化
  weight_start: number | null;
  weight_end: number | null;
  weight_diff: number | null;
  body_fat_start: number | null;
  body_fat_end: number | null;
  body_fat_diff: number | null;
  muscle_start: number | null;
  muscle_end: number | null;
  muscle_diff: number | null;

  // トレーニング集計
  training_sessions: number;
  total_sets: number;
  total_volume_kg: number;
  top_exercises: { name: string; volume: number; max_weight: number }[];

  // 食事集計（日平均）
  avg_calories: number | null;
  avg_protein_g: number | null;
  avg_fat_g: number | null;
  avg_carbs_g: number | null;
  logged_days: number;

  // 目標対比（goalsがある場合）
  calorie_achievement_pct: number | null;
  protein_achievement_pct: number | null;
  training_achievement_pct: number | null;

  // body_records 推移（グラフ用）
  body_trend: { date: string; weight: number | null; body_fat: number | null }[];
}

// GET /api/trainer/report?clientId=xxx&period=weekly|monthly&offset=0
export async function GET(req: NextRequest) {
  const trainerId = await getTrainerId();
  if (!trainerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const clientId = sp.get("clientId");
  const period = (sp.get("period") ?? "weekly") as ReportPeriod;
  const offset = parseInt(sp.get("offset") ?? "0");  // 0=直近, 1=前期, ...

  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  const ownership = await verifyClientOwnership(trainerId, clientId);
  if (!ownership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createServerClient();
  const today = new Date();

  // 期間計算
  let from: Date, to: Date;
  if (period === "weekly") {
    // 先週月曜〜日曜（offset週前）
    const base = startOfWeek(subDays(today, offset * 7), { weekStartsOn: 1 });
    from = base;
    to = endOfWeek(base, { weekStartsOn: 1 });
  } else {
    // 先月1日〜末日（offset月前）
    const base = subMonths(today, offset + 1);
    from = new Date(base.getFullYear(), base.getMonth(), 1);
    to = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  }

  const fromStr = format(from, "yyyy-MM-dd");
  const toStr = format(to, "yyyy-MM-dd");
  const label = `${format(from, "M月d日", { locale: ja })}〜${format(to, "M月d日", { locale: ja })}`;

  // 並列取得
  const [bodyRes, trainingRes, mealRes, goalsRes] = await Promise.all([
    supabase
      .from("body_records")
      .select("*")
      .eq("client_id", clientId)
      .gte("recorded_at", fromStr)
      .lte("recorded_at", toStr)
      .order("recorded_at", { ascending: true }),
    supabase
      .from("training_sessions")
      .select("*, training_sets(*)")
      .eq("client_id", clientId)
      .gte("session_date", fromStr)
      .lte("session_date", toStr)
      .order("session_date", { ascending: true }),
    supabase
      .from("meal_records")
      .select("*")
      .eq("client_id", clientId)
      .gte("meal_date", fromStr)
      .lte("meal_date", toStr)
      .order("meal_date", { ascending: true }),
    supabase
      .from("client_goals")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
  ]);

  const bodyRecords = bodyRes.data ?? [];
  const trainingSessions = trainingRes.data ?? [];
  const mealRecords = mealRes.data ?? [];
  const goals = goalsRes.data ?? null;

  // 身体変化
  const bodyStart = bodyRecords[0] ?? null;
  const bodyEnd = bodyRecords[bodyRecords.length - 1] ?? null;
  const diff = (a: number | null, b: number | null) =>
    a != null && b != null ? +((b - a).toFixed(1)) : null;

  // トレーニング集計
  const allSets = trainingSessions.flatMap((s) => s.training_sets ?? []);
  const exerciseMap: Record<string, { volume: number; max_weight: number }> = {};
  for (const set of allSets) {
    const n = set.exercise_name ?? "不明";
    if (!exerciseMap[n]) exerciseMap[n] = { volume: 0, max_weight: 0 };
    const vol = (set.weight_kg ?? 0) * (set.reps ?? 0);
    exerciseMap[n].volume += vol;
    exerciseMap[n].max_weight = Math.max(exerciseMap[n].max_weight, set.weight_kg ?? 0);
  }
  const topExercises = Object.entries(exerciseMap)
    .sort(([, a], [, b]) => b.volume - a.volume)
    .slice(0, 5)
    .map(([name, v]) => ({ name, volume: Math.round(v.volume), max_weight: v.max_weight }));

  // 食事集計
  const mealDates = [...new Set(mealRecords.map((m) => m.meal_date))];
  const avgNum = (key: string) =>
    mealDates.length > 0
      ? Math.round(
          mealDates.reduce((sum, d) => {
            return sum + mealRecords.filter((m) => m.meal_date === d).reduce((s, m) => s + (m[key] ?? 0), 0);
          }, 0) / mealDates.length
        )
      : null;

  const avgCalories = avgNum("calories");
  const avgProtein = avgNum("protein_g");
  const avgFat = avgNum("fat_g");
  const avgCarbs = avgNum("carbs_g");

  // 目標達成率
  const pct = (val: number | null, target: number | null) =>
    val != null && target ? Math.round((val / target) * 100) : null;

  const report: ReportData = {
    period,
    label,
    from: fromStr,
    to: toStr,

    weight_start: bodyStart?.weight_kg ?? null,
    weight_end: bodyEnd?.weight_kg ?? null,
    weight_diff: diff(bodyStart?.weight_kg, bodyEnd?.weight_kg),
    body_fat_start: bodyStart?.body_fat_pct ?? null,
    body_fat_end: bodyEnd?.body_fat_pct ?? null,
    body_fat_diff: diff(bodyStart?.body_fat_pct, bodyEnd?.body_fat_pct),
    muscle_start: bodyStart?.muscle_mass_kg ?? null,
    muscle_end: bodyEnd?.muscle_mass_kg ?? null,
    muscle_diff: diff(bodyStart?.muscle_mass_kg, bodyEnd?.muscle_mass_kg),

    training_sessions: trainingSessions.length,
    total_sets: allSets.length,
    total_volume_kg: Math.round(allSets.reduce((s, t) => s + (t.weight_kg ?? 0) * (t.reps ?? 0), 0)),
    top_exercises: topExercises,

    avg_calories: avgCalories,
    avg_protein_g: avgProtein ? +avgProtein.toFixed(1) : null,
    avg_fat_g: avgFat ? +avgFat.toFixed(1) : null,
    avg_carbs_g: avgCarbs ? +avgCarbs.toFixed(1) : null,
    logged_days: mealDates.length,

    calorie_achievement_pct: pct(avgCalories, goals?.daily_calories_kcal),
    protein_achievement_pct: pct(avgProtein, goals?.daily_protein_g),
    training_achievement_pct: goals?.weekly_training_sessions
      ? Math.round((trainingSessions.length / (period === "weekly" ? goals.weekly_training_sessions : goals.weekly_training_sessions * 4)) * 100)
      : null,

    body_trend: bodyRecords.map((r) => ({
      date: format(new Date(r.recorded_at), "M/d"),
      weight: r.weight_kg ?? null,
      body_fat: r.body_fat_pct ?? null,
    })),
  };

  return NextResponse.json({ report });
}
