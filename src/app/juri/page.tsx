import { db } from "@/lib/db";
import { requireJuri } from "@/lib/dal";
import { getEvent } from "@/lib/event";
import { JuriKaryaList } from "./JuriKaryaList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Daftar Karya" };

export default async function JuriHomePage() {
  const u = await requireJuri();
  const juri = u.juri!;
  const [ev, karya, pen] = await Promise.all([
    getEvent(),
    db.karya.findMany({
      where: { deletedAt: null, peserta: { deletedAt: null } },
      include: {
        peserta: true,
        gambar: { where: { isCover: true }, select: { id: true } },
      },
      orderBy: { kodeKarya: "asc" },
    }),
    db.penilaian.findMany({
      where: { juriId: juri.id },
      select: { karyaId: true, status: true, skorJuri: true },
    }),
  ]);

  const byKarya = new Map(pen.map((p) => [p.karyaId, p]));
  const items = karya.map((k) => {
    const p = byKarya.get(k.id);
    return {
      id: k.id,
      kode: k.kodeKarya,
      nama: k.namaKarya,
      peserta: k.peserta.nama,
      kodePeserta: k.peserta.kodePeserta,
      whatsapp: k.whatsapp,
      coverId: k.gambar[0]?.id ?? null,
      status: (p?.status ?? "BELUM") as "BELUM" | "DRAFT" | "FINAL",
      skor: p?.skorJuri ? p.skorJuri.toFixed(2).replace(".", ",") : null,
    };
  });

  return (
    <main className="mx-auto max-w-7xl px-3 sm:px-4 py-3 sm:py-5">
      <JuriKaryaList items={items} fase={ev.fase} juriNama={juri.nama} juriKode={juri.kodeJuri} />
    </main>
  );
}

