"use client";

import { useState, useEffect } from "react";

const BILLING_ENABLED = process.env.NEXT_PUBLIC_BILLING_ENABLED === "true";

interface Props {
  trainer: {
    id: string;
    name: string;
    email: string;
    plan: string;
    line_notify_user_id: string;
    stripe_customer_id: string | null;
  };
  justUpgraded?: boolean;
}

export default function TrainerSettingsForm({ trainer, justUpgraded }: Props) {
  const [name, setName] = useState(trainer.name ?? "");
  const [notifyId, setNotifyId] = useState(trainer.line_notify_user_id ?? "");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [lineCode, setLineCode] = useState<string | null>(null);
  const [lineCodeExpiry, setLineCodeExpiry] = useState<Date | null>(null);
  const [lineCodeGenerating, setLineCodeGenerating] = useState(false);
  const [lineLinked, setLineLinked] = useState(!!trainer.line_notify_user_id);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const isPro = trainer.plan === "pro";

  // カウントダウンタイマー
  useEffect(() => {
    if (!lineCodeExpiry) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((lineCodeExpiry.getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) {
        setLineCode(null);
        setLineCodeExpiry(null);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lineCodeExpiry]);

  const generateLineCode = async () => {
    setLineCodeGenerating(true);
    const res = await fetch("/api/trainer/line-link-code", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setLineCode(data.code);
      setLineCodeExpiry(new Date(data.expiresAt));
      setSecondsLeft(600);
    }
    setLineCodeGenerating(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setResult(null);
    const res = await fetch("/api/trainer/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setResult(res.ok ? "✅ 保存しました" : "❌ 保存に失敗しました");
    setSaving(false);
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    setStripeError(null);
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else { setStripeError(data.error ?? "エラーが発生しました"); setUpgrading(false); }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    setStripeError(null);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else { setStripeError(data.error ?? "エラーが発生しました"); setPortalLoading(false); }
  };

  return (
    <div className="space-y-4">

      {/* アップグレード完了バナー */}
      {justUpgraded && BILLING_ENABLED && (
        <div className="bg-blue-600 text-white rounded-2xl px-5 py-4 flex items-center gap-3 shadow-lg">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-bold text-sm">Proプランへのアップグレード完了！</p>
            <p className="text-xs text-blue-200 mt-0.5">クライアント最大10名、AI解析無制限でご利用いただけます</p>
          </div>
        </div>
      )}

      {/* ── プランカード ── */}
      {BILLING_ENABLED ? (
        <div className={`rounded-2xl p-5 shadow-sm border ${isPro ? "bg-blue-600 border-blue-700" : "bg-white border-slate-200"}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest ${isPro ? "text-blue-200" : "text-slate-400"}`}>現在のプラン</p>
              <p className={`text-2xl font-black mt-1 ${isPro ? "text-white" : "text-slate-800"}`}>{isPro ? "Pro" : "Free"}</p>
              <p className={`text-xs mt-1 ${isPro ? "text-blue-200" : "text-slate-400"}`}>
                {isPro ? "クライアント最大10名 · AI解析無制限" : "¥0 · クライアント1名まで"}
              </p>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${isPro ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
              {isPro ? "✦ Pro" : "Free"}
            </span>
          </div>

          {!isPro && (
            <div className="mt-4 space-y-3">
              <div className="bg-slate-50 rounded-xl p-3 space-y-1">
                {["クライアント最大10名", "AI解析・レポート無制限", "LINEレポート自動送信", "14日間無料トライアル"].map((f) => (
                  <div key={f} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="text-blue-500 font-bold">✓</span>{f}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={upgrading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 rounded-xl text-sm transition-colors"
              >
                {upgrading ? "リダイレクト中..." : "Proにアップグレード（¥500/月〜）"}
              </button>
              <p className="text-center text-xs text-slate-400">14日間無料 · いつでも解約可</p>
            </div>
          )}

          {isPro && trainer.stripe_customer_id && (
            <button
              type="button"
              onClick={handlePortal}
              disabled={portalLoading}
              className="mt-4 w-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
            >
              {portalLoading ? "..." : "請求・解約の管理 →"}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">現在のプラン</p>
          <p className="text-2xl font-black mt-1 text-slate-800">無料ベータ</p>
          <p className="text-xs text-slate-400 mt-1">全機能を無料でご利用いただけます</p>
        </div>
      )}

      {/* ── 基本情報 ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <p className="text-xs font-semibold text-slate-500">基本情報</p>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">表示名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 稲川雅也"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 transition-all"
          />
        </div>
        {trainer.email && (
          <div>
            <p className="text-xs text-slate-400">メールアドレス</p>
            <p className="text-sm text-slate-600 mt-0.5">{trainer.email}</p>
          </div>
        )}
      </div>

      {/* ── LINE通知設定 ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">LINE通知設定</p>
          <p className="text-xs text-slate-400 mt-0.5">クライアントのスクショ記録時にLINEで通知を受け取れます（任意）</p>
        </div>

        {lineLinked ? (
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 flex items-center gap-2.5">
            <span className="text-teal-500 text-lg">✓</span>
            <div>
              <p className="text-xs font-bold text-teal-700">LINE通知 連携済み</p>
              <p className="text-xs text-teal-600 mt-0.5">スクショ記録時に通知が届きます</p>
            </div>
            <button
              type="button"
              onClick={() => setLineLinked(false)}
              className="ml-auto text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              解除
            </button>
          </div>
        ) : lineCode ? (
          <div className="space-y-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400 mb-2">Client Fit LINEにこのコードを送ってください</p>
              <p className="text-3xl font-black tracking-[0.3em] text-slate-800 font-mono">{lineCode}</p>
              <p className="text-xs text-amber-500 mt-2">
                {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")} で失効
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-1.5">
              <p className="text-xs font-bold text-blue-700">手順</p>
              <p className="text-xs text-blue-600">1. Client Fit LINE公式を友達追加</p>
              <p className="text-xs text-blue-600">2. 上の6桁コードをそのままLINEに送信</p>
              <p className="text-xs text-blue-600">3. 「連携しました」が届いたら完了</p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={generateLineCode}
            disabled={lineCodeGenerating}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            {lineCodeGenerating ? "コード生成中..." : "LINE通知を連携する"}
          </button>
        )}
      </div>

      {stripeError && (
        <div className="text-sm px-4 py-3 rounded-xl border bg-rose-50 text-rose-600 border-rose-200">
          {stripeError}
        </div>
      )}

      {result && (
        <div className={`text-sm px-4 py-3 rounded-xl border ${result.startsWith("✅") ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-rose-50 text-rose-600 border-rose-200"}`}>
          {result}
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm"
      >
        {saving ? "保存中..." : "保存する"}
      </button>
    </div>
  );
}
