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
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-950">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">medifit</h1>
          <p className="mt-2 text-gray-400">トレーナー管理画面</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-400"
              placeholder="••••••••"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">パスワードが正しくありません</p>
          )}

          <button
            type="submit"
            disabled={!password || loading}
            className="w-full bg-green-500 hover:bg-green-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "確認中..." : "ログイン"}
          </button>
        </form>
      </div>
    </main>
  );
}
