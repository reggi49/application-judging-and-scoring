"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { createKaryaAction } from "../../actions";
import { FormMessage, SubmitButton } from "@/components/FormBits";

type PesertaOption = {
  id: number;
  kodePeserta: string;
  nama: string;
  nextUrut: number;
};

export function KaryaForm({ pesertaList }: { pesertaList: PesertaOption[] }) {
  const [state, formAction] = useActionState(createKaryaAction, {});
  const [selectedPesertaId, setSelectedPesertaId] = useState<number>(pesertaList[0]?.id ?? 0);
  const [akronimKarya, setAkronimKarya] = useState("");
  const formId = useId();

  const selectedPeserta = pesertaList.find((p) => p.id === selectedPesertaId);
  const cleanAkronim = akronimKarya.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);

  const previewId =
    selectedPeserta && cleanAkronim.length >= 2
      ? `${selectedPeserta.kodePeserta}-${cleanAkronim}-${String(selectedPeserta.nextUrut).padStart(3, "0")}`
      : "—";

  return (
    <form action={formAction} className="card max-w-xl space-y-4 p-5 sm:p-6">
      <div>
        <label htmlFor={`${formId}-pesertaId`} className="label">
          Pilih Peserta / Workshop *
        </label>
        {pesertaList.length === 0 ? (
          <p className="text-sm text-warn">
            Belum ada data peserta.{" "}
            <Link href="/admin/peserta/baru" className="underline">
              Tambah peserta terlebih dahulu
            </Link>
            .
          </p>
        ) : (
          <select
            id={`${formId}-pesertaId`}
            name="pesertaId"
            className="input"
            value={selectedPesertaId}
            onChange={(e) => setSelectedPesertaId(Number(e.target.value))}
            required
          >
            {pesertaList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.kodePeserta} — {p.nama} (Karya ke-{p.nextUrut})
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label htmlFor={`${formId}-akronimKarya`} className="label">
          Akronim Karya *
        </label>
        <input
          id={`${formId}-akronimKarya`}
          name="akronimKarya"
          className="input uppercase"
          value={akronimKarya}
          onChange={(e) => setAkronimKarya(e.target.value.toUpperCase())}
          maxLength={5}
          placeholder="Misal: CLS, VNT, BLM, ADV"
          required
        />
        <p className="mt-1 text-xs text-muted">
          2–5 karakter huruf kapital atau angka (A-Z, 0-9). Singkatan dari konsep karya.
        </p>
      </div>

      {/* Live Preview ID Karya Otomatis */}
      <div className="rounded-lg border border-gold-dark/50 bg-gold/5 p-3.5">
        <span className="text-[0.68rem] uppercase tracking-widest text-muted">Preview Format ID Karya</span>
        <div className="num font-title gold-text mt-0.5 text-2xl font-bold">{previewId}</div>
        <p className="mt-1 text-xs text-muted">
          Format: Akronim Peserta + Akronim Karya + No Urut Karya Peserta (3 digit). Dibuat otomatis & unik di DB.
        </p>
      </div>

      <div>
        <label htmlFor={`${formId}-namaKarya`} className="label">
          Nama Karya *
        </label>
        <input
          id={`${formId}-namaKarya`}
          name="namaKarya"
          className="input"
          placeholder="Misal: Classic Heritage Gold Line"
          required
        />
      </div>

      <div>
        <label htmlFor={`${formId}-deskripsi`} className="label">
          Deskripsi & Konsep Modifikasi (Opsional)
        </label>
        <textarea
          id={`${formId}-deskripsi`}
          name="deskripsi"
          rows={3}
          className="input"
          placeholder="Konsep modifikasi, tipe motor, bahan MBtech yang dipakai, dan keunggulan jahitan"
        />
      </div>

      <FormMessage state={state} />

      <div className="flex items-center gap-3 pt-2">
        <Link href="/admin/karya" className="btn btn-ghost flex-1">
          Batal
        </Link>
        <SubmitButton className="btn btn-gold flex-1" disabled={pesertaList.length === 0}>
          Simpan & Lanjut Upload Foto
        </SubmitButton>
      </div>
    </form>
  );
}

