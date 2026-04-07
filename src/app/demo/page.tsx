// /demo — 認証不要のデモページ（モックデータ使用）
import ClientDashboard from "@/components/ClientDashboard";

const CLIENT = {
  id: "demo",
  name: "田中 健太",
  goal: "体脂肪15%以下・ベンチプレス100kg達成",
  start_date: "2025-12-01",
};

// 30日分の体重・体組成データ
function bodyRecords() {
  const base = [
    { weight_kg: 78.2, body_fat_pct: 22.1, muscle_mass_kg: 57.4 },
    { weight_kg: 77.9, body_fat_pct: 21.8, muscle_mass_kg: 57.5 },
    { weight_kg: 77.5, body_fat_pct: 21.4, muscle_mass_kg: 57.7 },
    { weight_kg: 77.3, body_fat_pct: 21.0, muscle_mass_kg: 57.9 },
    { weight_kg: 77.1, body_fat_pct: 20.8, muscle_mass_kg: 58.1 },
    { weight_kg: 76.8, body_fat_pct: 20.5, muscle_mass_kg: 58.3 },
    { weight_kg: 76.6, body_fat_pct: 20.2, muscle_mass_kg: 58.4 },
    { weight_kg: 76.4, body_fat_pct: 19.9, muscle_mass_kg: 58.6 },
    { weight_kg: 76.1, body_fat_pct: 19.6, muscle_mass_kg: 58.8 },
    { weight_kg: 75.8, body_fat_pct: 19.3, muscle_mass_kg: 59.0 },
  ];
  const today = new Date();
  return base.map((b, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (base.length - 1 - i) * 3);
    return {
      id: `br-${i}`,
      client_id: "demo",
      recorded_at: d.toISOString(),
      systolic_bp: 118 + Math.floor(Math.random() * 8),
      diastolic_bp: 76 + Math.floor(Math.random() * 6),
      resting_heart_rate: 58 + Math.floor(Math.random() * 8),
      sleep_hours: 6.5 + Math.random() * 1.5,
      condition_score: 7 + Math.floor(Math.random() * 3),
      ...b,
    };
  });
}

