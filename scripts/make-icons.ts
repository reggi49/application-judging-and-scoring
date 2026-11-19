/**
 * Script untuk membuat ikon PWA dan Favicon dari logo resmi:
 * public/icons/LOGO RWSA 2026 POLOS.png
 *
 * Menghasilkan:
 * - public/icons/icon-192.png (PWA standard 192x192)
 * - public/icons/icon-384.png (PWA 384x384)
 * - public/icons/icon-512.png (PWA standard 512x512)
 * - public/icons/maskable-512.png (Android adaptive/maskable safe-zone)
 * - public/icons/apple-touch-icon.png (iOS Safari 180x180 solid background)
 * - public/icons/favicon-32x32.png
 * - public/icons/favicon-16x16.png
 * - public/favicon.ico & src/app/favicon.ico (Multi-size ICO 16, 32, 48)
 */
import sharp from "sharp";
import { mkdir, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const iconsDir = path.resolve(root, "public/icons");
const sourceLogo = path.resolve(iconsDir, "LOGO RWSA 2026 POLOS.png");

// Warna tema aplikasi (Obsidian Slate)
const BRAND_BG = { r: 26, g: 25, b: 23, alpha: 1 }; // #1a1917
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

function createIco(pngBuffers: { width: number; height: number; buffer: Buffer }[]): Buffer {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(count, 4); // count

  let offset = 6 + count * 16;
  const dirEntries: Buffer[] = [];
  for (const item of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(item.width >= 256 ? 0 : item.width, 0);
    entry.writeUInt8(item.height >= 256 ? 0 : item.height, 1);
    entry.writeUInt8(0, 2); // color palette count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(item.buffer.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset
    dirEntries.push(entry);
    offset += item.buffer.length;
  }
  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map((b) => b.buffer)]);
}

async function main() {
  await mkdir(iconsDir, { recursive: true });

  console.log("Membaca logo sumber:", sourceLogo);
  // Trim area transparan kosong di pinggir logo
  const trimmedBuffer = await sharp(sourceLogo).trim().toBuffer();

  /**
   * Helper untuk membuat ikon persegi dengan latar solid
   */
  async function makeSolidIcon(
    canvasSize: number,
    logoSize: number,
    outPath: string
  ) {
    const resizedLogo = await sharp(trimmedBuffer)
      .resize(logoSize, logoSize, { fit: "contain", background: TRANSPARENT })
      .toBuffer();

    await sharp({
      create: {
        width: canvasSize,
        height: canvasSize,
        channels: 4,
        background: BRAND_BG,
      },
    })
      .composite([{ input: resizedLogo, gravity: "center" }])
      .png({ compressionLevel: 9 })
      .toFile(outPath);

    console.log(`✓ Dibuat: ${path.basename(outPath)} (${canvasSize}x${canvasSize}, logo ${logoSize}x${logoSize})`);
  }

  // 1. PWA icon-192
  await makeSolidIcon(192, 160, path.join(iconsDir, "icon-192.png"));

  // 2. PWA icon-384
  await makeSolidIcon(384, 320, path.join(iconsDir, "icon-384.png"));

  // 3. PWA icon-512
  await makeSolidIcon(512, 426, path.join(iconsDir, "icon-512.png"));

  // 4. Android Maskable-512 (Zona aman safe-zone 80% circle = max 409px, kita buat 370px agar aman dari pemotongan)
  await makeSolidIcon(512, 370, path.join(iconsDir, "maskable-512.png"));

  // 5. iOS Apple Touch Icon (180x180, latar solid wajib di iOS, padding 18px aman dari squircle)
  await makeSolidIcon(180, 144, path.join(iconsDir, "apple-touch-icon.png"));

  // 6. Favicon PNG
  await sharp(trimmedBuffer)
    .resize(32, 32, { fit: "contain", background: TRANSPARENT })
    .png()
    .toFile(path.join(iconsDir, "favicon-32x32.png"));
  await sharp(trimmedBuffer)
    .resize(16, 16, { fit: "contain", background: TRANSPARENT })
    .png()
    .toFile(path.join(iconsDir, "favicon-16x16.png"));

  // 7. Favicon ICO (16x16, 32x32, 48x48)
  const ico16 = await sharp(trimmedBuffer)
    .resize(16, 16, { fit: "contain", background: TRANSPARENT })
    .png()
    .toBuffer();
  const ico32 = await sharp(trimmedBuffer)
    .resize(32, 32, { fit: "contain", background: TRANSPARENT })
    .png()
    .toBuffer();
  const ico48 = await sharp(trimmedBuffer)
    .resize(48, 48, { fit: "contain", background: TRANSPARENT })
    .png()
    .toBuffer();

  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: ico16 },
    { width: 32, height: 32, buffer: ico32 },
    { width: 48, height: 48, buffer: ico48 },
  ]);

  const publicFavicon = path.resolve(root, "public/favicon.ico");
  const appFavicon = path.resolve(root, "src/app/favicon.ico");
  await writeFile(publicFavicon, icoBuffer);
  await writeFile(appFavicon, icoBuffer);
  console.log("✓ Dibuat: public/favicon.ico & src/app/favicon.ico (Multi-size 16/32/48)");

  console.log("Semua aset ikon PWA & Favicon berhasil diperbarui!");
}

main().catch((err) => {
  console.error("Gagal membuat ikon:", err);
  process.exit(1);
});
