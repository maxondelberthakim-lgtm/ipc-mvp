# IPC — Inventory & Production Control (MVP v6)

Backend Google Sheets, frontend web app yang dibuka lewat browser HP.
Tidak ada server, tidak ada hosting, tidak ada aplikasi yang perlu di-install.

**Semua satuan kilogram.** Tidak ada pcs, tidak ada liter, tidak ada konversi.

---

## Alur lengkap

```
                            ┌──① transfer──►  GP
                            │                  │
  SUPPLIER ──⓪ beli──►    GBJ              ② pekerjaan
     ▲       + surat jalan  │  ▲          bahan → jadi + scrap
     └──↩ retur ke supplier─┘  └──③ transfer──┘   susut auto
                            │  ▲
                            │  └──↩ retur dari customer
                            └──④ keluar (terjual)──►  CUSTOMER
                               + surat jalan / DO
```

| # | Proses | Foto | Surat jalan | Efek stok |
|---|---|---|---|---|
| ⓪ | Pembelian masuk | wajib | **wajib** + OCR | GBJ + |
| ↩ | Retur ke supplier | wajib | — | GBJ − |
| ① | Transfer ke produksi | wajib | — | GBJ − , GP + |
| ② | Pekerjaan | opsional | — | GP: bahan −, jadi + scrap + |
| ③ | Transfer ke gudang | wajib | — | GP − , GBJ + |
| ④ | **Barang keluar (terjual)** | wajib | **wajib** (DO kamu) | **GBJ −** |
| ↩ | **Retur dari customer** | wajib | — | **GBJ +** |

⓪ ↩ ① ③ ④ semuanya posting langsung lalu masuk **satu antrian review** supervisor.
② tidak butuh approval — dikontrol lewat laporan susut.

### Tiga keputusan di antrian review

| Aksi | Artinya | Dihitung di stok? |
|---|---|---|
| **Setuju** | Final. Selesai. | Ya |
| **Tandai** | Diarsipkan ke tab *Ditandai* untuk dicek/direvisi nanti. Kejadiannya nyata, cuma angkanya perlu dikonfirmasi. | **Ya** |
| **Batal** | Salah input / dobel. Dianggap tidak pernah terjadi. | **Tidak** |

Dari tab *Ditandai*, setelah dibetulkan: **Setuju** untuk menutup, atau **Batal** kalau memang salah.
Setuju dan Batal itu final — tidak bisa diubah lagi lewat app (edit langsung di Sheet kalau terpaksa).

Dengan ⓪ dan ④ lengkap, stok GBJ jadi persamaan tertutup:

```
GBJ = stok awal + beli − retur supplier + retur customer − keluar terjual
              − transfer ke GP + transfer balik dari GP
```

Selisih antara angka ini dan hitungan fisik = barang yang bergerak tanpa dicatat.

---

## Isi paket

| File | Jenis di Apps Script |
|---|---|
| `Config.gs` | Script — skema sheet, dummy data, `setupSistem()` |
| `Server.gs` | Script — pembelian, penjualan, retur, transfer, pekerjaan, susut, laporan |
| `Media.gs` | Script — foto ke Drive + OCR surat jalan |
| `Index.html` | HTML — struktur layar |
| `Styles.html` | HTML — CSS |
| `Script.html` | HTML — logika front-end + i18n (ID/EN) |
| `appsscript.json` | Manifest — opsional |
| `app-demo.html` | Demo offline — buka langsung di browser, tanpa deploy |

---

## Setup (sekali, ±15 menit)

### 1. Buat Sheet
Google Sheet baru, kasih nama **IPC — Inventory & Production Control**.

### 2. Buka editor script
**Extensions → Apps Script**.

### 3. Masukkan file
Panel kiri (Files):

