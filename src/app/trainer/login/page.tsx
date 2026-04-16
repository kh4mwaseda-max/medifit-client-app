"use client";

import Logo from "@/components/Logo";
import Link from "next/link";

const LINE_FRIEND_URL = process.env.NEXT_PUBLIC_LINE_FRIEND_URL ?? "https://line.me/ti/p/@293ziugt";

export default function TrainerLogin() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <Logo size="lg" variant="mark" />
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Client Fit</h1>
            <p className="mt-1 text-sm text-slate-500">ログイン</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-5">
          <div className="text-center space-y-2">
            <p className="text-2xl">📱</p>
            <p className="text-sm font-bold text-slate-800">Client Fit公式LINEからログイン</p>
            <p className="text-xs text-slate-500">
              Client Fit公式LINEに<span className="font-bold text-slate-700">「ログイン」</span>と送ると<br />
              ワンタイムログインリンクが届きます
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-400 mb-1">LINEに送る文言</p>
            <p className="text-xl font-black text-slate-800 tracking-widest">ログイン</p>
          </div>

          <a
            href={LINE_FRIEND_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl text-sm transition-colors"
          >
            📱 Client Fit公式LINEを開く
          </a>
        </div>

        <p className="text-center text-xs text-slate-400">
          アカウントをお持ちでない方は{" "}
          <Link href="/trainer/register" className="text-blue-500 hover:underline">
            新規登録
          </Link>
        </p>
      </div>
    </main>
  );
}
