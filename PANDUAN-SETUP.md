# IPC — Inventory & Production Control (v10.1) — Panduan

Aplikasi HP untuk pabrik polybag: setiap kg yang bergerak **supplier → gudang (GBJ) → blowing → cutting → gudang → customer**
dicatat dengan angka, foto (kalau perlu), dan siapa yang mencatat.

- **Aplikasi:** https://maxondelberthakim-lgtm.github.io/ipc-mvp/app/ — buka di Safari/Chrome HP, *Add to Home Screen*.
- **Demo (tanpa simpan):** https://maxondelberthakim-lgtm.github.io/ipc-mvp/
- **Backend:** Cloudflare Workers + Durable Object (paket gratis). Cara deploy / update: `cloudflare/DEPLOY.md`.
  (Google Sheet tidak dipakai lagi sebagai database sejak migrasi Cloudflare.)

## Alur produksi (v10)

```
SUPPLIER ──⓪ beli (PO, TOP)──►  GUDANG (GBJ)
                                   │  biji plastik diambil operator blowing
                                   ▼
                             MESIN BLOWING  ──► roll KW / Super / Super Plus  + BS per kualitas
                                   │  (roll ditumpuk; operator cutting mengambil sendiri — bisa dari shift sebelumnya)
                                   ▼
                             MESIN CUTTING  ──► polybag KW / Super / Super Plus + BS per kualitas
                                   │
                                   ▼
                              GUDANG (GBJ) ──④ kirim (SO, TOP)──► CUSTOMER
BS (semua kualitas) ──♻ chassen (pabrik lain) ──► biji plastik daur ulang ──► gudang
```

**Tidak ada pekerjaan per pesanan, tidak ada persetujuan di produksi.** Ada **2 shift × 12 jam** (shift 1 = 08.00–20.00,
shift 2 = 20.00–08.00). Setiap shift, **Manager Produksi** mengisi **satu laporan** yang punya dua bagian:

| Bagian | Diisi | Efek stok |
|---|---|---|
| 🌬️ Blowing | **operator blowing** (bisa beberapa — merekalah yang bertanggung jawab atas biji yang diambil) · biji plastik yang diambil dari gudang (SKU + kg) · **roll jadi per kualitas** · **BS blowing per kualitas** | biji −, roll +, BS + |
| ✂️ Cutting | **operator cutting** · **roll yang diambil untuk dipotong per kualitas** (diisi sendiri — boleh dari tumpukan shift sebelumnya, tidak dihitung dari angka blowing) · **polybag jadi per kualitas** · **BS cutting per kualitas** | roll −, polybag +, BS + |

Mesin yang tidak jalan di shift itu dimatikan lewat saklar "jalan" — bagiannya tidak dicatat. Laporan shift hanya untuk
mencatat: **berapa biji plastik diambil dan siapa yang ambil, siapa mengerjakan apa dan berapa hasilnya, berapa BS.**
Blowing dan cutting tidak saling terkait per shift; yang dijumlahkan adalah **total roll jadi** dan **total roll dipakai**
— selisihnya = tumpukan roll yang belum dipotong, dicek saat opname akhir bulan.

Laporan bisa diubah / dibatalkan oleh manager selama bulannya belum ditutup. Staf gudang bisa **melihat** laporan
(tanpa harga) tapi tidak mengisi.

### Opname produksi & rekonsiliasi (akhir bulan)

1. **Manager** → Admin → **Opname produksi**: hentikan mesin sebentar, timbang dan isi: polybag yang dihasilkan bulan ini,
   BS yang dihasilkan, biji plastik yang masih ada di area produksi, roll yang belum dipotong, plastik di dalam mesin.
   Aplikasi hanya **menjumlahkan** — angka pembanding tidak pernah ditampilkan ke pengisi, supaya tidak ada yang bisa
   "mencocok-cocokkan". Opname bulan yang sama yang diisi ulang menggantikan yang lama (riwayat tetap ada).