- `Code.gs` bawaan → rename jadi **Config**, hapus isinya, paste `Config.gs`
- **+ → Script** → **Server** → paste `Server.gs`
- **+ → Script** → **Media** → paste `Media.gs`
- **+ → HTML** → **Index** → hapus isi bawaan, paste `Index.html`
- **+ → HTML** → **Styles** → paste `Styles.html`
- **+ → HTML** → **Script** → paste `Script.html`

> Nama harus persis: `Index`, `Styles`, `Script` (tanpa `.html`).

### 4. Aktifkan Drive API (untuk OCR surat jalan)
**Services → + → Drive API → Version: v2 →** Identifier biarkan `Drive` **→ Add**.

Kalau dilewat, aplikasi tetap jalan — hanya tombol "Baca surat jalan" yang mati.

### 5. Jalankan setup
Simpan. Dropdown fungsi → **`setupSistem`** → **Run**.
Izinkan: **Review permissions → pilih akun → Advanced → Go to (nama project) → Allow**.
(Peringatan "unverified app" normal — ini script milik akun kamu sendiri.)

Cek Sheet: 13 tab sudah ada — `Master_Item`, `Master_Supplier`, dan `Master_Customer` terisi dummy.

### 6. Akun awal & PIN
Tab **`Master_Pengguna`** terisi 4 akun awal:

| Nama | PIN | Peran | Bisa apa |
|---|---|---|---|
| **Admin** | `1234` | ADMIN | semua + kelola pengguna |
| **Direktur** | `2468` | ADMIN | semua + kelola pengguna |
| **Manager** | `1357` | SUPERVISOR | review pindahan, HPP, opname, SKU, edit semua entri |
| **Staff Gudang** | `1111` | STAF | input pergerakan barang, edit entri sendiri yang menunggu |

**Ganti PIN-nya sebelum staf beneran pakai** — lewat app: Admin → Pengguna → ✎. Tambah orang
sungguhan di situ juga (satu akun per orang, bukan satu akun "Staff Gudang" dipakai ramai-ramai —
kalau tidak, riwayat per orang jadi tidak ada artinya).
**Semua orang login dengan Nama + PIN**, termasuk kamu sebagai pemilik Sheet (setting
`PAKSA_LOGIN_MANUAL = YA`). Akun yang belum punya PIN tidak bisa masuk. Nama yang tidak
terdaftar ditolak (`AKSES_TERBUKA = TIDAK`); ubah ke `YA` hanya untuk masa uji coba.
Baris pertama `Master_Pengguna` (email Google-mu) hanya dipakai kalau `PAKSA_LOGIN_MANUAL = TIDAK`.

`PIN_SUPERVISOR` di `Pengaturan` cuma PIN darurat untuk nama yang *belum terdaftar* saat
`AKSES_TERBUKA = YA` — tidak bisa dipakai untuk masuk sebagai user yang sudah ada.

### 7. Deploy
**Deploy → New deployment → ⚙ → Web app**

| Field | Isi |
|---|---|
| Execute as | **Me (email kamu)** |
| Who has access | **Anyone with a Google account** |

**Deploy** → copy **Web app URL**.

> "Execute as: Me" penting: staff bisa pakai aplikasi tanpa akses apa pun ke Sheet-nya.

### 8. Kirim ke HP staff
Kirim link via WhatsApp. Di HP: buka link → menu browser → **Add to Home screen**.

---

## Pakai sehari-hari

**Staff gudang (GBJ)**
1. Truk supplier datang → **⓪ Barang masuk** → pilih supplier → foto surat jalan →
   🔍 **Baca surat jalan** (OCR isi no. SJ + saran qty) → ketik qty asli hasil timbang → Simpan
2. Barang tidak sesuai → **↩ Retur ke supplier** → stok GBJ langsung berkurang
3. Kirim bahan ke produksi → **① Transfer ke Produksi**
4. Barang terjual, mau dikirim → **④ Barang keluar** → pilih customer → isi no. DO →
   foto barang / surat jalan → qty → Simpan. Stok GBJ langsung berkurang.
