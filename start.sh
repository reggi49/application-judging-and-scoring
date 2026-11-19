#!/usr/bin/env bash
set -e

# Muat .env terlebih dahulu jika ada
set -a
[ -f .env ] && . ./.env
set +a

# Port default 3001 jika tidak diset di .env / environment
export PORT="${PORT:-3001}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export NODE_ENV="production"

echo "=========================================================="
echo "  Judging & Scoring App (PWA)"
echo "  Menjalankan server pada: http://${HOSTNAME}:${PORT}"
echo "=========================================================="

exec node server.js

