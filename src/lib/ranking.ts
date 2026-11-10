import "server-only";
import { db } from "./db";
import { loadKriteria } from "./event";
import {
  hitungKarya,
  susunRanking,
  type KaryaRankInput,
  type KriteriaInput,
  type RankRow,
} from "./scoring";

export type RankingData = {
  generatedAt: string;
  kriteria: { id: number; kode: string; nama: string; bobotBp: number }[];
  juri: { id: number; kodeJuri: string; nama: string }[];
  resmi: RankRow[];
  belumLengkap: RankRow[];
  belumDinilai: RankRow[];
  progress: { juriId: number; kodeJuri: string; nama: string; final: number; draft: number; total: number }[];
};

/**
 * Hitung ranking dari data FINAL milik JURI AKTIF saja.
 * Peringkat resmi hanya untuk karya yang sudah final oleh semua juri aktif.
 */
export async function buildRanking(): Promise<RankingData> {
  const kriteria: KriteriaInput[] = await loadKriteria();
  const juri = await db.juri.findMany({
    where: { isActive: true, deletedAt: null, user: { isActive: true } },
    orderBy: { kodeJuri: "asc" },
  });
  const juriIds = juri.map((j) => j.id);

  const karya = await db.karya.findMany({
    where: { deletedAt: null, peserta: { deletedAt: null } },
    include: {
      peserta: true,
      penilaian: {
        where: { status: "FINAL", juriId: { in: juriIds } },
        include: { detail: true },
      },
    },
    orderBy: { kodeKarya: "asc" },
  });

  const rows: RankRow[] = karya.map((k) => {
    const input: KaryaRankInput = {
      karyaId: k.id,
      kodeKarya: k.kodeKarya,
      namaKarya: k.namaKarya,
      kodePeserta: k.peserta.kodePeserta,
      namaPeserta: k.peserta.nama,
      penilaian: k.penilaian
        // hanya yang lengkap (defensif; final selalu lengkap)
        .filter((p) => kriteria.every((c) => p.detail.some((d) => d.kriteriaId === c.id)))
        .map((p) => ({
          juriId: p.juriId,
          nilai: Object.fromEntries(p.detail.map((d) => [d.kriteriaId, d.nilai])),
        })),
    };
    return hitungKarya(input, kriteria, juri.length);
  });

  const { resmi, belumLengkap, belumDinilai } = susunRanking(rows, kriteria);

  const drafts = await db.penilaian.groupBy({
    by: ["juriId", "status"],
    where: { juriId: { in: juriIds }, karya: { deletedAt: null, peserta: { deletedAt: null } } },
    _count: { _all: true },
  });
  const progress = juri.map((j) => ({
    juriId: j.id,
    kodeJuri: j.kodeJuri,
    nama: j.nama,
    final: drafts.find((d) => d.juriId === j.id && d.status === "FINAL")?._count._all ?? 0,
    draft: drafts.find((d) => d.juriId === j.id && d.status === "DRAFT")?._count._all ?? 0,
    total: karya.length,
  }));

  return {
    generatedAt: new Date().toISOString(),
    kriteria: kriteria.map((k) => ({ id: k.id, kode: k.kode, nama: k.nama, bobotBp: k.bobotBp })),
    juri: juri.map((j) => ({ id: j.id, kodeJuri: j.kodeJuri, nama: j.nama })),
    resmi,
    belumLengkap,
    belumDinilai,
    progress,
  };
}

