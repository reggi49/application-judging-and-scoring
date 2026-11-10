import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { PageTitle } from "@/components/Shell";
import { JuriManager } from "./JuriManager";

export const metadata = { title: "Kelola Juri" };

export default async function AdminJuriPage() {
  await requireAdmin();

  const juri = await db.juri.findMany({
    where: { deletedAt: null },
    include: {
      user: { select: { username: true } },
      _count: { select: { penilaian: { where: { status: "FINAL" } } } },
    },
    orderBy: { kodeJuri: "asc" },
  });

  const juriList = juri.map((j) => ({
    id: j.id,
    kodeJuri: j.kodeJuri,
    nama: j.nama,
    username: j.user.username,
    isActive: j.isActive,
    finalCount: j._count.penilaian,
  }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-5">
      <PageTitle
        title="Dewan Juri"
        subtitle="Kelola akun dewan juri, status aktif, dan reset password akses login."
      />
      <JuriManager juriList={juriList} />
    </main>
  );
}

