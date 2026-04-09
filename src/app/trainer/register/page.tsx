"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function TrainerRegister() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/trainer/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (res.ok) {
      router.replace("/trainer/setup");
    } else if (res.status === 409) {
      // 既存メール → ログインへ誘導
      router.replace(`/trainer/login?email=${encodeURIComponent(email)}&hint=existing`);
    } else {
      setError(data.error ?? "登録に失敗しました");
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
            <p className="mt-1 text-sm text-slate-500">トレーナーアカウント新規登録</p>
          </div>
        </div>

        {/* プラン説明 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center">
            <p className="text-xs font-bold text-slate-600">Free</p>
            <p className="text-[10px] text-slate-400 mt-1">自分1人の<br/>データ管理</p>
            <p className="text-sm font-black text-blue-600 mt-2">¥0<span className="text-[9px] font-normal text-slate-400">/月</span></p>
          </div>
          <div className="bg-blue-600 rounded-2xl p-3 text-center">
            <p className="text-xs font-bold text-white">Pro</p>
            <p className="text-[10px] text-blue-200 mt-1">クライアント管理<br/>最大10名</p>
            <p className="text-sm font-black text-white mt-2">¥2,980<span className="text-[9px] font-normal text-blue-200">/月</span></p>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 text-center -mt-6">まずFreeで始め、後からProに切り替え可能</p>

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
            <div className="space-y-1.5">
              <label className="block text-xs text-slate-500 font-medium">メールアドレス</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all text-sm"
                placeholder="trainer@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs text-slate-500 font-medium">パスワード（6文字以上）</label>
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
              disabled={!name || !email || password.length < 6 || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-md shadow-blue-100"
            >
              {loading ? "登録中..." : "無料で始める"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400">
          既にアカウントをお持ちの方は{" "}
          <Link href="/trainer/login" className="text-blue-500 hover:underline">
            ログイン
          </Link>
        </p>
      </div>
    </main>
  );
}
