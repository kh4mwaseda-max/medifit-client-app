import Link from "next/link";
import Logo from "@/components/Logo";

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
          ローンチ期間 — 無料で使える
        </span>

        <h1 className="text-3xl sm:text-4xl font-black leading-tight tracking-tight mb-5">
          クライアントの食事もトレーニングも、<br />
          <span className="text-blue-400">ひとつの画面で管理する。</span>
        </h1>

        <p className="text-slate-400 text-sm leading-relaxed mb-4 max-w-sm">
          クライアントがあすけん・筋トレMemoのスクショをLINEに送るだけ。
          AIが自動解析してダッシュボードに反映。翌朝サマリーが届く。
        </p>

        <div className="flex flex-wrap justify-center gap-1.5 mb-10">
          {APPS.map(app => (
            <span key={app} className="text-[10px] text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">{app}</span>
          ))}
        </div>

        <div className="w-full max-w-sm">
          <Link
            href="/trainer/register"
            className="flex items-center justify-center w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-4 px-5 rounded-2xl text-sm transition-colors"
          >
            無料でトレーナー登録する →
          </Link>
        </div>
        <p className="text-[10px] text-slate-600 mt-4">クレジットカード不要 · 30秒で登録完了</p>
      </section>

      {/* ── 課題提示 ── */}
      <section className="px-5 py-14 border-t border-white/10">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest mb-8">こんな悩み、ありませんか？</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              "クライアントの食事報告をLINEで受けて目視チェック",
              "体重の報告も個人LINEでバラバラに受け取り",
              "Excelに手打ちして毎週レポートを手動作成",
              "クライアントが10人を超えると管理が破綻する",
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <span className="text-rose-400 flex-none mt-0.5 text-xs">✗</span>
                <span className="text-xs text-slate-400">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Client Fitで解決 ── */}
      <section className="px-5 py-14 border-t border-white/10">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Client Fit なら</p>
          <p className="text-center text-lg font-black text-white mb-8">クライアント管理を自動化する</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              "クライアントはスクショをLINEに送るだけ。手入力ゼロ",
              "AIが食事・トレーニング・体重を自動でダッシュボードに記録",
              "翌朝、1日のサマリーがトレーナーに届く",
              "コメント＆ポイントをワンタップでクライアントのLINEに送信",
              "推移グラフ・トレンド分析をデータベースでいつでも確認",
              "まとめレポートもボタン1つでLINE送信",
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3">
                <span className="text-blue-400 flex-none mt-0.5 text-xs">✓</span>
                <span className="text-xs text-slate-300">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 使い方 ── */}
      <section className="px-5 py-14 border-t border-white/10">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest mb-10">使い方</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "01", icon: "📸", title: "クライアントがスクショを送る", desc: "あすけん・筋トレMemo等のスクショをClient Fit公式LINEに送るだけ。クライアントの操作はこれだけ。" },
              { step: "02", icon: "⚡", title: "AIが自動解析・翌朝通知", desc: "Claude AIがスクショを読み取り、ダッシュボードに自動記録。翌朝のサマリーでまとめて確認。" },
              { step: "03", icon: "📊", title: "コメント＆レポートを送信", desc: "推移グラフを見ながらコメント。まとめレポートもボタン1つでクライアントのLINEに届く。" },
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

      {/* ── 価格 ── */}
      <section className="px-5 py-14 border-t border-white/10">
        <div className="max-w-md mx-auto text-center">
          <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">料金</p>
          <p className="text-lg font-black text-white mb-6">他社の数分の1の価格で始められる</p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">エントリープラン</p>
              <p className="text-3xl font-black text-white">¥0<span className="text-sm font-normal text-slate-500">/月</span></p>
              <p className="text-xs text-slate-400 mt-1">クライアント管理の基本機能すべて</p>
            </div>
            <div className="border-t border-white/10 pt-4">
              <p className="text-xs text-slate-500 mb-1">追加機能（今後）</p>
              <p className="text-lg font-bold text-white">数百円<span className="text-sm font-normal text-slate-500">/月</span></p>
              <p className="text-xs text-slate-400 mt-1">AI詳細分析・高度なレポート機能など</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-600 mt-3">Gymzやあすけん法人プランの数分の1。個人トレーナーでも気軽に導入できます。</p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-5 py-16 border-t border-white/10">
        <div className="max-w-sm mx-auto text-center space-y-5">
          <h2 className="text-xl font-black text-white">クライアント管理を、もっと簡単に</h2>
          <p className="text-xs text-slate-500">クレジットカード不要。30秒で登録完了。</p>
          <Link href="/trainer/register" className="block w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-4 rounded-2xl text-sm transition-colors">
            無料でトレーナー登録する →
          </Link>
        </div>
      </section>

      {/* ── フッター ── */}
      <footer className="border-t border-white/10 px-5 py-6 text-center text-[10px] text-slate-600 mt-auto">
        © 2026 Client Fit · 合同会社みらいど
      </footer>
    </main>
  );
}