5. Barang dikembalikan customer → **↩ Retur dari customer** → stok GBJ bertambah lagi

**Staff produksi (GP)**
1. **② Pekerjaan → Mulai baru** → pilih produk → isi bahan baku (kg) → Mulai
2. Layar "Sedang dibuat" langsung menunjukkan **apa yang dibuat** dan **berapa kg** ada di dalamnya
3. Selesai → tap job → isi barang jadi + scrap → **Tutup & hitung susut**
4. Hasilnya langsung tampil: total susut kg, %, dan **susutnya dari bahan apa**
5. Kirim balik ke gudang → **③ Transfer ke Gudang**

**Supervisor / manager**
1. Isi nama + **PIN supervisor**
2. **Beranda → kalender** — titik warna per hari (hijau masuk, oranye keluar, ungu pekerjaan,
   merah susut tinggi) dan angka kg masuk. Ketuk tanggal → semua kejadian hari itu.
3. Tab **Review** — pembelian, penjualan, retur, dan transfer semuanya di satu antrian.
   Foto persis di sebelah angka. Untuk pembelian, selisih angka ketik vs OCR ditandai merah.
4. Tab **Laporan** → Susut / Stok / Beli / Jual / Transfer / **HPP**

---

## Yang perlu kamu isi sendiri

### `Master_Item`
| Kolom | Isi |
|---|---|
| `Kode_Item` | kode unik, bebas formatnya |
| `Nama_Item` | nama yang muncul di dropdown HP |
| `Kategori` | `BAHAN_BAKU`, `BARANG_JADI`, atau `KEDUANYA` |
| `Harga_Per_Kg` | harga beli bahan baku per kg — dasar HPP. Kosongkan untuk barang jadi |
| `Stok_Awal_GBJ` / `Stok_Awal_GP` | stok pembuka dalam kg (boleh 0) |
| `Aktif` | `YA` / `TIDAK` |

Tidak ada kolom satuan — semuanya kg. Scrap pakai `KEDUANYA`.

### `Master_Supplier` dan `Master_Customer`
Sama bentuknya: `Kode` · `Nama` · `Keterangan` · `Aktif`.
Nama di sini yang muncul di dropdown — supplier untuk pembelian & retur ke supplier,
customer untuk barang keluar & retur dari customer.

### `Master_Standar_Susut`
Ini yang bikin flag susut berguna:

| Kolom | Contoh |
|---|---|
| `Kode_Produk` | `FG-MM-CSW` |
| `Susut_Normal_Persen` | `4.0` |
| `Toleransi_Persen` | `1.5` |

Job ditandai **TINGGI** kalau susut lewat `normal + toleransi` (contoh: > 5,5%).
Produk tanpa baris di sini pakai default 3% + 1,5%.

> Saran: pilot 2–3 minggu dulu tanpa terlalu peduli flag, lalu isi angka ini dari
> susut yang beneran kejadian. Standar tebakan cuma bikin alarm palsu.

### `Master_Pengguna`
| Kolom | Isi |
|---|---|
| `Email` | email Google staff — **kosongkan** kalau mereka pakai Gmail pribadi |
| `Nama` | nama yang muncul di dropdown identitas |
| `Peran` | `STAF`, `SUPERVISOR`, atau `ADMIN` |

Kalau `Nama` di sini cocok dengan nama yang dipilih staff di HP, perannya ikut baris ini —
supervisor tidak perlu PIN lagi.

---

## Login: nama + PIN per orang

Setiap orang punya baris di `Master_Pengguna` dengan **PIN sendiri** (4–8 angka). Di HP, staf
pilih nama lalu ketik PIN — kalau salah, ditolak. Jadi riwayat input benar-benar per orang:
Yanto tidak bisa input atas nama Sri.

