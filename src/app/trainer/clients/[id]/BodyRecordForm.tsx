"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BodyRecordForm({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    recorded_at: new Date().toISOString().split("T")[0],
    weight_kg: "", body_fat_pct: "", muscle_mass_kg: "",
    systolic_bp: "", diastolic_bp: "", resting_heart_rate: "",
    sleep_hours: "", condition_score: "",
  });

  const n = (v: string) => v === "" ? null : Number(v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/trainer/body-record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        recorded_at: form.recorded_at,
        weight_kg: n(form.weight_kg),
        body_fat_pct: n(form.body_fat_pct),
        muscle_mass_kg: n(form.muscle_mass_kg),
        systolic_bp: n(form.systolic_bp),
        diastolic_bp: n(form.diastolic_bp),
        resting_heart_rate: n(form.resting_heart_rate),
        sleep_hours: n(form.sleep_hours),
        condition_score: n(form.condition_score),
      }),
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold py-3 rounded-xl transition-colors text-sm"
      >
        {open ? "キャンセル" : "+ 身体記録を追加"}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-4">
          <Row>
            <NumInput label="日付" type="date" value={form.recorded_at} onChange={(v) => setForm({ ...form, recorded_at: v })} required />
          </Row>
          <Row>
            <NumInput label="体重 (kg)" value={form.weight_kg} onChange={(v) => setForm({ ...form, weight_kg: v })} placeholder="70.5" step="0.1" />
            <NumInput label="体脂肪率 (%)" value={form.body_fat_pct} onChange={(v) => setForm({ ...form, body_fat_pct: v })} placeholder="20.0" step="0.1" />
          </Row>
          <Row>
            <NumInput label="筋肉量 (kg)" value={form.muscle_mass_kg} onChange={(v) => setForm({ ...form, muscle_mass_kg: v })} placeholder="55.0" step="0.1" />
            <NumInput label="安静時心拍数" value={form.resting_heart_rate} onChange={(v) => setForm({ ...form, resting_heart_rate: v })} placeholder="60" />
          </Row>
          <Row>
            <NumInput label="収縮期血圧" value={form.systolic_bp} onChange={(v) => setForm({ ...form, systolic_bp: v })} placeholder="120" />
            <NumInput label="拡張期血圧" value={form.diastolic_bp} onChange={(v) => setForm({ ...form, diastolic_bp: v })} placeholder="80" />
          </Row>
          <Row>
            <NumInput label="睡眠時間 (h)" value={form.sleep_hours} onChange={(v) => setForm({ ...form, sleep_hours: v })} placeholder="7.0" step="0.5" />
            <NumInput label="コンディション (1-10)" value={form.condition_score} onChange={(v) => setForm({ ...form, condition_score: v })} placeholder="7" min="1" max="10" />
          </Row>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            {loading ? "保存中..." : "保存"}
          </button>
        </form>
      )}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function NumInput({ label, value, onChange, placeholder, step, min, max, type = "number", required }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; step?: string; min?: string; max?: string;
  type?: string; required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
        required={required}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-green-400"
      />
    </div>
  );
}