2. **Admin** → Admin → **Rekonsiliasi**:
   `stok awal bulan + pembelian − stok akhir bulan` (bahan baku, dari neraca — termasuk selisih opname gudang; retur, rusak,
   jual, kirim chassen dikeluarkan) **+ bahan yang sudah ada di area produksi awal bulan** (opname bulan lalu)
   **harus sama dengan** hitungan manager. Selisih = susut atau ada yang tidak tercatat. Ditampilkan juga per bahan baku
   dan dibandingkan dengan laporan shift (polybag, BS, roll belum dipotong = roll jadi − roll dipakai).

### Susut

Susut **tidak** dihitung per shift. Susut kelihatan saat **tutup bulan** (Laporan → Laba bulan):

```
susut produksi = biji plastik masuk blowing − polybag jadi − BS (blowing + cutting) − perubahan stok roll
total susut    = susut produksi + selisih minus stock opname bulan itu
```

Jadi lakukan **stock opname akhir bulan** (Admin → Opname) sebelum menutup bulan.

### HPP & laba kotor (periodik, bukan per pekerjaan)

Nilai stok memakai **harga rata-rata bergerak** (`METODE_HPP = RATA`):
biji plastik dari harga PO/invoice · roll = (biji diambil + biaya proses `BIAYA_PROSES_PER_KG` × kg) ÷ kg roll ·
polybag = roll terpakai ÷ kg polybag · BS dinilai 0 · biji daur ulang = (0 + jasa chassen) ÷ kg diterima.

```
COGS       = nilai stok awal bulan + pembelian − retur supplier + jasa chassen + biaya proses − nilai stok akhir bulan
Laba kotor = penjualan (harga SO) − COGS
```

Semua manager (SUPERVISOR) melihat angka ini; staf tidak pernah menerima harga dari server.

### Tutup bulan

Laporan → **Laba bulan** → pilih bulan lalu → **Tutup buku**. Setelah ditutup: transaksi bertanggal bulan itu tidak
bisa ditambah / diubah / dibatalkan, angka COGS–laba–susut tersimpan di `Tutup_Bulan`. Kalau ada yang terlewat,
**Admin** bisa **Buka lagi** (wajib alasan, tercatat di log), lalu tutup ulang. Bulan ditutup berurutan.

## Akun & peran

| Nama (bawaan) | Peran | PIN awal — **GANTI!** | Tugas |
|---|---|---|---|
| Admin, Direktur | ADMIN | 1234, 2468 | semua + kelola pengguna + buka bulan tertutup |
| Manager | SUPERVISOR | 1357 | review, opname, SKU, laporan, tutup bulan |
| Manager Produksi | SUPERVISOR | 1122 | laporan shift blowing / cutting |
| Sales Manager | SUPERVISOR | 3344 | sales order & purchase order |
| Staff Gudang | STAF | 1111 | penerimaan, pengiriman, retur, rusak, kirim BS ke chassen |

Semua akun SUPERVISOR melihat semua (harga, HPP, laba). Ganti PIN di **Admin → Pengguna**. Nama yang belum terdaftar
ditolak (`AKSES_TERBUKA = TIDAK`).

## Pakai sehari-hari

**Sales Manager**
1. Beranda → **Sales order (SO)** → + Buat SO: customer, tanggal kirim, **TOP (hari; 0 = tunai)**, item, kg, harga/kg.
   Jatuh tempo = tanggal kirim + TOP. Gudang melihat SO tanpa harga di *Kirim hari ini*.
2. Beranda → **Pesanan pembelian (PO)** → + Buat PO: supplier, perkiraan datang, TOP, item, kg, harga/kg, spesifikasi.
   Invoice supplier diunggah & divalidasi di tab Invoice (harga baru → HPP dihitung ulang).

**Staff Gudang**
1. ⓪ **Penerimaan barang**: pilih supplier → pilih PO yang datang → foto surat jalan (OCR) → kg → Simpan.
2. ④ **Barang keluar**: ketuk SO di *Kirim hari ini* (form terisi) → foto → no. DO → Simpan.
3. ↩ Retur (ke supplier / dari customer), ⚠ Barang rusak (disetujui manager), ♻ Kirim BS ke chassen & terima biji daur ulang.

