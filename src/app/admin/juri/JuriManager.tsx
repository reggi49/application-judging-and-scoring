"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createJuriAction,
  updateJuriAction,
  toggleJuriAction,
  deleteJuriAction,
} from "../actions";
import type { ActionState } from "@/lib/action-state";
import { FormMessage, SubmitButton } from "@/components/FormBits";

export type JuriItem = {
  id: number;
  kodeJuri: string;
  nama: string;
  username: string;
  isActive: boolean;
  finalCount: number;
};

const PAGE_SIZE = 20;

export function JuriManager({ juriList }: { juriList: JuriItem[] }) {
  const router = useRouter();
  const [createState, createFormAction] = useActionState(createJuriAction, {});
  const [editId, setEditId] = useState<number | null>(null);
  const [editKode, setEditKode] = useState<string>("");
  const [editNama, setEditNama] = useState<string>("");
  const [editState, editFormAction, isEditPending] = useActionState(
    async (prev: ActionState, fd: FormData) => {
      const res = await updateJuriAction(prev, fd);
      if (res.ok) {
        setEditId(null);
        router.refresh();
      }
      return res;
    },
    {},
  );
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);

  const startEdit = (j: JuriItem) => {
    setEditId(j.id);
    setEditKode(j.kodeJuri);
    setEditNama(j.nama);
  };

  const counts = useMemo(() => {
    let active = 0;
    let inactive = 0;
    for (const j of juriList) {
      if (j.isActive) active++;
      else inactive++;
    }
    return { all: juriList.length, active, inactive };
  }, [juriList]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return juriList.filter((j) => {
      if (filter === "ACTIVE" && !j.isActive) return false;
      if (filter === "INACTIVE" && j.isActive) return false;
      if (!needle) return true;
      return (
        j.kodeJuri.toLowerCase().includes(needle) ||
        j.nama.toLowerCase().includes(needle) ||
        j.username.toLowerCase().includes(needle)
      );
    });
  }, [juriList, q, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const paginated = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const handleQChange = (val: string) => {
    setQ(val);
    setPage(1);
  };

  const handleFilterChange = (next: "ALL" | "ACTIVE" | "INACTIVE") => {
    setFilter(next);
    setPage(1);
  };

  const goToPage = (p: number) => {
    const valid = Math.min(totalPages, Math.max(1, p));
    setPage(valid);
  };

  return (
    <div className="space-y-5">
      <FormMessage state={createState} />
      <FormMessage state={editState} />

      {/* Kontrol Mobile & Desktop: Pencarian, Filter Cepat, & Tombol Tambah */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 max-w-md w-full">
          <input
            className="input text-base py-2.5"
            placeholder="Cari nama atau ID dewan juri…"
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

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex rounded-lg border border-line bg-panel2 p-1">
            <button
              type="button"
              onClick={() => handleFilterChange("ALL")}
              className={`rounded px-3 py-1.5 text-xs font-bold transition-all ${
                filter === "ALL" ? "bg-gold text-ink" : "text-[#ded7c8] hover:text-white"
              }`}
            >
              Semua ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange("ACTIVE")}
              className={`rounded px-3 py-1.5 text-xs font-bold transition-all ${
                filter === "ACTIVE" ? "bg-ok text-ink" : "text-[#ded7c8] hover:text-white"
              }`}
            >
              Aktif ({counts.active})
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange("INACTIVE")}
              className={`rounded px-3 py-1.5 text-xs font-bold transition-all ${
                filter === "INACTIVE" ? "bg-warn text-ink" : "text-[#ded7c8] hover:text-white"
              }`}
            >
              Nonaktif ({counts.inactive})
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowAddModal((v) => !v);
              // scroll smooth ke form di mobile jika dibuka
              if (!showAddModal) {
                setTimeout(() => {
                  document.getElementById("form-tambah-juri")?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }
            }}
            className="btn btn-gold btn-sm font-bold gap-1 sm:hidden"
          >
            {showAddModal ? "Tutup Form" : "+ Tambah Juri"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Kolom Kiri: Tabel Juri (Desktop) & Kartu Juri Mewah (Mobile) */}
        <section aria-label="Daftar Dewan Juri" className="space-y-4">
          <div className="text-xs font-semibold text-[#ded7c8]">
            Menampilkan <strong>{filtered.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, filtered.length)}</strong> dari total <strong>{filtered.length}</strong> dewan juri
            {filtered.length > PAGE_SIZE && <span> (20 juri per halaman)</span>}
          </div>

          {/* TAMPILAN 1: DESKTOP & TABLET (Tabel Rapi Sejajar) */}
          <div className="hidden sm:block card table-wrap shadow-xl">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="w-24">ID Juri</th>
                  <th>Nama Dewan Juri</th>
                  <th className="w-28 num text-center">Status</th>
                  <th className="w-28 num text-center">Karya Final</th>
                  <th className="w-60 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted">
                      {juriList.length === 0
                        ? "Belum ada akun juri terdaftar. Tambahkan akun juri di form sebelah kanan."
                        : "Tidak ada juri yang cocok dengan pencarian/filter."}
                    </td>
                  </tr>
                ) : (
                  paginated.map((j) => (
                    <tr key={j.id}>
                      <td className="num font-black text-lg text-gold-light tracking-wide">{j.kodeJuri}</td>
                      <td>
                        {editId === j.id ? (
                          <form action={editFormAction} className="flex flex-wrap items-center gap-2">
                            <input type="hidden" name="id" value={j.id} />
                            <input
                              name="kodeJuri"
                              value={editKode}
                              onChange={(e) => setEditKode(e.target.value.toUpperCase())}
                              minLength={2}
                              maxLength={20}
                              placeholder="ID"
                              aria-label="ID Juri"
                              className="w-24 rounded-lg border border-line bg-[#201e1a] px-2.5 py-2 text-xs font-black uppercase text-gold-light focus:border-gold focus:outline-none"
                              required
                            />
                            <input
                              name="nama"
                              value={editNama}
                              onChange={(e) => setEditNama(e.target.value)}
                              minLength={2}
                              maxLength={120}
                              placeholder="Nama lengkap juri"
                              aria-label="Nama Dewan Juri"
                              className="flex-1 min-w-[160px] rounded-lg border border-gold/70 bg-[#201e1a] px-3 py-2 text-sm font-semibold text-white focus:border-gold focus:outline-none"
                              required
                              autoFocus
                            />
                            <button
                              type="submit"
                              disabled={isEditPending}
                              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-b from-[#ffeaae] via-[#f3be4d] to-[#cf9324] border border-[#fff2c8] px-3 py-2 text-xs font-bold text-[#141006] hover:brightness-105 disabled:opacity-50"
                            >
                              {isEditPending ? "Menyimpan…" : "Simpan"}
                            </button>
                            <button
                              type="button"
                              disabled={isEditPending}
                              className="inline-flex items-center justify-center rounded-lg border border-line bg-[#2b2721] px-3 py-2 text-xs font-semibold text-muted hover:text-white"
                              onClick={() => setEditId(null)}
                            >
                              Batal
                            </button>
                          </form>
                        ) : (
                          <div>
                            <div className="font-bold text-white text-base">{j.nama}</div>
                            <div className="text-xs text-[#ded7c8]">Akses login tanpa password</div>
                          </div>
                        )}
                      </td>
                      <td className="num text-center">
                        <span
                          className={`badge ${
                            j.isActive ? "badge-ok" : "badge-bad"
                          }`}
                        >
                          {j.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="num text-center">
                        <span className="badge badge-gold font-bold">{j.finalCount}</span>
                      </td>
                      <td className="text-right">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {editId !== j.id && (
                            <button
                              type="button"
                              onClick={() => startEdit(j)}
                              className="inline-flex items-center gap-1 rounded-lg border border-gold/60 bg-gold/10 px-3 py-1.5 text-xs font-bold text-gold-light hover:bg-gold hover:text-ink transition-colors"
                            >
                              Edit
                            </button>
                          )}

                          <form action={toggleJuriAction}>
                            <input type="hidden" name="id" value={j.id} />
                            <button
                              type="submit"
                              className={`btn btn-sm text-xs font-bold ${
                                j.isActive ? "btn-ghost text-warn hover:bg-warn/15" : "btn-gold"
                              }`}
                            >
                              {j.isActive ? "Nonaktifkan" : "Aktifkan"}
                            </button>
                          </form>

                          {j.finalCount === 0 && (
                            <form action={deleteJuriAction}>
                              <input type="hidden" name="id" value={j.id} />
                              <SubmitButton
                                className="btn btn-danger btn-sm text-xs font-bold"
                                confirm={`Hapus akun dewan juri ${j.kodeJuri} (${j.nama})?`}
                              >
                                Hapus
                              </SubmitButton>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* TAMPILAN 2: MOBILE SMARTPHONE (< 640px) — Kartu Eksekutif Responsif */}
          <div className="sm:hidden space-y-3">
            {filtered.length === 0 ? (
              <div className="card p-6 text-center text-muted">
                Tidak ada data juri yang cocok.
              </div>
            ) : (
              paginated.map((j) => (
                <div
                  key={j.id}
                  className="card p-4 space-y-3 border-line transition-all hover:border-gold shadow-md"
                >
                  {/* Header Kartu: Avatar ID Juri & Status */}
                  <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-gold bg-gradient-to-br from-[#3b3223] to-[#241f17] font-title text-xl font-black text-gold-light shadow-inner">
                        {j.kodeJuri}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#ded7c8] block">
                          Dewan Juri RWSA
                        </span>
                        <h3 className="font-bold text-white text-base leading-tight">
                          {j.nama}
                        </h3>
                      </div>
                    </div>

                    <span
                      className={`badge shrink-0 text-xs font-bold ${
                        j.isActive ? "badge-ok" : "badge-bad"
                      }`}
                    >
                      {j.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>

                  {/* Mode Edit Mobile */}
                  {editId === j.id ? (
                    <form
                      action={editFormAction}
                      className="space-y-2.5 rounded-lg bg-panel2/80 p-3 border border-gold-dark/60"
                    >
                      <input type="hidden" name="id" value={j.id} />
                      <div className="grid grid-cols-[96px_1fr] gap-2">
                        <div>
                          <label className="text-[11px] font-bold text-gold-light block mb-1">
                            ID Juri:
                          </label>
                          <input
                            name="kodeJuri"
                            value={editKode}
                            onChange={(e) => setEditKode(e.target.value.toUpperCase())}
                            minLength={2}
                            maxLength={20}
                            className="input text-sm font-black uppercase py-2"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-gold-light block mb-1">
                            Nama Dewan Juri:
                          </label>
                          <input
                            name="nama"
                            value={editNama}
                            onChange={(e) => setEditNama(e.target.value)}
                            minLength={2}
                            maxLength={120}
                            className="input text-sm font-semibold py-2"
                            required
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={isEditPending}
                          className="btn btn-gold btn-sm flex-1 font-bold"
                        >
                          {isEditPending ? "Menyimpan…" : "Simpan Perubahan"}
                        </button>
                        <button
                          type="button"
                          disabled={isEditPending}
                          className="btn btn-ghost btn-sm text-xs"
                          onClick={() => setEditId(null)}
                        >
                          Batal
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Rincian Info & Progres Nilai */
                    <div className="flex items-center justify-between rounded-lg bg-panel2/60 p-2.5 border border-line">
                      <div className="text-xs text-[#ded7c8]">
                        <span className="block font-semibold text-white">Login Passwordless</span>
                        <span className="text-[11px] text-muted">Juri pilih nama di layar masuk</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-gold-light block">Karya Final</span>
                        <span className="num font-title text-xl font-black text-white">
                          {j.finalCount} <span className="text-xs font-normal text-[#ded7c8]">karya</span>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Tombol Aksi Ramah Jari (Thumb-Friendly Buttons) */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    {editId !== j.id && (
                      <button
                        type="button"
                        onClick={() => startEdit(j)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gold/60 bg-gold/10 px-3 py-2 text-xs font-bold text-gold-light hover:bg-gold hover:text-ink transition-colors"
                      >
                        Edit Nama
                      </button>
                    )}

                    <form action={toggleJuriAction}>
                      <input type="hidden" name="id" value={j.id} />
                      <button
                        type="submit"
                        className={`btn btn-sm text-xs font-bold px-3 ${
                          j.isActive ? "btn-ghost text-warn hover:bg-warn/15" : "btn-gold"
                        }`}
                      >
                        {j.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </form>

                    {j.finalCount === 0 && (
                      <form action={deleteJuriAction}>
                        <input type="hidden" name="id" value={j.id} />
                        <SubmitButton
                          className="btn btn-danger btn-sm text-xs font-bold px-3"
                          confirm={`Hapus akun dewan juri ${j.kodeJuri} (${j.nama})?`}
                        >
                          Hapus
                        </SubmitButton>
                      </form>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Kontrol Pagination — HANYA JIKA MELEBIHI 20 JURI */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-line/70">
              <div className="text-xs font-semibold text-[#ded7c8] order-2 sm:order-1">
                Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong> (20 per halaman)
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

          {editState.error && (
            <p className="mt-2 text-xs font-bold text-danger">{editState.error}</p>
          )}
        </section>

        {/* Kolom Kanan: Form Tambah Juri Baru */}
        <section
          id="form-tambah-juri"
          aria-label="Tambah Juri Baru"
          className={showAddModal ? "block" : "hidden sm:block"}
        >
          <form action={createFormAction} className="card space-y-4 p-5 sm:p-6 shadow-xl border-line">
            <div className="flex items-center justify-between">
              <h2 className="font-title text-lg font-bold text-gold-light">Tambah Akun Juri</h2>
              <span className="badge badge-gold font-bold text-xs">Juri Baru</span>
            </div>

            <div className="rounded-lg border border-gold-dark/40 bg-gold/5 p-3 text-xs text-[#ded7c8] leading-relaxed">
              Dewan juri masuk ke aplikasi <strong className="text-white">tanpa password</strong>. Juri cukup memilih profil namanya di layar masuk smartphone.
            </div>

            <div>
              <label htmlFor="kodeJuri" className="label text-sm font-bold text-white">
                ID Juri *
              </label>
              <input
                id="kodeJuri"
                name="kodeJuri"
                className="input uppercase text-base font-bold py-2.5"
                placeholder="Misal: J04, J05, JURI-4"
                required
              />
              <p className="mt-1 text-xs text-[#ded7c8]">Pengenal singkat dewan juri (2–20 karakter).</p>
            </div>

            <div>
              <label htmlFor="nama" className="label text-sm font-bold text-white">
                Nama Lengkap Juri *
              </label>
              <input
                id="nama"
                name="nama"
                className="input text-base font-semibold py-2.5"
                placeholder="Nama lengkap dewan juri"
                required
              />
            </div>

            <SubmitButton className="btn btn-gold w-full py-3 font-extrabold shadow-md">
              + Tambah Juri Baru
            </SubmitButton>
          </form>
        </section>
      </div>
    </div>
  );
}
