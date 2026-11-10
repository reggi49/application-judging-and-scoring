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
  coverFotoId: number | null;
  fotoCount: number;
  penilaianCount: number;
};

export function AdminKaryaTable({ items }: { items: AdminKaryaItem[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"ALL" | "WITH_FOTO" | "NO_FOTO" | "JUDGED">("ALL");

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
        it.pesertaKode.toLowerCase().includes(needle)
      );
    });
  }, [items, q, filter]);

  return (
    <div className="space-y-4">
      {/* Kontrol Pencarian & Filter Cepat */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <input
            className="input text-base py-2.5"
            placeholder="🔍 Cari dari 100 karya (ID / nama / bengkel)…"
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
              onClick={() => setFilter("ALL")}
              className={`rounded px-3 py-1.5 text-xs font-bold transition-all ${
                filter === "ALL" ? "bg-gold text-ink" : "text-[#ded7c8] hover:text-white"
              }`}
            >
              Semua ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setFilter("JUDGED")}
              className={`rounded px-3 py-1.5 text-xs font-bold transition-all ${
                filter === "JUDGED" ? "bg-ok text-ink" : "text-[#ded7c8] hover:text-white"
              }`}
            >
              Sudah Dinilai ({counts.judged})
            </button>
            <button
              type="button"
              onClick={() => setFilter("WITH_FOTO")}
              className={`rounded px-3 py-1.5 text-xs font-bold transition-all ${
                filter === "WITH_FOTO" ? "bg-gold-light text-ink" : "text-[#ded7c8] hover:text-white"
              }`}
            >
              Ada Foto ({counts.withFoto})
            </button>
            <button
              type="button"
              onClick={() => setFilter("NO_FOTO")}
              className={`rounded px-3 py-1.5 text-xs font-bold transition-all ${
                filter === "NO_FOTO" ? "bg-warn text-ink" : "text-[#ded7c8] hover:text-white"
              }`}
            >
              Tanpa Foto ({counts.noFoto})
            </button>
          </div>
        </div>
      </div>

      <div className="text-xs font-semibold text-[#ded7c8]">
        Menampilkan <strong>{filtered.length}</strong> dari total <strong>{items.length}</strong> karya
      </div>

      {/* Tabel Karya */}
      <div className="card table-wrap shadow-xl">
        <table className="tbl">
          <thead>
            <tr>
              <th className="w-16">Foto</th>
              <th className="w-36">ID Karya</th>
              <th>Nama Karya</th>
              <th>Peserta (Bengkel)</th>
              <th className="w-28 num text-center">Foto (Maks 5)</th>
              <th className="w-28 num text-center">Juri Selesai</th>
              <th className="w-36 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-muted font-medium">
                  Tidak ada karya yang cocok dengan pencarian.
                </td>
              </tr>
            ) : (
              filtered.map((k) => (
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
                    <div className="text-xs text-gold-light font-semibold">({k.pesertaKode})</div>
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
    </div>
  );
}

