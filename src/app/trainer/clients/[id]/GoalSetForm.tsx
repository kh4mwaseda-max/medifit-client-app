"use client";

import { useState, useEffect } from "react";
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
    latest_weight: number | null;
    latest_body_fat: number | null;
  };
}

const inputCls =
  "w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 placeholder:text-slate-300 transition-all";
const labelCls = "block text-xs font-medium text-slate-500 mb-1";

export default function GoalSetForm({ clientId, clientName, lineUserId, existingGoals, intakeData }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [savedGoalId, setSavedGoalId] = useState<string | null>(existingGoals?.id ?? null);
  const [sentAt, setSentAt] = useState<string | null>(existingGoals?.sent_at ?? null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    daily_calories_kcal: existingGoals?.daily_calories_kcal?.toString() ?? "",
    daily_protein_g:     existingGoals?.daily_protein_g?.toString() ?? "",
    daily_fat_g:         existingGoals?.daily_fat_g?.toString() ?? "",
    daily_carbs_g:       existingGoals?.daily_carbs_g?.toString() ?? "",
    weekly_training_sessions: existingGoals?.weekly_training_sessions?.toString() ?? "",
    recommended_exercises: existingGoals?.recommended_exercises?.join("、") ?? "",
    target_weight_kg:    existingGoals?.target_weight_kg?.toString() ?? "",
    target_body_fat_pct: existingGoals?.target_body_fat_pct?.toString() ?? "",
    target_muscle_kg:    existingGoals?.target_muscle_kg?.toString() ?? "",
    target_date:         existingGoals?.target_date ?? "",
    roadmap_text:        existingGoals?.roadmap_text ?? "",
    trainer_notes:       existingGoals?.trainer_notes ?? "",
  });

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

  const age = intakeData.birth_year ? new Date().getFullYear() - intakeData.birth_year : null;

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    const exercises = form.recommended_exercises
      ? form.recommended_exercises.split(/[、,，\n]/).map((s: string) => s.trim()).filter(Boolean)
      : [];

    const res = await fetch("/api/trainer/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        daily_calories_kcal: form.daily_calories_kcal ? parseInt(form.daily_calories_kcal) : null,
        daily_protein_g:     form.daily_protein_g ? parseFloat(form.daily_protein_g) : null,
        daily_fat_g:         form.daily_fat_g ? parseFloat(form.daily_fat_g) : null,
        daily_carbs_g:       form.daily_carbs_g ? parseFloat(form.daily_carbs_g) : null,
        weekly_training_sessions: form.weekly_training_sessions ? parseInt(form.weekly_training_sessions) : null,
        recommended_exercises: exercises.length ? exercises : null,
        target_weight_kg:    form.target_weight_kg ? parseFloat(form.target_weight_kg) : null,
        target_body_fat_pct: form.target_body_fat_pct ? parseFloat(form.target_body_fat_pct) : null,
        target_muscle_kg:    form.target_muscle_kg ? parseFloat(form.target_muscle_kg) : null,
        target_date:         form.target_date || null,
        roadmap_text:        form.roadmap_text || null,
        trainer_notes:       form.trainer_notes || null,
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
    <div className="space-y-5">

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

      {/* ── 栄養目標 ── */}
      <Section title="栄養目標" icon="🍽">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>1日カロリー (kcal)</label>
            <input type="number" className={inputCls} placeholder="2200" {...f("daily_calories_kcal")} />
          </div>
          <div>
            <label className={labelCls}>タンパク質 (g)</label>
            <input type="number" className={inputCls} placeholder="170" {...f("daily_protein_g")} />
          </div>
          <div>
            <label className={labelCls}>脂質 (g)</label>
            <input type="number" className={inputCls} placeholder="60" {...f("daily_fat_g")} />
          </div>
          <div>
            <label className={labelCls}>炭水化物 (g)</label>
            <input type="number" className={inputCls} placeholder="220" {...f("daily_carbs_g")} />
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

      {/* ── トレーニング目標 ── */}
      <Section title="トレーニング目標" icon="🏋">
        <div>
          <label className={labelCls}>週のトレーニング回数</label>
          <input type="number" className={inputCls} placeholder="3" min={1} max={7} {...f("weekly_training_sessions")} />
        </div>
        <div className="mt-3">
          <label className={labelCls}>推奨種目（読点・改行区切り）</label>
          <textarea
            className={`${inputCls} resize-none`}
            rows={2}
            placeholder="ベンチプレス、スクワット、デッドリフト"
            {...f("recommended_exercises")}
          />
        </div>
      </Section>

      {/* ── 身体目標 ── */}
      <Section title="身体目標" icon="📈">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>目標体重 (kg)</label>
            <input type="number" step="0.1" className={inputCls} placeholder="70.0" {...f("target_weight_kg")} />
          </div>
          <div>
            <label className={labelCls}>目標体脂肪率 (%)</label>
            <input type="number" step="0.1" className={inputCls} placeholder="15.0" {...f("target_body_fat_pct")} />
          </div>
          <div>
            <label className={labelCls}>目標筋肉量 (kg)</label>
            <input type="number" step="0.1" className={inputCls} placeholder="60.0" {...f("target_muscle_kg")} />
          </div>
          <div>
            <label className={labelCls}>目標達成日</label>
            <input type="date" className={inputCls} {...f("target_date")} />
          </div>
        </div>
      </Section>

      {/* ── ロードマップメッセージ ── */}
      <Section title="LINEで送るメッセージ" icon="📩">
        <textarea
          className={`${inputCls} resize-none`}
          rows={5}
          placeholder="クライアントへの一言、アドバイス、心がけてほしいことなど..."
          {...f("roadmap_text")}
        />
        <p className="text-[10px] text-slate-400 mt-1">
          上記の目標数値とこのメッセージをまとめてLINEで送信します
        </p>
      </Section>

      {/* ── トレーナーメモ（クライアント非公開） ── */}
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

      {/* ── アクションボタン ── */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          {saving ? "保存中..." : "保存"}
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !savedGoalId || !lineUserId}
          className="flex-1 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          title={!lineUserId ? "LINE未連携" : !savedGoalId ? "先に保存してください" : ""}
        >
          {sending ? "送信中..." : sentAt ? "LINEに再送信" : "LINEに送信"}
        </button>
      </div>

      {sentAt && (
        <p className="text-center text-xs text-slate-400">
          最終送信: {new Date(sentAt).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      )}
    </div>
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
