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

    let onControllerChange: (() => void) | undefined;
    let onVisibilityChange: (() => void) | undefined;

    if ("serviceWorker" in navigator) {
      // Hanya daftarkan di HTTPS atau localhost
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      const isHttps = window.location.protocol === "https:";

      if (isHttps || isLocalhost) {
        const hadController = Boolean(navigator.serviceWorker.controller);
        let refreshing = false;

        // Jika Service Worker baru mengambil alih (update), reload halaman otomatis
        onControllerChange = () => {
          if (!hadController || refreshing) return;
          refreshing = true;
          window.location.reload();
        };
        navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

        navigator.serviceWorker
          .register("/sw.js", { scope: "/", updateViaCache: "none" })
          .then((reg) => {
            reg.update().catch(() => {});
            onVisibilityChange = () => {
              if (document.visibilityState === "visible") {
                reg.update().catch(() => {});
              }
            };
            document.addEventListener("visibilitychange", onVisibilityChange);
          })
          .catch((err) => {
            console.warn("Gagal mendaftarkan Service Worker:", err);
          });
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      if (onControllerChange && "serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      }
      if (onVisibilityChange) {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
    };
  }, []);

  return null;
}