// トレーニングセッション（直近8回）
const TRAINING_SESSIONS = [
  {
    id: "ts-1", client_id: "demo",
    session_date: offset(-1),
    notes: "ベンチ自己ベスト更新 95kg×3",
    training_sets: [
      { id: "s1", exercise_name: "ベンチプレス", muscle_group: "胸", weight_kg: 95, reps: 3, set_number: 1, rpe: 9 },
      { id: "s2", exercise_name: "ベンチプレス", muscle_group: "胸", weight_kg: 90, reps: 5, set_number: 2, rpe: 8 },
      { id: "s3", exercise_name: "ベンチプレス", muscle_group: "胸", weight_kg: 85, reps: 6, set_number: 3, rpe: 7 },
      { id: "s4", exercise_name: "インクラインダンベルプレス", muscle_group: "胸", weight_kg: 30, reps: 10, set_number: 1, rpe: 7 },
      { id: "s5", exercise_name: "インクラインダンベルプレス", muscle_group: "胸", weight_kg: 30, reps: 9, set_number: 2, rpe: 8 },
      { id: "s6", exercise_name: "ケーブルクロスオーバー", muscle_group: "胸", weight_kg: 15, reps: 12, set_number: 1, rpe: 6 },
      { id: "s7", exercise_name: "ケーブルクロスオーバー", muscle_group: "胸", weight_kg: 15, reps: 12, set_number: 2, rpe: 7 },
    ],
  },
  {
    id: "ts-2", client_id: "demo",
    session_date: offset(-4),
    notes: null,
    training_sets: [
      { id: "s8",  exercise_name: "スクワット", muscle_group: "脚", weight_kg: 120, reps: 5, set_number: 1, rpe: 8 },
      { id: "s9",  exercise_name: "スクワット", muscle_group: "脚", weight_kg: 115, reps: 6, set_number: 2, rpe: 8 },
      { id: "s10", exercise_name: "スクワット", muscle_group: "脚", weight_kg: 110, reps: 8, set_number: 3, rpe: 7 },
      { id: "s11", exercise_name: "ブルガリアンスクワット", muscle_group: "脚", weight_kg: 25, reps: 10, set_number: 1, rpe: 8 },
      { id: "s12", exercise_name: "ブルガリアンスクワット", muscle_group: "脚", weight_kg: 25, reps: 10, set_number: 2, rpe: 8 },
      { id: "s13", exercise_name: "レッグプレス", muscle_group: "脚", weight_kg: 180, reps: 12, set_number: 1, rpe: 7 },
    ],
  },
  {
    id: "ts-3", client_id: "demo",
    session_date: offset(-7),
    notes: null,
    training_sets: [
      { id: "s14", exercise_name: "デッドリフト", muscle_group: "背中", weight_kg: 130, reps: 5, set_number: 1, rpe: 8 },
      { id: "s15", exercise_name: "デッドリフト", muscle_group: "背中", weight_kg: 125, reps: 5, set_number: 2, rpe: 8 },
      { id: "s16", exercise_name: "ラットプルダウン", muscle_group: "背中", weight_kg: 70, reps: 10, set_number: 1, rpe: 7 },
      { id: "s17", exercise_name: "ラットプルダウン", muscle_group: "背中", weight_kg: 70, reps: 10, set_number: 2, rpe: 7 },
      { id: "s18", exercise_name: "シーテッドロウ", muscle_group: "背中", weight_kg: 60, reps: 10, set_number: 1, rpe: 7 },
      { id: "s19", exercise_name: "シーテッドロウ", muscle_group: "背中", weight_kg: 60, reps: 10, set_number: 2, rpe: 7 },
    ],
  },
  {
    id: "ts-4", client_id: "demo",
    session_date: offset(-10),
    notes: null,
    training_sets: [
      { id: "s20", exercise_name: "ベンチプレス", muscle_group: "胸", weight_kg: 90, reps: 5, set_number: 1, rpe: 8 },
      { id: "s21", exercise_name: "ベンチプレス", muscle_group: "胸", weight_kg: 87.5, reps: 6, set_number: 2, rpe: 7 },
      { id: "s22", exercise_name: "ショルダープレス", muscle_group: "肩", weight_kg: 40, reps: 10, set_number: 1, rpe: 7 },
      { id: "s23", exercise_name: "ショルダープレス", muscle_group: "肩", weight_kg: 40, reps: 9, set_number: 2, rpe: 8 },
      { id: "s24", exercise_name: "サイドレイズ", muscle_group: "肩", weight_kg: 12, reps: 15, set_number: 1, rpe: 7 },
    ],
  },
  {
    id: "ts-5", client_id: "demo", session_date: offset(-13), notes: null,
    training_sets: [
      { id: "s25", exercise_name: "スクワット", muscle_group: "脚", weight_kg: 115, reps: 5, set_number: 1, rpe: 8 },
      { id: "s26", exercise_name: "スクワット", muscle_group: "脚", weight_kg: 110, reps: 6, set_number: 2, rpe: 7 },
      { id: "s27", exercise_name: "レッグカール", muscle_group: "脚", weight_kg: 50, reps: 12, set_number: 1, rpe: 7 },
    ],
  },
  {
    id: "ts-6", client_id: "demo", session_date: offset(-17), notes: null,
    training_sets: [
      { id: "s28", exercise_name: "デッドリフト", muscle_group: "背中", weight_kg: 125, reps: 5, set_number: 1, rpe: 8 },
      { id: "s29", exercise_name: "チンニング", muscle_group: "背中", weight_kg: 0, reps: 8, set_number: 1, rpe: 8 },
      { id: "s30", exercise_name: "チンニング", muscle_group: "背中", weight_kg: 0, reps: 7, set_number: 2, rpe: 9 },
    ],
  },
  {
    id: "ts-7", client_id: "demo", session_date: offset(-21), notes: null,
    training_sets: [
      { id: "s31", exercise_name: "ベンチプレス", muscle_group: "胸", weight_kg: 87.5, reps: 5, set_number: 1, rpe: 8 },
      { id: "s32", exercise_name: "ベンチプレス", muscle_group: "胸", weight_kg: 85, reps: 6, set_number: 2, rpe: 8 },
      { id: "s33", exercise_name: "インクラインダンベルプレス", muscle_group: "胸", weight_kg: 28, reps: 10, set_number: 1, rpe: 7 },
    ],
  },
  {
    id: "ts-8", client_id: "demo", session_date: offset(-25), notes: null,
    training_sets: [
      { id: "s34", exercise_name: "スクワット", muscle_group: "脚", weight_kg: 110, reps: 5, set_number: 1, rpe: 8 },
      { id: "s35", exercise_name: "レッグプレス", muscle_group: "脚", weight_kg: 170, reps: 12, set_number: 1, rpe: 7 },
    ],
  },
];

