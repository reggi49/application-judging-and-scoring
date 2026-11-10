import path from "node:path";

export const storageDir = () => path.resolve(process.cwd(), process.env.STORAGE_DIR ?? "./storage");
export const uploadDir = () => path.join(storageDir(), "uploads");
export const backupDir = () => path.resolve(process.cwd(), process.env.BACKUP_DIR ?? "./storage/backups");

/** Batas bisnis */
export const MAX_FOTO_PER_KARYA = 5;
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024; // sebelum kompresi server
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

