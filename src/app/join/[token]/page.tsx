"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Logo from "@/components/Logo";

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "done">("loading");
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
      <main className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <p className="text-slate-400 text-sm">確認中...</p>
      </main>
    );
  }

  if (status === "invalid") {
    return (
      <main className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center p-6 text-center">
        <Logo size="sm" variant="full" theme="dark" />
        <p className="text-white font-bold text-lg mt-6">リンクが無効です</p>
        <p className="text-slate-400 text-sm mt-2">招待リンクの有効期限が切れているか、URLが正しくありません。<br />トレーナーに再発行を依頼してください。</p>
      </main>
    );
  }

  if (status === "done" && clientId) {
    return (
      <main className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center p-6 text-center space-y-5">
        <Logo size="sm" variant="full" theme="dark" />
        <div className="text-4xl">🎉</div>
        <h1 className="text-white font-black text-lg">{clientName} さん、登録完了です！</h1>

        {pin && (
          <div className="w-full max-w-xs bg-white/5 border border-white/20 rounded-2xl p-5 space-y-3 text-center">
            <p className="text-xs text-blue-400 font-bold">次のステップ：LINE連携</p>
            <p className="text-xs text-slate-400">AYF公式LINEを友達追加して、このPINを送ってください</p>
            <p className="text-4xl font-black font-mono tracking-[0.4em] text-white">{pin}</p>
            <p className="text-[10px] text-slate-500">スクショを送るだけで自動記録が始まります</p>
          </div>
        )}

        <button
          type="button"
          onClick={() => router.replace(`/client/${clientId}`)}
          className="w-full max-w-xs bg-blue-500 hover:bg-blue-400 text-white font-bold py-4 rounded-2xl text-sm transition-colors"
        >
          ダッシュボードを開く →
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Logo size="sm" variant="full" theme="dark" />
          <p className="text-slate-400 text-sm pt-2">
            <span className="text-white font-bold">{trainerName}</span> さんから招待されました
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <div>
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">AllYourFit とは</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              あすけん・STRONG・タニタ等のスクショをLINEに送るだけで、食事・体重・トレーニングが自動記録されます。AIがデータを統合分析してトレーナーが指導できます。
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">あなたのお名前</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="例: 田中 花子"
              autoFocus
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition-all text-sm"
            />
          </div>

          {error && (
            <p className="text-rose-400 text-xs text-center bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleJoin}
            disabled={saving || !clientName.trim()}
            className="w-full bg-blue-500 hover:bg-blue-400 disabled:bg-white/10 disabled:text-slate-600 text-white font-bold py-4 rounded-2xl text-sm transition-colors"
          >
            {saving ? "登録中..." : "登録して始める →"}
          </button>

          <p className="text-center text-[10px] text-slate-600">
            登録することで利用規約・プライバシーポリシーに同意したものとみなします
          </p>
        </div>
      </div>
    </main>
  );
}
