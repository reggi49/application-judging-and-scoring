/**
 * DATA CONTOH UNTUK UJI COBA — jangan dijalankan di server produksi.
 * Membuat 3 juri, 3 peserta, 5 karya (dengan foto placeholder).
 */
import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import sharp from "sharp";

const db = new PrismaClient();
const uploadDir = path.resolve(process.cwd(), process.env.STORAGE_DIR ?? "./storage", "uploads");

async function placeholder(text: string, hue: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue},35%,12%)"/><stop offset="1" stop-color="hsl(${hue},45%,28%)"/></linearGradient></defs>
    <rect width="1200" height="900" fill="url(#g)"/>
    <rect x="40" y="40" width="1120" height="820" fill="none" stroke="#c9a24b" stroke-width="3"/>
    <text x="600" y="470" font-family="Georgia, serif" font-size="96" fill="#e8cf8a" text-anchor="middle">${text}</text>
    <text x="600" y="540" font-family="Arial" font-size="32" fill="#a89968" text-anchor="middle">foto contoh</text></svg>`;
  const buf = await sharp(Buffer.from(svg)).webp({ quality: 80 }).toBuffer();
  const thumb = await sharp(buf).resize({ width: 480 }).webp({ quality: 75 }).toBuffer();
  const base = randomUUID();
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, `${base}.webp`), buf);
  await writeFile(path.join(uploadDir, `${base}_t.webp`), thumb);
  return { filename: `${base}.webp`, thumbFilename: `${base}_t.webp`, mime: "image/webp", size: buf.length };
}

async function main() {
  const pw = await hash("Juri#2026");

  for (const [i, nama] of ["Juri Satu", "Juri Dua", "Juri Tiga"].entries()) {
    const kode = `J0${i + 1}`;
    if (await db.juri.findUnique({ where: { kodeJuri: kode } })) continue;
    const u = await db.user.create({ data: { username: kode.toLowerCase(), passwordHash: pw, role: "JURI" } });
    await db.juri.create({ data: { kodeJuri: kode, nama, userId: u.id } });
  }

  const pesertaData = [
    { kodePeserta: "BRM", nama: "Bram Upholstery", deskripsi: "Studio jok custom bergaya klasik." },
    { kodePeserta: "SKR", nama: "Sakura Seat Works", deskripsi: "Spesialis grafis dan bordir jok." },
    { kodePeserta: "NRT", nama: "North Riders Garage", deskripsi: "Komunitas modifikasi touring." },
  ];
  for (const p of pesertaData) {
    await db.peserta.upsert({ where: { kodePeserta: p.kodePeserta }, update: {}, create: p });
  }

  const karyaData: [string, string, string][] = [
    ["BRM", "CLS", "Classic Heritage"],
    ["BRM", "VNT", "Vintage Brown"],
    ["SKR", "BLM", "Blossom Carbon"],
    ["NRT", "TRG", "Touring Grey"],
    ["NRT", "ADV", "Adventure Sand"],
  ];
  let hue = 30;
  for (const [kp, ak, nama] of karyaData) {
    const peserta = await db.peserta.findUniqueOrThrow({ where: { kodePeserta: kp } });
    const exists = await db.karya.findFirst({ where: { pesertaId: peserta.id, akronimKarya: ak } });
    if (exists) continue;
    const created = await db.$transaction(async (tx) => {
      await tx.$executeRaw`UPDATE peserta SET karya_counter = karya_counter + 1 WHERE id = ${peserta.id}`;
      const p = await tx.peserta.findUniqueOrThrow({ where: { id: peserta.id } });
      const no = p.karyaCounter;
      return tx.karya.create({
        data: {
          pesertaId: p.id,
          akronimKarya: ak,
          noUrut: no,
          kodeKarya: `${kp}-${ak}-${String(no).padStart(3, "0")}`,
          namaKarya: nama,
          deskripsi: `Karya contoh "${nama}".`,
        },
      });
    });
    hue = (hue + 47) % 360;
    for (let n = 0; n < 3; n++) {
      const img = await placeholder(`${created.kodeKarya} #${n + 1}`, hue + n * 8);
      await db.karyaGambar.create({ data: { karyaId: created.id, urutan: n, isCover: n === 0, ...img } });
    }
    console.log("Karya:", created.kodeKarya);
  }
  console.log("Selesai. Login juri: j01/j02/j03, password: Juri#2026");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

