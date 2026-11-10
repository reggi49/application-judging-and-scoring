import Link from "next/link";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { Emblem } from "@/components/Shell";
import { PrintButton } from "../../berita-acara/PrintButton";

export const metadata = { title: "Cetak Kartu Label Motor Peserta" };

export default async function CetakLabelKaryaPage() {
  await requireAdmin();

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "192.168.3.75:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const baseUrl = `${proto}://${host}`;

  const karya = await db.karya.findMany({
    where: { deletedAt: null, peserta: { deletedAt: null } },
    include: { peserta: true },
    orderBy: { kodeKarya: "asc" },
  });

  const qrMap = new Map<number, string>();
  for (const k of karya) {
    try {
      const targetUrl = `${baseUrl}/juri/karya/${k.kodeKarya}`;
      const dataUrl = await QRCode.toDataURL(targetUrl, {
        width: 140,
        margin: 1,
        color: {
          dark: "#0a0a0c",
          light: "#ffffff",
        },
      });
      qrMap.set(k.id, dataUrl);
    } catch {
      // fallback jika qrcode gagal
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* Tombol Aksi Layar */}
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <h1 className="font-title gold-text text-xl font-bold">Cetak Kartu Label Motor</h1>
          <p className="text-xs text-muted">
            Dipasang pada jok/stang motor peserta saat display agar dewan juri mudah mengenali ID karya atau scan QR untuk langsung menilai.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/karya" className="btn btn-ghost btn-sm">
            ‹ Kembali
          </Link>
          <PrintButton />
        </div>
      </div>

      {/* Grid Kartu Label Motor Peserta */}
      <div className="grid gap-6 sm:grid-cols-2 print:grid-cols-2 print:gap-4">
        {karya.map((k) => {
          const qr = qrMap.get(k.id);
          return (
            <div
              key={k.id}
              className="rounded-xl border-2 border-gold-dark bg-panel p-6 text-center text-cream print:border-2 print:border-black print:bg-white print:text-black print:p-6 print:break-inside-avoid shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-gold-dark/40 pb-3 print:border-black">
                  <div className="flex items-center gap-2">
                    <Emblem size={32} />
                    <div className="text-left">
                      <div className="font-title gold-text text-xs font-bold print:text-black leading-tight">
                        MBTECH RIDING WITH STYLE
                      </div>
                      <div className="text-[0.6rem] uppercase tracking-widest text-muted print:text-gray-600">
                        AWARDS 2026 · DISPLAY UNIT
                      </div>
                    </div>
                  </div>
                  <span className="rounded bg-gold/15 px-2 py-0.5 text-[0.65rem] font-bold text-gold-light print:border print:border-black print:text-black">
                    RWSA 2026
                  </span>
                </div>

                <div className="my-4 flex items-center justify-around gap-4">
                  <div className="text-left">
                    <span className="text-[0.65rem] uppercase tracking-[0.25em] text-muted print:text-gray-600">
                      ID PENILAIAN
                    </span>
                    <div className="num font-title gold-text text-4xl font-black print:text-black mt-1 tracking-wider">
                      {k.kodeKarya}
                    </div>
                  </div>

                  {qr && (
                    <div className="flex flex-col items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qr}
                        alt={`QR ${k.kodeKarya}`}
                        className="h-20 w-20 rounded bg-white p-1 shadow-sm print:h-20 print:w-20"
                      />
                      <span className="mt-1 text-[0.6rem] text-muted print:text-gray-600">Scan Nilai</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-line pt-3 text-left print:border-black">
                <div className="font-bold text-base text-cream print:text-black leading-snug">
                  {k.namaKarya}
                </div>
                <div className="text-xs text-gold-light print:text-gray-800 font-medium mt-1">
                  Peserta: <strong className="text-cream print:text-black">{k.peserta.nama}</strong> ({k.peserta.kodePeserta})
                </div>
                {k.deskripsi && (
                  <div className="mt-2 line-clamp-2 text-[0.7rem] text-muted print:text-gray-700 italic">
                    &quot;{k.deskripsi}&quot;
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