| Peran | Bisa apa |
|---|---|
| `STAF` | input semua pergerakan, edit entri sendiri yang masih menunggu |
| `SUPERVISOR` | + review, HPP, stock opname, kelola SKU, aktivitas staf |
| `ADMIN` | + kelola pengguna (tambah, ubah peran, reset PIN, nonaktifkan) |

Admin terakhir yang aktif tidak bisa diturunkan atau dinonaktifkan — supaya tidak terkunci dari luar.

## Menu Admin (Supervisor / Admin)

**Opname** — stock opname. Cara kerjanya:

1. Pilih lokasi (GBJ atau GP). App menampilkan semua item dengan **stok sistem** — angka hasil hitungan
   dari seluruh transaksi.
2. Hitung barang yang benar-benar ada di rak, isi di kolom **Fisik**. Item yang tidak dihitung, kosongkan.
3. Simpan. Selisih (fisik − sistem) tersimpan di tab `Stock_Opname` sebagai **penyesuaian**:
   stok sistem langsung = angka fisik, dan selisihnya tercatat siapa yang menghitung, kapan, catatan apa.
4. Di neraca stok per item (Laporan → Stok), penyesuaian ini muncul sebagai baris sendiri —
   tidak disembunyikan di angka lain.

Yang perlu kamu tahu: opname **tidak menghapus** transaksi apa pun. Kalau selisih minus muncul
berulang di item yang sama, itu bukan salah hitung — ada pergerakan yang tidak dicatat, dan sekarang
kamu punya tanggal dan besarnya.

**SKU** — tambah / ubah / hapus item dari HP, tanpa buka Sheet. Hapus = benar-benar dihapus kalau
belum pernah dipakai; kalau sudah ada transaksinya, dinonaktifkan (hilang dari dropdown, riwayat tetap
utuh). Kode SKU yang sudah dipakai tidak bisa diganti. Stok awal di sini hanya berlaku sebelum opname
pertama — untuk mengisi "stok sebenarnya berapa", pakai opname.

**Aktivitas** — siapa input apa, 30 hari terakhir. Per orang: jumlah entri, kg, jenis, terakhir aktif,
dan daftar kejadiannya. Karena login pakai PIN, angka ini bisa dipercaya per orang.

**Pengguna** (Admin saja) — tambah user, ubah peran, ganti/hapus PIN, nonaktifkan.

## Scrap

