import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "medifit | あなたの進捗レポート",
  description: "パーソナルトレーナーからの進捗レポート",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-950 text-gray-100 antialiased">{children}</body>
    </html>
  );
}
