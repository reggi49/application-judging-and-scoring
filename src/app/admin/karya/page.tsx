import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { PageTitle } from "@/components/Shell";
import { AdminKaryaTable, type AdminKaryaItem } from "./AdminKaryaTable";

export const metadata = { title: "Kelola Karya" };

export default async function KaryaIndexPage() {
  await requireAdmin();
  const karya = await db.karya.findMany({
    where: { deletedAt: null, peserta: { deletedAt: null } },
    include: {
      peserta: true,
      gambar: { where: { isCover: true }, select: { id: true } },
      _count: { select: { gambar: true, penilaian: { where: { status: "FINAL" } } } },
    },
    orderBy: { kodeKarya: "asc" },
  });

  const items: AdminKaryaItem[] = karya.map((k) => ({
    id: k.id,
    kodeKarya: k.kodeKarya,
    namaKarya: k.namaKarya,
    pesertaNama: k.peserta.nama,
    pesertaKode: k.peserta.kodePeserta,
    coverFotoId: k.gambar[0]?.id ?? null,
    fotoCount: k._count.gambar,
    penilaianCount: k._count.penilaian,
  }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-5">
      <PageTitle
        title="Daftar Karya Motor"
        subtitle={`Kelola seluruh ${items.length} karya modifikasi jok motor peserta RWSA 2026.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/karya/label" className="btn btn-ghost btn-sm font-bold">
              🏷️ Cetak Label Motor
            </Link>
            <Link href="/admin/karya/baru" className="btn btn-gold btn-sm font-bold">
              + Form Submit Karya
            </Link>
          </div>
        }
      />

      <AdminKaryaTable items={items} />
    </main>
  );
}