**Manager Produksi** — tab **Produksi** → + Isi laporan: tanggal, shift (1/2), lalu bagian **Blowing** (operator → Enter,
biji plastik diambil, roll jadi per kualitas, BS) dan bagian **Cutting** (operator, roll diambil per kualitas, polybag jadi,
BS) → Simpan. Form berikutnya otomatis melompat ke shift yang belum diisi. **Rekap bulan**: per mesin, per kualitas,
per operator per mesin, per hari, %BS, sisa roll menurut laporan.

**Manager**
1. **Review**: setujui / tandai / batalkan penerimaan & pengiriman staf (foto di sebelah angka); laporan rusak.
2. **Laporan**: Produksi · Stok (neraca per item) · Beli · Jual · Daur ulang · **Laba bulan** · Nilai stok · Perlu beli · Ekspor (7 CSV).
3. **Admin**: Opname gudang akhir bulan · **Opname produksi** (hitungan buta) · **Rekonsiliasi** (Admin saja) ·
   SKU (kategori: bahan baku / roll / polybag / BS, kualitas KW / Super / Super Plus) · Aktivitas per orang · Pengguna · Backup.

## SKU per kualitas

Laporan shift memetakan kualitas → SKU lewat kolom **Kualitas** di Master_Item:

| Kualitas | Biji plastik | Roll | Polybag | BS |
|---|---|---|---|---|
| KW | RM-BP-KW | WIP-ROLL-KW | FG-PB-KW | SCR-BS-KW |
| Super | RM-BP-SUP | WIP-ROLL-SUP | FG-PB-SUP | SCR-BS-SUP |
| Super Plus | RM-BP-SPL | WIP-ROLL-SPL | FG-PB-SPL | SCR-BS-SPL |

Tambah/ubah lewat Admin → SKU. Kalau satu kualitas belum lengkap, form laporan shift memberi tahu.

## Pengaturan penting (`Pengaturan`)

| Kunci | Arti |
|---|---|
| `BIAYA_PROSES_PER_KG` | biaya proses (tenaga, listrik, gas) per kg biji plastik masuk blowing — masuk HPP roll & COGS |
| `METODE_HPP` | `RATA` (rata-rata bergerak, bawaan) / `MASTER` (harga tetap Master_Item) |
| `MAKS_MUNDUR_HARI` / `MAKS_EDIT_HARI` | batas tanggal mundur transaksi / batas ubah entri |
| `LEAD_TIME_HARI` | lama pesan sampai datang — peringatan "perlu beli" |
| `SUSUT_CHASSEN_PERSEN` ± `TOLERANSI_CHASSEN_PERSEN` | standar susut di chassen |
| `WAJIB_PO` | `YA` = penerimaan harus merujuk PO |

Pengaturan diubah lewat rute admin (`cloudflare/README.md`) atau ekspor–impor database.

## Migrasi dari v9 / v10

**v10 → v10.1** (otomatis): laporan shift lama yang satu baris per mesin digabung jadi satu baris per tanggal+shift
(operator blowing / cutting terpisah), sheet lama disimpan sebagai `Laporan_Shift_lama`. Shift 3 lama tetap terbaca.

**v9 → v10** (otomatis saat request pertama setelah deploy v10): sheet `Pekerjaan`, `Pekerjaan_Detail`, `Master_Standar_Susut`
diarsipkan jadi `*_lama` (data lama tidak hilang, tidak dihitung), kolom `Kualitas` + SKU roll/polybag/BS ditambahkan,
`RM-BS-*` lama dinonaktifkan (BS sekarang `SCR-BS-*`), `METODE_HPP` FIFO → RATA, akun Manager Produksi & Sales Manager
ditambahkan. Sebelum dipakai sungguhan, Admin menjalankan `resetUntukGoLive` (rute `/admin/jalankan`) untuk membersihkan
data uji, lalu isi stok awal lewat opname.

## Yang belum ada

Offline mode · barcode · piutang/pembayaran (baru jatuh tempo) · lebih dari satu gudang · notifikasi.
