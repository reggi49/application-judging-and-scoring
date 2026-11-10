const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");

const prisma = new PrismaClient();

const PARTICIPANTS_DATA = [
  { kodePeserta: "BRM", nama: "Bram Upholstery", deskripsi: "Spesialis jok kulit custom retro & vintage Surabaya" },
  { kodePeserta: "SKR", nama: "Sakura Seat Works", deskripsi: "Bengkel jok spesialis racing & carbon look Bandung" },
  { kodePeserta: "NRT", nama: "Narita Custom Jok", deskripsi: "Artisan jok custom touring & big scooter Jakarta" },
  { kodePeserta: "VTR", nama: "Vector Leather Lab", deskripsi: "Spesialis laser cut & embroidery jok motor Bekasi" },
  { kodePeserta: "KNG", nama: "King Jok Indonesia", deskripsi: "Master jok kontes & custom chopper Semarang" },
  { kodePeserta: "GMX", nama: "Gemilang Motor Seat", deskripsi: "Custom jok harian & kontes premium Yogyakarta" },
  { kodePeserta: "MRT", nama: "Monster Jok Modif", deskripsi: "Spesialis jok racing harian & kontes Malang" },
  { kodePeserta: "RST", nama: "Retro Style Upholstery", deskripsi: "Spesialis bahan MBtech Carrera & Giorgio Bali" },
  { kodePeserta: "PRM", nama: "Prima Jok Modifikasi", deskripsi: "Bengkel jok custom elegan Solo" },
  { kodePeserta: "SNT", nama: "Sentosa Leather Art", deskripsi: "Artisan jok motor klasik & custom Tangerang" },
  { kodePeserta: "MTR", nama: "Maestro Custom Seat", deskripsi: "Desain jok futuristic & premium Medan" },
  { kodePeserta: "DND", nama: "Dinda Leather Craft", deskripsi: "Jok custom jahitan ganda & piping Palembang" },
  { kodePeserta: "WJY", nama: "Wijaya Upholstery", deskripsi: "Spesialis jok matic besar & touring Makassar" },
  { kodePeserta: "ART", nama: "Artisan Jok Studio", deskripsi: "Studio jok motor modern minimalis Depok" },
  { kodePeserta: "GTR", nama: "Guntur Custom Seat", deskripsi: "Jok custom bergaya cafe racer & tracker Bogor" },
  { kodePeserta: "BLZ", nama: "Blaze Seat Maker", deskripsi: "Pengerjaan jok detail tinggi MBtech Superior Pontianak" },
  { kodePeserta: "APX", nama: "Apex Motor Craft", deskripsi: "Spesialis jok sporty & agresif Balikpapan" },
  { kodePeserta: "OAS", nama: "Oasis Leather Workshop", deskripsi: "Desain jok elegan mewah MBtech Camaro Pekanbaru" },
  { kodePeserta: "VRT", nama: "Vertigo Seat Design", deskripsi: "Pola grafis 3D & diamond cut Banjarmasin" },
  { kodePeserta: "GLD", nama: "Golden Stitch", deskripsi: "Spesialis jahitan emas & kombi warna Bandar Lampung" },
];

