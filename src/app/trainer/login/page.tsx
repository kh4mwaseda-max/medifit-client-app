"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function TrainerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/trainer/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email || undefined, password }),
    });

    if (res.ok) {
      router.replace("/trainer");
    } else {
      const data = await res.json();
      setError(data.error ?? "ログインに失敗しました");
      setPassword("");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50">
      <div className="w-full max-w-sm space-y-8">

        <div className="flex flex-col items-center gap-3">
          <Logo size="lg" variant="mark" />
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">AllYourFit</h1>
            <p className="mt-1 text-sm text-slate-500">トレーナー管理画面</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs text-slate-500 font-medium">メールアドレス</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all text-sm"
                placeholder="trainer@example.com"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs text-slate-500 font-medium">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all text-sm"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-rose-500 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={!password || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-md shadow-blue-100"
            >
              {loading ? "確認中..." : "ログイン"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400">
          アカウントをお持ちでない方は{" "}
          <Link href="/trainer/register" className="text-blue-500 hover:underline">
            新規登録
          </Link>
        </p>
      </div>
    </main>
  );
}
