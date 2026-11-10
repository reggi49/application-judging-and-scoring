"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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

const STATUS_BADGE: Record<Item["status"], { text: string; cls: string }> = {
  BELUM: { text: "Belum dinilai", cls: "" },
  DRAFT: { text: "Draft", cls: "badge-warn" },
  FINAL: { text: "Final", cls: "badge-ok" },
};

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

  const pct = counts.total > 0 ? Math.round((counts.FINAL / counts.total) * 100) : 0;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="font-title gold-text text-3xl font-extrabold sm:text-4xl">Daftar Karya Motor</h1>
          <p className="mt-1 text-sm font-semibold text-[#ded7c8]">
            Dewan Juri: <span className="font-bold text-white text-base">{juriNama}</span> ({juriKode})
          </p>
        </div>
        <div className="text-right">
          <p className="num font-title gold-text text-3xl font-black">
            {counts.FINAL}/{counts.total}
          </p>
          <p className="text-xs font-bold text-gold-light uppercase tracking-wider">Karya Final ({pct}%)</p>
        </div>
      </div>

      {/* Bar progres — cerah & kontras */}
      <div className="mb-6 h-3 w-full overflow-hidden rounded-full bg-panel2 border border-line">
        <div className="h-full bg-gradient-to-r from-gold via-gold-light to-white transition-all shadow-md" style={{ width: `${pct}%` }} />
      </div>

      {fase !== "PENJURIAN" && (
        <p className="mb-4 rounded-xl border-2 border-warn/60 bg-warn/15 px-4 py-3 text-sm font-bold text-warn">
          {fase === "PERSIAPAN" ? "Penjurian belum dibuka oleh panitia." : "Penjurian telah selesai."}
        </p>
      )}

      {/* Pencarian & Filter */}
      <div className="mb-5 space-y-3">
        <input
          className="input text-base font-medium py-3"
          placeholder="🔍 Cari ID karya / nama / bengkel peserta…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {(
            [
              ["ALL", `Semua (${counts.total})`],
              ["BELUM", `Belum Dinilai (${counts.BELUM})`],
              ["DRAFT", `Draft (${counts.DRAFT})`],
              ["FINAL", `Final (${counts.FINAL})`],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={`btn btn-sm shrink-0 font-bold ${filter === k ? "btn-gold shadow-md" : "btn-ghost"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Daftar karya */}
      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-base font-semibold text-[#ded7c8]">
          Tidak ada karya yang cocok dengan pencarian.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((it) => {
            const b = STATUS_BADGE[it.status];
            return (
              <li key={it.id}>
                <Link
                  href={`/juri/karya/${it.kode}`}
                  className="card block p-4 transition-all hover:border-gold hover:shadow-xl hover:translate-y-[-2px]"
                >
                  <div className="flex gap-3.5">
                    <div className="relative aspect-[4/3] w-32 shrink-0 overflow-hidden rounded-lg bg-panel2 border border-line">
                      {it.coverId ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/foto/${it.coverId}?t=1`}
                          alt={it.nama}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-xs font-semibold text-[#ded7c8]">tanpa foto</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <span className="num font-title text-lg font-black text-gold-light tracking-wide">{it.kode}</span>
                          <span className={`badge ${b.cls}`}>{b.text}</span>
                        </div>
                        <p className="mt-1 text-base font-bold text-white line-clamp-1">{it.nama}</p>
                        <p className="text-xs font-semibold text-[#ded7c8] line-clamp-1 mt-0.5">
                          {it.peserta} <span className="text-gold-light font-bold">({it.kodePeserta})</span>
                        </p>
                      </div>
                      {it.skor ? (
                        <p className="num gold-text mt-2 text-right font-title text-2xl font-black">
                          {it.skor}
                        </p>
                      ) : (
                        <p className="text-right text-xs font-bold text-gold-light mt-2">Buka Nilai ➔</p>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

