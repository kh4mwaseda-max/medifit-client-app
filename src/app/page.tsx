import Link from "next/link";
import Logo from "@/components/Logo";

const COURSES = [
  { icon: "📉", label: "減量", desc: "体重・体脂肪率を数値で落とす" },
  { icon: "✨", label: "ボディメイク", desc: "見た目を変える・引き締める" },
  { icon: "💪", label: "バルクアップ", desc: "本格的に筋肉・体重を増やす" },
  { icon: "❤️", label: "健康維持", desc: "生活習慣病予防・長期的な健康" },
  { icon: "🏆", label: "大会準備", desc: "コンテスト・大会ピーキング" },
];

const APPS = ["あすけん", "筋トレMemo", "STRONG", "タニタ", "FiNC", "カロミル"];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0f1e] flex flex-col text-white">

      {/* ── ナビ ── */}
      <nav className="px-5 py-4 flex items-center justify-between border-b border-white/10">
        <Logo size="sm" variant="full" theme="dark" />
        <div className="flex items-center gap-3">
          <Link href="/trainer/login" className="text-xs text-slate-400 hover:text-white font-medium transition-colors">
            ログイン
          </Link>
          <Link href="/trainer/register" className="text-xs bg-blue-500 hover:bg-blue-400 text-white font-semibold px-4 py-2 rounded-xl transition-colors">
            無料で始める
          </Link>
        </div>
      </nav>

      {/* ── ヒーロー ── */}
      <section className="flex flex-col items-center justify-center px-5 pt-20 pb-16 text-center max-w-2xl mx-auto w-full">
        <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded-full tracking-widest uppercase mb-6">
          ローンチ期間 — 全員無料
        </span>

        <h1 className="text-3xl sm:text-4xl font-black leading-tight tracking-tight mb-5">
          筋トレ記録と食事記録を、<br />
          <span className="text-blue-400">ひとつの画面で管理する。</span>
        </h1>

        <p className="text-slate-400 text-sm leading-relaxed mb-4 max-w-sm">
          あすけん・筋トレMemo・STRONG・タニタのスクショをLINEに送るだけ。
          食事×体重×トレーニングをAIが統合分析して、停滞の原因まで教えてくれる。
        </p>

        <div className="flex flex-wrap justify-center gap-1.5 mb-10">
          {APPS.map(app => (
            <span key={app} className="text-[10px] text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">{app}</span>
          ))}
        </div>

        {/* 2プラン分岐 CTA */}
        <div className="w-full max-w-sm space-y-3">
          <Link
            href="/trainer/register?type=trainer"
            className="flex items-center justify-between w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-4 px-5 rounded-2xl text-sm transition-colors"
          >
            <span>📋 トレーナーとして使う</span>
            <span className="text-blue-200 text-xs font-normal">クライアント管理 →</span>
          </Link>
          <Link
            href="/trainer/register?type=individual"
            className="flex items-center justify-between w-full bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold py-4 px-5 rounded-2xl text-sm transition-colors"
          >
            <span>🏋️ 個人で使う</span>
            <span className="text-slate-400 text-xs font-normal">自分のデータを管理 →</span>
          </Link>
        </div>
        <p className="text-[10px] text-slate-600 mt-4">クレジットカード不要 · 30秒で登録完了 · ローンチ期間は完全無料</p>
      </section>

      {/* ── Before / After ── */}
      <section className="px-5 py-14 border-t border-white/10">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest mb-8">Before / After</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-slate-500">今まで</p>
              {[
                "あすけんで食事を記録",
                "筋トレMemoで筋トレを記録",
                "タニタで体重を記録",
                "でも3つのデータがバラバラのまま",
                "「なぜ停滞してるか」は誰も教えてくれない",
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                  <span className="text-rose-400 flex-none mt-0.5">✗</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-blue-400">AYFで</p>
              {[
                "スクショをLINEに送るだけ",
                "全アプリのデータが1画面に",
                "筋トレ×食事×体重を統合管理",
                "AIが相関を分析して原因を提示",
                "「タンパク質不足の週に重量が落ちる」が見える",
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="text-blue-400 flex-none mt-0.5">✓</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 仕組み ── */}
      <section className="px-5 py-14 border-t border-white/10">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest mb-10">使い方</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "01", icon: "📸", title: "スクショをLINEに送る", desc: "あすけん・筋トレMemo・STRONG・タニタ等のスクショをAYF公式LINEに送るだけ。手入力ゼロ。" },
              { step: "02", icon: "⚡", title: "AIが自動解析・記録", desc: "Claude AIがスクショを読み取り、食事・体重・トレーニングを自動でダッシュボードに記録。" },
              { step: "03", icon: "📊", title: "統合データで原因が分かる", desc: "筋トレ×食事×体重の相関グラフで、個別アプリでは見えなかった停滞原因が一目で分かる。" },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">{step}</span>
                  <span className="text-2xl">{icon}</span>
                </div>
                <p className="text-sm font-bold text-white">{title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── コース紹介 ── */}
      <section className="px-5 py-14 border-t border-white/10">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">コース</p>
          <p className="text-center text-lg font-black text-white mb-8">あなたの目標に合ったコースを選ぶ</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {COURSES.map(({ icon, label, desc }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1.5 hover:border-blue-500/40 transition-colors">
                <span className="text-2xl">{icon}</span>
                <p className="text-sm font-bold text-white">{label}</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-600 mt-4">登録後のオンボーディングで選択できます</p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-5 py-16 border-t border-white/10">
        <div className="max-w-sm mx-auto text-center space-y-5">
          <p className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full inline-block">
            ローンチ期間 · 全機能無料
          </p>
          <h2 className="text-xl font-black text-white">今すぐ始める</h2>
          <p className="text-xs text-slate-500">クレジットカード不要。30秒で登録完了。</p>
          <div className="space-y-3">
            <Link href="/trainer/register?type=trainer" className="block w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-4 rounded-2xl text-sm transition-colors">
              トレーナーとして無料登録
            </Link>
            <Link href="/trainer/register?type=individual" className="block w-full bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold py-4 rounded-2xl text-sm transition-colors">
              個人として無料登録
            </Link>
          </div>
        </div>
      </section>

      {/* ── フッター ── */}
      <footer className="border-t border-white/10 px-5 py-6 text-center text-[10px] text-slate-600 mt-auto">
        © 2026 AllYourFit · 合同会社みらいど
      </footer>
    </main>
  );
}
