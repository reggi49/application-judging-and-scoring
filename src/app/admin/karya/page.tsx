import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { PageTitle } from "@/components/Shell";
import { DeleteButton } from "@/components/DeleteButton";
import { deleteKaryaAction } from "../actions";

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

  return (
    <main className="mx-auto max-w-7xl px-4 py-5">
      <PageTitle
        title="Daftar Karya"
        subtitle="Kelola karya modifikasi jok motor peserta RWSA 2026."
        actions={
          <Link href="/admin/karya/baru" className="btn btn-gold btn-sm">
            + Form Submit Karya
          </Link>
        }
      />

      <div className="card table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th className="w-16">Foto</th>
              <th>ID Karya</th>
              <th>Nama Karya</th>
              <th>Peserta</th>
              <th className="num text-center">Foto</th>
              <th className="num text-center">Juri Final</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {karya.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted">
                  Belum ada karya. Klik &quot;+ Form Submit Karya&quot; untuk mendaftarkan karya baru.
                </td>
              </tr>
            ) : (
              karya.map((k) => (
                <tr key={k.id}>
                  <td>
                    <div className="relative aspect-[4/3] w-14 overflow-hidden rounded bg-panel">
                      {k.gambar[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/foto/${k.gambar[0].id}?t=1`}
                          alt={k.namaKarya}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-[0.65rem] text-muted">
                          N/A
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="num font-semibold text-gold-light">{k.kodeKarya}</td>
                  <td className="font-semibold text-cream">{k.namaKarya}</td>
                  <td>
                    <div className="text-cream">{k.peserta.nama}</div>
                    <div className="text-xs text-muted">{k.peserta.kodePeserta}</div>
                  </td>
                  <td className="num text-center">
                    <span className={`badge ${k._count.gambar > 0 ? "badge-gold" : "badge-warn"}`}>
                      {k._count.gambar}/5
                    </span>
                  </td>
                  <td className="num text-center">
                    <span className="badge">{k._count.penilaian}</span>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/karya/${k.id}`} className="btn btn-ghost btn-sm">
                        Kelola
                      </Link>
                      {k._count.penilaian === 0 && (
                        <DeleteButton
                          action={deleteKaryaAction}
                          id={k.id}
                          confirm={`Hapus karya ${k.kodeKarya}?`}
                        />
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

