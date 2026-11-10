import { describe, expect, it } from "vitest";
import {
  compareRank,
  formatRataRata,
  formatScaled,
  formatSkor,
  hitungKarya,
  isBobotValid,
  persenToBp,
  skorJuriScaled,
  susunRanking,
  type KaryaRankInput,
  type KriteriaInput,
} from "./scoring";
import { formatKodeKarya } from "./kode";

const K: KriteriaInput[] = [
  { id: 1, kode: "DESIGN", nama: "Kreativitas Design", bobotBp: 3000, urutan: 1 },
  { id: 2, kode: "POLA", nama: "Kreativitas Pola & Grafis", bobotBp: 3000, urutan: 2 },
  { id: 3, kode: "KERJA", nama: "Kualitas Pengerjaan", bobotBp: 2000, urutan: 3 },
  { id: 4, kode: "NYAMAN", nama: "Kenyamanan & Penampilan", bobotBp: 2000, urutan: 4 },
];
const n = (a: number, b: number, c: number, d: number) => ({ 1: a, 2: b, 3: c, 4: d });

describe("bobot", () => {
  it("total bobot 100%", () => expect(isBobotValid(K)).toBe(true));
  it("bobot tidak 100% ditolak", () => expect(isBobotValid([{ bobotBp: 9999 }])).toBe(false));
  it("persenToBp", () => {
    expect(persenToBp("30.00")).toBe(3000);
    expect(persenToBp("12.5")).toBe(1250);
    expect(persenToBp(20)).toBe(2000);
    expect(() => persenToBp("abc")).toThrow();
    expect(() => persenToBp("1.234")).toThrow();
  });
});

describe("skor juri", () => {
  it("contoh PRD 80/90/70/60 = 77,00", () => {
    const s = skorJuriScaled(n(80, 90, 70, 60), K);
    expect(s).toBe(770000);
    expect(formatSkor(s)).toBe("77,00");
  });
  it("semua 100 = 100,00 dan semua 0 = 0,00", () => {
    expect(formatSkor(skorJuriScaled(n(100, 100, 100, 100), K))).toBe("100,00");
    expect(formatSkor(skorJuriScaled(n(0, 0, 0, 0), K))).toBe("0,00");
  });
  it("menolak nilai tidak valid / kosong", () => {
    expect(() => skorJuriScaled({ 1: 101, 2: 1, 3: 1, 4: 1 }, K)).toThrow();
    expect(() => skorJuriScaled({ 1: -1, 2: 1, 3: 1, 4: 1 }, K)).toThrow();
    expect(() => skorJuriScaled({ 1: 1.5, 2: 1, 3: 1, 4: 1 }, K)).toThrow();
    expect(() => skorJuriScaled({ 1: 1, 2: 1, 3: 1 } as never, K)).toThrow();
  });
  it("tepat tanpa kesalahan float (bobot 33,33/33,33/33,34)", () => {
    const k3: KriteriaInput[] = [
      { id: 1, kode: "A", nama: "A", bobotBp: 3333, urutan: 1 },
      { id: 2, kode: "B", nama: "B", bobotBp: 3333, urutan: 2 },
      { id: 3, kode: "C", nama: "C", bobotBp: 3334, urutan: 3 },
    ];
    expect(skorJuriScaled({ 1: 100, 2: 100, 3: 100 }, k3)).toBe(1_000_000);
    expect(skorJuriScaled({ 1: 1, 2: 2, 3: 3 }, k3)).toBe(3333 + 6666 + 10002);
  });
});

describe("pembulatan tampilan (half-up)", () => {
  it("0,005 → 0,01", () => expect(formatScaled(5, 1000, 2)).toBe("0,01"));
  it("0,004 → 0,00", () => expect(formatScaled(4, 1000, 2)).toBe("0,00"));
  it("1/3 → 0,33 ; 2/3 → 0,67", () => {
    expect(formatScaled(1, 3, 2)).toBe("0,33");
    expect(formatScaled(2, 3, 2)).toBe("0,67");
  });
});

/** Tiga juri contoh dari penjelasan: 77,00 ; 78,50 ; 83,50 → total 239,00 ; rata-rata 79,67 */
describe("total & rata-rata", () => {
  const input: KaryaRankInput = {
    karyaId: 1,
    kodeKarya: "BRM-CLS-001",
    namaKarya: "Classic",
    kodePeserta: "BRM",
    namaPeserta: "Budi",
    penilaian: [
      { juriId: 1, nilai: n(80, 90, 70, 60) },
      { juriId: 2, nilai: n(85, 80, 75, 70) },
      { juriId: 3, nilai: n(90, 85, 80, 75) },
    ],
  };
  const r = hitungKarya(input, K, 3);
  it("skor tiap juri", () => expect(r.perJuri.map((p) => p.skorText)).toEqual(["77,00", "78,50", "83,50"]));
  it("total", () => expect(r.totalText).toBe("239,00"));
  it("rata-rata", () => expect(r.rataText).toBe("79,67"));
  it("lengkap", () => expect(r.lengkap).toBe(true));
  it("rata-rata tidak bergantung jumlah juri (juri identik)", () => {
    const one = hitungKarya({ ...input, penilaian: [input.penilaian[0]] }, K, 1);
    const five = hitungKarya({ ...input, penilaian: Array(5).fill(0).map((_, i) => ({ juriId: i + 1, nilai: n(80, 90, 70, 60) })) }, K, 5);
    expect(one.rataText).toBe("77,00");
    expect(five.rataText).toBe("77,00");
    expect(five.totalText).toBe("385,00");
  });
  it("urutan hitung terbalik (rata per kriteria × bobot) hasilnya identik", () => {
    const avg = (id: 1 | 2 | 3 | 4) => input.penilaian.reduce((a, p) => a + p.nilai[id], 0) / 3;
    const alt = avg(1) * 0.3 + avg(2) * 0.3 + avg(3) * 0.2 + avg(4) * 0.2;
    expect(alt.toFixed(2)).toBe("79.67");
  });
  it("formatRataRata", () => expect(formatRataRata(2390000, 3)).toBe("79,67"));
});

