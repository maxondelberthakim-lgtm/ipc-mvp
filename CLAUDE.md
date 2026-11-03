# H-Plast IPC — notes for Claude Code

IPC (Inventory & Production Control), branded **H-Plast**: a phone-first PWA for a polybag factory. Staff log every stock movement (kg, optional photo); the system computes stock, moving-average cost (HPP), monthly COGS / gross profit / shrinkage, PO / SO with payment terms, scrap recycling via an outside crusher (chassen), and printable documents (invoice, SO, PO, surat jalan).

## How the owner works
- Talks in a casual mix of Bahasa Indonesia and English — answer the same way and keep his terms (surat jalan, SO, BS, chassen, opname, tutup bulan, HPP, bal, sak, dus).
- Concise: do the work, then report in a few lines (what changed, what is live, what he needs to do).
- Verify like a staff member on a phone (Pixel-7-size viewport, touch), not only with unit tests.
- **"Simple, no menu behind a menu."** Actions sit on the screen where the work happens. The app must follow how the floor really works (print → sign → load → send → photo).
- Staff are not tech-savvy and use cheap Android phones. Speed beats beauty.

## Hard rules
1. This project is H-Plast only — never put names of other businesses into code, data, docs, fixtures or commits.
2. **Live data is sacred.** Before any import, reset, purge, merge, migration or bulk edit on live: back up first, get explicit OK, then do it. Dated changes must not disturb later transactions.
3. **Never create test rows/documents on live** — use the test environment or a local worker.
4. The admin key is a Worker secret: never print it, put it in chat, docs, commits or scripts (scripts read it from a local file at run time).
5. Never commit live exports, backups, keys or `ipc-live.json` — the repo is public.
6. Production deploys only with the owner's go-ahead in that conversation. Order: backend → frontend → test env. Test env first when asked.
7. Never deploy Worker code through the Cloudflare dashboard / browser — only wrangler.
8. Prices / HPP / Rp are filtered **on the server** (`bolehLihatHpp_`); STAF never receives money fields. Every new endpoint keeps that. `keluar()` must wipe every screen that can show money.
9. Every write path validates all lines first and fails as a whole (engine rollback); errors name the line ("Baris #8 (Polybag KW): …").
10. Every cancellation needs a reason (≥ 3 chars); cancel = status DIBATALKAN + audit log, never hard delete.
11. Kilograms are the stored unit; "bal" is display/entry only (`KG_PER_BAL`).
12. All UI text is i18n in `apps-script/Script.html` (`T.id` + `T.en`) — add both for every new label; never change existing label text unless asked.

## Layout
- `apps-script/*.gs` — business logic (Apps Script style, Indonesian names). `Config.gs` (`APP.versi`, sheets, headers, defaults), `Server.gs` (RPC whitelist `RPC_WL`, users/access, receipts/shipments, reports), `Pembelian.gs` (PO, migrations), `Penjualan.gs` (SO, export), `Produksi.gs` (shift reports), `TutupBulan.gs`, `DaurUlang.gs`, `Dokumen.gs`, `Media.gs`.
- `apps-script/Index.html` + `Styles.html` + `Script.html` — the whole frontend.
- `cloudflare/src/` — Worker (`worker.js` routes, `mesin.js` Sheets-on-SQLite engine, `shim.js`, generated `backend.js`).
- `tools/` — `build-cf.py` (backend bundle), `build-app.py` (PWA → `docs/app/`; on the `test` branch `--test` → `docs/app-test/`), `build-demo.py` (offline demo → `docs/index.html`).
- Generated files are never hand-edited: `cloudflare/src/backend.js`, `docs/app/*`, `docs/app-test/*`, `docs/index.html`.
- A new `.gs` file must be added to `tools/build-cf.py`, `tests/harness.js` and `tools/build-demo.py`.

## Dev workflow
1. Edit `apps-script/*` (and `cloudflare/src/worker.js` only for routes/pages).
2. `python3 tools/build-cf.py && python3 tools/build-app.py && python3 tools/build-demo.py`, then `node --check cloudflare/src/backend.js cloudflare/src/worker.js`.
3. `cd tests && npm test` — every suite green (sheet harness + `IPC_HARNESS=cf` SQLite reruns). Add a test section for every feature; new money fields need a STAF-filter test.
4. e2e in `tests/e2e/` against a local `wrangler dev` (see its README) — phone viewport, Chromium and WebKit, with and without reduced motion.
5. Bump `versi` in `Config.gs` and the expected version in `tests/test-cf.js` + `tests/test-v9.js`.
6. Commit on `main`; merge into `test` and rebuild `docs/app-test` for the test environment.
7. Schema changes: add to `HEADER`, bump the version — `migrasiSkema` adds missing sheets/columns on the next request. Write a versioned `migrasiVx_` only for data changes (flag it with a Log_Audit row so it runs once).

