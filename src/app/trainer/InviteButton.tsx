"use client";

import { useState } from "react";

export default function InviteButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ inviteUrl: string; pin: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    const res = await fetch("/api/trainer/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() || undefined }),
    });
    const data = await res.json();
    if (res.ok) {
      setResult({ inviteUrl: data.inviteUrl, pin: data.pin });
    } else {
      setError(data.error ?? "招待リンクの生成に失敗しました");
    }
    setGenerating(false);
  };

  const shareText = result
    ? `【Client Fit 招待】\n\n登録リンク：\n${result.inviteUrl}\n\n登録後、Client Fit公式LINEを友達追加してPIN「${result.pin}」を送ると連携完了です✅`
    : "";

  const copy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setOpen(false);
    setName("");
    setResult(null);
    setError(null);
    setCopied(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
      >
        🔗 招待リンク発行
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={reset}>
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl space-y-4 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-800">{result ? "招待リンク発行完了" : "クライアントを招待"}</p>
          <button type="button" onClick={reset} className="text-slate-400 hover:text-slate-600 text-lg leading-none">✕</button>
        </div>

        {!result ? (
          <>
            <p className="text-xs text-slate-500">クライアント名を入力してリンクを発行します（7日間有効）</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 田中 花子（後から変更可）"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 transition-all"
              autoFocus
            />
            {error && <p className="text-rose-500 text-xs bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</p>}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              {generating ? "発行中..." : "リンクを発行する"}
            </button>
          </>
        ) : (
          <>
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 space-y-1">
              <p className="text-xs text-teal-600 font-bold">クライアントに送る文面をコピーして転送してください</p>
              <p className="text-xs text-teal-700 font-mono break-all">{result.inviteUrl}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">LINE連携PIN</p>
                <p className="text-2xl font-black font-mono tracking-[0.3em] text-slate-800 mt-0.5">{result.pin}</p>
              </div>
              <p className="text-[10px] text-slate-400 max-w-[100px]">このPINをLINEに送ると連携完了</p>
            </div>
            <button
              type="button"
              onClick={copy}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-sm transition-colors"
            >
              {copied ? "✅ コピーしました！" : "📤 クライアントへの文面をコピー"}
            </button>
            <p className="text-center text-[10px] text-slate-400">招待リンクは7日間有効です</p>
          </>
        )}
      </div>
    </div>
  );
}
