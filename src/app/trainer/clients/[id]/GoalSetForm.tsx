"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  clientId: string;
  clientName: string;
  lineUserId: string | null;
  existingGoals: any | null;
  intakeData: {
    height_cm: number | null;
    birth_year: number | null;
    gender: string | null;
    health_concerns: string | null;
    activity_level: string | null;
    latest_weight: number | null;
    latest_body_fat: number | null;
  };
  onSent?: () => void;
}

const ACTIVITY_PAL: Record<string, number> = {
  sedentary: 1.4, light: 1.6, moderate: 1.75, active: 1.9,
};
const ACTIVITY_LABEL: Record<string, string> = {
  sedentary: "座りがち", light: "軽め", moderate: "適度", active: "活発",
};

function calcBMR(weightKg: number, heightCm: number, ageYears: number, gender: string): number {
  if (gender === "female") return 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
  return 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5;
}

const inputCls =
  "w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 placeholder:text-slate-300 transition-all";
const labelCls = "block text-xs font-medium text-slate-500 mb-1";

// ── 種目マスタ ──────────────────────────────────────────────
const EXERCISE_MASTER: { group: string; exercises: string[] }[] = [
  {
    group: "胸",
    exercises: ["ベンチプレス", "インクラインベンチプレス", "デクラインベンチプレス", "ダンベルフライ", "ケーブルクロスオーバー", "ディップス", "プッシュアップ"],
  },
  {
    group: "背中",
    exercises: ["デッドリフト", "ラットプルダウン", "ベントオーバーロー", "シーテッドロー", "チンアップ", "ワンハンドロー", "フェイスプル", "懸垂"],
  },
  {
    group: "肩",
    exercises: ["ショルダープレス", "ダンベルショルダープレス", "サイドレイズ", "フロントレイズ", "リアデルトフライ", "アーノルドプレス", "アップライトロー"],
  },
  {
    group: "脚",
    exercises: ["スクワット", "レッグプレス", "ルーマニアンデッドリフト", "ブルガリアンスクワット", "レッグカール", "レッグエクステンション", "ヒップスラスト", "カーフレイズ", "ランジ"],
  },
  {
    group: "腕",
    exercises: ["バーベルカール", "ダンベルカール", "ハンマーカール", "トライセップスプレスダウン", "スカルクラッシャー", "ナローベンチプレス", "コンセントレーションカール"],
  },
  {
    group: "体幹",
    exercises: ["プランク", "クランチ", "レッグレイズ", "ロシアンツイスト", "アブローラー", "サイドプランク", "バードドッグ"],
  },
  {
    group: "有酸素",
    exercises: ["ランニング", "サイクリング", "ウォーキング", "HIIT", "縄跳び", "水泳", "ローイング"],
  },
];

