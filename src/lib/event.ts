import "server-only";
import type { Fase } from "@prisma/client";
import { db } from "./db";
import { persenToBp, type KriteriaInput } from "./scoring";

export async function getEvent() {
  const e = await db.eventSetting.findUnique({ where: { id: 1 } });
  return e ?? { id: 1, nama: "MBtech Riding With Style Awards 2026", fase: "PERSIAPAN" as Fase, updatedAt: new Date() };
}

export const FASE_LABEL: Record<Fase, string> = {
  PERSIAPAN: "Persiapan / Registrasi",
  PENJURIAN: "Penjurian",
  SELESAI: "Selesai",
};

export async function loadKriteria(): Promise<(KriteriaInput & { deskripsi: string | null })[]> {
  const rows = await db.kriteria.findMany({ orderBy: [{ urutan: "asc" }, { id: "asc" }] });
  return rows.map((k) => ({
    id: k.id,
    kode: k.kode,
    nama: k.nama,
    deskripsi: k.deskripsi,
    bobotBp: persenToBp(k.bobot.toString()),
    urutan: k.urutan,
  }));
}

