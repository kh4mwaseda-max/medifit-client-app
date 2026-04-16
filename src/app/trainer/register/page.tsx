"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Logo from "@/components/Logo";

type UserType = "trainer" | "individual" | null;

function RegisterForm() {
  const searchParams = useSearchParams();
  const preType = searchParams.get("type") as UserType;
  const [userType, setUserType] = useState<UserType>(preType ?? null);
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
      body: JSON.stringify({ name: name.trim(), user_type: userType }),
    });

    const data = await res.json();
    if (res.ok) {
      router.replace(userType === "individual" ? "/onboarding" : "/trainer/setup");
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
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">AllYourFit</h1>
            <p className="mt-1 text-sm text-slate-500">無料アカウント作成</p>
          </div>
        </div>

        {/* STEP 1: プラン選択 */}
        {!userType ? (
          <div className="space-y-4">
            <p className="text-center text-sm font-semibold text-slate-700">どちらとして使いますか？</p>

            <button
              type="button"
              onClick={() => setUserType("individual")}
              className="w-full bg-white border-2 border-slate-200 active:border-blue-400 active:bg-blue-50 rounded-2xl p-5 text-left transition-all cursor-pointer touch-manipulation"
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">🏋️</span>
                <div>
                  <p className="font-bold text-slate-800 text-sm">自分のトレーニングを管理する</p>
                  <p className="text-xs text-slate-400 mt-1">食事・体重・筋トレを記録してAIコーチングを受ける個人向けプラン</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] bg-teal-50 text-teal-600 border border-teal-200 px-2 py-0.5 rounded-full font-semibold">無料で始める</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 w-full bg-blue-600 text-white text-xs font-semibold py-2 rounded-xl text-center">
                こちらを選択 →
              </div>
            </button>

            <button
              type="button"
              onClick={() => setUserType("trainer")}
              className="w-full bg-white border-2 border-slate-200 active:border-blue-400 active:bg-blue-50 rounded-2xl p-5 text-left transition-all cursor-pointer touch-manipulation"
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">📋</span>
                <div>
                  <p className="font-bold text-slate-800 text-sm">クライアントを指導・管理する</p>
                  <p className="text-xs text-slate-400 mt-1">パーソナルトレーナー向け。クライアントのデータをまとめて管理</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">無料で始める</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 w-full bg-blue-600 text-white text-xs font-semibold py-2 rounded-xl text-center">
                こちらを選択 →
              </div>
            </button>
          </div>
        ) : (
          /* STEP 2: 名前入力だけ */
          <div className="space-y-5">
            <button
              type="button"
              onClick={() => setUserType(null)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              ← 戻る
            </button>

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
                ログインはAYF公式LINEに「ログイン」と送るだけ。<br />パスワード不要でワンタイムリンクが届きます。
              </p>
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

export default function TrainerRegister() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
