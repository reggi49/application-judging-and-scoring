"use client";

import { useActionState } from "react";
import { backupNowAction } from "../actions";
import { FormMessage, SubmitButton } from "@/components/FormBits";

export function BackupTrigger() {
  const [state, formAction] = useActionState(backupNowAction, {});

  return (
    <div className="card space-y-3 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-title text-lg font-bold text-gold-light">Backup Database & Foto</h2>
          <p className="text-xs text-muted">
            Buat snapshot lengkap database SQLite (.db.gz) dan arsip foto (.tar.gz) secara instan.
          </p>
        </div>
        <form action={formAction}>
          <SubmitButton className="btn btn-gold" pending="Membuat Backup…">
            💾 Buat Backup Sekarang
          </SubmitButton>
        </form>
      </div>
      <FormMessage state={state} />
    </div>
  );
}

