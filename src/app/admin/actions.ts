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
import { restoreDatabaseBackup, runBackup, sanitizeBackupTag } from "@/lib/backup";
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
  for (; ;) {
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

const syncTotalSchema = z.object({
  total: z.coerce.number().int().min(1, "Minimal 1 peserta.").max(250, "Maksimal 250 peserta."),
});

/** Menyesuaikan jumlah slot peserta & karya (001..N) secara instan. */
export async function syncTotalPesertaAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const r = syncTotalSchema.safeParse({ total: fd.get("total") });
  if (!r.success) return fail(firstIssue(r.error));

  const target = r.data.total;
  const now = new Date();
  let createdOrRestored = 0;
  let hiddenCount = 0;
  const protectedKodes: string[] = [];

  await db.$transaction(async (tx) => {
    // 1. Pastikan slot 001..target aktif (buat baru atau pulihkan yang pernah dinonaktifkan)
    for (let i = 1; i <= target; i++) {
      const nomorStr = String(i).padStart(3, "0");
      let peserta = await tx.peserta.findUnique({ where: { kodePeserta: nomorStr } });
      if (!peserta) {
        peserta = await tx.peserta.create({
          data: {
            kodePeserta: nomorStr,
            nama: `Peserta #${nomorStr}`,
            karyaCounter: 1,
          },
        });
        createdOrRestored++;
      } else if (peserta.deletedAt !== null) {
        peserta = await tx.peserta.update({
          where: { id: peserta.id },
          data: { deletedAt: null },
        });
        createdOrRestored++;
      }

      const karya = await tx.karya.findUnique({ where: { kodeKarya: nomorStr } });
      if (!karya) {
        await tx.karya.create({
          data: {
            pesertaId: peserta.id,
            akronimKarya: "RW",
            noUrut: 1,
            kodeKarya: nomorStr,
            namaKarya: `Nomor ${nomorStr}`,
            deskripsi: null,
          },
        });
      } else if (karya.deletedAt !== null) {
        await tx.karya.update({
          where: { id: karya.id },
          data: { deletedAt: null },
        });
      }
    }

    // 2. Nonaktifkan slot bernomor di atas target (kecuali yang sudah memiliki penilaian)
    const activePeserta = await tx.peserta.findMany({
      where: { deletedAt: null },
      include: {
        karya: {
          where: { deletedAt: null },
          include: { _count: { select: { penilaian: true } } },
        },
      },
    });

    for (const p of activePeserta) {
      if (!/^\d{3}$/.test(p.kodePeserta)) continue;
      const num = parseInt(p.kodePeserta, 10);
      if (num <= target) continue;

      const hasScores = p.karya.some((k) => k._count.penilaian > 0);
      if (hasScores) {
        protectedKodes.push(p.kodePeserta);
        continue;
      }

      await tx.karya.updateMany({
        where: { pesertaId: p.id, deletedAt: null },
        data: { deletedAt: now },
      });
      await tx.peserta.update({
        where: { id: p.id },
        data: { deletedAt: now },
      });
      hiddenCount++;
    }
  });

  await audit({
    userId: admin.id,
    aksi: "ATUR_TOTAL_PESERTA",
    entitas: "peserta",
    dataBaru: { target, createdOrRestored, hiddenCount, protectedKodes },
  });

  revalidatePath("/admin/peserta");
  revalidatePath("/admin/karya");
  revalidatePath("/admin/karya/label");
  revalidatePath("/admin");
  revalidatePath("/juri");

  if (protectedKodes.length > 0) {
    return {
      ok: true,
      message: `Total peserta disesuaikan ke ${target}. Slot ${protectedKodes.join(", ")} tetap dipertahankan karena sudah memiliki nilai.`,
    };
  }
  return {
    ok: true,
    message: `Total peserta berhasil disesuaikan menjadi ${target} peserta (001–${String(target).padStart(3, "0")}).`,
  };
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
  const old = await db.karya.findFirst({ where: { id, deletedAt: null }, include: { peserta: true } });
  if (!old) return fail("Karya tidak ditemukan.");
  const r = z
    .object({
      namaKarya: karyaSchema.shape.namaKarya,
      whatsapp: z
        .string()
        .trim()
        .regex(/^\d*$/, "Nomor WhatsApp harus berupa angka saja.")
        .max(25, "Nomor WhatsApp maksimal 25 digit.")
        .optional()
        .transform((v) => (v ? v : null)),
      deskripsi: karyaSchema.shape.deskripsi,
    })
    .safeParse(Object.fromEntries(fd));
  if (!r.success) return fail(firstIssue(r.error));

  const hasShowDesk = fd.get("includeDeskripsi") === "1";
  const dataToSave = hasShowDesk
    ? r.data
    : { namaKarya: r.data.namaKarya, whatsapp: r.data.whatsapp };

  await db.$transaction(async (tx) => {
    await tx.karya.update({ where: { id }, data: dataToSave });
    if (old.pesertaId) {
      await tx.peserta.update({ where: { id: old.pesertaId }, data: { nama: r.data.namaKarya } });
    }
  });
  await audit({
    userId: admin.id,
    aksi: "UBAH_KARYA",
    entitas: "karya",
    entitasId: id,
    dataLama: { namaKarya: old.namaKarya, whatsapp: old.whatsapp, deskripsi: old.deskripsi },
    dataBaru: dataToSave,
  });
  revalidatePath(`/admin/karya/${id}`);
  revalidatePath("/admin/karya");
  revalidatePath(`/juri/karya/${old.kodeKarya}`);
  revalidatePath("/juri");
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

  const rawKode = fd.get("kodeJuri");
  const hasKode = typeof rawKode === "string" && rawKode.trim().length > 0;
  const kodeParsed = hasKode
    ? z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z0-9_-]{2,20}$/, "ID Juri 2–20 karakter (huruf/angka/-/_).")
        .safeParse(rawKode)
    : null;
  if (kodeParsed && !kodeParsed.success) return fail(firstIssue(kodeParsed.error));

  const j = await db.juri.findFirst({ where: { id, deletedAt: null } });
  if (!j) return fail("Juri tidak ditemukan.");

  const nextKode = kodeParsed ? kodeParsed.data : j.kodeJuri;
  try {
    await db.juri.update({
      where: { id },
      data: { nama: nama.data, kodeJuri: nextKode },
    });
  } catch (e) {
    if (isUnique(e, "kode_juri") || isUnique(e)) {
      return fail(`ID Juri "${nextKode}" sudah dipakai juri lain.`);
    }
    throw e;
  }

  await audit({
    userId: admin.id,
    aksi: "UBAH_JURI",
    entitas: "juri",
    entitasId: id,
    dataLama: { kodeJuri: j.kodeJuri, nama: j.nama },
    dataBaru: { kodeJuri: nextKode, nama: nama.data },
  });
  revalidatePath("/admin/juri");
  revalidatePath("/login");
  revalidatePath("/juri");
  revalidatePath("/admin");
  revalidatePath("/admin/nilai");
  revalidatePath("/admin/berita-acara");
  return {
    ok: true,
    message: `Data juri ${nextKode} berhasil diperbarui (${nama.data}).`,
  };
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
  void _p;
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

