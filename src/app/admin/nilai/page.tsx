import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { getEvent } from "@/lib/event";
import { PageTitle } from "@/components/Shell";
import { SubmitButton } from "@/components/FormBits";
import { unlockPenilaianAction } from "../actions";

export const metadata = { title: "Rekap Nilai Penjurian" };

export default async function AdminNilaiPage() {
  await requireAdmin();

  const [ev, penilaian] = await Promise.all([
    getEvent(),
    db.penilaian.findMany({
      include: {
        juri: true,
        karya: { include: { peserta: true } },
        detail: { include: { kriteria: true } },
      },
      orderBy: [{ updatedAt: "desc" }],
    }),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-5">
      <PageTitle
        title="Rekap Nilai Penjurian"
        subtitle="Rincian seluruh nilai yang masuk dari dewan juri, status draft/final, dan kontrol unlock."
        actions={
          <Link href="/admin/nilai/input" className="btn btn-gold btn-sm">
            ⚡ Input Nilai Pengganti (Fallback)
          </Link>
        }
      />

      <div className="card table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>ID Karya</th>
              <th>Nama Karya & Peserta</th>
              <th>Juri</th>
              <th className="num text-center">Status</th>
              <th className="num text-right">Skor Total</th>
              <th className="text-center">Input Oleh</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {penilaian.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted">
                  Belum ada nilai yang masuk dari dewan juri.
                </td>
              </tr>
            ) : (
              penilaian.map((p) => (
                <tr key={p.id}>
                  <td className="num font-semibold text-gold-light">{p.karya.kodeKarya}</td>
                  <td>
                    <div className="font-semibold text-cream">{p.karya.namaKarya}</div>
                    <div className="text-xs text-muted">
                      {p.karya.peserta.nama} ({p.karya.peserta.kodePeserta})
                    </div>
                  </td>
                  <td>
                    <div className="font-semibold text-cream">{p.juri.nama}</div>
                    <div className="text-xs text-muted">{p.juri.kodeJuri}</div>
                  </td>
                  <td className="num text-center">
                    <span className={`badge ${p.status === "FINAL" ? "badge-ok" : "badge-warn"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="num text-right">
                    <span className="font-title text-base font-bold text-gold-light">
                      {p.skorJuri ? p.skorJuri.toFixed(2).replace(".", ",") : "—"}
                    </span>
                  </td>
                  <td className="text-center">
                    <span
                      className={`badge ${
                        p.inputOleh === "ADMIN" ? "badge-warn" : "badge-gold"
                      }`}
                    >
                      {p.inputOleh}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      {p.status === "FINAL" && ev.fase === "PENJURIAN" && (
                        <form action={unlockPenilaianAction}>
                          <input type="hidden" name="id" value={p.id} />
                          <SubmitButton
                            className="btn btn-ghost btn-sm text-xs text-warn"
                            confirm={`Buka kunci nilai ${p.karya.kodeKarya} oleh juri ${p.juri.kodeJuri}? Nilai akan kembali ke DRAFT dan dapat diedit oleh juri.`}
                          >
                            🔓 Buka Kunci
                          </SubmitButton>
                        </form>
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

