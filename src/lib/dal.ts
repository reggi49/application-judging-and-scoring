import "server-only";
import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "./auth";

/** Untuk halaman / server action: redirect jika tidak berhak. */
export async function requireUser(role?: "ADMIN" | "JURI", opts?: { allowMustChange?: boolean }): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) redirect("/login");
  if (role && u.role !== role) redirect(u.role === "ADMIN" ? "/admin" : "/juri");
  if (u.role === "ADMIN" && u.mustChangePassword && !opts?.allowMustChange) redirect("/ganti-password");
  return u;
}

export const requireAdmin = () => requireUser("ADMIN");
export const requireJuri = () => requireUser("JURI");

/** Untuk route handler (API): kembalikan user atau null (jawab 401/403 sendiri). */
export async function apiUser(role?: "ADMIN" | "JURI"): Promise<SessionUser | null> {
  const u = await getSessionUser();
  if (!u) return null;
  if (role && u.role !== role) return null;
  if (u.role === "ADMIN" && u.mustChangePassword) return null;
  return u;
}

/** Tolak request lintas-origin untuk method yang mengubah data (lapisan CSRF tambahan di atas SameSite=Lax). */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // request non-browser / same-origin GET-like
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

