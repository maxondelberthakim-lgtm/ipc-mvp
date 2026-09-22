# IPC — Inventory & Production Control (v9)

Backend Google Sheets, frontend web app yang dibuka lewat browser HP.
Tidak ada server, tidak ada hosting, tidak ada aplikasi yang perlu di-install.

**Semua satuan kilogram.** Tidak ada pcs, tidak ada liter, tidak ada konversi.

---

## Alur lengkap

```
  SUPPLIER ──⓪ beli──►    GBJ  ◄──① pekerjaan: bahan baku keluar → barang jadi + scrap masuk (susut auto)
     ▲       + surat jalan  │  ▲
     └──↩ retur ke supplier─┘  └──♻ daur ulang: scrap → mesin chassen (pabrik lain) → biji plastik daur ulang
                            │  ▲
                            │  └──↩ retur dari customer
                            └──④ keluar (terjual)──►  CUSTOMER
                               + surat jalan / DO
```

**v9: hanya ada SATU gudang (GBJ).** Gudang produksi (GP) dan transfer ①/③ dihapus — pekerjaan memakai
bahan baku langsung dari gudang dan hasilnya langsung masuk gudang lagi.

| # | Proses | Foto | Surat jalan | Efek stok |
|---|---|---|---|---|
| ⓪ | Pembelian masuk | wajib | **wajib** + OCR | GBJ + |
| ↩ | Retur ke supplier | wajib | — | GBJ − |
| ① | Pekerjaan | opsional | — | bahan −, jadi + scrap + |
| ♻ | Daur ulang scrap (chassen) | opsional | opsional | scrap −, biji plastik daur ulang + |
| ④ | **Barang keluar (terjual)** | wajib | **wajib** (DO kamu) | **GBJ −** |
| ↩ | **Retur dari customer** | wajib | — | **GBJ +** |

⓪ ↩ ④ posting langsung lalu masuk **satu antrian review** supervisor.
① dan ♻ tidak butuh approval — dikontrol lewat laporan susut.

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
      − bahan baku dipakai pekerjaan + barang jadi + scrap
      − scrap ke chassen + biji plastik daur ulang − rusak (disetujui) ± opname
