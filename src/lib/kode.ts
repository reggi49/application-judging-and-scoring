/** Aturan ID. File ini murni (tanpa server-only) agar bisa dipakai di client & tes. */

export const AKRONIM_RE = /^[A-Z0-9]{2,5}$/;

export function normalizeAkronim(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isAkronimValid(s: string): boolean {
  return AKRONIM_RE.test(s);
}

/** Format nomor urut slot 3 digit: 1 -> "001", 25 -> "025", 250 -> "250" */
export function formatNomorSlot(noUrut: number): string {
  return String(noUrut).padStart(3, "0");
}

/** ID Karya = AKRONIM PESERTA + AKRONIM KARYA + NOURUT (3 digit). Mis. BRM-CLS-001 */
export function formatKodeKarya(kodePeserta: string, akronimKarya: string, noUrut: number): string {
  if (!isAkronimValid(kodePeserta)) throw new Error("Akronim peserta tidak valid");
  if (!isAkronimValid(akronimKarya)) throw new Error("Akronim karya tidak valid");
  if (!Number.isInteger(noUrut) || noUrut < 1 || noUrut > 999) throw new Error("Nomor urut di luar rentang 1-999");
  return `${kodePeserta}-${akronimKarya}-${String(noUrut).padStart(3, "0")}`;
}

