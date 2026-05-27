import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-sans-jp",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Payment Intelligence Agent",
  description:
    "AI Revenue Ops Desk for subscription payment failures — Microsoft Agent Hackathon 2026 prototype.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`}>
      <body className="font-sans">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl px-5 md:px-8 pb-24 pt-6">
          {children}
        </main>
        <footer className="mx-auto w-full max-w-6xl px-5 md:px-8 py-10 text-xs text-moss-200/60 border-t border-gold-500/10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              Payment Intelligence Agent · Microsoft Agent Hackathon 2026 Prototype
            </span>
            <span>
              本プロトタイプは決済処理・リトライ実行・顧客への自動送信を行いません。
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
