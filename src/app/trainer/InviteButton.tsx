"use client";

import { useState } from "react";
import { Button, Input, Icon } from "@/components/cf/primitives";

export default function InviteButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    inviteUrl: string;
    pin: string;
  } | null>(null);
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
      <Button
        variant="primary"
        size="sm"
        icon="user-plus"
        onClick={() => setOpen(true)}
      >
        招待リンク発行
      </Button>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-ink-900/40 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={reset}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm shadow-pop space-y-4 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-ink-800">
            {result ? "招待リンク発行完了" : "クライアントを招待"}
          </p>
          <button
            type="button"
            onClick={reset}
            aria-label="閉じる"
            title="閉じる"
            className="w-8 h-8 rounded-lg hover:bg-ink-100 flex items-center justify-center text-ink-500"
          >
            <Icon name="x" />
          </button>
        </div>

        {!result ? (
          <>
            <p className="text-xs text-ink-500">
              クライアント名を入力してリンクを発行します（7日間有効）
            </p>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 田中 花子（後から変更可）"
              autoFocus
              icon="user-plus"
            />
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                <Icon name="alert-circle" className="text-red-600 mt-0.5" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              loading={generating}
              onClick={handleGenerate}
            >
              {generating ? "発行中..." : "リンクを発行する"}
            </Button>
          </>
        ) : (
          <>
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-3 space-y-1">
              <p className="text-xs text-brand-700 font-bold">
                クライアントに送る文面をコピーして転送
              </p>
              <p className="text-[11px] text-brand-800 font-mono break-all">
                {result.inviteUrl}
              </p>
            </div>
            <div className="bg-ink-50 border border-ink-200 rounded-xl p-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] text-ink-500 uppercase tracking-widest">
                  LINE連携PIN
                </p>
                <p className="text-2xl font-black font-mono tracking-[0.3em] text-ink-800 mt-0.5">
                  {result.pin}
                </p>
              </div>
              <p className="text-[10px] text-ink-500 max-w-[100px] text-right">
                このPINをLINEに送ると連携完了
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={copy}
            >
              {copied ? "✅ コピーしました" : "📤 文面をコピー"}
            </Button>
            <p className="text-center text-[10px] text-ink-500">
              招待リンクは7日間有効です
            </p>
          </>
        )}
      </div>
    </div>
  );
}
