"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __deferredPwaPrompt?: any;
  }
}

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Tangkap beforeinstallprompt sesegera mungkin di window
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      window.__deferredPwaPrompt = e;
      window.dispatchEvent(new CustomEvent("pwa-prompt-ready"));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV !== "production") {
        // Di mode development, bersihkan Service Worker & cache lama agar chunk HMR selalu segar
        navigator.serviceWorker
          .getRegistrations()
          .then((regs) => Promise.all(regs.map((r) => r.unregister())))
          .catch(() => {});
        if ("caches" in window) {
          caches
            .keys()
            .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
            .catch(() => {});
        }
      } else {
        // Di mode production, daftarkan Service Worker pada HTTPS atau localhost
        const isLocalhost =
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1";
        const isHttps = window.location.protocol === "https:";

        if (isHttps || isLocalhost) {
          navigator.serviceWorker
            .register("/sw.js", { scope: "/", updateViaCache: "none" })
            .catch((err) => {
              console.warn("Gagal mendaftarkan Service Worker:", err);
            });
        }
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  return null;
}
