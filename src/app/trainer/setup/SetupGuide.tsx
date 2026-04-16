"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

interface Props {
  trainer: { id: string; name: string; plan: string; line_channel_access_token: string | null };
  webhookUrl: string;
}

const LINE_FRIEND_URL = process.env.NEXT_PUBLIC_LINE_FRIEND_URL ?? "https://lin.ee/YOUR_LINE_ID";

type Step = "welcome" | "line" | "done";

export default function SetupGuide({ trainer }: Props) {
  const [step, setStep] = useState<Step>("welcome");
  const [lineCode, setLineCode] = useState<string | null>(null);
  const [lineCodeExpiry, setLineCodeExpiry] = useState<Date | null>(null);
  const [lineCodeGenerating, setLineCodeGenerating] = useState(false);
  const [lineCodeError, setLineCodeError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sentConfirmed, setSentConfirmed] = useState(false);
  const router = useRouter();

  const generateLineCode = async () => {
    setLineCodeGenerating(true);
    setLineCodeError(null);
    try {
      const res = await fetch("/api/trainer/line-link-code", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "コードの発行に失敗しました");
      setLineCode(data.code);
      setLineCodeExpiry(new Date(data.expiresAt));
    } catch (e: any) {
      setLineCodeError(e.message);
    } finally {
      setLineCodeGenerating(false);
    }
  };

  const copy = () => {
    if (!lineCode) return;
    navigator.clipboard.writeText(lineCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <Logo size="sm" variant="full" />
        <div className="flex gap-1.5">
          {(["welcome", "line", "done"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-1.5 w-8 rounded-full transition-all ${
                step === "done" ? "bg-blue-600" :
                step === "line" && i <= 1 ? "bg-blue-600" :
                step === "welcome" && i === 0 ? "bg-blue-400" :
                "bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── STEP 1: ウェルカム ── */}
      {step === "welcome" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="text-center space-y-2">
              <p className="text-3xl">👋</p>
              <h1 className="text-lg font-black text-slate-800">{trainer.name} さん、<br />ようこそ！</h1>
              <p className="text-sm text-slate-500">2ステップでセットアップ完了します</p>
            </div>

            <div className="space-y-3">
              {[
                { step: "1", icon: "📱", title: "LINE通知を連携する", desc: "Client Fit公式LINEにコードを送るだけ。クライアントの記録が届いたら通知が来ます" },
                { step: "2", icon: "📨", title: "招待リンクが届く", desc: "連携完了と同時に、クライアントへの招待リンクがLINEで届きます。そのまま転送するだけ" },
              ].map(({ step: n, icon, title, desc }) => (
                <div key={n} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-black text-xs flex items-center justify-center flex-none mt-0.5">{n}</span>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{icon} {title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep("line")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl text-sm transition-colors shadow-sm"
          >
            LINE通知を設定する →
          </button>
        </div>
      )}

      {/* ── STEP 2: LINE連携（必須） ── */}
      {step === "line" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
            <div>
              <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">Step 1</p>
              <h2 className="text-base font-black text-slate-800 mt-0.5">Client Fit公式LINEに友達追加 & コードを送る</h2>
              <p className="text-xs text-slate-500 mt-1">クライアントが記録を送ったとき、あなたのLINEに通知が届くようになります</p>
            </div>

            {/* フェーズ1: コード発行前 */}
            {!lineCode && (
              <div className="space-y-4">
                <div className="space-y-2.5">
                  {[
                    "① 下の「コードを発行する」をタップ",
                    "② 表示されたコードをコピー",
                    "③ Client Fit公式LINEを友達追加",
                    "④ コードをLINEに送信 → 完了",
                  ].map((t, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs text-slate-600">
                      <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-500 font-bold text-[10px] flex items-center justify-center flex-none">{i + 1}</span>
                      <span>{t.replace(/^[①-④] /, "")}</span>
                    </div>
                  ))}
                </div>

                {lineCodeError && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs text-rose-600">
                    {lineCodeError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={generateLineCode}
                  disabled={lineCodeGenerating}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3.5 rounded-xl text-sm transition-colors"
                >
                  {lineCodeGenerating ? "発行中..." : "🔑 コードを発行する"}
                </button>
              </div>
            )}

            {/* フェーズ2: コード発行後 */}
            {lineCode && (
              <div className="space-y-4">
                {/* コード表示 */}
                <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-5 text-center space-y-3">
                  <p className="text-xs text-blue-600 font-bold">このコードをClient Fit公式LINEに送ってください</p>
                  <p className="text-5xl font-black tracking-[0.4em] text-blue-700 font-mono">{lineCode}</p>
                  {lineCodeExpiry && (
                    <p className="text-[10px] text-slate-400">
                      有効期限: {lineCodeExpiry.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })} まで
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={copy}
                    className="w-full bg-white border border-blue-200 hover:bg-blue-50 text-blue-600 font-bold py-2.5 rounded-xl text-sm transition-colors"
                  >
                    {copied ? "✅ コピーしました" : "📋 コードをコピー"}
                  </button>
                </div>

                {/* LINE友達追加ボタン */}
                <a
                  href={LINE_FRIEND_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl text-sm transition-colors"
                >
                  📱 Client Fit公式LINEを友達追加する
                </a>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 space-y-2">
                  <p className="font-bold">② LINEを確認してください</p>
                  <p>Client Fit公式から「✅ LINE通知の連携が完了しました！」と返信が届いたら連携完了です。</p>
                  <p className="text-amber-500">連携が確認できたら管理画面に進んでください👇</p>
                </div>

                <button
                  type="button"
                  onClick={() => router.replace("/trainer")}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 rounded-2xl text-sm transition-colors"
                >
                  連携完了 → 管理画面へ
                </button>

                <button
                  type="button"
                  onClick={() => { setLineCode(null); setLineCodeExpiry(null); setSentConfirmed(false); }}
                  className="w-full text-xs text-slate-400 hover:text-slate-600 py-1 transition-colors"
                >
                  コードを再発行する
                </button>
              </div>
            )}
          </div>

          <button type="button" onClick={() => setStep("welcome")} className="w-full text-xs text-slate-400 py-2">
            ← 戻る
          </button>
        </div>
      )}

      {/* ── STEP 3: 完了 ── */}
      {step === "done" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="text-center space-y-2">
              <p className="text-4xl">🚀</p>
              <h2 className="text-lg font-black text-slate-800">セットアップ完了！</h2>
              <p className="text-sm text-slate-500">LINEに招待リンクが届いています</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-green-700">次にやること</p>
              {[
                "ダッシュボードの「招待リンク発行」をタップ",
                "クライアント名を入力してリンクを発行",
                "リンクとPINをクライアントに送る",
                "クライアントがリンクから登録 → LINEでPINを送信",
                "スクショを送るだけで自動記録スタート 📊",
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-green-600">
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
