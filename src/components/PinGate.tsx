"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#0a0a0f]">
      <div className="w-full max-w-sm space-y-8">

        {/* ロゴ */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-900/40">
            <span className="text-black text-xl font-black leading-none">A</span>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white tracking-tight">AllYourFit</h1>
            <p className="mt-1 text-sm text-gray-500">{clientName} さんの進捗レポート</p>
          </div>
        </div>

        {/* PINフォーム */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs text-gray-500 text-center">PINコードを入力</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-center text-3xl tracking-[0.5em] text-white focus:outline-none focus:border-emerald-500/60 transition-colors"
              placeholder="••••"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-rose-400 text-sm text-center">PINが正しくありません</p>
          )}

          <button
            type="submit"
            disabled={pin.length < 4 || loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/5 disabled:text-gray-600 text-black font-semibold py-3.5 rounded-2xl transition-colors text-sm"
          >
            {loading ? "確認中..." : "開く"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-700">
          PINはトレーナーから共有されています
        </p>
      </div>
    </main>
  );
}
