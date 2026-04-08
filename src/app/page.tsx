import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50">
      <div className="text-center space-y-6 max-w-sm">

        {/* ロゴ */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-18 h-18 w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center shadow-xl shadow-blue-200">
            <span className="text-white text-3xl font-black leading-none">A</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">AllYourFit</h1>
            <p className="text-xs text-slate-400 mt-1 tracking-wide">Personal Health Intelligence</p>
          </div>
        </div>

        <p className="text-slate-500 text-sm leading-relaxed">
          トレーナーから共有されたURLからアクセスしてください。
        </p>

        <div className="pt-2 border-t border-slate-200">
          <p className="text-xs text-slate-400">
            トレーナーの方は{" "}
            <Link href="/trainer" className="text-blue-500 hover:text-blue-700 transition-colors underline font-medium">
              管理画面
            </Link>{" "}
            へ
          </p>
        </div>
      </div>
    </main>
  );
}
