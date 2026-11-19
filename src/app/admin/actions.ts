"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma, type Fase } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { audit } from "@/lib/audit";
import { getEvent, loadKriteria } from "@/lib/event";
import { hashPassword, validatePasswordStrength } from "@/lib/auth";
import { formatKodeKarya, isAkronimValid, normalizeAkronim } from "@/lib/kode";
import { isBobotValid, persenToBp, totalBobotBp } from "@/lib/scoring";
import { removeStoredImage } from "@/lib/images";
import { unlockPenilaian } from "@/lib/penilaian";
import { runBackup } from "@/lib/backup";
import type { ActionState } from "@/lib/action-state";

const fail = (error: string): ActionState => ({ error });
const firstIssue = (e: z.ZodError) => e.issues[0]?.message ?? "Input tidak valid.";

function isUnique(e: unknown, field?: string) {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError &&
    e.code === "P2002" &&
    (!field || String((e.meta as { target?: unknown })?.target ?? "").includes(field))
  );
}

function genPassword(): string {
  const alpha = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  for (;;) {
    let p = "";
    for (let i = 0; i < 10; i++) p += alpha[randomInt(alpha.length)];
    if (!validatePasswordStrength(p)) return p;
  }
}

/* ------------------------------------------------------------------ */
/*  Fase event                                                         */
/* ------------------------------------------------------------------ */

export async function setFaseAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const target = String(fd.get("fase")) as Fase;
  if (!["PERSIAPAN", "PENJURIAN", "SELESAI"].includes(target)) return fail("Fase tidak valid.");
  const ev = await getEvent();
  if (ev.fase === target) return fail("Fase sudah aktif.");

  if (target === "PENJURIAN") {
    const kriteria = await loadKriteria();
    if (!isBobotValid(kriteria)) {
      return fail(`Total bobot kriteria harus 100% (saat ini ${totalBobotBp(kriteria) / 100}%).`);
    }
    const [juri, karya] = await Promise.all([
      db.juri.count({ where: { isActive: true, deletedAt: null } }),
      db.karya.count({ where: { deletedAt: null } }),
    ]);
    if (juri === 0) return fail("Belum ada juri aktif.");
    if (karya === 0) return fail("Belum ada karya terdaftar.");
  }
  if (target === "PERSIAPAN") {
    const n = await db.penilaian.count();
    if (n > 0) return fail("Sudah ada data penilaian; tidak bisa kembali ke fase Persiapan.");
  }

  await db.eventSetting.upsert({
    where: { id: 1 },
    update: { fase: target },
    create: { id: 1, nama: ev.nama, fase: target },
  });
  await audit({ userId: admin.id, aksi: "UBAH_FASE", entitas: "event", entitasId: 1, dataLama: { fase: ev.fase }, dataBaru: { fase: target } });
  revalidatePath("/admin", "layout");
  return { ok: true, message: `Fase diubah ke ${target}.` };
}

/* ------------------------------------------------------------------ */
/*  Peserta                                                            */
/* ------------------------------------------------------------------ */

const pesertaSchema = z.object({
  kodePeserta: z.string().transform(normalizeAkronim).refine(isAkronimValid, "ID Peserta (akronim) harus 2–5 karakter huruf besar/angka."),
  nama: z.string().trim().min(2, "Nama minimal 2 karakter.").max(150),
  deskripsi: z.string().trim().max(2000).optional().transform((v) => v || null),
});

export async function createPesertaAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const r = pesertaSchema.safeParse(Object.fromEntries(fd));
  if (!r.success) return fail(firstIssue(r.error));
  try {
    const p = await db.peserta.create({ data: r.data });
    await audit({ userId: admin.id, aksi: "BUAT_PESERTA", entitas: "peserta", entitasId: p.id, dataBaru: r.data });
  } catch (e) {
    if (isUnique(e)) return fail(`ID Peserta "${r.data.kodePeserta}" sudah dipakai.`);
    throw e;
  }
  revalidatePath("/admin/peserta");
  return { ok: true, message: `Peserta ${r.data.kodePeserta} ditambahkan.` };
}

