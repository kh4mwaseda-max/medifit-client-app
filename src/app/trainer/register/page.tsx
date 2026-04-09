"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";

type UserType = "trainer" | "individual" | null;

export default function TrainerRegister() {
  const [userType, setUserType] = useState<UserType>(null);
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
      body: JSON.stringify({ name, email, password, user_type: userType }),
    });

    const data = await res.json();
    if (res.ok) {
      router.replace(userType === "individual" ? "/trainer/setup?mode=individual" : "/trainer/setup");
    } else if (res.status === 409) {
      router.replace(`/trainer/login?email=${encodeURIComponent(email)}&hint=existing`);
    } else {
      setError(data.error ?? "登録に失敗しました");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-sm space-y-6">

        {/* ロゴ */}
        <div className="flex flex-col items-center gap-3">
          <Logo size="lg" variant="mark" />
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">AllYourFit</h1>
            <p className="mt-1 text-sm text-slate-500">無料アカウント作成</p>
          </div>
        </div>

        {/* ── STEP 1: ユーザータイプ選択 ── */}
        {!userType ? (
          <div className="space-y-4">
            <p className="text-center text-sm font-semibold text-slate-700">どちらとして使いますか？</p>

            <button
              type="button"
              onClick={() => setUserType("individual")}
              className="w-full bg-white border-2 border-slate-200 hover:border-blue-400 hover:shadow-md rounded-2xl p-5 text-left transition-all group"
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">🏋️</span>
                <div>
                  <p className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">自分のトレーニングを管理する</p>
                  <p className="text-xs text-slate-400 mt-1">食事・体重・筋トレを記録してAIコーチングを受ける個人向けプラン</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] bg-teal-50 text-teal-600 border border-teal-200 px-2 py-0.5 rounded-full font-semibold">無料で開始</span>
                    <span className="text-[10px] text-slate-400">AIアドバイザー +¥500/月</span>
                  </div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setUserType("trainer")}
              className="w-full bg-white border-2 border-slate-200 hover:border-blue-400 hover:shadow-md rounded-2xl p-5 text-left transition-all group"
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">📋</span>
                <div>
                  <p className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">クライアントを指導・管理する</p>
                  <p className="text-xs text-slate-400 mt-1">パーソナルトレーナー向け。クライアントのデータをまとめて管理</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">無料で開始</span>
                    <span className="text-[10px] text-slate-400">クライアント追加 +¥500/名/月</span>
                  </div>
                </div>
              </div>
            </button>

            <p className="text-center text-xs text-slate-400">
              既にアカウントをお持ちの方は{" "}
              <Link href="/trainer/login" className="text-blue-500 hover:underline">ログイン</Link>
            </p>
          </div>
        ) : (
          /* ── STEP 2: アカウント情報入力 ── */
          <div className="space-y-5">
            <button
              type="button"
              onClick={() => setUserType(null)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              ← 戻る
            </button>

            {/* 選択タイプ表示 */}
            <div className={`rounded-xl px-4 py-2.5 flex items-center gap-2 ${userType === "individual" ? "bg-teal-50 border border-teal-200" : "bg-blue-50 border border-blue-200"}`}>
              <span>{userType === "individual" ? "🏋️" : "📋"}</span>
              <p className={`text-xs font-semibold ${userType === "individual" ? "text-teal-700" : "text-blue-700"}`}>
                {userType === "individual" ? "個人プラン" : "トレーナープラン"}で登録
              </p>
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
                <div className="space-y-1.5">
                  <label className="block text-xs text-slate-500 font-medium">メールアドレス</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all text-sm"
                    placeholder="you@example.com"
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

            <p className="text-center text-[10px] text-slate-400">
              登録することで利用規約・プライバシーポリシーに同意したものとみなします
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
