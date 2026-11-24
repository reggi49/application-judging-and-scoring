"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Script from "next/script";
import {
  checkWebBluetoothAvailability,
  connectNiimbotPrinter,
  disconnectNiimbotPrinter,
  printBatchViaBluetooth,
  printSingleViaBluetooth,
  refreshNiimbotStatus,
  type NiimbotConnectionSummary,
} from "@/lib/niimbot-client";

export type LabelItem = {
  id: number;
  kodeKarya: string;
};

type PresetKey = "40x30" | "50x30" | "40x60" | "50x50" | "50x60" | "50x70" | "50x80" | "custom" | "a4";
type LogoVariant = "rwsa" | "mbtech";

const PRESET_OPTIONS: Record<Exclude<PresetKey, "custom" | "a4">, { w: number; h: number; label: string }> = {
  "40x30": { w: 40, h: 30, label: "40 × 30 mm — Rol Aktif (Rotate 90°)" },
  "50x30": { w: 50, h: 30, label: "50 × 30 mm — Landscape (Rotate 90°)" },
  "40x60": { w: 40, h: 60, label: "40 × 60 mm — Portrait" },
  "50x50": { w: 50, h: 50, label: "50 × 50 mm — Kotak" },
  "50x60": { w: 50, h: 60, label: "50 × 60 mm — Portrait Sedang" },
  "50x70": { w: 50, h: 70, label: "50 × 70 mm — Portrait Tinggi" },
  "50x80": { w: 50, h: 80, label: "50 × 80 mm — Portrait Panjang" },
};

interface LabelPrintClientProps {
  items: LabelItem[];
}

