"use client";

import React, { useEffect, useMemo, useState } from "react";
import { SubmitButton } from "@/components/FormBits";
import { unlockPenilaianAction } from "../actions";

export type NilaiDetailView = {
  id: number;
  kriteriaId: number;
  nilai: number;
  kriteriaKode: string;
  kriteriaNama: string;
  bobotPersen: number;
  poinFormatted: string;
};

export type PenilaianRowView = {
  id: number;
  kodeKarya: string;
  namaKarya: string;
  namaPeserta: string;
  kodePeserta: string;
  kodeJuri: string;
  namaJuri: string;
  status: "FINAL" | "DRAFT";
  skorJuriFormatted: string;
  catatan: string | null;
  updatedAtFormatted: string;
  details: NilaiDetailView[];
};

const PAGE_SIZE = 20;

export function RekapNilaiTable({
  rows,
  fase,
}: {
  rows: PenilaianRowView[];
  fase: "PERSIAPAN" | "PENJURIAN" | "SELESAI";
}) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "FINAL" | "DRAFT">("ALL");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);

  const toggleRow = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredRows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (!needle) return true;
      return (
        r.kodeKarya.toLowerCase().includes(needle) ||
        r.namaKarya.toLowerCase().includes(needle) ||
        r.namaPeserta.toLowerCase().includes(needle) ||
        r.kodePeserta.toLowerCase().includes(needle) ||
        r.kodeJuri.toLowerCase().includes(needle) ||
        r.namaJuri.toLowerCase().includes(needle)
      );
    });
  }, [rows, q, statusFilter]);

  // Reset ke halaman 1 setiap kali query pencarian atau filter status berganti
  useEffect(() => {
    setPage(1);
  }, [q, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + PAGE_SIZE);

  const goToPage = (p: number) => {
    const valid = Math.min(totalPages, Math.max(1, p));
    setPage(valid);
  };

  const allExpanded = paginatedRows.length > 0 && paginatedRows.every((r) => expandedIds.has(r.id));

  const toggleAllOnPage = () => {
    if (allExpanded) {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        for (const r of paginatedRows) next.delete(r.id);
        return next;
      });
    } else {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        for (const r of paginatedRows) next.add(r.id);
        return next;
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Kontrol Pencarian & Filter Status */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 max-w-md w-full">
          <input
            className="input text-base py-2.5"
            placeholder="🔍 Cari ID karya / peserta / juri…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="btn btn-ghost btn-sm"
              aria-label="Bersihkan pencarian"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex rounded-lg border border-line bg-panel2 p-1">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`rounded px-3 py-1.5 text-xs font-bold transition-all ${
                statusFilter === "ALL" ? "bg-gold text-ink" : "text-[#ded7c8] hover:text-white"
              }`}
            >
              Semua ({rows.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("FINAL")}
              className={`rounded px-3 py-1.5 text-xs font-bold transition-all ${
                statusFilter === "FINAL" ? "bg-ok text-ink" : "text-[#ded7c8] hover:text-white"
              }`}
            >
              Final ({rows.filter((r) => r.status === "FINAL").length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("DRAFT")}
              className={`rounded px-3 py-1.5 text-xs font-bold transition-all ${
                statusFilter === "DRAFT" ? "bg-warn text-ink" : "text-[#ded7c8] hover:text-white"
              }`}
            >
              Draft ({rows.filter((r) => r.status === "DRAFT").length})
            </button>
          </div>

          <button
            type="button"
            onClick={toggleAllOnPage}
            className="btn btn-ghost btn-sm text-xs font-bold"
          >
            {allExpanded ? "▲ Tutup Rincian" : "▼ Buka Rincian"}
          </button>
        </div>
      </div>

      {/* Indikator Status Menampilkan */}
      <div className="text-xs font-semibold text-[#ded7c8]">
        Menampilkan <strong>{filteredRows.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, filteredRows.length)}</strong> dari total <strong>{filteredRows.length}</strong> penilaian juri
        {filteredRows.length > PAGE_SIZE && <span> (20 baris per halaman)</span>}
      </div>

      {/* TAMPILAN 1: DESKTOP & TABLET (Tabel Rapi Sejajar + Child Row Expandable) */}
      <div className="hidden sm:block card table-wrap shadow-xl">
        <table className="tbl">
          <thead>
            <tr>
              <th className="w-12 text-center">Rincian</th>
              <th className="w-36">ID Karya</th>
              <th>Nama Karya & Peserta</th>
              <th className="w-44">Dewan Juri</th>
              <th className="w-28 text-center">Status</th>
              <th className="w-32 num text-right">Skor Total</th>
              <th className="w-48 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-muted font-medium">
                  {rows.length === 0
                    ? "Belum ada nilai yang masuk dari dewan juri."
                    : "Tidak ada data nilai yang sesuai dengan pencarian/filter."}
                </td>
              </tr>
            ) : (
              paginatedRows.map((r) => {
                const isExpanded = expandedIds.has(r.id);
                return (
                  <React.Fragment key={r.id}>
                    {/* Baris Data Utama — Kolom Sejajar Sempurna */}
                    <tr
                      onClick={() => toggleRow(r.id)}
                      className={`cursor-pointer transition-colors hover:bg-gold/10 ${
                        isExpanded ? "bg-gold/10 border-l-4 border-l-gold" : ""
                      }`}
                    >
                      {/* Kolom Caret Rincian */}
                      <td className="text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(r.id);
                          }}
                          className={`grid h-7 w-7 place-items-center rounded-full border text-xs font-bold transition-transform ${
                            isExpanded
                              ? "rotate-90 border-gold bg-gold text-ink"
                              : "border-line bg-panel2 text-[#ded7c8] hover:border-gold-light"
                          }`}
                          aria-label={isExpanded ? "Tutup rincian" : "Buka rincian"}
                        >
                          ▶
                        </button>
                      </td>

                      {/* Kolom ID Karya */}
                      <td className="num font-black text-lg text-gold-light tracking-wide whitespace-nowrap">
                        {r.kodeKarya}
                      </td>

                      {/* Kolom Nama Karya & Peserta */}
                      <td>
                        <div className="font-bold text-base text-white">{r.namaKarya}</div>
                        <div className="text-xs text-[#ded7c8]">
                          Peserta: <strong className="text-white">{r.namaPeserta}</strong>{" "}
                          <span className="text-gold-light font-semibold">({r.kodePeserta})</span>
                        </div>
                      </td>

                      {/* Kolom Dewan Juri */}
                      <td>
                        <div className="font-bold text-white text-sm">{r.namaJuri}</div>
                        <div className="text-xs text-gold-light font-semibold">Kode: {r.kodeJuri}</div>
                      </td>

                      {/* Kolom Status */}
                      <td className="text-center">
                        <span
                          className={`badge ${
                            r.status === "FINAL" ? "badge-ok" : "badge-warn"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>

                      {/* Kolom Skor Total */}
                      <td className="num text-right">
                        <span className="font-title text-2xl font-black gold-text">
                          {r.skorJuriFormatted}
                        </span>
                      </td>

                      {/* Kolom Aksi */}
                      <td className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => toggleRow(r.id)}
                            className={`btn btn-sm text-xs font-bold ${
                              isExpanded ? "btn-gold shadow" : "btn-ghost"
                            }`}
                          >
                            {isExpanded ? "Tutup ▲" : "Rincian ▼"}
                          </button>

                          {r.status === "FINAL" && fase === "PENJURIAN" && (
                            <form action={unlockPenilaianAction}>
                              <input type="hidden" name="id" value={r.id} />
                              <SubmitButton
                                className="btn btn-ghost btn-sm text-xs text-warn font-bold hover:bg-warn/20"
                                confirm={`Buka kunci nilai ${r.kodeKarya} oleh juri ${r.kodeJuri}? Nilai akan kembali ke DRAFT.`}
                              >
                                🔓 Buka Kunci
                              </SubmitButton>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* CHILD ROW — Rincian Lengkap per Kriteria & Bobot */}
                    {isExpanded && (
                      <tr className="border-b-2 border-gold-dark/60">
                        <td colSpan={7} className="bg-[#1f1d19] p-4 sm:p-6 shadow-inner">
                          <div className="rounded-xl border border-line bg-panel p-5 shadow-lg">
                            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
                              <div>
                                <h4 className="font-title gold-text text-lg font-bold">
                                  Rincian Penilaian Juri: {r.namaJuri} ({r.kodeJuri})
                                </h4>
                                <p className="text-xs text-[#ded7c8] mt-0.5">
                                  Komposisi nilai mentah per kriteria dan poin terbobot resmi RWSA 2026.
                                </p>
                              </div>
                              <div className="text-right text-xs text-[#ded7c8]">
                                Waktu Penilaian: <strong className="text-white">{r.updatedAtFormatted}</strong>
                              </div>
                            </div>

                            {/* Sub-tabel Rincian Kriteria */}
                            <div className="overflow-x-auto rounded-lg border border-line bg-[#1c1a17]">
                              <table className="w-full text-left">
                                <thead className="bg-[#26231d] text-xs font-bold uppercase tracking-wider text-gold-light border-b border-line">
                                  <tr>
                                    <th className="py-3 px-4">Kriteria Penilaian</th>
                                    <th className="py-3 px-4 text-center">Bobot Resmi</th>
                                    <th className="py-3 px-4 text-center">Nilai Juri (0–100)</th>
                                    <th className="py-3 px-4 text-right">Poin Berbobot</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-line/60">
                                  {r.details.map((d) => (
                                    <tr key={d.id} className="hover:bg-gold/5 transition-colors">
                                      <td className="py-3 px-4">
                                        <div className="font-bold text-white text-base">{d.kriteriaNama}</div>
                                        <div className="text-xs text-gold-light font-medium">Kode: {d.kriteriaKode}</div>
                                      </td>
                                      <td className="py-3 px-4 text-center">
                                        <span className="badge badge-gold font-bold text-xs">{d.bobotPersen}%</span>
                                      </td>
                                      <td className="py-3 px-4 text-center num text-xl font-black text-white">
                                        {d.nilai}
                                      </td>
                                      <td className="py-3 px-4 text-right num text-base">
                                        <span className="text-xs text-[#ded7c8] font-normal mr-2">
                                          ({d.nilai} × {d.bobotPersen}%) =
                                        </span>
                                        <strong className="text-white text-lg font-bold">{d.poinFormatted}</strong>{" "}
                                        <span className="text-xs text-gold-light font-semibold">poin</span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot className="bg-[#26231d] border-t-2 border-gold-dark/60">
                                  <tr>
                                    <td colSpan={3} className="py-3.5 px-4 font-title text-right font-bold text-gold-light text-base tracking-wide">
                                      TOTAL SKOR JURI:
                                    </td>
                                    <td className="py-3.5 px-4 text-right font-title text-3xl font-black gold-text">
                                      {r.skorJuriFormatted}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>

                            {/* Catatan Juri jika ada */}
                            {r.catatan && (
                              <div className="mt-4 rounded-lg border border-gold-dark/40 bg-gold/5 p-3.5">
                                <span className="text-xs font-bold uppercase tracking-wider text-gold-light block">
                                  Catatan Dewan Juri:
                                </span>
                                <p className="mt-1 text-sm text-white italic">
                                  &quot;{r.catatan}&quot;
                                </p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* TAMPILAN 2: MOBILE SMARTPHONE (< 640px) — Kartu Responsif Mewah */}
      <div className="sm:hidden space-y-3">
        {filteredRows.length === 0 ? (
          <div className="card p-6 text-center text-muted">
            Tidak ada data penilaian yang cocok.
          </div>
        ) : (
          paginatedRows.map((r) => {
            const isExpanded = expandedIds.has(r.id);
            return (
              <div
                key={r.id}
                className={`card p-4 space-y-3 transition-all ${
                  isExpanded ? "border-gold bg-panel/95" : "border-line"
                }`}
              >
                {/* Header Kartu Mobile */}
                <div className="flex items-start justify-between gap-2 border-b border-line pb-2.5">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#ded7c8]">
                      ID Penilaian
                    </span>
                    <h3 className="font-title text-lg font-black text-gold-light">
                      {r.kodeKarya}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="badge badge-gold font-bold text-[11px]">
                      {r.kodeJuri}
                    </span>
                    <span
                      className={`badge text-[11px] font-bold ${
                        r.status === "FINAL" ? "badge-ok" : "badge-warn"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                </div>

                {/* Konten Karya & Juri */}
                <div>
                  <h4 className="font-bold text-white text-base leading-tight">{r.namaKarya}</h4>
                  <p className="text-xs text-[#ded7c8] mt-0.5">
                    Bengkel: <strong className="text-white">{r.namaPeserta}</strong> ({r.kodePeserta})
                  </p>
                  <p className="text-xs text-gold-light mt-1 font-semibold">
                    Dewan Juri: <span className="text-white">{r.namaJuri}</span>
                  </p>
                </div>

                {/* Skor & Tombol Aksi */}
                <div className="flex items-center justify-between pt-2 border-t border-line/60">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#ded7c8] block">
                      Total Skor
                    </span>
                    <span className="font-title text-2xl font-black gold-text">
                      {r.skorJuriFormatted}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleRow(r.id)}
                      className={`btn btn-sm text-xs font-bold ${
                        isExpanded ? "btn-gold shadow" : "btn-ghost"
                      }`}
                    >
                      {isExpanded ? "Tutup ▲" : "Rincian Nilai ▼"}
                    </button>

                    {r.status === "FINAL" && fase === "PENJURIAN" && (
                      <form action={unlockPenilaianAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <SubmitButton
                          className="btn btn-ghost btn-sm text-xs text-warn font-bold"
                          confirm={`Buka kunci nilai ${r.kodeKarya} oleh juri ${r.kodeJuri}?`}
                        >
                          🔓
                        </SubmitButton>
                      </form>
                    )}
                  </div>
                </div>

                {/* Detail Breakdown Saat Di-expand di Mobile */}
                {isExpanded && (
                  <div className="rounded-xl border border-gold-dark/60 bg-[#1a1714] p-3 space-y-2 mt-2">
                    <div className="text-xs font-bold text-gold-light border-b border-line pb-1.5 flex justify-between">
                      <span>Rincian Bobot ({r.kodeJuri})</span>
                      <span className="text-[10px] text-[#ded7c8]">{r.updatedAtFormatted}</span>
                    </div>

                    <div className="space-y-2 pt-1">
                      {r.details.map((d) => (
                        <div key={d.id} className="flex items-center justify-between text-xs border-b border-line/40 pb-1">
                          <div>
                            <span className="font-bold text-white block">{d.kriteriaNama}</span>
                            <span className="text-[10px] text-gold-light">Bobot {d.bobotPersen}% · Nilai: {d.nilai}</span>
                          </div>
                          <div className="text-right num font-black text-white">
                            {d.poinFormatted} <span className="text-[10px] text-gold-light">poin</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {r.catatan && (
                      <div className="mt-2 text-xs text-[#ded7c8] bg-panel2/70 p-2 rounded border border-line">
                        <strong className="text-gold-light">Catatan:</strong> &quot;{r.catatan}&quot;
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Kontrol Pagination — HANYA TAMPIL JIKA DATA MELEBIHI 20 BARIS */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-line/70">
          <div className="text-xs font-semibold text-[#ded7c8] order-2 sm:order-1">
            Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong> (20 baris per halaman)
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
    </div>
  );
}
