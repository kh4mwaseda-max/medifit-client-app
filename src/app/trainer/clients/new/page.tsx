"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const inputCls = "w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-green-400 placeholder:text-gray-600";

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    pin: "",
    goal: "",
    start_date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/trainer/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      const { client } = await res.json();
      router.push(`/trainer/clients/${client.id}`);
    } else {
      const data = await res.json();
      setError(data.error ?? "エラーが発生しました");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <Link href="/trainer" className="text-gray-400 hover:text-white text-sm">← 戻る</Link>
        <h1 className="text-white font-semibold">新規クライアント追加</h1>
      </header>

      <main className="max-w-md mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="名前 *">
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
              placeholder="山田 花子"
            />
          </Field>

          <Field label="PINコード * (4〜6桁)" hint="クライアントがレポートを開く際に使います">
            <input
              type="text"
              required
              inputMode="numeric"
              maxLength={6}
              minLength={4}
              pattern="\d{4,6}"
              value={form.pin}
              onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })}
              className={`${inputCls} tracking-widest`}
              placeholder="1234"
            />
          </Field>

          <Field label="目標 (任意)">
            <input
              type="text"
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
              className={inputCls}
              placeholder="3ヶ月で体脂肪率10%を目指す"
            />
          </Field>

          <Field label="開始日">
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              className={inputCls}
            />
          </Field>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "作成中..." : "クライアントを追加"}
          </button>
        </form>
      </main>
    </div>
  );
}

const inputCls = "w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-green-400 placeholder:text-gray-600";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm text-gray-300">{label}</label>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      {children}
    </div>
  );
}
