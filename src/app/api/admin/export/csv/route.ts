import { NextResponse } from "next/server";
import { apiUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { buildRanking } from "@/lib/ranking";

export const runtime = "nodejs";

export async function GET() {
  const admin = await apiUser("ADMIN");
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });

  const [data, waRows] = await Promise.all([
    buildRanking(),
    db.karya.findMany({ where: { deletedAt: null }, select: { id: true, whatsapp: true } }),
  ]);
  const waByKaryaId = new Map(waRows.map((w) => [w.id, w.whatsapp ?? ""]));

  // Susun baris CSV
  const headers = [
    "Peringkat",
    "Status Resmi",
    "ID Karya",
    "Nama Karya",
    "ID Peserta",
    "Nama Peserta",
    "No. WhatsApp",
    "Juri Final",
    "Juri Total",
    ...data.juri.map((j) => `Skor ${j.kodeJuri} (${j.nama})`),
    ...data.kriteria.map((k) => `Rata-rata ${k.nama} (${k.bobotBp / 100}%)`),
    "Total Skor",
    "Rata-rata Akhir",
    "Catatan Seri",
  ];

  const escapeCsv = (str: string | number | null | undefined) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows: string[] = [];
  rows.push(headers.map(escapeCsv).join(","));

  const allRows = [
    ...data.resmi.map((r) => ({ ...r, statusResmi: "Resmi" })),
    ...data.belumLengkap.map((r) => ({ ...r, statusResmi: "Belum Lengkap" })),
    ...data.belumDinilai.map((r) => ({ ...r, statusResmi: "Belum Dinilai" })),
  ];

  for (const r of allRows) {
    const perJuriMap = new Map(r.perJuri.map((p) => [p.juriId, p.skorText]));
    const row = [
      r.peringkat ? String(r.peringkat) : "-",
      r.statusResmi,
      r.kodeKarya,
      r.namaKarya,
      r.kodePeserta,
      r.namaPeserta,
      waByKaryaId.get(r.karyaId) ?? "",
      r.juriFinal,
      r.juriTotal,
      ...data.juri.map((j) => perJuriMap.get(j.id) ?? "-"),
      ...data.kriteria.map((k) => r.perKriteriaRata[k.id] ?? "-"),
      r.totalText,
      r.rataText,
      r.seri ? "SERI" : "-",
    ];
    rows.push(row.map(escapeCsv).join(","));
  }

  // Tambahkan UTF-8 BOM (\uFEFF) agar Microsoft Excel langsung membaca aksen/format dengan benar
  const csvContent = "\uFEFF" + rows.join("\r\n");
  const filename = `RWSA-2026-Rekap-Nilai-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

