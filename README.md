# IPC — Inventory & Production Control (v10.1)

Mobile web app for a small polybag factory: every kilogram that moves between
**supplier → warehouse (GBJ) → blowing → cutting → warehouse → customer** is logged with a
typed quantity, a photo where it matters, and a timestamp — then reviewed after the fact by a supervisor.

**Backend: Cloudflare Workers + Durable Object (SQLite), free plan.** The business logic is the same
`apps-script/*.gs` code, bundled by `tools/build-cf.py` and run inside the Worker (`cloudflare/`).
Google Sheets is no longer the database (v9 → Cloudflare migration keeps every row; the old Apps Script
deployment still works as a fallback by pointing `tools/api-url.txt` back at it).

> **[▶ App (GitHub Pages PWA)](https://maxondelberthakim-lgtm.github.io/ipc-mvp/app/)** — static frontend, calls the
> Worker as a JSON API (`POST {fn,args,idKlien}`). Installable, no Google sign-in; name + PIN only. ~50 ms per call.
>
> **[▶ Offline demo](https://maxondelberthakim-lgtm.github.io/ipc-mvp/)** — the real backend logic running in the
> browser on sample data. Nothing you do there is saved (refresh = reset).
>
> Demo sign-in (name · PIN): **Admin** 1234 · **Direktur** 2468 · **Manager** 1357 · **Manager Produksi** 1122 ·
> **Sales Manager** 3344 · **Staff Gudang** 1111

## Production flow (v10)

There are no per-job records and no approvals on the production floor — the system must never slow production down.

| Step | Who | What is entered | Stock effect |
|---|---|---|---|
| **Shift report** (one per 12-hour shift: 1 = 08–20, 2 = 20–08) | Manager Produksi | **Blowing section**: its own operators, pellets taken from the warehouse (per SKU, kg), **roll** made per grade (KW / Super / Super Plus), BS per grade. **Cutting section**: its own operators, **roll taken from the pile** per grade (typed, *not* derived — the pile may come from earlier shifts), **polybag** made per grade, BS per grade. Either machine can be marked "not running". | blowing: pellets −, roll +, BS + · cutting: roll −, polybag +, BS + |
| Month-end warehouse count | Manager | physical kg per item in the warehouse | adjustment |
| **Production count** (v10.1, blind) | Manager | polybag produced this month, BS produced, pellets still in the production area, uncut roll, plastic inside the machines — the app only adds it up; **the expected figure is never shown to the person counting** | — |
| **Reconciliation** (v10.1) | Admin only | `opening stock + purchases − ending stock` of raw material (per the ledger, incl. warehouse-count differences) + material already in production at month start **vs** the manager's production count; difference = shrinkage / unrecorded; also compared with shift-report totals (roll made − roll used = uncut roll) | — |
| **Close the month** | Manager (reopen: Admin) | one tap — snapshot of COGS, gross profit, shrinkage; transactions dated in that month become read-only | — |

- **Blowing and cutting are not linked per shift.** Every roll made is totalled and every roll taken is totalled; the
  difference is the uncut roll pile, checked against the physical count at month end.
- **Shrinkage is not computed per shift.** It appears at month close: `pellets into blowing − polybag made − BS − Δroll stock`,
  plus negative stock-count differences. Reports show it per month next to the COGS.
- **BS is a real SKU per grade** (`SCR-BS-KW`, `SCR-BS-SUP`, `SCR-BS-SPL`), counted at both machines, sold or sent to the
  crusher (chassen) and received back as recycled pellets (`RM-BP-DU`). BS is valued at 0; its value comes back through
  the crushing fee.
- **Costing is moving weighted average** (`METODE_HPP=RATA`): pellets from purchase prices (PO / invoice), roll =
  (pellets taken + `BIAYA_PROSES_PER_KG` × kg) ÷ kg roll, polybag = roll consumed ÷ kg polybag, recycled pellets =
  (BS value + fee) ÷ kg. FIFO batches are gone.
- **Gross profit is periodic** (Reports → Laba bulan):
  `COGS = opening stock value + purchases − supplier returns + crushing fees + process cost − closing stock value`,
  `gross profit = sales at SO prices − COGS`. Stock value per category (raw material, roll, polybag, BS) is shown for
  the opening and closing of the month. Closing the month stores the snapshot in `Tutup_Bulan`.
- **Sales orders** require customer, ship date, **TOP (payment terms, days)**, items and prices; purchase orders carry TOP
  too. Due date = ship/arrival date + TOP. Entered by the Sales Manager (any manager account can).
- **Roles**: STAF (warehouse input, sees no prices) · SUPERVISOR (all managers: production, sales, warehouse — see
  everything incl. prices/COGS) · ADMIN (plus users, reopen months). Default accounts: Admin, Direktur, Manager,
  Manager Produksi, Sales Manager, Staff Gudang — **change the PINs**.

## Everything else

| # | Movement | Photo | Delivery note | Stock effect |
|---|---|---|---|---|
| PO | Purchase order (manager: item, kg, price, spec, ETA, TOP) | — | — | — |
| ⓪ | Goods receipt against a PO (supplier → GBJ), QC note | required | required + OCR | GBJ + |
| 🧾 | Supplier invoice → compare with Σ(received × PO price) → validate, correct price (recomputes average cost) | required | — | prices only |
| ↩ | Return to supplier — only from a recorded receipt | required | — | GBJ − |
| ⚠ | Damaged goods — reported by staff, approved by manager | optional | — | GBJ − after approval |
| ♻ | BS recycling: BS sent to a crushing vendor → recycled pellets back, with shrinkage & service fee | optional | optional | BS −, pellets + |
| SO | Sales order (customer, ship date, TOP, items, prices) | — | — | reserves stock |
| ④ | Goods out, sold (GBJ → customer), picked from an SO | required | required | GBJ − |
| ↩ | Return from customer | required | — | GBJ + |

- **Approve after, not before.** Warehouse movements post immediately and land in a review queue (photo next to the
  typed number). Flag archives an entry to revise later (still counted); Cancel voids it.
- **Stock ledger per item** — every line signed (bought, returned, sold, taken by blowing, made, roll used, BS sent,
  pellets back, damage, count adjustment), ending in the balance.
- **Activity calendar** on the home screen — shift reports, receipts, shipments, recycling per day.
- **Search bars with "+ add new"** for supplier / customer / item / operator; codes are generated automatically.
- **Input history + edit** under every form; staff edit their own pending entries, supervisors edit anything; nothing
  older than `MAKS_EDIT_HARI` or inside a closed month can be changed. Every change is logged.
- **When to buy** (Reports → Perlu beli): average pellets taken per day over 30 days vs stock and open POs.
- **Monthly finance export** (Reports → Ekspor): seven CSV files — summary (COGS, gross profit, shrinkage), purchases,
  sales, production (per shift, per grade), damage, recycling, month-end stock value at average cost.
- **Daily backup** of the whole database to Cloudflare KV (02:00 WIB, 35 days kept), export/import via admin routes.
- UI in **Bahasa Indonesia / English**; all quantities in **kilograms**.

## Repository layout

```
apps-script/     business logic + UI (also still pasteable into Apps Script)
  Config.gs      schema, enums, default master data (SKUs per grade), settings
  Server.gs      receipts, shipments, review, stock, reports, users, SKU, opname, JSON API (doPost)
  Pembelian.gs   schema migration (v9→v10), purchase orders, invoices, average-cost engine, damage, reorder prediction
  Penjualan.gs   sales orders (TOP), monthly CSV export
  DaurUlang.gs   BS recycling (chassen)
  Produksi.gs    v10.1: shift reports (blowing + cutting per shift), production report, blind production count, reconciliation
  TutupBulan.gs  v10: monthly close — COGS, gross profit, shrinkage, lock / reopen
  Media.gs       photo upload + delivery-note OCR
  Index.html / Styles.html / Script.html   PWA frontend + i18n
cloudflare/      Worker + Durable Object runtime (src/), deploy.sh, README.md, DEPLOY.md
docs/app/        the real app (built by tools/build-app.py); docs/index.html = offline demo (tools/build-demo.py)
tests/           Node test suites — the real .gs files against an in-memory sheet AND against the Cloudflare engine
tools/           build-cf.py (Worker bundle), build-app.py, build-demo.py, seed.js, api-url.txt
```

## Deploy / update the backend

See **[cloudflare/DEPLOY.md](cloudflare/DEPLOY.md)**. Short version: on the owner's Mac,
`cd "Claude Co Work/ipc-cloudflare" && bash deploy.sh` (downloads a portable Node, `wrangler deploy`, sets the admin
key), or double-click `deploy-v10.command` in Finder. The schema migration runs itself on the first request after deploy (v10.1: v10 per-machine shift rows are merged into one row per shift, the old sheets are kept as `*_lama`). v10: archives `Pekerjaan*` /
`Master_Standar_Susut` as `*_lama`, adds the `Kualitas` column and the per-grade roll / polybag / BS SKUs, deactivates
the old `RM-BS-*` raw-material SKUs, switches `METODE_HPP` to `RATA`, adds the Manager Produksi / Sales Manager accounts.

## Development

```bash
cd tests && npm test          # ~960 checks: sheet harness + Cloudflare engine (incl. live-data migration v9→v10→v10.1)
python3 tools/build-cf.py     # bundle apps-script/*.gs → cloudflare/src/backend.js
python3 tools/build-app.py    # rebuild docs/app/ (PWA); API URL from tools/api-url.txt
python3 tools/build-demo.py   # rebuild docs/index.html
cd cloudflare && npx wrangler dev --port 8787 --local   # local Worker for the Playwright e2e
```

## Status

v10.1 — two 12-hour shifts, one report per shift with separate blowing / cutting operators, roll used typed by the
cutting operator, blind monthly production count + admin-only reconciliation. v10 — shift reports replace jobs, average
costing replaces FIFO, monthly close with COGS / gross profit / shrinkage, SO & PO with TOP. Backend on Cloudflare (free plan). Not yet: offline mode, barcode
scanning, receivables / payment tracking beyond the due date.
