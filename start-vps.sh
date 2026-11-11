#!/usr/bin/env bash
set -e

# Pastikan folder storage ada
mkdir -p storage/uploads storage/backups

echo "Menjalankan aplikasi RWSA 2026 di port 3000..."
export NODE_ENV=production
export PORT=3000
export HOSTNAME="0.0.0.0"

npm run start -- -H 0.0.0.0 -p 3000