export function LabelPrintClient({ items }: LabelPrintClientProps) {
  const [presetKey, setPresetKey] = useState<PresetKey>("40x30");
  const [wMm, setWMm] = useState<number>(40);
  const [hMm, setHMm] = useState<number>(30);
  const [rotate90, setRotate90] = useState<boolean>(true);
  const [logoVariant, setLogoVariant] = useState<LogoVariant>("mbtech");
  const [fromSlot, setFromSlot] = useState<string>("1");
  const [toSlot, setToSlot] = useState<string>(String(items.length || 75));
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // State Checklist Pilihan Cetak QR
  const [selectedKodes, setSelectedKodes] = useState<Set<string>>(
    () => new Set(items.map((it) => it.kodeKarya))
  );

  // State Web Bluetooth Niimbot
  const [btConn, setBtConn] = useState<NiimbotConnectionSummary | null>(null);
  const [btBusy, setBtBusy] = useState<boolean>(false);
  const [btPrintingKode, setBtPrintingKode] = useState<string | null>(null);
  const [btDensity, setBtDensity] = useState<number>(3);
  const [btOffsetX, setBtOffsetX] = useState<number>(0);
  const [btOffsetY, setBtOffsetY] = useState<string>(""); // kosong = auto (+4px pada B1 203dpi)
  const [btMessage, setBtMessage] = useState<string | null>(null);
  const [btError, setBtError] = useState<string | null>(null);
  const [btProgress, setBtProgress] = useState<{ current: number; total: number } | null>(null);
  const [btSupport, setBtSupport] = useState<{ ok: boolean; reason?: string }>({ ok: true });

  useEffect(() => {
    const t = setTimeout(() => {
      setBtSupport(checkWebBluetoothAvailability());
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const safeWMm = Math.min(120, Math.max(15, Number.isFinite(wMm) ? wMm : 40));
  const safeHMm = Math.min(150, Math.max(15, Number.isFinite(hMm) ? hMm : 30));

  const handlePresetChange = (key: PresetKey) => {
    setPresetKey(key);
    if (key !== "custom" && key !== "a4") {
      setWMm(PRESET_OPTIONS[key].w);
      setHMm(PRESET_OPTIONS[key].h);
      setRotate90(key === "40x30" || key === "50x30");
    } else if (key === "a4") {
      setRotate90(false);
    }
  };

  const applyDetectedRoll = (roll: { wMm: number; hMm: number } | null) => {
    if (!roll) return null;
    const matchKey = (Object.keys(PRESET_OPTIONS) as Array<keyof typeof PRESET_OPTIONS>).find(
      (k) => PRESET_OPTIONS[k].w === roll.wMm && PRESET_OPTIONS[k].h === roll.hMm
    );
    setPresetKey(matchKey ?? "custom");
    setWMm(roll.wMm);
    setHMm(roll.hMm);
    setRotate90(roll.wMm > roll.hMm);
    return `${roll.wMm}×${roll.hMm} mm`;
  };

  const parsedOffsetY = useMemo(() => {
    if (btOffsetY.trim() === "") return null;
    const n = parseInt(btOffsetY, 10);
    return Number.isFinite(n) ? n : null;
  }, [btOffsetY]);

  const filteredItems = useMemo(() => {
    const fromNum = parseInt(fromSlot, 10);
    const toNum = parseInt(toSlot, 10);
    return items.filter((item) => {
      const numMatch = item.kodeKarya.match(/\d+/);
      if (!numMatch) return true;
      const num = parseInt(numMatch[0], 10);
      if (!isNaN(fromNum) && num < fromNum) return false;
      if (!isNaN(toNum) && num > toNum) return false;
      return true;
    });
  }, [items, fromSlot, toSlot]);

  const selectedFilteredItems = useMemo(
    () => filteredItems.filter((item) => selectedKodes.has(item.kodeKarya)),
    [filteredItems, selectedKodes]
  );

  const toggleKode = (kode: string) => {
    setSelectedKodes((prev) => {
      const next = new Set(prev);
      if (next.has(kode)) next.delete(kode);
      else next.add(kode);
      return next;
    });
  };

  const handleCheckFiltered = () => {
    setSelectedKodes((prev) => {
      const next = new Set(prev);
      for (const it of filteredItems) next.add(it.kodeKarya);
      return next;
    });
  };

  const handleUncheckAll = () => setSelectedKodes(new Set());

  const handleQuickRange = (from: number, to: number) => {
    setFromSlot(String(from));
    setToSlot(String(to));
  };

  const handleResetRange = () => {
    setFromSlot("1");
    setToSlot(String(items.length || 75));
  };

  const nudgeOffsetX = (delta: number) => setBtOffsetX((v) => Math.max(-40, Math.min(40, v + delta)));

  const nudgeOffsetY = (delta: number) => {
    const base = parsedOffsetY ?? (btConn?.printer?.dpi === 203 || !btConn ? 4 : 0);
    setBtOffsetY(String(Math.max(-60, Math.min(80, base + delta))));
  };

  // ── Handler Web Bluetooth ──────────────────────────────────────────────────
  const handleBtConnect = async () => {
    setBtError(null);
    setBtBusy(true);
    setBtMessage("Pilih printer Niimbot pada jendela Bluetooth…");
    try {
      const info = await connectNiimbotPrinter();
      setBtConn(info);
      const detectedTxt = applyDetectedRoll(info.detectedRollMm);
      setBtMessage(
        `Terhubung ke ${info.printer.label}` + (detectedTxt ? ` • Rol terdeteksi ${detectedTxt}` : " • Siap cetak")
      );
    } catch (err) {
      setBtError(err instanceof Error ? err.message : String(err));
      setBtMessage(null);
    } finally {
      setBtBusy(false);
    }
  };

  const handleBtDisconnect = async () => {
    setBtError(null);
    try {
      await disconnectNiimbotPrinter();
      setBtConn(null);
      setBtMessage("Koneksi printer diputuskan.");
    } catch (err) {
      setBtError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleBtRefreshStatus = async () => {
    setBtError(null);
    setBtBusy(true);
    try {
      const info = await refreshNiimbotStatus();
      if (info) {
        setBtConn(info);
        const detectedTxt = applyDetectedRoll(info.detectedRollMm);
        setBtMessage(detectedTxt ? `Rol terdeteksi: ${detectedTxt}` : "Status printer diperbarui.");
      }
    } catch (err) {
      setBtError(err instanceof Error ? err.message : String(err));
      setBtConn(null);
    } finally {
      setBtBusy(false);
    }
  };

  const handleBtPrintSingle = async (kodeKarya: string) => {
    if (btBusy) return;
    setBtError(null);
    setBtBusy(true);
    setBtPrintingKode(kodeKarya);
    setBtProgress(null);
    try {
      const printer = await printSingleViaBluetooth({
        kodeKarya,
        wMm: safeWMm,
        hMm: safeHMm,
        rotate90,
        logo: logoVariant,
        density: btDensity,
        offsetXOverride: btOffsetX,
        offsetYOverride: parsedOffsetY,
        onProgress: (msg) => setBtMessage(msg),
        onConnected: (p) =>
          setBtConn((prev) => ({
            ...(prev ?? { status: null, readiness: null, battery: null, detectedRollMm: null }),
            printer: p,
          })),
      });
      setBtMessage(`✓ Selesai cetak Slot ${kodeKarya} (${printer.label})`);
    } catch (err) {
      setBtError(`Gagal cetak ${kodeKarya}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBtBusy(false);
      setBtPrintingKode(null);
    }
  };

  const handleBtPrintContinuous = async () => {
    if (btBusy || selectedFilteredItems.length === 0) return;
    setBtError(null);
    setBtBusy(true);
    setBtProgress({ current: 0, total: selectedFilteredItems.length });
    try {
      const kodeList = selectedFilteredItems.map((it) => it.kodeKarya);
      const printer = await printBatchViaBluetooth({
        kodeList,
        wMm: safeWMm,
        hMm: safeHMm,
        rotate90,
        logo: logoVariant,
        density: btDensity,
        offsetXOverride: btOffsetX,
        offsetYOverride: parsedOffsetY,
        onProgress: (msg, current, total) => {
          setBtMessage(msg);
          if (current != null && total != null) setBtProgress({ current, total });
        },
        onConnected: (p) =>
          setBtConn((prev) => ({
            ...(prev ?? { status: null, readiness: null, battery: null, detectedRollMm: null }),
            printer: p,
          })),
      });
      setBtProgress({ current: kodeList.length, total: kodeList.length });
      setBtMessage(
        `✓ Selesai cetak ${kodeList.length} label (${kodeList[0]}–${kodeList[kodeList.length - 1]}) di ${printer.label}`
      );
    } catch (err) {
      setBtError(`Cetak berhenti: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBtBusy(false);
    }
  };

  const firstTestItem = selectedFilteredItems[0] ?? filteredItems[0];
  const isRangeAll = fromSlot === "1" && toSlot === String(items.length || 75);

  return (
    <>
      <Script src="/vendor/label-size.js" strategy="afterInteractive" />
      <Script src="/vendor/niimbot.js" strategy="afterInteractive" />

      {/* Dynamic Print Stylesheet */}
      <style>{`
        @media print {
          @page {
            ${presetKey === "a4" ? "size: A4 portrait; margin: 8mm;" : `size: ${safeWMm}mm ${safeHMm}mm; margin: 0;`}
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            width: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, .print-hidden {
            display: none !important;
          }
          ${
            presetKey === "a4"
              ? `
              .print-container {
                display: grid !important;
                grid-template-columns: repeat(3, 1fr) !important;
                gap: 12px !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .label-card-print {
                border: 1.5px dashed #666666 !important;
                border-radius: 8px !important;
                padding: 10px !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                background: #ffffff !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
              }
              .label-card-print img {
                max-width: 100% !important;
                height: auto !important;
              }
            `
              : `
              .print-container {
                display: block !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .label-card-print {
                width: ${safeWMm}mm !important;
                height: ${safeHMm}mm !important;
                page-break-after: always !important;
                break-after: page !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 0 !important;
                margin: 0 !important;
                overflow: hidden !important;
                background: #ffffff !important;
              }
              .label-card-print img {
                ${
                  rotate90
                    ? `width: ${safeHMm}mm !important; height: ${safeWMm}mm !important; max-width: none !important; max-height: none !important; transform: rotate(90deg) !important;`
                    : `width: 100% !important; height: 100% !important;`
                }
                object-fit: contain !important;
              }
            `
          }
        }
      `}</style>

      {/* PANEL KONTROL COMPACT & RESPONSIF HP */}
      <div className="no-print space-y-2.5 sm:space-y-3">
        {/* Baris Judul Ringkas */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <h1 className="font-title gold-text text-lg sm:text-xl font-bold leading-tight">
              Cetak Label QR
            </h1>
            <span className="rounded-full border border-line bg-panel px-2 py-0.5 text-[11px] font-semibold text-muted">
              {safeWMm}×{safeHMm} mm{rotate90 ? " • ↻90°" : ""}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowSettings((v) => !v)}
              className={`inline-flex items-center justify-center rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                showSettings
                  ? "border-gold bg-gold text-black"
                  : "border-line bg-panel text-cream hover:border-gold"
              }`}
            >
              Pengaturan
            </button>
            <button
              type="button"
              disabled={selectedFilteredItems.length === 0}
              onClick={() => window.print()}
              className="inline-flex items-center justify-center rounded-lg border border-line bg-panel px-2.5 py-1.5 text-xs font-semibold text-cream hover:border-gold disabled:opacity-40 transition-colors"
              title="Print lewat browser / Simpan PDF"
            >
              Cetak PDF
            </button>
            <Link
              href="/admin/karya"
              className="inline-flex items-center justify-center rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold text-gold-light hover:border-gold transition-colors"
            >
              ‹ Kembali
            </Link>
          </div>
        </div>

        {/* Toolbar Utama 1 Kotak (Mudah Dipakai di HP & Desktop) */}
        <div className="rounded-xl border border-line bg-panel p-2.5 sm:p-3 shadow-lg space-y-2.5">
          {/* Baris 1: Printer Bluetooth + Pilihan Logo + Tombol Cetak */}
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            {/* Kiri: Tombol Hubungkan Printer + Segmented Logo */}
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              {!btConn ? (
                <button
                  type="button"
                  disabled={btBusy || !btSupport.ok}
                  onClick={handleBtConnect}
                  className="inline-flex w-full sm:w-auto items-center justify-center rounded-lg bg-sky-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-400 disabled:opacity-50 transition-colors"
                >
                  {btBusy ? "Menghubungkan…" : "Hubungkan Printer Bluetooth"}
                </button>
              ) : (
                <div className="flex w-full sm:w-auto items-center justify-between gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-xs">
                  <span className="font-bold text-emerald-300 truncate">
                    ● {btConn.printer.label}
                    {btConn.battery ? ` • ${btConn.battery.text}` : ""}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={btBusy}
                      onClick={handleBtRefreshStatus}
                      className="rounded px-1.5 py-0.5 text-xs text-cream/80 hover:bg-white/10"
                      title="Cek ulang status & ukuran rol"
                    >
                      Cek
                    </button>
                    <button
                      type="button"
                      disabled={btBusy}
                      onClick={handleBtDisconnect}
                      className="rounded px-1.5 py-0.5 text-xs text-rose-300 hover:bg-rose-500/15"
                      title="Putuskan koneksi Bluetooth"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Pemilih Logo Compact (Full-width 2 kolom di HP, inline di desktop) */}
              <div
                className="grid w-full sm:w-auto grid-cols-2 sm:inline-flex items-center rounded-lg border border-line bg-surface p-0.5 text-xs"
                role="group"
                aria-label="Pilih Logo Tengah QR"
              >
                <button
                  type="button"
                  onClick={() => setLogoVariant("rwsa")}
                  className={`rounded-md px-3 py-1.5 sm:py-1 font-bold transition-colors ${
                    logoVariant === "rwsa"
                      ? "bg-gold text-black shadow-sm"
                      : "text-muted hover:text-cream"
                  }`}
                >
                  Logo RWSA
                </button>
                <button
                  type="button"
                  onClick={() => setLogoVariant("mbtech")}
                  className={`rounded-md px-3 py-1.5 sm:py-1 font-bold transition-colors ${
                    logoVariant === "mbtech"
                      ? "bg-gold text-black shadow-sm"
                      : "text-muted hover:text-cream"
                  }`}
                >
                  MBtech Bulat
                </button>
              </div>
            </div>

            {/* Kanan: Tombol Cetak Utama (2 kolom rapi di HP) */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
              {firstTestItem && (
                <button
                  type="button"
                  disabled={btBusy || !btSupport.ok}
                  onClick={() => handleBtPrintSingle(firstTestItem.kodeKarya)}
                  className="inline-flex items-center justify-center rounded-lg border border-sky-500/50 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-300 hover:bg-sky-500/20 disabled:opacity-50 transition-colors"
                  title="Coba cetak 1 stiker dulu untuk memastikan hasil rapi"
                >
                  Tes 1 ({firstTestItem.kodeKarya})
                </button>
              )}
              <button
                type="button"
                disabled={btBusy || !btSupport.ok || selectedFilteredItems.length === 0}
                onClick={handleBtPrintContinuous}
                className={`inline-flex items-center justify-center rounded-lg bg-gradient-to-b from-[#ffeaae] via-[#f3be4d] to-[#cf9324] border border-[#fff2c8] px-3.5 py-2 text-xs font-bold text-[#141006] shadow-md hover:brightness-105 disabled:opacity-50 transition-all ${
                  firstTestItem ? "" : "col-span-2"
                }`}
              >
                {btBusy && btPrintingKode == null
                  ? "Mencetak…"
                  : `Cetak (${selectedFilteredItems.length})`}
              </button>
            </div>
          </div>

          {/* Baris 2: Filter Rentang & Checklist Ringkas */}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between border-t border-line/60 pt-2 text-xs">
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[11px] font-semibold text-muted mr-0.5">Nomor:</span>
              <button
                type="button"
                onClick={handleResetRange}
                className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
                  isRangeAll ? "bg-gold/20 text-gold" : "bg-surface text-muted hover:text-cream"
                }`}
              >
                Semua
              </button>
              {[
                [1, 25],
                [26, 50],
                [51, 75],
              ].map(([a, b]) => {
                const active = fromSlot === String(a) && toSlot === String(b);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => handleQuickRange(a, b)}
                    className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
                      active ? "bg-gold/20 text-gold" : "bg-surface text-muted hover:text-cream"
                    }`}
                  >
                    {a}–{b}
                  </button>
                );
              })}

              <div className="ml-auto sm:ml-1 flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max={items.length}
                  value={fromSlot}
                  onChange={(e) => setFromSlot(e.target.value)}
                  aria-label="Dari nomor"
                  className="w-12 rounded-md border border-line bg-surface px-1.5 py-1 text-center text-[11px] text-cream focus:border-gold focus:outline-none"
                />
                <span className="text-[11px] text-muted">–</span>
                <input
                  type="number"
                  min="1"
                  max={items.length}
                  value={toSlot}
                  onChange={(e) => setToSlot(e.target.value)}
                  aria-label="Sampai nomor"
                  className="w-12 rounded-md border border-line bg-surface px-1.5 py-1 text-center text-[11px] text-cream focus:border-gold focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-1.5">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCheckFiltered}
                  className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/25"
                >
                  Pilih Semua
                </button>
                <button
                  type="button"
                  onClick={handleUncheckAll}
                  className="rounded-md bg-surface border border-line px-2.5 py-1 text-[11px] font-semibold text-muted hover:text-rose-300"
                >
                  Kosongkan
                </button>
              </div>
              <span className="rounded-md bg-gold/15 px-2.5 py-1 text-[11px] font-bold text-gold">
                {selectedFilteredItems.length}/{filteredItems.length} dipilih
              </span>
            </div>
          </div>

          {/* Info Browser Tidak Support Web Bluetooth */}
          {!btSupport.ok && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
              <b>Info Bluetooth:</b> {btSupport.reason}
            </div>
          )}

          {/* Status / Progress / Error (Hanya muncul saat aktif) */}
          {(btMessage || btError || (btProgress && btProgress.total > 1)) && (
            <div className="space-y-1.5 pt-0.5">
              {btProgress && btProgress.total > 1 && (
                <div className="w-full bg-surface rounded-full h-2 overflow-hidden border border-line">
                  <div
                    className="bg-sky-400 h-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.round((btProgress.current / btProgress.total) * 100))}%`,
                    }}
                  />
                </div>
              )}
              {btMessage && (
                <div className="rounded-lg bg-sky-500/10 border border-sky-500/30 px-2.5 py-1.5 text-[11px] text-sky-200">
                  {btMessage}
                </div>
              )}
              {btError && (
                <div className="rounded-lg bg-rose-500/15 border border-rose-500/40 px-2.5 py-1.5 text-[11px] text-rose-200">
                  <b>Perhatian:</b> {btError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel Pengaturan Lanjutan (Tersembunyi default agar halaman simpel) */}
        {showSettings && (
          <div className="rounded-xl border border-gold/30 bg-panel p-3.5 shadow-md space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end">
              {/* Ukuran Rol */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gold-light block">
                  Ukuran Kertas Rol:
                </label>
                <select
                  value={presetKey}
                  onChange={(e) => handlePresetChange(e.target.value as PresetKey)}
                  className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-cream focus:border-gold focus:outline-none"
                >
                  {(Object.keys(PRESET_OPTIONS) as Array<keyof typeof PRESET_OPTIONS>).map((k) => (
                    <option key={k} value={k}>
                      {PRESET_OPTIONS[k].label}
                    </option>
                  ))}
                  <option value="custom">Custom (isi mm)</option>
                  <option value="a4">Kertas A4 (Grid 3 Kolom)</option>
                </select>
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="number"
                    min="15"
                    max="120"
                    value={wMm}
                    onChange={(e) => {
                      setPresetKey("custom");
                      setWMm(Number(e.target.value) || 40);
                    }}
                    className="w-full rounded-md border border-line bg-surface px-2 py-1 text-center text-xs text-cream"
                    title="Lebar kertas (mm)"
                  />
                  <span className="text-xs text-muted">×</span>
                  <input
                    type="number"
                    min="15"
                    max="150"
                    value={hMm}
                    onChange={(e) => {
                      setPresetKey("custom");
                      setHMm(Number(e.target.value) || 30);
                    }}
                    className="w-full rounded-md border border-line bg-surface px-2 py-1 text-center text-xs text-cream"
                    title="Tinggi kertas (mm)"
                  />
                  <span className="text-[10px] text-muted">mm</span>
                </div>
              </div>

              {/* Rotate 90 & Kepekatan */}
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gold-light block">
                    Kepekatan Cetak:
                  </label>
                  <select
                    value={btDensity}
                    onChange={(e) => setBtDensity(Number(e.target.value))}
                    disabled={btBusy}
                    className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-cream focus:border-sky-400 focus:outline-none"
                  >
                    <option value={1}>1 — Tipis</option>
                    <option value={2}>2 — Agak Tipis</option>
                    <option value={3}>3 — Standar (Rekomendasi)</option>
                    <option value={4}>4 — Pekat</option>
                    <option value={5}>5 — Paling Pekat</option>
                  </select>
                </div>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-line/70 bg-surface px-2.5 py-1.5 text-[11px] text-cream">
                  <input
                    type="checkbox"
                    checked={rotate90}
                    onChange={(e) => setRotate90(e.target.checked)}
                    className="h-3.5 w-3.5 accent-gold cursor-pointer rounded"
                  />
                  <span>
                    <b>↻ Rotate 90°</b>{" "}
                    <span className="text-muted">({safeHMm}×{safeWMm} berdiri)</span>
                  </span>
                </label>
              </div>

              {/* Geser Kiri/Kanan (Offset X) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gold-light block">
                  ↔ Geser Kiri / Kanan (px):
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={btBusy}
                    onClick={() => nudgeOffsetX(-4)}
                    className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-bold text-cream hover:border-sky-400"
                  >
                    ◀
                  </button>
                  <input
                    type="number"
                    value={btOffsetX}
                    onChange={(e) => setBtOffsetX(parseInt(e.target.value, 10) || 0)}
                    disabled={btBusy}
                    className="w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-center text-xs text-cream"
                  />
                  <button
                    type="button"
                    disabled={btBusy}
                    onClick={() => nudgeOffsetX(4)}
                    className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-bold text-cream hover:border-sky-400"
                  >
                    ▶
                  </button>
                </div>
              </div>

              {/* Geser Atas/Bawah (Offset Y) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-gold-light">
                    ↕ Geser Atas / Bawah (px):
                  </label>
                  {(btOffsetX !== 0 || btOffsetY !== "") && (
                    <button
                      type="button"
                      onClick={() => {
                        setBtOffsetX(0);
                        setBtOffsetY("");
                      }}
                      className="text-[10px] text-sky-300 hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={btBusy}
                    onClick={() => nudgeOffsetY(-8)}
                    className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-bold text-cream hover:border-sky-400"
                  >
                    ▲
                  </button>
                  <input
                    type="number"
                    placeholder="Auto"
                    value={btOffsetY}
                    onChange={(e) => setBtOffsetY(e.target.value)}
                    disabled={btBusy}
                    className="w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-center text-xs text-cream"
                  />
                  <button
                    type="button"
                    disabled={btBusy}
                    onClick={() => nudgeOffsetY(8)}
                    className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-bold text-cream hover:border-sky-400"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>

            <p className="border-t border-line/50 pt-2 text-[11px] text-muted">
              <b>Cara pakai:</b> 1) Klik <b>Hubungkan Printer</b> → 2) Pilih <b>Logo RWSA</b> atau <b>MBtech Bulat</b> → 3) Klik kartu untuk centang nomor → 4) Klik <b>Tes 1</b> lalu <b>Cetak</b>.
            </p>
          </div>
        )}
      </div>

      {/* Grid Kartu Stiker Compact */}
      <div
        className={`print-container mt-3 sm:mt-4 ${
          presetKey === "a4"
            ? "grid gap-3 sm:grid-cols-2 md:grid-cols-3"
            : !rotate90 && safeWMm > safeHMm * 1.15
            ? "grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 lg:grid-cols-4"
            : "grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        }`}
      >
        {filteredItems.map((k) => {
          const isSelected = selectedKodes.has(k.kodeKarya);
          const labelImageUrl = `/api/admin/label/${k.kodeKarya}?w=${safeWMm}&h=${safeHMm}&logo=${logoVariant}${rotate90 ? "&rotate=1&preview=upright" : ""}&v=11`;
          const downloadUrl = `/api/admin/label/${k.kodeKarya}?w=${safeWMm}&h=${safeHMm}&logo=${logoVariant}${rotate90 ? "&rotate=1" : ""}&download=1&v=11`;
          const isPrintingThis = btPrintingKode === k.kodeKarya;

          return (
            <div
              key={k.id}
              className={`label-card-print group rounded-xl border bg-panel p-2.5 text-center transition-all flex flex-col items-center justify-between ${
                isSelected
                  ? "border-gold/80 ring-1 ring-gold/25 shadow-md"
                  : "border-line/70 opacity-50 hover:opacity-85 print-hidden"
              }`}
            >
              {/* Header Kartu Compact */}
              <label className="no-print mb-1.5 flex w-full cursor-pointer items-center justify-between px-0.5">
                <span className="flex items-center gap-1.5 text-xs font-bold text-cream">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleKode(k.kodeKarya)}
                    className="h-3.5 w-3.5 accent-gold cursor-pointer rounded"
                  />
                  <span>{k.kodeKarya}</span>
                </span>
                <span
                  className={`text-[10px] font-bold ${
                    isSelected ? "text-gold" : "text-muted"
                  }`}
                >
                  {isSelected ? "✓" : "—"}
                </span>
              </label>

              {/* Preview Gambar Stiker */}
              <div
                onClick={() => toggleKode(k.kodeKarya)}
                className="w-full flex-1 flex items-center justify-center cursor-pointer print:cursor-default"
                title="Klik untuk pilih / batal pilih"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={labelImageUrl}
                  alt={`Label Slot ${k.kodeKarya}`}
                  className="max-h-full max-w-full rounded-md bg-white object-contain border border-gray-300/80 print:border-none print:rounded-none"
                  loading="lazy"
                />
              </div>

              {/* Aksi Satuan Compact */}
              <div className="no-print mt-2 flex items-center gap-1 w-full">
                <button
                  type="button"
                  disabled={btBusy || !btSupport.ok}
                  onClick={() => handleBtPrintSingle(k.kodeKarya)}
                  className="flex-1 rounded-md bg-sky-500/20 border border-sky-500/35 px-2 py-1 text-[11px] font-bold text-sky-300 hover:bg-sky-500/30 disabled:opacity-50 transition-colors"
                  title={`Cetak Slot ${k.kodeKarya}`}
                >
                  {isPrintingThis ? "Mencetak…" : "Cetak"}
                </button>
                <a
                  href={downloadUrl}
                  download={`label-${k.kodeKarya}-${logoVariant}-${safeWMm}x${safeHMm}${rotate90 ? "-rot90" : ""}.png`}
                  className="rounded-md bg-surface border border-line/60 px-2 py-1 text-[11px] font-semibold text-gold hover:bg-gold/15 transition-colors"
                  title="Unduh PNG"
                >
                  PNG
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="no-print mt-4 rounded-xl border border-dashed border-line p-8 text-center text-muted">
          <p className="text-xs font-semibold">Tidak ada nomor slot pada rentang ini.</p>
          <button
            type="button"
            onClick={handleResetRange}
            className="mt-2.5 inline-flex items-center justify-center rounded-lg bg-gradient-to-b from-[#ffeaae] via-[#f3be4d] to-[#cf9324] border border-[#fff2c8] px-3 py-1.5 text-xs font-bold text-[#141006]"
          >
            Tampilkan Semua (1–{items.length})
          </button>
        </div>
      )}
    </>
  );
}
