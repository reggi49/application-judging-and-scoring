"use client";

import { useMemo, useState } from "react";
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
  inputOleh: "JURI" | "ADMIN";
  catatan: string | null;
  updatedAtFormatted: string;
  details: NilaiDetailView[];
};

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

  const toggleAll = () => {
    if (expandedIds.size === filteredRows.length) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(filteredRows.map((r) => r.id)));
    }
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

  const allExpanded = filteredRows.length > 0 && expandedIds.size === filteredRows.length;

  return (
    <div className="space-y-4">
      {/* Kontrol Pencarian & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <input
            className="input text-base py-2.5"
            placeholder="🔍 Cari ID karya / peserta / nama juri…"
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

        <div className="flex flex-wrap items-center gap-2">
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
            onClick={toggleAll}
            className="btn btn-ghost btn-sm text-xs font-bold"
          >
            {allExpanded ? "▲ Tutup Semua Rincian" : "▼ Buka Semua Rincian"}
          </button>
        </div>
      </div>

      {/* Tabel Utama Rekap Nilai dengan Child Rows */}
      <div className="card table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th className="w-10 text-center">Rincian</th>
              <th>ID Karya</th>
              <th>Nama Karya & Peserta</th>
              <th>Dewan Juri</th>
              <th className="num text-center">Status</th>
              <th className="num text-right">Skor Total</th>
              <th className="text-center">Diinput Oleh</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted">
                  {rows.length === 0
                    ? "Belum ada nilai yang masuk dari dewan juri."
                    : "Tidak ada data nilai yang sesuai dengan pencarian/filter."}
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => {
                const isExpanded = expandedIds.has(r.id);
                return (
                  <tr key={r.id} className="group">
                    {/* Seluruh baris bisa diklik untuk buka/tutup child row */}
                    <td
                      colSpan={8}
                      className="p-0 border-b border-line"
                    >
                      {/* Baris Utama */}
                      <div
                        onClick={() => toggleRow(r.id)}
                        className={`flex flex-wrap items-center justify-between p-3.5 cursor-pointer transition-colors hover:bg-gold/10 ${
                          isExpanded ? "bg-gold/10 border-l-4 border-l-gold" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span
                            className={`grid h-7 w-7 place-items-center rounded-full border text-xs font-bold transition-transform ${
                              isExpanded
                                ? "rotate-90 border-gold bg-gold text-ink"
                                : "border-line bg-panel2 text-[#ded7c8]"
                            }`}
                          >
                            ▶
                          </span>

                          <div>
                            <div className="num font-bold text-lg text-gold-light tracking-wide">
                              {r.kodeKarya}
                            </div>
                            <div className="text-sm font-bold text-white">
                              {r.namaKarya}
                            </div>
                            <div className="text-xs text-[#ded7c8]">
                              Peserta: <strong className="text-white">{r.namaPeserta}</strong> ({r.kodePeserta})
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-2 sm:mt-0">
                          {/* Info Juri */}
                          <div className="text-left sm:text-right">
                            <div className="text-sm font-bold text-white">{r.namaJuri}</div>
                            <div className="text-xs text-gold-light font-semibold">Kode: {r.kodeJuri}</div>
                          </div>

                          {/* Status Badge */}
                          <div className="text-center">
                            <span
                              className={`badge ${
                                r.status === "FINAL" ? "badge-ok" : "badge-warn"
                              }`}
                            >
                              {r.status}
                            </span>
                          </div>

                          {/* Skor Total */}
                          <div className="text-right min-w-[70px]">
                            <span className="font-title text-xl font-black gold-text">
                              {r.skorJuriFormatted}
                            </span>
                          </div>

                          {/* Input Oleh */}
                          <div className="text-center">
                            <span
                              className={`badge text-[0.7rem] ${
                                r.inputOleh === "ADMIN" ? "badge-warn" : "badge-gold"
                              }`}
                            >
                              {r.inputOleh}
                            </span>
                          </div>

                          {/* Tombol Aksi */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2"
                          >
                            <button
                              type="button"
                              onClick={() => toggleRow(r.id)}
                              className="btn btn-ghost btn-sm text-xs font-semibold"
                            >
                              {isExpanded ? "Tutup ▲" : "Rincian ▼"}
                            </button>

                            {r.status === "FINAL" && fase === "PENJURIAN" && (
                              <form action={unlockPenilaianAction}>
                                <input type="hidden" name="id" value={r.id} />
                                <SubmitButton
                                  className="btn btn-ghost btn-sm text-xs text-warn font-bold"
                                  confirm={`Buka kunci nilai ${r.kodeKarya} oleh juri ${r.kodeJuri}? Nilai akan kembali ke DRAFT dan dapat diedit oleh juri.`}
                                >
                                  🔓 Buka Kunci
                                </SubmitButton>
                              </form>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* CHILD ROW — Rincian Nilai per Kriteria & Bobot */}
                      {isExpanded && (
                        <div className="border-t-2 border-gold-dark/40 bg-panel2/80 p-4 sm:p-6 shadow-inner animate-in fade-in duration-200">
                          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-2">
                            <div>
                              <h4 className="font-title text-base font-bold text-gold-light">
                                Rincian Penilaian Juri: {r.namaJuri} ({r.kodeJuri})
                              </h4>
                              <p className="text-xs text-[#ded7c8]">
                                Nilai mentah dihitung proporsional sesuai persentase bobot masing-masing kriteria.
                              </p>
                            </div>
                            <div className="text-right text-xs text-[#ded7c8]">
                              Waktu Penilaian: <strong className="text-white">{r.updatedAtFormatted}</strong>
                            </div>
                          </div>

                          {/* Tabel Rincian Nilai per Bobot */}
                          <div className="overflow-x-auto rounded-lg border border-line bg-panel shadow-sm">
                            <table className="w-full text-left text-sm">
                              <thead className="bg-[#1f1d18] text-xs font-bold uppercase text-gold-light border-b border-line">
                                <tr>
                                  <th className="py-2.5 px-3.5">Kriteria Penilaian</th>
                                  <th className="py-2.5 px-3.5 text-center">Bobot Resmi</th>
                                  <th className="py-2.5 px-3.5 text-center">Nilai Input Juri (0–100)</th>
                                  <th className="py-2.5 px-3.5 text-right font-black">Poin Berbobot</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-line/60">
                                {r.details.map((d) => (
                                  <tr key={d.id} className="hover:bg-gold/5">
                                    <td className="py-2.5 px-3.5 font-bold text-white">
                                      {d.kriteriaNama}
                                      <span className="block text-xs font-normal text-[#ded7c8]">
                                        Kode: {d.kriteriaKode}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3.5 text-center font-bold text-gold-light">
                                      <span className="badge badge-gold">{d.bobotPersen}%</span>
                                    </td>
                                    <td className="py-2.5 px-3.5 text-center num text-lg font-black text-white">
                                      {d.nilai}
                                    </td>
                                    <td className="py-2.5 px-3.5 text-right num text-base font-bold text-gold-light">
                                      <span className="text-xs text-[#ded7c8] font-normal mr-1.5">
                                        ({d.nilai} × {d.bobotPersen}%) =
                                      </span>
                                      <strong className="text-white text-lg">{d.poinFormatted}</strong> poin
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="bg-[#1f1d18] border-t-2 border-gold-dark/60">
                                <tr>
                                  <td colSpan={3} className="py-3 px-3.5 font-title text-right font-bold text-gold-light">
                                    TOTAL SKOR JURI:
                                  </td>
                                  <td className="py-3 px-3.5 text-right font-title text-2xl font-black gold-text">
                                    {r.skorJuriFormatted}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>

                          {/* Catatan Juri & Audit Log */}
                          <div className="mt-4 grid gap-3 sm:grid-cols-2 items-start">
                            <div className="rounded-lg border border-line bg-panel p-3">
                              <span className="text-xs font-bold uppercase tracking-wider text-gold-light">
                                Catatan Juri:
                              </span>
                              <p className="mt-1 text-sm text-white italic">
                                {r.catatan ? `"${r.catatan}"` : "Tidak ada catatan khusus dari dewan juri."}
                              </p>
                            </div>

                            <div className="rounded-lg border border-line bg-panel p-3 text-xs text-[#ded7c8]">
                              <span className="font-bold uppercase tracking-wider text-gold-light">
                                Status & Penginput:
                              </span>
                              <div className="mt-1 space-y-0.5">
                                <div>Status Nilai: <strong className="text-white">{r.status}</strong></div>
                                <div>Penginput: <strong className="text-white">{r.inputOleh === "ADMIN" ? "Admin (Mode Fallback)" : "Dewan Juri Langsung"}</strong></div>
                                <div>Terakhir Diperbarui: <strong className="text-white">{r.updatedAtFormatted}</strong></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
