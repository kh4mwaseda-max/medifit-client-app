import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-3xl font-bold tracking-tight">medifit</h1>
        <p className="text-gray-400">トレーナーから共有されたURLからアクセスしてください。</p>
        <p className="text-sm text-gray-600">
          トレーナーの方は{" "}
          <Link href="/trainer" className="text-green-400 underline">
            管理画面
          </Link>{" "}
          へ
        </p>
      </div>
    </main>
  );
}
