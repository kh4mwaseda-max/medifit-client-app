"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

const COURSES = [
  { id: "減量", icon: "📉", label: "減量", desc: "体重・体脂肪率の数値を下げる" },
  { id: "ボディメイク", icon: "✨", label: "ボディメイク", desc: "見た目を変える・引き締める" },
  { id: "バルクアップ", icon: "💪", label: "バルクアップ", desc: "本格的に筋肉・体重を増やす" },
  { id: "健康維持", icon: "❤️", label: "健康維持", desc: "生活習慣病予防・長期的な健康管理" },
  { id: "大会準備", icon: "🏆", label: "大会準備", desc: "コンテスト・大会ピーキング" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [course, setCourse] = useState<string | null>(null);

  // Step 2
  const [targetWeight, setTargetWeight] = useState("");
  const [targetBodyFat, setTargetBodyFat] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [weeklyTraining, setWeeklyTraining] = useState<number | null>(null);

  // Step 3
  const [height, setHeight] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [currentBodyFat, setCurrentBodyFat] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | null>(null);

  const handleFinish = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course,
          target_weight_kg: targetWeight ? parseFloat(targetWeight) : null,
          target_body_fat_pct: targetBodyFat ? parseFloat(targetBodyFat) : null,
          target_date: targetDate || null,
          weekly_training_sessions: weeklyTraining,
          height_cm: height ? parseFloat(height) : null,
          current_weight_kg: currentWeight ? parseFloat(currentWeight) : null,
          current_body_fat_pct: currentBodyFat ? parseFloat(currentBodyFat) : null,
          birth_year: birthYear ? parseInt(birthYear) : null,
          gender,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "エラーが発生しました");
        setLoading(false);
        return;
      }
      router.replace(`/client/${data.clientId}`);
    } catch {
      setError("通信エラーが発生しました");
      setLoading(false);
    }
  };

  const progressPct = (step / 3) * 100;

  return (
    <main className="min-h-screen bg-[#f0f4f8] flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-sm space-y-5">

        {/* ロゴ + プログレス */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Logo size="sm" variant="full" theme="dark" />
            <span className="text-xs text-slate-400">Step {step} / 3</span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* ── STEP 1: コース選択 ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">Step 1</p>
              <h1 className="text-lg font-black text-slate-800 mt-0.5">目標を選んでください</h1>
              <p className="text-xs text-slate-500 mt-1">あなたのフィットネスの目的に合ったコースを選択します</p>
            </div>

            <div className="space-y-2.5">
              {COURSES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCourse(c.id)}
                  className={`w-full rounded-2xl p-4 text-left border-2 transition-all ${
                    course === c.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{c.icon}</span>
                    <div>
                      <p className={`text-sm font-bold ${course === c.id ? "text-blue-700" : "text-slate-800"}`}>
                        {c.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{c.desc}</p>
                    </div>
                    {course === c.id && (
                      <span className="ml-auto text-blue-600 font-bold text-lg">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={!course}
              onClick={() => setStep(2)}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3.5 rounded-2xl text-sm transition-colors"
            >
              次へ →
            </button>
          </div>
        )}

        {/* ── STEP 2: 目標値入力 ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">Step 2</p>
              <h1 className="text-lg font-black text-slate-800 mt-0.5">目標値を入力</h1>
              <p className="text-xs text-slate-500 mt-1">わかる範囲で入力。後からでも変更できます。</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
              {[
                { label: "目標体重", unit: "kg", value: targetWeight, setter: setTargetWeight, placeholder: "例: 65" },
                { label: "目標体脂肪率", unit: "%", value: targetBodyFat, setter: setTargetBodyFat, placeholder: "例: 15" },
              ].map(({ label, unit, value, setter, placeholder }) => (
                <div key={label}>
                  <label className="block text-xs text-slate-500 font-medium mb-1.5">{label}（任意）</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      placeholder={placeholder}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 transition-all"
                    />
                    <span className="text-xs text-slate-400 w-6">{unit}</span>
                  </div>
                </div>
              ))}

              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1.5">目標達成日（任意）</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 font-medium mb-2">週のトレーニング頻度</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setWeeklyTraining(n)}
                      className={`py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                        weeklyTraining === n
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {n}日
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setWeeklyTraining(0)}
                    className={`py-2 rounded-xl text-sm font-bold border-2 transition-all col-span-1 ${
                      weeklyTraining === 0
                        ? "border-slate-600 bg-slate-600 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    未定
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-none text-xs text-slate-400 hover:text-slate-600 py-3 px-4 transition-colors"
              >
                ← 戻る
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-colors"
              >
                次へ →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: 基本情報 ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">Step 3</p>
              <h1 className="text-lg font-black text-slate-800 mt-0.5">基本情報を入力</h1>
              <p className="text-xs text-slate-500 mt-1">AIが正確なアドバイスをするために使います</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
              {[
                { label: "身長", unit: "cm", value: height, setter: setHeight, placeholder: "例: 170" },
                { label: "現在の体重", unit: "kg", value: currentWeight, setter: setCurrentWeight, placeholder: "例: 70" },
                { label: "現在の体脂肪率", unit: "%", value: currentBodyFat, setter: setCurrentBodyFat, placeholder: "例: 20（任意）" },
                { label: "生まれ年", unit: "年", value: birthYear, setter: setBirthYear, placeholder: "例: 1990" },
              ].map(({ label, unit, value, setter, placeholder }) => (
                <div key={label}>
                  <label className="block text-xs text-slate-500 font-medium mb-1.5">{label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      placeholder={placeholder}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 transition-all"
                    />
                    <span className="text-xs text-slate-400 w-6">{unit}</span>
                  </div>
                </div>
              ))}

              <div>
                <label className="block text-xs text-slate-500 font-medium mb-2">性別</label>
                <div className="grid grid-cols-3 gap-2">
                  {([["male", "男性"], ["female", "女性"], ["other", "その他"]] as const).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setGender(val)}
                      className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                        gender === val
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <p className="text-rose-500 text-sm text-center bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-none text-xs text-slate-400 hover:text-slate-600 py-3 px-4 transition-colors"
              >
                ← 戻る
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={loading || !currentWeight}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3.5 rounded-2xl text-sm transition-colors"
              >
                {loading ? "準備中..." : "ダッシュボードへ →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
