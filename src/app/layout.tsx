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
  appleWebApp: {
    capable: true,
    title: "RWSA Juri",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  robots: { index: false, follow: false },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/ticon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1a1917",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${cinzel.variable}`} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
