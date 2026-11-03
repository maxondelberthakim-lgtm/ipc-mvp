# End-to-end (browser) tests — Playwright

## Mac

`run-e2e-mac.sh` does everything per run: copies the build to `$E2E_HOME/run/pwa` with the API URL rewritten to
`http://127.0.0.1:8787/exec` (aborts if any `workers.dev` / Apps Script URL is left), serves it on `127.0.0.1:8090`,
starts a **fresh** `wrangler dev --local` on `127.0.0.1:8787` from a scratch copy of `cloudflare/src` (state wiped, own
`wrangler.jsonc`, `.dev.vars` `ADMIN_KEY="uji-lokal"`), runs the script, then stops both. Nothing is written in the repo.
The browser can only reach 127.0.0.1/localhost (every other host goes to a dead proxy and is listed at the end as
"Permintaan ke luar 127.0.0.1 (diblok)"). One run at a time (lock + port check).

```sh
export E2E_HOME=~/ipc-e2e      # deps, logs, screenshots, bench JSON (default: $TMPDIR/ipc-e2e)
export WRANGLER=/path/to/node_modules/.bin/wrangler   # any wrangler 4; unset → <repo>/cloudflare/node_modules, else --setup installs one
tests/e2e/run-e2e-mac.sh --setup                # once: playwright-core 1.64.1 + html2pdf.js 0.10.1 (+ wrangler 4) + Playwright WebKit

tests/e2e/run-e2e-mac.sh                        # e2e · Chromium = system Chrome          v12.9: 115 lulus, 0 gagal
tests/e2e/run-e2e-mac.sh --reduced-motion       # e2e · Chromium · reducedMotion 'reduce' v12.9: 115/0
tests/e2e/run-e2e-mac.sh --browser webkit       # e2e · WebKit (Playwright build)         v12.9: 115/0
tests/e2e/run-e2e-mac.sh --bench                # bench-ui.mjs · Chromium (see below)
BENCH_CPU_THROTTLE=4 tests/e2e/run-e2e-mac.sh --bench   # same, CPU slowed 4× (closer to a mid-range phone)
```

Add `--build <dir>` to test another build (default: the repo's `docs/app`, i.e. the working tree **including uncommitted
edits**) and `--cf <dir>` for another worker source (default `<repo>/cloudflare`, also the working tree). Clean baseline of HEAD:
`git archive HEAD | tar -x -C <dir> && python3 -I <dir>/tools/build-app.py`, then `--build <dir>/docs/app --cf <dir>/cloudflare`.
Every mode uses the e2e's phone viewport 420×940 @2x. Output: `$E2E_HOME/run/<mode>.log`, screenshots in `run/out/`, bench JSON
`run/bench-<browser>[-cpu4x].json`, worker log `run/wrangler.log`. `--keep` leaves worker + app server running; `--help` lists
env knobs (`CHROME_PATH`, `PW_DIR`, `H2P_JS`, `APP_PORT`, `BENCH_REPS`, `BENCH_SAVE_REPS`, `BENCH_CPU_THROTTLE`, `E2E_TIMEOUT_S`).
Without env vars `e2e-v11.mjs` keeps the old sandbox paths below.

`bench-ui.mjs` (logged in as Manager, fresh worker): **(a) screen switch** — real click on the bottom-nav Beranda / Produksi /
Laporan / Admin and the home tile "Barang keluar", 10× each after 1 warm-up; time = click `event.timeStamp` → first frame in
which `#v-<view>` is visible has been painted (checked every rAF, then a MessageChannel task). Columns `js` (click → app
handler done) and `render` (style+layout+paint of that frame) show the work inside the frame; `settle` also waits for CSS
animations/transitions in the view (equal to the total when there are none). On this Mac a cheap switch is bound by the
~16.7 ms frame, so compare `js`/`render` or use `BENCH_CPU_THROTTLE=4`. **(b) save** — real click on the save button →
success `toast()` painted, 10× after 1 warm-up, for penerimaan barang (from a PO, 1 line), laporan shift (blowing + cutting)
and SO (1 line); `api` = the save's POST /exec duration. Form filling is not timed (driven like `e2e-v11.mjs`).

## Sandbox (history)

Moved here 2 Nov 2026 from the cloud sandbox so they are versioned. The `repro-*`/`shot-*` scripts still use the sandbox's paths
(`/home/claude/...`, `/tmp/claude-0/...`, Chromium at `/opt/pw-browsers/...`); `e2e-v11.mjs` uses them only as env defaults.

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
