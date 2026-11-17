import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { loadKriteria, getEvent } from "./event";
import type { PenilaianState } from "./penilaian-types";
import { formatScaled, isBobotValid, isNilaiValid, SCALE, skorJuriScaled, totalBobotBp } from "./scoring";

export type { PenilaianState };

export type SaveInput = {
  juriId: number;
  kodeKarya: string;
  clientUuid: string;
  nilai: Record<string, number | null>;
  catatan?: string | null;
  clientUpdatedAt: number;
  final: boolean;
  actorUserId: number;
  oleh: "JURI" | "ADMIN";
};

export type SaveResult =
  | { ok: true; applied: boolean; alreadyFinal?: boolean; state: PenilaianState }
  | { ok: false; code: "FASE" | "KARYA" | "JURI" | "VALIDASI" | "LOCKED" | "BOBOT" | "INCOMPLETE"; message: string; state?: PenilaianState };

type TxClient = Prisma.TransactionClient;

async function stateOf(tx: TxClient | typeof db, penilaianId: number): Promise<PenilaianState> {
  const p = await tx.penilaian.findUniqueOrThrow({
    where: { id: penilaianId },
    include: { detail: { include: { kriteria: true } } },
  });
  return toState(p);
}

type PenilaianFull = Prisma.PenilaianGetPayload<{ include: { detail: { include: { kriteria: true } } } }>;

export function toState(p: PenilaianFull): PenilaianState {
  const nilai: Record<string, number> = {};
  for (const d of p.detail) nilai[d.kriteria.kode] = d.nilai;
  return {
    id: p.id,
    clientUuid: p.clientUuid,
    status: p.status,
    version: p.version,
    clientUpdatedAt: Number(p.clientUpdatedAt),
    catatan: p.catatan,
    nilai,
    skorJuri: p.skorJuri ? p.skorJuri.toFixed(4) : null,
    finalizedAt: p.finalizedAt ? p.finalizedAt.toISOString() : null,
    inputOleh: p.inputOleh,
  };
}

export async function getPenilaianState(juriId: number, kodeKarya: string): Promise<PenilaianState | null> {
  const p = await db.penilaian.findFirst({
    where: { juriId, karya: { kodeKarya } },
    include: { detail: { include: { kriteria: true } } },
  });
  return p ? toState(p) : null;
}

/**
 * Simpan draft / finalkan nilai. Dipakai oleh portal juri maupun fallback input admin.
 * - Idempoten: kirim ulang request yang sama tidak membuat data ganda.
 * - Data lama (clientUpdatedAt lebih kecil) tidak menimpa data baru.
 * - Setelah FINAL, perubahan ditolak (kecuali admin membuka kunci lebih dulu).
 * - Skor dihitung SERVER-side, dengan aritmetika integer.
 */
