"use client";

import { useState, useEffect } from "react";
import { Button, Input, Icon, Badge, cn } from "@/components/cf/primitives";

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

  useEffect(() => {
    if (!lineCodeExpiry) return;
    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.round((lineCodeExpiry.getTime() - Date.now()) / 1000),
      );
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
    else {
      setStripeError(data.error ?? "エラーが発生しました");
      setUpgrading(false);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    setStripeError(null);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else {
      setStripeError(data.error ?? "エラーが発生しました");
      setPortalLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {justUpgraded && BILLING_ENABLED && (
        <div className="grad-brand rounded-2xl px-5 py-4 text-white flex items-center gap-3 shadow-glow">
          <div className="text-2xl">🎉</div>
          <div>
            <p className="font-bold text-sm">Proプランへのアップグレード完了</p>
            <p className="text-xs text-white/80 mt-0.5">
              クライアント最大10名、AI解析無制限でご利用いただけます
            </p>
          </div>
        </div>
      )}

      {/* プラン */}
      {BILLING_ENABLED ? (
        <div
          className={cn(
            "rounded-2xl p-5 shadow-card border",
            isPro
              ? "grad-brand text-white border-transparent"
              : "bg-white border-ink-200/70",
          )}
        >
          <div className="flex items-start justify-between">
            <div>
              <p
                className={cn(
                  "text-[10px] font-bold uppercase tracking-widest",
                  isPro ? "text-white/70" : "text-ink-400",
                )}
              >
                現在のプラン
              </p>
              <p
                className={cn(
                  "text-3xl font-black mt-1 tracking-tight",
                  isPro ? "text-white" : "text-ink-800",
                )}
              >
                {isPro ? "Pro" : "Free"}
              </p>
              <p
                className={cn(
                  "text-xs mt-1",
                  isPro ? "text-white/70" : "text-ink-500",
                )}
              >
                {isPro
                  ? "クライアント最大10名 · AI解析無制限"
                  : "¥0 · クライアント1名まで"}
              </p>
            </div>
            <span
              className={cn(
                "text-[11px] font-bold px-3 py-1 rounded-full",
                isPro ? "bg-white/20 text-white" : "bg-ink-100 text-ink-600",
              )}
            >
              {isPro ? "✦ Pro" : "Free"}
            </span>
          </div>

          {!isPro && (
            <div className="mt-5 space-y-3">
              <div className="bg-ink-50 border border-ink-200 rounded-xl p-3 space-y-1.5">
                {[
                  "クライアント最大10名",
                  "AI解析・レポート無制限",
                  "LINEレポート自動送信",
                  "14日間無料トライアル",
                ].map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-2 text-xs text-ink-600"
                  >
                    <Icon
                      name="check-circle"
                      className="text-brand-500 shrink-0"
                    />
                    {f}
                  </div>
                ))}
              </div>
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                loading={upgrading}
                onClick={handleUpgrade}
              >
                {upgrading
                  ? "リダイレクト中..."
                  : "Proにアップグレード（¥500/月〜）"}
              </Button>
              <p className="text-center text-xs text-ink-500">
                14日間無料 · いつでも解約可
              </p>
            </div>
          )}

          {isPro && trainer.stripe_customer_id && (
            <button
              type="button"
              onClick={handlePortal}
              disabled={portalLoading}
              className="mt-4 w-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-2.5 rounded-xl transition"
            >
              {portalLoading ? "..." : "請求・解約の管理 →"}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-ink-200/70 rounded-2xl p-5 shadow-card">
          <p className="text-[10px] font-bold uppercase tracking-widest text-ink-400">
            現在のプラン
          </p>
          <p className="text-3xl font-black mt-1 text-ink-800 tracking-tight">
            無料ベータ
          </p>
          <p className="text-xs text-ink-500 mt-1">
            全機能を無料でご利用いただけます
          </p>
        </div>
      )}

      {/* 基本情報 */}
      <div className="bg-white border border-ink-200/70 rounded-2xl p-5 shadow-card space-y-4">
        <div>
          <p className="text-sm font-bold text-ink-800">基本情報</p>
          <p className="text-xs text-ink-500 mt-0.5">
            表示名はクライアントへのメッセージに使われます
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-ink-700">
            表示名
          </label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 稲川雅也"
            icon="user-plus"
          />
        </div>

        {trainer.email && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-ink-700">
              メールアドレス
            </p>
            <p className="text-sm text-ink-600 bg-ink-50 border border-ink-200 rounded-xl px-3 py-2.5">
              {trainer.email}
            </p>
          </div>
        )}
      </div>

      {/* LINE通知 */}
      <div className="bg-white border border-ink-200/70 rounded-2xl p-5 shadow-card space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-ink-800">LINE通知設定</p>
            <p className="text-xs text-ink-500 mt-0.5">
              クライアントのスクショ記録時にLINEで通知を受け取れます（任意）
            </p>
          </div>
          {lineLinked && (
            <Badge tone="emerald" dot="emerald">
              連携中
            </Badge>
          )}
        </div>

        {lineLinked ? (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Icon name="check-circle" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-emerald-800">
                LINE通知 連携済み
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                スクショ記録時に通知が届きます
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLineLinked(false)}
              className="text-[10px] text-ink-500 hover:text-ink-700 transition"
            >
              解除
            </button>
          </div>
        ) : lineCode ? (
          <div className="space-y-3">
            <div className="bg-brand-50 border-2 border-brand-200 rounded-xl p-5 text-center">
              <p className="text-xs text-brand-700 font-bold">
                公式LINEにこのコードを送ってください
              </p>
              <p className="text-4xl font-black tracking-[0.3em] text-brand-700 font-mono mt-2">
                {lineCode}
              </p>
              <p className="text-xs text-amber-600 mt-2 font-semibold">
                {Math.floor(secondsLeft / 60)}:
                {String(secondsLeft % 60).padStart(2, "0")} で失効
              </p>
            </div>
            <div className="bg-ink-50 border border-ink-200 rounded-xl p-3 space-y-2">
              {[
                "公式LINEを友達追加",
                "上の6桁コードをそのままLINEに送信",
                "「連携しました」が届いたら完了",
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs text-ink-700">{text}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Button
            variant="line"
            size="lg"
            className="w-full"
            icon="message-circle"
            loading={lineCodeGenerating}
            onClick={generateLineCode}
          >
            {lineCodeGenerating ? "コード生成中..." : "LINE通知を連携する"}
          </Button>
        )}
      </div>

      {stripeError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
          <Icon name="alert-circle" className="text-red-600 mt-0.5" />
          <p className="text-xs text-red-700">{stripeError}</p>
        </div>
      )}

      {result && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl px-3 py-2.5 border text-xs",
            result.startsWith("✅")
              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
              : "bg-red-50 text-red-700 border-red-100",
          )}
        >
          {result}
        </div>
      )}

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        loading={saving}
        onClick={handleSave}
      >
        {saving ? "保存中..." : "保存する"}
      </Button>
    </div>
  );
}
