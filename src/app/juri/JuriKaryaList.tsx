"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { QrScannerModal } from "@/components/QrScannerModal";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";

type Item = {
  id: number;
  kode: string;
  nama: string;
  peserta: string;
  kodePeserta: string;
  whatsapp?: string | null;
  coverId: number | null;
  status: "BELUM" | "DRAFT" | "FINAL";
  skor: string | null;
};

const PAGE_SIZE = 20;

export function JuriKaryaList({
  items,
  fase,
  juriNama,
  juriKode,
}: {
  items: Item[];
  fase: "PERSIAPAN" | "PENJURIAN" | "SELESAI";
  juriNama: string;
  juriKode: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"ALL" | Item["status"]>("ALL");
  const [page, setPage] = useState(1);
  const [scannerOpen, setScannerOpen] = useState(false);

  const counts = useMemo(() => {
    const c = { BELUM: 0, DRAFT: 0, FINAL: 0, total: items.length };
    for (const it of items) c[it.status]++;
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((it) => {
      if (filter !== "ALL" && it.status !== filter) return false;
      if (!needle) return true;
      return (
        it.kode.toLowerCase().includes(needle) ||
        it.nama.toLowerCase().includes(needle) ||
        it.peserta.toLowerCase().includes(needle) ||
        it.kodePeserta.toLowerCase().includes(needle) ||
        (it.whatsapp ?? "").includes(needle)
      );
    });
  }, [items, q, filter]);

  const handleScanSuccess = (kodeKarya: string) => {
    setScannerOpen(false);
    // Langsung menuju ke detail dan lembar penilaian karya yang di-scan
    router.push(`/juri/karya/${encodeURIComponent(kodeKarya)}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = q.trim();
    if (!clean) return;
    const num = parseInt(clean, 10);
    if (!isNaN(num) && num >= 1 && num <= 250) {
      const pad = String(num).padStart(3, "0");
      router.push(`/juri/karya/${pad}`);
      return;
    }
    if (filtered.length === 1) {
      router.push(`/juri/karya/${filtered[0].kode}`);
    }
  };

  const handleQChange = (val: string) => {
    setQ(val);
    setPage(1);
  };

  const handleFilterChange = (next: "ALL" | Item["status"]) => {
    setFilter(next);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const paginated = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const goToPage = (p: number) => {
    const valid = Math.min(totalPages, Math.max(1, p));
    setPage(valid);
    // Scroll mulus ke bagian atas daftar pada mobile
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  const pct = counts.total > 0 ? Math.round((counts.FINAL / counts.total) * 100) : 0;

  return (
    <div className="space-y-4 pb-32 sm:pb-16">
      <PwaInstallPrompt />

      {/* 1. Executive Dashboard Juri — Optimal untuk Layar Mobile & Desktop */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-panel2 via-panel to-panel2 p-4 sm:p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl border-2 border-gold bg-gradient-to-br from-[#3b3223] to-[#241f17] font-title text-xl sm:text-2xl font-black text-gold-light shadow-md">
              {juriKode}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gold-light">
                  Dewan Juri Resmi RWSA 2026
                </span>
              </div>
              <h1 className="font-title text-xl sm:text-2xl font-black text-white leading-tight">
                {juriNama}
              </h1>
            </div>
          </div>

          <div className="text-right sm:text-right">
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="num font-title text-2xl sm:text-3xl font-black text-gold-light">
                {counts.FINAL}
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#ded7c8]">/ {counts.total}</span>
            </div>
            <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-ok">
              {pct}% Selesai Dinilai
            </p>
          </div>
        </div>

        {/* Bar Progres Emas Mewah */}
        <div className="mt-3.5 h-2.5 w-full overflow-hidden rounded-full border border-gold/30 bg-black/60 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-gold via-gold-light to-white transition-all duration-500 shadow-md"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* 3 Kartu Metrik Filter Cepat (Sentuh untuk Filter Langsung) */}
        <div className="mt-3.5 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleFilterChange(filter === "BELUM" ? "ALL" : "BELUM")}
            className={`rounded-xl border p-2 text-center transition-all ${
              filter === "BELUM"
                ? "border-warn bg-warn/25 shadow-md"
                : "border-line bg-panel2/80 hover:border-gold/50"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#ded7c8]">Belum</p>
            <p className={`num font-title text-lg sm:text-xl font-black ${counts.BELUM > 0 ? "text-warn" : "text-white"}`}>
              {counts.BELUM}
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleFilterChange(filter === "DRAFT" ? "ALL" : "DRAFT")}
            className={`rounded-xl border p-2 text-center transition-all ${
              filter === "DRAFT"
                ? "border-gold bg-gold/25 shadow-md"
                : "border-line bg-panel2/80 hover:border-gold/50"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#ded7c8]">Draft</p>
            <p className="num font-title text-lg sm:text-xl font-black text-gold-light">
              {counts.DRAFT}
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleFilterChange(filter === "FINAL" ? "ALL" : "FINAL")}
            className={`rounded-xl border p-2 text-center transition-all ${
              filter === "FINAL"
                ? "border-ok bg-ok/25 shadow-md"
                : "border-line bg-panel2/80 hover:border-gold/50"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#ded7c8]">Final</p>
            <p className="num font-title text-lg sm:text-xl font-black text-ok">
              {counts.FINAL}
            </p>
          </button>
        </div>
      </div>

      {fase !== "PENJURIAN" && (
        <div className="rounded-xl border-2 border-warn/70 bg-warn/15 px-4 py-3 text-sm font-bold text-warn">
          <span>
            {fase === "PERSIAPAN"
              ? "Fase penjurian belum dibuka secara resmi oleh panitia."
              : "Fase penjurian telah ditutup. Seluruh skor terkunci."}
          </span>
        </div>
      )}

      {/* 2. Kontrol Pencarian & Tombol Pindai QR Utama */}
      <div className="space-y-2.5">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              className="input text-base font-semibold py-3 pl-3.5 pr-10 shadow-inner"
              placeholder="Cari nomor slot (misal: 25) atau nama motor…"
              value={q}
              onChange={(e) => handleQChange(e.target.value)}
            />
            {q && (
              <button
                type="button"
                onClick={() => handleQChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#ded7c8] hover:text-white"
                aria-label="Bersihkan pencarian"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-ghost border border-gold/40 text-gold-light hover:bg-gold/20 shrink-0 px-3 py-3 font-bold text-sm hidden sm:inline-flex"
            title="Buka karya / slot"
          >
            Buka
          </button>

          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="btn btn-gold shrink-0 gap-1.5 px-3.5 sm:px-5 py-3 shadow-lg active:scale-95 transition-transform"
            title="Pindai QR Code pada unit motor peserta"
          >
            <span className="font-extrabold text-sm sm:text-base">Scan QR</span>
          </button>
        </form>

        {/* Tab Filter Segmented */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
          {(
            [
              ["ALL", `Semua (${counts.total})`],
              ["BELUM", `Belum Dinilai (${counts.BELUM})`],
              ["DRAFT", `Draft (${counts.DRAFT})`],
              ["FINAL", `Final (${counts.FINAL})`],
            ] as const
          ).map(([k, label]) => {
            const isActive = filter === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => handleFilterChange(k)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold shrink-0 transition-all ${
                  isActive
                    ? "bg-gold text-ink font-black shadow-md"
                    : "bg-panel2 border border-line text-[#ded7c8] hover:text-white hover:border-gold/60"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Indikator Status & Navigasi Halaman Ringkas */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#ded7c8]">
        <div>
          Menampilkan <strong>{filtered.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, filtered.length)}</strong> dari total <strong>{filtered.length}</strong> karya
          {filter !== "ALL" && <span className="text-gold-light ml-1 font-bold">({filter})</span>}
        </div>
        {totalPages > 1 && (
          <div className="text-gold-light font-bold">
            Halaman {page} dari {totalPages}
          </div>
        )}
      </div>

      {/* 3. Daftar Kartu Karya — Desain Khusus Mobile & Desktop */}
      {filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-base font-bold text-white">Tidak ada karya yang cocok</p>
          <p className="mt-1 text-xs text-[#ded7c8]">
            {q ? `Kata kunci "${q}" tidak ditemukan.` : "Tidak ada karya dalam filter ini."}
          </p>
          {(q || filter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                handleQChange("");
                handleFilterChange("ALL");
              }}
              className="btn btn-ghost btn-sm mt-3 font-bold text-gold-light"
            >
              Reset Filter & Pencarian
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.map((it) => {
            const isFinal = it.status === "FINAL";
            const isDraft = it.status === "DRAFT";
            const isBelum = it.status === "BELUM";

            return (
              <Link
                key={it.id}
                href={`/juri/karya/${it.kode}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-line bg-panel p-3.5 shadow-md transition-all duration-150 hover:border-gold hover:shadow-xl active:scale-[0.99]"
              >
                {/* Bagian Atas Kartu: ID Karya & Badge Status */}
                <div>
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-line/60">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#ded7c8] block">
                        ID Penilaian
                      </span>
                      <span className="font-title text-xl font-black text-gold-light tracking-wide group-hover:text-gold transition-colors">
                        {it.kode}
                      </span>
                    </div>

                    <div>
                      {isFinal && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-ok/70 bg-ok/20 px-2.5 py-1 text-xs font-black text-[#a3f7bf]">
                          FINAL
                        </span>
                      )}
                      {isDraft && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-warn/70 bg-warn/20 px-2.5 py-1 text-xs font-black text-[#ffe28a]">
                          DRAFT
                        </span>
                      )}
                      {isBelum && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-line bg-panel2/80 px-2.5 py-1 text-xs font-bold text-[#ded7c8]">
                          BELUM
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bagian Tengah: Thumbnail Foto & Informasi Motor */}
                  <div className="mt-3 flex gap-3 items-center">
                    {/* Thumbnail Foto */}
                    <div className="relative h-20 w-24 sm:h-22 sm:w-28 shrink-0 overflow-hidden rounded-lg border border-line/80 bg-[#161410] shadow-inner">
                      {it.coverId ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/foto/${it.coverId}?t=1`}
                          alt={it.nama}
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-center p-1">
                          <span className="text-[10px] font-bold text-[#ded7c8]">Tanpa Foto</span>
                        </div>
                      )}
                    </div>

                    {/* Rincian Nama & Bengkel */}
                    <div className="min-w-0 flex-1">
                      <h2 className="font-extrabold text-base text-white leading-tight line-clamp-1 group-hover:text-gold-light transition-colors">
                        {it.nama}
                      </h2>
                      <p className="mt-1 text-xs font-semibold text-[#ded7c8] line-clamp-1">
                        {it.peserta} <span className="text-gold-light font-bold">({it.kodePeserta})</span>
                      </p>
                      {it.whatsapp && (
                        <p className="num text-[11px] font-semibold text-ok mt-0.5 truncate">
                          WA: {it.whatsapp}
                        </p>
                      )}

                      <div className="mt-2">
                        {isFinal && (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-ok">
                              Skor:
                            </span>
                            <span className="num font-title text-2xl font-black text-gold-light">
                              {it.skor}
                            </span>
                            <span className="text-[10px] font-bold text-muted">/100</span>
                          </div>
                        )}
                        {isDraft && (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-warn">
                              Draft:
                            </span>
                            <span className="num font-title text-xl font-black text-[#ffe28a]">
                              {it.skor}
                            </span>
                          </div>
                        )}
                        {isBelum && (
                          <p className="text-[11px] font-semibold text-[#ded7c8]">
                            Menunggu input nilai juri
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bagian Bawah Kartu: Tombol Aksi Penuh untuk Kemudahan Sentuhan */}
                <div className="mt-3.5 pt-2.5 border-t border-line/60">
                  {isBelum && (
                    <div className="flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-gold via-gold-light to-gold px-3 py-2 text-center text-xs font-black text-ink shadow-md group-hover:brightness-110">
                      <span>Input Nilai Sekarang ➔</span>
                    </div>
                  )}
                  {isDraft && (
                    <div className="flex items-center justify-center gap-1.5 rounded-lg border border-gold-dark bg-[#362a16] px-3 py-2 text-center text-xs font-black text-gold-light group-hover:bg-gold group-hover:text-ink transition-colors">
                      <span>Lanjutkan Penilaian ➔</span>
                    </div>
                  )}
                  {isFinal && (
                    <div className="flex items-center justify-between rounded-lg bg-[#18261c] px-3 py-1.5 text-xs font-bold text-[#a3f7bf] border border-ok/30">
                      <span>Nilai Terkunci</span>
                      <span className="text-gold-light font-extrabold">Lihat Detail ➔</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* 4. Navigasi Pagination Compact & Optimized Mobile */}
      {totalPages > 1 && (
        <div className="pt-4 border-t border-line/70">
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-line bg-panel2/90 p-2 sm:p-2.5 shadow-md">
            {/* Tombol Sebelumnya */}
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="btn btn-ghost btn-sm h-10 px-3 sm:px-4 font-bold text-xs sm:text-sm text-gold-light hover:bg-gold/20 disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Halaman sebelumnya"
            >
              ‹ Prev
            </button>

            {/* Pemilih Halaman Cepat (Dropdown Select & Info Slot) */}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-bold text-[#ded7c8] hidden xs:inline">
                Hal:
              </span>
              <div className="relative">
                <select
                  value={page}
                  onChange={(e) => goToPage(Number(e.target.value))}
                  className="select select-sm h-10 bg-panel border-2 border-gold/50 text-gold-light font-black text-xs sm:text-sm pl-2.5 pr-7 rounded-xl appearance-none cursor-pointer focus:border-gold shadow-sm"
                  aria-label="Pilih nomor halaman"
                >
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    const startSlot = (p - 1) * PAGE_SIZE + 1;
                    const endSlot = Math.min(p * PAGE_SIZE, filtered.length);
                    return (
                      <option key={p} value={p}>
                        {p} / {totalPages} (#{String(startSlot).padStart(3, "0")}–#{String(endSlot).padStart(3, "0")})
                      </option>
                    );
                  })}
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gold-light">
                  ▼
                </span>
              </div>
            </div>

            {/* Tombol Berikutnya */}
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="btn btn-ghost btn-sm h-10 px-3 sm:px-4 font-bold text-xs sm:text-sm text-gold-light hover:bg-gold/20 disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Halaman berikutnya"
            >
              Next ›
            </button>
          </div>

          <p className="mt-2 text-center text-[11px] font-medium text-[#ded7c8]">
            Menampilkan slot <strong>#{String(startIndex + 1).padStart(3, "0")}</strong> s/d <strong>#{String(Math.min(startIndex + PAGE_SIZE, filtered.length)).padStart(3, "0")}</strong> dari {filtered.length} total karya
          </p>
        </div>
      )}

      {/* 5. Floating Action Button (FAB) Scan QR Khusus Smartphone */}
      <button
        type="button"
        onClick={() => {
          try {
            if (navigator.vibrate) navigator.vibrate(40);
          } catch {}
          setScannerOpen(true);
        }}
        className="fixed bottom-5 right-4 z-30 sm:hidden flex items-center gap-2 rounded-full bg-gradient-to-r from-gold via-gold-light to-white text-ink px-5 py-3.5 shadow-2xl font-black text-sm tracking-wide border-2 border-[#1a1714] active:scale-95 transition-all duration-150"
        aria-label="Pindai QR Motor Peserta"
      >
        <span>Scan QR</span>
      </button>

      {/* Modal Pemindai QR Code Smartphone */}
      <QrScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
}
