"use client";

import { useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __deferredPwaPrompt?: BeforeInstallPromptEvent;
  }
}

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Tangkap beforeinstallprompt sesegera mungkin di window
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      window.__deferredPwaPrompt = e as BeforeInstallPromptEvent;
      window.dispatchEvent(new CustomEvent("pwa-prompt-ready"));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    if ("serviceWorker" in navigator) {
      // Hanya daftarkan di HTTPS atau localhost
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

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  return null;
}
