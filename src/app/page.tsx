import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#0a0a0f]">
      <div className="text-center space-y-5 max-w-sm">

        {/* ロゴ */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-900/50">
            <span className="text-black text-2xl font-black leading-none">A</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AllYourFit</h1>
        </div>

        <p className="text-gray-500 text-sm leading-relaxed">
          トレーナーから共有されたURLからアクセスしてください。
        </p>

        <div className="pt-2 border-t border-white/5">
          <p className="text-xs text-gray-700">
            トレーナーの方は{" "}
            <Link href="/trainer" className="text-emerald-500 hover:text-emerald-400 transition-colors underline">
              管理画面
            </Link>{" "}
            へ
          </p>
        </div>
      </div>
    </main>
  );
}
