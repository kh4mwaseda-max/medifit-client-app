"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface TrainingSet {
  exercise_name: string;
  muscle_group: string;
  weight_kg: string;
  reps: string;
  set_number: number;
  rpe: string;
}

const MUSCLE_GROUPS = ["胸", "背中", "肩", "上腕二頭筋", "上腕三頭筋", "腹筋", "大腿四頭筋", "ハムストリング", "臀部", "ふくらはぎ", "全身"];

export default function TrainingForm({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [sets, setSets] = useState<TrainingSet[]>([
    { exercise_name: "", muscle_group: "", weight_kg: "", reps: "", set_number: 1, rpe: "" },
  ]);

  const addSet = () => {
    const last = sets[sets.length - 1];
    setSets([...sets, {
      exercise_name: last.exercise_name,
      muscle_group: last.muscle_group,
      weight_kg: last.weight_kg,
      reps: last.reps,
      set_number: last.set_number + 1,
      rpe: "",
    }]);
  };

  const updateSet = (i: number, field: keyof TrainingSet, value: string) => {
    const updated = [...sets];
    (updated[i] as any)[field] = value;
    setSets(updated);
  };

  const removeSet = (i: number) => {
    if (sets.length === 1) return;
    setSets(sets.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, set_number: idx + 1 })));
  };

  const n = (v: string) => v === "" ? null : Number(v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/trainer/training", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        session_date: sessionDate,
        notes: notes || null,
        sets: sets.map((s) => ({
          exercise_name: s.exercise_name,
          muscle_group: s.muscle_group || null,
          weight_kg: n(s.weight_kg),
          reps: n(s.reps),
          set_number: s.set_number,
          rpe: n(s.rpe),
        })),
      }),
    });
    setLoading(false);
    setOpen(false);
    setSets([{ exercise_name: "", muscle_group: "", weight_kg: "", reps: "", set_number: 1, rpe: "" }]);
    setNotes("");
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold py-3 rounded-xl transition-colors text-sm"
      >
        {open ? "キャンセル" : "+ トレーニングを記録"}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-400">日付</label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-green-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">メモ (任意)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="調子良かった"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-green-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-gray-400">セット記録</p>
            {sets.map((s, i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-green-400 font-medium">Set {s.set_number}</span>
                  {sets.length > 1 && (
                    <button type="button" onClick={() => removeSet(i)} className="text-xs text-gray-500 hover:text-red-400">削除</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={s.exercise_name}
                    onChange={(e) => updateSet(i, "exercise_name", e.target.value)}
                    placeholder="ベンチプレス"
                    className="col-span-2 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-green-400"
                  />
                  <select
                    value={s.muscle_group}
                    onChange={(e) => updateSet(i, "muscle_group", e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-2 text-sm text-white outline-none focus:border-green-400"
                  >
                    <option value="">部位</option>
                    {MUSCLE_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <input
                    type="number"
                    value={s.rpe}
                    onChange={(e) => updateSet(i, "rpe", e.target.value)}
                    placeholder="RPE (1-10)"
                    min="1" max="10" step="0.5"
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-green-400"
                  />
                  <input
                    type="number"
                    value={s.weight_kg}
                    onChange={(e) => updateSet(i, "weight_kg", e.target.value)}
                    placeholder="重量 (kg)"
                    step="0.5"
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-green-400"
                  />
                  <input
                    type="number"
                    value={s.reps}
                    onChange={(e) => updateSet(i, "reps", e.target.value)}
                    placeholder="回数"
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-green-400"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addSet}
              className="w-full border border-gray-700 hover:border-green-700 text-gray-400 hover:text-green-400 py-2 rounded-xl text-sm transition-colors"
            >
              + セット追加
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            {loading ? "保存中..." : "セッションを保存"}
          </button>
        </form>
      )}
    </div>
  );
}
