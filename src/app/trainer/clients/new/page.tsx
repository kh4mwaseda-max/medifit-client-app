"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

const LINE_FRIEND_URL = process.env.NEXT_PUBLIC_LINE_FRIEND_URL ?? "https://lin.ee/YOUR_LINE_ID";

export default function NewClientPage() {
  const [name, setName] = useState("");
  const [memo, setMemo] = useState(""); // 「一言」
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trainerName, setTrainerName] = useState("");

  useEffect(() => {
    fetch("/api/trainer/settings")
      .then((r) => r.json())
      .then((d) => { if (d.trainer?.name) setTrainerName(d.trainer.name); })
      .catch(() => {});
  }, []);

  // 登録完了後の状態
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

  const trainerLabel = trainerName ? `トレーナーの ${trainerName}` : "トレーナー";
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

  // 登録完了画面
  if (done) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-5 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
          <Logo size="sm" />
          <h1 className="text-slate-800 font-semibold text-sm">クライアント追加完了</h1>
        </header>

        <main className="max-w-md mx-auto px-4 py-8 space-y-5">
          {/* 完了バナー */}
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 text-center space-y-1.5">
            <p className="text-2xl">✅</p>
            <p className="font-bold text-teal-700">{name} さんを追加しました</p>
            <p className="text-xs text-teal-600 mt-1">PIN: <span className="font-mono font-black tracking-widest text-base">{pin}</span></p>
          </div>

          {/* 次のステップ案内 */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-bold text-blue-700">次のステップ</p>
            {[
              "下の案内文をコピー",
              `${name} さんにLINEやメールで送信`,
              "クライアントがPINをLINEに送ると自動連携",
              "基礎データ入力後、管理画面に通知が届きます",
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-blue-600">
                <span className="font-bold flex-none">{i + 1}.</span>
                <span>{t}</span>
              </div>
            ))}
          </div>

          {/* 送信用テキスト */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
            <p className="text-xs font-semibold text-slate-600">クライアントへの案内文（コピーしてそのまま送るだけ）</p>
            <pre className="text-xs text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-xl p-4 leading-relaxed border border-slate-100 select-all">
              {shareText}
            </pre>
            <button
              type="button"
              onClick={handleCopy}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm transition-colors"
            >
              {copied ? "✅ コピーしました！" : "📋 案内文をコピー"}
            </button>
          </div>

          <Link href="/trainer" className="block text-center text-xs text-slate-400 py-2 hover:text-slate-600">
            ← クライアント一覧に戻る
          </Link>
        </main>
      </div>
    );
  }

  // 入力フォーム
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-5 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <Link href="/trainer" className="text-slate-400 hover:text-slate-600 text-sm">← 戻る</Link>
        <h1 className="text-slate-800 font-semibold text-sm">新規クライアント追加</h1>
      </header>

      <main className="max-w-md mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            {/* 名前 */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-600">クライアントの名前 *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-blue-400 placeholder:text-slate-300"
                placeholder="山田 花子"
                autoFocus
              />
            </div>

            {/* 一言 */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-600">クライアントへの一言（任意）</label>
              <p className="text-[10px] text-slate-400">LINE連携完了時にクライアントへ送られます</p>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-blue-400 placeholder:text-slate-300"
                placeholder="3ヶ月で-5kg！一緒に頑張りましょう"
              />
            </div>

            {/* PINは自動発行 */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <p className="text-xs text-blue-600 font-medium">🔑 PINは自動で発行されます</p>
              <p className="text-[10px] text-blue-400 mt-0.5">追加後に案内文をコピーしてそのまま送れます</p>
            </div>
          </div>

          {error && <p className="text-rose-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold py-4 rounded-2xl text-sm transition-colors shadow-sm shadow-blue-100"
          >
            {loading ? "追加中..." : "クライアントを追加する →"}
          </button>
        </form>
      </main>
    </div>
  );
}
