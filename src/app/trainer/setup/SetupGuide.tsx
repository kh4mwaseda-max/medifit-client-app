"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

interface Props {
  trainer: { id: string; name: string; plan: string; line_channel_access_token: string | null };
  webhookUrl: string;
  isIndividual?: boolean;
}

const LINE_FRIEND_URL = process.env.NEXT_PUBLIC_LINE_FRIEND_URL ?? "https://lin.ee/YOUR_LINE_ID";

export default function SetupGuide({ trainer, isIndividual = false }: Props) {
  const [step, setStep] = useState<"welcome" | "client" | "done">("welcome");
  const [clientName, setClientName] = useState("");
  const [clientPin, setClientPin] = useState("");
  const [clientGoal, setClientGoal] = useState("");
  const [adding, setAdding] = useState(false);
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);
  const [copied, setCopied] = useState<"url" | "pin" | "msg" | null>(null);
  const router = useRouter();

  const isPro = trainer.plan === "pro";
  const stepIndex = { welcome: 0, client: 1, done: 2 }[step];
  const totalSteps = 2;

  const addClient = async () => {
    if (!clientName || clientPin.length < 4) return;
    setAdding(true);
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
    setAdding(false);
  };

  const appUrl = typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL ?? "";

  const clientUrl = createdClientId ? `${appUrl}/client/${createdClientId}` : "";

  const shareMessage = `【AllYourFit】\nトレーナーからダッシュボードのご案内です📊\n\n① 下のURLにアクセス\n${clientUrl}\n\n② PIN番号を入力: ${clientPin}\n\n③ AllYourFit LINE公式を友達追加してPINを送ると問診がスタートします\n${LINE_FRIEND_URL}`;

  const copy = (type: "url" | "pin" | "msg", text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">

      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <Logo size="sm" variant="full" />
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-8 rounded-full transition-all ${i < stepIndex ? "bg-blue-600" : i === stepIndex - 1 ? "bg-blue-400" : "bg-slate-200"}`}
            />
          ))}
        </div>
      </div>

      {/* ── STEP 1: ウェルカム ── */}
      {step === "welcome" && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="text-center space-y-2">
              <p className="text-3xl">🎉</p>
              <h1 className="text-lg font-black text-slate-800">
                {trainer.name} さん、<br />ようこそ！
              </h1>
              <p className="text-sm text-slate-500">
                {isIndividual ? "1分でセットアップ完了します" : "クライアントを追加するだけで始められます"}
              </p>
            </div>

            {/* プランバッジ */}
            <div className={`rounded-2xl p-4 text-center ${isIndividual ? "bg-teal-50 border border-teal-100" : isPro ? "bg-blue-50 border border-blue-100" : "bg-slate-50 border border-slate-200"}`}>
              <p className={`text-xs font-bold ${isIndividual ? "text-teal-600" : isPro ? "text-blue-600" : "text-slate-500"}`}>
                {isIndividual ? "🏋️ 個人プラン" : isPro ? "✦ Pro プラン" : "Free プラン"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {isIndividual
                  ? "食事・体重・筋トレをLINEで記録。AIが自動解析してダッシュボードに表示"
                  : isPro
                  ? "クライアント最大10名 · AI解析無制限"
                  : "クライアント1名まで · 無料で始める"}
              </p>
            </div>

            {/* フロー説明 */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-600">使い方はシンプルです</p>
              {(isIndividual ? [
                { icon: "👤", t: "自分のダッシュボードを作成（PIN設定）" },
                { icon: "📱", t: "LINEにスクショを送るだけで自動記録" },
                { icon: "📊", t: "ダッシュボードでデータを確認・分析" },
              ] : [
                { icon: "👤", t: "クライアントを追加してURLとPINをシェア" },
                { icon: "📱", t: "クライアントがLINEにスクショを送ると自動記録" },
                { icon: "📊", t: "管理画面でリアルタイムにデータを確認" },
              ]).map(({ icon, t }, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
                  <span className="text-xl w-8 text-center">{icon}</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>

            {/* LINE説明バナー */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex gap-2.5 items-start">
              <span className="text-green-500 text-lg flex-none">✓</span>
              <div>
                <p className="text-xs font-bold text-green-700">LINE連携はクライアントが自分でやります</p>
                <p className="text-xs text-green-600 mt-0.5">
                  トレーナー側の設定は一切不要。クライアントがAllYourFitのLINE公式を友達追加してPINを送るだけで自動的に連携されます。
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep("client")}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-4 rounded-2xl text-sm transition-colors shadow-sm"
          >
            {isIndividual ? "自分のダッシュボードを作成 →" : "最初のクライアントを追加 →"}
          </button>
        </div>
      )}

      {/* ── STEP 2: クライアント追加 ── */}
      {step === "client" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">Step 1</p>
              <h2 className="text-base font-black text-slate-800 mt-0.5">
                {isIndividual ? "あなたのダッシュボードを作成" : "クライアントを追加"}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isIndividual
                  ? "名前とPINを設定してください。PINはLINE連携に使います。"
                  : "クライアントの名前とPINを設定します。あとでURLとPINをLINEで送るだけ。"}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  {isIndividual ? "あなたのお名前" : "クライアントのお名前"}
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder={isIndividual ? trainer.name : "例: 田中 花子"}
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">PIN（4〜6桁）</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={clientPin}
                  onChange={(e) => setClientPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="例: 1234"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono tracking-[0.3em] focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                />
                <p className="text-xs text-slate-400 mt-1">このPINをLINEに送ることで連携します</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">目標（任意）</label>
                <input
                  type="text"
                  value={clientGoal}
                  onChange={(e) => setClientGoal(e.target.value)}
                  placeholder="例: 体脂肪率15%以下・大会出場"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={addClient}
            disabled={adding || clientName.length === 0 || clientPin.length < 4}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-2xl text-sm transition-colors shadow-sm"
          >
            {adding ? "作成中..." : "作成する →"}
          </button>

          <button type="button" onClick={() => setStep("welcome")} className="w-full text-xs text-slate-400 py-2">
            ← 戻る
          </button>
        </div>
      )}

      {/* ── STEP 3: 完了 ── */}
      {step === "done" && createdClientId && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="text-center space-y-1">
              <p className="text-3xl">🚀</p>
              <h2 className="text-base font-black text-slate-800">準備完了！</h2>
              <p className="text-xs text-slate-500">
                {isIndividual ? "下のURLにアクセスして始めましょう" : "クライアントにこの情報をLINEで送ってください"}
              </p>
            </div>

            {/* シェア情報 */}
            <div className="space-y-2.5">
              {/* クライアントURL */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                <p className="text-xs text-slate-400 font-medium">ダッシュボードURL</p>
                <p className="text-xs text-blue-600 font-mono break-all">{clientUrl}</p>
                <button
                  type="button"
                  onClick={() => copy("url", clientUrl)}
                  className="text-xs font-semibold text-blue-500 hover:text-blue-700"
                >
                  {copied === "url" ? "✅ コピーしました" : "📋 URLをコピー"}
                </button>
              </div>

              {/* PIN */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">PIN番号</p>
                  <p className="text-xl font-black font-mono tracking-[0.3em] text-slate-800 mt-0.5">{clientPin}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copy("pin", clientPin)}
                  className="text-xs font-semibold text-blue-500 hover:text-blue-700"
                >
                  {copied === "pin" ? "✅" : "📋 コピー"}
                </button>
              </div>

              {/* まとめてコピー */}
              {!isIndividual && (
                <button
                  type="button"
                  onClick={() => copy("msg", shareMessage)}
                  className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {copied === "msg" ? "✅ コピーしました！" : "📤 LINEで送る文面をコピー"}
                </button>
              )}
            </div>

            {/* 次のステップ */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-2">
              <p className="text-xs font-bold text-blue-700">
                {isIndividual ? "始め方" : "クライアントへの案内"}
              </p>
              {(isIndividual ? [
                "上のURLにアクセスしてPINでログイン",
                "AllYourFit LINE公式を友達追加",
                "LINEにPINを送信 → 問診スタート（約2分）",
                "食事・筋トレ・体重のスクショを送ると自動記録",
              ] : [
                "上の文面をコピーしてLINEで送信",
                "クライアントがURLにアクセスしてPINでログイン",
                "AllYourFit LINEを友達追加してPINを送信",
                "問診完了後、管理画面に通知が届きます",
              ]).map((t, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-blue-600">
                  <span className="font-bold flex-none">{i + 1}.</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.replace("/trainer")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl text-sm transition-colors shadow-sm"
          >
            管理画面へ →
          </button>
        </div>
      )}
    </div>
  );
}
