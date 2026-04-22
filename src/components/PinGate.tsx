"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo, Button, Icon } from "@/components/cf/primitives";

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
    <main className="min-h-screen bg-ink-50 flex flex-col">
      <header className="h-16 bg-white border-b border-ink-200 flex items-center px-5">
        <Logo />
      </header>

      <div className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 items-center justify-center mb-3">
              <Icon name="activity" size={28} />
            </div>
            <h1 className="text-xl font-black text-ink-800 tracking-tight">
              {clientName} さん
            </h1>
            <p className="mt-1 text-sm text-ink-500">健康ダッシュボード</p>
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-ink-200/70 p-6 space-y-4">
            <p className="text-xs text-ink-500 text-center font-semibold">
              PINコードを入力してアクセス
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-ink-50 border border-ink-200 rounded-2xl px-4 py-4 text-center text-3xl tracking-[0.5em] text-ink-800 font-mono focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                placeholder="••••"
                autoFocus
              />

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                  <Icon name="alert-circle" className="text-red-600 mt-0.5" />
                  <p className="text-xs text-red-700">
                    PINが正しくありません
                  </p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={loading}
                disabled={pin.length < 4}
              >
                {loading ? "確認中..." : "開く"}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-ink-500">
            PINはトレーナーから共有されています
          </p>
        </div>
      </div>
    </main>
  );
}
