#!/bin/bash
# Lingkungan TEST H-Plast: backend "ipc-api-test" (database sendiri, kosong + master contoh)
# + frontend cabang Pages "test" → https://test.h-plast.pages.dev
# Klik dua kali di Finder. Tidak menyentuh data asli (ipc-api / h-plast.pages.dev).
cd "$HOME/Claude Co Work/ipc-cloudflare"
export PATH="$PWD/node-local/bin:$HOME/homebrew/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
URL="https://ipc-api-test.maxondelberthakim.workers.dev"
echo "== 1/4 Deploy Worker TEST (ipc-api-test)"
npx wrangler deploy --config wrangler-test.jsonc || { echo "GAGAL deploy worker test"; exit 1; }
echo "== 2/4 Kunci admin untuk Worker TEST"
if [ -f .test-kunci ]; then echo "   sudah terpasang — dilewati"; else
  cat ADMIN_KEY.txt | npx wrangler secret put ADMIN_KEY --config wrangler-test.jsonc >/dev/null && touch .test-kunci && echo "   terpasang"; fi
echo "== 3/4 Cek API TEST"
sleep 4; curl -sS "$URL/ping"; echo
curl -sS -X POST "$URL/admin/info" -H "X-Admin-Key: $(cat ADMIN_KEY.txt)" | head -c 300; echo
echo "== 4/4 Upload app-test/ ke Pages cabang test"
npx wrangler pages deploy app-test --project-name h-plast --commit-dirty=true --branch test \
  && echo && echo "SELESAI → https://test.h-plast.pages.dev  (API: $URL/exec)"
echo; echo "=== kirim tampilan jendela ini ke Claude; jendela boleh ditutup ==="
