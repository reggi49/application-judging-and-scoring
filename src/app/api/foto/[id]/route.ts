import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { uploadDir } from "@/lib/env";

export const runtime = "nodejs";

/** Foto hanya untuk pengguna yang login (admin & juri). File disimpan di luar folder public. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getSessionUser();
  if (!u || u.mustChangePassword) return new NextResponse("Unauthorized", { status: 401 });

  const id = Number((await params).id);
  if (!Number.isInteger(id)) return new NextResponse("Not found", { status: 404 });
  const g = await db.karyaGambar.findFirst({
    where: { id, karya: { deletedAt: null, peserta: { deletedAt: null } } },
  });
  if (!g) return new NextResponse("Not found", { status: 404 });

  const thumb = new URL(req.url).searchParams.get("t") === "1";
  const name = thumb ? g.thumbFilename : g.filename;
  if (name !== path.basename(name)) return new NextResponse("Not found", { status: 404 });

  try {
    const buf = await readFile(path.join(uploadDir(), name));
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, max-age=86400, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}

