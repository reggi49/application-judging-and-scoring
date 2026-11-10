import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { MAX_UPLOAD_BYTES, uploadDir } from "./env";

export class UploadError extends Error {}

const ALLOWED = new Set(["jpeg", "png", "webp"]);

/**
 * Validasi isi file sebenarnya (bukan ekstensi), putar sesuai EXIF, hapus metadata (EXIF/GPS),
 * perkecil ke maks 1600px (WebP) + buat thumbnail 480px. Nama file diacak.
 */
export async function processAndStoreImage(buf: Buffer) {
  if (buf.length === 0) throw new UploadError("File kosong.");
  if (buf.length > MAX_UPLOAD_BYTES) throw new UploadError("Ukuran file melebihi 12 MB.");

  let format: string | undefined;
  try {
    format = (await sharp(buf).metadata()).format;
  } catch {
    throw new UploadError("File bukan gambar yang valid.");
  }
  if (!format || !ALLOWED.has(format)) throw new UploadError("Format harus JPG, PNG, atau WebP.");

  const base = randomUUID();
  const filename = `${base}.webp`;
  const thumbFilename = `${base}_t.webp`;
  const dir = uploadDir();
  await mkdir(dir, { recursive: true });

  const main = await sharp(buf, { limitInputPixels: 100_000_000 })
    .rotate() // terapkan orientasi EXIF lalu metadata dibuang (default sharp tidak menyalin EXIF)
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  const thumb = await sharp(main.data)
    .resize({ width: 480, height: 480, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer();

  await writeFile(path.join(dir, filename), main.data);
  await writeFile(path.join(dir, thumbFilename), thumb);
  return { filename, thumbFilename, mime: "image/webp", size: main.data.length };
}

export async function removeStoredImage(filename: string, thumbFilename: string) {
  const dir = uploadDir();
  for (const f of [filename, thumbFilename]) {
    // cegah path traversal: hanya nama file polos
    if (f !== path.basename(f)) continue;
    await unlink(path.join(dir, f)).catch(() => {});
  }
}

