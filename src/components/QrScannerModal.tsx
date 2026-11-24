"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export function parseKodeKaryaFromQr(text: string): string | null {
  const trimmed = text.trim();

  // 1. URL pattern: misal .../juri/karya/001 atau .../juri/karya/SKR-BLM-001
  const urlMatch = trimmed.match(/\/juri\/karya\/([A-Za-z0-9_-]{1,20})/i);
  if (urlMatch) return urlMatch[1];

  // 2. Angka langsung (misal: "1", "25", "250")
  if (/^\d{1,4}$/.test(trimmed)) {
    return trimmed.padStart(3, "0");
  }

  // 3. Format kode karya / slot langsung (misal: "001" atau "BRM-001")
  const directMatch = trimmed.match(/^[A-Za-z0-9_-]{1,20}$/);
  if (directMatch) return directMatch[0];

  return null;
}

export function QrScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (kodeKarya: string) => void;
}) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = "rwsa-qr-reader";

  useEffect(() => {
    if (!isOpen) {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {});
        }
        scannerRef.current = null;
      }
      return;
    }

    let isMounted = true;

    const startScanner = async () => {
      setErrorMsg(null);
      setScannedResult(null);

      // Delay sedikit agar DOM dialog sudah ter-render
      await new Promise((r) => setTimeout(r, 150));
      if (!isMounted) return;

      try {
        const scanner = new Html5Qrcode(readerElementId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            const parsedKode = parseKodeKaryaFromQr(decodedText);
            if (parsedKode) {
              try {
                if (navigator.vibrate) navigator.vibrate(100);
              } catch {}
              setScannedResult(parsedKode);
              if (scanner.isScanning) {
                scanner.stop().catch(() => {});
              }
              // Beri jeda sejenak untuk feedback visual sebelum berpindah
              setTimeout(() => {
                onScanSuccess(parsedKode);
              }, 400);
            } else {
              setErrorMsg(`QR terbaca ("${decodedText.slice(0, 30)}..."), tetapi bukan format ID Karya RWSA.`);
            }
          },
          () => {
            // Abaikan frame scan yang belum mendeteksi QR
          },
        );
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("NotAllowedError") || msg.includes("Permission")) {
          setErrorMsg("Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser smartphone Anda.");
        } else if (msg.includes("NotFoundError") || msg.includes("DevicesNotFoundError")) {
          setErrorMsg("Kamera tidak ditemukan pada perangkat ini.");
        } else {
          setErrorMsg("Gagal mengaktifkan kamera. Pastikan browser mendukung akses kamera.");
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {});
        }
        scannerRef.current = null;
      }
    };
  }, [isOpen, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border-2 border-gold-dark bg-panel p-5 shadow-2xl text-center">
        {/* Tombol Tutup */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 rounded-full bg-panel2 p-2 text-muted hover:text-white"
          aria-label="Tutup pemindai kamera"
        >
          ✕
        </button>

        <h3 className="font-title gold-text text-xl font-bold">Pindai QR Label Motor</h3>
        <p className="mt-1 text-xs text-[#ded7c8]">
          Arahkan kamera smartphone ke QR Code pada kartu display motor peserta.
        </p>

        {/* Viewport Kamera */}
        <div className="relative mx-auto mt-4 aspect-square w-full max-w-[280px] overflow-hidden rounded-xl border-2 border-line bg-black">
          <div id={readerElementId} className="h-full w-full" />

          {/* Bingkai Target Pemindaian Emas */}
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="relative h-48 w-48 rounded-lg border-2 border-dashed border-gold/70 shadow-[0_0_15px_rgba(243,190,77,0.3)]">
              {/* Sudut Emas */}
              <div className="absolute -left-1 -top-1 h-5 w-5 border-l-4 border-t-4 border-gold" />
              <div className="absolute -right-1 -top-1 h-5 w-5 border-r-4 border-t-4 border-gold" />
              <div className="absolute -bottom-1 -left-1 h-5 w-5 border-b-4 border-l-4 border-gold" />
              <div className="absolute -bottom-1 -right-1 h-5 w-5 border-b-4 border-r-4 border-gold" />
            </div>
          </div>

          {/* Efek Sukses Terbaca */}
          {scannedResult && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-4 text-center">
              <span className="text-3xl">✓</span>
              <p className="mt-2 text-sm font-bold text-ok">Karya Ditemukan!</p>
              <p className="font-title gold-text text-2xl font-black">{scannedResult}</p>
              <p className="mt-1 text-xs text-[#ded7c8]">Membuka lembar penilaian…</p>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="mt-3 rounded-lg border border-danger/60 bg-danger/15 p-2.5 text-xs font-semibold text-[#ffa194]">
            {errorMsg}
          </div>
        )}

        <div className="mt-4 flex justify-center">
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm font-bold">
            Batal / Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

