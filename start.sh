#!/usr/bin/env bash
set -e

# Port default 3000 jika tidak diset di environment
export PORT="${PORT:-3000}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export NODE_ENV="production"

echo "=========================================================="
echo "  MBtech RWSA 2026 - Aplikasi Penjurian (PWA)"
echo "  Menjalankan server pada: http://${HOSTNAME}:${PORT}"
echo "=========================================================="

exec node server.js
