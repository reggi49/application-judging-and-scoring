import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiUser, sameOrigin } from "@/lib/dal";
import { processPenilaianRequest, processReopenRequest } from "@/lib/penilaian-api";

export const runtime = "nodejs";

/**
 * Fallback: admin menginput nilai ATAS NAMA juri (mis. HP juri bermasalah).
 * Ditandai input_oleh=ADMIN dan dicatat di audit log. Juri dipilih lewat query ?juriId=.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ ok: false, code: "VALIDASI", message: "Origin tidak diizinkan." }, { status: 403 });
  const admin = await apiUser("ADMIN");
  if (!admin) return NextResponse.json({ ok: false, code: "JURI", message: "Tidak diizinkan." }, { status: 401 });

  const juriId = z.coerce.number().int().positive().safeParse(new URL(req.url).searchParams.get("juriId"));
  if (!juriId.success) return NextResponse.json({ ok: false, code: "VALIDASI", message: "juriId tidak valid." }, { status: 422 });
  const juri = await db.juri.findFirst({ where: { id: juriId.data, deletedAt: null } });
  if (!juri) return NextResponse.json({ ok: false, code: "JURI", message: "Juri tidak ditemukan." }, { status: 404 });

  return processPenilaianRequest(req, { juriId: juri.id, actorUserId: admin.id, oleh: "ADMIN" });
}

/** Membuka kembali nilai FINAL menjadi DRAFT atas nama juri untuk koreksi. */
export async function PATCH(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ ok: false, code: "VALIDASI", message: "Origin tidak diizinkan." }, { status: 403 });
  const admin = await apiUser("ADMIN");
  if (!admin) return NextResponse.json({ ok: false, code: "JURI", message: "Tidak diizinkan." }, { status: 401 });

  const juriId = z.coerce.number().int().positive().safeParse(new URL(req.url).searchParams.get("juriId"));
  if (!juriId.success) return NextResponse.json({ ok: false, code: "VALIDASI", message: "juriId tidak valid." }, { status: 422 });
  const juri = await db.juri.findFirst({ where: { id: juriId.data, deletedAt: null } });
  if (!juri) return NextResponse.json({ ok: false, code: "JURI", message: "Juri tidak ditemukan." }, { status: 404 });

  return processReopenRequest(req, { juriId: juri.id, actorUserId: admin.id, oleh: "ADMIN" });
}

