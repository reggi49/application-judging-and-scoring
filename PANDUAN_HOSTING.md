# 🚀 Panduan Pasang (Deploy) RWSA 2026 ke Hosting & Server

Paket ini sudah dibuild dalam mode **Next.js Standalone PWA**. Semua dependensi produksi (termasuk binary Linux & macOS untuk Prisma, Sharp, dan Argon2) sudah terintegrasi ke dalam paket, sehingga:
- **TIDAK PERLU** menjalankan `npm install` di hosting.
- **TIDAK PERLU** compiler native (GCC / Python / build-essential).
- **HEMAT RAM**: Dapat berjalan mulus di hosting/VPS 512MB – 1GB RAM.
- **PWA Siap Pakai**: Mendukung instalasi di HP (Android/iOS) dan mode offline draft.

---

## 📦 Struktur Berkas di Dalam Paket

```text
├── server.js               # Entrypoint aplikasi (Next.js Standalone Server)
├── .next/                  # Aset hasil kompilasi server & statis (CSS/JS)
├── public/                 # Ikon PWA, manifest.json, sw.js (Service Worker)
├── node_modules/           # Library produksi + engine multi-platform (Linux & macOS)
├── prisma/                 # Skema & migrasi database
├── storage/                # Folder penyimpanan upload foto karya & backup
├── db_rwsa.sql             # Dump database awal (siap diimpor)
├── .env.example            # Contoh konfigurasi environment
├── ecosystem.config.cjs    # Konfigurasi PM2 untuk cPanel / VPS
├── start.sh                # Skrip jalan cepat Linux / Mac
└── package.json            # Berkas package minimal
```

---

## 🗄️ Langkah 1: Buat & Impor Database MySQL

1. Buat database baru di cPanel / phpMyAdmin / VPS (contoh nama: `rwsa_judging`).
2. Buat user database dan berikan hak akses penuh (*ALL PRIVILEGES*) ke database tersebut.
3. **Impor Tabel & Data Awal**:
   - **Lewat phpMyAdmin**: Buka database -> menu **Import** -> pilih berkas `db_rwsa.sql` -> tekan **Go/Kirim**.
   - **Lewat Terminal SSH**:
     ```bash
     mysql -u nama_user -p rwsa_judging < db_rwsa.sql
     ```

---

## ⚙️ Langkah 2: Konfigurasi `.env`

Salin berkas `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Buka berkas `.env` lalu sesuaikan kredensial database Anda:
```ini
DATABASE_URL="mysql://nama_user:password_anda@127.0.0.1:3306/rwsa_judging"
STORAGE_DIR="./storage"
BACKUP_DIR="./storage/backups"
MYSQLDUMP_PATH="/usr/bin/mysqldump"
SEED_ADMIN_USERNAME="admin"
SEED_ADMIN_PASSWORD="MBtech123"
```
*(Ganti `nama_user`, `password_anda`, dan `rwsa_judging` sesuai database hosting Anda)*.

---

## 🌐 Opsi A: Pasang di cPanel (Menu Setup Node.js App)

Jika hosting Anda menggunakan cPanel dengan fitur **Setup Node.js App** (CloudLinux LVE):

1. Upload berkas `.zip` ke folder di luar `public_html` (misalnya folder `rwsa` di root akun hosting Anda) lalu **Ekstrak**.
2. Masuk ke cPanel -> cari dan klik menu **Setup Node.js App**.
3. Klik tombol **Create Application**:
   - **Node.js version**: Pilih versi **20.x** atau **22.x**
   - **Application mode**: Pilih **Production**
   - **Application root**: Isi nama folder hasil ekstrak (contoh: `rwsa`)
   - **Application URL**: Pilih domain atau subdomain Anda (misal `juri.event-anda.com`)
   - **Application startup file**: Ketik `server.js`
4. Di bagian **Environment variables**, tambahkan variabel jika ingin mengeset langsung dari cPanel, atau biarkan membaca file `.env` di dalam folder.
5. Klik **Create** lalu klik **Start Application**.
6. Selesai! Buka subdomain/domain Anda di browser.

---

## 🖥️ Opsi B: Pasang di VPS (Ubuntu / Debian / AlmaLinux / CentOS)

1. Upload berkas `.zip` ke VPS, lalu ekstrak:
   ```bash
   mkdir -p /var/www/rwsa && cd /var/www/rwsa
   unzip /path/ke/rwsa-judging-pwa-deploy.zip
   ```
2. Pastikan izin folder penyimpanan aktif:
   ```bash
   chmod -R 775 storage
   ```
3. Sesuaikan `.env` seperti pada Langkah 2.
4. **Jalankan dengan PM2 (Rekomendasi)**:
   ```bash
   npm install -g pm2 # (jika belum ada)
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup
   ```
   *(Aplikasi akan otomatis restart jika server reboot)*.
5. **Konfigurasi Nginx Reverse Proxy (SSL/HTTPS)**:
   ```nginx
   server {
       server_name juri.domainanda.com;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
           client_max_body_size 20M;
       }
   }
   ```
   Pasang SSL gratis Certbot:
   ```bash
   certbot --nginx -d juri.domainanda.com
   ```

---

## 📱 Panduan PWA (Penggunaan oleh Dewan Juri di HP)

Aplikasi ini sudah berstandar PWA (Progressive Web App):
1. **Penting**: Pastikan domain sudah menggunakan **HTTPS (SSL)** agar fitur PWA dan Service Worker diizinkan oleh browser HP.
2. Ketika Dewan Juri membuka web di smartphone:
   - Muncul tombol **"📲 Pasang Aplikasi di HP (1-Klik)"** di layar login.
   - Di Android (Chrome): Cukup tekan tombol tersebut atau menu titik 3 -> "Install App / Tambahkan ke Layar Utama".
   - Di iOS (Safari iPhone/iPad): Tekan tombol Share (⬆) -> "Tambah ke Layar Utama" (*Add to Home Screen*).
3. Setelah terpasang, ikon aplikasi **RWSA 2026** akan muncul di layar utama smartphone dengan tampilan layar penuh (tanpa bilah URL browser), responsif kilat, dan draft nilai tersimpan aman di IndexedDB perangkat bahkan jika koneksi internet terputus.

---

## 🔑 Akun Default (Admin & Juri)

- **Admin Login**:
  - URL: `https://domain-anda.com/login`
  - Username: `admin`
  - Password: `MBtech123`
- **Juri Login**:
  - Juri cukup memilih profilnya di halaman awal (tanpa password untuk kemudahan saat di lapangan).