const WORK_TEMPLATES = [
  { akronim: "CLS", nama: "Classic Heritage", desc: "Konsep jok retro elegan motif tuck & roll bahan MBtech Camaro" },
  { akronim: "SPT", nama: "Sport Carbon", desc: "Desain jok aerodinamis dengan aksen carbon fiber dan piping merah" },
  { akronim: "VNT", nama: "Vintage Brown", desc: "Gaya klasik eropa warna saddle brown dengan diamond quilting presisi" },
  { akronim: "GLD", nama: "Elegance Gold", desc: "Kombinasi hitam pekat dan jahitan benang emas MBtech Giorgio" },
  { akronim: "RCR", nama: "Cafe Racer", desc: "Buntut hornet klasik dengan busa berkontur tegas & kulit perforated" },
  { akronim: "BBR", nama: "Bobber Minimalist", desc: "Jok single seat ramping motif garis horizontal gaya american bobber" },
  { akronim: "TRG", nama: "Touring Comfort", desc: "Busa bertingkat dengan lumbar support tebal untuk kenyamanan jarak jauh" },
  { akronim: "STH", nama: "Stealth Shadow", desc: "Monokrom all-black perpaduan MBtech Superior dan Carrera matte" },
  { akronim: "CYB", nama: "Cyberpunk Neon", desc: "Aksen grafis tajam geometris dengan highlight warna terang berani" },
  { akronim: "PRD", nama: "Predator Aggressive", desc: "Garis tajam gaya streetfighter dengan emboss logo kontras" },
  { akronim: "ROY", nama: "Royal Diamond", desc: "Pola wajik ganda berpadu piping krem untuk motor matic maxi premium" },
  { akronim: "URB", nama: "Urban Commuter", desc: "Desain ramping ergonomis tahan cuaca untuk penggunaan aktif harian" },
  { akronim: "VLV", nama: "Red Velvet", desc: "Nuansa burgundy elegan kombinasi hitam dengan detail jahitan Prancis" },
  { akronim: "MID", nama: "Midnight Navy", desc: "Warna biru gelap MBtech Giorgio dengan aksen benang perak kontras" },
  { akronim: "SAM", nama: "Samurai Katana", desc: "Garis lengkung aerodinamis terinspirasi pedang katana Jepang" },
];

