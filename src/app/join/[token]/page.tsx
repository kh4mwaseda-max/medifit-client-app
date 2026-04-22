"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Logo, Button, Input, Icon } from "@/components/cf/primitives";

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "done">(
    "loading",
  );
  const [trainerName, setTrainerName] = useState("");
  const [clientName, setClientName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [pin, setPin] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/join/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setTrainerName(data.trainerName ?? "トレーナー");
          setClientName(data.clientName !== "未設定" ? data.clientName : "");
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  const handleJoin = async () => {
    if (!clientName.trim()) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/join/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: clientName.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setClientId(data.clientId);
      setPin(data.pin ?? null);
      setStatus("done");
    } else {
      setError(data.error ?? "エラーが発生しました");
    }
    setSaving(false);
  };

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-ink-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-ink-500 text-sm">
          <span className="w-4 h-4 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          確認中...
        </div>
      </main>
    );
  }

  if (status === "invalid") {
    return (
      <main className="min-h-screen bg-ink-50 flex flex-col items-center justify-center p-6 text-center">
        <Logo />
        <div className="inline-flex w-14 h-14 rounded-2xl bg-red-50 text-red-600 items-center justify-center mt-8 mb-4">
          <Icon name="alert-triangle" size={28} />
        </div>
        <p className="text-ink-800 font-bold text-lg">リンクが無効です</p>
        <p className="text-ink-500 text-sm mt-2 max-w-sm leading-relaxed">
          招待リンクの有効期限が切れているか、URLが正しくありません。
          <br />
          トレーナーに再発行を依頼してください。
        </p>
      </main>
    );
  }

  if (status === "done" && clientId) {
    return (
      <main className="min-h-screen bg-ink-50 flex flex-col items-center justify-center p-5">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center">
            <Logo />
          </div>

          <div className="grad-brand rounded-3xl p-6 text-white text-center shadow-glow">
            <div className="text-4xl mb-2">🎉</div>
            <h1 className="text-xl font-black tracking-tight">
              {clientName} さん、登録完了！
            </h1>
            <p className="text-white/80 text-xs mt-1">
              Client Fit へようこそ
            </p>
          </div>

          {pin && (
            <div className="bg-white rounded-2xl shadow-card border border-ink-200/70 p-5 space-y-4">
              <div className="text-center">
                <span className="inline-block text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-100 px-3 py-1 rounded-full uppercase tracking-widest">
                  次のステップ
                </span>
                <p className="text-base font-bold text-ink-800 mt-2">
                  LINE連携用PIN
                </p>
                <p className="text-xs text-ink-500 mt-1">
                  公式LINEを友達追加して、このPINを送信してください
                </p>
              </div>

              <div className="bg-ink-50 border border-ink-200 rounded-xl py-4 text-center">
                <p className="text-4xl font-black font-mono tracking-[0.4em] text-ink-800">
                  {pin}
                </p>
              </div>

              <div className="space-y-2">
                {[
                  { step: "1", text: "公式LINEを友達追加" },
                  { step: "2", text: "上のPINをLINEに送信" },
                  { step: "3", text: "スクショを送るだけで自動記録開始" },
                ].map((s) => (
                  <div key={s.step} className="flex items-center gap-3 text-xs">
                    <span className="w-6 h-6 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center text-[11px]">
                      {s.step}
                    </span>
                    <span className="text-ink-700">{s.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            iconRight="chevron-right"
            onClick={() => router.replace(`/client/${clientId}`)}
          >
            ダッシュボードを開く
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-ink-50 flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <p className="text-sm text-ink-500">
            <span className="text-ink-800 font-bold">{trainerName}</span>{" "}
            さんから招待されました
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-ink-200/70 p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <Icon name="info" />
            </div>
            <div>
              <p className="text-sm font-bold text-ink-800">Client Fit とは</p>
              <p className="text-xs text-ink-500 leading-relaxed mt-1">
                あすけん・STRONG・タニタ等のスクショをLINEに送るだけで、食事・体重・トレーニングが自動記録されます。
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-ink-200/70 p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink-700">
              あなたのお名前
            </label>
            <Input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="例: 田中 花子"
              autoFocus
              icon="user-plus"
            />
          </div>

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
            loading={saving}
            disabled={!clientName.trim()}
            iconRight="chevron-right"
            onClick={handleJoin}
          >
            {saving ? "登録中..." : "登録して始める"}
          </Button>
        </div>

        <p className="text-center text-[10px] text-ink-400">
          登録することで利用規約・プライバシーポリシーに同意したものとみなします
        </p>
      </div>
    </main>
  );
}
