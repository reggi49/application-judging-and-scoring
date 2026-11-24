import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { apiUser, sameOrigin } from "@/lib/dal";
import { audit } from "@/lib/audit";
import { MAX_FOTO_PER_KARYA } from "@/lib/env";
import { processAndStoreImage, removeStoredImage, UploadError } from "@/lib/images";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });

  const karyaId = Number((await params).id);
  if (!Number.isInteger(karyaId)) return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });

  const karya = await db.karya.findFirst({
    where: { id: karyaId, deletedAt: null, peserta: { deletedAt: null } },
    include: {
      peserta: true,
      gambar: { orderBy: [{ urutan: "asc" }, { id: "asc" }], select: { id: true } },
    },
  });
  if (!karya) return NextResponse.json({ error: "Karya tidak ditemukan." }, { status: 404 });

  return NextResponse.json(
    {
      id: karya.id,
      kode: karya.kodeKarya,
      nama: karya.namaKarya,
      peserta: karya.peserta.nama,
      whatsapp: karya.whatsapp ?? "",
      deskripsi: karya.deskripsi ?? "",
      fotos: karya.gambar,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Origin tidak diizinkan." }, { status: 403 });
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });

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

  await audit({ userId: user.id, aksi: "UPLOAD_FOTO", entitas: "karya", entitasId: karyaId, dataBaru: { gambarId: result.id } });
  revalidatePath(`/admin/karya/${karyaId}`);
  revalidatePath(`/juri/karya/${karya.kodeKarya}`);
  return NextResponse.json({ ok: true, id: result.id });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Origin tidak diizinkan." }, { status: 403 });
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });

  const url = new URL(req.url);
  const fotoId = Number(url.searchParams.get("fotoId"));
  if (!Number.isInteger(fotoId)) return NextResponse.json({ error: "ID foto tidak valid." }, { status: 400 });

  const g = await db.karyaGambar.findUnique({ where: { id: fotoId }, include: { karya: true } });
  if (!g) return NextResponse.json({ error: "Foto tidak ditemukan." }, { status: 404 });

  await db.$transaction(async (tx) => {
    await tx.karyaGambar.delete({ where: { id: fotoId } });
    if (g.isCover) {
      const first = await tx.karyaGambar.findFirst({ where: { karyaId: g.karyaId }, orderBy: { urutan: "asc" } });
      if (first) await tx.karyaGambar.update({ where: { id: first.id }, data: { isCover: true } });
    }
  });

  await removeStoredImage(g.filename, g.thumbFilename);
  await audit({ userId: user.id, aksi: "HAPUS_FOTO", entitas: "karya", entitasId: g.karyaId, dataLama: { gambarId: fotoId } });
  revalidatePath(`/admin/karya/${g.karyaId}`);
  revalidatePath(`/juri/karya/${g.karya.kodeKarya}`);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Origin tidak diizinkan." }, { status: 403 });
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });

  const karyaId = Number((await params).id);
  if (!Number.isInteger(karyaId)) return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });

  let body: { nama?: string; namaKarya?: string; deskripsi?: string; namaPeserta?: string; whatsapp?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawNama =
    typeof body.nama === "string"
      ? body.nama
      : typeof body.namaPeserta === "string"
        ? body.namaPeserta
        : undefined;
  const namaPeserta = rawNama !== undefined ? rawNama.trim().slice(0, 150) : undefined;
  const namaKarya = typeof body.namaKarya === "string" ? body.namaKarya.trim().slice(0, 150) : undefined;
  const deskripsi = typeof body.deskripsi === "string" ? body.deskripsi.trim().slice(0, 2000) : undefined;

  let whatsapp: string | null | undefined;
  if (typeof body.whatsapp === "string") {
    const cleaned = body.whatsapp.trim();
    if (cleaned !== "" && !/^\d{1,25}$/.test(cleaned)) {
      return NextResponse.json({ error: "Nomor WhatsApp harus berupa angka saja (maks 25 digit)." }, { status: 400 });
    }
    whatsapp = cleaned === "" ? null : cleaned;
  }

  const karya = await db.karya.findUnique({ where: { id: karyaId }, include: { peserta: true } });
  if (!karya) return NextResponse.json({ error: "Karya tidak ditemukan." }, { status: 404 });

  const resolvedNamaKarya =
    namaKarya !== undefined
      ? namaKarya
      : namaPeserta !== undefined
        ? namaPeserta || `Nomor ${karya.kodeKarya}`
        : undefined;
  const resolvedNamaPeserta =
    namaPeserta !== undefined ? namaPeserta || `Peserta #${karya.kodeKarya}` : undefined;

  const updated = await db.$transaction(async (tx) => {
    const k = await tx.karya.update({
      where: { id: karyaId },
      data: {
        ...(resolvedNamaKarya !== undefined ? { namaKarya: resolvedNamaKarya } : {}),
        ...(whatsapp !== undefined ? { whatsapp } : {}),
        ...(deskripsi !== undefined ? { deskripsi: deskripsi === "" ? null : deskripsi } : {}),
      },
    });
    let pNama = karya.peserta?.nama ?? "";
    if (resolvedNamaPeserta !== undefined && karya.pesertaId) {
      const p = await tx.peserta.update({
        where: { id: karya.pesertaId },
        data: { nama: resolvedNamaPeserta },
      });
      pNama = p.nama;
    }
    return { k, pNama };
  });

  await audit({
    userId: user.id,
    aksi: "UPDATE_INFO_KARYA",
    entitas: "karya",
    entitasId: karyaId,
    dataBaru: { namaKarya: resolvedNamaKarya, namaPeserta: resolvedNamaPeserta, whatsapp, deskripsi },
  });

  revalidatePath(`/admin/karya/${karyaId}`);
  revalidatePath("/admin/karya");
  revalidatePath(`/juri/karya/${karya.kodeKarya}`);
  revalidatePath("/juri");
  revalidatePath("/admin");
  revalidatePath("/admin/nilai");
  revalidatePath("/admin/nilai/input");
  revalidatePath("/admin/berita-acara");
  return NextResponse.json({
    ok: true,
    nama: updated.k.namaKarya,
    peserta: updated.pNama,
    whatsapp: updated.k.whatsapp ?? "",
    deskripsi: updated.k.deskripsi ?? "",
  });
}
