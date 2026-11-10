import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { getEvent } from "@/lib/event";
import { PageTitle } from "@/components/Shell";
import { KriteriaForm } from "./KriteriaForm";

export const metadata = { title: "Kriteria & Bobot Penilaian" };

export default async function AdminKriteriaPage() {
  await requireAdmin();

  const [ev, kriteria, totalNilai] = await Promise.all([
    getEvent(),
    db.kriteria.findMany({ orderBy: [{ urutan: "asc" }, { id: "asc" }] }),
    db.penilaian.count(),
  ]);

  const canEdit = ev.fase === "PERSIAPAN" && totalNilai === 0;
  let lockReason: string | undefined;
  if (ev.fase !== "PERSIAPAN") {
    lockReason = `Kriteria hanya dapat diedit pada fase PERSIAPAN (fase saat ini: ${ev.fase}).`;
  } else if (totalNilai > 0) {
    lockReason = `Sudah ada ${totalNilai} data penilaian yang tersimpan di sistem. Kriteria terkunci demi integritas nilai.`;
  }

  const kriteriaList = kriteria.map((k) => ({
    id: k.id,
    kode: k.kode,
    nama: k.nama,
    deskripsi: k.deskripsi,
    bobot: k.bobot.toString(),
  }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-5">
      <PageTitle
        title="Kriteria & Bobot Penilaian"
        subtitle="Kriteria penilaian resmi sesuai poster MBtech Riding With Style Awards 2026."
      />
      <KriteriaForm kriteriaList={kriteriaList} canEdit={canEdit} lockReason={lockReason} />
    </main>
  );
}
