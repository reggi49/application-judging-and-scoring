/**
 * Backup database (mysqldump → gzip) + arsip folder foto. Tanpa dependensi Next.js,
 * sehingga bisa dipanggil dari aplikasi, penjadwal internal, maupun CLI (`npm run backup`).
 */
import { spawn } from "node:child_process";
import { createGunzip, createGzip } from "node:zlib";
import { createReadStream, createWriteStream } from "node:fs";
import { copyFile, mkdir, readdir, rename, rm, stat, unlink } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import path from "node:path";

const backupDir = () => path.resolve(process.cwd(), process.env.BACKUP_DIR ?? "./storage/backups");
const storageRoot = () => path.resolve(process.cwd(), process.env.STORAGE_DIR ?? "./storage");

export type BackupFile = { name: string; size: number; mtime: Date; kind: "db" | "uploads" };

const NAME_RE = /^rwsa-\d{8}-\d{6}-[a-z]+\.(sql\.gz|uploads\.tar\.gz)$/;
export const isSafeBackupName = (n: string) => NAME_RE.test(n);

function stamp(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function parseDbUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL belum diset");
  const u = new URL(raw);
  return {
    host: u.hostname,
    port: u.port || "3306",
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ""),
  };
}

async function dumpDatabase(target: string) {
  const db = parseDbUrl();
  const bin = process.env.MYSQLDUMP_PATH || "mysqldump";
  const tmp = `${target}.part`;
  const child = spawn(
    bin,
    [
      "--protocol=TCP", "-h", db.host, "-P", db.port, "-u", db.user,
      "--single-transaction", "--routines", "--triggers", "--no-tablespaces",
      "--default-character-set=utf8mb4", "--hex-blob", db.database,
    ],
    { env: { ...process.env, MYSQL_PWD: db.password }, stdio: ["ignore", "pipe", "pipe"] },
  );
  let stderr = "";
  child.stderr.on("data", (d) => (stderr += d.toString()));
  const exit = new Promise<number>((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  });
  try {
    await Promise.all([pipeline(child.stdout, createGzip({ level: 9 }), createWriteStream(tmp)), exit.then((c) => {
      if (c !== 0) throw new Error(`mysqldump gagal (kode ${c}): ${stderr.replace(/\[Warning\][^\n]*\n?/g, "").trim().slice(0, 300)}`);
    })]);
    await verifyDump(tmp);
    await rename(tmp, target);
  } catch (e) {
    await rm(tmp, { force: true });
    throw e;
  }
}

/** Pastikan dump lengkap: mysqldump menulis "Dump completed" di baris terakhir. */
async function verifyDump(file: string) {
  let tail = "";
  await pipeline(createReadStream(file), createGunzip(), async function (source) {
    for await (const chunk of source) tail = (tail + chunk.toString("utf8")).slice(-400);
  });
  if (!tail.includes("Dump completed")) throw new Error("Berkas backup tidak lengkap (verifikasi gagal).");
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
    const c = spawn("tar", ["-czf", tmp, "-C", root, "uploads"], { stdio: "ignore" });
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
    names = await readdir(dir);
  } catch {
    return [];
  }
  const out: BackupFile[] = [];
  for (const name of names) {
    if (!isSafeBackupName(name)) continue;
    const s = await stat(path.join(dir, name));
    out.push({ name, size: s.size, mtime: s.mtime, kind: name.endsWith(".sql.gz") ? "db" : "uploads" });
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
  const dbFile = path.join(dir, `rwsa-${ts}-${tag}.sql.gz`);
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