// ── 種目選択コンポーネント ──────────────────────────────────
function ExercisePicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filteredGroups = EXERCISE_MASTER.map((g) => ({
    ...g,
    exercises: g.exercises.filter(
      (e) => !selected.includes(e) && (query === "" || e.includes(query))
    ),
  })).filter((g) => g.exercises.length > 0);

  const add = (ex: string) => {
    onChange([...selected, ex]);
    setQuery("");
  };

  const remove = (ex: string) => onChange(selected.filter((e) => e !== ex));

  return (
    <div className="space-y-2">
      {/* 選択済みチップ */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((ex) => (
            <span
              key={ex}
              className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full"
            >
              {ex}
              <button
                type="button"
                onClick={() => remove(ex)}
                className="text-blue-400 hover:text-blue-700 leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 検索入力 */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className={inputCls}
          placeholder="種目を検索・追加（例: スクワット）"
        />

        {/* ドロップダウン */}
        {open && filteredGroups.length > 0 && (
          <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
            {filteredGroups.map((g) => (
              <div key={g.group}>
                <p className="text-[10px] font-bold text-slate-400 px-3 pt-2 pb-1 uppercase tracking-wider">{g.group}</p>
                {g.exercises.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onMouseDown={() => add(ex)}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ボタングリッド（検索なしで全体表示） */}
      {query === "" && !open && (
        <div className="flex flex-wrap gap-1.5">
          {EXERCISE_MASTER.map((g) =>
            g.exercises
              .filter((e) => !selected.includes(e))
              .slice(0, 3)
              .map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => add(ex)}
                  className="text-xs bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-500 px-2.5 py-1 rounded-full transition-colors"
                >
                  + {ex}
                </button>
              ))
          )}
        </div>
      )}
    </div>
  );
}

// ── LINEプレビューモーダル ──────────────────────────────────
function LinePreviewModal({
  clientName,
  form,
  selectedExercises,
  onClose,
}: {
  clientName: string;
  form: any;
  selectedExercises: string[];
  onClose: () => void;
}) {
  const lines: string[] = [
    `${clientName} さん、お待たせしました！🎉`,
    `トレーナーが個別プランを作成しました📊`,
    ``,
  ];

  if (form.daily_calories_kcal || form.daily_protein_g) {
    lines.push(`【毎日の栄養目標】`);
    if (form.daily_calories_kcal) lines.push(`🔥 カロリー: ${form.daily_calories_kcal} kcal`);
    if (form.daily_protein_g)     lines.push(`💪 タンパク質: ${form.daily_protein_g}g`);
    if (form.daily_fat_g)         lines.push(`🫙 脂質: ${form.daily_fat_g}g`);
    if (form.daily_carbs_g)       lines.push(`🍚 炭水化物: ${form.daily_carbs_g}g`);
    lines.push(``);
  }

  if (form.nutrition_advice) {
    lines.push(`【食事・サプリアドバイス】`);
    lines.push(form.nutrition_advice);
    lines.push(``);
  }

  if (form.weekly_training_sessions) {
    lines.push(`【トレーニング目標】`);
    lines.push(`🏋 週${form.weekly_training_sessions}回`);
    if (selectedExercises.length > 0) {
      lines.push(`推奨種目: ${selectedExercises.join("・")}`);
    }
    lines.push(``);
  }

  if (form.target_weight_kg || form.target_body_fat_pct) {
    lines.push(`【身体目標】`);
    if (form.target_weight_kg)    lines.push(`⚖️ 目標体重: ${form.target_weight_kg}kg`);
    if (form.target_body_fat_pct) lines.push(`📉 目標体脂肪率: ${form.target_body_fat_pct}%`);
    if (form.target_date)         lines.push(`📅 目標日: ${form.target_date}`);
    lines.push(``);
  }

  if (form.roadmap_text) {
    lines.push(`【トレーナーからのメッセージ】`);
    lines.push(form.roadmap_text);
    lines.push(``);
  }

  lines.push(`毎日スクショを送るだけで自動記録されます📸`);
  lines.push(`一緒に頑張りましょう💪`);

  const messageText = lines.join("\n");

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm max-h-[80vh] overflow-hidden flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <p className="text-sm font-bold text-slate-700">LINEメッセージ プレビュー</p>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* LINEチャット風 */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#8ABCA7]">
          <div className="flex justify-start">
            <div className="max-w-[85%]">
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{messageText}</p>
              </div>
              <p className="text-[10px] text-white/70 mt-1 ml-1">Client Fit</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 text-center">実際のLINEメッセージの受信イメージです</p>
        </div>
      </div>
    </div>
  );
}

// ── メインフォーム ──────────────────────────────────────────
export default function GoalSetForm({ clientId, clientName, lineUserId, existingGoals, intakeData, onSent }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggested, setSuggested] = useState(false);
  const [savedGoalId, setSavedGoalId] = useState<string | null>(existingGoals?.id ?? null);
  const [sentAt, setSentAt] = useState<string | null>(existingGoals?.sent_at ?? null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const [selectedExercises, setSelectedExercises] = useState<string[]>(
    existingGoals?.recommended_exercises ?? []
  );

  const [form, setForm] = useState({
    daily_calories_kcal:      existingGoals?.daily_calories_kcal?.toString() ?? "",
    daily_protein_g:          existingGoals?.daily_protein_g?.toString() ?? "",
    daily_fat_g:              existingGoals?.daily_fat_g?.toString() ?? "",
    daily_carbs_g:            existingGoals?.daily_carbs_g?.toString() ?? "",
    weekly_training_sessions: existingGoals?.weekly_training_sessions?.toString() ?? "",
    target_weight_kg:         existingGoals?.target_weight_kg?.toString() ?? "",
    target_body_fat_pct:      existingGoals?.target_body_fat_pct?.toString() ?? "",
    target_muscle_kg:         existingGoals?.target_muscle_kg?.toString() ?? "",
    target_date:              existingGoals?.target_date ?? "",
    roadmap_text:             existingGoals?.roadmap_text ?? "",
    nutrition_advice:         existingGoals?.nutrition_advice ?? "",
    trainer_notes:            existingGoals?.trainer_notes ?? "",
  });

  const age = intakeData.birth_year ? new Date().getFullYear() - intakeData.birth_year : null;
  const pal = ACTIVITY_PAL[intakeData.activity_level ?? "moderate"] ?? 1.75;

  // 初回問診から即時計算するBMR/TDEE
  const initBmr = (intakeData.latest_weight && intakeData.height_cm && age && intakeData.gender)
    ? Math.round(calcBMR(intakeData.latest_weight, intakeData.height_cm, age, intakeData.gender))
    : null;
  const initTdee = initBmr ? Math.round(initBmr * pal) : null;

  const [bmr, setBmr] = useState<number | null>(initBmr);
  const [tdee, setTdee] = useState<number | null>(initTdee);

  // 目標筋肉量の自動計算
  const autoMuscleKg = (weightKg: string, bodyFatPct: string): string => {
    const w = parseFloat(weightKg);
    const bf = parseFloat(bodyFatPct);
    if (!isNaN(w) && !isNaN(bf) && w > 0 && bf >= 0 && bf < 100) {
      return (w * (1 - bf / 100)).toFixed(1);
    }
    return "";
  };

  // カロリー不足量の計算
  const targetWeightKg = parseFloat(form.target_weight_kg);
  const currentWeightKg = intakeData.latest_weight ?? 0;
  const weightToLoseKg = currentWeightKg - targetWeightKg;
  const daysRemaining = form.target_date
    ? Math.max(1, Math.round((new Date(form.target_date).getTime() - Date.now()) / 86400000))
    : null;
  const dailyDeficit = (weightToLoseKg > 0.1 && daysRemaining && daysRemaining > 0)
    ? Math.round((weightToLoseKg * 7200) / daysRemaining)
    : null;
  const recommendedCalories = (tdee && dailyDeficit) ? tdee - dailyDeficit : null;

  // PFCからカロリー自動計算
  const calcCalories = () => {
    const p = parseFloat(form.daily_protein_g) || 0;
    const f = parseFloat(form.daily_fat_g) || 0;
    const c = parseFloat(form.daily_carbs_g) || 0;
    return Math.round(p * 4 + f * 9 + c * 4);
  };

  const pfcCalories = calcCalories();
  const enteredCalories = parseInt(form.daily_calories_kcal) || 0;
  const calorieDiff = enteredCalories - pfcCalories;

  const handleSuggest = async () => {
    setSuggesting(true);
    setError("");
    const res = await fetch("/api/trainer/goals/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        targetWeightKg: form.target_weight_kg ? parseFloat(form.target_weight_kg) : null,
        targetBodyFatPct: form.target_body_fat_pct ? parseFloat(form.target_body_fat_pct) : null,
        targetDate: form.target_date || null,
      }),
    });
    const data = await res.json();
    setSuggesting(false);
    if (!res.ok) { setError(data.error ?? "AI提案に失敗しました"); return; }
    const s = data.suggestions;
    setBmr(data.bmr ?? null);
    setTdee(data.tdee ?? null);
    setForm((prev) => ({
      ...prev,
      daily_calories_kcal: s.daily_calories_kcal?.toString() ?? prev.daily_calories_kcal,
      daily_protein_g:     s.daily_protein_g?.toString() ?? prev.daily_protein_g,
      daily_fat_g:         s.daily_fat_g?.toString() ?? prev.daily_fat_g,
      daily_carbs_g:       s.daily_carbs_g?.toString() ?? prev.daily_carbs_g,
      weekly_training_sessions: s.weekly_training_sessions?.toString() ?? prev.weekly_training_sessions,
      nutrition_advice:    s.nutrition_advice ?? prev.nutrition_advice,
      roadmap_text:        s.roadmap_text ?? prev.roadmap_text,
    }));
    if (s.recommended_exercises?.length) setSelectedExercises(s.recommended_exercises);
    setSuggested(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/trainer/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        daily_calories_kcal:      form.daily_calories_kcal ? parseInt(form.daily_calories_kcal) : null,
        daily_protein_g:          form.daily_protein_g ? parseFloat(form.daily_protein_g) : null,
        daily_fat_g:              form.daily_fat_g ? parseFloat(form.daily_fat_g) : null,
        daily_carbs_g:            form.daily_carbs_g ? parseFloat(form.daily_carbs_g) : null,
        weekly_training_sessions: form.weekly_training_sessions ? parseInt(form.weekly_training_sessions) : null,
        recommended_exercises:    selectedExercises.length ? selectedExercises : null,
        target_weight_kg:         form.target_weight_kg ? parseFloat(form.target_weight_kg) : null,
        target_body_fat_pct:      form.target_body_fat_pct ? parseFloat(form.target_body_fat_pct) : null,
        target_muscle_kg:         form.target_muscle_kg ? parseFloat(form.target_muscle_kg) : null,
        target_date:              form.target_date || null,
        roadmap_text:             form.roadmap_text || null,
        nutrition_advice:         form.nutrition_advice || null,
        trainer_notes:            form.trainer_notes || null,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "保存に失敗しました");
    } else {
      setSavedGoalId(data.goals.id);
      setSentAt(data.goals.sent_at);
      setSuccess("保存しました！");
      router.refresh();
    }
    setSaving(false);
  };

  const handleSaveAndSend = async () => {
    // 保存してからLINE送信
    setSaving(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/trainer/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        daily_calories_kcal:      form.daily_calories_kcal ? parseInt(form.daily_calories_kcal) : null,
        daily_protein_g:          form.daily_protein_g ? parseFloat(form.daily_protein_g) : null,
        daily_fat_g:              form.daily_fat_g ? parseFloat(form.daily_fat_g) : null,
        daily_carbs_g:            form.daily_carbs_g ? parseFloat(form.daily_carbs_g) : null,
        weekly_training_sessions: form.weekly_training_sessions ? parseInt(form.weekly_training_sessions) : null,
        recommended_exercises:    selectedExercises.length ? selectedExercises : null,
        target_weight_kg:         form.target_weight_kg ? parseFloat(form.target_weight_kg) : null,
        target_body_fat_pct:      form.target_body_fat_pct ? parseFloat(form.target_body_fat_pct) : null,
        target_muscle_kg:         form.target_muscle_kg ? parseFloat(form.target_muscle_kg) : null,
        target_date:              form.target_date || null,
        roadmap_text:             form.roadmap_text || null,
        nutrition_advice:         form.nutrition_advice || null,
        trainer_notes:            form.trainer_notes || null,
      }),
    });

    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "保存に失敗しました"); return; }

    const goalId = data.goals.id;
    setSavedGoalId(goalId);

    // LINE送信
    setSending(true);
    const sendRes = await fetch("/api/trainer/goals/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, goalId }),
    });
    const sendData = await sendRes.json();
    setSending(false);

    if (!sendRes.ok) {
      setError(sendData.error ?? "LINE送信に失敗しました");
    } else {
      setSentAt(new Date().toISOString());
      setSuccess("LINEで送信しました！");
      router.refresh();
      onSent?.();
    }
  };

  const handleSend = async () => {
    if (!savedGoalId) { setError("先に保存してください"); return; }
    if (!lineUserId) { setError("クライアントがLINE連携していません"); return; }
    setSending(true);
    setError("");

    const res = await fetch("/api/trainer/goals/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, goalId: savedGoalId }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "送信に失敗しました");
    } else {
      setSentAt(new Date().toISOString());
      setSuccess("LINEで送信しました！");
      router.refresh();
    }
    setSending(false);
  };

  const f = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <>
      {/* LINEプレビューモーダル */}
      {showPreview && (
        <LinePreviewModal
          clientName={clientName}
          form={form}
          selectedExercises={selectedExercises}
          onClose={() => setShowPreview(false)}
        />
      )}

      <div className="space-y-4 pb-28">

        {/* ── 初回問診データ ── */}
        {(intakeData.height_cm || intakeData.latest_weight) && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-semibold text-blue-600">初回入力データ（クライアント記入）</p>
            <div className="grid grid-cols-3 gap-3">
              {intakeData.height_cm && (
                <div>
                  <p className="text-[10px] text-slate-400">身長</p>
                  <p className="text-sm font-bold text-slate-700">{intakeData.height_cm} cm</p>
                </div>
              )}
              {intakeData.latest_weight && (
                <div>
                  <p className="text-[10px] text-slate-400">体重</p>
                  <p className="text-sm font-bold text-slate-700">{intakeData.latest_weight} kg</p>
                </div>
              )}
              {intakeData.latest_body_fat && (
                <div>
                  <p className="text-[10px] text-slate-400">体脂肪率</p>
                  <p className="text-sm font-bold text-slate-700">{intakeData.latest_body_fat} %</p>
                </div>
              )}
              {age && (
                <div>
                  <p className="text-[10px] text-slate-400">年齢</p>
                  <p className="text-sm font-bold text-slate-700">{age} 歳</p>
                </div>
              )}
              {intakeData.gender && (
                <div>
                  <p className="text-[10px] text-slate-400">性別</p>
                  <p className="text-sm font-bold text-slate-700">
                    {intakeData.gender === "male" ? "男性" : intakeData.gender === "female" ? "女性" : "その他"}
                  </p>
                </div>
              )}
              {intakeData.health_concerns && (
                <div className="col-span-3">
                  <p className="text-[10px] text-slate-400">健康上の注意</p>
                  <p className="text-sm text-slate-600">{intakeData.health_concerns}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── BMR/TDEE表示 ── */}
        {(bmr || tdee) && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-semibold text-indigo-700">現在の代謝（問診データから算出）</p>
            <div className="grid grid-cols-2 gap-3">
              {bmr && (
                <div>
                  <p className="text-[10px] text-indigo-400">基礎代謝 (BMR)</p>
                  <p className="text-lg font-black text-indigo-700">{bmr.toLocaleString()} <span className="text-xs font-normal">kcal</span></p>
                </div>
              )}
              {tdee && (
                <div>
                  <p className="text-[10px] text-indigo-400">総消費カロリー (TDEE) · {ACTIVITY_LABEL[intakeData.activity_level ?? "moderate"] ?? "適度"}</p>
                  <p className="text-lg font-black text-indigo-700">{tdee.toLocaleString()} <span className="text-xs font-normal">kcal</span></p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 身体目標 ── */}
        <Section title="① 身体目標を設定" icon="📈">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>目標体重 (kg)</label>
              <input
                type="number" inputMode="decimal" step="0.1"
                className={inputCls} placeholder="70.0"
                value={form.target_weight_kg}
                onChange={(e) => {
                  const newVal = e.target.value;
                  const muscle = autoMuscleKg(newVal, form.target_body_fat_pct);
                  setForm({ ...form, target_weight_kg: newVal, target_muscle_kg: muscle });
                }}
              />
            </div>
            <div>
              <label className={labelCls}>目標体脂肪率 (%)</label>
              <input
                type="number" inputMode="decimal" step="0.1"
                className={inputCls} placeholder="15.0"
                value={form.target_body_fat_pct}
                onChange={(e) => {
                  const newVal = e.target.value;
                  const muscle = autoMuscleKg(form.target_weight_kg, newVal);
                  setForm({ ...form, target_body_fat_pct: newVal, target_muscle_kg: muscle });
                }}
              />
            </div>
            <div>
              <label className={labelCls}>目標除脂肪体重 (kg) <span className="text-[9px] text-slate-300">自動計算</span></label>
              <input
                type="number" inputMode="decimal" step="0.1"
                className={`${inputCls} bg-slate-50`} placeholder="自動計算"
                value={form.target_muscle_kg}
                onChange={(e) => setForm({ ...form, target_muscle_kg: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>目標達成日</label>
              <input type="date" className={inputCls} {...f("target_date")} />
            </div>
          </div>

          {/* カロリー収支計算 */}
          {dailyDeficit !== null && tdee && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 space-y-1.5 mt-1">
              <p className="text-xs font-semibold text-orange-700">目標達成に必要なカロリー収支</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-orange-400">1日不足分</p>
                  <p className="text-sm font-bold text-orange-700">-{dailyDeficit.toLocaleString()} kcal</p>
                </div>
                <div>
                  <p className="text-[10px] text-orange-400">TDEE</p>
                  <p className="text-sm font-bold text-slate-600">{tdee.toLocaleString()} kcal</p>
                </div>
                <div>
                  <p className="text-[10px] text-orange-400">推奨摂取</p>
                  <p className="text-sm font-bold text-teal-600">{recommendedCalories?.toLocaleString()} kcal</p>
                </div>
              </div>
              <p className="text-[10px] text-orange-400 text-center">
                {weightToLoseKg.toFixed(1)}kg × 7,200kcal ÷ {daysRemaining}日
                {dailyDeficit > 1000 && <span className="text-rose-500 font-semibold ml-2">⚠️ 不足量が大きすぎます。期間を延ばすか目標を調整してください</span>}
              </p>
            </div>
          )}
        </Section>

        {/* ── AI提案ボタン ── */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleSuggest}
            disabled={suggesting}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white font-bold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            {suggesting ? (
              <><span className="animate-spin">⏳</span> AIが分析中...（10〜20秒）</>
            ) : suggested ? (
              "🔄 AIで再提案する"
            ) : (
              "✨ ② AIで栄養・トレーニング目標を自動入力"
            )}
          </button>
          {suggested && (
            <p className="text-[11px] text-violet-600 text-center">✅ AI提案を反映しました。内容を確認・修正してください</p>
          )}
        </div>

        {/* ── 栄養目標 ── */}
        <Section title="③ 栄養目標（AI提案を修正）" icon="🍽">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>1日カロリー (kcal)</label>
              <input type="number" inputMode="numeric" className={inputCls} placeholder="2200" {...f("daily_calories_kcal")} />
            </div>
            <div>
              <label className={labelCls}>タンパク質 (g)</label>
              <input type="number" inputMode="numeric" className={inputCls} placeholder="170" {...f("daily_protein_g")} />
            </div>
            <div>
              <label className={labelCls}>脂質 (g)</label>
              <input type="number" inputMode="numeric" className={inputCls} placeholder="60" {...f("daily_fat_g")} />
            </div>
            <div>
              <label className={labelCls}>炭水化物 (g)</label>
              <input type="number" inputMode="numeric" className={inputCls} placeholder="220" {...f("daily_carbs_g")} />
            </div>
          </div>
          {/* PFC整合チェック */}
          {(form.daily_protein_g || form.daily_fat_g || form.daily_carbs_g) && (
            <div className={`text-xs rounded-xl px-3 py-2 mt-1 ${
              Math.abs(calorieDiff) < 30
                ? "bg-teal-50 text-teal-600"
                : "bg-amber-50 text-amber-600"
            }`}>
              PFC合算カロリー: {pfcCalories} kcal
              {form.daily_calories_kcal && Math.abs(calorieDiff) >= 30 && (
                <span className="ml-2">（目標値と {Math.abs(calorieDiff)} kcal 乖離）</span>
              )}
              {Math.abs(calorieDiff) < 30 && " ✓"}
            </div>
          )}
        </Section>

        {/* ── 食事・サプリアドバイス ── */}
        <Section title="食事・サプリアドバイス" icon="💊">
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            placeholder="例: プロテインは運動後30分以内に摂取。クレアチン5g/日を推奨。就寝前にカゼインプロテイン20g。..."
            {...f("nutrition_advice")}
          />
          <p className="text-[10px] text-slate-400">LINEでクライアントに送信されます</p>
        </Section>

        {/* ── トレーニング目標 ── */}
        <Section title="④ トレーニング目標（AI提案を修正）" icon="🏋">
          <div>
            <label className={labelCls}>週のトレーニング回数</label>
            <input type="number" inputMode="numeric" className={inputCls} placeholder="3" min={1} max={7} {...f("weekly_training_sessions")} />
          </div>
          <div className="mt-3">
            <label className={labelCls}>推奨種目</label>
            <ExercisePicker
              selected={selectedExercises}
              onChange={setSelectedExercises}
            />
          </div>
        </Section>

        {/* ── LINEで送るメッセージ ── */}
        <Section title="LINEで送るメッセージ" icon="📩">
          <textarea
            className={`${inputCls} resize-none`}
            rows={4}
            placeholder="クライアントへの一言、アドバイス、心がけてほしいことなど..."
            {...f("roadmap_text")}
          />
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="w-full text-xs font-semibold text-blue-600 border border-blue-200 hover:bg-blue-50 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <span>👁</span> LINEで受け取るイメージを確認
          </button>
        </Section>

        {/* ── トレーナーメモ（非公開） ── */}
        <Section title="トレーナーメモ（非公開）" icon="📝">
          <textarea
            className={`${inputCls} resize-none`}
            rows={2}
            placeholder="指導上の注意、内部メモなど..."
            {...f("trainer_notes")}
          />
        </Section>

        {/* ── エラー・サクセス ── */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs text-rose-600">{error}</div>
        )}
        {success && (
          <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-xs text-teal-600">{success}</div>
        )}

        {sentAt && (
          <p className="text-center text-xs text-slate-400">
            最終送信: {new Date(sentAt).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>

      {/* ── スティッキーアクションボタン ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3 z-10">
        {lineUserId ? (
          <button
            type="button"
            onClick={handleSaveAndSend}
            disabled={saving || sending}
            className="w-full bg-teal-500 hover:bg-teal-600 active:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3.5 rounded-xl text-sm transition-colors"
          >
            {saving ? "保存中..." : sending ? "送信中..." : sentAt ? "📩 更新してLINEに再送信" : "📩 保存してLINEで送信"}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 text-white font-bold py-3.5 rounded-xl text-sm transition-colors"
            >
              {saving ? "保存中..." : "保存"}
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-2">LINE未連携のため送信できません</p>
          </>
        )}
      </div>
    </>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
      <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
        <span>{icon}</span>
        {title}
      </p>
      {children}
    </div>
  );
}
