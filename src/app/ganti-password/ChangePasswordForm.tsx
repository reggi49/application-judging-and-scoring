"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "@/components/FormBits";

export function ChangePasswordForm({ forced }: { forced: boolean }) {
  const [state, action] = useActionState(changePasswordAction, {});
  return (
    <form action={action} className="space-y-4">
      {forced && (
        <p className="rounded-md border border-warn/50 bg-warn/10 px-3 py-2 text-sm text-warn">
          Demi keamanan, ganti password bawaan sebelum melanjutkan.
        </p>
      )}
      <div>
        <label htmlFor="current" className="label">Password saat ini</label>
        <input id="current" name="current" type="password" className="input" autoComplete="current-password" required />
      </div>
      <div>
        <label htmlFor="next" className="label">Password baru</label>
        <input id="next" name="next" type="password" className="input" autoComplete="new-password" minLength={8} required />
        <p className="mt-1 text-xs text-muted">Minimal 8 karakter, mengandung huruf dan angka.</p>
      </div>
      <div>
        <label htmlFor="confirm" className="label">Ulangi password baru</label>
        <input id="confirm" name="confirm" type="password" className="input" autoComplete="new-password" required />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn btn-gold w-full">Simpan password</SubmitButton>
    </form>
  );
}

