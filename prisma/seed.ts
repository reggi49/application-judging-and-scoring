import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";

const db = new PrismaClient();

const TOTAL_SLOT = 250;

async function main() {
  const username = process.env.SEED_ADMIN_USERNAME ?? "admin";
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password) throw new Error("SEED_ADMIN_PASSWORD belum diset di .env");

  // 1. Setting Event
  await db.eventSetting.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, nama: "MBtech Riding With Style Awards 2026", fase: "PENJURIAN" },
  });

  // 2. Kriteria sesuai Rules & Regulation (poster)
  if ((await db.kriteria.count()) === 0) {
    await db.kriteria.createMany({
      data: [
        { kode: "DESIGN", nama: "Kreativitas Design", deskripsi: "Design jok yang eksklusif, unik dan menarik", bobot: "30.00", urutan: 1 },
        { kode: "POLA", nama: "Kreativitas Pola & Grafis", deskripsi: "Keserasian antara pola, paduan warna dan detail grafis pada design jok", bobot: "30.00", urutan: 2 },
        { kode: "KERJA", nama: "Kualitas Pengerjaan", deskripsi: "Kerapihan dalam aspek jahitan dan pemasangan", bobot: "20.00", urutan: 3 },
        { kode: "NYAMAN", nama: "Kenyamanan & Penampilan", deskripsi: "Aspek kenyamanan jok saat diduduki serta penampilannya", bobot: "20.00", urutan: 4 },
      ],
    });
    console.log("✔ 4 Kriteria penilaian berhasil dibuat.");
  }

  // 3. Akun Administrator
  const existing = await db.user.findUnique({ where: { username } });
  if (!existing) {
    await db.user.create({
      data: { username, passwordHash: await hash(password), role: "ADMIN", mustChangePassword: true },
    });
    console.log(`✔ Admin dibuat: ${username}`);
  }

  // 4. Dewan Juri Resmi (J01, J02, J03)
  const defaultJuriPw = await hash("Juri#RWSA2026");
  const juriList = [
    { kode: "J01", nama: "Juri Satu" },
    { kode: "J02", nama: "Juri Dua" },
    { kode: "J03", nama: "Juri Tiga" },
  ];
  for (const item of juriList) {
    const existingJuri = await db.juri.findUnique({ where: { kodeJuri: item.kode } });
    if (!existingJuri) {
      let u = await db.user.findUnique({ where: { username: item.kode.toLowerCase() } });
      if (!u) {
        u = await db.user.create({
          data: { username: item.kode.toLowerCase(), passwordHash: defaultJuriPw, role: "JURI" },
        });
      }
      await db.juri.create({
        data: { kodeJuri: item.kode, nama: item.nama, userId: u.id },
      });
      console.log(`✔ Dewan Juri dibuat: ${item.nama} (${item.kode})`);
    }
  }

  // 5. Generate 250 Nomor Peserta & Slot Karya Kosong (001 - 250)
  console.log(`Menyiapkan ${TOTAL_SLOT} nomor slot peserta (001 - ${String(TOTAL_SLOT).padStart(3, "0")})...`);
  let createdCount = 0;

  for (let i = 1; i <= TOTAL_SLOT; i++) {
    const nomorStr = String(i).padStart(3, "0"); // "001", "002", ..., "250"

    // Pastikan Peserta ada
    let peserta = await db.peserta.findUnique({ where: { kodePeserta: nomorStr } });
    if (!peserta) {
      peserta = await db.peserta.create({
        data: {
          kodePeserta: nomorStr,
          nama: `Peserta #${nomorStr}`,
          karyaCounter: 1,
        },
      });
    }

    // Pastikan Karya ada untuk nomor tersebut
    const existingKarya = await db.karya.findUnique({ where: { kodeKarya: nomorStr } });
    if (!existingKarya) {
      await db.karya.create({
        data: {
          pesertaId: peserta.id,
          akronimKarya: "RW",
          noUrut: 1,
          kodeKarya: nomorStr,
          namaKarya: `Nomor ${nomorStr}`,
          deskripsi: null, // Kosong, akan diisi juri di lapangan
        },
      });
      createdCount++;
    }
  }

  console.log(`✔ Selesai! ${createdCount} nomor karya baru telah disiapkan (Total: ${TOTAL_SLOT} slot).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