export async function updatePesertaAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = Number(fd.get("id"));
  const old = await db.peserta.findFirst({ where: { id, deletedAt: null } });
  if (!old) return fail("Peserta tidak ditemukan.");
  const r = pesertaSchema.safeParse({ ...Object.fromEntries(fd), kodePeserta: old.karyaCounter > 0 ? old.kodePeserta : fd.get("kodePeserta") });
  if (!r.success) return fail(firstIssue(r.error));
  try {
    await db.peserta.update({ where: { id }, data: { ...r.data, kodePeserta: old.karyaCounter > 0 ? old.kodePeserta : r.data.kodePeserta } });
  } catch (e) {
    if (isUnique(e)) return fail(`ID Peserta "${r.data.kodePeserta}" sudah dipakai.`);
    throw e;
  }
  await audit({ userId: admin.id, aksi: "UBAH_PESERTA", entitas: "peserta", entitasId: id, dataLama: old, dataBaru: r.data });
  revalidatePath("/admin/peserta");
  revalidatePath(`/admin/peserta/${id}`);
  return { ok: true, message: "Perubahan disimpan." };
}

export async function deletePesertaAction(fd: FormData) {
  const admin = await requireAdmin();
  const id = Number(fd.get("id"));
  const p = await db.peserta.findFirst({ where: { id, deletedAt: null } });
  if (!p) return;
  if (p.karyaCounter > 0) return; // sudah punya karya → tidak boleh dihapus
  await db.peserta.update({ where: { id }, data: { deletedAt: new Date() } });
  await audit({ userId: admin.id, aksi: "HAPUS_PESERTA", entitas: "peserta", entitasId: id, dataLama: p });
  revalidatePath("/admin/peserta");
  redirect("/admin/peserta");
}

/* ------------------------------------------------------------------ */
/*  Karya                                                              */
/* ------------------------------------------------------------------ */

const karyaSchema = z.object({
  pesertaId: z.coerce.number().int().positive("Pilih peserta."),
  akronimKarya: z.string().transform(normalizeAkronim).refine(isAkronimValid, "Akronim karya harus 2–5 karakter huruf besar/angka."),
  namaKarya: z.string().trim().min(2, "Nama karya minimal 2 karakter.").max(150),
  deskripsi: z.string().trim().max(4000).optional().transform((v) => v || null),
});

export async function createKaryaAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const r = karyaSchema.safeParse(Object.fromEntries(fd));
  if (!r.success) return fail(firstIssue(r.error));

  let karyaId: number;
  try {
    const created = await db.$transaction(async (tx) => {
      // UPDATE mengunci baris peserta → nomor urut tidak mungkin ganda walau 2 admin submit bersamaan
      const n = await tx.$executeRaw`UPDATE peserta SET karya_counter = karya_counter + 1 WHERE id = ${r.data.pesertaId} AND deleted_at IS NULL`;
      if (n !== 1) throw new Error("PESERTA_TIDAK_ADA");
      const p = await tx.peserta.findUniqueOrThrow({ where: { id: r.data.pesertaId } });
      if (p.karyaCounter > 999) throw new Error("URUT_PENUH");
      return tx.karya.create({
        data: {
          pesertaId: p.id,
          akronimKarya: r.data.akronimKarya,
          noUrut: p.karyaCounter,
          kodeKarya: formatKodeKarya(p.kodePeserta, r.data.akronimKarya, p.karyaCounter),
          namaKarya: r.data.namaKarya,
          deskripsi: r.data.deskripsi,
        },
      });
    });
    karyaId = created.id;
    await audit({ userId: admin.id, aksi: "BUAT_KARYA", entitas: "karya", entitasId: created.id, dataBaru: { kode: created.kodeKarya, ...r.data } });
  } catch (e) {
    if (e instanceof Error && e.message === "PESERTA_TIDAK_ADA") return fail("Peserta tidak ditemukan.");
    if (e instanceof Error && e.message === "URUT_PENUH") return fail("Nomor urut karya peserta ini sudah mencapai 999.");
    throw e;
  }
  revalidatePath("/admin/karya");
  redirect(`/admin/karya/${karyaId}?baru=1`);
}

