"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TrainerLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const res = await fetch("/api/trainer/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.replace("/trainer");
    } else {
      setError(true);
      setPassword("");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50">
      <div className="w-full max-w-sm space-y-8">

        {/* ロゴ */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-200">
            <span className="text-white text-2xl font-black leading-none">A</span>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">AllYourFit</h1>
            <p className="mt-1 text-sm text-slate-500">トレーナー管理画面</p>
          </div>
        </div>

        {/* フォーム */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs text-slate-500 font-medium">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all text-sm"
                placeholder="••••••••"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-rose-500 text-sm text-center">パスワードが正しくありません</p>
            )}

            <button
              type="submit"
              disabled={!password || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-md shadow-blue-100"
            >
              {loading ? "確認中..." : "ログイン"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
