"use client";

import Link from "next/link";
import { Logo, Button, Icon } from "@/components/cf/primitives";

const LINE_FRIEND_URL =
  process.env.NEXT_PUBLIC_LINE_FRIEND_URL ?? "https://line.me/ti/p/@293ziugt";

export default function TrainerLoginPage() {
  return (
    <main className="min-h-screen bg-ink-50 flex flex-col">
      <header className="h-16 bg-white border-b border-ink-200 flex items-center px-5 sm:px-8">
        <Logo />
      </header>

      <div className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-black text-ink-800 tracking-tight">
              ログイン
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              Client Fit トレーナー管理画面へ
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-ink-200/70 p-6 space-y-5">
            <div className="text-center">
              <div className="inline-flex w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 items-center justify-center mb-3">
                <Icon name="message-circle" size={28} />
              </div>
              <p className="text-base font-bold text-ink-800">
                公式LINEからワンタイムログイン
              </p>
              <p className="text-xs text-ink-500 mt-1 leading-relaxed">
                Client Fit 公式LINE に「ログイン」と送信すると
                <br />
                ログインリンクが届きます
              </p>
            </div>

            <div className="bg-ink-50 border border-ink-200 rounded-xl py-3 px-4 text-center">
              <p className="text-[10px] text-ink-500 uppercase tracking-widest mb-1">
                LINEに送る文言
              </p>
              <p className="text-2xl font-black text-ink-800 tracking-[0.3em] font-mono">
                ログイン
              </p>
            </div>

            <a
              href={LINE_FRIEND_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full h-12 bg-[#06C755] hover:brightness-110 text-white font-bold rounded-xl text-sm transition shadow-[0_8px_20px_-8px_rgba(6,199,85,0.6)]"
            >
              <Icon name="message-circle" />
              Client Fit 公式LINEを開く
            </a>

            <div className="flex items-center gap-3 text-[11px] text-ink-400">
              <div className="flex-1 h-px bg-ink-200" />
              <span>セキュリティ</span>
              <div className="flex-1 h-px bg-ink-200" />
            </div>

            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
              <Icon name="info" className="text-amber-600 mt-0.5" />
              <p className="text-[11px] text-amber-800 leading-relaxed">
                5回連続で失敗した場合、15分間ログインできなくなります。
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-ink-500">
            アカウント未登録の方は{" "}
            <Link
              href="/trainer/register"
              className="text-brand-600 hover:text-brand-700 font-semibold underline underline-offset-2"
            >
              新規登録
            </Link>
          </p>

          <div className="text-center">
            <Link
              href="/"
              className="text-[11px] text-ink-400 hover:text-ink-600 inline-flex items-center gap-1"
            >
              <Icon name="chevron-left" />
              トップに戻る
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
