/**
 * Perhitungan nilai RWSA — seluruhnya memakai aritmetika BILANGAN BULAT (tanpa float)
 * agar hasil 100% akurat dan dapat direproduksi.
 *
 * Definisi:
 *  - bobot disimpan sebagai "basis point" (persen × 100). 30,00% → 3000. Total semua bobot = 10000.
 *  - Skor Juri (scaled)  = Σ nilai_k × bobotBp_k            (skala 0 … 1.000.000; = skor × 10.000)
 *  - Total   (scaled)    = Σ Skor Juri (scaled) semua juri   (skor × 10.000)
 *  - Rata-rata           = Total ÷ J   (J = jumlah juri final) — dibandingkan secara eksak
 *                           dengan perkalian silang, dibulatkan hanya saat ditampilkan.
 */

export const SCALE = 10_000; // 100% dalam basis point; juga pembagi untuk skor terskala
export const NILAI_MIN = 0;
export const NILAI_MAX = 100;

export type KriteriaInput = {
  id: number;
  kode: string;
  nama: string;
  /** bobot dalam basis point (30% = 3000) */
  bobotBp: number;
  urutan: number;
};

export function isNilaiValid(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= NILAI_MIN && n <= NILAI_MAX;
}

/** Ubah bobot persen (mis. "30.00" / 30 / Prisma.Decimal) menjadi basis point integer. */
export function persenToBp(persen: number | string | { toString(): string }): number {
  const s = persen.toString().trim();
  if (!/^\d+(\.\d{1,2})?$/.test(s)) throw new Error(`Bobot tidak valid: ${s}`);
  const [i, f = ""] = s.split(".");
  return Number(i) * 100 + Number((f + "00").slice(0, 2));
}

export function bpToPersenString(bp: number): string {
  const i = Math.floor(bp / 100);
  const f = String(bp % 100).padStart(2, "0");
  return `${i},${f}`.replace(/,00$/, "");
}

export function totalBobotBp(kriteria: Pick<KriteriaInput, "bobotBp">[]): number {
  return kriteria.reduce((a, k) => a + k.bobotBp, 0);
}

export function isBobotValid(kriteria: Pick<KriteriaInput, "bobotBp">[]): boolean {
  return kriteria.length > 0 && totalBobotBp(kriteria) === SCALE;
}

/**
 * Skor 1 juri untuk 1 karya, terskala ×10.000 (integer).
 * `nilai` = peta kriteriaId → nilai. Semua kriteria wajib terisi.
 */
export function skorJuriScaled(
  nilai: Record<number, number>,
  kriteria: Pick<KriteriaInput, "id" | "bobotBp">[],
): number {
  let sum = 0;
  for (const k of kriteria) {
    const n = nilai[k.id];
    if (!isNilaiValid(n)) throw new Error(`Nilai kriteria #${k.id} tidak valid atau belum diisi`);
    sum += n * k.bobotBp;
  }
  return sum;
}

/** Bagian integer ÷ 10^dp dibulatkan half-up, dikembalikan sebagai string "123,46" (koma desimal). */
export function formatScaled(
  numerator: number,
  denominator: number,
  dp = 2,
  decimalSeparator = ",",
): string {
  if (denominator <= 0) return "-";
  const p = 10 ** dp;
  // round half up pada integer: floor((num*p*2 + den) / (den*2))
  const q = Math.floor((numerator * p * 2 + denominator) / (denominator * 2));
  const ip = Math.floor(q / p);
  const fp = String(q % p).padStart(dp, "0");
  return dp > 0 ? `${ip}${decimalSeparator}${fp}` : String(ip);
}

/** Format skor terskala ×10.000 (mis. 770000 → "77,00"). */
export function formatSkor(scaled: number, dp = 2): string {
  return formatScaled(scaled, SCALE, dp);
}

/** Format rata-rata = total terskala ÷ J. */
export function formatRataRata(totalScaled: number, j: number, dp = 2): string {
  return formatScaled(totalScaled, j * SCALE, dp);
}

/* ------------------------------------------------------------------ */
/*  Ranking                                                            */
/* ------------------------------------------------------------------ */

export type PenilaianFinal = {
  juriId: number;
  /** kriteriaId → nilai (semua kriteria terisi) */
  nilai: Record<number, number>;
};

export type KaryaRankInput = {
  karyaId: number;
  kodeKarya: string;
  namaKarya: string;
  kodePeserta: string;
  namaPeserta: string;
  penilaian: PenilaianFinal[]; // hanya yang FINAL
};

