/**
 * クライアント「O」のデモデータ投入スクリプト
 * node scripts/seed-client-o.mjs
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cpjskwdsznfupicsqbpy.supabase.co";
const SERVICE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwanNrd2Rzem5mdXBpY3NxYnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQ1MTEwMiwiZXhwIjoyMDkxMDI3MTAyfQ.GFpdK43tiyYb5ucDNK9KDGhmSz2tkJUGMlr3JQ4AChw";
const CLIENT_ID    = "19d81742-4039-4859-aa82-a7380017ba0e";

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

// ── クライアント基本情報更新 ──────────────────────────────────────
await sb.from("clients").update({
  height_cm: 172,
  gender: "male",
  birth_year: 1993,
  health_concerns: null,
}).eq("id", CLIENT_ID);
console.log("✅ client profile updated");

// ── 体重・体組成記録（2026/1/1〜4/9, 週1〜2回） ─────────────────
const bodyData = [
  { date: "2026-01-01", weight: 78.5, fat: 22.0, muscle: 58.2, cond: 6, sleep: 6.5 },
  { date: "2026-01-08", weight: 78.1, fat: 21.8, muscle: 58.3, cond: 7, sleep: 7.0 },
  { date: "2026-01-15", weight: 77.6, fat: 21.5, muscle: 58.4, cond: 7, sleep: 6.5 },
  { date: "2026-01-22", weight: 77.2, fat: 21.2, muscle: 58.6, cond: 8, sleep: 7.5 },
  { date: "2026-01-29", weight: 76.8, fat: 20.8, muscle: 58.8, cond: 7, sleep: 7.0 },
  { date: "2026-02-05", weight: 76.5, fat: 20.5, muscle: 59.0, cond: 8, sleep: 7.0 },
  { date: "2026-02-12", weight: 76.0, fat: 20.1, muscle: 59.2, cond: 8, sleep: 7.5 },
  { date: "2026-02-19", weight: 75.8, fat: 19.8, muscle: 59.3, cond: 9, sleep: 7.5 },
  { date: "2026-02-26", weight: 75.5, fat: 19.5, muscle: 59.5, cond: 8, sleep: 7.0 },
  { date: "2026-03-05", weight: 75.2, fat: 19.2, muscle: 59.6, cond: 7, sleep: 6.5 },
  { date: "2026-03-12", weight: 74.9, fat: 18.9, muscle: 59.8, cond: 8, sleep: 7.0 },
  { date: "2026-03-19", weight: 74.7, fat: 18.6, muscle: 60.0, cond: 8, sleep: 7.5 },
  { date: "2026-03-26", weight: 74.5, fat: 18.3, muscle: 60.1, cond: 9, sleep: 8.0 },
  { date: "2026-04-02", weight: 74.2, fat: 18.0, muscle: 60.3, cond: 8, sleep: 7.5 },
  { date: "2026-04-09", weight: 74.0, fat: 17.8, muscle: 60.5, cond: 9, sleep: 7.5 },
];

const bodyRecords = bodyData.map(d => ({
  client_id: CLIENT_ID,
  recorded_at: d.date,
  weight_kg: d.weight,
  body_fat_pct: d.fat,
  muscle_mass_kg: d.muscle,
  condition_score: d.cond,
  sleep_hours: d.sleep,
  resting_heart_rate: 58 + Math.floor(Math.random() * 6),
  systolic_bp: 118 + Math.floor(Math.random() * 8),
  diastolic_bp: 74 + Math.floor(Math.random() * 6),
}));

const { error: bodyErr } = await sb.from("body_records").insert(bodyRecords);
if (bodyErr) console.error("body_records error:", bodyErr.message);
else console.log(`✅ ${bodyRecords.length} body records inserted`);

// ── トレーニングセッション（週2〜3回） ───────────────────────────

const sessions = [
  { date: "2026-01-03", sets: [
    { ex: "ベンチプレス", mg: "胸", w: 80, r: 8, s: 1 }, { ex: "ベンチプレス", mg: "胸", w: 80, r: 7, s: 2 }, { ex: "ベンチプレス", mg: "胸", w: 75, r: 8, s: 3 },
    { ex: "ダンベルフライ", mg: "胸", w: 18, r: 12, s: 1 }, { ex: "ダンベルフライ", mg: "胸", w: 18, r: 10, s: 2 },
  ]},
  { date: "2026-01-06", sets: [
    { ex: "スクワット", mg: "脚", w: 100, r: 8, s: 1 }, { ex: "スクワット", mg: "脚", w: 100, r: 7, s: 2 }, { ex: "スクワット", mg: "脚", w: 95, r: 8, s: 3 },
    { ex: "レッグプレス", mg: "脚", w: 150, r: 12, s: 1 }, { ex: "レッグプレス", mg: "脚", w: 150, r: 10, s: 2 },
  ]},
  { date: "2026-01-10", sets: [
    { ex: "デッドリフト", mg: "背中", w: 120, r: 5, s: 1 }, { ex: "デッドリフト", mg: "背中", w: 120, r: 5, s: 2 }, { ex: "デッドリフト", mg: "背中", w: 115, r: 6, s: 3 },
    { ex: "ラットプルダウン", mg: "背中", w: 65, r: 10, s: 1 }, { ex: "ラットプルダウン", mg: "背中", w: 65, r: 10, s: 2 },
  ]},
  { date: "2026-01-17", sets: [
    { ex: "ベンチプレス", mg: "胸", w: 82.5, r: 8, s: 1 }, { ex: "ベンチプレス", mg: "胸", w: 82.5, r: 7, s: 2 }, { ex: "ベンチプレス", mg: "胸", w: 80, r: 8, s: 3 },
    { ex: "インクラインダンベル", mg: "胸", w: 22, r: 10, s: 1 }, { ex: "インクラインダンベル", mg: "胸", w: 22, r: 10, s: 2 },
  ]},
  { date: "2026-02-01", sets: [
    { ex: "スクワット", mg: "脚", w: 105, r: 8, s: 1 }, { ex: "スクワット", mg: "脚", w: 105, r: 8, s: 2 }, { ex: "スクワット", mg: "脚", w: 100, r: 8, s: 3 },
    { ex: "ブルガリアンSQ", mg: "脚", w: 30, r: 10, s: 1 }, { ex: "ブルガリアンSQ", mg: "脚", w: 30, r: 10, s: 2 },
  ]},
  { date: "2026-02-14", sets: [
    { ex: "デッドリフト", mg: "背中", w: 125, r: 5, s: 1 }, { ex: "デッドリフト", mg: "背中", w: 125, r: 5, s: 2 }, { ex: "デッドリフト", mg: "背中", w: 120, r: 5, s: 3 },
    { ex: "ベントオーバーロウ", mg: "背中", w: 80, r: 8, s: 1 }, { ex: "ベントオーバーロウ", mg: "背中", w: 80, r: 8, s: 2 },
  ]},
  { date: "2026-03-01", sets: [
    { ex: "ベンチプレス", mg: "胸", w: 85, r: 6, s: 1 }, { ex: "ベンチプレス", mg: "胸", w: 85, r: 6, s: 2 }, { ex: "ベンチプレス", mg: "胸", w: 82.5, r: 8, s: 3 },
    { ex: "ショルダープレス", mg: "肩", w: 30, r: 10, s: 1 }, { ex: "ショルダープレス", mg: "肩", w: 30, r: 10, s: 2 },
  ]},
  { date: "2026-03-15", sets: [
    { ex: "スクワット", mg: "脚", w: 110, r: 6, s: 1 }, { ex: "スクワット", mg: "脚", w: 110, r: 6, s: 2 }, { ex: "スクワット", mg: "脚", w: 105, r: 8, s: 3 },
    { ex: "レッグカール", mg: "脚", w: 50, r: 12, s: 1 }, { ex: "レッグカール", mg: "脚", w: 50, r: 12, s: 2 },
  ]},
  { date: "2026-03-28", sets: [
    { ex: "デッドリフト", mg: "背中", w: 130, r: 5, s: 1 }, { ex: "デッドリフト", mg: "背中", w: 130, r: 4, s: 2 }, { ex: "デッドリフト", mg: "背中", w: 125, r: 5, s: 3 },
    { ex: "チンニング", mg: "背中", w: 0, r: 8, s: 1 }, { ex: "チンニング", mg: "背中", w: 0, r: 7, s: 2 }, { ex: "チンニング", mg: "背中", w: 0, r: 6, s: 3 },
  ]},
  { date: "2026-04-05", sets: [
    { ex: "ベンチプレス", mg: "胸", w: 87.5, r: 6, s: 1 }, { ex: "ベンチプレス", mg: "胸", w: 87.5, r: 5, s: 2 }, { ex: "ベンチプレス", mg: "胸", w: 85, r: 6, s: 3 },
    { ex: "ダンベルフライ", mg: "胸", w: 22, r: 12, s: 1 }, { ex: "ダンベルフライ", mg: "胸", w: 22, r: 10, s: 2 },
    { ex: "ショルダープレス", mg: "肩", w: 32, r: 10, s: 1 }, { ex: "ショルダープレス", mg: "肩", w: 32, r: 8, s: 2 },
  ]},
];

for (const s of sessions) {
  const { data: session, error: se } = await sb.from("training_sessions")
    .insert({ client_id: CLIENT_ID, session_date: s.date }).select().single();
  if (se) { console.error("session error:", se.message); continue; }

  const sets = s.sets.map((t, i) => ({
    session_id: session.id,
    exercise_name: t.ex,
    muscle_group: t.mg,
    weight_kg: t.w,
    reps: t.r,
    set_number: t.s,
  }));
  const { error: te } = await sb.from("training_sets").insert(sets);
  if (te) console.error("sets error:", te.message);
}
console.log(`✅ ${sessions.length} training sessions inserted`);

// ── 食事記録（直近2週間） ─────────────────────────────────────────

const mealDates = [
  "2026-03-27","2026-03-28","2026-03-29","2026-03-30","2026-03-31",
  "2026-04-01","2026-04-02","2026-04-03","2026-04-04","2026-04-05",
  "2026-04-06","2026-04-07","2026-04-08","2026-04-09",
];

const mealRecords = mealDates.flatMap(date => [
  { client_id: CLIENT_ID, meal_date: date, meal_type: "breakfast", food_name: "オートミール+プロテイン", calories: 380, protein_g: 32, fat_g: 8, carbs_g: 45 },
  { client_id: CLIENT_ID, meal_date: date, meal_type: "lunch",     food_name: "鶏むね肉+玄米+野菜", calories: 520, protein_g: 45, fat_g: 9, carbs_g: 58 },
  { client_id: CLIENT_ID, meal_date: date, meal_type: "dinner",    food_name: "サーモン+ブロッコリー+豆腐", calories: 480, protein_g: 42, fat_g: 18, carbs_g: 28 },
  { client_id: CLIENT_ID, meal_date: date, meal_type: "snack",     food_name: "プロテインバー", calories: 200, protein_g: 20, fat_g: 6, carbs_g: 18 },
]);

const { error: mealErr } = await sb.from("meal_records").insert(mealRecords);
if (mealErr) console.error("meal_records error:", mealErr.message);
else console.log(`✅ ${mealRecords.length} meal records inserted`);

// ── 目標設定 ────────────────────────────────────────────────────

const { error: goalErr } = await sb.from("client_goals").insert({
  client_id: CLIENT_ID,
  target_weight_kg: 72.0,
  target_body_fat_pct: 15.0,
  target_muscle_kg: 62.0,
  target_date: "2026-07-01",
  weekly_training_sessions: 3,
  daily_calories_kcal: 2200,
  daily_protein_g: 160,
  daily_fat_g: 60,
  daily_carbs_g: 220,
  recommended_exercises: ["ベンチプレス", "スクワット", "デッドリフト", "ラットプルダウン", "ショルダープレス"],
  roadmap_text: "3ヶ月で体脂肪率15%を目標。週3回の筋トレ+食事管理。タンパク質160g/日を徹底。",
});
if (goalErr) console.error("client_goals error:", goalErr.message);
else console.log("✅ client goals inserted");

console.log("\n🎉 デモデータ投入完了！");
console.log(`クライアントURL: https://allyourfit.com/client/${CLIENT_ID}`);
console.log(`PIN: 1234`);
