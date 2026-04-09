"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

interface Props {
  trainer: { id: string; name: string; plan: string; line_channel_access_token: string | null };
  webhookUrl: string;
  isIndividual?: boolean;
}

const STEPS = [
  { id: "welcome",  label: "ようこそ" },
  { id: "line",     label: "LINE設定" },
  { id: "client",   label: "クライアント追加" },
  { id: "done",     label: "完了" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export default function SetupGuide({ trainer, webhookUrl, isIndividual = false }: Props) {
  const [step, setStep] = useState<StepId>("welcome");
  const [copied, setCopied] = useState(false);
  const [token, setToken] = useState("");
  const [secret, setSecret] = useState("");
  const [notifyId, setNotifyId] = useState("");
  const [savingLine, setSavingLine] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientPin, setClientPin] = useState("");
  const [clientGoal, setClientGoal] = useState("");
  const [addingClient, setAddingClient] = useState(false);
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);
  const router = useRouter();

  const isPro = trainer.plan === "pro";
  const isIndividualUser = isIndividual;
  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveLine = async () => {
    setSavingLine(true);
    await fetch("/api/trainer/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ line_channel_access_token: token, line_channel_secret: secret, line_notify_user_id: notifyId }),
    });
    setSavingLine(false);
    setStep("client");
  };

  const addClient = async () => {
    if (!clientName || !clientPin) return;
    setAddingClient(true);
    const res = await fetch("/api/trainer/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: clientName, pin: clientPin, goal: clientGoal }),
    });
    const data = await res.json();
    if (res.ok) {
      setCreatedClientId(data.client.id);
      setStep("done");
    }
    setAddingClient(false);
  };

  return (
    <div className="space-y-6">

      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <Logo size="sm" variant="full" />
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`h-1 w-6 rounded-full transition-all ${i <= stepIndex ? "bg-blue-600" : "bg-slate-200"}`}
            />
          ))}
        </div>
      </div>

      {/* ── ステップ1: ウェルカム ── */}
      {step === "welcome" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="text-center space-y-2">
              <p className="text-2xl">🎉</p>
              <h1 className="text-lg font-black text-slate-800">
                {trainer.name} さん、<br />ようこそ AllYourFit へ！
              </h1>
              <p className="text-xs text-slate-500">
                {isIndividualUser ? "2ステップでセットアップ完了します（約1分）" : "3ステップでセットアップ完了します（約2分）"}
              </p>
            </div>

            {/* プランバッジ */}
            <div className={`rounded-xl p-4 text-center ${isIndividualUser ? "bg-teal-50 border border-teal-200" : isPro ? "bg-blue-50 border border-blue-200" : "bg-slate-50 border border-slate-200"}`}>
              <p className={`text-xs font-bold ${isIndividualUser ? "text-teal-600" : isPro ? "text-blue-600" : "text-slate-500"}`}>
                {isIndividualUser ? "🏋️ 個人プラン" : isPro ? "✦ Pro プラン" : "Free プラン"}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {isIndividualUser
                  ? "自分のデータを記録・分析。AIアドバイザーで目標達成をサポート"
                  : isPro
                  ? "クライアント最大10名・AI解析無制限・レポート自動生成"
                  : "自分1人のデータ管理・LINEスクショ月50回"}
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <p className="font-semibold text-slate-700">セットアップの流れ</p>
              {[
                { n: "1", t: "LINE公式アカウントを連携する", sub: isPro ? "クライアントがスクショを送れるようになります" : "自分でスクショを送って記録できます" },
                { n: "2", t: isPro ? "最初のクライアントを追加する" : "自分をクライアントとして登録する", sub: "PIN番号を設定してダッシュボードにアクセス" },
              ].map(({ n, t, sub }) => (
                <div key={n} className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center flex-none mt-0.5">{n}</span>
                  <div>
                    <p className="font-medium text-slate-700">{t}</p>
                    <p className="text-[10px] text-slate-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep("line")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-colors shadow-sm"
          >
            セットアップを始める →
          </button>
        </div>
      )}

      {/* ── ステップ2: LINE設定 ── */}
      {step === "line" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Step 1</p>
              <h2 className="text-base font-black text-slate-800 mt-0.5">LINE公式アカウントを連携する</h2>
              <p className="text-xs text-slate-500 mt-1">
                LINE Developersで作成したチャネルのWebhook URLに以下を設定してください
              </p>
            </div>

            {/* Webhook URL */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <p className="text-[9px] text-slate-400 mb-1">あなた専用のWebhook URL</p>
              <p className="text-[10px] text-blue-600 font-mono break-all">{webhookUrl}</p>
              <button
                type="button"
                onClick={copyWebhook}
                className="mt-2 text-[10px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                {copied ? "✅ コピーしました" : "📋 URLをコピー"}
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-[11px] text-slate-500 font-medium">Channel Access Token</label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="LINE Developersコンソールからコピーしてください"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-blue-400 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] text-slate-500 font-medium">Channel Secret</label>
                <input
                  type="password"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="Channel Secretを入力"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-blue-400 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] text-slate-500 font-medium">
                  自分のLINE User ID
                  <span className="text-slate-400 font-normal ml-1">（クライアントの問診完了通知を受け取る）</span>
                </label>
                <input
                  type="text"
                  value={notifyId}
                  onChange={(e) => setNotifyId(e.target.value)}
                  placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-blue-400 transition-all"
                />
                <p className="text-[9px] text-slate-400">LINE公式に「自分のID」と送ると確認できます</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("client")}
              className="flex-none px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-semibold rounded-xl transition-colors"
            >
              あとで設定
            </button>
            <button
              type="button"
              onClick={saveLine}
              disabled={savingLine || (!token && !secret)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 rounded-xl text-sm transition-colors"
            >
              {savingLine ? "保存中..." : "保存して次へ →"}
            </button>
          </div>
        </div>
      )}

      {/* ── ステップ3: クライアント追加 ── */}
      {step === "client" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Step 2</p>
              <h2 className="text-base font-black text-slate-800 mt-0.5">
                {isPro ? "最初のクライアントを追加する" : "自分を登録する"}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isPro
                  ? "PINを設定してクライアントに共有します。LINEにPINを送るだけで連携完了。"
                  : "自分用のダッシュボードを作成します。自分でPINを設定してアクセスしてください。"}
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-[11px] text-slate-500 font-medium">
                  {isPro ? "クライアントのお名前" : "あなたのお名前"}
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder={isPro ? "例: 田中 花子" : trainer.name}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-all"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] text-slate-500 font-medium">PIN（4〜6桁の数字）</label>
                <input
                  type="text"
                  value={clientPin}
                  onChange={(e) => setClientPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="例: 1234"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:border-blue-400 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] text-slate-500 font-medium">目標（任意）</label>
                <input
                  type="text"
                  value={clientGoal}
                  onChange={(e) => setClientGoal(e.target.value)}
                  placeholder="例: 体脂肪率15%以下・大会出場"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-all"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={addClient}
            disabled={addingClient || clientName.length === 0 || clientPin.length < 4}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3.5 rounded-2xl text-sm transition-colors shadow-sm"
          >
            {addingClient ? "作成中..." : "作成してセットアップ完了 →"}
          </button>
        </div>
      )}

      {/* ── ステップ4: 完了 ── */}
      {step === "done" && createdClientId && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 text-center">
            <div className="space-y-2">
              <p className="text-4xl">🚀</p>
              <h2 className="text-lg font-black text-slate-800">セットアップ完了！</h2>
              <p className="text-xs text-slate-500">あとはクライアントにURLとPINを共有するだけです</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2">
              <p className="text-[10px] text-slate-400 font-semibold">クライアントに共有する情報</p>
              <p className="text-xs text-blue-600 font-mono break-all">
                {process.env.NEXT_PUBLIC_APP_URL}/client/{createdClientId}
              </p>
              <p className="text-xs text-slate-600">PIN: <strong className="font-mono tracking-widest">{clientPin}</strong></p>
            </div>

            <div className="space-y-2 text-left">
              <p className="text-[11px] font-semibold text-slate-600">次にやること</p>
              {isPro ? [
                "クライアントにURLとPINをLINEで送る",
                "クライアントがLINE公式にPINを送信 → 問診スタート",
                "問診完了通知が届いたら目標設定を入力",
                "ロードマップをLINEで送信 → 本格始動",
              ] : [
                "上のURLにアクセスしてPINでログイン",
                "自分のLINE公式アカウントにPINを送信",
                "問診に答える（約2分）",
                "食事・トレーニングのスクショを送り始める",
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-[9px] font-bold flex items-center justify-center flex-none mt-0.5">{i + 1}</span>
                  {t}
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.replace("/trainer")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-colors shadow-sm"
          >
            管理画面へ →
          </button>
        </div>
      )}
    </div>
  );
}