export type RankRow = {
  karyaId: number;
  kodeKarya: string;
  namaKarya: string;
  kodePeserta: string;
  namaPeserta: string;
  juriFinal: number;
  juriTotal: number;
  lengkap: boolean;
  /** Σ skor juri, terskala ×10.000 */
  totalScaled: number;
  /** teks tampilan */
  totalText: string;
  rataText: string;
  /** skor tiap juri (terskala) */
  perJuri: { juriId: number; skorScaled: number; skorText: string }[];
  /** rata-rata per kriteria untuk tampilan: kriteriaId → text (2 dp) */
  perKriteriaRata: Record<number, string>;
  /** jumlah nilai per kriteria (integer) — dipakai tie-breaker */
  sumPerKriteria: Record<number, number>;
  peringkat: number | null;
  seri: boolean;
};

export function hitungKarya(
  input: KaryaRankInput,
  kriteria: KriteriaInput[],
  juriAktifCount: number,
): RankRow {
  const perJuri = input.penilaian.map((p) => {
    const s = skorJuriScaled(p.nilai, kriteria);
    return { juriId: p.juriId, skorScaled: s, skorText: formatSkor(s) };
  });
  const j = perJuri.length;
  const totalScaled = perJuri.reduce((a, b) => a + b.skorScaled, 0);
  const sumPerKriteria: Record<number, number> = {};
  const perKriteriaRata: Record<number, string> = {};
  for (const k of kriteria) {
    const sum = input.penilaian.reduce((a, p) => a + (p.nilai[k.id] ?? 0), 0);
    sumPerKriteria[k.id] = sum;
    perKriteriaRata[k.id] = j > 0 ? formatScaled(sum, j, 2) : "-";
  }
  return {
    karyaId: input.karyaId,
    kodeKarya: input.kodeKarya,
    namaKarya: input.namaKarya,
    kodePeserta: input.kodePeserta,
    namaPeserta: input.namaPeserta,
    juriFinal: j,
    juriTotal: juriAktifCount,
    lengkap: juriAktifCount > 0 && j === juriAktifCount,
    totalScaled,
    totalText: j > 0 ? formatSkor(totalScaled) : "-",
    rataText: j > 0 ? formatRataRata(totalScaled, j) : "-",
    perJuri,
    perKriteriaRata,
    sumPerKriteria,
    peringkat: null,
    seri: false,
  };
}

/** Bandingkan eksak rata-rata: a/ja vs b/jb. Hasil >0 jika a lebih besar. */
function cmpFrac(an: number, ad: number, bn: number, bd: number): number {
  return an * bd - bn * ad;
}

/**
 * Bandingkan dua baris untuk peringkat (menurun).
 *  1) Rata-rata skor akhir
 *  2) Tie-breaker: rata-rata per kriteria berurutan bobot terbesar → terkecil
 * Mengembalikan <0 bila a harus di atas b, 0 bila benar-benar seri.
 */
export function compareRank(a: RankRow, b: RankRow, kriteria: KriteriaInput[]): number {
  const main = cmpFrac(a.totalScaled, a.juriFinal, b.totalScaled, b.juriFinal);
  if (main !== 0) return main > 0 ? -1 : 1;
  const ordered = [...kriteria].sort((x, y) => y.bobotBp - x.bobotBp || x.urutan - y.urutan);
  for (const k of ordered) {
    const c = cmpFrac(a.sumPerKriteria[k.id], a.juriFinal, b.sumPerKriteria[k.id], b.juriFinal);
    if (c !== 0) return c > 0 ? -1 : 1;
  }
  return 0;
}

/**
 * Susun ranking. Peringkat resmi HANYA untuk karya yang dinilai semua juri aktif (lengkap).
 * Karya belum lengkap ditaruh di daftar terpisah (peringkat null) agar tidak menyesatkan.
 * Kompetisi "1224": karya seri menerima peringkat sama dan ditandai `seri`.
 */
export function susunRanking(
  rows: RankRow[],
  kriteria: KriteriaInput[],
): { resmi: RankRow[]; belumLengkap: RankRow[]; belumDinilai: RankRow[] } {
  const lengkap = rows.filter((r) => r.lengkap).sort((a, b) => compareRank(a, b, kriteria) || a.kodeKarya.localeCompare(b.kodeKarya));
  let rank = 0;
  lengkap.forEach((r, i) => {
    if (i === 0 || compareRank(lengkap[i - 1], r, kriteria) !== 0) rank = i + 1;
    r.peringkat = rank;
  });
  lengkap.forEach((r, i) => {
    const prev = lengkap[i - 1];
    const next = lengkap[i + 1];
    r.seri =
      (!!prev && compareRank(prev, r, kriteria) === 0) ||
      (!!next && compareRank(r, next, kriteria) === 0);
  });
  const sisa = rows.filter((r) => !r.lengkap);
  const belumLengkap = sisa
    .filter((r) => r.juriFinal > 0)
    .sort((a, b) => compareRank(a, b, kriteria) || a.kodeKarya.localeCompare(b.kodeKarya));
  const belumDinilai = sisa.filter((r) => r.juriFinal === 0).sort((a, b) => a.kodeKarya.localeCompare(b.kodeKarya));
  return { resmi: lengkap, belumLengkap, belumDinilai };
}

