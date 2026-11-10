"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { ActionState } from "@/lib/action-state";
import { FormMessage, SubmitButton } from "@/components/FormBits";

export function PesertaForm({
  action,
  initial,
}: {
  action: (_p: ActionState, fd: FormData) => Promise<ActionState>;
  initial?: {
    id: number;
    kodePeserta: string;
    nama: string;
    deskripsi: string | null;
    karyaCounter: number;
  };
}) {
  const [state, formAction] = useActionState(action, {});
  const isEdit = !!initial;
  const lockedKode = isEdit && initial.karyaCounter > 0;

  return (
    <form action={formAction} className="card max-w-xl space-y-4 p-5 sm:p-6">
      {isEdit && <input type="hidden" name="id" value={initial.id} />}

      <div>
        <label htmlFor="kodePeserta" className="label">
          ID Peserta (Akronim) *
        </label>
        <input
          id="kodePeserta"
          name="kodePeserta"
          className="input uppercase"
          defaultValue={initial?.kodePeserta ?? ""}
          maxLength={5}
          placeholder="Misal: BRM, SKR, NRT"
          required
          readOnly={lockedKode}
        />
        {lockedKode ? (
          <p className="mt-1 text-xs text-warn">
            ID tidak dapat diubah karena peserta ini sudah memiliki karya yang didaftarkan.
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted">
            2–5 karakter huruf kapital atau angka (A-Z, 0-9). Dipakai sebagai prefix ID karya.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="nama" className="label">
          Nama Peserta / Workshop *
        </label>
        <input
          id="nama"
          name="nama"
          className="input"
          defaultValue={initial?.nama ?? ""}
          placeholder="Nama peserta atau nama bengkel/studio"
          required
        />
      </div>

      <div>
        <label htmlFor="deskripsi" className="label">
          Deskripsi / Asal Kota (Opsional)
        </label>
        <textarea
          id="deskripsi"
          name="deskripsi"
          rows={3}
          className="input"
          defaultValue={initial?.deskripsi ?? ""}
          placeholder="Kota, komunitas, atau catatan singkat mengenai peserta"
        />
      </div>

      <FormMessage state={state} />

      <div className="flex items-center gap-3 pt-2">
        <Link href="/admin/peserta" className="btn btn-ghost flex-1">
          Batal
        </Link>
        <SubmitButton className="btn btn-gold flex-1">
          {isEdit ? "Simpan Perubahan" : "Tambah Peserta"}
        </SubmitButton>
      </div>
    </form>
  );
}

