import Link from "next/link";
import Logo from "@/components/Logo";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50">
      <div className="text-center space-y-6 max-w-sm">

        {/* ロゴ */}
        <div className="flex flex-col items-center gap-4">
          <Logo size="xl" variant="full" />
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
