import path from "node:path";

/** Saat dijalankan dari `.next/standalone/server.js`, Next melakukan chdir ke `.next/standalone`. */
export function projectRoot(): string {
  const cwd = process.cwd();
  const suffix = `${path.sep}.next${path.sep}standalone`;
  return cwd.endsWith(suffix) ? path.resolve(/*turbopackIgnore: true*/ cwd, "../..") : cwd;
}

export const storageDir = () =>
  path.resolve(/*turbopackIgnore: true*/ projectRoot(), process.env.STORAGE_DIR ?? "./storage");
export const uploadDir = () => path.join(storageDir(), "uploads");
export const backupDir = () =>
  path.resolve(/*turbopackIgnore: true*/ projectRoot(), process.env.BACKUP_DIR ?? "./storage/backups");

/** Batas bisnis */
export const MAX_FOTO_PER_KARYA = 5;
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024; // sebelum kompresi server
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
