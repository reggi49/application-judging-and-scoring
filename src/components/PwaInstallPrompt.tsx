"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Cek apakah sudah berjalan di mode terpasang (PWA Standalone)
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true);
    setIsStandalone(Boolean(standalone));

    // Deteksi apakah perangkat adalah iPhone/iPad (iOS)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  // Jika sudah terpasang di HP, jangan tampilkan tombol pasang
  if (isStandalone) return null;

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIos) {
        setShowIosGuide(true);
      } else {
        alert(
          "Untuk memasang di HP Android:\n1. Buka menu browser (titik 3 di kanan atas)\n2. Pilih 'Tambahkan ke Layar Utama' atau 'Install Aplikasi'."
        );
      }
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  return (
    <>
      <div className="mt-4 rounded-xl border border-gold/40 bg-gradient-to-r from-gold/15 via-panel2 to-gold/15 p-3 text-center shadow-md">
        <p className="text-xs font-semibold text-[#ded7c8] mb-2">
          Gunakan aplikasi lebih nyaman di smartphone Anda:
        </p>

        {deferredPrompt ? (
          <button
            type="button"
            onClick={handleInstallClick}
            className="btn btn-gold w-full text-sm font-black py-2.5 shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <span className="text-lg">📲</span>
            <span>Pasang Aplikasi di HP (1-Klik)</span>
          </button>
        ) : isIos ? (
          <button
            type="button"
            onClick={() => setShowIosGuide(true)}
            className="btn btn-gold w-full text-xs font-black py-2 shadow flex items-center justify-center gap-1.5"
          >
            <span>🍏</span>
            <span>Pasang di iPhone / iPad</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleInstallClick}
            className="btn btn-ghost w-full text-xs font-bold py-2 border border-gold/50 text-gold-light hover:bg-gold hover:text-ink transition-colors flex items-center justify-center gap-1.5"
          >
            <span>📱</span>
            <span>Pasang di Layar Utama HP</span>
          </button>
        )}
      </div>

      {/* Modal Panduan Khusus iOS (iPhone / iPad) */}
      {showIosGuide && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setShowIosGuide(false)}
        >
          <div
            className="card max-w-sm w-full p-5 text-center space-y-4 border-2 border-gold shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-3xl">🍏</div>
            <h3 className="font-title text-lg font-black text-gold-light">
              Cara Pasang di iPhone / iPad
            </h3>
            <div className="text-left text-xs text-[#ded7c8] space-y-2.5 bg-panel2 p-3.5 rounded-lg border border-line">
              <p className="flex items-start gap-2">
                <span className="font-bold text-gold-light">1.</span>
                <span>
                  Tekan tombol <strong>Bagikan</strong> (ikon kotak dengan panah ke atas <strong className="text-white">⬆</strong>) di bilah bawah browser Safari.
                </span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-bold text-gold-light">2.</span>
                <span>
                  Geser ke bawah lalu pilih menu <strong>&quot;Tambah ke Layar Utama&quot;</strong> (<em>Add to Home Screen</em>).
                </span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-bold text-gold-light">3.</span>
                <span>
                  Tekan <strong>&quot;Tambah&quot;</strong> di pojok kanan atas. Ikon aplikasi langsung muncul di layar utama iPhone Anda!
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="btn btn-gold w-full text-xs font-bold py-2"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}

