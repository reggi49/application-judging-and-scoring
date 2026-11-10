import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { PageTitle } from "@/components/Shell";
import { KaryaForm } from "./KaryaForm";

export const metadata = { title: "Form Submit Karya" };

export default async function BaruKaryaPage() {
  await requireAdmin();

  const peserta = await db.peserta.findMany({
    where: { deletedAt: null },
    orderBy: { kodePeserta: "asc" },
    select: { id: true, kodePeserta: true, nama: true, karyaCounter: true },
  });

  const pesertaList = peserta.map((p) => ({
    id: p.id,
    kodePeserta: p.kodePeserta,
    nama: p.nama,
    nextUrut: p.karyaCounter + 1,
  }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-5">
      <PageTitle
        title="Form Submit Karya"
        subtitle="Daftarkan karya modifikasi jok motor peserta. Setelah karya disimpan, Anda dapat mengunggah hingga 5 foto."
      />
      <KaryaForm pesertaList={pesertaList} />
    </main>
  );
}

