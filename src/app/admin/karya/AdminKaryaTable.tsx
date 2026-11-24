"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DeleteButton } from "@/components/DeleteButton";
import { deleteKaryaAction } from "../actions";

export type AdminKaryaItem = {
  id: number;
  kodeKarya: string;
  namaKarya: string;
  pesertaNama: string;
  pesertaKode: string;
  whatsapp: string | null;
  coverFotoId: number | null;
  fotoCount: number;
  penilaianCount: number;
};

const PAGE_SIZE = 20;

export function AdminKaryaTable({ items }: { items: AdminKaryaItem[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"ALL" | "WITH_FOTO" | "NO_FOTO" | "JUDGED">("ALL");
  const [page, setPage] = useState(1);

  const counts = useMemo(() => {
    let withFoto = 0;
    let noFoto = 0;
    let judged = 0;
    for (const it of items) {
      if (it.fotoCount > 0) withFoto++;
      else noFoto++;
      if (it.penilaianCount > 0) judged++;
    }
    return { all: items.length, withFoto, noFoto, judged };
  }, [items]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((it) => {
      if (filter === "WITH_FOTO" && it.fotoCount === 0) return false;
      if (filter === "NO_FOTO" && it.fotoCount > 0) return false;
      if (filter === "JUDGED" && it.penilaianCount === 0) return false;
      if (!needle) return true;
      return (
        it.kodeKarya.toLowerCase().includes(needle) ||
        it.namaKarya.toLowerCase().includes(needle) ||
        it.pesertaNama.toLowerCase().includes(needle) ||
        it.pesertaKode.toLowerCase().includes(needle) ||
        (it.whatsapp ?? "").includes(needle)
      );
    });
  }, [items, q, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const paginated = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const handleQChange = (val: string) => {
    setQ(val);
    setPage(1);
  };

  const handleFilterChange = (next: "ALL" | "WITH_FOTO" | "NO_FOTO" | "JUDGED") => {
    setFilter(next);
    setPage(1);
  };

  const goToPage = (p: number) => {
    const validPage = Math.min(totalPages, Math.max(1, p));
    setPage(validPage);
  };

  return (
    <div className="space-y-4">
      {/* Kontrol Pencarian & Filter Cepat */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 max-w-md w-full">
          <input
            className="input text-base py-2.5"
            placeholder="Cari ID / nama karya / bengkel…"
            value={q}
            onChange={(e) => handleQChange(e.target.value)}
          />
          {q && (
            <button
              type="button"
              onClick={() => handleQChange("")}
              className="btn btn-ghost btn-sm"
              aria-label="Bersihkan pencarian"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex flex-wrap rounded-lg border border-line bg-panel2 p-1 w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={() => handleFilterChange("ALL")}
              className={`rounded px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all ${
                filter === "ALL" ? "bg-gold text-ink" : "text-[#ded7c8] hover:text-white"
              }`}
            >
              Semua ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange("JUDGED")}
              className={`rounded px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all ${
                filter === "JUDGED" ? "bg-ok text-ink" : "text-[#ded7c8] hover:text-white"
              }`}
            >
              Dinilai ({counts.judged})
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange("WITH_FOTO")}
              className={`rounded px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all ${
                filter === "WITH_FOTO" ? "bg-gold-light text-ink" : "text-[#ded7c8] hover:text-white"
              }`}
            >
              Foto ({counts.withFoto})
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange("NO_FOTO")}
              className={`rounded px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all ${
                filter === "NO_FOTO" ? "bg-warn text-ink" : "text-[#ded7c8] hover:text-white"
              }`}
            >
              Tanpa Foto ({counts.noFoto})
            </button>
          </div>
        </div>
      </div>

      {/* Ringkasan & Info Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#ded7c8]">
        <div>
          Menampilkan{" "}
          <strong className="text-white">
            {filtered.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, filtered.length)}
          </strong>{" "}
          dari total <strong className="text-white">{filtered.length}</strong> karya
          {filtered.length !== items.length && ` (disaring dari ${items.length})`}
        </div>

        <div className="text-gold-light font-bold">
          Halaman {page} dari {totalPages}
        </div>
      </div>

      {/* TAMPILAN 1: DESKTOP & TABLET (Tabel Rapi Sejajar) */}
      <div className="hidden sm:block card table-wrap shadow-xl">
        <table className="tbl">
          <thead>
            <tr>
              <th className="w-16">Foto</th>
              <th className="w-36">ID Karya</th>
              <th>Nama Karya</th>
              <th>Peserta (Bengkel)</th>
              <th className="w-32 num text-center">Foto (Maks 5)</th>
              <th className="w-32 num text-center">Juri Selesai</th>
              <th className="w-32 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-muted font-medium">
                  Tidak ada karya yang cocok dengan pencarian.
                </td>
              </tr>
            ) : (
              paginated.map((k) => (
                <tr key={k.id} className="hover:bg-gold/5 transition-colors">
                  <td>
                    <div className="relative aspect-[4/3] w-14 overflow-hidden rounded bg-panel2 border border-line">
                      {k.coverFotoId ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/foto/${k.coverFotoId}?t=1`}
                          alt={k.namaKarya}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-[0.65rem] text-[#ded7c8]">
                          N/A
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="num font-black text-lg text-gold-light tracking-wide whitespace-nowrap">
                    {k.kodeKarya}
                  </td>
                  <td className="font-bold text-white text-base">
                    {k.namaKarya}
                  </td>
                  <td>
                    <div className="font-semibold text-white">{k.pesertaNama}</div>
                    <div className="text-xs text-gold-light font-semibold">
                      ({k.pesertaKode}){k.whatsapp ? ` · WA: ${k.whatsapp}` : ""}
                    </div>
                  </td>
                  <td className="num text-center">
                    <span className={`badge ${k.fotoCount > 0 ? "badge-gold" : "badge-warn"}`}>
                      {k.fotoCount}/5 foto
                    </span>
                  </td>
                  <td className="num text-center">
                    <span className={`badge ${k.penilaianCount >= 3 ? "badge-ok" : k.penilaianCount > 0 ? "badge-warn" : ""}`}>
                      {k.penilaianCount} juri
                    </span>
                  </td>
                  <td className="text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/karya/${k.id}`} className="btn btn-ghost btn-sm text-xs font-bold">
                        Kelola
                      </Link>
                      {k.penilaianCount === 0 && (
                        <DeleteButton
                          action={deleteKaryaAction}
                          id={k.id}
                          confirm={`Hapus karya ${k.kodeKarya}?`}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* TAMPILAN 2: MOBILE SMARTPHONE (Kartu Eksekutif Khusus HP) */}
      <div className="sm:hidden space-y-3">
        {paginated.length === 0 ? (
          <div className="card p-8 text-center text-muted font-medium">
            Tidak ada karya yang cocok dengan pencarian.
          </div>
        ) : (
          paginated.map((k) => (
            <div
              key={k.id}
              className="card p-4 space-y-3 border-2 border-line hover:border-gold-dark/60 transition-all shadow-md"
            >
              {/* Baris Atas: Foto Thumbnail & Identitas Utama */}
              <div className="flex items-start gap-3">
                <div className="relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-lg bg-panel2 border border-line shadow-sm">
                  {k.coverFotoId ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/foto/${k.coverFotoId}?t=1`}
                      alt={k.namaKarya}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-[0.65rem] text-[#ded7c8]">
                      N/A
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="num font-black text-base text-gold-light tracking-wide">
                      {k.kodeKarya}
                    </span>
                    <span
                      className={`badge text-[0.68rem] ${
                        k.penilaianCount >= 3 ? "badge-ok" : k.penilaianCount > 0 ? "badge-warn" : ""
                      }`}
                    >
                      {k.penilaianCount > 0 ? `${k.penilaianCount} juri` : "Belum dinilai"}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base leading-tight mt-0.5 line-clamp-1">
                    {k.namaKarya}
                  </h3>

                  <p className="text-xs text-[#ded7c8] mt-0.5 line-clamp-1">
                    Nama: <strong className="text-white">{k.pesertaNama}</strong>{" "}
                    <span className="text-gold-light">({k.pesertaKode})</span>
                  </p>
                  {k.whatsapp && (
                    <p className="num text-[11px] font-semibold text-ok mt-0.5">
                      WA: {k.whatsapp}
                    </p>
                  )}
                </div>
              </div>

              {/* Baris Bawah: Info Foto & Tombol Aksi HP */}
              <div className="flex items-center justify-between border-t border-line/60 pt-2.5">
                <span className={`badge text-xs ${k.fotoCount > 0 ? "badge-gold" : "badge-warn"}`}>
                  {k.fotoCount}/5 foto
                </span>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/karya/${k.id}`}
                    className="btn btn-gold btn-sm text-xs font-bold px-3 py-1.5"
                  >
                    Kelola Karya ➔
                  </Link>

                  {k.penilaianCount === 0 && (
                    <DeleteButton
                      action={deleteKaryaAction}
                      id={k.id}
                      confirm={`Hapus karya ${k.kodeKarya}?`}
                    />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* KONTROL PAGINATION COMPACT & MOBILE OPTIMIZED */}
      {totalPages > 1 && (
        <div className="pt-3 border-t border-line/70">
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-line bg-panel2/90 p-2 sm:p-2.5 shadow-md">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="btn btn-ghost btn-sm h-10 px-3 sm:px-4 font-bold text-xs sm:text-sm text-gold-light hover:bg-gold/20 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              ‹ Sebelumnya
            </button>

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
                        Hal {p} dari {totalPages} (#{String(startSlot).padStart(3, "0")}–#{String(endSlot).padStart(3, "0")})
                      </option>
                    );
                  })}
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gold-light">
                  ▼
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="btn btn-ghost btn-sm h-10 px-3 sm:px-4 font-bold text-xs sm:text-sm text-gold-light hover:bg-gold/20 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              Berikutnya ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
