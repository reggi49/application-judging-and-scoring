import { requireUser } from "@/lib/dal";
import { Brand } from "@/components/Shell";
import { ChangePasswordForm } from "./ChangePasswordForm";

export const metadata = { title: "Ganti Password" };

export default async function GantiPasswordPage() {
  const u = await requireUser(undefined, { allowMustChange: true });
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-6 flex justify-center">
        <Brand />
      </div>
      <div className="card p-5 sm:p-6">
        <h1 className="font-title gold-text mb-1 text-xl font-bold">Ganti Password</h1>
        <p className="mb-4 text-sm text-muted">Akun: {u.username}</p>
        <ChangePasswordForm forced={u.mustChangePassword} />
      </div>
    </main>
  );
}

