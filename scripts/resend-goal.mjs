import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env.local");
const env = fs.readFileSync(envPath, "utf8");
const tokenMatch = env.match(/^LINE_CHANNEL_ACCESS_TOKEN=(.*)$/m);
const token = tokenMatch[1].replace(/^"|"$/g, "").trim();

const lineUserId = "Ueccf97136697082a246931a30bc2172e";
const trainerName = "まさや";
const name = "じゅんちゃん";
const goals = {
  daily_calories_kcal: 2200,
  daily_protein_g: 138,
  daily_fat_g: 61,
  daily_carbs_g: 220,
  weekly_training_sessions: 5,
  recommended_exercises: ["スクワット", "デッドリフト", "ベンチプレス", "ランニング", "HIITトレーニング"],
  target_weight_kg: 65,
  target_body_fat_pct: 10,
  target_date: "2026-05-17",
  roadmap_text: "じゅんちゃんへ！約32日という短期間での目標達成は非常にチャレンジングですが、高い活動レベルと適切な栄養管理で可能です。毎日の積み重ねが成功の鍵。短期集中で理想の体を手に入れましょう！",
  nutrition_advice: "タンパク質を意識的に摂取し、筋肉の分解を防ぎながら減量します。夜遅い食事や間食を避け、朝食をしっかり摂って代謝をサポート。水分補給を心がけ、加工食品は最小限に。",
};

const lines = [
  `${name} さん、お待たせしました！🎉`,
  `${trainerName} トレーナーが個別プランを作成しました📊`,
  ``,
  `【毎日の栄養目標】`,
  `🔥 カロリー: ${goals.daily_calories_kcal} kcal`,
  `💪 タンパク質: ${goals.daily_protein_g}g`,
  `🫙 脂質: ${goals.daily_fat_g}g`,
  `🍚 炭水化物: ${goals.daily_carbs_g}g`,
  ``,
  `【食事・サプリアドバイス】`,
  goals.nutrition_advice,
  ``,
  `【トレーニング目標】`,
  `🏋 週${goals.weekly_training_sessions}回`,
  `推奨種目: ${goals.recommended_exercises.join("・")}`,
  ``,
  `【身体目標】`,
  `⚖️ 目標体重: ${goals.target_weight_kg}kg`,
  `📉 目標体脂肪率: ${goals.target_body_fat_pct}%`,
  `📅 目標日: ${goals.target_date}`,
  ``,
  `【トレーナーからのメッセージ】`,
  goals.roadmap_text,
  ``,
  `一緒に頑張りましょう💪 — ${trainerName} トレーナー`,
];

const guideLines = [
  `📸 ここからは記録のコツをお伝えします`,
  ``,
  `フィットネスアプリのスクショをこのLINEに送るだけで自動でデータが入ります✅`,
  ``,
  `【月間の上限】`,
  `🗓 1ヶ月150枚まで（1日あたり約5枚が目安）`,
  ``,
  `【上限内に収める1日のおすすめ撮り方】`,
  `🍽 食事: 1日の合計が見える「サマリー画面」を1枚`,
  `   （あすけん・MyFitnessPal・カロミルなど、どのアプリでも"今日の合計栄養"が出る画面でOK）`,
  `💪 筋トレ: セッション全体が映る画面を1〜2枚`,
  `   （筋トレメモ・STRONG・Hevyなど）`,
  `⚖️ 体重: 体組成計の結果を1枚`,
  `🏃 有酸素: ワークアウトの結果を1枚`,
  ``,
  `→ 1日4〜5枚に収まれば月150枚以内で運用できます`,
  ``,
  `【補足】`,
  `・1食ごとに細かく送るより「1日の合計画面」1枚の方がデータが正確で枚数も節約できます`,
  `・他人の名前や個人情報が映る場合はマスキング（隠す）してから送ってOKです`,
  `・スクショの種類が違っても自動で判別するので、慣れているアプリを使って大丈夫です`,
  ``,
  `わからないことがあれば ${trainerName} トレーナーに気軽に聞いてくださいね😊`,
];

const body = {
  to: lineUserId,
  messages: [
    { type: "text", text: lines.join("\n") },
    { type: "text", text: guideLines.join("\n") },
  ],
};

const res = await fetch("https://api.line.me/v2/bot/message/push", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(body),
});
console.log("HTTP", res.status, await res.text());
