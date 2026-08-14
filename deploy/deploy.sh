#!/usr/bin/env bash
# Update the Audio Guest Book deployment on the Ubuntu server.
#
#   cd /var/www/html/nader && ./deploy/deploy.sh
#
# Pulls latest code, installs deps (including socket.io), rebuilds the
# frontend with VITE_API_URL baked in, and restarts both PM2 processes.

set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/html/nader}"
cd "$APP_DIR"

echo "==> Pulling latest code"
git pull --ff-only

echo "==> Checking env files exist (they are gitignored, so never pulled)"
for f in .env.production backend/.env.production; do
  if [ ! -f "$f" ]; then
    echo "MISSING: $f — copy it from ${f}.example and fill it in." >&2
    exit 1
  fi
done

echo "==> Installing dependencies"
npm install
npm --prefix backend install

echo "==> Building frontend (uses .env.production -> VITE_API_URL)"
npm run build

echo "==> Verifying the API URL was baked into the bundle"
if ! grep -q "api.mouadhattia.xyz" dist/index.html; then
  echo "WARNING: dist/index.html has no api.mouadhattia.xyz — check .env.production" >&2
fi

echo "==> Verifying socket.io client made it into the bundle"
if ! grep -q "remote:start_recording" dist/index.html; then
  echo "WARNING: socket.io client missing from bundle — the Pi button will not work" >&2
fi

echo "==> Restarting PM2 processes"
pm2 startOrReload ecosystem.config.cjs
pm2 save

echo "==> Done. Local health check:"
curl -sS "http://127.0.0.1:6321/health"; echo
