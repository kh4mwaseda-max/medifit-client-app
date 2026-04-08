"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "./Logo";

interface Props {
  clientId: string;
  clientName: string;
}

export default function PinGate({ clientId, clientName }: Props) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const res = await fetch("/api/auth/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, pin }),
    });

    if (res.ok) {
      router.replace(`/client/${clientId}`);
    } else {
      setError(true);
      setPin("");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50">
      <div className="w-full max-w-sm space-y-8">

        {/* ロゴ */}
        <div className="flex flex-col items-center gap-3">
          <Logo size="lg" variant="mark" />
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">AllYourFit</h1>
            <p className="mt-1 text-sm text-slate-500">{clientName} さんの健康ダッシュボード</p>
          </div>
        </div>

        {/* PINフォーム */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
          <p className="text-xs text-slate-400 text-center">PINコードを入力してアクセス</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-center text-3xl tracking-[0.5em] text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
              placeholder="••••"
              autoFocus
            />

            {error && (
              <p className="text-rose-500 text-sm text-center">PINが正しくありません</p>
            )}

            <button
              type="submit"
              disabled={pin.length < 4 || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm shadow-md shadow-blue-100"
            >
              {loading ? "確認中..." : "開く"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400">
          PINはトレーナーから共有されています
        </p>
      </div>
    </main>
  );
}
