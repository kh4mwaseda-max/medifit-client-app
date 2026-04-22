"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Logo, Button, Input, Icon } from "@/components/cf/primitives";

const LINE_FRIEND_URL =
  process.env.NEXT_PUBLIC_LINE_FRIEND_URL ?? "https://lin.ee/YOUR_LINE_ID";

export default function NewClientPage() {
  const [name, setName] = useState("");
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trainerName, setTrainerName] = useState("");

  useEffect(() => {
    fetch("/api/trainer/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.trainer?.name) setTrainerName(d.trainer.name);
      })
      .catch(() => {});
  }, []);

  const [done, setDone] = useState(false);
  const [clientId, setClientId] = useState("");
  const [pin, setPin] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/trainer/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        goal: memo.trim() || null,
        start_date: new Date().toISOString().split("T")[0],
      }),
    });

    if (res.ok) {
      const { client } = await res.json();
      setClientId(client.id);
      setPin(client.pin);
      setDone(true);
    } else {
      const data = await res.json();
      setError(data.error ?? "エラーが発生しました");
    }
    setLoading(false);
  };

  const trainerLabel = trainerName
    ? `トレーナーの ${trainerName}`
    : "トレーナー";
  const shareText = `【Client Fit】${name} さんへ

${trainerLabel}です。いつもありがとうございます！

まずはClient Fit公式LINEを友達追加してください👇
${LINE_FRIEND_URL}

友達追加後、以下のPINコードをLINEに送信してください：

PIN: ${pin}

（PINを送ると登録が完了し、初回データの入力案内が届きます）`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-ink-50">
        <header className="h-16 bg-white border-b border-ink-200 px-5 flex items-center gap-4 sticky top-0 z-10">
          <Logo />
          <div className="h-6 w-px bg-ink-200" />
          <h1 className="text-ink-800 font-bold text-sm">
            クライアント追加完了
          </h1>
        </header>

        <main className="max-w-md mx-auto px-5 py-8 space-y-5">
          <div className="grad-brand rounded-2xl p-5 text-white text-center shadow-glow">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-white/20 items-center justify-center mb-2">
              <Icon name="check-circle" size={24} />
            </div>
            <p className="font-black text-lg">{name} さんを追加</p>
            <div className="mt-3 bg-white/10 rounded-xl py-3 inline-block px-8">
              <p className="text-[10px] text-white/80 uppercase tracking-widest">
                PIN
              </p>
              <p className="text-2xl font-black tracking-[0.3em] font-mono">
                {pin}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-ink-200/70 p-5 space-y-3">
            <p className="text-xs font-bold text-ink-700 uppercase tracking-widest">
              次のステップ
            </p>
            {[
              "下の案内文をコピー",
              `${name} さんにLINEやメールで送信`,
              "クライアントがPINをLINEに送ると自動連携",
              "基礎データ入力後、管理画面に通知が届きます",
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-3 text-xs">
                <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 font-bold flex items-center justify-center text-[11px] shrink-0">
                  {i + 1}
                </span>
                <span className="text-ink-700 pt-1">{t}</span>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-ink-200/70 p-5 space-y-3">
            <p className="text-xs font-bold text-ink-700">
              クライアントへの案内文
            </p>
            <pre className="text-xs text-ink-700 whitespace-pre-wrap bg-ink-50 rounded-xl p-4 leading-relaxed border border-ink-200 select-all font-sans">
              {shareText}
            </pre>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleCopy}
            >
              {copied ? "✅ コピーしました" : "📋 案内文をコピー"}
            </Button>
          </div>

          <Link
            href="/trainer"
            className="flex items-center justify-center gap-1 text-xs text-ink-500 hover:text-ink-700 py-2"
          >
            <Icon name="chevron-left" />
            クライアント一覧に戻る
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="h-16 bg-white border-b border-ink-200 px-5 flex items-center gap-3 sticky top-0 z-10">
        <Link
          href="/trainer"
          className="h-9 w-9 rounded-xl hover:bg-ink-100 flex items-center justify-center text-ink-600"
        >
          <Icon name="chevron-left" />
        </Link>
        <h1 className="text-ink-800 font-bold text-sm">新規クライアント追加</h1>
      </header>

      <main className="max-w-md mx-auto px-5 py-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-2xl shadow-card border border-ink-200/70 p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-700">
                クライアントの名前 <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="山田 花子"
                autoFocus
                icon="user-plus"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-700">
                一言メッセージ（任意）
              </label>
              <p className="text-[10px] text-ink-500">
                LINE連携完了時にクライアントへ送られます
              </p>
              <Input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="3ヶ月で-5kg！一緒に頑張りましょう"
              />
            </div>

            <div className="flex items-start gap-2 bg-brand-50 border border-brand-100 rounded-xl px-3 py-2.5">
              <Icon name="info" className="text-brand-600 mt-0.5" />
              <div className="text-xs text-brand-700">
                <p className="font-bold">PINは自動で発行されます</p>
                <p className="text-brand-600 text-[11px] mt-0.5">
                  追加後に案内文をコピーしてそのまま送れます
                </p>
              </div>
            </div>
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
            className="w-full"
            loading={loading}
            disabled={!name.trim()}
            iconRight="chevron-right"
          >
            {loading ? "追加中..." : "クライアントを追加する"}
          </Button>
        </form>
      </main>
    </div>
  );
}
