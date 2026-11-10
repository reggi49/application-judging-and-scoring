# Aplikasi Penjurian MBtech Riding With Style Awards (RWSA) 2026

Aplikasi penjurian berbasis Web App & Progressive Web App (PWA) yang dirancang khusus untuk smartphone dan tablet dewan juri serta dashboard admin pada ajang modifikasi jok motor **MBtech Riding With Style Awards 2026**.

Sistem menerapkan perhitungan nilai presisi berbasis aritmetika bilangan bulat (bebas galat floating-point), backup berlapis, draft lokal offline-resilient via IndexedDB, dan live ranking otomatis.

---

## 🚀 Fitur Utama

1. **Portal Dewan Juri (PWA Mobile-First)**
   - UI adaptif untuk layar smartphone (portrait) dan tablet (landscape 2 kolom).
   - Touch target minimal 44px, keyboard numerik otomatis (`inputmode="numeric"`), tanpa risiko salah ketik.
   - Galeri foto resolusi tinggi dengan swipe snap, thumbnail cepat, dan pinch/lightbox zoom.
   - **Autosave Draft Lokal (IndexedDB)**: Nilai otomatis aman di memori perangkat bahkan jika baterai habis atau browser tertutup.
   - **Sinkronisasi Otomatis**: Draft dikirim ke server via retry & backoff eksponensial.
   - **Konfirmasi Final**: Ringkasan skor & konfirmasi sebelum nilai dikunci. Nilai final wajib terverifikasi oleh server (hanya saat online).

2. **Perhitungan Nilai Presisi & Baku**
   - Sesuai poster *Rules & Regulation*:
     - **Kreativitas Design**: Bobot 30%
     - **Kreativitas Pola & Grafis**: Bobot 30%
     - **Kualitas Pengerjaan**: Bobot 20%
     - **Kenyamanan & Penampilan**: Bobot 20%
   - Skala nilai: **0 – 100** (dijaga oleh `CHECK constraint` di database MySQL).
   - **Dua Hasil Akhir Ditampilkan**:
     - **Total**: Jumlah skor seluruh juri.
     - **Rata-rata**: Skor total dibagi jumlah juri final ($S_{akhir} = \text{Total} \div J$). Skala tetap 0–100 dan independen dari jumlah juri.
   - Peringkat disusun berdasarkan **Rata-rata**, dengan tie-breaker terurut bobot kriteria terbesar bila terjadi seri nilai.

3. **Dashboard Admin & Ranking Live**
   - **Live Ranking**: Update polling otomatis tiap 12 detik tanpa overload websocket.
   - Pemisahan transparan: *Peringkat Resmi* (karya yang 100% juri selesai) vs *Sedang Berjalan* (belum lengkap).
   - Monitor progres live tiap dewan juri (berapa karya selesai, draft berjalan, dan belum dinilai).
   - Manajemen Peserta & Form Submit Karya dengan format ID otomatis unik: `[AKRONIM_PESERTA]-[AKRONIM_KARYA]-[NO_URUT]`.
   - Unggah hingga 5 foto per karya dengan konversi otomatis WebP, pembuatan thumbnail, dan strip metadata EXIF/GPS.
   - **Fallback Input Nilai**: Admin dapat menginput nilai atas nama juri bila terjadi kendala hardware juri di lokasi (transparan tercatat di audit log).
   - **Backup Otomatis & Manual**: Snapshot database MySQL (.sql.gz) dan arsip foto (.tar.gz) satu klik serta unduh arsip langsung.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript + React 19
- **Styling**: Tailwind CSS v4 (Tema *Black & Gold* elegan sesuai identitas poster MBtech RWSA)
- **Database & ORM**: MySQL 8 / 9 + Prisma ORM (dengan CHECK constraint level DB)
- **Local Storage / PWA**: Dexie.js (IndexedDB) + Serwist Service Worker + Web App Manifest
- **Pemrosesan Gambar**: `sharp` (WebP 82% quality, thumbnail 480px)
- **Autentikasi**: Argon2id password hashing + HTTP-only cookies session + RBAC Admin/Juri
- **Pengujian**: Vitest (Unit test skor, tie-breaker, format ID)

---

## ⚙️ Cara Menjalankan

### 1. Prasyarat
- Node.js v20+
- MySQL 8.0+ atau 9.x running (default port `3307` pada setup lokal proyek)

### 2. Konfigurasi Environment (`.env`)
```ini
DATABASE_URL="mysql://judging:judging_dev_pw@127.0.0.1:3307/judging"
SHADOW_DATABASE_URL="mysql://judging:judging_dev_pw@127.0.0.1:3307/judging_shadow"
STORAGE_DIR="./storage"
BACKUP_DIR="./storage/backups"
SEED_ADMIN_USERNAME="admin"
SEED_ADMIN_PASSWORD="Admin#RWSA2026"
```

### 3. Migrasi & Seed Database
```bash
# Migrasi skema database
npx prisma migrate dev

# Seed admin awal & kriteria resmi poster
npm run db:seed

# (Opsional) Seed data simulasi lengkap (3 juri, 3 peserta, 5 karya dengan foto contoh)
npm run db:demo
```

### 4. Menjalankan Aplikasi
```bash
# Mode Development
npm run dev

# Atau Build & Start Mode Produksi
npm run build
npm run start
```
Buka browser di `http://localhost:3000`.

---

## 🔑 Akun Bawaan (Hasil Seed)

| Role | Username | Password Awal | Catatan |
|---|---|---|---|
| **Admin** | `admin` | `Admin#RWSA2026` | Wajib ganti password pada login pertama |
| **Juri 1** | `j01` | `Juri#2026` | Juri Satu |
| **Juri 2** | `j02` | `Juri#2026` | Juri Dua |
| **Juri 3** | `j03` | `Juri#2026` | Juri Tiga |

---

## 🧪 Pengujian Unit (Vitest)

Menjalankan pengujian kalkulasi skor dan pemeringkatan:
```bash
npm run test
```
Menguji 23 skenario:
- Validasi total bobot 100%
- Presisi pembobotan (contoh poster 80/90/70/60 menghasilkan tepat 77,00)
- Netralitas jumlah juri pada skala skor akhir
- Tie-breaker berurutan berdasarkan kriteria bobot terbesar
- Format ID karya unik (BRM-CLS-001)

---

## 💾 Perintah Backup Data

```bash
# Jalankan backup manual instan melalui terminal
npm run backup
```
Berkas backup akan tersimpan di `./storage/backups/`:
- `rwsa-[timestamp]-[tag].sql.gz`
- `rwsa-[timestamp]-[tag].uploads.tar.gz`

Backup juga dapat dibuat dan diunduh langsung oleh Admin melalui menu **Backup & Audit** di portal admin.
