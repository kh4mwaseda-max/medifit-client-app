import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Client Fit | トレーナー向けクライアント管理",
  description: "クライアントの食事もトレーニングも、ひとつの画面で管理する。スクショをLINEに送るだけ。AIが自動解析。",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Client Fit | トレーナー向けクライアント管理",
    description: "クライアントの食事もトレーニングも、ひとつの画面で管理する。スクショをLINEに送るだけ。",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Client Fit | トレーナー向けクライアント管理",
    description: "クライアントの食事もトレーニングも、ひとつの画面で管理する。",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-950 text-gray-100 antialiased">{children}</body>
    </html>
  );
}
