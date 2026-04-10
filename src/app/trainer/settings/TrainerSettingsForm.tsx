"use client";

import { useState } from "react";

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

  const isPro = trainer.plan === "pro";

  const handleSave = async () => {
    setSaving(true);
    setResult(null);
    const res = await fetch("/api/trainer/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, line_notify_user_id: notifyId }),
    });
    setResult(res.ok ? "✅ 保存しました" : "❌ 保存に失敗しました");
    setSaving(false);
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else { alert(data.error ?? "エラーが発生しました"); setUpgrading(false); }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else { alert(data.error ?? "エラーが発生しました"); setPortalLoading(false); }
  };

  return (
    <div className="space-y-4">

      {/* アップグレード完了バナー */}
      {justUpgraded && (
        <div className="bg-blue-600 text-white rounded-2xl px-5 py-4 flex items-center gap-3 shadow-lg">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-bold text-sm">Proプランへのアップグレード完了！</p>
            <p className="text-xs text-blue-200 mt-0.5">クライアント最大10名、AI解析無制限でご利用いただけます</p>
          </div>
        </div>
      )}

      {/* ── プランカード ── */}
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
          <p className="text-xs text-slate-400 mt-0.5">クライアントの問診完了時にLINEで通知を受け取れます（任意）</p>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">自分のLINE User ID</label>
          <input
            type="text"
            value={notifyId}
            onChange={(e) => setNotifyId(e.target.value)}
            placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono text-slate-800 focus:outline-none focus:border-blue-400 transition-all"
          />
          <p className="text-xs text-slate-400 mt-1">AllYourFit LINEに「自分のID」と送ると確認できます</p>
        </div>
      </div>

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
