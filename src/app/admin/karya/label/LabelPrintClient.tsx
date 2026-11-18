"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { LogoChoice, StickerPreset } from "@/lib/label-generator";

export type LabelItem = {
  id: number;
  kodeKarya: string;
};

type PresetType = StickerPreset | "a4";

interface LabelPrintClientProps {
  items: LabelItem[];
}

export function LabelPrintClient({ items }: LabelPrintClientProps) {
  const [preset, setPreset] = useState<PresetType>("50x50");
  const [logoChoice, setLogoChoice] = useState<LogoChoice>("rwsa");
  const [fromSlot, setFromSlot] = useState<string>("1");
  const [toSlot, setToSlot] = useState<string>(String(items.length || 75));
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [showCompare, setShowCompare] = useState<boolean>(true);

  // Filter items sesuai rentang nomor yang diinput
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

  // Tombol quick select rentang slot
  const handleQuickSelect = (from: number, to: number) => {
    setFromSlot(String(from));
    setToSlot(String(to));
  };

  const handleSelectAll = () => {
    setFromSlot("1");
    setToSlot(String(items.length || 75));
  };

  // Sample kode untuk kotak perbandingan
  const sampleKode = items[0]?.kodeKarya ?? "001";

  return (
    <>
      {/* Dynamic Print Stylesheet sesuai ukuran printer Niimbot B1 */}
      <style>{`
        @media print {
          @page {
            ${
              preset === "50x50"
                ? "size: 50mm 50mm; margin: 0;"
                : preset === "50x30"
                ? "size: 50mm 30mm; margin: 0;"
                : preset === "40x30"
                ? "size: 40mm 30mm; margin: 0;"
                : preset === "50x80"
                ? "size: 50mm 80mm; margin: 0;"
                : "size: A4 portrait; margin: 8mm;"
            }
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
          .no-print {
            display: none !important;
          }
          ${
            preset === "a4"
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
                width: 100vw !important;
                height: 100vh !important;
                ${
                  preset === "50x50"
                    ? "width: 50mm !important; height: 50mm !important;"
                    : preset === "50x30"
                    ? "width: 50mm !important; height: 30mm !important;"
                    : preset === "40x30"
                    ? "width: 40mm !important; height: 30mm !important;"
                    : "width: 50mm !important; height: 80mm !important;"
                }
                page-break-after: always !important;
                break-after: page !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 1mm !important;
                margin: 0 !important;
                overflow: hidden !important;
                background: #ffffff !important;
              }
              .label-card-print img {
                width: 100% !important;
                height: 100% !important;
                object-fit: contain !important;
              }
            `
          }
        }
      `}</style>

      {/* Kontrol UI Layar (Disembunyikan saat Mencetak) */}
      <div className="no-print space-y-6">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-gold/20 px-2.5 py-0.5 text-xs font-bold text-gold">
                🖨️ Thermal Label Niimbot B1
              </span>
              <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-muted">
                Total {items.length} Peserta
              </span>
            </div>
            <h1 className="font-title gold-text mt-1 text-2xl font-bold">
              Cetak Label Motor Peserta
            </h1>
            <p className="text-xs text-muted">
              Pilih variasi logo (RWSA vs MBtech) dan sesuaikan ukuran label roll untuk printer thermal Niimbot B1.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/admin/karya" className="btn btn-ghost btn-sm font-bold">
              ‹ Kembali ke Daftar
            </Link>
            <button
              type="button"
              onClick={() => setShowCompare(!showCompare)}
              className="btn btn-outline btn-sm font-semibold text-xs"
            >
              {showCompare ? "✕ Tutup Bandingkan Logo" : "🔍 Bandingkan Logo (RWSA vs MBtech)"}
            </button>
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="btn btn-outline btn-sm font-semibold text-xs"
            >
              {showGuide ? "✕ Tutup Panduan" : "❓ Panduan Niimbot B1"}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-gold btn-sm px-5 font-bold shadow-md hover:brightness-110"
            >
              🖨️ Cetak {filteredItems.length} Label Sekarang
            </button>
          </div>
        </div>

        {/* Panel Bandingkan Logo Berdampingan (Side-by-Side Comparison) */}
        {showCompare && (
          <div className="rounded-2xl border-2 border-gold/40 bg-panel p-5 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3 mb-4">
              <div>
                <h2 className="font-title text-base font-bold text-gold">
                  🔍 Komparasi Logo Tengah: Logo RWSA vs Logo MBtech
                </h2>
                <p className="text-xs text-muted">
                  Bandingkan kedua desain stiker di bawah ini untuk melihat mana yang paling jelas terbaca pada kertas thermal Niimbot B1 Anda.
                </p>
              </div>
              <div className="text-xs font-semibold text-cream bg-surface px-3 py-1 rounded-full border border-line">
                Aktif saat ini: <span className="text-gold uppercase font-bold">{logoChoice === "rwsa" ? "Logo RWSA 2026" : "Logo MBtech"}</span>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Opsi 1: Logo RWSA */}
              <div
                onClick={() => setLogoChoice("rwsa")}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all flex flex-col items-center ${
                  logoChoice === "rwsa"
                    ? "border-gold bg-gold/10 shadow-lg ring-2 ring-gold/40"
                    : "border-line bg-surface/50 hover:border-gold/50"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="logoChoiceRadio"
                      checked={logoChoice === "rwsa"}
                      onChange={() => setLogoChoice("rwsa")}
                      className="accent-gold cursor-pointer"
                    />
                    <span className="font-bold text-sm text-cream">Pilihan A: Logo RWSA 2026</span>
                  </div>
                  {logoChoice === "rwsa" && (
                    <span className="rounded bg-gold px-2 py-0.5 text-[10px] font-bold text-black uppercase">
                      Terpilih
                    </span>
                  )}
                </div>

                {/* Preview Image RWSA */}
                <div className="w-56 h-56 bg-white rounded-lg p-2 flex items-center justify-center shadow-md border border-gray-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/admin/label/${sampleKode}?layout=${preset}&logo=rwsa`}
                    alt="Preview Label Logo RWSA"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <div className="mt-4 flex items-center gap-2 w-full justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLogoChoice("rwsa");
                    }}
                    className={`btn btn-xs ${
                      logoChoice === "rwsa" ? "btn-gold font-bold" : "btn-outline"
                    }`}
                  >
                    {logoChoice === "rwsa" ? "✓ Sedang Digunakan" : "Gunakan Logo RWSA"}
                  </button>
                  <a
                    href={`/api/admin/label/${sampleKode}?layout=${preset}&logo=rwsa&download=1`}
                    download={`sample-rwsa-${sampleKode}.png`}
                    className="btn btn-ghost btn-xs text-muted hover:text-cream"
                    title="Unduh file gambar untuk tes cetak dari aplikasi HP"
                  >
                    💾 Unduh Tes PNG
                  </a>
                </div>
              </div>

              {/* Opsi 2: Logo MBtech */}
              <div
                onClick={() => setLogoChoice("mbtech")}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all flex flex-col items-center ${
                  logoChoice === "mbtech"
                    ? "border-gold bg-gold/10 shadow-lg ring-2 ring-gold/40"
                    : "border-line bg-surface/50 hover:border-gold/50"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="logoChoiceRadio"
                      checked={logoChoice === "mbtech"}
                      onChange={() => setLogoChoice("mbtech")}
                      className="accent-gold cursor-pointer"
                    />
                    <span className="font-bold text-sm text-cream">Pilihan B: Logo MBtech</span>
                  </div>
                  {logoChoice === "mbtech" && (
                    <span className="rounded bg-gold px-2 py-0.5 text-[10px] font-bold text-black uppercase">
                      Terpilih
                    </span>
                  )}
                </div>

                {/* Preview Image MBtech */}
                <div className="w-56 h-56 bg-white rounded-lg p-2 flex items-center justify-center shadow-md border border-gray-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/admin/label/${sampleKode}?layout=${preset}&logo=mbtech`}
                    alt="Preview Label Logo MBtech"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <div className="mt-4 flex items-center gap-2 w-full justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLogoChoice("mbtech");
                    }}
                    className={`btn btn-xs ${
                      logoChoice === "mbtech" ? "btn-gold font-bold" : "btn-outline"
                    }`}
                  >
                    {logoChoice === "mbtech" ? "✓ Sedang Digunakan" : "Gunakan Logo MBtech"}
                  </button>
                  <a
                    href={`/api/admin/label/${sampleKode}?layout=${preset}&logo=mbtech&download=1`}
                    download={`sample-mbtech-${sampleKode}.png`}
                    className="btn btn-ghost btn-xs text-muted hover:text-cream"
                    title="Unduh file gambar untuk tes cetak dari aplikasi HP"
                  >
                    💾 Unduh Tes PNG
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Kotak Panduan Setting Niimbot B1 */}
        {showGuide && (
          <div className="rounded-xl border border-gold/40 bg-panel/90 p-4 text-xs text-cream shadow-xl space-y-3">
            <div className="flex items-center justify-between font-bold text-gold text-sm border-b border-line/60 pb-2">
              <span>📋 Panduan Cetak dengan Printer Niimbot B1</span>
              <span className="text-[11px] text-muted font-normal">Resolusi 203 DPI Thermal</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5 rounded-lg bg-surface/60 p-3 border border-line/40">
                <p className="font-bold text-gold-light">A. Cetak Langsung dari Laptop/PC (Chrome / Edge):</p>
                <ol className="list-decimal pl-4 space-y-1 text-muted">
                  <li>Nyalakan <b>Niimbot B1</b> dan hubungkan via USB atau Bluetooth ke PC.</li>
                  <li>Pilih ukuran rol di bawah (misal: <b>50 × 50 mm</b> atau <b>50 × 30 mm</b>).</li>
                  <li>Klik tombol <b>&quot;Cetak Label Sekarang&quot;</b> (atau tekan <kbd className="rounded bg-black/40 px-1">Ctrl+P</kbd>).</li>
                  <li>Pada dialog Cetak browser:
                    <ul className="list-disc pl-4 mt-0.5 text-cream">
                      <li><b>Printer</b>: Pilih Niimbot B1</li>
                      <li><b>Paper Size</b>: Sesuaikan dengan rol (50x50 mm / 50x30 mm)</li>
                      <li><b>Margins</b>: Pilih <b>None / Tidak ada</b></li>
                      <li><b>Options</b>: Centang <b>Background graphics</b></li>
                    </ul>
                  </li>
                  <li>Klik <b>Print</b>. Printer otomatis mencetak 1 stiker per peserta!</li>
                </ol>
              </div>

              <div className="space-y-1.5 rounded-lg bg-surface/60 p-3 border border-line/40">
                <p className="font-bold text-gold-light">B. Cetak lewat HP (Aplikasi NIIMBOT Bluetooth):</p>
                <ol className="list-decimal pl-4 space-y-1 text-muted">
                  <li>Pada kartu stiker di bawah, klik tombol <b>&quot;💾 Unduh PNG&quot;</b> pada slot yang diinginkan.</li>
                  <li>Buka aplikasi <b>NIIMBOT</b> di smartphone (Android / iOS).</li>
                  <li>Hubungkan Bluetooth ke printer <b>Niimbot B1</b>.</li>
                  <li>Buat kanvas baru sesuai ukuran stiker fisik Anda (misal 50×50 mm).</li>
                  <li>Pilih menu <b>Image / Gambar</b>, lalu masukkan file PNG yang baru diunduh.</li>
                  <li>Tekan <b>Print</b> di aplikasi HP. Gambar sudah otomatis di-crop pas 100%!</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Panel Pengaturan Ukuran & Filter Slot */}
        <div className="rounded-xl border border-line bg-panel p-4 shadow-md space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Pilihan Preset Ukuran */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gold-light block">
                📏 Ukuran Rol Label Niimbot B1:
              </label>
              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value as PresetType)}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold text-cream focus:border-gold focus:outline-none"
              >
                <option value="50x50">Niimbot B1 (50 × 50 mm) — Kotak (Rekomendasi Utama)</option>
                <option value="50x30">Niimbot B1 (50 × 30 mm) — Landscape Side-by-Side</option>
                <option value="40x30">Niimbot B1 (40 × 30 mm) — Landscape Kompak</option>
                <option value="50x80">Niimbot B1 (50 × 80 mm) — Portrait Panjang</option>
                <option value="a4">Kertas HVS / Stiker A4 Biasa (Grid 3 Kolom)</option>
              </select>
              <p className="text-[11px] text-muted">
                {preset === "50x50" && "Rol 50x50mm: QR code besar di atas, nomor tebal di bawah."}
                {preset === "50x30" && "Rol 50x30mm: Layout horizontal berdampingan (QR di kiri, nomor di kanan)."}
                {preset === "40x30" && "Rol 40x30mm: Layout horizontal mini kompak."}
                {preset === "50x80" && "Rol 50x80mm: Layout vertikal panjang dengan nomor slot besar."}
                {preset === "a4" && "Kertas A4 biasa: 3 kolom per lembar dengan garis potong putus-putus."}
              </p>
            </div>

            {/* Filter Rentang Nomor Slot */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gold-light block">
                🎯 Filter Rentang Slot Peserta (1 - {items.length}):
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="text-[10px] text-muted mb-0.5">Dari Slot #:</div>
                  <input
                    type="number"
                    min="1"
                    max={items.length}
                    value={fromSlot}
                    onChange={(e) => setFromSlot(e.target.value)}
                    className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-cream focus:border-gold focus:outline-none"
                  />
                </div>
                <span className="text-muted mt-3">s/d</span>
                <div className="flex-1">
                  <div className="text-[10px] text-muted mb-0.5">Sampai Slot #:</div>
                  <input
                    type="number"
                    min="1"
                    max={items.length}
                    value={toSlot}
                    onChange={(e) => setToSlot(e.target.value)}
                    className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-cream focus:border-gold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Quick Actions Rentang */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gold-light block">
                ⚡ Pilih Cepat Slot:
              </label>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="rounded bg-surface px-2 py-1 text-[11px] font-semibold text-cream hover:bg-gold/20 hover:text-gold"
                >
                  Semua (1-{items.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect(1, 10)}
                  className="rounded bg-surface px-2 py-1 text-[11px] font-semibold text-cream hover:bg-gold/20 hover:text-gold"
                >
                  Slot 1 - 10 (Tes)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect(1, 25)}
                  className="rounded bg-surface px-2 py-1 text-[11px] font-semibold text-cream hover:bg-gold/20 hover:text-gold"
                >
                  Slot 1 - 25
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect(26, 50)}
                  className="rounded bg-surface px-2 py-1 text-[11px] font-semibold text-cream hover:bg-gold/20 hover:text-gold"
                >
                  Slot 26 - 50
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect(51, 75)}
                  className="rounded bg-surface px-2 py-1 text-[11px] font-semibold text-cream hover:bg-gold/20 hover:text-gold"
                >
                  Slot 51 - 75
                </button>
              </div>
              <p className="text-[11px] text-gold font-medium mt-1">
                Menampilkan <b>{filteredItems.length}</b> label dengan{" "}
                <b className="uppercase">{logoChoice === "rwsa" ? "Logo RWSA 2026" : "Logo MBtech"}</b>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Kartu Stiker untuk Preview di Layar & Target Print */}
      <div
        className={`print-container mt-6 ${
          preset === "a4"
            ? "grid gap-6 sm:grid-cols-2 md:grid-cols-3"
            : preset === "50x30" || preset === "40x30"
            ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            : "grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        }`}
      >
        {filteredItems.map((k) => {
          const labelImageUrl = `/api/admin/label/${k.kodeKarya}?layout=${preset}&logo=${logoChoice}`;
          const downloadUrl = `/api/admin/label/${k.kodeKarya}?layout=${preset}&logo=${logoChoice}&download=1`;

          return (
            <div
              key={k.id}
              className={`label-card-print group rounded-2xl border-2 border-line bg-panel p-4 text-center transition-all hover:border-gold/80 shadow-lg flex flex-col items-center justify-between ${
                preset === "50x30" || preset === "40x30" ? "aspect-[5/3]" : "aspect-square"
              }`}
            >
              {/* Gambar Stiker Thermal yang sudah di-render proporsional */}
              <div className="w-full flex-1 flex items-center justify-center p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={labelImageUrl}
                  alt={`Label Stiker Slot #${k.kodeKarya}`}
                  className="max-h-full max-w-full rounded-lg bg-white object-contain shadow-sm border border-gray-300 print:border-none print:shadow-none print:rounded-none"
                  loading="lazy"
                />
              </div>

              {/* Tombol Aksi di Layar */}
              <div className="no-print mt-3 flex items-center gap-2 w-full justify-center border-t border-line/40 pt-2.5">
                <a
                  href={downloadUrl}
                  download={`label-slot-${k.kodeKarya}-${preset}-${logoChoice}.png`}
                  className="rounded-md bg-surface px-2.5 py-1 text-[11px] font-semibold text-gold hover:bg-gold/20 flex items-center gap-1 transition-colors"
                  title="Unduh file gambar PNG untuk dibuka di aplikasi HP NIIMBOT"
                >
                  <span>💾 Unduh PNG</span>
                </a>
                <a
                  href={`/juri/karya/${k.kodeKarya}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md bg-surface px-2 py-1 text-[11px] text-muted hover:text-cream transition-colors"
                  title="Lihat halaman penilaian juri"
                >
                  🔗 Buka Link
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="no-print rounded-2xl border border-dashed border-line p-12 text-center text-muted">
          <p className="text-sm font-semibold">Tidak ada slot yang cocok dengan rentang filter.</p>
          <button
            type="button"
            onClick={handleSelectAll}
            className="btn btn-gold btn-xs mt-3 font-bold"
          >
            Tampilkan Semua Slot (1 - {items.length})
          </button>
        </div>
      )}
    </>
  );
}
