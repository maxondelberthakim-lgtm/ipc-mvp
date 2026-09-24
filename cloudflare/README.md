# IPC API di Cloudflare Workers (paket gratis)

Backend pengganti Apps Script + Google Sheet. **Logika bisnis tidak diubah**: semua file `apps-script/*.gs`
digabung apa adanya (`tools/build-cf.py` → `src/backend.js`) dan dijalankan di dalam satu Durable Object
dengan penyimpanan SQLite. Frontend (`docs/app`) tidak berubah — hanya `tools/api-url.txt` diganti.

```
HP (GitHub Pages PWA) --POST {fn,args,idKlien}--> Worker (routing, CORS) --> Durable Object "ipc"
                                                                            ├─ semua "sheet" di memori (array baris)
                                                                            ├─ SQLite: potongan 64 baris/row (tahan hibernasi)
                                                                            ├─ foto bukti → R2  (GET /foto/<id>.jpg)
                                                                            └─ backup harian 02:00 WIB → R2 backup/*.json (30 terakhir)
```

| Bagian | Apps Script | Cloudflare |
|---|---|---|
| Waktu balasan (1 tahun data) | 2–6 dtk | 10–170 ms di server (+ jaringan) |
| Bangun dari tidur | 3–8 dtk | ±130 ms |
| Foto | Google Drive | R2 (10 GB gratis) |
| Backup | salinan Sheet ke Drive | JSON ke R2 tiap malam |
| OCR surat jalan | Drive OCR | belum ada (tombol tidak muncul) |
| Batas gratis | 6 mnt/eksekusi, 90 mnt/hari | 100.000 permintaan/hari, 5 GB DB |

## Perintah
```
cd cloudflare
npm install
npm run dev              # lokal: http://localhost:8787  (ADMIN_KEY dari .dev.vars)
npm run deploy           # rakit backend.js + wrangler deploy
npx wrangler secret put ADMIN_KEY
npx wrangler r2 bucket create ipc-foto
```

## Rute
* `POST /exec` (atau `/`) — RPC persis seperti `/exec` Apps Script (daftar putih `RPC_WL`, idempotensi `idKlien` 10 menit).
* `GET /foto/<id>.jpg` — foto bukti dari R2.
* `POST /admin/info | /admin/ekspor | /admin/impor | /admin/backup | /admin/jalankan` — header `X-Admin-Key`.
  `/admin/jalankan` body `{"fn":"resetUntukGoLive"|"seedUlangMaster"|"migrasiSkema"|"hitungUlangHpp","args":[...]}`
  (pengganti "jalankan dari editor Apps Script").

## Pindah data dari Google Sheet
1. Sheet → File → Download → .xlsx
2. `python3 tools/sheet-ke-json.py ipc.xlsx ipc.json`
3. `curl -X POST https://<worker>/admin/impor -H "X-Admin-Key: …" --data-binary @ipc.json`

## Tes
`cd tests && npm test` — 494 pemeriksaan logika di harness Apps Script **dan** di mesin Cloudflare
(`IPC_HARNESS=cf`), plus `test-cf.js` (SQLite, hibernasi, foto, impor, zona waktu). `tools/bench-cf.js`
mengisi ±1 tahun data sintetis dan mengukur waktu tiap fungsi.
