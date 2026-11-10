"use client";

import { useActionState, useState } from "react";
import type { ActionState } from "@/lib/action-state";
import {
  createJuriAction,
  updateJuriAction,
  resetJuriPasswordAction,
  toggleJuriAction,
  deleteJuriAction,
} from "../actions";
import { FormMessage, SubmitButton } from "@/components/FormBits";

type JuriItem = {
  id: number;
  kodeJuri: string;
  nama: string;
  username: string;
  isActive: boolean;
  finalCount: number;
};

export function JuriManager({ juriList }: { juriList: JuriItem[] }) {
  const [createState, createFormAction] = useActionState(createJuriAction, {});
  const [resetState, resetFormAction] = useActionState(resetJuriPasswordAction, {});
  const [editId, setEditId] = useState<number | null>(null);
  const [editState, editFormAction] = useActionState(updateJuriAction, {});

  return (
    <div className="space-y-6">
      {/* Pesan Global (seperti password baru hasil reset atau buat juri) */}
      <FormMessage state={createState} />
      <FormMessage state={resetState} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Kolom Kiri: Tabel Juri */}
        <section aria-label="Daftar Juri">
          <div className="card table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>ID Juri</th>
                  <th>Nama & Username</th>
                  <th className="num text-center">Status</th>
                  <th className="num text-center">Karya Final</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {juriList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted">
                      Belum ada akun juri terdaftar. Tambahkan akun juri di form sebelah kanan.
                    </td>
                  </tr>
                ) : (
                  juriList.map((j) => (
                    <tr key={j.id}>
                      <td className="num font-semibold text-gold-light">{j.kodeJuri}</td>
                      <td>
                        {editId === j.id ? (
                          <form
                            action={async (fd) => {
                              await editFormAction(fd);
                              setEditId(null);
                            }}
                            className="flex items-center gap-2"
                          >
                            <input type="hidden" name="id" value={j.id} />
                            <input
                              name="nama"
                              defaultValue={j.nama}
                              className="input text-xs"
                              required
                            />
                            <button type="submit" className="btn btn-gold btn-sm">
                              Simpan
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => setEditId(null)}
                            >
                              Batal
                            </button>
                          </form>
                        ) : (
                          <div>
                            <div className="font-semibold text-cream">{j.nama}</div>
                            <div className="text-xs text-muted">@{j.username}</div>
                          </div>
                        )}
                      </td>
                      <td className="num text-center">
                        <span className={`badge ${j.isActive ? "badge-ok" : "badge-bad"}`}>
                          {j.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="num text-center">
                        <span className="badge">{j.finalCount}</span>
                      </td>
                      <td className="text-right">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {editId !== j.id && (
                            <button
                              type="button"
                              onClick={() => setEditId(j.id)}
                              className="btn btn-ghost btn-sm text-xs"
                            >
                              Edit
                            </button>
                          )}

                          <form action={resetFormAction}>
                            <input type="hidden" name="id" value={j.id} />
                            <SubmitButton
                              className="btn btn-ghost btn-sm text-xs"
                              confirm={`Reset password juri ${j.kodeJuri}? Password baru akan digenerate otomatis.`}
                            >
                              Reset PW
                            </SubmitButton>
                          </form>

                          <form action={toggleJuriAction}>
                            <input type="hidden" name="id" value={j.id} />
                            <button
                              type="submit"
                              className={`btn btn-sm text-xs ${
                                j.isActive ? "btn-ghost text-warn" : "btn-gold"
                              }`}
                            >
                              {j.isActive ? "Nonaktifkan" : "Aktifkan"}
                            </button>
                          </form>

                          {j.finalCount === 0 && (
                            <form action={deleteJuriAction}>
                              <input type="hidden" name="id" value={j.id} />
                              <SubmitButton
                                className="btn btn-danger btn-sm text-xs"
                                confirm={`Hapus juri ${j.kodeJuri}?`}
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
          {editState.error && (
            <p className="mt-2 text-xs text-danger">{editState.error}</p>
          )}
        </section>

        {/* Kolom Kanan: Tambah Juri Baru */}
        <section aria-label="Tambah Juri Baru">
          <form action={createFormAction} className="card space-y-4 p-5 sm:p-6">
            <h2 className="font-title text-lg font-bold text-gold-light">Tambah Akun Juri</h2>
            <p className="text-xs text-muted">
              Buat akun untuk dewan juri. Password akan digenerate bila dikosongkan. Juri wajib mengganti password saat login pertama.
            </p>

            <div>
              <label htmlFor="kodeJuri" className="label">
                ID Juri *
              </label>
              <input
                id="kodeJuri"
                name="kodeJuri"
                className="input uppercase"
                placeholder="Misal: J01, J02, JURI-1"
                required
              />
              <p className="mt-1 text-xs text-muted">Pengenal singkat juri (2–20 karakter).</p>
            </div>

            <div>
              <label htmlFor="nama" className="label">
                Nama Lengkap Juri *
              </label>
              <input
                id="nama"
                name="nama"
                className="input"
                placeholder="Nama lengkap dewan juri"
                required
              />
            </div>

            <div>
              <label htmlFor="username" className="label">
                Username Login *
              </label>
              <input
                id="username"
                name="username"
                className="input lowercase"
                placeholder="Misal: j01, juri1"
                autoCapitalize="none"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password Awal (Opsional)
              </label>
              <input
                id="password"
                name="password"
                type="text"
                className="input"
                placeholder="Kosongkan untuk generate acak"
              />
            </div>

            <SubmitButton className="btn btn-gold w-full">Buat Akun Juri</SubmitButton>
          </form>
        </section>
      </div>
    </div>
  );
}
