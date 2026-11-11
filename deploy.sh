#!/usr/bin/env bash
set -e

# Warna terminal
GREEN='\033[0;32m'
GOLD='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GOLD}======================================================${NC}"
echo -e "${GOLD}  MBtech RWSA 2026 - VPS 1-Click Deployment Script   ${NC}"
echo -e "${GOLD}======================================================${NC}"

# 1. Periksa Node.js
if ! command -v node >/dev/null 2>&1; then
  echo -e "${RED}❌ Error: Node.js belum terpasang.${NC}"
  echo "Harap pasang Node.js v20+ terlebih dahulu (misal: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs)"
  exit 1
fi
echo -e "${GREEN}✔ Node.js terdeteksi:${NC} $(node -v)"
echo -e "${GREEN}✔ npm terdeteksi:${NC} $(npm -v)"

# 2. Siapkan file konfigurasi .env
if [ ! -f .env ]; then
  if [ -f .env.production ]; then
    echo -e "${GOLD}📄 Menyalin template .env.production ke .env...${NC}"
    cp .env.production .env
    echo -e "${GOLD}⚠️ Catatan: Silakan sesuaikan user/password database pada file .env jika berbeda.${NC}"
  else
    echo -e "${RED}❌ File .env atau .env.production tidak ditemukan!${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}✔ File .env ditemukan.${NC}"
fi

# 3. Buat folder penyimpanan jika belum ada
mkdir -p storage/uploads storage/backups
chmod -R 755 storage

# 4. Install dependensi
echo -e "${GOLD}📦 Menginstal dependensi NPM...${NC}"
npm install --legacy-peer-deps

# 5. Generate Prisma Client untuk arsitektur OS saat ini
echo -e "${GOLD}⚙️ Menyiapkan Prisma Client...${NC}"
npx prisma generate

# 6. Migrasi database / Deployment schema
echo -e "${GOLD}🗄️ Menjalankan migrasi database...${NC}"
if [ -f db_rwsa.sql ]; then
  echo -e "${GREEN}✔ Template database awal tersedia (db_rwsa.sql).${NC}"
fi
npx prisma migrate deploy || echo "Catatan migrasi dilewati atau sudah mutakhir."

# 7. Build aplikasi Next.js (Production Build)
echo -e "${GOLD}🔨 Membangun aplikasi Next.js (Build Produksi)...${NC}"
npm run build

echo ""
echo -e "${GREEN}======================================================${NC}"
echo -e "${GREEN}✔ DEPLOYMENT PRODUKSI BERHASIL!                       ${NC}"
echo -e "${GREEN}======================================================${NC}"
echo ""
echo -e "Pilihan cara menjalankan aplikasi di VPS:"
echo -e "1. ${GOLD}Menggunakan PM2 (Sangat Direkomendasikan di VPS):${NC}"
echo -e "   pm2 start ecosystem.config.cjs"
echo -e "   pm2 save && pm2 startup"
echo ""
echo -e "2. ${GOLD}Menggunakan script start bawaan:${NC}"
echo -e "   chmod +x start-vps.sh && ./start-vps.sh"
echo ""
echo -e "3. ${GOLD}Langsung di foreground (terminal):${NC}"
echo -e "   npm run start"
echo ""
