import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { PageTitle } from "@/components/Shell";
import { DeleteButton } from "@/components/DeleteButton";
import { deletePesertaAction } from "../actions";

export const metadata = { title: "Kelola Peserta" };

export default async function PesertaIndexPage() {
  await requireAdmin();
  const peserta = await db.peserta.findMany({
    where: { deletedAt: null },
    include: { _count: { select: { karya: { where: { deletedAt: null } } } } },
    orderBy: { kodePeserta: "asc" },
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-5">
      <PageTitle
        title="Daftar Peserta"
        subtitle="Kelola peserta kompetisi. ID peserta adalah akronim unik."
        actions={
          <Link href="/admin/peserta/baru" className="btn btn-gold btn-sm">
            + Tambah Peserta
          </Link>
        }
      />

      <div className="card table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>ID (Akronim)</th>
              <th>Nama Peserta</th>
              <th>Deskripsi</th>
              <th className="num text-center">Jumlah Karya</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {peserta.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted">
                  Belum ada peserta. Tambah peserta pertama Anda.
                </td>
              </tr>
            ) : (
              peserta.map((p) => (
                <tr key={p.id}>
                  <td className="num font-semibold text-gold-light">{p.kodePeserta}</td>
                  <td className="font-semibold text-cream">{p.nama}</td>
                  <td className="max-w-xs truncate text-xs text-muted">{p.deskripsi || "—"}</td>
                  <td className="num text-center">
                    <span className="badge">{p._count.karya}</span>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/peserta/${p.id}`} className="btn btn-ghost btn-sm">
                        Edit
                      </Link>
                      {p.karyaCounter === 0 && (
                        <DeleteButton action={deletePesertaAction} id={p.id} confirm={`Hapus peserta ${p.kodePeserta}?`} />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
