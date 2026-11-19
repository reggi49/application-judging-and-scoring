import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { getEvent } from "@/lib/event";
import { PageTitle } from "@/components/Shell";
import { RekapNilaiTable, type PenilaianRowView } from "./RekapNilaiTable";

export const metadata = { title: "Rekap Nilai Penjurian" };

export default async function AdminNilaiPage() {
  await requireAdmin();

  const [ev, penilaian] = await Promise.all([
    getEvent(),
    db.penilaian.findMany({
      include: {
        juri: true,
        karya: { include: { peserta: true } },
        detail: {
          include: { kriteria: true },
          orderBy: { kriteria: { urutan: "asc" } },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
    }),
  ]);

  const rows: PenilaianRowView[] = penilaian.map((p) => {
    const details = p.detail.map((d) => {
      const bobot = Number(d.kriteria.bobot);
      const poin = (d.nilai * bobot) / 100;
      return {
        id: d.id,
        kriteriaId: d.kriteriaId,
        nilai: d.nilai,
        kriteriaKode: d.kriteria.kode,
        kriteriaNama: d.kriteria.nama,
        bobotPersen: bobot,
        poinFormatted: poin.toFixed(2).replace(".", ","),
      };
    });

    const skor = p.skorJuri ? Number(p.skorJuri).toFixed(2).replace(".", ",") : "—";
    const dateFormatted = new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(p.updatedAt);

    return {
      id: p.id,
      kodeKarya: p.karya.kodeKarya,
      namaKarya: p.karya.namaKarya,
      namaPeserta: p.karya.peserta.nama,
      kodePeserta: p.karya.peserta.kodePeserta,
      kodeJuri: p.juri.kodeJuri,
      namaJuri: p.juri.nama,
      status: p.status,
      skorJuriFormatted: skor,
      catatan: p.catatan,
      updatedAtFormatted: dateFormatted,
      details,
    };
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-5">
      <PageTitle
        title="Rekap Nilai Penjurian"
        subtitle="Rincian seluruh nilai yang masuk dari dewan juri, detail per kriteria & bobot, status, serta kontrol unlock."
        actions={
          <Link href="/admin/nilai/input" className="btn btn-gold btn-sm">
            Input Nilai Pengganti (Fallback)
          </Link>
        }
      />

      <RekapNilaiTable rows={rows} fase={ev.fase} />
    </main>
  );
}
