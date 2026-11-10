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
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="font-title gold-text text-2xl font-bold sm:text-3xl">Daftar Karya</h1>
          <p className="text-sm text-muted">
            Juri: <span className="font-medium text-cream">{juriNama}</span> ({juriKode})
          </p>
        </div>
        <div className="text-right">
          <p className="num font-title gold-text text-2xl font-bold">
            {counts.FINAL}/{counts.total}
          </p>
          <p className="text-xs text-muted">karya final ({pct}%)</p>
        </div>
      </div>

      {/* Bar progres */}
      <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-panel2">
        <div className="h-full bg-gradient-to-r from-gold-dark via-gold to-gold-light transition-all" style={{ width: `${pct}%` }} />
      </div>

      {fase !== "PENJURIAN" && (
        <p className="mb-4 rounded-md border border-warn/50 bg-warn/10 px-3 py-2 text-sm text-warn">
          {fase === "PERSIAPAN" ? "Penjurian belum dibuka oleh panitia." : "Penjurian telah selesai."}
        </p>
      )}

      {/* Pencarian & Filter */}
      <div className="mb-4 space-y-2">
        <input
          className="input"
          placeholder="Cari ID karya / nama / peserta…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {(
            [
              ["ALL", `Semua (${counts.total})`],
              ["BELUM", `Belum (${counts.BELUM})`],
              ["DRAFT", `Draft (${counts.DRAFT})`],
              ["FINAL", `Final (${counts.FINAL})`],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={`btn btn-sm shrink-0 ${filter === k ? "btn-gold" : "btn-ghost"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Daftar karya */}
      {filtered.length === 0 ? (
        <div className="card p-8 text-center text-muted">Tidak ada karya yang cocok.</div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((it) => {
            const b = STATUS_BADGE[it.status];
            return (
              <li key={it.id}>
                <Link
                  href={`/juri/karya/${it.kode}`}
                  className="card block p-3 transition-colors hover:border-gold-dark hover:bg-gold/5"
                >
                  <div className="flex gap-3">
                    <div className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-md bg-panel">
                      {it.coverId ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/foto/${it.coverId}?t=1`}
                          alt={it.nama}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-xs text-muted">tanpa foto</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <span className="num font-title text-base font-bold text-gold-light">{it.kode}</span>
                        <span className={`badge ${b.cls}`}>{b.text}</span>
                      </div>
                      <p className="mt-1 truncate font-semibold text-cream">{it.nama}</p>
                      <p className="truncate text-xs text-muted">
                        {it.peserta} <span className="text-gold-dark">({it.kodePeserta})</span>
                      </p>
                      {it.skor && (
                        <p className="num gold-text mt-2 text-right font-title text-xl font-bold">
                          {it.skor}
                        </p>
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

