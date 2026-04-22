"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo, Button, Input, Icon } from "@/components/cf/primitives";

export default function TrainerRegisterPage() {
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
      body: JSON.stringify({ name: name.trim() }),
    });

    const data = await res.json();
    if (res.ok) {
      router.replace("/trainer/setup");
    } else {
      setError(data.error ?? "登録に失敗しました");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-ink-50 flex flex-col">
      <header className="h-16 bg-white border-b border-ink-200 flex items-center px-5 sm:px-8">
        <Logo />
      </header>

      <div className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <span className="inline-block text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-100 px-3 py-1 rounded-full uppercase tracking-widest mb-3">
              無料で登録
            </span>
            <h1 className="text-2xl font-black text-ink-800 tracking-tight">
              トレーナー登録
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              30秒で完了。クレジットカード不要。
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-ink-200/70 p-6 space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-ink-700">
                  お名前
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="山田 太郎"
                  autoFocus
                  icon="user-plus"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                  <Icon name="alert-circle" className="text-red-600 mt-0.5" />
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                disabled={!name.trim()}
                className="w-full"
                iconRight="chevron-right"
              >
                {loading ? "登録中..." : "無料で始める"}
              </Button>
            </form>

            <div className="pt-4 border-t border-ink-100 space-y-2.5">
              {[
                "クレジットカード不要・完全無料で始められる",
                "クライアントがLINEにスクショを送るだけで自動記録",
                "翌朝、全クライアントのサマリーがLINEに届く",
              ].map((t) => (
                <div
                  key={t}
                  className="flex items-start gap-2 text-xs text-ink-600"
                >
                  <Icon
                    name="check-circle"
                    className="text-emerald-500 mt-0.5 shrink-0"
                  />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-ink-500">
            登録済みの方は{" "}
            <Link
              href="/trainer/login"
              className="text-brand-600 hover:text-brand-700 font-semibold underline underline-offset-2"
            >
              ログイン
            </Link>
          </p>

          <p className="text-center text-[10px] text-ink-400">
            登録することで利用規約・プライバシーポリシーに同意したものとみなします
          </p>
        </div>
      </div>
    </main>
  );
}
