"use client";

import { useActionState, useState } from "react";
import { syncTotalPesertaAction } from "../actions";
import { FormMessage } from "@/components/FormBits";

const PRESETS = [25, 50, 70, 75, 100];

export function PesertaSlotControl({ currentTotal }: { currentTotal: number }) {
  const [state, formAction, isPending] = useActionState(syncTotalPesertaAction, {});
  const [customTotal, setCustomTotal] = useState(String(currentTotal));
  const [prevTotal, setPrevTotal] = useState(currentTotal);

  if (currentTotal !== prevTotal) {
    setPrevTotal(currentTotal);
    setCustomTotal(String(currentTotal));
  }

  return (
    <div className="card mb-5 p-4 sm:p-5 space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-title text-base font-bold text-gold-light">
            Atur Total Peserta
          </h2>
          <p className="text-xs text-[#ded7c8] mt-0.5">
            Pilih jumlah peserta aktif. Slot peserta &amp; karya (001–N) akan langsung menyesuaikan otomatis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol cepat preset total peserta */}
          <div className="flex flex-wrap items-center gap-1.5">
            {PRESETS.map((n) => {
              const isCurrent = currentTotal === n;
              return (
                <form key={n} action={formAction}>
                  <input type="hidden" name="total" value={n} />
                  <button
                    type="submit"
                    disabled={isPending}
                    className={`btn btn-sm px-3 text-xs font-extrabold transition-all ${
                      isCurrent
                        ? "btn-gold shadow-md"
                        : "btn-ghost border border-line hover:border-gold"
                    }`}
                  >
                    {n} Peserta
                  </button>
                </form>
              );
            })}
          </div>

          {/* Input jumlah custom */}
          <form action={formAction} className="flex items-center gap-1.5">
            <input
              type="number"
              name="total"
              min={1}
              max={250}
              value={customTotal}
              onChange={(e) => setCustomTotal(e.target.value)}
              disabled={isPending}
              aria-label="Jumlah total peserta"
              className="input w-20 py-1.5 min-h-10 text-center text-sm font-bold"
            />
            <button
              type="submit"
              disabled={isPending}
              className="btn btn-gold btn-sm px-3.5 text-xs font-extrabold"
            >
              {isPending ? "Memproses…" : "Terapkan"}
            </button>
          </form>
        </div>
      </div>

      <FormMessage state={state} />
    </div>
  );
}
