"use client";

import { SubmitButton } from "./FormBits";

export function DeleteButton({
  action,
  id,
  confirm,
}: {
  action: (fd: FormData) => Promise<void>;
  id: number;
  confirm: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton className="btn btn-danger btn-sm" confirm={confirm}>
        Hapus
      </SubmitButton>
    </form>
  );
}
