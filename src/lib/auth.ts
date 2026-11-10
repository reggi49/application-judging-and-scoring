import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { hash, verify } from "@node-rs/argon2";
import { db } from "./db";
import { SESSION_TTL_MS } from "./env";
import { SESSION_COOKIE } from "./session-cookie";

export { SESSION_COOKIE };

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export function hashPassword(plain: string) {
  return hash(plain); // argon2id (default)
}

export function verifyPassword(hashed: string, plain: string) {
  return verify(hashed, plain);
}

/** Hash tiruan agar waktu respons sama baik user ada maupun tidak. */
let dummyHash: Promise<string> | null = null;
export function getDummyHash() {
  dummyHash ??= hash("tidak-pernah-dipakai-" + randomBytes(8).toString("hex"));
  return dummyHash;
}

export function validatePasswordStrength(pw: string): string | null {
  if (pw.length < 8) return "Password minimal 8 karakter.";
  if (pw.length > 128) return "Password terlalu panjang.";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Password harus mengandung huruf dan angka.";
  return null;
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({ data: { id: sha256(token), userId, expiresAt } });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: sha256(token) } });
  jar.delete(SESSION_COOKIE);
}

export async function destroyOtherSessions(userId: number, keepToken?: string) {
  await db.session.deleteMany({
    where: { userId, ...(keepToken ? { NOT: { id: sha256(keepToken) } } : {}) },
  });
}

export type SessionUser = {
  id: number;
  username: string;
  role: "ADMIN" | "JURI";
  mustChangePassword: boolean;
  juri: { id: number; kodeJuri: string; nama: string } | null;
};

/** Validasi sesi di server (bukan sekadar cek cookie). Di-cache per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const s = await db.session.findUnique({
    where: { id: sha256(token) },
    include: { user: { include: { juri: true } } },
  });
  if (!s || s.expiresAt.getTime() < Date.now() || !s.user.isActive) return null;
  const j = s.user.juri;
  if (s.user.role === "JURI" && (!j || !j.isActive || j.deletedAt)) return null;
  return {
    id: s.user.id,
    username: s.user.username,
    role: s.user.role,
    mustChangePassword: s.user.mustChangePassword,
    juri: j ? { id: j.id, kodeJuri: j.kodeJuri, nama: j.nama } : null,
  };
});

export async function currentToken() {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value;
}
