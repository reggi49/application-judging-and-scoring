import "server-only";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { savePenilaian, type SaveResult } from "./penilaian";
import { audit } from "./audit";

export const penilaianBody = z.object({
  kodeKarya: z.string().regex(/^[A-Z0-9]{2,5}-[A-Z0-9]{2,5}-\d{3}$/, "Kode karya tidak valid."),
  clientUuid: z.string().trim().min(1).max(64).default(() => randomUUID()),
  nilai: z.record(z.string().max(30), z.number().int().min(0).max(100).nullable()),
  catatan: z.string().max(2000).nullable().optional(),
  clientUpdatedAt: z.number().int().positive(),
  final: z.boolean(),
});

const STATUS: Record<string, number> = {
  FASE: 409,
  LOCKED: 409,
  VALIDASI: 422,
  INCOMPLETE: 422,
  BOBOT: 422,
  KARYA: 404,
  JURI: 403,
};

export function resultToResponse(r: SaveResult) {
  if (r.ok) return NextResponse.json(r);
  return NextResponse.json(r, { status: STATUS[r.code] ?? 400 });
}

/** Proses body JSON penilaian untuk juri tertentu. juriId SELALU ditentukan server, bukan klien. */
export async function processPenilaianRequest(
  req: Request,
  ctx: { juriId: number; actorUserId: number; oleh: "JURI" | "ADMIN" },
) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, code: "VALIDASI", message: "Body bukan JSON." }, { status: 400 });
  }
  const parsed = penilaianBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "VALIDASI", message: parsed.error.issues[0]?.message ?? "Input tidak valid." },
      { status: 422 },
    );
  }
  const b = parsed.data;
  // Jam perangkat yang ngawur (jauh di masa depan) tidak boleh mengunci edit berikutnya
  const clientUpdatedAt = Math.min(b.clientUpdatedAt, Date.now() + 60_000);

  const result = await savePenilaian({
    juriId: ctx.juriId,
    kodeKarya: b.kodeKarya,
    clientUuid: b.clientUuid,
    nilai: b.nilai,
    catatan: b.catatan,
    clientUpdatedAt,
    final: b.final,
    actorUserId: ctx.actorUserId,
    oleh: ctx.oleh,
  });

  if (result.ok && result.applied && (b.final || ctx.oleh === "ADMIN")) {
    await audit({
      userId: ctx.actorUserId,
      aksi: ctx.oleh === "ADMIN" ? (b.final ? "ADMIN_FINAL_NILAI" : "ADMIN_DRAFT_NILAI") : "FINAL_NILAI",
      entitas: "penilaian",
      entitasId: result.state.id,
      dataBaru: { juriId: ctx.juriId, kodeKarya: b.kodeKarya, nilai: result.state.nilai, skorJuri: result.state.skorJuri },
    });
  }
  return resultToResponse(result);
}