## Shipping flow (v13 "alur kirim")
- Three steps, each on the screen where the work happens: **SO** → **Buat DO** (`siapkanKiriman`: surat jalan number + printable/WA document at once, no stock movement) → **Kirim** (`kirimKiriman`: actual kg, date, signed-DO photo — only here stock moves and `Pengiriman` / `Daur_Ulang` rows are written; the photo may follow → "Belum foto DO", `fotoSj`). Never add an entry point that writes barang keluar without a DO; mode `JUAL_KELUAR` of the form stays only for riwayat/edit.
- Data: `Kiriman` + `Kiriman_Detail` (`apps-script/Kiriman.gs`), `Pengiriman.ID_Kiriman` / `Daur_Ulang.ID_Kiriman`. Old rows without `ID_Kiriman` are shown virtually as "sudah dikirim" (`kirimanLama_`) — no migration. Over-planning against the SO is rejected per line; short stock only warns.
- Access: create/edit/cancel DO = `bolehSj_`; Kirim + DO photos = `bolehKirim_` (GUDANG); lists `bolehLihatKiriman_`.
- UI: `bukaKiriman(tab, idSo)` (DO screen: Siap kirim / Belum foto DO / Sudah dikirim), `blokDoSo` on the SO card, `bukaKirimDo` sheet with the photo chooser Kamera / Galeri / Buat-cetak DO (`bukaSumberFotoDo`), `cetakDo` = document modal in view mode. Daur ulang uses the same DO draft (`simpanDoDaurUI`).

## Frontend conventions (v12.10 "fluid")
- Design tokens are CSS variables at the top of `Styles.html`: palette (teal brand + neutrals + status; only tints/shades of existing colours), radius 10/14/20, one soft shadow, motion curves/durations. Animate only `transform` / `opacity`; `prefers-reduced-motion` makes everything instant; controls are never hidden behind an entrance animation.
- Icons: one inline stroke sprite in `Index.html` (`<symbol id="i-…">`), used via `ikon(name, 'tx'?)` in JS or `<svg class="i"><use href="#i-…"/></svg>`. No emoji in the UI.
- No native `prompt`/`confirm`/`alert`: use `tanya(msg)` / `isian(msg, value)` / `mintaAlasan(key)` (in-app sheet, Promise-based; callers are `async`).
- Client validation: `galat(message, fieldIdOrEl)` = toast + shake + message under the field.
- Reports: `kpiHtml`, `batangHtml`, `GRAFIK[...]` + `pasangGrafik(el)` (hand-built SVG line charts with tooltip/crosshair, sparklines, count-up). No chart libraries, no new CDNs, system fonts only.
- Status labels: sentence case, dot + text (`.pill`); cancelled rows `.batal` (dimmed + strikethrough).

## Gotchas
- `pkill wrangler` / `workerd` in the same shell as other commands can kill that shell — run it on its own.
- e2e: `segSo()` only renders when `S.view === 'so'` (call `tampil('so')` first). Combo/search lists pick on click, not pointerdown (phones fire a ghost click into whatever is underneath).
- The engine keeps sheets in memory; a function that writes then throws is rolled back by `panggil()` — but only if it throws. Validate everything first anyway.
- A tab left open across a deploy keeps old JS until reload (network-first service worker).
- The offline demo (`tools/seed.js`) exposes every function in `RPC_WL`; a backend function missing from the whitelist fails in the demo with "reading 'apply'".
- e2e on the Mac: `tests/e2e/run-e2e-mac.sh` needs `WRANGLER` (any wrangler 4 install) and `E2E_HOME`; Chromium, `--reduced-motion` and `--browser webkit` run one after another (fixed ports 8090/8787).
- `/dok/<token>` pages load html2pdf from cdnjs; a cross-origin fetch of them from the app can fail — test in a tab.
- Free Cloudflare plan: one Durable Object (one region), ~128 MB memory, photos count toward storage. No offline mode.
