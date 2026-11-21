import { NextResponse } from "next/server";
import { apiUser, sameOrigin } from "@/lib/dal";
import { getPenilaianState } from "@/lib/penilaian";
import { processPenilaianRequest, processReopenRequest } from "@/lib/penilaian-api";
import { getEvent } from "@/lib/event";

export const runtime = "nodejs";

/** Simpan draft / final nilai oleh juri yang sedang login (juriId dari sesi). */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ ok: false, code: "VALIDASI", message: "Origin tidak diizinkan." }, { status: 403 });
  const u = await apiUser("JURI");
  if (!u?.juri) return NextResponse.json({ ok: false, code: "JURI", message: "Sesi berakhir. Silakan login ulang." }, { status: 401 });
  return processPenilaianRequest(req, { juriId: u.juri.id, actorUserId: u.id, oleh: "JURI" });
}

/** Membuka kembali nilai FINAL menjadi DRAFT agar juri dapat mengoreksi nilai. */
export async function PATCH(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ ok: false, code: "VALIDASI", message: "Origin tidak diizinkan." }, { status: 403 });
  const u = await apiUser("JURI");
  if (!u?.juri) return NextResponse.json({ ok: false, code: "JURI", message: "Sesi berakhir. Silakan login ulang." }, { status: 401 });
  return processReopenRequest(req, { juriId: u.juri.id, actorUserId: u.id, oleh: "JURI" });
}

/** Ambil state terbaru dari server (untuk sinkronisasi ulang). */
export async function GET(req: Request) {
  const u = await apiUser("JURI");
  if (!u?.juri) return NextResponse.json({ error: "Sesi berakhir." }, { status: 401 });
  const kode = new URL(req.url).searchParams.get("kode") ?? "";
  const [state, ev] = await Promise.all([getPenilaianState(u.juri.id, kode), getEvent()]);
  return NextResponse.json({ state, fase: ev.fase });
}

