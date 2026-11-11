import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Emblem } from "@/components/Shell";
import { LoginForm } from "./LoginForm";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";

export const metadata = { title: "Masuk Penjurian" };

export default async function LoginPage() {
  const u = await getSessionUser();
  if (u) {
    if (u.role === "ADMIN" && u.mustChangePassword) redirect("/ganti-password");
    redirect(u.role === "ADMIN" ? "/admin" : "/juri");
  }

  const juriList = await db.juri.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { kodeJuri: "asc" },
    select: { id: true, kodeJuri: true, nama: true },
  });

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-8">
      <div className="mb-6 text-center">
        <div className="mb-3 flex justify-center">
          <Emblem size={74} />
        </div>
        <p className="text-[0.65rem] tracking-[0.35em] text-muted">MBTECH</p>
        <h1 className="font-title gold-text mt-0.5 text-2xl font-bold leading-tight sm:text-3xl">
          RIDING WITH STYLE
        </h1>
        <p className="font-title mt-0.5 text-base tracking-[0.35em] text-gold-light">
          AWARDS 2026
        </p>
        <hr className="hairline mx-auto mt-4 w-40" />
        <p className="mt-3 text-xs text-muted">Aplikasi Penjurian & Rekap Nilai</p>
      </div>
      <div className="card p-5 sm:p-6">
        <LoginForm juriList={juriList} />
        <PwaInstallPrompt />
      </div>
      <p className="mt-5 text-center text-xs text-muted">
        Keputusan dewan juri bersifat mutlak dan final.
      </p>
    </main>
  );
}