```

Selisih antara angka ini dan hitungan fisik = barang yang bergerak tanpa dicatat.

---

## Isi paket

| File | Jenis di Apps Script |
|---|---|
| `Config.gs` | Script — skema sheet, dummy data, `setupSistem()` |
| `Server.gs` | Script — pembelian, penjualan, retur, transfer, pekerjaan, susut, laporan, API JSON |
| `Pembelian.gs` | Script — migrasi skema, pesanan pembelian (PO), invoice, HPP FIFO, barang rusak, standar susut |
| `Media.gs` | Script — foto ke Drive + OCR surat jalan |
| `Index.html` | HTML — struktur layar |
| `Styles.html` | HTML — CSS |
| `Script.html` | HTML — logika front-end + i18n (ID/EN) |
| `appsscript.json` | Manifest — layanan Drive v2 + Sheets v4 (wajib untuk baca cepat) |
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
- **+ → Script** → **Pembelian** → paste `Pembelian.gs`
- **+ → Script** → **Penjualan** → paste `Penjualan.gs`
- **+ → Script** → **DaurUlang** → paste `DaurUlang.gs`
- **+ → HTML** → **Index** → hapus isi bawaan, paste `Index.html`
- **+ → HTML** → **Styles** → paste `Styles.html`
- **+ → HTML** → **Script** → paste `Script.html`

> Nama harus persis: `Index`, `Styles`, `Script` (tanpa `.html`).

### 4. Aktifkan Drive API (foto & OCR) dan Sheets API (baca cepat)
**Services → + → Drive API → Version: v2 →** Identifier biarkan `Drive` **→ Add**.
**Services → + → Google Sheets API → Version: v4 →** Identifier `Sheets` **→ Add**. Dengan ini semua tab dibaca dalam satu panggilan (±0,3 detik, bukan 2–3 detik). Kalau dilewat, aplikasi tetap jalan tapi lebih lambat.

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
| Who has access | **Anyone** (tanpa login Google — URL ini dipakai sebagai API JSON oleh aplikasi di GitHub Pages) |

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
3. Barang terjual, mau dikirim → **④ Barang keluar** → pilih customer → isi no. DO →
   foto barang / surat jalan → qty → Simpan. Stok GBJ langsung berkurang.
4. Barang dikembalikan customer → **↩ Retur dari customer** → stok GBJ bertambah lagi
5. Supplier / customer / item belum ada di daftar? Ketik namanya di kotak pencarian → **+ Tambah baru** →
   langsung terpilih (kode dibuat otomatis, nama yang sama tidak digandakan)

**Staff produksi**
1. **① Pekerjaan → Mulai baru** → pilih produk → isi bahan baku (kg, langsung dari gudang) → Mulai
2. Layar "Sedang dibuat" langsung menunjukkan **apa yang dibuat** dan **berapa kg** ada di dalamnya
3. Selesai → tap job → isi barang jadi + scrap → **Tutup & hitung susut** — hasilnya langsung ada di gudang
4. Hasilnya langsung tampil: total susut kg, %, dan **susutnya dari bahan apa**
5. Scrap menumpuk → **♻ Daur ulang scrap → Kirim scrap**: pilih tempat chassen (vendor), kg scrap, foto.
   Saat biji plastiknya kembali → tab *Di chassen* → tap batch → isi kg biji plastik yang diterima →
   **Terima & hitung susut**. Biaya jasa chassen diisi manager (staf tidak melihatnya).

**Supervisor / manager**
1. Isi nama + **PIN supervisor**
2. **Beranda → kalender** — titik warna per hari (hijau masuk, oranye keluar, ungu pekerjaan,
   merah susut tinggi) dan angka kg masuk. Ketuk tanggal → semua kejadian hari itu.
3. Tab **Review** — pembelian, penjualan, dan retur semuanya di satu antrian.
   Foto persis di sebelah angka. Untuk pembelian, selisih angka ketik vs OCR ditandai merah.
4. Tab **Laporan** → Susut / Stok / Beli / Jual / **Daur ulang** / **HPP** / Nilai stok / Std susut / Perlu beli / Ekspor
5. **♻ Daur ulang → Selesai**: isi **biaya jasa chassen** per batch (bisa belakangan). HPP biji plastik
   daur ulang = (nilai scrap FIFO + jasa) ÷ kg diterima, dan otomatis dipakai pekerjaan berikutnya.

---

## Yang perlu kamu isi sendiri

### `Master_Item`
| Kolom | Isi |
|---|---|
| `Kode_Item` | kode unik, bebas formatnya |
| `Nama_Item` | nama yang muncul di kotak pencarian HP |
| `Kategori` | `BAHAN_BAKU`, `BARANG_JADI`, atau `KEDUANYA` |
| `Harga_Per_Kg` | harga beli bahan baku per kg — dasar HPP. Kosongkan untuk barang jadi |
| `Stok_Awal` | stok pembuka dalam kg (boleh 0). v9: satu kolom — `Stok_Awal_GBJ` + `Stok_Awal_GP` lama digabung otomatis |
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

1. App menampilkan semua item dengan **stok sistem** — angka hasil hitungan dari seluruh transaksi.
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

- stok scrap **per produk** kelihatan di Laporan → Stok
- bisa **dijual lewat ④** seperti barang lain, atau **dikirim ke mesin chassen (♻)** jadi biji plastik daur ulang
- muncul di Admin → SKU dengan label *scrap*; kamu bisa isi `Harga_Per_Kg` kalau mau

Rumus susut tidak berubah: scrap tetap dikurangkan sebagai output, bukan susut.

## Riwayat input & edit

Di bawah setiap form (barang masuk, retur supplier, barang keluar, retur customer, transfer ①③)
ada **Riwayat input** — 14 hari terakhir untuk proses itu. Tab **Pekerjaan → Selesai** melakukan
hal yang sama untuk job yang sudah ditutup.

Tekan baris mana pun (atau kejadian di kalender beranda) → detailnya terbuka di layar besar.

| Siapa | Boleh mengubah |
|---|---|
| Staf | entri yang **dia catat sendiri** dan masih **MENUNGGU** — langsung tersimpan, tanpa usulan. Setelah disetujui/ditandai supervisor: hanya bisa dilihat 🔒 |
| Staf | job yang dia jalankan, dalam **24 jam** setelah ditutup |
| Supervisor / Admin | semua entri, status apa pun (termasuk yang sudah disetujui) |
| Siapa pun | **tidak** bisa mengubah entri lebih tua dari `MAKS_EDIT_HARI` (30 hari) — periode sudah ditutup |

Aturan itu ditegakkan di server, bukan cuma di layar. Entri yang tidak boleh diubah tampil 🔒 dengan alasannya.

Setiap perubahan dicatat di kolom `Log_Edit` (siapa, kapan, apa yang berubah — misal
`14/09 05:41 Yanto: qty: 500 → 510 kg`) dan tampil di form edit sebagai *Riwayat perubahan*.
Status **tidak** berubah karena edit: entri MENUNGGU yang diedit staf tetap MENUNGGU dan tetap
lewat review. Angka lama tidak ditimpa diam-diam.

Staf juga bisa **Batalkan input** untuk entrinya sendiri yang masih MENUNGGU (salah klik, dobel
input). Itu jadi DIBATALKAN — tercatat (`Ditinjau_Oleh: nama (sendiri)`), tidak dihitung di stok.

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
Hasil OCR **hanya saran**; yang tersimpan tetap angka yang diketik staff, dan selisihnya
muncul di antrian review.

**Stok bisa minus.** Disengaja. Stok minus artinya ada pergerakan yang tidak tercatat —
itu justru informasi yang kamu cari.

**Laporan → Stok** menampilkan saldo tiap item; ketuk namanya untuk membuka rincian
seperti buku kas — satu blok gudang, tiap baris jelas tanda plus/minusnya,
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

## Yang belum ada

- Offline mode (harus ada sinyal saat submit)
- Piutang / pelunasan customer (sales order sudah ada sejak v8)
- Barcode / QR (sesuai proposal: kamera saja)
- Multi-gudang (v9 sengaja satu gudang)
- Notifikasi push ke supervisor

## Versi 9 (satu gudang · search bar + tambah baru · daur ulang scrap)

- **Gudang produksi dihapus.** Tidak ada lagi Transfer ke Produksi / ke Gudang. Pekerjaan mengambil bahan baku
  langsung dari gudang (GBJ) dan barang jadi + scrap langsung masuk gudang. Laporan Stok jadi satu blok per item;
  opname & barang rusak tanpa pilihan lokasi. Data lama: `Stok_Awal_GP` digabung ke `Stok_Awal`, tab `Transfer`
  diganti nama `Transfer_lama` (tidak dihitung — transfer bolak-balik dalam satu gudang memang saling meniadakan).
  Semua otomatis lewat `migrasiSkema` saat versi baru pertama dipanggil.
- **Search bar + tambah baru** di semua kotak supplier / customer / item (penerimaan, barang keluar, PO, SO,
  pekerjaan, rusak, daur ulang, ubah entri): ketik untuk mencari; kalau belum ada, tekan **+ Tambah baru** — langsung
  tersimpan di master & terpilih. Boleh dilakukan semua peran. Kode otomatis: `SUP-00n`, `CUS-00n`, item
  `RM-…` (bahan baku) / `FG-…` (barang jadi) dari nama. Nama yang sama (huruf besar/kecil diabaikan) tidak
  digandakan; SKU nonaktif dengan nama itu diaktifkan lagi. Scrap tidak bisa ditambah manual (dibuat otomatis
  oleh pekerjaan).
- **Daur ulang scrap (♻)** — pabrik tidak punya mesin chassen, jadi scrap dikirim ke pabrik lain:
  1. **Kirim scrap** (staf): vendor (dari daftar supplier, bisa tambah baru), tanggal, no. surat jalan (opsional),
     kg scrap per SKU scrap, foto. Stok scrap berkurang; batch berstatus *Di chassen*.
  2. **Terima** (staf/manager): kg biji plastik daur ulang yang kembali (SKU bahan baku, mis. `RM-BP-DU`; bisa
     tambah baru), tanggal terima, foto. **Susut chassen = scrap dikirim − biji plastik diterima**, status
     NORMAL / TINGGI / ANOMALI menurut Pengaturan `SUSUT_CHASSEN_PERSEN` (5) ± `TOLERANSI_CHASSEN_PERSEN` (3).
  3. **Biaya jasa** (Manager/Admin saja, saat terima atau belakangan dari tab *Selesai*): HPP biji plastik
     daur ulang = (nilai scrap FIFO + jasa) ÷ kg diterima → masuk mesin FIFO, jadi pekerjaan yang memakai biji
     daur ulang menghitung HPP-nya benar. Staf tidak pernah menerima angka jasa/HPP (log edit pun disaring).
  4. Batal: staf hanya batch sendiri yang masih di chassen; manager kapan saja (stok kembali seperti semula).
  Laporan → **Daur ulang** (total, per vendor, per batch), kalender (kirim/terima), ekspor bulanan file
  `daur_ulang_YYYY-MM.csv`, kotak *Daur ulang scrap* di beranda dengan jumlah batch yang sedang di chassen.
- Tab baru: `Daur_Ulang`, `Daur_Ulang_Detail`. Pengaturan baru: `SUSUT_CHASSEN_PERSEN`, `TOLERANSI_CHASSEN_PERSEN`.
  File script baru: `DaurUlang.gs`. Ekspor bulanan sekarang 7 file.

## Versi 8 (sales order · ekspor keuangan · backup · beranda yang bisa ditekan)

- **Beranda**: kotak angka (kg masuk/keluar hari ini, sedang diproses, menunggu review, susut tinggi) bisa **ditekan** → kalender langsung memfilter kejadian hari ini. Tombol **↻** menyegarkan data; buka app lagi setelah > 30 detik juga menyegarkan otomatis — jadi HP staf dan manager melihat angka yang sama tanpa login ulang.
- **Kirim hari ini** (semua peran): sales order yang jatuh tempo hari ini / terlambat. Tekan → form Barang keluar sudah terisi dari SO itu.
- **Barang akan datang** (semua peran): PO yang belum lengkap diterima, dengan perkiraan tanggal datang & spesifikasi — tanpa harga.
- **Perlu beli** (Manager; kotak *Bahan perlu dibeli* di beranda + Laporan → Perlu beli): pemakaian rata-rata 30 hari terakhir vs stok sekarang & PO yang jalan. `LEAD_TIME_HARI` (Pengaturan, default 7) = berapa hari barang pesanan biasanya datang. Status PERLU BELI / PO JALAN / AMAN, saran jumlah beli, tombol *Buat PO*.
- **Sales order** (Beranda → Sales order, Manager/Admin): customer, item, kg, harga jual/kg, tanggal kirim. Status TERBUKA → SEBAGIAN → SELESAI / DIBATALKAN. Stok yang sudah dipesan tampil sebagai *dipesan* di form barang keluar. Staf memilih SO saat mengirim; qty tidak boleh melebihi sisa SO; customer harus sama. **Harga jual & HPP hanya terlihat oleh Manager/Admin — server tidak pernah mengirimnya ke staf.**
- **Ekspor bulanan** (Laporan → Ekspor, Manager/Admin): pilih bulan → 6 file CSV (ringkasan, pembelian, penjualan, produksi, rusak, nilai stok) — buka di Excel, pisah kolom `;`. Laba kotor hanya dihitung untuk pengiriman yang merujuk SO (ada harga jual).
- **Backup otomatis**: jalankan `pasangBackupHarian()` sekali dari editor Apps Script (pemilik Sheet) → tiap jam 02:00 Sheet disalin ke folder Drive **IPC Backup**, 30 salinan terakhir disimpan. Status di Admin → Backup. Kalau ada data yang terhapus/rusak: buka salinan di folder itu, salin tab yang rusak kembali ke Sheet utama (klik kanan nama tab → *Salin ke → Spreadsheet yang ada*), lalu hapus tab lama & ganti namanya.
- Pengaturan baru: `MAKS_EDIT_HARI` (30), `LEAD_TIME_HARI` (7). Tab baru: `Sales_Order`; kolom baru `Pengiriman.ID_SO`. Semua dibuat otomatis oleh `migrasiSkema` saat versi baru pertama dipanggil.

## Versi 7 (PO → penerimaan → invoice → HPP FIFO)

- **Pesanan pembelian** dibuat Manager (Beranda → Pesanan pembelian): item, kg, harga beli/kg, spesifikasi, perkiraan datang. Status TERBUKA → SEBAGIAN → SELESAI / DIBATALKAN.
- **Penerimaan barang** (nama baru "Barang masuk"): staf memilih PO yang datang; item & spesifikasi terisi, sisa PO tampil, ada Catatan QC. Tanpa PO tetap boleh (`WAJIB_PO = TIDAK`).
- **Retur ke supplier** hanya dari penerimaan yang sudah tercatat ("bisa diretur X kg").
- **Invoice**: Manager mengunggah invoice per PO → dibandingkan dengan Σ(kg diterima × harga PO) → Tandai VALID, harga bisa dikoreksi per item → batch & HPP ikut.
- **HPP FIFO** (`METODE_HPP = FIFO`): batch per penerimaan; transfer, pekerjaan, penjualan, rusak memakai batch tertua. Laporan → Nilai stok. Tombol *Hitung ulang HPP* di tab Invoice.
- **Barang rusak**: staf lapor (lokasi, item, kg, penyebab, foto) → Manager setujui di Review → Rusak → stok berkurang, kerugian dihitung FIFO.
- **Standar susut per produk**: Laporan → Std susut → *Jadikan standar*.
- Skema sheet diperbarui otomatis (`migrasiSkema`) saat versi baru pertama dipanggil; `resetUntukGoLive` juga membersihkan tab v7.

---

## Kalau ada masalah

| Gejala | Penyebab |
|---|---|
| "Sheet ... belum ada" | `setupSistem()` belum dijalankan |
| Tombol OCR tidak muncul | Drive API v2 belum di-add, atau kamu sedang di layar retur (memang tidak ada) |
| "No. surat jalan wajib diisi" | Itu di pembelian masuk & barang keluar — retur tidak butuh |
| Mau barang keluar tanpa nomor DO | Tab `Pengaturan` → `WAJIB_SJ_KELUAR` → `TIDAK` |
| Stok minus setelah jual | Barang keluar lebih banyak dari yang pernah masuk — cek pekerjaan yang belum ditutup / penerimaan yang belum dicatat |
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
| Stok scrap minus | Scrap dikirim ke chassen lebih banyak dari yang dicatat keluar dari pekerjaan — cek angka scrap saat tutup pekerjaan |
| Nama supplier/item tidak ada di daftar | Ketik namanya di kotak pencarian → **+ Tambah baru** |
| HPP biji plastik daur ulang = 0 | Biaya jasa belum diisi — Manager: ♻ Daur ulang → Selesai → *Isi biaya jasa* |


### 8. Aplikasi di GitHub Pages (yang dipakai staf)
Tampilan aplikasi TIDAK dibuka dari URL Apps Script (lambat, minta login Google). Ia di-hosting statis di
GitHub Pages dan memanggil URL `/exec` di atas sebagai API JSON.

1. Tulis URL `/exec` ke `tools/api-url.txt`
2. `python3 tools/build-app.py` → menghasilkan `docs/app/` (index.html, manifest, service worker, ikon)
3. Commit & push; GitHub Pages sudah menyajikan `/docs` → aplikasi ada di `https://<owner>.github.io/<repo>/app/`
4. Staf buka link itu di Chrome → ⋮ → *Add to Home screen*. Login Nama + PIN. Tombol **Keluar** untuk ganti akun.

Kalau URL `/exec` berubah (mis. setelah transfer ownership), ulangi langkah 1–3; link aplikasi staf tetap sama.

### 9. Data master untuk go-live
Daftar SKU sebenarnya ada di `DUMMY_ITEM` (Config.gs). Jalankan **`resetUntukGoLive()`** sekali dari editor:
menghapus semua transaksi uji coba dan mengisi ulang Master_Item / Supplier / Customer / Standar_Susut.
Setelah itu ubah SKU lewat menu Admin → SKU, jangan seed ulang.