async function main() {
  console.log("=== MEMULAI SIMULASI 100 KARYA RWSA 2026 ===");
  const startTime = Date.now();

  // 1. Pastikan seluruh peserta terdaftar
  const pesertaMap = new Map();
  for (const p of PARTICIPANTS_DATA) {
    const record = await prisma.peserta.upsert({
      where: { kodePeserta: p.kodePeserta },
      update: { nama: p.nama, deskripsi: p.deskripsi },
      create: p,
    });
    pesertaMap.set(p.kodePeserta, record);
  }
  const pesertaList = Array.from(pesertaMap.values());
  console.log(`✓ ${pesertaList.length} Peserta (Bengkel Custom) aktif`);

  // 2. Ambil foto yang ada untuk dipakai sebagai sample gambar karya
  const existingFoto = await prisma.karyaGambar.findMany({ take: 5, select: { id: true } });
  const sampleFotoId = existingFoto[0]?.id || null;

  // 3. Hitung berapa karya yang sudah ada
  const currentKaryaCount = await prisma.karya.count();
  const needed = 100 - currentKaryaCount;
  console.log(`Status saat ini: ${currentKaryaCount} karya. Menambahkan ${needed > 0 ? needed : 0} karya lagi hingga total 100...`);

  if (needed > 0) {
    let created = 0;
    while (created < needed) {
      // Pilih peserta secara acak/merata
      const peserta = pesertaList[(currentKaryaCount + created) % pesertaList.length];
      const tmpl = WORK_TEMPLATES[(currentKaryaCount + created) % WORK_TEMPLATES.length];

      // Cari nomor urut berikutnya untuk peserta ini
      const lastKarya = await prisma.karya.findFirst({
        where: { pesertaId: peserta.id },
        orderBy: { noUrut: "desc" },
        select: { noUrut: true },
      });
      const noUrut = (lastKarya?.noUrut || 0) + 1;
      const noUrutStr = String(noUrut).padStart(3, "0");
      const kodeKarya = `${peserta.kodePeserta}-${tmpl.akronim}-${noUrutStr}`;

      const variationNum = Math.floor(created / WORK_TEMPLATES.length) + 1;
      const namaKarya = variationNum > 1 ? `${tmpl.nama} Mk-${variationNum}` : tmpl.nama;

      await prisma.karya.create({
        data: {
          pesertaId: peserta.id,
          akronimKarya: tmpl.akronim,
          noUrut,
          kodeKarya,
          namaKarya,
          deskripsi: tmpl.desc,
        },
      });
      created++;
    }
  }

  const allKarya = await prisma.karya.findMany({
    where: { deletedAt: null },
    orderBy: { id: "asc" },
  });
  console.log(`✓ Total Karya saat ini: ${allKarya.length} karya motor`);

  // 4. Simulasi Penilaian Juri
  const judges = await prisma.juri.findMany({ where: { isActive: true }, orderBy: { id: "asc" } });
  const kriteria = await prisma.kriteria.findMany({ orderBy: { urutan: "asc" } });

  console.log("Menghasilkan penilaian juri realistis...");
  let finalCompleteCount = 0;
  let partialCount = 0;
  let unjudgedCount = 0;

  for (let i = 0; i < allKarya.length; i++) {
    const karya = allKarya[i];

    // Distribusi realistis:
    // - 0 s/d 64 (65% karya) = dinilai lengkap oleh KETIGA juri (Status FINAL) -> masuk Peringkat Resmi
    // - 65 s/d 84 (20% karya) = dinilai oleh 1 atau 2 juri -> masuk Sedang Berjalan (Belum Lengkap)
    // - 85 s/d 99 (15% karya) = belum dinilai sama sekali -> masuk Belum Dinilai
    let judgesForThisKarya = [];
    if (i < 65) {
      judgesForThisKarya = judges; // J01, J02, J03
      finalCompleteCount++;
    } else if (i < 85) {
      // 1 atau 2 juri
      const count = (i % 2) + 1;
      judgesForThisKarya = judges.slice(0, count);
      partialCount++;
    } else {
      unjudgedCount++;
      continue;
    }

    // Skor dasar karya (65 - 95 poin), beberapa karya unggulan 96-98
    const baseScore = i < 3 ? 94 + i : i < 10 ? 88 + (i % 6) : 65 + (i * 7) % 28;

    for (const juri of judgesForThisKarya) {
      // Variasi kecil tiap juri (±3 poin)
      const juriOffset = (juri.id === 1 ? 0 : juri.id === 2 ? 2 : -2) + (i % 3);

      // Hitung nilai per kriteria (skala loncat 5)
      const rawScores = {};
      let totalWeightedBp = 0;

      for (const k of kriteria) {
        const bobotPct = Number(k.bobot);
        const bobotBp = bobotPct * 100;
        let score = baseScore + juriOffset + (k.urutan % 2 === 0 ? 3 : -2);
        // Bulatkan ke kelipatan 5 untuk kepuasan stepper
        score = Math.round(score / 5) * 5;
        score = Math.min(100, Math.max(0, score));

        rawScores[k.id] = score;
        totalWeightedBp += score * bobotBp;
      }

      const skorJuri = (totalWeightedBp / 10000).toFixed(4);

      // Upsert penilaian
      const penilaian = await prisma.penilaian.upsert({
        where: {
          juriId_karyaId: {
            juriId: juri.id,
            karyaId: karya.id,
          },
        },
        update: {
          status: "FINAL",
          skorJuri,
          inputOleh: "JURI",
          catatan: i < 5 ? `Karya ${karya.namaKarya} sangat berkarakter, kerapian jahitan prima.` : null,
          finalizedAt: new Date(),
        },
        create: {
          juriId: juri.id,
          karyaId: karya.id,
          status: "FINAL",
          clientUuid: randomUUID(),
          skorJuri,
          inputOleh: "JURI",
          catatan: i < 5 ? `Karya ${karya.namaKarya} sangat berkarakter, kerapian jahitan prima.` : null,
          finalizedAt: new Date(),
        },
      });

      // Upsert detail nilai
      for (const k of kriteria) {
        await prisma.penilaianDetail.upsert({
          where: {
            penilaianId_kriteriaId: {
              penilaianId: penilaian.id,
              kriteriaId: k.id,
            },
          },
          update: { nilai: rawScores[k.id] },
          create: {
            penilaianId: penilaian.id,
            kriteriaId: k.id,
            nilai: rawScores[k.id],
          },
        });
      }
    }
  }

  const duration = Date.now() - startTime;
  console.log("\n=== HASIL SIMULASI 100 KARYA BERHASIL DISIAPKAN ===");
  console.log(`⏱️ Waktu pembuatan simulasi: ${duration} ms`);
  console.log(`📊 Komposisi Data:`);
  console.log(`   - Total Karya: ${allKarya.length}`);
  console.log(`   - Karya Lengkap Dinilai (3/3 Juri - Peringkat Resmi): ${finalCompleteCount} karya`);
  console.log(`   - Karya Sedang Berjalan (1-2 Juri - Belum Lengkap): ${partialCount} karya`);
  console.log(`   - Karya Belum Dinilai (0 Juri): ${unjudgedCount} karya`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
