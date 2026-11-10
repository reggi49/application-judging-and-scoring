import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireJuri } from "@/lib/dal";
import { getEvent, loadKriteria } from "@/lib/event";
import { getPenilaianState } from "@/lib/penilaian";
import { PenilaianPanel } from "@/components/PenilaianPanel";

export async function generateMetadata({ params }: { params: Promise<{ kode: string }> }) {
  const kode = (await params).kode;
  return { title: `Nilai ${kode}` };
}

export default async function JuriNilaiPage({ params }: { params: Promise<{ kode: string }> }) {
  const u = await requireJuri();
  const juri = u.juri!;
  const kode = (await params).kode;

  const [ev, kriteria, karya, initial] = await Promise.all([
    getEvent(),
    loadKriteria(),
    db.karya.findFirst({
      where: { kodeKarya: kode, deletedAt: null, peserta: { deletedAt: null } },
      include: {
        peserta: true,
        gambar: { orderBy: [{ urutan: "asc" }, { id: "asc" }], select: { id: true } },
      },
    }),
    getPenilaianState(juri.id, kode),
  ]);

  if (!karya) notFound();

  return (
    <main>
      <PenilaianPanel
        mode="juri"
        scope={`juri-${juri.id}`}
        endpoint="/api/juri/penilaian"
        karya={{
          kode: karya.kodeKarya,
          nama: karya.namaKarya,
          peserta: karya.peserta.nama,
          kodePeserta: karya.peserta.kodePeserta,
          deskripsi: karya.deskripsi,
          fotos: karya.gambar,
        }}
        kriteria={kriteria}
        initial={initial}
        fase={ev.fase}
        backHref="/juri"
      />
    </main>
  );
}