export async function updateKaryaAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = Number(fd.get("id"));
  const old = await db.karya.findFirst({ where: { id, deletedAt: null } });
  if (!old) return fail("Karya tidak ditemukan.");
  const r = z
    .object({
      namaKarya: karyaSchema.shape.namaKarya,
      deskripsi: karyaSchema.shape.deskripsi,
    })
    .safeParse(Object.fromEntries(fd));
  if (!r.success) return fail(firstIssue(r.error));
  await db.karya.update({ where: { id }, data: r.data });
  await audit({ userId: admin.id, aksi: "UBAH_KARYA", entitas: "karya", entitasId: id, dataLama: { namaKarya: old.namaKarya, deskripsi: old.deskripsi }, dataBaru: r.data });
  revalidatePath(`/admin/karya/${id}`);
  revalidatePath("/admin/karya");
  return { ok: true, message: "Perubahan disimpan." };
}

export async function deleteKaryaAction(fd: FormData) {
  const admin = await requireAdmin();
  const id = Number(fd.get("id"));
  const k = await db.karya.findFirst({ where: { id, deletedAt: null } });
  if (!k) return;
  const adaNilai = await db.penilaian.count({ where: { karyaId: id } });
  if (adaNilai > 0) return; // sudah punya penilaian → tidak boleh dihapus
  await db.karya.update({ where: { id }, data: { deletedAt: new Date() } });
  await audit({ userId: admin.id, aksi: "HAPUS_KARYA", entitas: "karya", entitasId: id, dataLama: { kode: k.kodeKarya } });
  revalidatePath("/admin/karya");
  redirect("/admin/karya");
}

export async function deleteFotoAction(fd: FormData) {
  const admin = await requireAdmin();
  const id = Number(fd.get("id"));
  const g = await db.karyaGambar.findUnique({ where: { id }, include: { karya: true } });
  if (!g) return;
  await db.$transaction(async (tx) => {
    await tx.karyaGambar.delete({ where: { id } });
    if (g.isCover) {
      const first = await tx.karyaGambar.findFirst({ where: { karyaId: g.karyaId }, orderBy: { urutan: "asc" } });
      if (first) await tx.karyaGambar.update({ where: { id: first.id }, data: { isCover: true } });
    }
  });
  await removeStoredImage(g.filename, g.thumbFilename);
  await audit({ userId: admin.id, aksi: "HAPUS_FOTO", entitas: "karya", entitasId: g.karyaId, dataLama: { gambarId: id } });
  revalidatePath(`/admin/karya/${g.karyaId}`);
}

export async function setCoverAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const g = await db.karyaGambar.findUnique({ where: { id } });
  if (!g) return;
  await db.$transaction([
    db.karyaGambar.updateMany({ where: { karyaId: g.karyaId }, data: { isCover: false } }),
    db.karyaGambar.update({ where: { id }, data: { isCover: true } }),
  ]);
  revalidatePath(`/admin/karya/${g.karyaId}`);
}

export async function moveFotoAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const dir = String(fd.get("dir")) === "up" ? -1 : 1;
  const g = await db.karyaGambar.findUnique({ where: { id } });
  if (!g) return;
  const all = await db.karyaGambar.findMany({ where: { karyaId: g.karyaId }, orderBy: [{ urutan: "asc" }, { id: "asc" }] });
  const i = all.findIndex((x) => x.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= all.length) return;
  const reordered = [...all];
  [reordered[i], reordered[j]] = [reordered[j], reordered[i]];
  await db.$transaction(reordered.map((x, idx) => db.karyaGambar.update({ where: { id: x.id }, data: { urutan: idx } })));
  revalidatePath(`/admin/karya/${g.karyaId}`);
}

/* ------------------------------------------------------------------ */
/*  Juri                                                               */
/* ------------------------------------------------------------------ */

