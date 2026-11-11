"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { QrScannerModal } from "@/components/QrScannerModal";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";

type Item = {
  id: number;
  kode: string;
  nama: string;
  peserta: string;
  kodePeserta: string;
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
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"ALL" | Item["status"]>("ALL");
  const [page, setPage] = useState(1);
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleScanSuccess = (kodeKarya: string) => {
    setScannerOpen(false);
    // Langsung menuju ke detail dan lembar penilaian karya yang di-scan
    window.location.href = `/juri/karya/${encodeURIComponent(kodeKarya)}`;
  };

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
        it.kodePeserta.toLowerCase().includes(needle)
      );
    });
  }, [items, q, filter]);

  // Reset ke halaman 1 setiap kali query pencarian atau tab filter berganti
  useEffect(() => {
    setPage(1);
  }, [q, filter]);

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
    <div className="space-y-4 pb-20 sm:pb-6">
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
            onClick={() => setFilter(filter === "BELUM" ? "ALL" : "BELUM")}
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
            onClick={() => setFilter(filter === "DRAFT" ? "ALL" : "DRAFT")}
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
            onClick={() => setFilter(filter === "FINAL" ? "ALL" : "FINAL")}
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
        <div className="rounded-xl border-2 border-warn/70 bg-warn/15 px-4 py-3 text-sm font-bold text-warn flex items-center gap-2">
          <span className="text-xl">⚠️</span>
          <span>
            {fase === "PERSIAPAN"
              ? "Fase penjurian belum dibuka secara resmi oleh panitia."
              : "Fase penjurian telah ditutup. Seluruh skor terkunci."}
          </span>
        </div>
      )}

      {/* 2. Kontrol Pencarian & Tombol Pindai QR Utama */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              className="input text-base font-semibold py-3 pl-3.5 pr-10 shadow-inner"
              placeholder="🔍 Cari ID motor, nama, atau bengkel…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#ded7c8] hover:text-white"
                aria-label="Bersihkan pencarian"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="btn btn-gold shrink-0 gap-1.5 px-3.5 sm:px-5 py-3 shadow-lg active:scale-95 transition-transform"
            title="Pindai QR Code pada unit motor peserta"
          >
            <span className="text-xl">📷</span>
            <span className="font-extrabold text-sm sm:text-base">Scan QR</span>
          </button>
        </div>

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
                onClick={() => setFilter(k)}
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
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-base font-bold text-white">Tidak ada karya yang cocok</p>
          <p className="mt-1 text-xs text-[#ded7c8]">
            {q ? `Kata kunci "${q}" tidak ditemukan.` : "Tidak ada karya dalam filter ini."}
          </p>
          {(q || filter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setFilter("ALL");
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
                          <span>✓</span> FINAL
                        </span>
                      )}
                      {isDraft && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-warn/70 bg-warn/20 px-2.5 py-1 text-xs font-black text-[#ffe28a]">
                          <span>✎</span> DRAFT
                        </span>
                      )}
                      {isBelum && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-line bg-panel2/80 px-2.5 py-1 text-xs font-bold text-[#ded7c8]">
                          <span>○</span> BELUM
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
                          <span className="text-xl">🏍️</span>
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
                        🏢 {it.peserta} <span className="text-gold-light font-bold">({it.kodePeserta})</span>
                      </p>

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
                      <span>⭐</span>
                      <span>Input Nilai Sekarang ➔</span>
                    </div>
                  )}
                  {isDraft && (
                    <div className="flex items-center justify-center gap-1.5 rounded-lg border border-gold-dark bg-[#362a16] px-3 py-2 text-center text-xs font-black text-gold-light group-hover:bg-gold group-hover:text-ink transition-colors">
                      <span>✎</span>
                      <span>Lanjutkan Penilaian ➔</span>
                    </div>
                  )}
                  {isFinal && (
                    <div className="flex items-center justify-between rounded-lg bg-[#18261c] px-3 py-1.5 text-xs font-bold text-[#a3f7bf] border border-ok/30">
                      <span>✓ Nilai Terkunci</span>
                      <span className="text-gold-light font-extrabold">Lihat Detail ➔</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* 4. Navigasi Pagination 20 Item per Halaman */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-line/70">
          <div className="text-xs font-semibold text-[#ded7c8] order-2 sm:order-1">
            Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong> ({PAGE_SIZE} karya per halaman)
          </div>

          <div className="flex items-center gap-1.5 order-1 sm:order-2">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="btn btn-ghost btn-sm px-3 font-bold text-xs"
            >
              ‹ Sebelumnya
            </button>

            {/* Nomor Halaman */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => goToPage(p)}
                className={`min-w-8 h-8 rounded-md text-xs font-bold transition-all ${
                  page === p
                    ? "bg-gold text-ink shadow-md font-black"
                    : "bg-panel2 border border-line text-[#ded7c8] hover:text-white hover:border-gold"
                }`}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="btn btn-ghost btn-sm px-3 font-bold text-xs"
            >
              Berikutnya ›
            </button>
          </div>
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
        <span className="text-xl">📷</span>
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
