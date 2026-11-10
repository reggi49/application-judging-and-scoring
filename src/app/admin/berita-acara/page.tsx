import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { buildRanking } from "@/lib/ranking";
import { getEvent } from "@/lib/event";
import { Emblem } from "@/components/Shell";
import { PrintButton } from "./PrintButton";

export const metadata = { title: "Berita Acara Penjurian" };

export default async function BeritaAcaraPage() {
  await requireAdmin();

  const [data, ev, settings] = await Promise.all([
    buildRanking(),
    getEvent(),
    db.eventSetting.findUnique({ where: { id: 1 } }),
  ]);

  const juara1 = data.resmi.find((r) => r.peringkat === 1);
  const juara2 = data.resmi.find((r) => r.peringkat === 2);
  const juara3 = data.resmi.find((r) => r.peringkat === 3);

  const tanggalStr = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* Tombol Aksi Layar (Disembunyikan saat dicetak) */}
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <Link href="/admin" className="btn btn-ghost btn-sm">
          ‹ Kembali ke Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <a href="/api/admin/export/csv" download className="btn btn-ghost btn-sm">
            ⬇ Unduh CSV / Excel
          </a>
          <PrintButton />
        </div>
      </div>

      {/* DOKUMEN RESMI BERITA ACARA */}
      <div className="card bg-panel p-6 sm:p-10 text-cream print:bg-white print:text-black print:p-0 print:border-0 print:shadow-none">
        {/* KOP RESMI */}
        <div className="border-b-2 border-gold pb-6 text-center print:border-black">
          <div className="flex justify-center mb-2">
            <Emblem size={56} />
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted print:text-gray-600">
            MBTECH MOTORCYCLE DESIGN CONTEST
          </p>
          <h1 className="font-title gold-text text-2xl font-bold sm:text-3xl print:text-black print:text-2xl mt-1">
            BERITA ACARA HASIL PENJURIAN
          </h1>
          <p className="font-title text-base tracking-widest text-gold-light print:text-gray-800">
            RIDING WITH STYLE AWARDS 2026
          </p>
          <p className="mt-2 text-xs text-muted print:text-gray-600">
            Tanggal Cetak: {tanggalStr} · Status Event: <strong>{ev.fase}</strong>
          </p>
        </div>

        {/* PERNYATAAN PEMBUKA */}
        <div className="mt-6 text-sm leading-relaxed text-muted print:text-gray-800">
          <p>
            Pada hari ini, dewan juri kompetisi modifikasi jok motor{" "}
            <strong>MBtech Riding With Style Awards 2026</strong> telah menyelesaikan seluruh
            proses penilaian fisik karya peserta secara objektif dan seksama berdasarkan empat
            kriteria resmi: <em>Kreativitas Design (30%)</em>, <em>Kreativitas Pola & Grafis (30%)</em>,{" "}
            <em>Kualitas Pengerjaan (20%)</em>, dan <em>Kenyamanan & Penampilan (20%)</em>.
          </p>
          <p className="mt-2">
            Berdasarkan akumulasi skor akhir berbobot, dewan juri dengan ini menetapkan daftar
            pemenang kejuaraan sebagai berikut:
          </p>
        </div>

        {/* DAFTAR PEMENANG (JUARA 1, 2, 3) */}
        <div className="my-6 grid gap-4 sm:grid-cols-3">
          {/* JUARA 1 */}
          <div className="rounded-lg border border-gold-dark bg-gold/10 p-4 text-center print:border-black print:bg-gray-100">
            <span className="text-2xl">🥇</span>
            <div className="font-title gold-text text-lg font-bold print:text-black mt-1">
              JUARA I
            </div>
            <div className="text-[0.7rem] uppercase tracking-wider text-muted print:text-gray-600">
              Plakat + Uang Tunai
            </div>
            {juara1 ? (
              <div className="mt-2">
                <div className="num font-bold text-cream print:text-black text-base">
                  {juara1.kodeKarya}
                </div>
                <div className="font-semibold text-xs text-gold-light print:text-black">
                  {juara1.namaKarya}
                </div>
                <div className="text-xs text-muted print:text-gray-700">
                  {juara1.namaPeserta} ({juara1.kodePeserta})
                </div>
                <div className="num font-bold text-gold print:text-black text-sm mt-1">
                  Rata-rata: {juara1.rataText}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted mt-2">— Belum final —</p>
            )}
          </div>

          {/* JUARA 2 */}
          <div className="rounded-lg border border-line bg-panel2 p-4 text-center print:border-black print:bg-gray-50">
            <span className="text-2xl">🥈</span>
            <div className="font-title text-lg font-bold text-cream print:text-black mt-1">
              JUARA II
            </div>
            <div className="text-[0.7rem] uppercase tracking-wider text-muted print:text-gray-600">
              Plakat + Uang Tunai
            </div>
            {juara2 ? (
              <div className="mt-2">
                <div className="num font-bold text-cream print:text-black text-base">
                  {juara2.kodeKarya}
                </div>
                <div className="font-semibold text-xs text-cream print:text-black">
                  {juara2.namaKarya}
                </div>
                <div className="text-xs text-muted print:text-gray-700">
                  {juara2.namaPeserta} ({juara2.kodePeserta})
                </div>
                <div className="num font-bold text-cream print:text-black text-sm mt-1">
                  Rata-rata: {juara2.rataText}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted mt-2">— Belum final —</p>
            )}
          </div>

          {/* JUARA 3 */}
          <div className="rounded-lg border border-line bg-panel2 p-4 text-center print:border-black print:bg-gray-50">
            <span className="text-2xl">🥉</span>
            <div className="font-title text-lg font-bold text-cream print:text-black mt-1">
              JUARA III
            </div>
            <div className="text-[0.7rem] uppercase tracking-wider text-muted print:text-gray-600">
              Plakat + Uang Tunai
            </div>
            {juara3 ? (
              <div className="mt-2">
                <div className="num font-bold text-cream print:text-black text-base">
                  {juara3.kodeKarya}
                </div>
                <div className="font-semibold text-xs text-cream print:text-black">
                  {juara3.namaKarya}
                </div>
                <div className="text-xs text-muted print:text-gray-700">
                  {juara3.namaPeserta} ({juara3.kodePeserta})
                </div>
                <div className="num font-bold text-cream print:text-black text-sm mt-1">
                  Rata-rata: {juara3.rataText}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted mt-2">— Belum final —</p>
            )}
          </div>
        </div>

        {/* TABEL PERINGKAT LENGKAP */}
        <div className="mt-8">
          <h2 className="font-title text-base font-bold text-gold-light print:text-black mb-2">
            Rekapitulasi Peringkat Resmi Peserta
          </h2>
          <table className="tbl print:text-xs">
            <thead>
              <tr>
                <th className="w-12 text-center">Rank</th>
                <th>ID Karya</th>
                <th>Nama Karya</th>
                <th>Peserta</th>
                {data.juri.map((j) => (
                  <th key={j.id} className="num text-right">
                    {j.kodeJuri}
                  </th>
                ))}
                <th className="num text-right font-bold">Total</th>
                <th className="num text-right font-bold text-gold-light print:text-black">
                  Rata-rata
                </th>
              </tr>
            </thead>
            <tbody>
              {data.resmi.map((r) => {
                const perJuriMap = new Map(r.perJuri.map((p) => [p.juriId, p.skorText]));
                return (
                  <tr key={r.karyaId}>
                    <td className="num text-center font-bold">
                      {r.peringkat}
                      {r.seri && <span className="text-[0.6rem] block text-warn">SERI</span>}
                    </td>
                    <td className="num font-semibold text-gold-light print:text-black">
                      {r.kodeKarya}
                    </td>
                    <td className="font-medium text-cream print:text-black">{r.namaKarya}</td>
                    <td className="text-muted print:text-gray-700">
                      {r.namaPeserta} ({r.kodePeserta})
                    </td>
                    {data.juri.map((j) => (
                      <td key={j.id} className="num text-right text-muted print:text-black">
                        {perJuriMap.get(j.id) ?? "—"}
                      </td>
                    ))}
                    <td className="num text-right font-semibold">{r.totalText}</td>
                    <td className="num font-bold text-right text-gold-light print:text-black">
                      {r.rataText}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* KLAUSUL PENUTUP */}
        <div className="mt-8 text-xs text-muted print:text-gray-600 leading-relaxed">
          <p>
            * Sesuai ketentuan resmi kompetisi MBtech Riding With Style Awards 2026, keputusan
            dewan juri bersifat <strong>mutlak, final, dan tidak dapat diganggu gugat</strong>.
          </p>
        </div>

        {/* KOLOM TANDA TANGAN */}
        <div className="mt-12 pt-6 border-t border-line print:border-black">
          <div className="text-center font-semibold text-xs uppercase tracking-wider text-muted print:text-gray-700 mb-6">
            Dewan Juri Yang Bertugas
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-center">
            {data.juri.map((j) => (
              <div key={j.id} className="flex flex-col justify-between h-28">
                <span className="text-xs text-muted print:text-gray-600">
                  Juri ({j.kodeJuri})
                </span>
                <div>
                  <div className="border-b border-muted print:border-black mx-auto w-36 mb-1" />
                  <span className="font-semibold text-xs text-cream print:text-black">
                    {j.nama}
                  </span>
                </div>
              </div>
            ))}
            <div className="flex flex-col justify-between h-28 col-span-2 sm:col-span-1">
              <span className="text-xs text-muted print:text-gray-600">Ketua Panitia RWSA</span>
              <div>
                <div className="border-b border-muted print:border-black mx-auto w-36 mb-1" />
                <span className="font-semibold text-xs text-cream print:text-black">
                  ( Panitia Pelaksana )
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
