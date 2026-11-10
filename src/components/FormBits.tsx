"use client";

import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/action-state";

export function SubmitButton({
  children,
  pending: pendingText = "Memproses…",
  className = "btn btn-gold",
  confirm,
  disabled,
}: {
  children: React.ReactNode;
  pending?: string;
  className?: string;
  /** Jika diisi, minta konfirmasi browser sebelum submit */
  confirm?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending || disabled}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending ? pendingText : children}
    </button>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  if (state.error)
    return (
      <p role="alert" className="rounded-md border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-[#ffd9d2]">
        {state.error}
      </p>
    );
  if (state.message)
    return (
      <p role="status" className="rounded-md border border-ok/50 bg-ok/10 px-3 py-2 text-sm text-ok">
        {state.message}
      </p>
    );
  return null;
}

