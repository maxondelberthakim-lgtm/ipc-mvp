# IPC — Inventory & Production Control (MVP)

Mobile web app for a food-production plant: every kilogram that moves between
**supplier → warehouse (GBJ) → production (GP) → warehouse → customer** is logged with a
typed quantity, a photo and a timestamp — then reviewed after the fact by a supervisor.

**Backend is a Google Sheet.** No server, no hosting, no app to install. The plant already
runs on spreadsheets, so the data lands in the format the team already knows.

> **[▶ Try the live demo](https://maxondelberthakim-lgtm.github.io/ipc-mvp/)** — real backend
> logic running in the browser on sample data. Nothing you do there is saved (refresh = reset).
>
> Demo sign-in (name · PIN): **Admin** 1234 · **Direktur** 2468 · **Manager** 1357 · **Staff Gudang** 1111

## What it does

| # | Movement | Photo | Delivery note | Stock effect |
|---|---|---|---|---|
| ⓪ | Purchase in (supplier → GBJ) | required | required + OCR | GBJ + |
| ↩ | Return to supplier | required | — | GBJ − |
| ① | Transfer to production (GBJ → GP) | required | — | GBJ −, GP + |
| ② | Job: raw material → finished goods + scrap | optional | — | GP |
| ③ | Transfer back (GP → GBJ) | required | — | GP −, GBJ + |
| ④ | Goods out, sold (GBJ → customer) | required | required | GBJ − |
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
- **COGS (HPP)** per job and per kg of output, plus the rupiah value of shrinkage — visible to
  supervisors only; the server never sends prices to warehouse staff.
- **Per-user PIN sign-in** — every entry is attributable to one person. Roles: STAF / SUPERVISOR / ADMIN.
- **Admin menu**: stock count (opname) that writes adjustments instead of overwriting; SKU add / edit / delete
  from the phone; per-staff activity; user management (admin only).
- **Scrap is a real SKU** — `SCR-<product>` created automatically per product, so scrap stock is visible
  per product and can be sold like any other item.
- **Input history + edit** under every form. Staff can fix their own entries until a supervisor
  reviews them; supervisors can edit anything. Every change is logged (`Log_Edit`), status is
  untouched, and editing a closed job recomputes shrinkage and COGS.
- UI in **Bahasa Indonesia / English** (toggle); sheet & column names in Indonesian.
- All quantities in **kilograms**.

## Repository layout

```
apps-script/     the app — paste these into a Google Sheet's Apps Script editor
  Config.gs      sheet schema, enums, dummy master data, setupSistem()
  Server.gs      purchases, sales, returns, transfers, jobs, shrinkage, reports
  Media.gs       photo upload to Drive + delivery-note OCR
  Index.html     screens
  Styles.html    CSS
  Script.html    front-end logic + i18n
  appsscript.json
docs/index.html  offline demo (served by GitHub Pages)
tests/           Node test suite — runs the real .gs files against an in-memory sheet
tools/           demo shim, seed data, build script
PANDUAN-SETUP.md deployment guide (Indonesian) — start here
```

## Deploy (≈15 min)

Full steps in **[PANDUAN-SETUP.md](PANDUAN-SETUP.md)**. Short version:

1. New Google Sheet → **Extensions → Apps Script**
2. Paste the six files from `apps-script/` (names must match: `Config`, `Server`, `Media`, `Index`, `Styles`, `Script`)
3. **Services → + Drive API (v2)** — enables OCR
4. Run `setupSistem()` once, grant permissions
5. Change the four default PINs (Admin → Pengguna). Everyone — the sheet owner included — logs in with name + PIN (`PAKSA_LOGIN_MANUAL=YA`); unregistered names are refused (`AKSES_TERBUKA=TIDAK`)
6. **Deploy → Web app** — execute as *Me*, access *Anyone with a Google account*
7. Send the URL to staff; they add it to their home screen

## Development

```bash
cd tests && npm test          # 248 checks: stock math, shrinkage, permissions, OCR parser
python3 tools/build-demo.py   # rebuild docs/index.html after editing apps-script/
```

The tests run the actual Apps Script code under Node with `SpreadsheetApp`, `DriveApp`
etc. stubbed by an in-memory sheet (`tests/harness.js`), so backend logic is verified
before anything is pasted into Google.

## Not in the MVP

Offline mode · prices / invoicing · barcode scanning · blocking stock validation ·
warehouses beyond GBJ/GP · push notifications.

## Status

MVP — built for a 2–3 week pilot on one warehouse pair. Shrinkage thresholds in
`Master_Standar_Susut` should be set from real pilot data, not guessed.
