// scripts/seed-demo.mjs
// テスト太郎に30日分のダミーデータを投入する
// 実行: node scripts/seed-demo.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cpjskwdsznfupicsqbpy.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwanNrd2Rzem5mdXBpY3NxYnB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQ1MTEwMiwiZXhwIjoyMDkxMDI3MTAyfQ.GFpdK43tiyYb5ucDNK9KDGhmSz2tkJUGMlr3JQ4AChw";
const CLIENT_ID = "309a5ad3-d7f2-4ba5-99dd-a95a6e6b00cd";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function dateStr(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

function isoStr(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(7, 0, 0, 0);
  return d.toISOString();
}

// ── 身体データ: 30日分（体重・体脂肪・筋肉量が徐々に改善） ──────────────
const bodyRecords = Array.from({ length: 30 }, (_, i) => {
  const day = 29 - i; // 29日前→今日
  const progress = i / 29;
  const noise = () => (Math.random() - 0.5) * 0.4;
  return {
    client_id: CLIENT_ID,
    recorded_at: isoStr(day),
    weight_kg:       +(78.5 - progress * 2.8 + noise()).toFixed(1),
    body_fat_pct:    +(22.4 - progress * 2.6 + noise() * 0.5).toFixed(1),
    muscle_mass_kg:  +(57.2 + progress * 1.4 + noise() * 0.3).toFixed(1),
    systolic_bp:     Math.round(122 - progress * 6 + (Math.random() - 0.5) * 8),
    diastolic_bp:    Math.round(78  - progress * 4 + (Math.random() - 0.5) * 6),
    resting_heart_rate: Math.round(64 - progress * 4 + (Math.random() - 0.5) * 4),
    sleep_hours:     +(6.2 + Math.random() * 1.8).toFixed(1),
    condition_score: Math.min(10, Math.round(6 + progress * 2.5 + (Math.random() - 0.5) * 2)),
  };
});

// ── トレーニング: 週3〜4回（胸・脚・背中・肩のローテーション） ────────────
const trainingDays = [29,27,24,21,18,16,13,10,8,5,3,1].filter(d => d <= 29);

const WORKOUTS = [
  {
    name: "胸トレ",
    sets: [
      { exercise_name: "ベンチプレス",       muscle_group: "胸", base_weight: 82.5, reps: 5,  sets: 4 },
      { exercise_name: "インクラインDB",      muscle_group: "胸", base_weight: 26,   reps: 10, sets: 3 },
      { exercise_name: "ケーブルクロスオーバー", muscle_group: "胸", base_weight: 14,   reps: 12, sets: 3 },
    ],
  },
  {
    name: "脚トレ",
    sets: [
      { exercise_name: "スクワット",          muscle_group: "脚", base_weight: 110,  reps: 5,  sets: 4 },
      { exercise_name: "ブルガリアンスクワット", muscle_group: "脚", base_weight: 22,   reps: 10, sets: 3 },
      { exercise_name: "レッグプレス",         muscle_group: "脚", base_weight: 165,  reps: 12, sets: 3 },
      { exercise_name: "レッグカール",         muscle_group: "脚", base_weight: 45,   reps: 12, sets: 3 },
    ],
  },
  {
    name: "背中トレ",
    sets: [
      { exercise_name: "デッドリフト",         muscle_group: "背中", base_weight: 122.5, reps: 5,  sets: 3 },
      { exercise_name: "ラットプルダウン",      muscle_group: "背中", base_weight: 65,    reps: 10, sets: 3 },
      { exercise_name: "シーテッドロウ",       muscle_group: "背中", base_weight: 58,    reps: 10, sets: 3 },
      { exercise_name: "チンニング",           muscle_group: "背中", base_weight: 0,     reps: 7,  sets: 3 },
    ],
  },
  {
    name: "肩トレ",
    sets: [
      { exercise_name: "ショルダープレス",     muscle_group: "肩", base_weight: 38, reps: 10, sets: 4 },
      { exercise_name: "サイドレイズ",         muscle_group: "肩", base_weight: 11, reps: 15, sets: 4 },
      { exercise_name: "フェイスプル",         muscle_group: "肩", base_weight: 22, reps: 15, sets: 3 },
    ],
  },
];

const trainingSessions = trainingDays.map((day, idx) => {
  const workout = WORKOUTS[idx % WORKOUTS.length];
  const progress = (29 - day) / 29;
  return {
    day,
    notes: workout.name,
    sets: workout.sets.flatMap((ex, exIdx) =>
      Array.from({ length: ex.sets }, (_, setIdx) => ({
        exercise_name: ex.exercise_name,
        muscle_group:  ex.muscle_group,
        weight_kg:     +(ex.base_weight * (1 + progress * 0.08) + (Math.random() - 0.5) * 2.5).toFixed(1),
        reps:          ex.reps + (setIdx === 0 ? 0 : -1),
        set_number:    setIdx + 1,
        rpe:           7 + Math.round(Math.random() * 2),
      }))
    ),
  };
});

// ── 食事: 30日分（1日3食） ────────────────────────────────────────────
const MEALS = [
  { meal_type: "breakfast", food_name: "オートミール＋プロテインシェイク",  calories: 440, protein_g: 38, fat_g: 8,  carbs_g: 52 },
  { meal_type: "breakfast", food_name: "全粒粉トースト＋目玉焼き2個",        calories: 380, protein_g: 22, fat_g: 14, carbs_g: 44 },
  { meal_type: "breakfast", food_name: "ギリシャヨーグルト＋バナナ",         calories: 320, protein_g: 18, fat_g: 4,  carbs_g: 55 },
  { meal_type: "lunch",     food_name: "鶏むね肉弁当（麦ご飯）",            calories: 680, protein_g: 52, fat_g: 11, carbs_g: 75 },
  { meal_type: "lunch",     food_name: "サバ定食",                          calories: 720, protein_g: 46, fat_g: 22, carbs_g: 68 },
  { meal_type: "lunch",     food_name: "サラダチキン＋玄米",                 calories: 590, protein_g: 48, fat_g: 8,  carbs_g: 62 },
  { meal_type: "dinner",    food_name: "サーモン＋ブロッコリー＋さつまいも", calories: 580, protein_g: 44, fat_g: 16, carbs_g: 52 },
  { meal_type: "dinner",    food_name: "牛赤身ステーキ＋野菜炒め",           calories: 620, protein_g: 50, fat_g: 20, carbs_g: 30 },
  { meal_type: "dinner",    food_name: "豆腐チャンプルー＋玄米",             calories: 540, protein_g: 32, fat_g: 14, carbs_g: 58 },
];

const mealRecords = Array.from({ length: 30 }, (_, i) => {
  const day = 29 - i;
  const date = dateStr(day);
  const breakfast = MEALS[i % 3];
  const lunch     = MEALS[3 + (i % 3)];
  const dinner    = MEALS[6 + (i % 3)];
  return [
    { client_id: CLIENT_ID, meal_date: date, ...breakfast },
    { client_id: CLIENT_ID, meal_date: date, ...lunch },
    { client_id: CLIENT_ID, meal_date: date, ...dinner },
  ];
}).flat();

// ── 投入実行 ──────────────────────────────────────────────────────────
async function seed() {
  console.log("既存データを削除中...");
  await supabase.from("meal_records").delete().eq("client_id", CLIENT_ID);
  await supabase.from("body_records").delete().eq("client_id", CLIENT_ID);

  // training_sets → training_sessions の順で削除
  const { data: sessions } = await supabase
    .from("training_sessions").select("id").eq("client_id", CLIENT_ID);
  if (sessions?.length) {
    const ids = sessions.map(s => s.id);
    await supabase.from("training_sets").delete().in("session_id", ids);
    await supabase.from("training_sessions").delete().eq("client_id", CLIENT_ID);
  }

  console.log("身体データ投入中...", bodyRecords.length, "件");
  const { error: bodyErr } = await supabase.from("body_records").insert(bodyRecords);
  if (bodyErr) { console.error("body_records error:", bodyErr.message); process.exit(1); }

  console.log("食事データ投入中...", mealRecords.length, "件");
  const { error: mealErr } = await supabase.from("meal_records").insert(mealRecords);
  if (mealErr) { console.error("meal_records error:", mealErr.message); process.exit(1); }

  console.log("トレーニングデータ投入中...", trainingSessions.length, "セッション");
  for (const s of trainingSessions) {
    const { data: session, error: sessErr } = await supabase
      .from("training_sessions")
      .insert({ client_id: CLIENT_ID, session_date: dateStr(s.day), notes: s.notes })
      .select().single();
    if (sessErr) { console.error("session error:", sessErr.message); continue; }

    const setsToInsert = s.sets.map(set => ({ session_id: session.id, ...set }));
    const { error: setsErr } = await supabase.from("training_sets").insert(setsToInsert);
    if (setsErr) { console.error("sets error:", setsErr.message); }
  }

  console.log("✅ 完了！ https://allyourfit.com/demo で確認してください");
}

seed().catch(console.error);
