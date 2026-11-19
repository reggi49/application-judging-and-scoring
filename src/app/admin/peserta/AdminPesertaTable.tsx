"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DeleteButton } from "@/components/DeleteButton";
import { deletePesertaAction } from "../actions";

export type AdminPesertaItem = {
  id: number;
  kodePeserta: string;
  nama: string;
  deskripsi: string | null;
  karyaCount: number;
  canDelete: boolean;
};

const PAGE_SIZE = 20;

export function AdminPesertaTable({ items }: { items: AdminPesertaItem[] }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (p) =>
        p.kodePeserta.toLowerCase().includes(needle) ||
        p.nama.toLowerCase().includes(needle) ||
        (p.deskripsi && p.deskripsi.toLowerCase().includes(needle)),
    );
  }, [items, q]);

  useEffect(() => {
    setPage(1);
  }, [q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const paginated = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const goToPage = (p: number) => {
    const validPage = Math.min(totalPages, Math.max(1, p));
    setPage(validPage);
  };

  return (
    <div className="space-y-4">
      {/* Kolom Pencarian Cepat */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 max-w-md w-full">
          <input
            className="input text-base py-2.5"
            placeholder="Cari ID akronim / nama bengkel peserta…"
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

        <div className="text-xs font-semibold text-[#ded7c8]">
          Menampilkan{" "}
          <strong className="text-white">
            {filtered.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, filtered.length)}
          </strong>{" "}
          dari total <strong className="text-white">{filtered.length}</strong> peserta
        </div>
      </div>

      {/* TAMPILAN 1: DESKTOP & TABLET (Tabel Sejajar Rapi) */}
      <div className="hidden sm:block card table-wrap shadow-xl">
        <table className="tbl">
          <thead>
            <tr>
              <th className="w-32">ID Akronim</th>
              <th>Nama Bengkel / Peserta</th>
              <th>Deskripsi / Kota</th>
              <th className="w-32 num text-center">Jumlah Karya</th>
              <th className="w-36 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-muted font-medium">
                  {items.length === 0
                    ? "Belum ada peserta terdaftar."
                    : "Tidak ada peserta yang cocok dengan pencarian."}
                </td>
              </tr>
            ) : (
              paginated.map((p) => (
                <tr key={p.id} className="hover:bg-gold/5 transition-colors">
                  <td className="num font-black text-lg text-gold-light tracking-wider whitespace-nowrap">
                    {p.kodePeserta}
                  </td>
                  <td className="font-bold text-white text-base">
                    {p.nama}
                  </td>
                  <td className="text-sm text-[#ded7c8] max-w-xs truncate">
                    {p.deskripsi || "—"}
                  </td>
                  <td className="num text-center">
                    <span className={`badge ${p.karyaCount > 0 ? "badge-gold" : ""}`}>
                      {p.karyaCount} karya
                    </span>
                  </td>
                  <td className="text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/peserta/${p.id}`} className="btn btn-ghost btn-sm text-xs font-bold">
                        Edit
                      </Link>
                      {p.canDelete && (
                        <DeleteButton
                          action={deletePesertaAction}
                          id={p.id}
                          confirm={`Hapus peserta ${p.kodePeserta}?`}
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

      {/* TAMPILAN 2: MOBILE SMARTPHONE (Kartu Mewah Eksekutif Khusus HP) */}
      <div className="sm:hidden space-y-3">
        {paginated.length === 0 ? (
          <div className="card p-8 text-center text-muted font-medium">
            Tidak ada peserta yang cocok dengan pencarian.
          </div>
        ) : (
          paginated.map((p) => (
            <div
              key={p.id}
              className="card p-4 space-y-3 border-2 border-line hover:border-gold-dark/60 transition-all shadow-md"
            >
              {/* Baris Atas: Akronim & Status Karya */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-title gold-text num text-2xl font-black tracking-wider">
                    {p.kodePeserta}
                  </span>
                  <div>
                    <h3 className="font-bold text-white text-base leading-snug">
                      {p.nama}
                    </h3>
                  </div>
                </div>

                <span className={`badge text-xs shrink-0 ${p.karyaCount > 0 ? "badge-gold" : ""}`}>
                  {p.karyaCount} karya
                </span>
              </div>

              {/* Baris Tengah: Deskripsi / Kota */}
              {p.deskripsi && (
                <p className="text-xs text-[#ded7c8] leading-relaxed italic bg-panel2/50 p-2.5 rounded-lg border border-line">
                  {p.deskripsi}
                </p>
              )}

              {/* Baris Bawah: Tombol Aksi */}
              <div className="flex items-center justify-end gap-2 border-t border-line/60 pt-2.5">
                <Link
                  href={`/admin/peserta/${p.id}`}
                  className="btn btn-gold btn-sm text-xs font-bold px-3 py-1.5"
                >
                  Edit Peserta ➔
                </Link>

                {p.canDelete && (
                  <DeleteButton
                    action={deletePesertaAction}
                    id={p.id}
                    confirm={`Hapus peserta ${p.kodePeserta}?`}
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* KONTROL PAGINATION (20 PER HALAMAN) */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center sm:justify-between gap-3 pt-2">
          <div className="hidden sm:block text-xs text-[#ded7c8]">
            Halaman <strong className="text-white">{page}</strong> dari <strong className="text-white">{totalPages}</strong> (20 peserta per halaman)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="btn btn-ghost btn-sm px-3 font-bold text-xs"
            >
              ‹ Sebelumnya
            </button>

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

