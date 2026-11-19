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
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [isHttpInsecure, setIsHttpInsecure] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Cek apakah sudah berjalan di mode terpasang (PWA Standalone)
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true);
    setIsStandalone(Boolean(standalone));

    // Deteksi protokol HTTP non-secure
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (window.location.protocol === "http:" && !isLocal) {
      setIsHttpInsecure(true);
    }

    // Deteksi iOS (iPhone, iPod, iPad)
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIos(isIosDevice);

    // Deteksi In-App Browser (WhatsApp, Instagram, FB, Line, Telegram)
    const inApp = /fban|fbav|instagram|line|micromessenger|telegram|whatsapp/i.test(ua);
    setIsInAppBrowser(inApp);

    // Periksa apakah prompt sudah ditangkap sebelumnya
    if (window.__deferredPwaPrompt) {
      setDeferredPrompt(window.__deferredPwaPrompt);
    }

    const onPromptReady = () => {
      if (window.__deferredPwaPrompt) {
        setDeferredPrompt(window.__deferredPwaPrompt);
      }
    };

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("pwa-prompt-ready", onPromptReady);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("pwa-prompt-ready", onPromptReady);
    };
  }, []);

  // Jika sudah terpasang di HP, jangan tampilkan tombol pasang
  if (isStandalone) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setDeferredPrompt(null);
          return;
        }
      } catch {
        // Fallback ke petunjuk bila prompt gagal
      }
    }
    // Jika tidak ada deferredPrompt (misal iOS atau Android tanpa auto-prompt), tampilkan modal panduan
    setShowGuide(true);
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
        ) : (
          <button
            type="button"
            onClick={() => setShowGuide(true)}
            className="btn btn-ghost w-full text-xs font-bold py-2 border border-gold/60 text-gold-light hover:bg-gold hover:text-ink transition-colors flex items-center justify-center gap-1.5 shadow"
          >
            <span>{isIos ? "🍏" : "📱"}</span>
            <span>{isIos ? "Pasang di iPhone / iPad" : "Panduan Pasang di HP (Android / Pixel)"}</span>
          </button>
        )}

        {isHttpInsecure && !deferredPrompt && (
          <p className="text-[10px] text-gold-light/75 mt-1.5 leading-tight">
            💡 <em>Untuk tombol 1-Klik otomatis, Chrome mewajibkan akses HTTPS (SSL).</em>
          </p>
        )}
      </div>

      {/* Modal Panduan Pasang PWA */}
      {showGuide && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="card max-w-sm w-full p-5 text-center space-y-4 border-2 border-gold shadow-2xl overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-3xl">{isIos ? "🍏" : "📱"}</div>
            <h3 className="font-title text-base font-black text-gold-light">
              {isIos ? "Cara Pasang di iPhone / iPad" : "Cara Pasang di Android (Google Pixel / Lainnya)"}
            </h3>

            {isInAppBrowser && (
              <div className="bg-danger/15 border border-danger/40 rounded-lg p-2.5 text-xs text-danger text-left">
                ⚠️ <strong>Browser In-App Terdeteksi:</strong> Buka tautan ini di browser utama (<strong>{isIos ? "Safari" : "Google Chrome"}</strong>) dengan menekan titik 3 lalu &quot;Buka di Browser&quot;.
              </div>
            )}

            {isIos ? (
              <div className="text-left text-xs text-[#ded7c8] space-y-2.5 bg-panel2 p-3.5 rounded-lg border border-line">
                <p className="flex items-start gap-2">
                  <span className="font-bold text-gold-light">1.</span>
                  <span>
                    Pastikan dibuka menggunakan <strong>Safari</strong> (bukan Chrome atau browser dalam WhatsApp).
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-gold-light">2.</span>
                  <span>
                    Tekan tombol <strong>Bagikan / Share</strong> (ikon kotak dengan panah ke atas <strong className="text-white">⬆</strong>) di bilah bawah Safari.
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-gold-light">3.</span>
                  <span>
                    Gulir ke bawah pada menu, lalu pilih <strong>&quot;Tambah ke Layar Utama&quot;</strong> (<em>Add to Home Screen</em>).
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-gold-light">4.</span>
                  <span>
                    Tekan <strong>&quot;Tambah&quot;</strong> di pojok kanan atas. Ikon aplikasi RWSA langsung muncul di layar utama!
                  </span>
                </p>
              </div>
            ) : (
              <div className="text-left text-xs text-[#ded7c8] space-y-2.5 bg-panel2 p-3.5 rounded-lg border border-line">
                <p className="flex items-start gap-2">
                  <span className="font-bold text-gold-light">1.</span>
                  <span>
                    Pastikan dibuka di browser <strong>Google Chrome</strong>.
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-gold-light">2.</span>
                  <span>
                    Tekan ikon <strong>Titik Tiga (⋮)</strong> di pojok kanan atas Chrome.
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-gold-light">3.</span>
                  <span>
                    Pilih menu <strong>&quot;Instal aplikasi&quot;</strong> atau <strong>&quot;Tambahkan ke Layar Utama&quot;</strong>.
                    <br />
                    <span className="text-[11px] text-[#bdae93]">
                      *(Pada beberapa versi Chrome di Google Pixel, menu ini ada di dalam <strong>&quot;Simpan dan bagikan&quot;</strong>)*
                    </span>
                  </span>
                </p>
                {isHttpInsecure && (
                  <div className="mt-2 p-2 rounded bg-gold/10 border border-gold/30 text-[11px] text-gold-light">
                    🔒 <strong>Catatan Teknis:</strong> Jika menu &quot;Instal aplikasi&quot; belum ada, pastikan server diakses via <strong>HTTPS (SSL)</strong>. Google Chrome mewajibkan protokol HTTPS agar fitur instalasi aplikasi aktif penuh.
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
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
