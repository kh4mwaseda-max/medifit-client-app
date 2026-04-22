import Link from "next/link";
import Logo from "@/components/Logo";

const APPS = ["あすけん", "筋トレMemo", "STRONG", "タニタ", "FiNC", "カロミル"];

export default function Home() {
  return (
    <main className="min-h-screen bg-ink-900 flex flex-col text-white">

      {/* ── ナビ ── */}
      <nav className="px-5 py-4 flex items-center justify-between border-b border-white/10 sticky top-0 bg-ink-900/80 backdrop-blur-md z-20">
        <Logo size="sm" variant="full" theme="dark" />
        <div className="flex items-center gap-3">
          <Link href="/trainer/login" className="text-xs text-ink-300 hover:text-white font-semibold transition-colors">
            ログイン
          </Link>
          <Link href="/trainer/register" className="text-xs bg-brand-500 hover:bg-brand-400 text-white font-bold px-4 py-2 rounded-xl transition-colors shadow-glow">
            無料で始める
          </Link>
        </div>
      </nav>

      {/* ── ヒーロー ── */}
      <section className="flex flex-col items-center justify-center px-5 pt-20 pb-16 text-center max-w-2xl mx-auto w-full">
        <span className="text-[11px] font-bold text-brand-300 bg-brand-500/10 border border-brand-500/30 px-3 py-1 rounded-full tracking-widest uppercase mb-6">
          パーソナルトレーナー向け · ローンチ期間 無料
        </span>

        <h1 className="text-3xl sm:text-4xl font-black leading-tight tracking-tight mb-5">
          クライアントの食事もトレーニングも、<br />
          <span className="bg-clip-text text-transparent bg-grad-brand">ひとつの画面で管理する。</span>
        </h1>

        <p className="text-ink-300 text-sm leading-relaxed mb-4 max-w-sm">
          クライアントがあすけん・筋トレMemoのスクショをLINEに送るだけ。
          AIが自動解析してダッシュボードに反映。翌朝サマリーが届く。
        </p>

        <div className="flex flex-wrap justify-center gap-1.5 mb-10">
          {APPS.map(app => (
            <span key={app} className="text-[10px] text-ink-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">{app}</span>
          ))}
        </div>

        {/* ミニ実績バー */}
        <div className="flex items-center justify-center gap-6 mb-10 flex-wrap">
          {[
            { val: "¥0", label: "エントリー費" },
            { val: "30秒", label: "登録時間" },
            { val: "6+", label: "対応アプリ" },
          ].map(({ val, label }) => (
            <div key={label} className="text-center">
              <p className="text-xl font-black text-white font-mono tracking-tight">{val}</p>
              <p className="text-[10px] text-ink-400">{label}</p>
            </div>
          ))}
        </div>

        <div className="w-full max-w-sm">
          <Link
            href="/trainer/register"
            className="flex items-center justify-center w-full bg-grad-brand hover:opacity-90 text-white font-bold py-4 px-5 rounded-2xl text-sm transition-opacity shadow-pop"
          >
            今すぐ無料でトレーナー登録する →
          </Link>
        </div>
        <p className="text-[10px] text-ink-400 mt-4">クレジットカード不要 · 登録30秒 · いつでも解約可</p>
      </section>

      {/* ── 課題提示 ── */}
      <section className="px-5 py-14 border-t border-white/10">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-xs font-bold text-ink-400 uppercase tracking-widest mb-8">こんな悩み、ありませんか？</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              "クライアントの食事報告をLINEで受けて目視チェック",
              "体重の報告も個人LINEでバラバラに受け取り",
              "Excelに手打ちして毎週レポートを手動作成",
              "クライアントが10人を超えると管理が破綻する",
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <span className="text-red-400 flex-none mt-0.5 text-xs">✗</span>
                <span className="text-xs text-ink-300">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Client Fitで解決 ── */}
      <section className="px-5 py-14 border-t border-white/10">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-xs font-bold text-brand-300 uppercase tracking-widest mb-2">Client Fit なら</p>
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
              <div key={i} className="flex items-start gap-2 bg-brand-500/10 border border-brand-500/30 rounded-xl px-4 py-3">
                <span className="text-brand-300 flex-none mt-0.5 text-xs">✓</span>
                <span className="text-xs text-ink-200">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 使い方 ── */}
      <section className="px-5 py-14 border-t border-white/10">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-xs font-bold text-ink-400 uppercase tracking-widest mb-10">使い方</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "01", icon: "📸", title: "クライアントがスクショを送る", desc: "あすけん・筋トレMemo等のスクショをClient Fit公式LINEに送るだけ。クライアントの操作はこれだけ。" },
              { step: "02", icon: "⚡", title: "AIが自動解析・翌朝通知", desc: "Claude AIがスクショを読み取り、ダッシュボードに自動記録。翌朝のサマリーでまとめて確認。" },
              { step: "03", icon: "📊", title: "コメント＆レポートを送信", desc: "推移グラフを見ながらコメント。まとめレポートもボタン1つでクライアントのLINEに届く。" },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-brand-300 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded-full">{step}</span>
                  <span className="text-2xl">{icon}</span>
                </div>
                <p className="text-sm font-bold text-white">{title}</p>
                <p className="text-xs text-ink-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 価格 ── */}
      <section className="px-5 py-14 border-t border-white/10">
        <div className="max-w-md mx-auto text-center">
          <p className="text-center text-xs font-bold text-ink-400 uppercase tracking-widest mb-2">料金</p>
          <p className="text-lg font-black text-white mb-6">他社の数分の1の価格で始められる</p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <div>
              <p className="text-xs text-ink-400 mb-1">エントリープラン</p>
              <p className="text-3xl font-black text-white">¥0<span className="text-sm font-normal text-ink-400">/月</span></p>
              <p className="text-xs text-ink-300 mt-1">クライアント管理の基本機能すべて</p>
            </div>
            <div className="border-t border-white/10 pt-4">
              <p className="text-xs text-ink-400 mb-1">追加機能（今後）</p>
              <p className="text-lg font-bold text-white">数百円<span className="text-sm font-normal text-ink-400">/月</span></p>
              <p className="text-xs text-ink-300 mt-1">AI詳細分析・高度なレポート機能など</p>
            </div>
          </div>
          <p className="text-[10px] text-ink-500 mt-3">Gymzやあすけん法人プランの数分の1。個人トレーナーでも気軽に導入できます。</p>
        </div>
      </section>

      {/* ── 競合比較 ── */}
      <section className="px-5 py-14 border-t border-white/10">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-xs font-bold text-ink-400 uppercase tracking-widest mb-2">比較</p>
          <p className="text-center text-lg font-black text-white mb-8">他のツールとの違い</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-ink-400 font-medium pb-3 pr-4 w-2/5">機能</th>
                  <th className="text-center pb-3 px-2 w-1/5">
                    <span className="text-brand-300 font-black">Client Fit</span>
                  </th>
                  <th className="text-center pb-3 px-2 w-1/5 text-ink-400 font-medium">Gymz</th>
                  <th className="text-center pb-3 px-2 w-1/5 text-ink-400 font-medium">Trainerize</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ["月額料金",               "¥0〜",    "¥3,000〜", "$19.99〜"],
                  ["LINEスクショ自動解析",   "✓",       "✗",        "✗"       ],
                  ["食事×体重相関分析",      "✓",       "✗",        "✗"       ],
                  ["翌朝サマリー自動配信",   "✓",       "✗",        "△"       ],
                  ["日本語対応",             "✓",       "△",        "✗"       ],
                  ["クライアント招待リンク", "✓",       "✓",        "✓"       ],
                  ["AIレポート生成",         "✓",       "✗",        "△"       ],
                ].map(([feat, cf, gymz, trainerize]) => (
                  <tr key={feat}>
                    <td className="py-3 pr-4 text-ink-400">{feat}</td>
                    <td className="py-3 px-2 text-center font-bold text-brand-300">{cf}</td>
                    <td className="py-3 px-2 text-center text-ink-400">{gymz}</td>
                    <td className="py-3 px-2 text-center text-ink-400">{trainerize}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── よくある質問 ── */}
      <section className="px-5 py-14 border-t border-white/10">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-xs font-bold text-ink-400 uppercase tracking-widest mb-2">FAQ</p>
          <p className="text-center text-lg font-black text-white mb-8">よくある質問</p>
          <div className="space-y-3">
            {[
              {
                q: "本当に無料ですか？",
                a: "エントリープランは無料です。クレジットカード不要で今すぐ始められます。将来的に追加機能（AI高度分析など）を有料化する予定ですが、基本のクライアント管理機能は無料で使い続けられます。",
              },
              {
                q: "クライアントはどんなアプリのスクショを送ればいいですか？",
                a: "あすけん・筋トレMemo・STRONG・FiNC・カロミル・タニタ体組成計アプリなど主要アプリに対応しています。クライアントが現在使っているアプリをそのまま使えるので、乗り換えは不要です。",
              },
              {
                q: "LINEのアカウントは必要ですか？",
                a: "クライアントのスクショ受け取りにLINE公式アカウントを使います。トレーナー側のLINEはサマリー通知の受け取りに任意で連携できます（設定画面から）。",
              },
              {
                q: "データはどこに保存されますか？",
                a: "Supabase（PostgreSQL）で安全に管理しています。データはトレーナーとそのクライアントのみ閲覧可能です。",
              },
              {
                q: "副業トレーナーでも使えますか？",
                a: "むしろ副業・個人トレーナーに最も向いています。月額コストを抑えながら、大手ジムと同等以上のデータ管理ができます。",
              },
            ].map(({ q, a }) => (
              <details key={q} className="bg-white/5 border border-white/10 rounded-2xl group">
                <summary className="px-5 py-4 text-sm font-medium text-white cursor-pointer list-none flex items-center justify-between">
                  {q}
                  <span className="text-ink-400 text-lg leading-none select-none group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="px-5 pb-4 text-xs text-ink-300 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-5 py-16 border-t border-white/10">
        <div className="max-w-sm mx-auto text-center space-y-5">
          <h2 className="text-xl font-black text-white">今日から、クライアント管理を変える</h2>
          <p className="text-ink-400 text-xs leading-relaxed">登録30秒・クレジットカード不要・いつでも解約可</p>
          <Link href="/trainer/register" className="block w-full bg-grad-brand hover:opacity-90 text-white font-bold py-4 rounded-2xl text-sm transition-opacity shadow-pop">
            今すぐ無料でトレーナー登録する →
          </Link>
          <p className="text-[10px] text-ink-500">すでに登録済みの方は <Link href="/trainer/login" className="text-ink-400 hover:text-white underline underline-offset-2">ログイン</Link></p>
        </div>
      </section>

      {/* ── フッター ── */}
      <footer className="border-t border-white/10 px-5 py-6 text-center text-[10px] text-ink-500 mt-auto">
        © 2026 Client Fit · 合同会社みらいど
      </footer>
    </main>
  );
}