const resetDbSchema = z.object({
  backupName: z
    .string()
    .trim()
    .min(2, "Nama backup minimal 2 karakter.")
    .max(40, "Nama backup maksimal 40 karakter."),
  confirmCode: z.string().trim().min(1, "Kode konfirmasi wajib diisi."),
});

/**
 * Backup penuh database + foto dengan nama kustom terlebih dahulu,
 * lalu reset seluruh data penjurian, karya, dan peserta kembali bersih (75 slot awal).
 * Akun Admin, sesi login aktif, akun Dewan Juri, dan Kriteria tetap dipertahankan.
 */
export async function backupAndResetDatabaseAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = resetDbSchema.safeParse({
    backupName: fd.get("backupName"),
    confirmCode: fd.get("confirmCode"),
  });
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const expectedCode = (process.env.RESET_DB_CODE || "RESET-RWSA").trim();
  if (parsed.data.confirmCode !== expectedCode) {
    return fail("Kode konfirmasi reset tidak sesuai.");
  }

  const safeTag = sanitizeBackupTag(parsed.data.backupName);

  // 1. WAJIB backup penuh terlebih dahulu sebelum menyentuh data
  let backupInfo: { name: string; size: number };
  try {
    backupInfo = await runBackup(safeTag);
  } catch (e) {
    return fail(
      `Reset dibatalkan karena backup penuh gagal dibuat: ${e instanceof Error ? e.message : String(e)}`
    );
  }

  // 2. Reset data penjurian, karya, peserta, dan audit lama; siapkan ulang 75 slot bersih
  try {
    await db.$transaction(async (tx) => {
      await tx.penilaianDetail.deleteMany({});
      await tx.penilaianHistory.deleteMany({});
      await tx.penilaian.deleteMany({});
      await tx.karyaGambar.deleteMany({});
      await tx.karya.deleteMany({});
      await tx.peserta.deleteMany({});
      await tx.auditLog.deleteMany({});

      await tx.eventSetting.upsert({
        where: { id: 1 },
        update: { fase: "PENJURIAN" },
        create: { id: 1, nama: "MBtech Riding With Style Awards 2026", fase: "PENJURIAN" },
      });

      const DEFAULT_SLOTS = 75;
      for (let i = 1; i <= DEFAULT_SLOTS; i++) {
        const nomorStr = String(i).padStart(3, "0");
        const peserta = await tx.peserta.create({
          data: {
            kodePeserta: nomorStr,
            nama: `Peserta #${nomorStr}`,
            karyaCounter: 1,
          },
        });
        await tx.karya.create({
          data: {
            pesertaId: peserta.id,
            akronimKarya: "RW",
            noUrut: 1,
            kodeKarya: nomorStr,
            namaKarya: `Nomor ${nomorStr}`,
            deskripsi: null,
          },
        });
      }
    });

    await audit({
      userId: admin.id,
      aksi: "RESET_DATABASE",
      entitas: "backup",
      entitasId: backupInfo.name,
      dataBaru: { backupName: backupInfo.name, backupSize: backupInfo.size, defaultSlots: 75 },
    });
  } catch (e) {
    return fail(
      `Backup "${backupInfo.name}" berhasil disimpan, tetapi reset database gagal: ${e instanceof Error ? e.message : String(e)
      }`
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/peserta");
  revalidatePath("/admin/karya");
  revalidatePath("/admin/karya/label");
  revalidatePath("/admin/nilai");
  revalidatePath("/admin/berita-acara");
  revalidatePath("/admin/backup");
  revalidatePath("/juri");

  return {
    ok: true,
    message: `Backup penuh tersimpan (${backupInfo.name}) dan database berhasil di-reset ke 75 slot awal.`,
  };
}

/** Restore database SQLite dari berkas backup `.db.gz` yang dipilih (wajib kode konfirmasi). */
export async function restoreBackupAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const name = String(fd.get("name") ?? "").trim();
  const confirmCode = String(fd.get("confirmCode") ?? "").trim();
  if (!name) return fail("Pilih berkas backup terlebih dahulu.");

  const expectedCode = (process.env.RESET_DB_CODE || "RESET-RWSA").trim();
  if (confirmCode !== expectedCode) {
    return fail("Kode konfirmasi tidak sesuai.");
  }

  try {
    const res = await restoreDatabaseBackup(name);
    await audit({
      userId: admin.id,
      aksi: "RESTORE_BACKUP",
      entitas: "backup",
      entitasId: res.restoredFrom,
      dataBaru: res,
    });
    revalidatePath("/admin");
    revalidatePath("/admin/peserta");
    revalidatePath("/admin/karya");
    revalidatePath("/admin/karya/label");
    revalidatePath("/admin/nilai");
    revalidatePath("/admin/berita-acara");
    revalidatePath("/admin/backup");
    revalidatePath("/juri");
    return {
      ok: true,
      message: `Database berhasil di-restore dari ${res.restoredFrom}. (Backup pengaman otomatis: ${res.safetyBackup})`,
    };
  } catch (e) {
    return fail(`Restore gagal: ${e instanceof Error ? e.message : String(e)}`);
  }
}
