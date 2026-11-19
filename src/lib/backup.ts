/**
 * Backup database SQLite (`VACUUM INTO` → gzip) + arsip folder foto. Tanpa dependensi
 * biner eksternal, bisa dipanggil dari aplikasi, penjadwal internal, maupun CLI (`npm run backup`).
 */
import { spawn } from "node:child_process";
import { createGzip } from "node:zlib";
import { createReadStream, createWriteStream } from "node:fs";
import { copyFile, mkdir, open, readdir, rename, rm, stat, unlink } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import { db } from "./db";
import { backupDir, storageDir as storageRoot } from "./env";

export type BackupFile = { name: string; size: number; mtime: Date; kind: "db" | "uploads" };

const NAME_RE = /^rwsa-\d{8}-\d{6}-[a-z]+\.(db\.gz|uploads\.tar\.gz)$/;
export const isSafeBackupName = (n: string) => NAME_RE.test(n);

function stamp(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/** Verifikasi 16 byte pertama berkas snapshot adalah header resmi SQLite 3. */
async function verifySqliteSnapshot(file: string) {
  const fh = await open(file, "r");
  try {
    const buf = Buffer.alloc(16);
    const { bytesRead } = await fh.read(buf, 0, 16, 0);
    if (bytesRead < 16 || buf.toString("ascii", 0, 15) !== "SQLite format 3") {
      throw new Error("Berkas snapshot SQLite tidak valid (verifikasi header gagal).");
    }
  } finally {
    await fh.close();
  }
}

async function dumpDatabase(target: string) {
  const raw = process.env.DATABASE_URL;
  if (!raw || !raw.startsWith("file:")) {
    throw new Error("DATABASE_URL harus menggunakan SQLite (file:...)");
  }
  const tmpDb = `${target}.sqlite.part`;
  const tmpGz = `${target}.gz.part`;
  await rm(tmpDb, { force: true });
  await rm(tmpGz, { force: true });

  try {
    await db.$executeRawUnsafe(`VACUUM INTO '${tmpDb.replace(/'/g, "''")}'`);
    await verifySqliteSnapshot(tmpDb);
    await pipeline(createReadStream(tmpDb), createGzip({ level: 9 }), createWriteStream(tmpGz));
    await rename(tmpGz, target);
  } catch (e) {
    await rm(tmpGz, { force: true });
    throw e;
  } finally {
    await rm(tmpDb, { force: true });
  }
}

async function archiveUploads(target: string) {
  const root = storageRoot();
  try {
    await stat(path.join(root, "uploads"));
  } catch {
    return false; // belum ada foto
  }
  const tmp = `${target}.part`;
  await new Promise<void>((resolve, reject) => {
    const c = spawn(/*turbopackIgnore: true*/ "tar", ["-czf", tmp, "-C", root, "uploads"], { stdio: "ignore" });
    c.on("error", reject);
    c.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`tar gagal (kode ${code})`))));
  });
  await rename(tmp, target);
  return true;
}

export async function listBackups(): Promise<BackupFile[]> {
  const dir = backupDir();
  let names: string[] = [];
  try {
    names = await readdir(/*turbopackIgnore: true*/ dir);
  } catch {
    return [];
  }
  const out: BackupFile[] = [];
  for (const name of names) {
    if (!isSafeBackupName(name)) continue;
    const s = await stat(path.join(dir, name));
    out.push({ name, size: s.size, mtime: s.mtime, kind: name.endsWith(".db.gz") ? "db" : "uploads" });
  }
  return out.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
}

async function applyRetention() {
  const days = Number(process.env.BACKUP_RETENTION_DAYS ?? 14);
  const all = await listBackups();
  const dbs = all.filter((f) => f.kind === "db");
  const keepLatest = new Set(dbs.slice(0, 5).map((f) => f.name));
  const cutoff = Date.now() - days * 86_400_000;
  for (const f of all) {
    if (f.mtime.getTime() < cutoff && !keepLatest.has(f.name)) await unlink(path.join(backupDir(), f.name)).catch(() => {});
  }
}

/** Salin ke lokasi kedua (mis. folder yang disinkronkan ke cloud / disk lain) bila BACKUP_COPY_DIR diset. */
async function mirror(files: string[]) {
  const dest = process.env.BACKUP_COPY_DIR;
  if (!dest) return undefined;
  try {
    await mkdir(dest, { recursive: true });
    for (const f of files) await copyFile(f, path.join(path.resolve(dest), path.basename(f)));
    return undefined;
  } catch (e) {
    return `Salinan ke BACKUP_COPY_DIR gagal: ${e instanceof Error ? e.message : String(e)}`;
  }
}

export async function runBackup(tag: "manual" | "auto" | "cli" = "manual") {
  const dir = backupDir();
  await mkdir(dir, { recursive: true });
  const ts = stamp();
  const dbFile = path.join(dir, `rwsa-${ts}-${tag}.db.gz`);
  await dumpDatabase(dbFile);
  const files = [dbFile];
  const upFile = path.join(dir, `rwsa-${ts}-${tag}.uploads.tar.gz`);
  if (process.env.BACKUP_INCLUDE_UPLOADS !== "0" && (await archiveUploads(upFile))) files.push(upFile);
  const mirrorWarning = await mirror(files);
  await applyRetention();
  const s = await stat(dbFile);
  return { name: path.basename(dbFile), size: s.size, mirrorWarning };
}

export function backupFilePath(name: string) {
  if (!isSafeBackupName(name)) throw new Error("Nama berkas tidak valid");
  return path.join(backupDir(), name);
}
