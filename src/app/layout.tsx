import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AllYourFit | あなたの進捗レポート",
  description: "パーソナルトレーナーからの進捗レポート",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-950 text-gray-100 antialiased">{children}</body>
    </html>
  );
}
