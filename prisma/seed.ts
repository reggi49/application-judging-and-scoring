import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";

const db = new PrismaClient();

async function main() {
  const username = process.env.SEED_ADMIN_USERNAME ?? "admin";
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password) throw new Error("SEED_ADMIN_PASSWORD belum diset di .env");

  await db.eventSetting.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, nama: "MBtech Riding With Style Awards 2026", fase: "PERSIAPAN" },
  });

  // Kriteria sesuai Rules & Regulation (poster). Hanya dibuat jika belum ada.
  if ((await db.kriteria.count()) === 0) {
    await db.kriteria.createMany({
      data: [
        { kode: "DESIGN", nama: "Kreativitas Design", deskripsi: "Design jok yang eksklusif, unik dan menarik", bobot: "30.00", urutan: 1 },
        { kode: "POLA", nama: "Kreativitas Pola & Grafis", deskripsi: "Keserasian antara pola, paduan warna dan detail grafis pada design jok", bobot: "30.00", urutan: 2 },
        { kode: "KERJA", nama: "Kualitas Pengerjaan", deskripsi: "Kerapihan dalam aspek jahitan dan pemasangan", bobot: "20.00", urutan: 3 },
        { kode: "NYAMAN", nama: "Kenyamanan & Penampilan", deskripsi: "Aspek kenyamanan jok saat diduduki serta penampilannya", bobot: "20.00", urutan: 4 },
      ],
    });
  }

  const existing = await db.user.findUnique({ where: { username } });
  if (!existing) {
    await db.user.create({
      data: { username, passwordHash: await hash(password), role: "ADMIN", mustChangePassword: true },
    });
    console.log(`Admin dibuat: ${username} (wajib ganti password saat login pertama)`);
  } else {
    console.log(`Admin "${username}" sudah ada, dilewati.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