// 食事記録（直近7日）
function mealRecords() {
  const meals = [];
  for (let d = 0; d < 7; d++) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split("T")[0];
    const baseCalories = 2200 + Math.floor(Math.random() * 300 - 150);
    meals.push(
      { id: `m${d}-1`, client_id: "demo", meal_date: dateStr, meal_type: "breakfast", food_name: "オートミール＋プロテイン", calories: 420, protein_g: 32, fat_g: 8, carbs_g: 55 },
      { id: `m${d}-2`, client_id: "demo", meal_date: dateStr, meal_type: "lunch",     food_name: "鶏むね肉弁当",           calories: 680, protein_g: 48, fat_g: 12, carbs_g: 72 },
      { id: `m${d}-3`, client_id: "demo", meal_date: dateStr, meal_type: "snack",     food_name: "ギリシャヨーグルト",      calories: 150, protein_g: 15, fat_g: 3,  carbs_g: 12 },
      { id: `m${d}-4`, client_id: "demo", meal_date: dateStr, meal_type: "dinner",    food_name: "サーモン＋ブロッコリー",  calories: 580, protein_g: 42, fat_g: 18, carbs_g: 38 },
    );
  }
  return meals;
}

const ASSESSMENT = {
  id: "demo-assessment",
  client_id: "demo",
  generated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  published_at: new Date().toISOString(),
  current_summary:
    "開始から60日で体重-2.4kg・体脂肪率-2.8%と順調に進捗しています。ベンチプレスも85kg→95kgへ10kg増加し、筋力向上と減量を同時に達成できています。トレーニング頻度・栄養バランスともに安定しており、このペースを維持することで目標達成は十分可能です。",
  prediction_1m:
    "現在のペースを維持した場合、体重75kg・体脂肪率18%台に到達見込みです。ベンチプレスは97.5〜100kgの自己ベスト更新が期待できます。",
  prediction_3m:
    "3ヶ月後には体重73kg・体脂肪率15%以下の目標に到達できる可能性が高いです。ただし、停滞期（プラトー）が1〜2週間発生する可能性があるため、その際のカロリー調整が鍵になります。",
  action_plan:
    "① タンパク質を毎日体重×2g（約150g）確保する ② 週4回のトレーニングを継続 ③ 睡眠7時間以上を優先する ④ ベンチプレスは2週に1回PR挑戦日を設ける",
  risk_obesity: "low",
  risk_musculoskeletal: "low",
  risk_nutrition: "medium",
  risk_sleep: "medium",
  trainer_notes: "この2ヶ月の取り組みは本当に素晴らしい。特に食事管理の徹底が結果に直結しています。次の目標はベンチ100kg！",
};

function offset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export default function DemoPage() {
  return (
    <div>
      {/* デモバナー */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center">
        <p className="text-amber-400 text-xs font-medium">
          🎯 これはデモページです。すべてのデータはサンプルです。
        </p>
      </div>
      <ClientDashboard
        client={CLIENT}
        bodyRecords={bodyRecords()}
        trainingSessions={TRAINING_SESSIONS}
        mealRecords={mealRecords()}
        bodyPhotos={[]}
        assessment={ASSESSMENT}
      />
    </div>
  );
}
