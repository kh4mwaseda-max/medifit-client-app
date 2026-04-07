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
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-950">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">medifit</h1>
          <p className="mt-2 text-gray-400">{clientName} さんの進捗レポート</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">PINコードを入力</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-center text-2xl tracking-widest text-white focus:outline-none focus:border-green-400"
              placeholder="••••"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">PINが正しくありません</p>
          )}

          <button
            type="submit"
            disabled={pin.length < 4 || loading}
            className="w-full bg-green-500 hover:bg-green-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "確認中..." : "開く"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600">
          PINはトレーナーから共有されています
        </p>
      </div>
    </main>
  );
}
