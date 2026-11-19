"use client";

import { useActionState, useState } from "react";
import type { ActionState } from "@/lib/action-state";
import { saveKriteriaAction } from "../actions";
import { FormMessage, SubmitButton } from "@/components/FormBits";

type KriteriaItem = {
  id: number;
  kode: string;
  nama: string;
  deskripsi: string | null;
  bobot: string; // "30.00"
};

export function KriteriaForm({
  kriteriaList,
  canEdit,
  lockReason,
}: {
  kriteriaList: KriteriaItem[];
  canEdit: boolean;
  lockReason?: string;
}) {
  const [state, formAction] = useActionState(saveKriteriaAction, {});
  const [bobots, setBobots] = useState<Record<number, string>>(() =>
    Object.fromEntries(kriteriaList.map((k) => [k.id, k.bobot]))
  );

  const total = Object.values(bobots).reduce((sum, v) => {
    const num = parseFloat(v.replace(",", ".")) || 0;
    return sum + num;
  }, 0);

  const isValidTotal = Math.abs(total - 100) < 0.001;

  return (
    <form action={formAction} className="card max-w-3xl space-y-5 p-5 sm:p-6">
      {!canEdit && (
        <div className="rounded-lg border border-warn/50 bg-warn/10 p-3.5 text-sm text-warn">
          {lockReason ?? "Kriteria terkunci dan tidak dapat diubah."}
        </div>
      )}

      <div className="space-y-4">
        {kriteriaList.map((k) => (
          <div key={k.id} className="rounded-lg border border-line bg-panel p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="badge badge-gold font-mono">{k.kode}</span>
              <div className="flex items-center gap-2">
                <label htmlFor={`bobot_${k.id}`} className="text-xs uppercase tracking-wider text-muted">
                  Bobot (%)
                </label>
                <input
                  id={`bobot_${k.id}`}
                  name={`bobot_${k.id}`}
                  className="input num w-24 text-right font-bold text-gold-light"
                  value={bobots[k.id] ?? ""}
                  disabled={!canEdit}
                  onChange={(e) =>
                    setBobots((prev) => ({ ...prev, [k.id]: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="mt-3">
              <label htmlFor={`nama_${k.id}`} className="label">
                Nama Kriteria
              </label>
              <input
                id={`nama_${k.id}`}
                name={`nama_${k.id}`}
                className="input"
                defaultValue={k.nama}
                disabled={!canEdit}
                required
              />
            </div>

            <div className="mt-3">
              <label htmlFor={`deskripsi_${k.id}`} className="label">
                Deskripsi / Panduan Penilaian
              </label>
              <textarea
                id={`deskripsi_${k.id}`}
                name={`deskripsi_${k.id}`}
                rows={2}
                className="input text-sm"
                defaultValue={k.deskripsi ?? ""}
                disabled={!canEdit}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Indikator Total Bobot */}
      <div className="flex items-center justify-between rounded-lg border border-line bg-panel2 p-4">
        <div>
          <span className="text-sm font-semibold text-cream">Total Bobot Keseluruhan</span>
          <p className="text-xs text-muted">Total harus tepat 100,00%</p>
        </div>
        <div className="text-right">
          <span
            className={`num font-title text-2xl font-bold ${
              isValidTotal ? "text-ok" : "text-danger"
            }`}
          >
            {total.toFixed(2)}%
          </span>
          {!isValidTotal && (
            <p className="text-[0.7rem] text-danger">Wajib tepat 100%</p>
          )}
        </div>
      </div>

      <FormMessage state={state} />

      {canEdit && (
        <SubmitButton className="btn btn-gold w-full" disabled={!isValidTotal}>
          Simpan Konfigurasi Kriteria
        </SubmitButton>
      )}
    </form>
  );
}

