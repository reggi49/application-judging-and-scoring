import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { getEvent, loadKriteria } from "@/lib/event";
import { getPenilaianState } from "@/lib/penilaian";
import { PageTitle } from "@/components/Shell";
import { PenilaianPanel } from "@/components/PenilaianPanel";

export const metadata = { title: "Input Nilai Fallback (Admin)" };

export default async function AdminInputNilaiPage({
  searchParams,
}: {
  searchParams: Promise<{ juriId?: string; kode?: string }>;
}) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const juriId = Number(sp.juriId);
  const kode = sp.kode?.trim().toUpperCase();

  const [ev, kriteria, allJuri, allKarya] = await Promise.all([
    getEvent(),
    loadKriteria(),
    db.juri.findMany({ where: { isActive: true, deletedAt: null }, orderBy: { kodeJuri: "asc" } }),
    db.karya.findMany({
      where: { deletedAt: null, peserta: { deletedAt: null } },
      include: { peserta: true },
      orderBy: { kodeKarya: "asc" },
    }),
  ]);

  const selectedJuri = allJuri.find((j) => j.id === juriId);
  const selectedKarya = allKarya.find((k) => k.kodeKarya === kode);

  if (selectedJuri && selectedKarya) {
    const [karyaDetail, initial] = await Promise.all([
      db.karya.findUniqueOrThrow({
        where: { id: selectedKarya.id },
        include: {
          peserta: true,
          gambar: { orderBy: [{ urutan: "asc" }, { id: "asc" }], select: { id: true } },
        },
      }),
      getPenilaianState(selectedJuri.id, selectedKarya.kodeKarya),
    ]);

    return (
      <main>
        <PenilaianPanel
          mode="admin"
          onBehalfOf={`${selectedJuri.nama} (${selectedJuri.kodeJuri})`}
          scope={`admin-${admin.id}-for-${selectedJuri.id}`}
          endpoint={`/api/admin/penilaian?juriId=${selectedJuri.id}`}
          karya={{
            kode: karyaDetail.kodeKarya,
            nama: karyaDetail.namaKarya,
            peserta: karyaDetail.peserta.nama,
            kodePeserta: karyaDetail.peserta.kodePeserta,
            deskripsi: karyaDetail.deskripsi,
            fotos: karyaDetail.gambar,
          }}
          kriteria={kriteria}
          initial={initial}
          fase={ev.fase}
          backHref="/admin/nilai/input"
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-5">
      <PageTitle
        title="Input Nilai Pengganti (Fallback)"
        subtitle="Digunakan apabila smartphone juri mengalami kendala fisik/teknis di lokasi acara. Nilai diinput admin atas nama juri bersangkutan dan dicatat transparan di audit log."
        actions={
          <Link href="/admin/nilai" className="btn btn-ghost btn-sm">
            ‹ Kembali ke Rekap
          </Link>
        }
      />

      <div className="card max-w-xl p-5 sm:p-6">
        <h2 className="font-title text-lg font-bold text-gold-light">Pilih Juri & Karya</h2>
        <form method="GET" action="/admin/nilai/input" className="mt-4 space-y-4">
          <div>
            <label htmlFor="juriId" className="label">
              Juri yang Diwakilkan *
            </label>
            <select id="juriId" name="juriId" defaultValue={juriId || ""} className="input" required>
              <option value="" disabled>
                -- Pilih Dewan Juri --
              </option>
              {allJuri.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.kodeJuri} — {j.nama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="kode" className="label">
              Karya yang Dinilai *
            </label>
            <select id="kode" name="kode" defaultValue={kode || ""} className="input" required>
              <option value="" disabled>
                -- Pilih Karya Peserta --
              </option>
              {allKarya.map((k) => (
                <option key={k.kodeKarya} value={k.kodeKarya}>
                  {k.kodeKarya} — {k.namaKarya} ({k.peserta.nama})
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-gold w-full">
            Buka Panel Penilaian ➔
          </button>
        </form>
      </div>
    </main>
  );
}
