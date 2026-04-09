"use client";

import { useState } from "react";

interface Props {
  trainer: {
    id: string;
    name: string;
    email: string;
    plan: string;
    line_channel_access_token: string;
    line_channel_secret: string;
    line_notify_user_id: string;
  };
  webhookUrl: string;
}

export default function TrainerSettingsForm({ trainer, webhookUrl }: Props) {
  const [name, setName] = useState(trainer.name ?? "");
  const [token, setToken] = useState("");
  const [secret, setSecret] = useState("");
  const [notifyId, setNotifyId] = useState(trainer.line_notify_user_id ?? "");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setResult(null);
    const res = await fetch("/api/trainer/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        line_channel_access_token: token || undefined,
        line_channel_secret: secret || undefined,
        line_notify_user_id: notifyId,
      }),
    });
    setResult(res.ok ? "✅ 保存しました" : "❌ 保存に失敗しました");
    setSaving(false);
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">

      {/* プランバッジ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">現在のプラン</p>
          <p className="text-sm font-bold text-slate-700 mt-0.5">{trainer.email}</p>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
          trainer.plan === "pro"
            ? "bg-blue-600 text-white"
            : "bg-slate-100 text-slate-500"
        }`}>
          {trainer.plan === "pro" ? "Pro" : "Free"}
        </span>
      </div>

      {/* 基本情報 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <p className="text-xs font-semibold text-slate-500">基本情報</p>
        <div className="space-y-1.5">
          <label className="block text-xs text-slate-400">表示名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 transition-all"
          />
        </div>
      </div>

      {/* LINE設定 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex items-start justify-between">
          <p className="text-xs font-semibold text-slate-500">LINE公式アカウント設定</p>
          {trainer.plan === "free" && (
            <span className="text-[9px] bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">Proのみ</span>
          )}
        </div>

        {/* Webhook URL */}
        <div className="space-y-1.5">
          <label className="block text-xs text-slate-400">あなた専用のWebhook URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={webhookUrl}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-blue-600 font-mono focus:outline-none"
            />
            <button
              type="button"
              onClick={copyWebhook}
              className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs text-slate-600 transition-colors whitespace-nowrap"
            >
              {copied ? "✅" : "コピー"}
            </button>
          </div>
          <p className="text-[10px] text-slate-400">LINE Developersコンソールのチャネル設定 → Webhook URLにこのURLを貼り付けてください</p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="block text-xs text-slate-400">
              Channel Access Token
              {trainer.line_channel_access_token === "***set***" && (
                <span className="ml-2 text-teal-500 font-semibold">✓ 設定済み</span>
              )}
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={trainer.line_channel_access_token === "***set***" ? "（変更する場合のみ入力）" : "Channel Access Tokenを入力"}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs text-slate-400">
              Channel Secret
              {trainer.line_channel_secret === "***set***" && (
                <span className="ml-2 text-teal-500 font-semibold">✓ 設定済み</span>
              )}
            </label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder={trainer.line_channel_secret === "***set***" ? "（変更する場合のみ入力）" : "Channel Secretを入力"}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs text-slate-400">自分のLINE User ID（クライアント完了通知を受け取る）</label>
            <input
              type="text"
              value={notifyId}
              onChange={(e) => setNotifyId(e.target.value)}
              placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 font-mono focus:outline-none focus:border-blue-400 transition-all"
            />
            <p className="text-[10px] text-slate-400">LINE公式アカウントに「自分のID」と送ると確認できます</p>
          </div>
        </div>
      </div>

      {result && (
        <div className={`text-sm px-4 py-3 rounded-xl ${result.startsWith("✅") ? "bg-teal-50 text-teal-700 border border-teal-200" : "bg-rose-50 text-rose-600 border border-rose-200"}`}>
          {result}
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-semibold py-3 rounded-2xl transition-colors text-sm shadow-sm"
      >
        {saving ? "保存中..." : "保存する"}
      </button>
    </div>
  );
}