Scrap **tidak lagi** pakai SKU generik. Saat pekerjaan ditutup, kamu isi satu angka: scrap berapa kg.
Sistem otomatis membuat SKU `SCR-<kode produk>` (mis. `SCR-FG-MM-CSW` = "Scrap · Mete Panggang Mete
Panggang") kalau belum ada, dan mencatat scrap-nya di situ. Akibatnya:

- stok scrap **per produk** kelihatan di Laporan → Stok (di GP, karena lahirnya di produksi)
- bisa ditransfer ③ ke GBJ lalu **dijual lewat ④** seperti barang lain
- muncul di Admin → SKU dengan label *scrap*; kamu bisa isi `Harga_Per_Kg` kalau mau

Rumus susut tidak berubah: scrap tetap dikurangkan sebagai output, bukan susut.

## Riwayat input & edit

Di bawah setiap form (barang masuk, retur supplier, barang keluar, retur customer, transfer ①③)
ada **Riwayat input** — 14 hari terakhir untuk proses itu. Tab **Pekerjaan → Selesai** melakukan
hal yang sama untuk job yang sudah ditutup.

| Siapa | Boleh mengubah |
|---|---|
| Staf | hanya entri yang **dia catat sendiri** dan masih **MENUNGGU** — belum disentuh supervisor |
| Staf | job yang dia jalankan, dalam **24 jam** setelah ditutup |
| Supervisor / Admin | semua entri, status apa pun (termasuk dari tab Review → Ditandai) |

Aturan itu ditegakkan di server, bukan cuma di layar. Entri yang tidak boleh diubah tampil 🔒 *Terkunci*.

Setiap perubahan dicatat di kolom `Log_Edit` (siapa, kapan, apa yang berubah — misal
`14/09 05:41 Yanto: qty: 500 → 510 kg`) dan tampil di form edit sebagai *Riwayat perubahan*.
Status **tidak** berubah karena edit: entri MENUNGGU yang diedit staf tetap MENUNGGU dan tetap
lewat review. Angka lama tidak ditimpa diam-diam.

Staf juga bisa **Batalkan input** untuk entrinya sendiri yang masih MENUNGGU (salah klik, dobel
input). Itu jadi DIBATALKAN — tercatat, tidak dihitung di stok.

Mengubah pekerjaan yang sudah selesai → susut, HPP, dan nilai susut **dihitung ulang** dengan
harga bahan saat ini; baris `Pekerjaan_Detail` lama diganti.

## HPP (harga pokok produksi)

```
HPP bahan   = Σ (kg bahan baku × Harga_Per_Kg)     ← harga disalin saat job DIMULAI
HPP proses  = total kg bahan baku × BIAYA_PROSES_PER_KG   (tab Pengaturan)
HPP total   = HPP bahan + HPP proses
HPP per kg  = HPP total ÷ kg barang jadi
Nilai susut = kg susut × harga rata-rata bahan baku job itu
```

**Siapa yang lihat:** hanya peran `SUPERVISOR` dan `ADMIN`. Anak gudang (`STAF`) tidak pernah
menerima angka harga atau HPP dari server — bukan cuma disembunyikan di layar, memang tidak dikirim.
Sheet-nya sendiri tetap menyimpan HPP untuk semua job, siapa pun yang input.

Harga disalin ke `Pekerjaan_Detail` saat job dimulai, jadi kalau `Harga_Per_Kg` nanti diubah,
HPP job lama tidak ikut berubah. `BIAYA_PROSES_PER_KG` default 2.500 — isi angka kamu sendiri
(tenaga, gas, listrik dibagi kg bahan yang diproses).

## Rumus susut

```
SUSUT = Bahan Baku Masuk − Barang Jadi − Scrap     (kg)
%     = SUSUT / Bahan Baku Masuk × 100
```

| Status | Kapan |
|---|---|
| `NORMAL` | ≤ standar + toleransi |
| `TINGGI` | > standar + toleransi |
| `ANOMALI` | susut negatif — barang keluar melebihi yang masuk (salah input) |

### Susutnya dari bahan apa

Laporan Susut menampilkan **total susut** periode, lalu memecahnya per bahan baku.
Susut tiap job dibagi ke bahan bakunya **proporsional terhadap kg masuk**:

- Job satu bahan (mete 300 kg → susut 12 kg) → **angka persis**
- Job banyak bahan (kacang 200 + minyak 60 + bumbu 10 = 270 kg, susut 27 kg)
  → kacang 20 kg, minyak 6 kg, bumbu 1 kg — **perkiraan**, bukan pengukuran

Alokasi proporsional itu asumsi, bukan fakta. Kalau kamu curiga satu bahan menyusut jauh
lebih banyak dari yang lain, pisahkan jadi job terpisah selama beberapa hari — angkanya
langsung jadi persis.

---

## Catatan penting

**Foto** disimpan di folder Drive **`IPC Foto Bukti`** milik akun kamu, di-resize di HP
(maks 1400px, JPEG 72%) supaya hemat kuota staff.

**OCR** cuma dipakai di pembelian masuk — di situlah ada surat jalan dari luar.
Transfer internal GBJ↔GP tidak pakai surat jalan sama sekali, cukup foto + timestamp.
Hasil OCR **hanya saran**; yang tersimpan tetap angka yang diketik staff, dan selisihnya
muncul di antrian review.

**Stok bisa minus.** Disengaja. Stok minus artinya ada pergerakan yang tidak tercatat —
itu justru informasi yang kamu cari.

**Laporan → Stok** menampilkan saldo tiap item; ketuk namanya untuk membuka rincian
seperti buku kas — dua blok terpisah (GBJ dan GP), tiap baris jelas tanda plus/minusnya,
dan berakhir di saldo. Kalau ada angka yang kelihatan aneh, blok itu langsung menunjukkan
baris mana penyebabnya.

**Entri yang dibatalkan dikeluarkan dari perhitungan stok.** Entri yang *ditandai* tetap dihitung —
itu arsip untuk dicek, bukan pembatalan.

**Surat jalan barang keluar** itu DO yang kamu terbitkan sendiri, jadi tidak ada OCR —
staff mengetik nomornya. Kalau kamu belum pakai penomoran DO, matikan lewat tab
`Pengaturan` → `WAJIB_SJ_KELUAR` → isi `TIDAK`.

**Sistem ini murni kuantitas (kg), bukan nilai rupiah.** Barang keluar dicatat sebagai
pergerakan stok, bukan sebagai invoice. Kalau nanti perlu nilai penjualan, angka kg per
customer di tab Jual bisa langsung di-VLOOKUP ke daftar harga di sheet terpisah.

**Update kode nanti:** paste versi baru → Deploy → **Manage deployments** → ✏️ →
Version: **New version** → Deploy. Link di HP staff tidak berubah.

---

## Yang belum ada di MVP

- Offline mode (harus ada sinyal saat submit)
- Harga / nilai rupiah — sistem ini murni kuantitas kg
- Invoice, piutang, dan pemenuhan pesanan (PO/SO)
- Barcode / QR (sesuai proposal: kamera saja)
- Validasi stok yang memblokir input
- Multi-gudang di luar GBJ / GP
- Notifikasi push ke supervisor

---

## Kalau ada masalah

| Gejala | Penyebab |
|---|---|
| "Sheet ... belum ada" | `setupSistem()` belum dijalankan |
| Tombol OCR tidak muncul | Drive API v2 belum di-add, atau kamu sedang di layar retur (memang tidak ada) |
| "No. surat jalan wajib diisi" | Itu di pembelian masuk & barang keluar — retur tidak butuh |
| Mau barang keluar tanpa nomor DO | Tab `Pengaturan` → `WAJIB_SJ_KELUAR` → `TIDAK` |
| Stok GBJ minus setelah jual | Barang keluar lebih banyak dari yang pernah masuk — cek transfer balik dari GP |
| Foto tidak muncul di antrian review | Domain melarang link-sharing — buka lewat link di tab Riwayat |
| Staff tidak diminta nama | Akunnya satu domain Workspace — email kebaca otomatis, ini normal |
| "PIN salah untuk …" | Nama itu sudah punya PIN di `Master_Pengguna` — tanya admin |
| "Akun … dinonaktifkan" | Admin menonaktifkan user ini — Admin → Pengguna → aktifkan lagi |
| Antrian review tidak muncul | Peran bukan SUPERVISOR / ADMIN |
| Tab Admin tidak ada | Sama — STAF tidak punya menu Admin |
| Tab Pengguna tidak ada di Admin | Hanya ADMIN yang lihat; SUPERVISOR tidak |
| Tab HPP tidak muncul | Sama — HPP hanya untuk SUPERVISOR / ADMIN |
| HPP job = 0 | `Harga_Per_Kg` bahan bakunya kosong di `Master_Item` |
| "Entri ini sudah final" | Setuju / Batal tidak bisa diubah statusnya lagi — tapi supervisor masih bisa mengubah angkanya lewat Ubah |
| Tombol Ubah tidak ada, cuma 🔒 | Bukan entri kamu, atau sudah ditinjau — minta supervisor |
| Stok GP minus | Pekerjaan memakai lebih banyak dari yang ditransfer — cek transfer yang belum dicatat |
