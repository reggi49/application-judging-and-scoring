#!/usr/bin/env bash
set -e

# Muat .env terlebih dahulu jika ada
set -a
[ -f .env ] && . ./.env
set +a

# Pastikan folder storage ada
mkdir -p storage/uploads storage/backups

export NODE_ENV=production
export PORT="${PORT:-3001}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
echo "Menjalankan aplikasi pada port ${PORT}..."

npm run start -- -H 0.0.0.0 -p "${PORT}"