const juriSchema = z.object({
  kodeJuri: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]{2,20}$/, "ID Juri 2–20 karakter (huruf/angka/-/_)."),
  nama: z.string().trim().min(2, "Nama minimal 2 karakter.").max(120),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{2,50}$/, "Username 2–50 karakter.")
    .optional(),
});

export async function createJuriAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const r = juriSchema.safeParse(Object.fromEntries(fd));
  if (!r.success) return fail(firstIssue(r.error));

  const username = r.data.username || r.data.kodeJuri.toLowerCase();
  const dummyPassword = genPassword();

  try {
    const u = await db.user.create({
      data: {
        username,
        passwordHash: await hashPassword(dummyPassword),
        role: "JURI",
        mustChangePassword: false,
      },
    });
    const j = await db.juri.create({ data: { kodeJuri: r.data.kodeJuri, nama: r.data.nama, userId: u.id } });
    await audit({ userId: admin.id, aksi: "BUAT_JURI", entitas: "juri", entitasId: j.id, dataBaru: { kodeJuri: r.data.kodeJuri, nama: r.data.nama } });
  } catch (e) {
    if (isUnique(e, "username")) return fail(`Username/ID "${username}" sudah dipakai.`);
    if (isUnique(e, "kode_juri")) return fail(`ID Juri "${r.data.kodeJuri}" sudah dipakai.`);
    if (isUnique(e)) return fail("ID Juri atau username sudah dipakai.");
    throw e;
  }
  revalidatePath("/admin/juri");
  return {
    ok: true,
    message: `Juri ${r.data.kodeJuri} (${r.data.nama}) berhasil didaftarkan. Juri dapat langsung login memilih namanya tanpa password.`,
  };
}

export async function updateJuriAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = Number(fd.get("id"));
  const nama = z.string().trim().min(2, "Nama juri minimal 2 karakter.").max(120).safeParse(fd.get("nama"));
  if (!nama.success) return fail("Nama juri minimal 2 karakter.");
  const j = await db.juri.findFirst({ where: { id, deletedAt: null } });
  if (!j) return fail("Juri tidak ditemukan.");
  await db.juri.update({ where: { id }, data: { nama: nama.data } });
  await audit({ userId: admin.id, aksi: "UBAH_JURI", entitas: "juri", entitasId: id, dataLama: { nama: j.nama }, dataBaru: { nama: nama.data } });
  revalidatePath("/admin/juri");
  revalidatePath("/login");
  revalidatePath("/juri");
  revalidatePath("/admin");
  revalidatePath("/admin/nilai");
  revalidatePath("/admin/berita-acara");
  return { ok: true, message: `Nama juri ${j.kodeJuri} berhasil diubah menjadi "${nama.data}".` };
}

export async function toggleJuriAction(fd: FormData) {
  const admin = await requireAdmin();
  const id = Number(fd.get("id"));
  const j = await db.juri.findFirst({ where: { id, deletedAt: null } });
  if (!j) return;
  await db.juri.update({ where: { id }, data: { isActive: !j.isActive } });
  if (j.isActive) await db.session.deleteMany({ where: { userId: j.userId } });
  await audit({ userId: admin.id, aksi: j.isActive ? "NONAKTIFKAN_JURI" : "AKTIFKAN_JURI", entitas: "juri", entitasId: id });
  revalidatePath("/admin/juri");
}

export async function resetJuriPasswordAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = Number(fd.get("id"));
  const j = await db.juri.findFirst({ where: { id, deletedAt: null } });
  if (!j) return fail("Juri tidak ditemukan.");
  const password = genPassword();
  await db.user.update({
    where: { id: j.userId },
    data: { passwordHash: await hashPassword(password), mustChangePassword: true, failedLogins: 0, lockedUntil: null },
  });
  await db.session.deleteMany({ where: { userId: j.userId } });
  await audit({ userId: admin.id, aksi: "RESET_PASSWORD_JURI", entitas: "juri", entitasId: id });
  return { ok: true, message: `Password baru ${j.kodeJuri}: ${password} (catat sekarang; juri wajib menggantinya saat login).` };
}

