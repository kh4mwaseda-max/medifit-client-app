"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo, Button, Icon, cn } from "@/components/cf/primitives";

interface Props {
  trainer: {
    id: string;
    name: string;
    plan: string;
    line_channel_access_token: string | null;
  };
  webhookUrl: string;
}

const LINE_FRIEND_URL =
  process.env.NEXT_PUBLIC_LINE_FRIEND_URL ?? "https://lin.ee/YOUR_LINE_ID";

type Step = "welcome" | "line" | "done";

export default function SetupGuide({ trainer }: Props) {
  const [step, setStep] = useState<Step>("welcome");
  const [lineCode, setLineCode] = useState<string | null>(null);
  const [lineCodeExpiry, setLineCodeExpiry] = useState<Date | null>(null);
  const [lineCodeGenerating, setLineCodeGenerating] = useState(false);
  const [lineCodeError, setLineCodeError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const generateLineCode = async () => {
    setLineCodeGenerating(true);
    setLineCodeError(null);
    try {
      const res = await fetch("/api/trainer/line-link-code", {
        method: "POST",
      });
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

  const stepIndex: Record<Step, number> = { welcome: 0, line: 1, done: 2 };
  const steps: { key: Step; label: string }[] = [
    { key: "welcome", label: "ようこそ" },
    { key: "line", label: "LINE連携" },
    { key: "done", label: "完了" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Logo />
        <div className="text-[10px] text-ink-500 font-medium">
          {stepIndex[step] + 1} / 3
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center">
        {steps.map((s, i) => {
          const active = stepIndex[step] >= i;
          const current = step === s.key;
          return (
            <div key={s.key} className="flex-1 flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition",
                    active
                      ? "bg-brand-500 text-white shadow-[0_4px_12px_-4px_rgba(59,130,246,0.5)]"
                      : "bg-ink-100 text-ink-400",
                    current && "ring-4 ring-brand-500/20",
                  )}
                >
                  {stepIndex[step] > i ? <Icon name="check-circle" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-[10px] mt-1.5 font-semibold",
                    active ? "text-ink-700" : "text-ink-400",
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 -mt-5 transition",
                    stepIndex[step] > i ? "bg-brand-500" : "bg-ink-200",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {step === "welcome" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-card border border-ink-200/70 p-6 space-y-5">
            <div className="text-center">
              <div className="text-4xl mb-2">👋</div>
              <h1 className="text-xl font-black text-ink-800 tracking-tight">
                {trainer.name} さん、ようこそ！
              </h1>
              <p className="text-sm text-ink-500 mt-1">
                2ステップでセットアップ完了します
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  n: "1",
                  icon: "message-circle",
                  title: "LINE通知を連携する",
                  desc: "公式LINEにコードを送るだけ。記録が届いたら通知が来ます",
                },
                {
                  n: "2",
                  icon: "user-plus",
                  title: "招待リンクが届く",
                  desc: "連携完了と同時に、クライアントへの招待リンクがLINEで届きます",
                },
              ].map((item) => (
                <div
                  key={item.n}
                  className="flex items-start gap-3 bg-ink-50 rounded-xl p-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                    <Icon name={item.icon} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink-800">
                      {item.title}
                    </p>
                    <p className="text-xs text-ink-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            iconRight="chevron-right"
            onClick={() => setStep("line")}
          >
            LINE通知を設定する
          </Button>
        </div>
      )}

      {step === "line" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-card border border-ink-200/70 p-5 space-y-5">
            <div>
              <span className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-md uppercase tracking-widest">
                Step 1
              </span>
              <h2 className="text-base font-black text-ink-800 mt-2">
                公式LINEを友達追加 & コードを送る
              </h2>
              <p className="text-xs text-ink-500 mt-1">
                クライアントの記録時、あなたのLINEに通知が届きます
              </p>
            </div>

            {!lineCode && (
              <div className="space-y-4">
                <div className="space-y-2.5">
                  {[
                    "「コードを発行する」をタップ",
                    "表示されたコードをコピー",
                    "公式LINEを友達追加",
                    "コードをLINEに送信 → 完了",
                  ].map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 text-xs text-ink-700"
                    >
                      <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 font-bold text-[11px] flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>

                {lineCodeError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                    <Icon
                      name="alert-circle"
                      className="text-red-600 mt-0.5"
                    />
                    <p className="text-xs text-red-700">{lineCodeError}</p>
                  </div>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  loading={lineCodeGenerating}
                  onClick={generateLineCode}
                >
                  {lineCodeGenerating ? "発行中..." : "コードを発行する"}
                </Button>
              </div>
            )}

            {lineCode && (
              <div className="space-y-4">
                <div className="bg-brand-50 border-2 border-brand-200 rounded-2xl p-5 text-center space-y-3">
                  <p className="text-xs text-brand-700 font-bold">
                    このコードを公式LINEに送ってください
                  </p>
                  <p className="text-5xl font-black tracking-[0.4em] text-brand-700 font-mono">
                    {lineCode}
                  </p>
                  {lineCodeExpiry && (
                    <p className="text-[10px] text-ink-500">
                      有効期限:{" "}
                      {lineCodeExpiry.toLocaleTimeString("ja-JP", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      まで
                    </p>
                  )}
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full"
                    onClick={copy}
                  >
                    {copied ? "✅ コピーしました" : "コードをコピー"}
                  </Button>
                </div>

                <a
                  href={LINE_FRIEND_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full h-12 bg-[#06C755] hover:brightness-110 text-white font-bold rounded-xl text-sm transition shadow-[0_8px_20px_-8px_rgba(6,199,85,0.6)]"
                >
                  <Icon name="message-circle" />
                  公式LINEを友達追加
                </a>

                <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                  <Icon name="info" className="text-amber-600 mt-0.5" />
                  <div className="text-xs text-amber-800 space-y-1">
                    <p className="font-bold">LINEを確認してください</p>
                    <p className="text-amber-700">
                      「✅ LINE通知の連携が完了しました！」が届けば連携完了です。
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  iconRight="chevron-right"
                  onClick={() => router.replace("/trainer")}
                >
                  連携完了 → 管理画面へ
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setLineCode(null);
                    setLineCodeExpiry(null);
                  }}
                  className="w-full text-xs text-ink-500 hover:text-ink-700 py-1 transition"
                >
                  コードを再発行する
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setStep("welcome")}
            className="w-full inline-flex items-center justify-center gap-1 text-xs text-ink-500 hover:text-ink-700 py-2"
          >
            <Icon name="chevron-left" />
            戻る
          </button>
        </div>
      )}

      {step === "done" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-card border border-ink-200/70 p-6 space-y-5">
            <div className="text-center">
              <div className="text-4xl mb-2">🚀</div>
              <h2 className="text-xl font-black text-ink-800 tracking-tight">
                セットアップ完了！
              </h2>
              <p className="text-sm text-ink-500 mt-1">
                LINEに招待リンクが届いています
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
                次にやること
              </p>
              {[
                "ダッシュボードの「招待リンク発行」をタップ",
                "クライアント名を入力してリンクを発行",
                "リンクとPINをクライアントに送る",
                "クライアントが登録 → LINEでPINを送信",
                "スクショを送るだけで自動記録スタート",
              ].map((t, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs text-emerald-800"
                >
                  <span className="font-bold shrink-0">{i + 1}.</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            iconRight="chevron-right"
            onClick={() => router.replace("/trainer")}
          >
            管理画面へ
          </Button>
        </div>
      )}
    </div>
  );
}