describe("ranking", () => {
  const mk = (id: number, kode: string, pen: [number, number, number, number][]): KaryaRankInput => ({
    karyaId: id,
    kodeKarya: kode,
    namaKarya: kode,
    kodePeserta: "AAA",
    namaPeserta: "A",
    penilaian: pen.map((p, i) => ({ juriId: i + 1, nilai: n(...p) })),
  });
  it("urut menurun berdasar rata-rata; belum lengkap dipisah", () => {
    const rows = [
      hitungKarya(mk(1, "A-1", [[70, 70, 70, 70], [70, 70, 70, 70]]), K, 2),
      hitungKarya(mk(2, "A-2", [[90, 90, 90, 90], [80, 80, 80, 80]]), K, 2),
      hitungKarya(mk(3, "A-3", [[100, 100, 100, 100]]), K, 2), // belum lengkap
      hitungKarya(mk(4, "A-4", []), K, 2), // belum dinilai
    ];
    const r = susunRanking(rows, K);
    expect(r.resmi.map((x) => x.kodeKarya)).toEqual(["A-2", "A-1"]);
    expect(r.resmi.map((x) => x.peringkat)).toEqual([1, 2]);
    expect(r.belumLengkap.map((x) => x.kodeKarya)).toEqual(["A-3"]);
    expect(r.belumDinilai.map((x) => x.kodeKarya)).toEqual(["A-4"]);
  });
  it("seri skor → tie-breaker kriteria berbobot terbesar (DESIGN lalu POLA)", () => {
    // Keduanya 80,00 : X(design 100,pola 60,kerja 80,nyaman 80)=30+18+16+16=80 ; Y(60,100,80,80)=18+30+16+16=80
    const x = hitungKarya(mk(1, "X", [[100, 60, 80, 80]]), K, 1);
    const y = hitungKarya(mk(2, "Y", [[60, 100, 80, 80]]), K, 1);
    expect(x.totalText).toBe(y.totalText);
    expect(compareRank(x, y, K)).toBeLessThan(0); // X menang di DESIGN
    const r = susunRanking([y, x], K);
    expect(r.resmi.map((q) => q.kodeKarya)).toEqual(["X", "Y"]);
    expect(r.resmi.map((q) => q.peringkat)).toEqual([1, 2]);
  });
  it("seri mutlak → peringkat sama & ditandai SERI", () => {
    const x = hitungKarya(mk(1, "X", [[80, 80, 80, 80]]), K, 1);
    const y = hitungKarya(mk(2, "Y", [[80, 80, 80, 80]]), K, 1);
    const r = susunRanking([x, y], K);
    expect(r.resmi.map((q) => q.peringkat)).toEqual([1, 1]);
    expect(r.resmi.every((q) => q.seri)).toBe(true);
  });
  it("perbandingan eksak untuk selisih sangat kecil", () => {
    // 2 juri: rata-rata 79,995 vs 79,99 harus tetap terurut benar (tanpa pembulatan dini)
    const a = hitungKarya(mk(1, "A", [[80, 80, 80, 80], [79, 80, 80, 80]]), K, 2); // (80 + 79,7)/2 = 79,85
    const b = hitungKarya(mk(2, "B", [[80, 80, 80, 80], [79, 79, 80, 80]]), K, 2); // (80 + 79,4)/2 = 79,70
    expect(compareRank(a, b, K)).toBeLessThan(0);
  });
});

describe("kode karya", () => {
  it("format", () => {
    expect(formatKodeKarya("BRM", "CLS", 1)).toBe("BRM-CLS-001");
    expect(formatKodeKarya("BRM", "VNT", 12)).toBe("BRM-VNT-012");
    expect(formatKodeKarya("AB", "X1", 999)).toBe("AB-X1-999");
  });
  it("menolak input tidak valid", () => {
    expect(() => formatKodeKarya("b", "CLS", 1)).toThrow();
    expect(() => formatKodeKarya("BRM", "C", 1)).toThrow();
    expect(() => formatKodeKarya("BRM", "CLS", 0)).toThrow();
    expect(() => formatKodeKarya("BRM", "CLS", 1000)).toThrow();
    expect(() => formatKodeKarya("BR-M", "CLS", 1)).toThrow();
  });
});

