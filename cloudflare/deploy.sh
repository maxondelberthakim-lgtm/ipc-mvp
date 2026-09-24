#!/bin/bash
# Deploy IPC API ke Cloudflare (paket gratis). Jalankan di Terminal Mac:
#   cd "$HOME/Claude Co Work/ipc-cloudflare" && bash deploy.sh
# Tidak butuh instal apa pun: kalau Node.js belum ada, diunduh ke folder ini (node-local/).
set -e
cd "$(dirname "$0")"
export PATH="$PWD/node-local/bin:$HOME/homebrew/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -c2-3)" -lt 18 ]; then
  echo "== Node.js belum ada → unduh Node 22 portabel (±50 MB) ke node-local/"
  ARCH=$(uname -m); [ "$ARCH" = "arm64" ] && NA=darwin-arm64 || NA=darwin-x64
  curl -fL "https://nodejs.org/dist/v22.12.0/node-v22.12.0-$NA.tar.gz" -o node.tgz
  rm -rf node-local && mkdir node-local && tar -xzf node.tgz -C node-local --strip-components=1 && rm node.tgz
fi
echo "== 1/5 Node $(node -v) & dependensi"; npm install --no-fund --no-audit
echo "== 2/5 Login Cloudflare (browser terbuka → klik Allow)"
npx wrangler whoami >/dev/null 2>&1 || npx wrangler login
echo "== 3/5 Deploy Worker + Durable Object + KV + cron"; npx wrangler deploy
echo "== 4/5 Kunci admin (dipakai untuk impor/ekspor/reset lewat /admin/*)"
if [ -f ADMIN_KEY.txt ]; then KEY=$(cat ADMIN_KEY.txt); else KEY=$(openssl rand -hex 20); echo "$KEY" > ADMIN_KEY.txt; fi
echo "$KEY" | npx wrangler secret put ADMIN_KEY
echo "   kunci tersimpan di ADMIN_KEY.txt (jangan dibagikan / di-commit)"
URL=$(cat workers-dev-url.txt)
echo "== 5/5 Impor data Google Sheet (ipc-live.json) → $URL"
sleep 5; curl -sS "$URL/ping"; echo
if [ -f ipc-live.json ] && [ ! -f .sudah-impor ]; then
  curl -sS -X POST "$URL/admin/impor" -H "X-Admin-Key: $KEY" --data-binary @ipc-live.json && touch .sudah-impor; echo
fi
curl -sS -X POST "$URL/admin/info" -H "X-Admin-Key: $KEY"; echo
echo; echo "SELESAI. API: $URL/exec — kirim tampilan Terminal ini ke Claude."
