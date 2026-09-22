# IPC — Inventory & Production Control (v9)

Mobile web app for a small factory (polybag plant): every kilogram that moves between
**supplier → warehouse (GBJ) → job → warehouse → customer** is logged with a
typed quantity, a photo and a timestamp — then reviewed after the fact by a supervisor.

**Backend is a Google Sheet.** No server, no hosting, no app to install. The plant already
runs on spreadsheets, so the data lands in the format the team already knows.

> **[▶ App (GitHub Pages PWA)](https://maxondelberthakim-lgtm.github.io/ipc-mvp/app/)** — static frontend on GitHub Pages, calls Apps Script as a JSON API (`doPost {fn,args}`), Google Sheet as database. Installable, no Google sign-in; name + PIN only.
>
> **[▶ Offline demo](https://maxondelberthakim-lgtm.github.io/ipc-mvp/)** — real backend
> logic running in the browser on sample data. Nothing you do there is saved (refresh = reset).
>
> Demo sign-in (name · PIN): **Admin** 1234 · **Direktur** 2468 · **Manager** 1357 · **Staff Gudang** 1111

## What it does

| # | Movement | Photo | Delivery note | Stock effect |
|---|---|---|---|---|
| PO | Purchase order (manager: item, kg, price, spec, ETA) | — | — | — |
| ⓪ | Goods receipt against a PO (supplier → GBJ), QC note | required | required + OCR | GBJ + |
| 🧾 | Supplier invoice upload → compare with Σ(received × PO price) → validate, correct price | required | — | prices only |
| ↩ | Return to supplier — only from a recorded receipt ("returnable X kg") | required | — | GBJ − |
| ⚠ | Damaged goods — reported by staff, approved by manager | optional | — | GBJ − after approval |
| ① | Job: raw material (from GBJ) → finished goods + scrap (back into GBJ) | optional | — | GBJ: material −, product + scrap + |
| ♻ | Scrap recycling: scrap sent to another factory's crusher (chassen) → recycled pellets back, with shrinkage & service fee | optional | optional | scrap −, pellets + |
| SO | Sales order (manager/sales: customer, item, kg, selling price, ship date) | — | — | reserves stock |
| ④ | Goods out, sold (GBJ → customer), picked from an SO | required | required | GBJ − |
| ↩ | Return from customer | required | — | GBJ + |

- **Shrinkage (susut)** is computed per job: `in − out − scrap`, in kg, flagged when it
  exceeds the product's normal range. Reports show total shrinkage and which raw
  material it came from.
- **Approve after, not before.** Every movement posts immediately and lands in a review
  queue where the photo sits next to the typed number. Flagged entries are excluded from
  stock until corrected.
- **Stock ledger per item** — two blocks (warehouse, production), every line signed, ending
  in the balance. Tap an item to see where its number comes from.
- **Activity calendar** on the home screen — colour dots per day, tap a date for the full log.
- **Review = Approve / Flag / Cancel.** Flag archives an entry to revise later (still counted);
  Cancel voids it (not counted).
- **COGS (HPP) is FIFO**: every receipt is a batch priced from its PO/invoice; transfers, jobs, sales and
  damage consume the oldest batch first; finished goods become a batch at the job's COGS/kg. Reports: COGS per
  job / per kg, stock value per batch, rupiah value of shrinkage and of approved damage. Visible to supervisors
  only; the server never sends prices to warehouse staff. `METODE_HPP=MASTER` falls back to master prices.
- **Shrinkage standard per product** from real data (mean, median, min–max, σ, weighted) with a one-tap
  "set as standard" that writes to `Master_Standar_Susut`.
- **Staff edits/cancels become requests** that a supervisor approves (Review → Usulan); transaction date
  defaults to today but can be back-dated (max `MAKS_MUNDUR_HARI`). Available stock at the source location
  is shown while picking an item.
- **Per-user PIN sign-in** — every entry is attributable to one person. Roles: STAF / SUPERVISOR / ADMIN.
- **Admin menu**: stock count (opname) that writes adjustments instead of overwriting; SKU add / edit / delete
  from the phone; per-staff activity; user management (admin only).
- **Scrap is a real SKU** — `SCR-<product>` created automatically per product, so scrap stock is visible
  per product and can be sold like any other item.
- **Input history + edit** under every form; tap any row (or any calendar event) to open it full-screen.
  Staff edit or cancel their own entries directly while they are pending; once a supervisor has reviewed
  an entry it is view-only for staff. Supervisors can edit anything. Nobody can edit entries older than
  `MAKS_EDIT_HARI` (30 days — the period is closed). Every change is logged (`Log_Edit`), status is
  untouched, and editing a closed job recomputes shrinkage and COGS.
- **Home screen that answers "what today?"** — the stat tiles are buttons (tap "kg out today" to see
  the entries behind it), *Ship today* lists sales orders due today or overdue (staff tap → shipping
  form pre-filled from the SO), *Incoming* lists open POs with ETA, and a ↻ button / return-to-tab
  auto-refresh keeps every phone in sync.
- **When to buy** (Reports → Perlu beli): average daily usage over the last 30 days vs stock on hand and
  open POs; `LEAD_TIME_HARI` decides how early "buy now" fires, with a suggested quantity and a one-tap PO.
- **Sales orders**: status TERBUKA → SEBAGIAN → SELESAI, reserved quantity shown next to available stock,
  shipping quantity cannot exceed the SO balance. Selling prices are visible to Manager/Admin only —
  the server never sends SO prices or COGS to warehouse staff.
- **One warehouse (v9)**: the separate production store (GP) is gone — jobs consume raw material straight from GBJ and
  their output lands straight back in GBJ. No transfers to log; stock = one number per item.
- **Search bars instead of dropdowns (v9)**: every supplier / customer / item field is a search box; a name that does
  not exist yet can be added on the spot (`+ Tambah baru`) by any role — codes are generated automatically
  (`SUP-005`, `CUS-005`, `RM-…`/`FG-…`), duplicates (case-insensitive) are reused.
- **Scrap recycling (v9)**: scrap is sent to a crushing vendor (the plant has no chassen of its own), comes back as
  recycled pellets — a raw-material SKU. Shrinkage at the crusher = sent − received, flagged against
  `SUSUT_CHASSEN_PERSEN` ± `TOLERANSI_CHASSEN_PERSEN`; the service fee (Manager/Admin only, can be entered later)
  becomes the pellets' FIFO cost: `(scrap value + fee) ÷ kg received`, which then flows into job COGS.
- **Monthly finance export** (Reports → Ekspor, Manager/Admin): seven CSV files for one month — summary,
  purchases (with PO/invoice numbers), sales (with SO price, COGS, gross profit), production, damage,
  recycling (scrap, pellets, fee, cost/kg), month-end FIFO stock value.
- **Automatic backup**: a time trigger copies the Sheet to a Drive folder "IPC Backup" every night
  (last 30 kept); status visible under Admin → Backup.
- UI in **Bahasa Indonesia / English** (toggle); sheet & column names in Indonesian.
- All quantities in **kilograms**.

## Repository layout

```
apps-script/     the app — paste these into a Google Sheet's Apps Script editor
  Config.gs      sheet schema, enums, dummy master data, setupSistem()
  Server.gs      purchases, sales, returns, transfers, jobs, shrinkage, reports, JSON API (doPost)
  Pembelian.gs   v7: schema migration, purchase orders, invoices, FIFO engine, damage, shrinkage standards
  Media.gs       photo upload to Drive + delivery-note OCR
  Index.html     screens
  Styles.html    CSS
  Script.html    front-end logic + i18n
  appsscript.json
docs/index.html  offline demo (served by GitHub Pages)
docs/app/        the real app: PWA frontend (built by tools/build-app.py from apps-script/)
tests/           Node test suite — runs the real .gs files against an in-memory sheet
tools/           demo shim, seed data, build script
PANDUAN-SETUP.md deployment guide (Indonesian) — start here
```

## Deploy (≈15 min)

Full steps in **[PANDUAN-SETUP.md](PANDUAN-SETUP.md)**. Short version:

1. New Google Sheet → **Extensions → Apps Script**
2. Paste the nine files from `apps-script/` (names must match: `Config`, `Server`, `Media`, `Pembelian`, `Penjualan`, `DaurUlang`, `Index`, `Styles`, `Script`)
3. **Services → + Drive API (v2)** — enables OCR
4. Run `setupSistem()` once, grant permissions; run `pasangBackupHarian()` once to install the nightly backup
5. Change the four default PINs (Admin → Pengguna). Everyone — the sheet owner included — logs in with name + PIN (`PAKSA_LOGIN_MANUAL=YA`); unregistered names are refused (`AKSES_TERBUKA=TIDAK`)
6. **Deploy → Web app** — execute as *Me*, access **Anyone** (this is the JSON API endpoint)
7. Put the `/exec` URL in `tools/api-url.txt`, run `python3 tools/build-app.py`, commit `docs/app/` — staff open `https://<owner>.github.io/<repo>/app/` and add it to their home screen. Master data: run `resetUntukGoLive()` once from the editor to clear test rows and load the SKU list in `DUMMY_ITEM`.

## Development

```bash
cd tests && npm test          # 494 checks: stock math, shrinkage, permissions, FIFO, SO, export, backup, v9 migration, recycling
python3 tools/build-demo.py   # rebuild docs/index.html after editing apps-script/
python3 tools/build-app.py    # rebuild docs/app/ (PWA); API URL comes from tools/api-url.txt
```

The tests run the actual Apps Script code under Node with `SpreadsheetApp`, `DriveApp`
etc. stubbed by an in-memory sheet (`tests/harness.js`), so backend logic is verified
before anything is pasted into Google.

## Not yet

Offline mode · barcode scanning · more than one warehouse · push notifications · receivables / payment tracking.

## Status

v9 live (GitHub Pages app + Apps Script JSON API). 494 automated checks (`cd tests && npm test`).
Upgrading from v8: the schema migration runs itself on the first request (merges `Stok_Awal_GP` into `Stok_Awal`,
archives the old `Transfer` sheet as `Transfer_lama`, adds the `Daur_Ulang` sheets and settings).
Built for a pilot on one warehouse. Shrinkage thresholds in
`Master_Standar_Susut` should be set from real pilot data, not guessed.
