# 🚀 Panduan Deploy Aplikasi Penjurian RWSA 2026 ke VPS

Paket ini telah disiapkan agar dapat langsung diunggah ke VPS Linux (Ubuntu, Debian, AlmaLinux, CentOS, atau aaPanel) dengan konfigurasi minimal.

---

## 📁 Isi Paket Arsip
1. `docker-compose.yml` & `Dockerfile` — Setup Docker otomatis (Web + Database MariaDB 10.11).
2. `db_rwsa.sql` — Dump database awal lengkap (kriteria 30%/30%/20%/20%, profil dewan juri, akun admin, karya contoh).
3. `deploy.sh` — Skrip instalasi & build otomatis 1-klik untuk server berbasis Node.js.
4. `start-vps.sh` — Skrip runner produksi.
5. `ecosystem.config.cjs` — Konfigurasi PM2 Process Manager.
6. `.env.production` — Template konfigurasi environment produksi.
7. `storage/uploads/` — Folder aset foto jok motor contoh siap pakai.

---

## ⚡ METODE 1: Menggunakan Docker (Rekomendasi Utama - 1 Klik)

Metode ini paling mudah karena **tidak perlu menginstall Node.js atau MySQL** secara manual di VPS.

### Langkah-langkah:
1. Upload file zip ke VPS dan ekstrak:
   ```bash
   unzip rwsa-judging-vps.zip -d rwsa-judging
   cd rwsa-judging
   ```

2. Jalankan satu perintah Docker Compose:
   ```bash
   docker compose up -d
   ```

3. **Selesai!** 
   - Database MariaDB otomatis aktif dan mengimpor file `db_rwsa.sql`.
   - Web App Next.js otomatis di-build dan berjalan di port `3000`.
   - Akses aplikasi di browser: `http://IP_VPS_ANDA:3000`.

---

## 🛠️ METODE 2: Menggunakan Node.js + PM2 (Direct VPS / aaPanel)

Gunakan metode ini jika VPS Anda sudah terpasang Node.js (v20+) dan MySQL / MariaDB (misalnya via aaPanel, cPanel, atau LAMP stack).

### Langkah-langkah:
1. Upload dan ekstrak file zip di folder web Anda (misal `/www/wwwroot/rwsa` atau `/var/www/rwsa`).
2. Masuk ke direktori:
   ```bash
   cd /var/www/rwsa
   ```

3. Buat database di MySQL VPS Anda (misalnya nama database: `judging`), lalu impor data awal:
   ```bash
   mysql -u root -p judging < db_rwsa.sql
   ```

4. Sesuaikan file `.env` dengan user & password database Anda:
   ```bash
   cp .env.production .env
   nano .env
   ```
   *(Ubah nilai `DATABASE_URL="mysql://USER:PASSWORD@127.0.0.1:3306/judging"` sesuai kredensial Anda)*.

5. Jalankan skrip deploy 1-klik:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

6. Jalankan proses di background dengan PM2:
   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup
   ```

---

## 🌐 Konfigurasi Nginx Reverse Proxy & Domain (SSL)

Agar aplikasi dapat diakses melalui domain (misal: `https://juri.mbtech.info`) dengan sertifikat HTTPS SSL:

### Contoh Blok Nginx (`/etc/nginx/sites-available/rwsa`):
```nginx
server {
    server_name juri.mbtech.info; # Ganti dengan domain Anda

    client_max_body_size 25M; # Diperlukan untuk upload foto karya juri

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Aktifkan SSL gratis menggunakan Certbot:
```bash
sudo certbot --nginx -d juri.mbtech.info
```

---

## 🔑 Informasi Login Bawaan

- **Dashboard Administrator**:
  - Halaman: `/login`
  - Username: `admin`
  - Password: `MBtech123`

- **Dewan Juri**:
  - Halaman: `/login`
  - Akses: **Tanpa Password** — cukup pilih profil Dewan Juri (J01 / J02 / J03) dari layar sentuh smartphone.

---

## 📱 PWA & Pemasangan di Smartphone
Aplikasi ini sudah mendukung **PWA Standalone**:
- Saat dibuka melalui Android (Chrome), akan muncul tombol emas **"Pasang Aplikasi di HP (1-Klik)"**.
- Saat dibuka melalui iPhone (Safari), tekan tombol **Share (⬆)** lalu pilih **"Add to Home Screen"**.
