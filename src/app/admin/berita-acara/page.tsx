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

  const [data, ev] = await Promise.all([
    buildRanking(),
    getEvent(),
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
    <main className="mx-auto max-w-5xl px-3 sm:px-4 py-4 sm:py-8 w-full">
      {/* Tombol Aksi Layar (Disembunyikan saat dicetak) */}
      <div className="no-print mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
        <Link href="/admin" className="btn btn-ghost btn-sm font-bold w-fit">
          ‹ Kembali ke Dashboard
        </Link>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <a
            href="/api/admin/export/csv"
            download
            className="btn btn-ghost btn-sm font-bold flex-1 sm:flex-none justify-center"
          >
            ⬇ Unduh CSV / Excel
          </a>
          <PrintButton />
        </div>
      </div>

      {/* DOKUMEN RESMI BERITA ACARA */}
      <div className="card bg-panel p-4 sm:p-8 md:p-10 text-cream print:bg-white print:text-black print:p-0 print:border-0 print:shadow-none shadow-2xl border-line">
        {/* KOP RESMI */}
        <div className="border-b-2 border-gold pb-6 text-center print:border-black">
          <div className="flex justify-center mb-2">
            <Emblem size={56} />
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#ded7c8] font-bold print:text-gray-600">
            MBTECH MOTORCYCLE DESIGN CONTEST
          </p>
          <h1 className="font-title gold-text text-2xl font-black sm:text-3xl print:text-black print:text-2xl mt-1 tracking-wide">
            BERITA ACARA HASIL PENJURIAN
          </h1>
          <p className="font-title text-base sm:text-lg tracking-widest text-gold-light print:text-gray-800 font-bold">
            RIDING WITH STYLE AWARDS 2026
          </p>
          <p className="mt-2 text-xs font-semibold text-[#ded7c8] print:text-gray-600">
            Tanggal Cetak: {tanggalStr} · Status Event: <strong className="text-white print:text-black">{ev.fase}</strong>
          </p>
        </div>

        {/* PERNYATAAN PEMBUKA */}
        <div className="mt-6 text-sm leading-relaxed text-[#ded7c8] print:text-gray-800">
          <p>
            Pada hari ini, dewan juri kompetisi modifikasi jok motor{" "}
            <strong className="text-white print:text-black">MBtech Riding With Style Awards 2026</strong> telah menyelesaikan seluruh
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
        <div className="my-6 grid gap-3 sm:gap-4 sm:grid-cols-3">
          {/* JUARA 1 */}
          <div className="rounded-xl border-2 border-gold bg-gradient-to-br from-gold/15 via-panel2 to-panel p-4 text-center print:border-black print:bg-gray-100 shadow-md">
            <span className="text-3xl">🥇</span>
            <div className="font-title gold-text text-lg sm:text-xl font-black print:text-black mt-1">
              JUARA I
            </div>
            <div className="text-[0.7rem] uppercase tracking-wider text-gold-light print:text-gray-600 font-bold">
              Plakat + Uang Tunai
            </div>
            {juara1 ? (
              <div className="mt-2.5">
                <div className="num font-black text-gold-light print:text-black text-lg">
                  {juara1.kodeKarya}
                </div>
                <div className="font-extrabold text-sm text-white print:text-black mt-0.5">
                  {juara1.namaKarya}
                </div>
                <div className="text-xs text-[#ded7c8] print:text-gray-700 mt-0.5">
                  {juara1.namaPeserta} ({juara1.kodePeserta})
                </div>
                <div className="num font-black text-gold print:text-black text-base mt-1.5">
                  Rata-rata: {juara1.rataText}
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#ded7c8] mt-2">— Belum final —</p>
            )}
          </div>

          {/* JUARA 2 */}
          <div className="rounded-xl border border-slate-400/60 bg-gradient-to-br from-slate-400/10 via-panel2 to-panel p-4 text-center print:border-black print:bg-gray-50 shadow-md">
            <span className="text-3xl">🥈</span>
            <div className="font-title text-lg sm:text-xl font-black text-slate-200 print:text-black mt-1">
              JUARA II
            </div>
            <div className="text-[0.7rem] uppercase tracking-wider text-[#ded7c8] print:text-gray-600 font-bold">
              Plakat + Uang Tunai
            </div>
            {juara2 ? (
              <div className="mt-2.5">
                <div className="num font-black text-slate-200 print:text-black text-lg">
                  {juara2.kodeKarya}
                </div>
                <div className="font-extrabold text-sm text-white print:text-black mt-0.5">
                  {juara2.namaKarya}
                </div>
                <div className="text-xs text-[#ded7c8] print:text-gray-700 mt-0.5">
                  {juara2.namaPeserta} ({juara2.kodePeserta})
                </div>
                <div className="num font-black text-white print:text-black text-base mt-1.5">
                  Rata-rata: {juara2.rataText}
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#ded7c8] mt-2">— Belum final —</p>
            )}
          </div>

          {/* JUARA 3 */}
          <div className="rounded-xl border border-amber-700/60 bg-gradient-to-br from-amber-700/10 via-panel2 to-panel p-4 text-center print:border-black print:bg-gray-50 shadow-md">
            <span className="text-3xl">🥉</span>
            <div className="font-title text-lg sm:text-xl font-black text-amber-500 print:text-black mt-1">
              JUARA III
            </div>
            <div className="text-[0.7rem] uppercase tracking-wider text-[#ded7c8] print:text-gray-600 font-bold">
              Plakat + Uang Tunai
            </div>
            {juara3 ? (
              <div className="mt-2.5">
                <div className="num font-black text-amber-500 print:text-black text-lg">
                  {juara3.kodeKarya}
                </div>
                <div className="font-extrabold text-sm text-white print:text-black mt-0.5">
                  {juara3.namaKarya}
                </div>
                <div className="text-xs text-[#ded7c8] print:text-gray-700 mt-0.5">
                  {juara3.namaPeserta} ({juara3.kodePeserta})
                </div>
                <div className="num font-black text-white print:text-black text-base mt-1.5">
                  Rata-rata: {juara3.rataText}
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#ded7c8] mt-2">— Belum final —</p>
            )}
          </div>
        </div>

        {/* TABEL PERINGKAT LENGKAP */}
        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h2 className="font-title text-base sm:text-lg font-bold text-gold-light print:text-black">
              Rekapitulasi Peringkat Resmi Peserta
            </h2>
            <span className="sm:hidden text-[11px] text-[#ded7c8] font-semibold">
              Geser ke kanan ➔
            </span>
          </div>

          {/* Container table-wrap: MENCEGAH TABLE MELEBARKAN VIEWPORT MOBILE */}
          <div className="table-wrap overflow-x-auto rounded-xl border border-line bg-panel2/30 shadow-inner print:overflow-visible print:border-0 print:bg-transparent">
            <table className="tbl print:text-xs w-full min-w-[620px] sm:min-w-full">
              <thead>
                <tr>
                  <th className="w-14 text-center">Rank</th>
                  <th className="w-32">ID Karya</th>
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
                    <tr
                      key={r.karyaId}
                      className={
                        r.peringkat === 1
                          ? "bg-gold/15 font-bold"
                          : r.peringkat === 2
                            ? "bg-slate-400/10 font-bold"
                            : r.peringkat === 3
                              ? "bg-amber-700/10 font-bold"
                              : ""
                      }
                    >
                      <td className="num text-center font-bold">
                        {r.peringkat === 1 ? "🥇 1" : r.peringkat === 2 ? "🥈 2" : r.peringkat === 3 ? "🥉 3" : r.peringkat}
                        {r.seri && <span className="text-[0.65rem] block text-warn font-black">SERI</span>}
                      </td>
                      <td className="num font-black text-gold-light print:text-black tracking-wide">
                        {r.kodeKarya}
                      </td>
                      <td className="font-bold text-white print:text-black">{r.namaKarya}</td>
                      <td className="text-[#ded7c8] print:text-gray-700 font-medium">
                        {r.namaPeserta} <span className="text-gold-light font-semibold">({r.kodePeserta})</span>
                      </td>
                      {data.juri.map((j) => (
                        <td key={j.id} className="num text-right text-[#ded7c8] print:text-black">
                          {perJuriMap.get(j.id) ?? "—"}
                        </td>
                      ))}
                      <td className="num text-right font-bold text-white print:text-black">{r.totalText}</td>
                      <td className="num font-black text-right text-gold-light print:text-black text-base">
                        {r.rataText}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* KLAUSUL PENUTUP */}
        <div className="mt-8 text-xs text-[#ded7c8] print:text-gray-600 leading-relaxed border-t border-line/60 pt-4 print:border-black">
          <p>
            * Sesuai ketentuan resmi kompetisi MBtech Riding With Style Awards 2026, keputusan
            dewan juri bersifat <strong className="text-white print:text-black">mutlak, final, dan tidak dapat diganggu gugat</strong>.
          </p>
        </div>

        {/* KOLOM TANDA TANGAN */}
        <div className="mt-10 pt-6 border-t-2 border-line print:border-black">
          <div className="text-center font-bold text-xs uppercase tracking-widest text-gold-light print:text-gray-700 mb-6">
            Dewan Juri Yang Bertugas
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 text-center">
            {data.juri.map((j) => (
              <div key={j.id} className="flex flex-col justify-between h-28">
                <span className="text-xs font-semibold text-[#ded7c8] print:text-gray-600">
                  Dewan Juri ({j.kodeJuri})
                </span>
                <div>
                  <div className="border-b-2 border-line/90 print:border-black mx-auto w-28 sm:w-36 mb-1.5" />
                  <span className="font-bold text-xs text-white print:text-black">
                    {j.nama}
                  </span>
                </div>
              </div>
            ))}
            <div className="flex flex-col justify-between h-28 col-span-2 sm:col-span-1">
              <span className="text-xs font-semibold text-[#ded7c8] print:text-gray-600">Ketua Panitia RWSA</span>
              <div>
                <div className="border-b-2 border-line/90 print:border-black mx-auto w-28 sm:w-36 mb-1.5" />
                <span className="font-bold text-xs text-white print:text-black">
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
