import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { Emblem } from "@/components/Shell";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Masuk" };

export default async function LoginPage() {
  const u = await getSessionUser();
  if (u) redirect(u.mustChangePassword ? "/ganti-password" : u.role === "ADMIN" ? "/admin" : "/juri");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <Emblem size={84} />
        </div>
        <p className="text-[0.7rem] tracking-[0.35em] text-muted">MBTECH</p>
        <h1 className="font-title gold-text mt-1 text-3xl font-bold leading-tight">RIDING WITH STYLE</h1>
        <p className="font-title mt-1 text-lg tracking-[0.4em] text-gold-light">AWARDS 2026</p>
        <hr className="hairline mx-auto mt-5 w-48" />
        <p className="mt-4 text-sm text-muted">Portal Penjurian</p>
      </div>
      <div className="card p-5 sm:p-6">
        <LoginForm />
      </div>
      <p className="mt-6 text-center text-xs text-muted">Keputusan dewan juri bersifat mutlak dan final.</p>
    </main>
  );
}

