/** Tipe yang dipakai bersama server & klien (tanpa import server-only). */
export type PenilaianState = {
  id: number;
  status: "DRAFT" | "FINAL";
  version: number;
  clientUpdatedAt: number;
  catatan: string | null;
  /** kode kriteria → nilai (hanya yang sudah terisi) */
  nilai: Record<string, number>;
  skorJuri: string | null; // "77.0000"
  finalizedAt: string | null;
  inputOleh: "JURI" | "ADMIN";
};

