import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { PageTitle } from "@/components/Shell";
import { AdminPesertaTable, type AdminPesertaItem } from "./AdminPesertaTable";
import { PesertaSlotControl } from "./PesertaSlotControl";

export const metadata = { title: "Kelola Peserta" };

export default async function PesertaIndexPage() {
  await requireAdmin();
  const peserta = await db.peserta.findMany({
    where: { deletedAt: null },
    include: { _count: { select: { karya: { where: { deletedAt: null } } } } },
    orderBy: { kodePeserta: "asc" },
  });

  const items: AdminPesertaItem[] = peserta.map((p) => ({
    id: p.id,
    kodePeserta: p.kodePeserta,
    nama: p.nama,
    deskripsi: p.deskripsi,
    karyaCount: p._count.karya,
    canDelete: p.karyaCounter === 0 && p._count.karya === 0,
  }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-5">
      <PageTitle
        title="Daftar Peserta"
        subtitle={`Kelola seluruh ${items.length} bengkel/peserta kompetisi modifikasi jok RWSA 2026.`}
        actions={
          <Link href="/admin/peserta/baru" className="btn btn-gold btn-sm font-bold">
            + Tambah Peserta
          </Link>
        }
      />

      <PesertaSlotControl currentTotal={items.length} />

      <AdminPesertaTable items={items} />
    </main>
  );
}
