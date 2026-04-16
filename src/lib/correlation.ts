import { parseISO, format, addDays } from "date-fns";

/** 日付をキーに body_records と meal_records をマージして体重×カロリー収支データを生成 */
export function buildWeightCalorieCorrelation(
  bodyRecords: any[],
  mealRecords: any[],
  targetCalories: number | null,
) {
  const mealByDate: Record<string, number> = {};
  for (const m of mealRecords) {
    mealByDate[m.meal_date] = (mealByDate[m.meal_date] ?? 0) + (m.calories ?? 0);
  }
  return bodyRecords
    .filter((b) => b.weight_kg != null)
    .map((b) => ({
      date: format(parseISO(b.recorded_at), "M/d"),
      weight_kg: b.weight_kg,
      total_calories: mealByDate[b.recorded_at] ?? null,
      calorie_balance:
        targetCalories != null && mealByDate[b.recorded_at] != null
          ? mealByDate[b.recorded_at] - targetCalories
          : null,
    }));
}

/** body_records の sleep_hours と翌日のセッション平均RPEをペアにする */
export function buildSleepRpeCorrelation(
  bodyRecords: any[],
  trainingSessions: any[],
) {
  const sessionByDate: Record<string, number> = {};
  for (const s of trainingSessions) {
    const sets = s.training_sets ?? [];
    const rpeValues = sets
      .map((t: any) => t.rpe)
      .filter((r: any) => r != null && r > 0);
    if (rpeValues.length > 0) {
      sessionByDate[s.session_date] =
        rpeValues.reduce((a: number, b: number) => a + b, 0) / rpeValues.length;
    }
  }
  return bodyRecords
    .filter((b) => b.sleep_hours != null)
    .map((b) => {
      const nextDay = format(addDays(parseISO(b.recorded_at), 1), "yyyy-MM-dd");
      return {
        sleep_hours: b.sleep_hours,
        next_rpe: sessionByDate[nextDay] ?? null,
        date: b.recorded_at,
      };
    })
    .filter((d) => d.next_rpe != null);
}

/** 週別タンパク質平均と筋肉量変化を計算 */
export function buildProteinMuscleTrend(
  bodyRecords: any[],
  mealRecords: any[],
) {
  // 週ごとにグループ化
  const weekMap: Record<string, { protein: number[]; muscle: number | null }> = {};
  for (const m of mealRecords) {
    if (!m.protein_g) continue;
    const d = parseISO(m.meal_date);
    const weekKey = format(d, "yyyy-'W'ww");
    if (!weekMap[weekKey]) weekMap[weekKey] = { protein: [], muscle: null };
    weekMap[weekKey].protein.push(m.protein_g);
  }
  for (const b of bodyRecords) {
    if (!b.muscle_mass_kg) continue;
    const d = parseISO(b.recorded_at);
    const weekKey = format(d, "yyyy-'W'ww");
    if (!weekMap[weekKey]) weekMap[weekKey] = { protein: [], muscle: null };
    weekMap[weekKey].muscle = b.muscle_mass_kg;
  }
  return Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, data]) => ({
      week: week.replace("W", "第").replace(/^\d{4}-/, "") + "週",
      avg_protein: data.protein.length
        ? Math.round(data.protein.reduce((a, b) => a + b, 0) / data.protein.length)
        : null,
      muscle_mass_kg: data.muscle,
    }))
    .filter((d) => d.avg_protein != null || d.muscle_mass_kg != null);
}