export async function deleteJuriAction(fd: FormData) {
  const admin = await requireAdmin();
  const id = Number(fd.get("id"));
  const j = await db.juri.findFirst({ where: { id, deletedAt: null } });
  if (!j) return;
  if ((await db.penilaian.count({ where: { juriId: id } })) > 0) return; // punya nilai → cukup nonaktifkan
  await db.$transaction([
    db.juri.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } }),
    db.user.update({ where: { id: j.userId }, data: { isActive: false } }),
    db.session.deleteMany({ where: { userId: j.userId } }),
  ]);
  await audit({ userId: admin.id, aksi: "HAPUS_JURI", entitas: "juri", entitasId: id, dataLama: { kode: j.kodeJuri } });
  revalidatePath("/admin/juri");
}

/* ------------------------------------------------------------------ */
/*  Kriteria                                                           */
/* ------------------------------------------------------------------ */

export async function saveKriteriaAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const ev = await getEvent();
  if (ev.fase !== "PERSIAPAN") return fail("Kriteria hanya bisa diubah pada fase Persiapan.");
  if ((await db.penilaian.count()) > 0) return fail("Sudah ada data penilaian; kriteria terkunci.");

  const rows = await db.kriteria.findMany({ orderBy: { urutan: "asc" } });
  const updates: { id: number; nama: string; deskripsi: string | null; bobot: string }[] = [];
  for (const k of rows) {
    const nama = String(fd.get(`nama_${k.id}`) ?? "").trim();
    const deskripsi = String(fd.get(`deskripsi_${k.id}`) ?? "").trim() || null;
    const bobotRaw = String(fd.get(`bobot_${k.id}`) ?? "").trim().replace(",", ".");
    if (nama.length < 2) return fail("Nama kriteria minimal 2 karakter.");
    let bp: number;
    try {
      bp = persenToBp(bobotRaw);
    } catch {
      return fail(`Bobot "${nama}" tidak valid (angka, maksimal 2 desimal).`);
    }
    if (bp <= 0) return fail(`Bobot "${nama}" harus lebih dari 0.`);
    updates.push({ id: k.id, nama, deskripsi, bobot: (bp / 100).toFixed(2) });
  }
  const total = updates.reduce((a, u) => a + persenToBp(u.bobot), 0);
  if (total !== 10000) return fail(`Total bobot harus tepat 100% (saat ini ${(total / 100).toFixed(2)}%).`);

  await db.$transaction(updates.map((u) => db.kriteria.update({ where: { id: u.id }, data: { nama: u.nama, deskripsi: u.deskripsi, bobot: u.bobot } })));
  await audit({ userId: admin.id, aksi: "UBAH_KRITERIA", entitas: "kriteria", dataLama: rows.map((r) => ({ id: r.id, nama: r.nama, bobot: r.bobot.toString() })), dataBaru: updates });
  revalidatePath("/admin/kriteria");
  return { ok: true, message: "Kriteria disimpan." };
}

/* ------------------------------------------------------------------ */
/*  Nilai (unlock) & backup                                            */
/* ------------------------------------------------------------------ */

export async function unlockPenilaianAction(fd: FormData) {
  const admin = await requireAdmin();
  const ev = await getEvent();
  if (ev.fase !== "PENJURIAN") return; // fase Selesai = read-only
  const id = Number(fd.get("id"));
  const ok = await unlockPenilaian(id, admin.id);
  if (ok) await audit({ userId: admin.id, aksi: "UNLOCK_NILAI", entitas: "penilaian", entitasId: id });
  revalidatePath("/admin/nilai");
}

export async function backupNowAction(_p: ActionState): Promise<ActionState> {
  const admin = await requireAdmin();
  try {
    const f = await runBackup("manual");
    await audit({ userId: admin.id, aksi: "BACKUP_MANUAL", entitas: "backup", entitasId: f.name });
    revalidatePath("/admin/backup");
    return { ok: true, message: `Backup dibuat: ${f.name} (${(f.size / 1024).toFixed(0)} KB).` };
  } catch (e) {
    return fail(`Backup gagal: ${e instanceof Error ? e.message : String(e)}`);
  }
}