export async function savePenilaian(input: SaveInput): Promise<SaveResult> {
  const event = await getEvent();
  if (event.fase !== "PENJURIAN") {
    return { ok: false, code: "FASE", message: `Penjurian tidak sedang dibuka (fase: ${event.fase}).` };
  }

  const kriteria = await loadKriteria();
  const byKode = new Map(kriteria.map((k) => [k.kode, k]));

  for (const [kode, v] of Object.entries(input.nilai)) {
    if (!byKode.has(kode)) return { ok: false, code: "VALIDASI", message: `Kriteria tidak dikenal: ${kode}` };
    if (v !== null && !isNilaiValid(v)) {
      return { ok: false, code: "VALIDASI", message: `Nilai ${kode} harus bilangan bulat 0-100.` };
    }
  }

  if (input.final) {
    if (!isBobotValid(kriteria)) {
      return { ok: false, code: "BOBOT", message: `Total bobot kriteria harus 100% (saat ini ${totalBobotBp(kriteria) / 100}%).` };
    }
    for (const k of kriteria) {
      if (!isNilaiValid(input.nilai[k.kode])) {
        return { ok: false, code: "INCOMPLETE", message: `Nilai "${k.nama}" belum diisi.` };
      }
    }
  }

  const juri = await db.juri.findUnique({ where: { id: input.juriId }, include: { user: true } });
  if (!juri || juri.deletedAt || !juri.isActive || !juri.user.isActive) {
    return { ok: false, code: "JURI", message: "Juri tidak aktif." };
  }
  const karya = await db.karya.findFirst({
    where: { kodeKarya: input.kodeKarya, deletedAt: null, peserta: { deletedAt: null } },
  });
  if (!karya) return { ok: false, code: "KARYA", message: "Karya tidak ditemukan." };

  const run = () =>
    db.$transaction(async (tx): Promise<SaveResult> => {
      // Pastikan baris ada, lalu kunci (serialisasi request konkuren untuk pasangan juri-karya)
      let row = await tx.penilaian.findUnique({ where: { juriId_karyaId: { juriId: juri.id, karyaId: karya.id } } });
      if (!row) {
        row = await tx.penilaian.create({
          data: {
            clientUuid: input.clientUuid,
            juriId: juri.id,
            karyaId: karya.id,
            clientUpdatedAt: BigInt(0),
            inputOleh: input.oleh,
          },
        });
      }
      const cur = await tx.penilaian.findUniqueOrThrow({
        where: { id: row.id },
        include: { detail: { include: { kriteria: true } } },
      });

      if (cur.status === "FINAL") {
        // Retry dari klien setelah final sukses → idempoten bila nilainya identik
        const same =
          input.final &&
          kriteria.every((k) => cur.detail.find((d) => d.kriteriaId === k.id)?.nilai === input.nilai[k.kode]);
        if (same) return { ok: true, applied: false, alreadyFinal: true, state: toState(cur) };
        return { ok: false, code: "LOCKED", message: "Nilai sudah FINAL dan terkunci. Hubungi admin untuk membuka kunci.", state: toState(cur) };
      }

      if (input.clientUpdatedAt < Number(cur.clientUpdatedAt)) {
        // Data dari klien lebih lama dari yang ada di server → abaikan, kembalikan state server
        return { ok: true, applied: false, state: toState(cur) };
      }

      // Terapkan nilai
      for (const [kode, v] of Object.entries(input.nilai)) {
        const k = byKode.get(kode)!;
        if (v === null) {
          await tx.penilaianDetail.deleteMany({ where: { penilaianId: cur.id, kriteriaId: k.id } });
        } else {
          await tx.penilaianDetail.upsert({
            where: { penilaianId_kriteriaId: { penilaianId: cur.id, kriteriaId: k.id } },
            create: { penilaianId: cur.id, kriteriaId: k.id, nilai: v },
            update: { nilai: v },
          });
        }
      }

      let skorJuri: string | null = null;
      let finalizedAt: Date | null = null;
      if (input.final) {
        const map: Record<number, number> = {};
        for (const k of kriteria) map[k.id] = input.nilai[k.kode] as number;
        const scaled = skorJuriScaled(map, kriteria);
        skorJuri = formatScaled(scaled, SCALE, 4, ".");
        finalizedAt = new Date();
        for (const k of kriteria) {
          await tx.penilaianDetail.update({
            where: { penilaianId_kriteriaId: { penilaianId: cur.id, kriteriaId: k.id } },
            data: { bobotSnapshot: (k.bobotBp / 100).toFixed(2) },
          });
        }
      }

      await tx.penilaian.update({
        where: { id: cur.id },
        data: {
          catatan: input.catatan === undefined ? undefined : input.catatan,
          status: input.final ? "FINAL" : "DRAFT",
          skorJuri: input.final ? skorJuri : null,
          finalizedAt: input.final ? finalizedAt : null,
          clientUpdatedAt: BigInt(input.clientUpdatedAt),
          version: { increment: 1 },
          inputOleh: input.oleh,
        },
      });

      const state = await stateOf(tx, cur.id);
      await tx.penilaianHistory.create({
        data: {
          penilaianId: cur.id,
          juriId: juri.id,
          karyaId: karya.id,
          aksi: input.final ? "FINAL" : "DRAFT",
          snapshot: state as unknown as Prisma.InputJsonValue,
          actorUserId: input.actorUserId,
        },
      });
      return { ok: true, applied: true, state };
    });

  try {
    return await run();
  } catch (e) {
    // Balapan pembuatan baris (unique juri+karya) → coba sekali lagi
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return await run();
    throw e;
  }
}

/** Admin membuka kunci nilai FINAL → kembali DRAFT. Dicatat di history. */
export async function unlockPenilaian(penilaianId: number, actorUserId: number) {
  return db.$transaction(async (tx) => {
    const cur = await tx.penilaian.findUniqueOrThrow({ where: { id: penilaianId } });
    if (cur.status !== "FINAL") return false;
    await tx.penilaian.update({
      where: { id: penilaianId },
      data: {
        status: "DRAFT",
        skorJuri: null,
        finalizedAt: null,
        version: { increment: 1 },
      },
    });
    const state = await stateOf(tx, penilaianId);
    await tx.penilaianHistory.create({
      data: {
        penilaianId,
        juriId: cur.juriId,
        karyaId: cur.karyaId,
        aksi: "UNLOCK",
        snapshot: state as unknown as Prisma.InputJsonValue,
        actorUserId,
      },
    });
    return true;
  });
}
