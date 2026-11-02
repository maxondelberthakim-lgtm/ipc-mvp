# End-to-end (browser) tests — Playwright

Moved here 2 Nov 2026 from the cloud sandbox so they are versioned. Paths inside are still the sandbox's
(`/home/claude/...`, `/tmp/claude-0/...`, Chromium at `/opt/pw-browsers/...`): adapt them to the local machine before running.

How they ran (sandbox):
1. Build the app: `python3 tools/build-app.py`, then make a local copy that talks to the local worker:
   `sed 's#https://ipc-api.maxondelberthakim.workers.dev/exec#http://127.0.0.1:8787/exec#g' docs/app/index.html > <pwa-dir>/index.html`
   (plus icons + manifest from docs/app).
2. `run-e2e.sh`: serves <pwa-dir> on :8090, starts `npx wrangler dev --port 8787 --local` in `cloudflare/` (fresh `.wrangler/state`),
   then runs `node e2e-v11.mjs` → expects "115 lulus, 0 gagal" at v12.9.
3. `e2e-v11.mjs` serves html2pdf from a local npm copy (`h2p/node_modules/html2pdf.js`) because the sandbox could not reach cdnjs.

`repro-*.mjs` = Pixel-7 touch repros (v12.4 "SO 18 item ditolak", v12.4.1 ghost click, v12.5 kirim per SO).
`shot-*.mjs` = screenshot helpers for release notes.
Never point these at the live API (h-plast / ipc-api) — local worker or test env only.
