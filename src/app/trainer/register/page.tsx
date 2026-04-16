"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

export default function TrainerRegister() {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/trainer/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });

    const data = await res.json();
    if (res.ok) {
      router.replace("/trainer/setup");
    } else {
      setError(data.error ?? "登録に失敗しました");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-sm space-y-6">

        <div className="flex flex-col items-center gap-3">
          <Logo size="lg" variant="mark" />
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Client Fit</h1>
            <p className="mt-1 text-sm text-slate-500">トレーナー登録（無料）</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs text-slate-500 font-medium">お名前</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all text-sm"
                placeholder="山田 太郎"
                autoFocus
              />
            </div>

            {error && <p className="text-rose-500 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-md shadow-blue-100"
            >
              {loading ? "登録中..." : "無料で始める →"}
            </button>
          </form>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center">
          <p className="text-[10px] text-slate-500">
            ログインはClient Fit公式LINEに「ログイン」と送るだけ。<br />パスワード不要でワンタイムリンクが届きます。
          </p>
        </div>

        <p className="text-center text-[10px] text-slate-400">
          登録することで利用規約・プライバシーポリシーに同意したものとみなします
        </p>
      </div>
    </main>
  );
}
