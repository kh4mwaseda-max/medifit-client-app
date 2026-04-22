export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase";
import { getTrainerId } from "@/lib/trainer-auth";
import { getImageCount } from "@/lib/line-usage";
import { redirect } from "next/navigation";
import { TrainerShell } from "@/components/cf/TrainerShell";
import { DashboardView } from "./DashboardView";

function todayLabel(): string {
  const d = new Date();
  const week = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${week}）`;
}

function hoursBetween(iso: string | null, now: Date): number {
  if (!iso) return 9999;
  const t = new Date(iso).getTime();
  return Math.max(0, Math.floor((now.getTime() - t) / 36e5));
}

export default async function TrainerDashboardPage() {
  const trainerId = await getTrainerId();
  if (!trainerId) redirect("/trainer/login");

  const supabase = createServerClient();
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).toISOString();
  const fourteenDaysAgo = new Date(
    now.getTime() - 14 * 24 * 3600 * 1000,
  ).toISOString();

  const [trainerRes, clientsRes, lineCount] = await Promise.all([
    supabase
      .from("trainers")
      .select("name, email, plan")
      .eq("id", trainerId)
      .single(),
    supabase
      .from("clients")
      .select("id, name, goal, start_date, line_user_id, created_at")
      .eq("trainer_id", trainerId)
      .order("created_at", { ascending: false }),
    getImageCount(trainerId),
  ]);

  const clients = clientsRes.data ?? [];
  const trainer = trainerRes.data ?? { name: "トレーナー", email: "", plan: "free" };
  const clientIds = clients.map((c) => c.id);

  // Body records (latest per client + weight series)
  const [bodyAllRes, trainingAllRes, mealsTodayRes] = await Promise.all([
    clientIds.length
      ? supabase
          .from("body_records")
          .select(
            "client_id, recorded_at, weight_kg, body_fat_pct, muscle_mass_kg",
          )
          .in("client_id", clientIds)
          .order("recorded_at", { ascending: false })
      : Promise.resolve({ data: [] as Array<{ client_id: string; recorded_at: string; weight_kg: number | null; body_fat_pct: number | null; muscle_mass_kg: number | null }> }),
    clientIds.length
      ? supabase
          .from("training_sessions")
          .select("id, client_id, session_date, created_at")
          .in("client_id", clientIds)
          .gte("created_at", fourteenDaysAgo)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as Array<{ id: string; client_id: string; session_date: string; created_at: string }> }),
    clientIds.length
      ? supabase
          .from("meal_records")
          .select("client_id, created_at, meal_type, food_name, calories")
          .in("client_id", clientIds)
          .gte("created_at", startOfToday)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as Array<{ client_id: string; created_at: string; meal_type: string; food_name: string; calories: number | null }> }),
  ]);

  const bodyRows = bodyAllRes.data ?? [];
  const trainingRows = trainingAllRes.data ?? [];
  const mealsToday = mealsTodayRes.data ?? [];

  // Last activity per client (max of latest body record & training session)
  const lastActivityAt: Record<string, string> = {};
  for (const row of bodyRows) {
    const ca = row.recorded_at;
    if (!lastActivityAt[row.client_id] || ca > lastActivityAt[row.client_id]) {
      lastActivityAt[row.client_id] = ca;
    }
  }
  for (const row of trainingRows) {
    const ca = row.created_at || row.session_date;
    if (!lastActivityAt[row.client_id] || ca > lastActivityAt[row.client_id]) {
      lastActivityAt[row.client_id] = ca;
    }
  }

  // Weight series (chronological) + latest weight per client
  const weightSeriesMap: Record<string, number[]> = {};
  const latestWeight: Record<string, number | null> = {};
  const latestBodyFat: Record<string, number | null> = {};
  const latestMuscle: Record<string, number | null> = {};
  const firstWeight: Record<string, number | null> = {};
  for (const row of [...bodyRows].reverse()) {
    if (row.weight_kg == null) continue;
    weightSeriesMap[row.client_id] ||= [];
    weightSeriesMap[row.client_id].push(row.weight_kg);
    if (firstWeight[row.client_id] == null) firstWeight[row.client_id] = row.weight_kg;
    latestWeight[row.client_id] = row.weight_kg;
    if (row.body_fat_pct != null) latestBodyFat[row.client_id] = row.body_fat_pct;
    if (row.muscle_mass_kg != null) latestMuscle[row.client_id] = row.muscle_mass_kg;
  }

  // Today's log count (body + training + meals today)
  const startOfTodayTs = new Date(startOfToday).getTime();
  const countToday = (iso: string | null) =>
    iso && new Date(iso).getTime() >= startOfTodayTs ? 1 : 0;
  let todayLogs = 0;
  for (const r of bodyRows) todayLogs += countToday(r.recorded_at);
  for (const r of trainingRows) todayLogs += countToday(r.created_at);
  todayLogs += mealsToday.length;

  // 14-day volume series: count training sessions per day (we don't have volume yet, so use count*1000 placeholder)
  const volumeSeries: number[] = new Array(14).fill(0);
  for (const r of trainingRows) {
    const d = new Date(r.created_at || r.session_date);
    const diffDays = Math.floor(
      (now.getTime() - d.getTime()) / (24 * 3600 * 1000),
    );
    if (diffDays >= 0 && diffDays < 14) {
      volumeSeries[13 - diffDays] += 1;
    }
  }

  // Enrich clients with derived fields
  const enrichedClients = clients.map((c) => {
    const cur = latestWeight[c.id];
    const start = firstWeight[c.id];
    const last = lastActivityAt[c.id] ?? c.created_at;
    const lastHours = hoursBetween(last, now);
    const flag: "ok" | "warn" | "alert" =
      lastHours >= 48 ? "alert" : lastHours >= 30 ? "warn" : "ok";
    return {
      id: c.id,
      name: c.name,
      goal: c.goal,
      startKg: start,
      curKg: cur,
      bodyFat: latestBodyFat[c.id] ?? null,
      muscleMass: latestMuscle[c.id] ?? null,
      lastActiveHours: lastHours,
      flag,
      weightSeries: weightSeriesMap[c.id] ?? [],
      lineLinked: !!c.line_user_id,
      startDate: c.start_date,
    };
  });

  const needsAttention = enrichedClients.filter(
    (c) => c.flag === "alert" || c.flag === "warn",
  );

  // Recent activity feed (merge body + training + meals, sort by date desc)
  type ActivityItem = {
    id: string;
    clientId: string;
    clientName: string;
    type: "body" | "training" | "meal";
    label: string;
    detail: string;
    at: string;
    icon: string;
  };
  const nameById = Object.fromEntries(clients.map((c) => [c.id, c.name]));
  const activity: ActivityItem[] = [];
  for (const r of bodyRows.slice(0, 20)) {
    if (!nameById[r.client_id]) continue;
    const parts: string[] = [];
    if (r.weight_kg != null) parts.push(`${r.weight_kg}kg`);
    if (r.body_fat_pct != null) parts.push(`体脂肪率 ${r.body_fat_pct}%`);
    if (r.muscle_mass_kg != null) parts.push(`筋肉量 ${r.muscle_mass_kg}kg`);
    activity.push({
      id: `b-${r.client_id}-${r.recorded_at}`,
      clientId: r.client_id,
      clientName: nameById[r.client_id],
      type: "body",
      label: "体組成を記録",
      detail: parts.join(" / ") || "記録",
      at: r.recorded_at,
      icon: "activity",
    });
  }
  for (const r of trainingRows.slice(0, 20)) {
    if (!nameById[r.client_id]) continue;
    activity.push({
      id: `t-${r.id}`,
      clientId: r.client_id,
      clientName: nameById[r.client_id],
      type: "training",
      label: "トレーニングを記録",
      detail: `セッション日 ${r.session_date}`,
      at: r.created_at || r.session_date,
      icon: "dumbbell",
    });
  }
  for (const r of mealsToday.slice(0, 20)) {
    if (!nameById[r.client_id]) continue;
    const typeLabel =
      r.meal_type === "breakfast"
        ? "朝食"
        : r.meal_type === "lunch"
          ? "昼食"
          : r.meal_type === "dinner"
            ? "夕食"
            : "間食";
    activity.push({
      id: `m-${r.client_id}-${r.created_at}`,
      clientId: r.client_id,
      clientName: nameById[r.client_id],
      type: "meal",
      label: `${typeLabel}を記録`,
      detail: `${r.food_name}${r.calories ? ` — ${r.calories}kcal` : ""}`,
      at: r.created_at,
      icon: "utensils",
    });
  }
  activity.sort((a, b) => b.at.localeCompare(a.at));

  const stats = {
    totalClients: clients.length,
    todayLogs,
    needsAttention: needsAttention.length,
    lineUsageUsed: lineCount,
    lineUsageCap: 300,
  };

  return (
    <TrainerShell
      active="dashboard"
      title="ダッシュボード"
      subtitle={todayLabel()}
      trainerName={trainer.name}
      trainerEmail={trainer.email || undefined}
    >
      <DashboardView
        stats={stats}
        clients={enrichedClients}
        needsAttention={needsAttention.map((c) => ({
          clientId: c.id,
          name: c.name,
          reason:
            c.lastActiveHours >= 9999
              ? "記録なし"
              : `記録が${c.lastActiveHours}時間停止`,
        }))}
        volumeSeries={volumeSeries}
        activity={activity.slice(0, 8)}
      />
    </TrainerShell>
  );
}
