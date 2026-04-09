import Link from "next/link";
import Logo from "@/components/Logo";

export default function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col">

      {/* ── ナビ ── */}
      <nav className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
        <Logo size="sm" variant="full" />
        <div className="flex items-center gap-3">
          <Link href="/trainer/login" className="text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors">
            ログイン
          </Link>
          <Link href="/trainer/register" className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-blue-100">
            無料で始める
          </Link>
        </div>
      </nav>

      {/* ── ヒーロー ── */}
      <section className="flex-1 flex flex-col items-center justify-center px-5 py-16 text-center max-w-2xl mx-auto">
        <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 tracking-widest uppercase mb-6">
          Trainer × Data × AI
        </span>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight tracking-tight mb-4">
          クライアントの全フィットネスデータを<br />
          <span className="text-blue-600">一画面で管理する。</span>
        </h1>

        <p className="text-slate-500 text-sm leading-relaxed mb-8 max-w-md">
          LINEにスクショを送るだけで体重・食事・トレーニングが自動記録。<br />
          AIがデータを分析し、トレーナーの指導を強化します。
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <Link
            href="/trainer/register"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-colors shadow-lg shadow-blue-100 text-center"
          >
            無料で始める
          </Link>
          <Link
            href={`/client/19d81742-4039-4859-aa82-a7380017ba0e`}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl text-sm transition-colors text-center"
          >
            デモを見る
          </Link>
        </div>
        <p className="text-[10px] text-slate-400 mt-3">クレジットカード不要 · 30秒で登録完了</p>
      </section>

      {/* ── 機能3つ ── */}
      <section className="border-t border-slate-100 bg-slate-50 px-5 py-12">
        <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: "📸", title: "LINEで自動記録", desc: "あすけん・筋トレメモ・タニタ等のスクショをLINEに送るだけ。手入力不要。" },
            { icon: "📊", title: "データ一元管理", desc: "体重・体脂肪・筋肉量・食事PFC・トレーニングボリュームを1画面に集約。" },
            { icon: "✦",  title: "AIがアドバイス", desc: "Claudeがデータを分析し、食事改善・トレーニング提案・リスク評価を自動生成。" },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="text-center space-y-2">
              <div className="text-3xl">{icon}</div>
              <p className="text-sm font-bold text-slate-700">{title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── プラン比較 ── */}
      <section className="px-5 py-12">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">プラン</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Free */}
            <div className="border border-slate-200 rounded-2xl p-6 space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-500">Free</p>
                <p className="text-3xl font-black text-slate-800 mt-1">¥0<span className="text-sm font-normal text-slate-400">/月</span></p>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                {["自分1人のデータ管理","LINEスクショ自動記録（月50回）","AI解析（月5回）","ダッシュボード閲覧"].map(f => (
                  <li key={f} className="flex items-center gap-2"><span className="text-teal-500 font-bold">✓</span>{f}</li>
                ))}
              </ul>
              <Link href="/trainer/register" className="block text-center text-xs font-bold text-blue-600 border border-blue-200 hover:bg-blue-50 py-2.5 rounded-xl transition-colors">
                無料で始める
              </Link>
            </div>

            {/* Pro */}
            <div className="border-2 border-blue-600 rounded-2xl p-6 space-y-4 relative overflow-hidden">
              <div className="absolute top-3 right-3 text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full">人気</div>
              <div>
                <p className="text-xs font-bold text-blue-600">Pro</p>
                <p className="text-3xl font-black text-slate-800 mt-1">¥2,980<span className="text-sm font-normal text-slate-400">/月</span></p>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                {[
                  "クライアント最大10名",
                  "LINEスクショ無制限",
                  "AI解析無制限",
                  "週次・月次レポート自動生成",
                  "LINEでレポート送信",
                  "自分専用LINEアカウント連携",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2"><span className="text-blue-500 font-bold">✓</span>{f}</li>
                ))}
              </ul>
              <Link href="/trainer/register" className="block text-center text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl transition-colors shadow-sm shadow-blue-100">
                Proで始める（14日無料）
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── フッター ── */}
      <footer className="border-t border-slate-100 px-5 py-6 text-center text-[10px] text-slate-400">
        © 2026 AllYourFit · 合同会社みらいど
      </footer>
    </main>
  );
}
