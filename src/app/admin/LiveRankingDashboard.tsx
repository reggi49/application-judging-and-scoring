"use client";

import { useActionState, useEffect, useState } from "react";
import type { RankingData } from "@/lib/ranking";
import type { RankRow } from "@/lib/scoring";
import { setFaseAction } from "./actions";
import { FormMessage, SubmitButton } from "@/components/FormBits";

export function LiveRankingDashboard({
  initial,
  initialFase,
  eventNama,
}: {
  initial: RankingData;
  initialFase: "PERSIAPAN" | "PENJURIAN" | "SELESAI";
  eventNama: string;
}) {
  const [data, setData] = useState<RankingData>(initial);
  const [fase, setFase] = useState(initialFase);
  const [autoPoll, setAutoPoll] = useState(true);
  const [lastSync, setLastSync] = useState<Date>(new Date(initial.generatedAt));
  const [loading, setLoading] = useState(false);
  const [faseState, faseFormAction] = useActionState(setFaseAction, {});

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ranking", { cache: "no-store" });
      if (res.ok) {
        const j = await res.json();
        setData(j);
        setFase(j.fase);
        setLastSync(new Date());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!autoPoll) return;
    const iv = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 12_000);
    return () => clearInterval(iv);
  }, [autoPoll]);

  return (
    <div className="space-y-6">
      {/* Header & kontrol fase */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="text-[0.7rem] uppercase tracking-[0.25em] text-muted">{eventNama}</p>
          <h1 className="font-title gold-text text-2xl font-bold sm:text-3xl">Ranking Live</h1>
          <p className="mt-0.5 text-xs text-muted">
            Sinkronisasi terakhir: {lastSync.toLocaleTimeString("id-ID")} · {loading ? "memuat…" : "siap"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoPoll((a) => !a)}
            className={`btn btn-sm ${autoPoll ? "btn-gold" : "btn-ghost"}`}
          >
            {autoPoll ? "● Polling aktif (12s)" : "○ Polling jeda"}
          </button>
          <button type="button" onClick={refresh} className="btn btn-ghost btn-sm" disabled={loading}>
            Segarkan sekarang
          </button>
        </div>
      </div>

      {/* Kontrol fase */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="label">Fase saat ini</span>
            <span
              className={`badge text-sm ${
                fase === "PENJURIAN" ? "badge-ok" : fase === "SELESAI" ? "badge-gold" : "badge-warn"
              }`}
            >
              {fase === "PENJURIAN" ? "Penjurian (Juri dapat menilai)" : fase === "SELESAI" ? "Selesai (Read-only)" : "Persiapan (Setup)"}
            </span>
          </div>
          <form action={faseFormAction} className="flex flex-wrap items-center gap-2">
            {fase !== "PENJURIAN" && (
              <input type="hidden" name="fase" value="PENJURIAN" />
            )}
            {fase === "PENJURIAN" && (
              <input type="hidden" name="fase" value="SELESAI" />
            )}
            {fase !== "PENJURIAN" ? (
              <SubmitButton
                className="btn btn-gold btn-sm"
                confirm="Buka fase Penjurian? Juri akan dapat mulai menilai."
              >
                Buka Penjurian ▶
              </SubmitButton>
            ) : (
              <SubmitButton
                className="btn btn-danger btn-sm"
                confirm="Tutup Penjurian? Semua nilai akan dikunci (read-only)."
              >
                Tutup Penjurian ■
              </SubmitButton>
            )}
          </form>
        </div>
        <FormMessage state={faseState} />
      </div>

      {/* Progres Juri */}
      <div className="card p-4">
        <h2 className="font-title text-base font-bold text-gold-light">Progres Juri</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.progress.map((p) => {
            const pct = p.total > 0 ? Math.round((p.final / p.total) * 100) : 0;
            return (
              <div key={p.juriId} className="rounded-lg border border-line bg-panel p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-cream">{p.nama}</span>
                  <span className="text-xs text-muted">{p.kodeJuri}</span>
                </div>
                <div className="num mt-2 flex items-baseline justify-between">
                  <div>
                    <span className="gold-text font-title text-2xl font-bold">
                      {p.final}/{p.total}
                    </span>
                    <span className="ml-1.5 text-xs font-semibold text-[#ded7c8]">karya</span>
                  </div>
                  <span className="text-xs font-bold text-gold-light">{pct}% selesai</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-panel2">
                  <div className="h-full bg-gold" style={{ width: `${pct}%` }} />
                </div>
                {p.draft > 0 && <p className="mt-1 text-right text-[0.7rem] text-warn">{p.draft} draft berjalan</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Peringkat Resmi (100% juri selesai) */}
      <section aria-labelledby="judul-resmi">
        <div className="mb-2 flex items-baseline justify-between">
          <div>
            <h2 id="judul-resmi" className="font-title gold-text text-xl font-bold">
              Peringkat Resmi
            </h2>
            <p className="text-xs text-muted">
              Hanya menampilkan karya yang sudah dinilai FINAL oleh seluruh juri aktif ({data.juri.length} juri).
            </p>
          </div>
          <span className="badge badge-gold">{data.resmi.length} karya</span>
        </div>

        {data.resmi.length === 0 ? (
          <div className="card p-8 text-center text-muted">
            Belum ada karya yang dinilai lengkap oleh seluruh juri. Pantau progres di bawah.
          </div>
        ) : (
          <div className="card table-wrap">
            <RankingTable rows={data.resmi} juri={data.juri} showRank />
          </div>
        )}
      </section>

      {/* Karya Belum Lengkap */}
      {data.belumLengkap.length > 0 && (
        <section aria-labelledby="judul-parsial">
          <div className="mb-2 flex items-baseline justify-between">
            <div>
              <h2 id="judul-parsial" className="font-title text-lg font-bold text-warn">
                Sedang Berjalan (Belum Lengkap)
              </h2>
              <p className="text-xs text-muted">
                Sudah dinilai sebagian juri. Belum masuk peringkat resmi untuk menjaga keadilan.
              </p>
            </div>
            <span className="badge badge-warn">{data.belumLengkap.length} karya</span>
          </div>
          <div className="card table-wrap">
            <RankingTable rows={data.belumLengkap} juri={data.juri} showRank={false} />
          </div>
        </section>
      )}

      {/* Belum Dinilai Sama Sekali */}
      {data.belumDinilai.length > 0 && (
        <details className="card p-3 text-sm">
          <summary className="cursor-pointer font-semibold text-muted">
            Belum Dinilai ({data.belumDinilai.length} karya)
          </summary>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.belumDinilai.map((k) => (
              <span key={k.karyaId} className="badge">
                {k.kodeKarya} · {k.namaKarya}
              </span>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function RankingTable({
  rows,
  juri,
  showRank,
}: {
  rows: RankRow[];
  juri: { id: number; kodeJuri: string; nama: string }[];
  showRank: boolean;
}) {
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const paginatedRows = rows.slice(startIndex, startIndex + PAGE_SIZE);

  const goToPage = (p: number) => {
    const valid = Math.min(totalPages, Math.max(1, p));
    setPage(valid);
  };

  return (
    <div>
      {/* TAMPILAN 1: DESKTOP & TABLET (Tabel Lengkap Sejajar) */}
      <div className="hidden sm:block">
        <table className="tbl">
          <thead>
            <tr>
              {showRank && <th className="w-16 text-center">Rank</th>}
              <th>ID Karya</th>
              <th>Karya / Peserta</th>
              <th className="num text-center">Juri Final</th>
              {juri.map((j) => (
                <th key={j.id} className="num text-right">
                  {j.kodeJuri}
                </th>
              ))}
              <th className="num text-right font-bold">Total</th>
              <th className="num text-right font-bold text-gold-light">Rata-rata</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((r) => {
              const perJuriMap = new Map(r.perJuri.map((p) => [p.juriId, p.skorText]));
              const rankCls =
                r.peringkat === 1
                  ? "bg-gold/15 border-l-4 border-l-gold"
                  : r.peringkat === 2
                    ? "bg-slate-300/10 border-l-4 border-l-slate-300"
                    : r.peringkat === 3
                      ? "bg-amber-600/15 border-l-4 border-l-amber-600"
                      : undefined;
              return (
                <tr key={r.karyaId} className={rankCls}>
                  {showRank && (
                    <td className="num text-center font-title text-xl font-black">
                      {r.peringkat}
                      {r.seri && <span className="block text-xs font-bold text-warn">SERI</span>}
                    </td>
                  )}
                  <td className="num text-base font-black text-gold-light tracking-wide">{r.kodeKarya}</td>
                  <td>
                    <div className="text-base font-bold text-white">{r.namaKarya}</div>
                    <div className="text-sm font-semibold text-[#ded7c8]">
                      {r.namaPeserta} <span className="text-gold-light font-bold">({r.kodePeserta})</span>
                    </div>
                  </td>
                  <td className="num text-center">
                    <span className={`badge ${r.lengkap ? "badge-ok" : "badge-warn"}`}>
                      {r.juriFinal}/{r.juriTotal}
                    </span>
                  </td>
                  {juri.map((j) => (
                    <td key={j.id} className="num text-right text-base font-semibold text-[#ded7c8]">
                      {perJuriMap.get(j.id) ?? "—"}
                    </td>
                  ))}
                  <td className="num text-right text-lg font-bold text-white">{r.totalText}</td>
                  <td className="num gold-text font-title text-right text-2xl font-black">{r.rataText}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* TAMPILAN 2: MOBILE SMARTPHONE (< 640px) — Kartu Podium Eksekutif */}
      <div className="sm:hidden space-y-3 p-3">
        {paginatedRows.map((r) => {
          const perJuriMap = new Map(r.perJuri.map((p) => [p.juriId, p.skorText]));
          const isJuara1 = r.peringkat === 1;
          const isJuara2 = r.peringkat === 2;
          const isJuara3 = r.peringkat === 3;

          return (
            <div
              key={r.karyaId}
              className={`rounded-xl border p-4 space-y-3 transition-all ${
                isJuara1
                  ? "border-gold bg-gradient-to-br from-[#302617] to-panel shadow-lg"
                  : isJuara2
                    ? "border-slate-400/60 bg-gradient-to-br from-[#242628] to-panel"
                    : isJuara3
                      ? "border-amber-700/60 bg-gradient-to-br from-[#2d2116] to-panel"
                      : "border-line bg-panel2/60"
              }`}
            >
              {/* Header Baris Ranking */}
              <div className="flex items-center justify-between border-b border-line/60 pb-2.5">
                <div className="flex items-center gap-2">
                  {showRank && (
                    <span
                      className={`px-2.5 py-1 rounded-md font-title text-xs font-black ${
                        isJuara1
                          ? "bg-gold text-ink"
                          : isJuara2
                            ? "bg-slate-300 text-ink"
                            : isJuara3
                              ? "bg-amber-600 text-white"
                              : "bg-panel2 border border-line text-white"
                      }`}
                    >
                      {isJuara1
                        ? "Juara 1"
                        : isJuara2
                          ? "Juara 2"
                          : isJuara3
                            ? "Juara 3"
                            : `#${r.peringkat}`}
                    </span>
                  )}
                  {r.seri && <span className="badge badge-warn text-xs font-bold">SERI</span>}
                </div>

                <span className="font-title text-lg font-black text-gold-light tracking-wide">
                  {r.kodeKarya}
                </span>
              </div>

              {/* Informasi Motor & Peserta */}
              <div>
                <h3 className="font-bold text-white text-base leading-tight">{r.namaKarya}</h3>
                <p className="text-xs text-[#ded7c8] mt-0.5">
                  Bengkel: <strong className="text-white">{r.namaPeserta}</strong> ({r.kodePeserta})
                </p>
              </div>

              {/* Skor Rata-rata & Total */}
              <div className="flex items-end justify-between rounded-lg bg-black/40 p-3 border border-line/60">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#ded7c8] block">
                    Skor Rata-Rata
                  </span>
                  <span className="num font-title text-3xl font-black gold-text">
                    {r.rataText}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-[#ded7c8] block">
                    Total ({r.juriFinal}/{r.juriTotal} juri):
                  </span>
                  <span className="num font-title text-lg font-bold text-white">
                    {r.totalText}
                  </span>
                </div>
              </div>

              {/* Nilai per Juri */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-[#ded7c8] mr-1">Detail:</span>
                {juri.map((j) => (
                  <span
                    key={j.id}
                    className="badge badge-sm border border-line bg-panel font-mono text-xs text-[#ded7c8]"
                  >
                    {j.kodeJuri}: <strong className="text-gold-light ml-0.5">{perJuriMap.get(j.id) ?? "—"}</strong>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border-t border-line/70 bg-panel2/40">
          <div className="text-xs font-semibold text-[#ded7c8]">
            Menampilkan <strong>{startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, rows.length)}</strong> dari <strong>{rows.length}</strong> karya (20 karya per halaman)
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

