import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { apiUser, sameOrigin } from "@/lib/dal";
import { audit } from "@/lib/audit";
import { MAX_FOTO_PER_KARYA } from "@/lib/env";
import { processAndStoreImage, removeStoredImage, UploadError } from "@/lib/images";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Origin tidak diizinkan." }, { status: 403 });
  const admin = await apiUser("ADMIN");
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });

  const karyaId = Number((await params).id);
  if (!Number.isInteger(karyaId)) return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  const karya = await db.karya.findFirst({ where: { id: karyaId, deletedAt: null } });
  if (!karya) return NextResponse.json({ error: "Karya tidak ditemukan." }, { status: 404 });

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("file");
    if (f instanceof File) file = f;
  } catch {
    return NextResponse.json({ error: "Form upload tidak valid." }, { status: 400 });
  }
  if (!file) return NextResponse.json({ error: "Tidak ada file." }, { status: 400 });

  // Cek cepat sebelum memproses gambar (hemat CPU)
  const existing = await db.karyaGambar.count({ where: { karyaId } });
  if (existing >= MAX_FOTO_PER_KARYA) {
    return NextResponse.json({ error: `Maksimal ${MAX_FOTO_PER_KARYA} foto per karya.` }, { status: 409 });
  }

  let stored;
  try {
    stored = await processAndStoreImage(Buffer.from(await file.arrayBuffer()));
  } catch (e) {
    if (e instanceof UploadError) return NextResponse.json({ error: e.message }, { status: 422 });
    console.error("[upload]", e);
    return NextResponse.json({ error: "Gagal memproses gambar." }, { status: 500 });
  }

  // Cek batas lagi di dalam transaksi dengan kunci baris karya (aman untuk upload paralel)
  const result = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM karya WHERE id = ${karyaId} FOR UPDATE`;
    const count = await tx.karyaGambar.count({ where: { karyaId } });
    if (count >= MAX_FOTO_PER_KARYA) return null;
    const last = await tx.karyaGambar.findFirst({ where: { karyaId }, orderBy: { urutan: "desc" } });
    return tx.karyaGambar.create({
      data: {
        karyaId,
        filename: stored.filename,
        thumbFilename: stored.thumbFilename,
        mime: stored.mime,
        size: stored.size,
        urutan: (last?.urutan ?? -1) + 1,
        isCover: count === 0,
      },
    });
  });

  if (!result) {
    await removeStoredImage(stored.filename, stored.thumbFilename);
    return NextResponse.json({ error: `Maksimal ${MAX_FOTO_PER_KARYA} foto per karya.` }, { status: 409 });
  }

  await audit({ userId: admin.id, aksi: "UPLOAD_FOTO", entitas: "karya", entitasId: karyaId, dataBaru: { gambarId: result.id } });
  revalidatePath(`/admin/karya/${karyaId}`);
  return NextResponse.json({ ok: true, id: result.id });
}

