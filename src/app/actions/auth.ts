"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import {
  createSession,
  currentToken,
  destroyOtherSessions,
  destroySession,
  getDummyHash,
  getSessionUser,
  hashPassword,
  validatePasswordStrength,
  verifyPassword,
} from "@/lib/auth";
import { audit } from "@/lib/audit";
import type { ActionState } from "@/lib/action-state";

const MAX_FAILED = 5;
const LOCK_MS = 5 * 60 * 1000;

/** Pembatas laju per-IP (memori proses; cukup untuk satu server skala kecil). */
const ipHits = new Map<string, { n: number; reset: number }>();
function ipLimited(ip: string) {
  const now = Date.now();
  const e = ipHits.get(ip);
  if (!e || e.reset < now) {
    ipHits.set(ip, { n: 1, reset: now + 10 * 60 * 1000 });
    return false;
  }
  e.n += 1;
  return e.n > 30;
}

const GENERIC = "Username atau password salah.";

/** Login Juri: tanpa password. Cukup pilih ID / nama juri. */
export async function loginJuriAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const juriId = Number(fd.get("juriId"));
  if (!juriId || !Number.isInteger(juriId)) return { error: "Pilih dewan juri terlebih dahulu." };

  const juri = await db.juri.findFirst({
    where: { id: juriId, deletedAt: null },
    include: { user: true },
  });

  if (!juri || !juri.isActive || !juri.user.isActive) {
    return { error: "Akun dewan juri tidak aktif atau tidak ditemukan." };
  }

  await createSession(juri.userId);
  await audit({ userId: juri.userId, aksi: "LOGIN_JURI", entitas: "juri", entitasId: juri.id });

  redirect("/juri");
}

/** Login Admin: tetap memakai username dan password Argon2id. */
export async function loginAdminAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const username = String(fd.get("username") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!username || !password) return { error: "Isi username dan password admin." };
  if (username.length > 50 || password.length > 128) return { error: GENERIC };

  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim();
  if (ipLimited(ip)) return { error: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi." };

  const user = await db.user.findUnique({ where: { username } });
  if (!user || user.role !== "ADMIN") {
    await verifyPassword(await getDummyHash(), password).catch(() => false);
    return { error: GENERIC };
  }
  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    await verifyPassword(await getDummyHash(), password).catch(() => false);
    return { error: "Akun dikunci sementara karena terlalu banyak percobaan. Coba lagi dalam beberapa menit." };
  }

  const ok = await verifyPassword(user.passwordHash, password).catch(() => false);
  if (!ok) {
    const failed = user.failedLogins + 1;
    await db.user.update({
      where: { id: user.id },
      data: failed >= MAX_FAILED
        ? { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MS) }
        : { failedLogins: failed },
    });
    await audit({ userId: user.id, aksi: "LOGIN_ADMIN_GAGAL", entitas: "user", entitasId: user.id });
    return { error: GENERIC };
  }
  if (!user.isActive) return { error: "Akun admin tidak aktif." };

  await db.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
  await createSession(user.id);
  await audit({ userId: user.id, aksi: "LOGIN_ADMIN", entitas: "user", entitasId: user.id });

  if (user.mustChangePassword) redirect("/ganti-password");
  redirect("/admin");
}

export async function logoutAction() {
  const u = await getSessionUser();
  await destroySession();
  if (u) await audit({ userId: u.id, aksi: "LOGOUT", entitas: "user", entitasId: u.id });
  redirect("/login");
}

export async function changePasswordAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const u = await getSessionUser();
  if (!u || u.role !== "ADMIN") redirect("/login");
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const confirm = String(fd.get("confirm") ?? "");

  const user = await db.user.findUniqueOrThrow({ where: { id: u.id } });
  if (!(await verifyPassword(user.passwordHash, current).catch(() => false))) {
    return { error: "Password saat ini salah." };
  }
  if (next !== confirm) return { error: "Konfirmasi password tidak sama." };
  if (next === current) return { error: "Password baru harus berbeda dari yang lama." };
  const weak = validatePasswordStrength(next);
  if (weak) return { error: weak };

  await db.user.update({
    where: { id: u.id },
    data: { passwordHash: await hashPassword(next), mustChangePassword: false },
  });
  await destroyOtherSessions(u.id, await currentToken());
  await audit({ userId: u.id, aksi: "GANTI_PASSWORD", entitas: "user", entitasId: u.id });
  redirect("/admin");
}
