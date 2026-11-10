import type { Metadata, Viewport } from "next";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/PwaRegister";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", display: "swap" });

export const metadata: Metadata = {
  title: { default: "RWSA 2026 · Penjurian", template: "%s · RWSA 2026" },
  description: "Aplikasi penjurian MBtech Riding With Style Awards 2026",
  applicationName: "RWSA Penjurian",
  appleWebApp: { capable: true, title: "RWSA Juri", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  robots: { index: false, follow: false },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1a1917",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${cinzel.variable}`}>
      <body className="antialiased">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
