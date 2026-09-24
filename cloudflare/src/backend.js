/* DIBUAT OTOMATIS oleh tools/build-cf.py — jangan diedit; ubah apps-script/*.gs lalu jalankan ulang. */
/* eslint-disable */
export function pasangBackend(G) {
  var SpreadsheetApp = G.SpreadsheetApp, LockService = G.LockService, Utilities = G.Utilities, Session = G.Session, DriveApp = G.DriveApp, PropertiesService = G.PropertiesService, CacheService = G.CacheService, ScriptApp = G.ScriptApp, HtmlService = G.HtmlService, ContentService = G.ContentService, DocumentApp = G.DocumentApp, Logger = G.Logger, Sheets = G.Sheets;
  var console = G.console;
  /* doPost() memakai globalThis[fn]; di sini "globalThis" = peta fungsi backend (bukan global Worker) */
  var globalThis = { setupSistem: setupSistem, seedJika: seedJika, seedUlangMaster: seedUlangMaster, resetUntukGoLive: resetUntukGoLive, ambilAtauBuatFolder_: ambilAtauBuatFolder_, doGet: doGet, include: include, doPost: doPost, jsonOut_: jsonOut_, ss_: ss_, sheet_: sheet_, lupakanMemo_: lupakanMemo_, salinBaris_: salinBaris_, baca_: baca_, offsetZonaMs_: offsetZonaMs_, serialKeDate_: serialKeDate_, bacaSemuaBatch_: bacaSemuaBatch_, bacaSheet_: bacaSheet_, tambah_: tambah_, ubahBaris_: ubahBaris_, getSetting_: getSetting_, setSetting_: setSetting_, catatLog_: catatLog_, emailAktif_: emailAktif_, tglStr_: tglStr_, tglValid_: tglValid_, buatId_: buatId_, angka_: angka_, bulat_: bulat_, jam_: jam_, penggunaSaatIni_: penggunaSaatIni_, bolehReview_: bolehReview_, bolehAdmin_: bolehAdmin_, bolehLihatHpp_: bolehLihatHpp_, dihitung_: dihitung_, biayaProsesPerKg_: biayaProsesPerKg_, mataUang_: mataUang_, petaItem_: petaItem_, skuScrapUntuk_: skuScrapUntuk_, tambahMaster: tambahMaster, getKonteks: getKonteks, simpanPenerimaan: simpanPenerimaan, simpanPengiriman: simpanPengiriman, mulaiPekerjaan: mulaiPekerjaan, selesaikanPekerjaan: selesaikanPekerjaan, hitungSusut_: hitungSusut_, standarSusut_: standarSusut_, rincianSusutJob_: rincianSusutJob_, daftarPekerjaanBerjalan: daftarPekerjaanBerjalan, antrianReview: antrianReview, tinjauTransfer: tinjauTransfer, tinjauMassal: tinjauMassal, laporanSusut: laporanSusut, hitungStokSemua_: hitungStokSemua_, laporanStok: laporanStok, riwayatPenerimaan: riwayatPenerimaan, laporanPenjualan: laporanPenjualan, penandaPencatat_: penandaPencatat_, maksEditHari_: maksEditHari_, umurHari_: umurHari_, dalamBatasEdit_: dalamBatasEdit_, alasanKunci_: alasanKunci_, bolehEditEntri_: bolehEditEntri_, sheetDariId_: sheetDariId_, ringkasEntri_: ringkasEntri_, riwayatInput: riwayatInput, ambilEntri: ambilEntri, susunEdit_: susunEdit_, cariEntri_: cariEntri_, terapkanEdit_: terapkanEdit_, simpanEditEntri: simpanEditEntri, pesanKunci_: pesanKunci_, batalkanEntriSendiri: batalkanEntriSendiri, ajukanPermintaan_: ajukanPermintaan_, permintaanTertunda_: permintaanTertunda_, daftarPermintaan: daftarPermintaan, tinjauPermintaan: tinjauPermintaan, alasanKunciJob_: alasanKunciJob_, bolehEditJob_: bolehEditJob_, daftarPekerjaanSelesai: daftarPekerjaanSelesai, ambilPekerjaan: ambilPekerjaan, simpanEditPekerjaan: simpanEditPekerjaan, daftarPengguna: daftarPengguna, simpanPengguna: simpanPengguna, aktivitasStaf: aktivitasStaf, daftarSku: daftarSku, skuDipakai_: skuDipakai_, simpanSku: simpanSku, hapusSku: hapusSku, siapkanOpname: siapkanOpname, simpanOpname: simpanOpname, riwayatOpname: riwayatOpname, kalender: kalender, laporanHpp: laporanHpp, dataUrlKeBlob_: dataUrlKeBlob_, unggahFoto_: unggahFoto_, unggahFoto: unggahFoto, ocrSuratJalan: ocrSuratJalan, parseSuratJalan_: parseSuratJalan_, normalisasiAngka_: normalisasiAngka_, potongSekitar_: potongSekitar_, tesParserSuratJalan: tesParserSuratJalan, migrasiSkema: migrasiSkema, migrasiV9_: migrasiV9_, pastikanSkema_: pastikanSkema_, metodeHpp_: metodeHpp_, wajibPo_: wajibPo_, kunciWaktu_: kunciWaktu_, bolehPo_: bolehPo_, nomorPoBaru_: nomorPoBaru_, simpanPo: simpanPo, ubahPo: ubahPo, batalkanPo: batalkanPo, sinkronPo_: sinkronPo_, ringkasPo_: ringkasPo_, daftarPo: daftarPo, poTerbuka: poTerbuka, returTersedia: returTersedia, hitungReturSisa_: hitungReturSisa_, ringkasanPo: ringkasanPo, statusPoGabungan_: statusPoGabungan_, ringkasInvoice_: ringkasInvoice_, simpanInvoice: simpanInvoice, validasiInvoice: validasiInvoice, daftarInvoice: daftarInvoice, hitungFifo_: hitungFifo_, hargaDariFifo_: hargaDariFifo_, hargaKeluarGbjFifo_: hargaKeluarGbjFifo_, laporanNilaiStok: laporanNilaiStok, hitungUlangHpp: hitungUlangHpp, simpanKerusakan: simpanKerusakan, ringkasKerusakan_: ringkasKerusakan_, daftarKerusakan: daftarKerusakan, tinjauKerusakan: tinjauKerusakan, laporanStandarSusut: laporanStandarSusut, terapkanStandarSusut: terapkanStandarSusut, leadTimeHari_: leadTimeHari_, prediksiBeli: prediksiBeli, diagnosa: diagnosa, nomorSoBaru_: nomorSoBaru_, simpanSo: simpanSo, ubahSo: ubahSo, batalkanSo: batalkanSo, sinkronSo_: sinkronSo_, ringkasSo_: ringkasSo_, daftarSo: daftarSo, soTerbuka: soTerbuka, soKirimHariIni_: soKirimHariIni_, soDipesan_: soDipesan_, csvBaris_: csvBaris_, csv_: csv_, dalamBulan_: dalamBulan_, akhirBulan_: akhirBulan_, eksporBulanan: eksporBulanan, folderBackup_: folderBackup_, backupHarian: backupHarian, pasangBackupHarian: pasangBackupHarian, statusBackup: statusBackup, standarChassen_: standarChassen_, hitungSusutChassen_: hitungSusutChassen_, cariDaur_: cariDaur_, detailDaur_: detailDaur_, mulaiDaurUlang: mulaiDaurUlang, selesaikanDaurUlang: selesaikanDaurUlang, ringkasDaur_: ringkasDaur_, daftarDaurUlang: daftarDaurUlang, ambilDaurUlang: ambilDaurUlang, ubahDaurUlang: ubahDaurUlang, batalkanDaurUlang: batalkanDaurUlang, laporanDaurUlang: laporanDaurUlang };
/* ==== Config.gs ==== */
/**********************************************************************
 * IPC — Inventory & Production Control (v9)
 * File 1 : Config.gs
 *
 * SEMUA SATUAN KILOGRAM. Nama sheet & kolom Bahasa Indonesia.
 * UI bisa switch EN / ID.
 *
 * Jalankan setupSistem() SEKALI setelah paste semua file.
 **********************************************************************/

var APP = {
  nama: 'IPC — Inventory & Production Control',
  versi: '9.0.0',
  zona: 'Asia/Jakarta',
  satuan: 'kg',
  folderFoto: 'IPC Foto Bukti'
};

/* ------------------------------------------------------------------ *
 * SKEMA SHEET
 * ------------------------------------------------------------------ */
var SHEET = {
  ITEM       : 'Master_Item',
  SUPPLIER   : 'Master_Supplier',
  CUSTOMER   : 'Master_Customer',
  PENGGUNA   : 'Master_Pengguna',
  STANDAR    : 'Master_Standar_Susut',
  PENERIMAAN : 'Penerimaan',        // ⓪ pembelian masuk & retur ke supplier
  PENGIRIMAN : 'Pengiriman',        // ④ penjualan keluar & retur dari customer
  PEKERJAAN  : 'Pekerjaan',         // ① bahan baku → barang jadi (semua di GBJ; v9: tidak ada gudang produksi terpisah)
  DETAIL     : 'Pekerjaan_Detail',
  OPNAME     : 'Stock_Opname',      // hitung fisik → penyesuaian stok
  PERMINTAAN : 'Permintaan_Ubah',   // usulan edit/batal dari staf → butuh persetujuan supervisor
  PO         : 'Pesanan_Pembelian', // PO dari manager: apa yang akan datang, qty, harga, spesifikasi
  INVOICE    : 'Invoice',           // invoice supplier per PO, divalidasi manager (dasar harga FIFO)
  KERUSAKAN  : 'Kerusakan',         // laporan barang rusak dari staf → disetujui manager → stok berkurang
  SO         : 'Sales_Order',       // v8: pesanan dari customer (manager) → gudang tahu harus kirim apa, stok dicadangkan
  DAUR       : 'Daur_Ulang',        // v9: scrap dikirim ke mesin chassen (pabrik lain) → kembali sebagai biji plastik daur ulang
  DAUR_DETAIL: 'Daur_Ulang_Detail',
  LOG        : 'Log_Audit',
  SETTING    : 'Pengaturan'
};

var HEADER = {};

HEADER[SHEET.ITEM] = [
  'Kode_Item','Nama_Item','Kategori','Harga_Per_Kg','Stok_Awal','Aktif'   // v9: satu lokasi (GBJ) → satu stok awal
];

HEADER[SHEET.SUPPLIER] = [
  'Kode_Supplier','Nama_Supplier','Keterangan','Aktif'
];

HEADER[SHEET.CUSTOMER] = [
  'Kode_Customer','Nama_Customer','Keterangan','Aktif'
];

HEADER[SHEET.PENGGUNA] = [
  'Email','Nama','Peran','Lokasi','PIN','Aktif'
];

HEADER[SHEET.STANDAR] = [
  'Kode_Produk','Nama_Produk','Susut_Normal_Persen','Toleransi_Persen','Catatan'
];

/* ⓪ Pembelian masuk (MASUK) & retur ke supplier (RETUR) — pakai surat jalan */
HEADER[SHEET.PENERIMAAN] = [
  'ID','Waktu','Tanggal','Jenis','Supplier','No_Surat_Jalan',
  'Kode_Item','Nama_Item','Qty_Kg','Qty_OCR','Selisih_OCR',
  'Foto_URL','Foto_ID','Dicatat_Oleh','Nama_Pencatat',
  'Status','Ditinjau_Oleh','Waktu_Tinjau','Catatan_Tinjau','Catatan','Log_Edit',
  'ID_PO','Harga_Per_Kg','ID_Penerimaan_Asal','Catatan_QC'   // v7: PO, harga batch (FIFO), retur merujuk penerimaan, QC
];

/* ④ Penjualan keluar (KELUAR) & retur dari customer (RETUR_MASUK) */
HEADER[SHEET.PENGIRIMAN] = [
  'ID','Waktu','Tanggal','Jenis','Customer','No_Surat_Jalan',
  'Kode_Item','Nama_Item','Qty_Kg',
  'Foto_URL','Foto_ID','Dicatat_Oleh','Nama_Pencatat',
  'Status','Ditinjau_Oleh','Waktu_Tinjau','Catatan_Tinjau','Catatan','Log_Edit',
  'HPP_Per_Kg',  // v7: harga pokok FIFO barang yang keluar (untuk margin)
  'ID_SO'        // v8: baris sales order yang dipenuhi pengiriman ini
];

HEADER[SHEET.PEKERJAAN] = [
  'ID','Waktu_Mulai','Waktu_Selesai','Tanggal','Kode_Produk','Nama_Produk','Status',
  'Total_Bahan_Baku_Kg','Total_Barang_Jadi_Kg','Total_Scrap_Kg',
  'Susut_Kg','Susut_Persen','Status_Susut',
  'HPP_Bahan','HPP_Proses','HPP_Total','HPP_Per_Kg','Nilai_Susut',
  'Operator','Nama_Operator','Foto_Mulai_URL','Foto_Selesai_URL','Catatan','Log_Edit'
];

HEADER[SHEET.DETAIL] = [
  'ID','ID_Pekerjaan','Jenis','Kode_Item','Nama_Item','Qty_Kg','Harga_Per_Kg','Nilai','Waktu'
];

/* Stock opname: satu baris per item per sesi hitung. Selisih = fisik − sistem, dipakai
   sebagai penyesuaian stok (positif menambah, negatif mengurangi). */
HEADER[SHEET.OPNAME] = [
  'ID','ID_Sesi','Waktu','Tanggal','Lokasi','Kode_Item','Nama_Item',
  'Stok_Sistem','Stok_Fisik','Selisih','Catatan','Dicatat_Oleh','Nama_Pencatat'
];

/* Usulan perubahan dari STAF (edit / batal entri, edit pekerjaan). Entri aslinya TIDAK berubah
   sampai supervisor menyetujui. Usulan = JSON payload yang sama dengan fungsi edit. */
HEADER[SHEET.PERMINTAAN] = [
  'ID','Waktu','Jenis','ID_Entri','Sheet_Entri','Ringkasan','Usulan','Alasan',
  'Diajukan_Oleh','Nama_Pengaju','Status','Ditinjau_Oleh','Waktu_Tinjau','Catatan_Tinjau'
];

/* PO: satu baris per item. No_PO menggabungkan beberapa baris jadi satu pesanan. */
HEADER[SHEET.PO] = [
  'ID','No_PO','Waktu','Tanggal','Supplier','Kode_Item','Nama_Item','Qty_Kg','Harga_Per_Kg',
  'Spesifikasi','Perkiraan_Datang','Qty_Diterima_Kg','Status','Dibuat_Oleh','Nama_Pembuat','Catatan','Log_Edit'
];

/* Invoice supplier per No_PO. Total_Sistem = Σ(qty diterima × harga PO). */
HEADER[SHEET.INVOICE] = [
  'ID','Waktu','Tanggal','No_PO','Supplier','No_Invoice','Tanggal_Invoice','Total_Invoice','Total_Sistem','Selisih',
  'File_URL','File_ID','Status','Diunggah_Oleh','Nama_Pengunggah','Divalidasi_Oleh','Waktu_Validasi','Catatan'
];

/* Barang rusak: hanya STAF yang mencatat; stok berkurang setelah DISETUJUI manager. */
HEADER[SHEET.KERUSAKAN] = [
  'ID','Waktu','Tanggal','Lokasi','Kode_Item','Nama_Item','Qty_Kg','Penyebab',
  'Foto_URL','Foto_ID','Dicatat_Oleh','Nama_Pencatat',
  'Status','Ditinjau_Oleh','Waktu_Tinjau','Catatan_Tinjau','Nilai_Kerugian','Catatan','Log_Edit'
];
HEADER[SHEET.SO] = [
  'ID','No_SO','Waktu','Tanggal','Customer','Kode_Item','Nama_Item','Qty_Kg','Harga_Per_Kg',
  'Tanggal_Kirim','Qty_Dikirim_Kg','Status','Dibuat_Oleh','Nama_Pembuat','Catatan','Log_Edit'
];

/* v9: daur ulang scrap → biji plastik lewat mesin chassen pabrik lain (jasa). Satu baris per batch kirim. */
HEADER[SHEET.DAUR] = [
  'ID','Waktu_Kirim','Waktu_Terima','Tanggal','Tanggal_Terima','Vendor','No_Surat_Jalan',
  'Total_Scrap_Kg','Total_Hasil_Kg','Susut_Kg','Susut_Persen','Status_Susut',
  'Nilai_Scrap','Biaya_Jasa','HPP_Total','HPP_Per_Kg','Status',
  'Dicatat_Oleh','Nama_Pencatat','Diterima_Oleh','Nama_Penerima',
  'Foto_Kirim_URL','Foto_Terima_URL','Catatan','Log_Edit'
];
HEADER[SHEET.DAUR_DETAIL] = [
  'ID','ID_Daur','Jenis','Kode_Item','Nama_Item','Qty_Kg','Harga_Per_Kg','Nilai','Waktu'
];

HEADER[SHEET.LOG] = [
  'Waktu','Email','Aksi','Referensi','Detail'
];

HEADER[SHEET.SETTING] = [
  'Kunci','Nilai','Keterangan'
];

/* ------------------------------------------------------------------ *
 * ENUM
 * ------------------------------------------------------------------ */
var JENIS_PENERIMAAN = {
  MASUK : 'MASUK',   // ⓪ pembelian: Supplier → GBJ   (stok GBJ +)
  RETUR : 'RETUR'    //    retur    : GBJ → Supplier   (stok GBJ −)
};

var JENIS_PENGIRIMAN = {
  KELUAR      : 'KELUAR',       // ④ penjualan: GBJ → Customer   (stok GBJ −)
  RETUR_MASUK : 'RETUR_MASUK'   //    retur    : Customer → GBJ   (stok GBJ +)
};

var STATUS_TRANSFER = {
  MENUNGGU   : 'MENUNGGU',     // baru masuk, belum ditinjau
  DISETUJUI  : 'DISETUJUI',    // final
  DITANDAI   : 'DITANDAI',     // diarsipkan untuk direvisi nanti — TETAP dihitung di stok
  DIBATALKAN : 'DIBATALKAN'    // dibatalkan — TIDAK dihitung di stok
};

var STATUS_PEKERJAAN = { BERJALAN: 'BERJALAN', SELESAI: 'SELESAI' };
var STATUS_DAUR      = { BERJALAN: 'BERJALAN', SELESAI: 'SELESAI', DIBATALKAN: 'DIBATALKAN' };   // v9
var JENIS_DAUR_DETAIL = { SCRAP: 'SCRAP', HASIL: 'HASIL' };                                       // v9: scrap keluar / biji plastik masuk

var JENIS_PERMINTAAN  = { EDIT: 'EDIT', BATAL: 'BATAL', EDIT_JOB: 'EDIT_JOB' };
var STATUS_PERMINTAAN = { MENUNGGU: 'MENUNGGU', DISETUJUI: 'DISETUJUI', DITOLAK: 'DITOLAK' };
var MAKS_MUNDUR_HARI  = 60;   // tanggal transaksi boleh dimundurkan maksimal sekian hari

var STATUS_PO      = { TERBUKA: 'TERBUKA', SEBAGIAN: 'SEBAGIAN', SELESAI: 'SELESAI', DIBATALKAN: 'DIBATALKAN' };
var STATUS_INVOICE = { MENUNGGU: 'MENUNGGU', VALID: 'VALID', DITOLAK: 'DITOLAK' };
var STATUS_SO      = STATUS_PO;   // TERBUKA / SEBAGIAN / SELESAI / DIBATALKAN

var JENIS_DETAIL = {
  BAHAN_BAKU  : 'BAHAN_BAKU',
  BARANG_JADI : 'BARANG_JADI',
  SCRAP       : 'SCRAP'
};

var KATEGORI_ITEM = {
  BAHAN_BAKU  : 'BAHAN_BAKU',
  BARANG_JADI : 'BARANG_JADI',
  KEDUANYA    : 'KEDUANYA',
  SCRAP       : 'SCRAP'        // dibuat otomatis per produk: SCR-<kode produk>. Bisa dijual (④).
};
var PREFIX_SCRAP = 'SCR-';

var PERAN = { STAF: 'STAF', SUPERVISOR: 'SUPERVISOR', ADMIN: 'ADMIN' };
var LOKASI = { GBJ: 'GBJ' };   // v9: satu gudang saja — pekerjaan berjalan di GBJ

var DEFAULT_SUSUT_NORMAL_PERSEN = 3.0;
var DEFAULT_TOLERANSI_PERSEN    = 1.5;
var DEFAULT_SUSUT_CHASSEN_PERSEN     = 5.0;   // v9: susut normal scrap → biji plastik di mesin chassen
var DEFAULT_TOLERANSI_CHASSEN_PERSEN = 3.0;

/* ------------------------------------------------------------------ *
 * DUMMY DATA — ganti lewat sheet Master_Item / Master_Supplier
 * ------------------------------------------------------------------ */
var DUMMY_ITEM = [
  // Bahan baku polybag (harga pokok per kg, Agustus 2026)
  ['RM-BP-KW' ,'Biji Plastik KW',         KATEGORI_ITEM.BAHAN_BAKU , 13000, 0, 'YA'],
  ['RM-BP-SUP','Biji Plastik Super',      KATEGORI_ITEM.BAHAN_BAKU , 15000, 0, 'YA'],
  ['RM-BP-SPL','Biji Plastik Super Plus', KATEGORI_ITEM.BAHAN_BAKU , 15000, 0, 'YA'],
  ['RM-PG-KW' ,'Pigmen KW',               KATEGORI_ITEM.BAHAN_BAKU , 28000, 0, 'YA'],
  ['RM-PG-SPL','Pigmen Super Plus',       KATEGORI_ITEM.BAHAN_BAKU , 33300, 0, 'YA'],
  ['RM-AF'    ,'Antifoam',                KATEGORI_ITEM.BAHAN_BAKU , 13500, 0, 'YA'],
  ['RM-BS-KW' ,'BS KW',                   KATEGORI_ITEM.BAHAN_BAKU , 13000, 0, 'YA'],
  ['RM-BS-SUP','BS Super',                KATEGORI_ITEM.BAHAN_BAKU , 15000, 0, 'YA'],
  ['RM-BS-SPL','BS Super Plus',           KATEGORI_ITEM.BAHAN_BAKU , 15000, 0, 'YA'],
  ['RM-BP-DU' ,'Biji Plastik Daur Ulang', KATEGORI_ITEM.BAHAN_BAKU , '',    0, 'YA'],   // hasil chassen scrap (v9) — harga dari biaya jasa
  // Barang jadi
  ['FG-PB-HP' ,'Polybag H Plast',         KATEGORI_ITEM.BARANG_JADI, '',    0, 'YA']
];

var DUMMY_SUPPLIER = [
  ['SUP-001','Supplier Biji Plastik (ganti nama)','Isi nama supplier sebenarnya','YA'],
  ['SUP-002','Supplier Pigmen & Antifoam (ganti nama)','','YA']
];

var DUMMY_CUSTOMER = [
  ['CUS-001','Customer Polybag 1 (ganti nama)','Isi nama customer sebenarnya','YA'],
  ['CUS-002','Customer Polybag 2 (ganti nama)','','YA']
];

/* Akun awal — GANTI PIN-nya setelah pilot. Kosongkan Email kalau pakai Gmail pribadi.
   ADMIN      = semua + kelola pengguna
   SUPERVISOR = review, HPP, opname, SKU, edit semua entri
   STAF       = input pergerakan barang */
var DUMMY_PENGGUNA = [
  ['', 'Admin',        PERAN.ADMIN,      'HQ',  '1234', 'YA'],
  ['', 'Direktur',     PERAN.ADMIN,      'HQ',  '2468', 'YA'],
  ['', 'Manager',      PERAN.SUPERVISOR, 'GBJ', '1357', 'YA'],
  ['', 'Staff Gudang', PERAN.STAF,       'GBJ', '1111', 'YA']
];

var DUMMY_STANDAR = [
  ['FG-PB-HP','Polybag H Plast', 3.0, 1.5, 'Angka awal — sesuaikan dari data pilot']
];

var DEFAULT_SETTING = [
  ['FOLDER_FOTO_ID','', 'ID folder Drive tempat foto bukti disimpan (diisi otomatis)'],
  ['OCR_AKTIF','YA','Auto-baca surat jalan pembelian (butuh Advanced Drive Service)'],
  ['WAJIB_SJ_KELUAR','YA','Wajibkan no. surat jalan / DO saat barang keluar ke customer'],
  ['OCR_BAHASA','id','Bahasa OCR'],
  ['BAHASA_DEFAULT','id','Bahasa awal UI: id / en'],
  ['PAKSA_LOGIN_MANUAL','YA','YA = semua orang (termasuk pemilik Sheet) login dengan Nama + PIN dari Master_Pengguna. TIDAK = email Google yang terdaftar langsung masuk tanpa PIN.'],
  ['AKSES_TERBUKA','TIDAK','YA = nama yang belum terdaftar tetap boleh masuk sebagai PERAN_DEFAULT. TIDAK = hanya akun di Master_Pengguna (disarankan).'],
  ['PERAN_DEFAULT','STAF','Peran untuk email yang belum terdaftar (kalau AKSES_TERBUKA = YA)'],
  ['PIN_SUPERVISOR','2468','PIN darurat supervisor (hanya untuk nama yang BELUM terdaftar). Lebih baik isi PIN per user di Master_Pengguna. GANTI PIN INI.'],
  ['BIAYA_PROSES_PER_KG','2500','Biaya proses (tenaga, listrik, gas, dll) per kg bahan baku masuk. Dipakai untuk HPP.'],
  ['MATA_UANG','Rp','Simbol mata uang di tampilan HPP'],
  ['METODE_HPP','FIFO','FIFO = harga bahan dari batch penerimaan tertua yang terpakai (butuh harga di PO/penerimaan). MASTER = harga tetap dari Master_Item.'],
  ['WAJIB_PO','TIDAK','YA = penerimaan barang harus merujuk PO. TIDAK = boleh tanpa PO (ditandai TANPA PO).'],
  ['MAKS_EDIT_HARI','30','Entri lebih tua dari sekian hari (dari tanggal transaksi) tidak bisa diubah/dibatalkan siapa pun — periode dianggap ditutup.'],
  ['LEAD_TIME_HARI','7','Lama pesan sampai barang datang (hari). Dipakai untuk peringatan "perlu beli": stok habis sebelum lead time.'],
  ['SUSUT_CHASSEN_PERSEN','5','v9: susut normal saat scrap digiling di mesin chassen jadi biji plastik (%). Susut = scrap dikirim − biji plastik diterima.'],
  ['TOLERANSI_CHASSEN_PERSEN','3','v9: toleransi di atas susut normal chassen (%). Lebih dari normal + toleransi = SUSUT TINGGI.']
];

/* ------------------------------------------------------------------ *
 * SETUP — jalankan sekali
 * ------------------------------------------------------------------ */
function setupSistem() {
  lupakanMemo_();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Script harus terikat ke Google Sheet (Extensions > Apps Script dari dalam Sheet).');

  Object.keys(SHEET).forEach(function (k) {
    var nama = SHEET[k];
    var sh = ss.getSheetByName(nama) || ss.insertSheet(nama);
    var head = HEADER[nama];
    sh.getRange(1, 1, 1, head.length).setValues([head]);
    sh.getRange(1, 1, 1, head.length)
      .setFontWeight('bold').setBackground('#1f2937').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    if (sh.getMaxColumns() > head.length) {
      sh.deleteColumns(head.length + 1, sh.getMaxColumns() - head.length);
    }
  });

  seedJika(ss, SHEET.ITEM, DUMMY_ITEM);
  seedJika(ss, SHEET.SUPPLIER, DUMMY_SUPPLIER);
  seedJika(ss, SHEET.CUSTOMER, DUMMY_CUSTOMER);
  seedJika(ss, SHEET.STANDAR, DUMMY_STANDAR);
  seedJika(ss, SHEET.SETTING, DEFAULT_SETTING);

  var email = Session.getActiveUser().getEmail();
  var shU = ss.getSheetByName(SHEET.PENGGUNA);
  if (shU.getLastRow() < 2) {
    if (email) shU.appendRow([email, email.split('@')[0], PERAN.ADMIN, 'HQ', '', 'YA']);
    DUMMY_PENGGUNA.forEach(function (r) { shU.appendRow(r); });
    lupakanMemo_(SHEET.PENGGUNA);
  }

  var folder = ambilAtauBuatFolder_();
  setSetting_('FOLDER_FOTO_ID', folder.getId());

  Object.keys(SHEET).forEach(function (k) {
    ss.getSheetByName(SHEET[k]).autoResizeColumns(1, HEADER[SHEET[k]].length);
  });

  ss.setSpreadsheetTimeZone(APP.zona);
  catatLog_('SETUP', '', 'Sistem disiapkan v' + APP.versi);

  return 'Setup selesai. Folder foto: ' + folder.getUrl();
}

function seedJika(ss, nama, rows) {
  lupakanMemo_();
  var sh = ss.getSheetByName(nama);
  if (sh.getLastRow() >= 2) return;
  if (!rows.length) return;
  sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  lupakanMemo_(nama);
}

/**
 * Ganti isi Master_Item, Master_Supplier, Master_Customer & Master_Standar_Susut dengan daftar DUMMY_* di file ini.
 * Hanya boleh saat belum ada transaksi (aman untuk setup awal / ganti daftar SKU sebelum go-live).
 */
function seedUlangMaster() {
  lupakanMemo_();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  [SHEET.PENERIMAAN, SHEET.PENGIRIMAN, SHEET.PEKERJAAN, SHEET.OPNAME, SHEET.PO, SHEET.KERUSAKAN, SHEET.DAUR].forEach(function (n) {
    var sh = ss.getSheetByName(n);
    if (sh && sh.getLastRow() >= 2) throw new Error('Sudah ada transaksi di ' + n + '. Ubah SKU lewat menu Admin > SKU, jangan seed ulang.');
  });
  [[SHEET.ITEM, DUMMY_ITEM], [SHEET.STANDAR, DUMMY_STANDAR],
   [SHEET.SUPPLIER, DUMMY_SUPPLIER], [SHEET.CUSTOMER, DUMMY_CUSTOMER]].forEach(function (pair) {
    var sh = ss.getSheetByName(pair[0]);
    if (sh.getLastRow() >= 2) sh.deleteRows(2, sh.getLastRow() - 1);
    sh.getRange(2, 1, pair[1].length, pair[1][0].length).setValues(pair[1]);
  });
  lupakanMemo_();
  catatLog_('SEED_ULANG_MASTER', '', DUMMY_ITEM.length + ' item, ' + DUMMY_SUPPLIER.length + ' supplier, ' + DUMMY_CUSTOMER.length + ' customer, ' + DUMMY_STANDAR.length + ' standar susut');
}

/**
 * Reset untuk go-live: HAPUS SEMUA transaksi uji coba (penerimaan, pengiriman,
 * pekerjaan, detail, opname, PO, SO, daur ulang), lalu isi ulang master dari DUMMY_*. Log_Audit & pengguna tetap.
 * Jalankan manual dari editor SEKALI sebelum sistem dipakai sungguhan. Tidak bisa dipanggil dari app.
 */
function resetUntukGoLive() {
  lupakanMemo_();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  [SHEET.PENERIMAAN, SHEET.PENGIRIMAN, SHEET.PEKERJAAN, SHEET.DETAIL, SHEET.OPNAME,
   SHEET.PERMINTAAN, SHEET.PO, SHEET.INVOICE, SHEET.KERUSAKAN, SHEET.SO, SHEET.DAUR, SHEET.DAUR_DETAIL].forEach(function (n) {
    var sh = ss.getSheetByName(n);
    if (sh && sh.getLastRow() >= 2) sh.deleteRows(2, sh.getLastRow() - 1);
  });
  lupakanMemo_();
  catatLog_('RESET_GO_LIVE', '', 'Semua transaksi uji coba dihapus');
  seedUlangMaster();
}

function ambilAtauBuatFolder_() {
  var id = getSetting_('FOLDER_FOTO_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var it = DriveApp.getFoldersByName(APP.folderFoto);
  return it.hasNext() ? it.next() : DriveApp.createFolder(APP.folderFoto);
}

/* ==== Server.gs ==== */
/**********************************************************************
 * IPC — Inventory & Production Control (v9)
 * File 2 : Server.gs
 *
 * SEMUA QTY DALAM KILOGRAM.
 **********************************************************************/

/* ================= WEB APP ENTRY ================= */

function doGet(e) {
  var t = HtmlService.createTemplateFromFile('Index');
  t.bahasaAwal = getSetting_('BAHASA_DEFAULT') || 'id';
  return t.evaluate()
    .setTitle('IPC — Inventory & Production Control')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(nama) {
  return HtmlService.createHtmlOutputFromFile(nama).getContent();
}

/* ================= API JSON (untuk frontend GitHub Pages) =================
 * Frontend statis di GitHub memanggil POST {fn, args} ke URL /exec ini.
 * Content-Type text/plain -> tidak kena preflight CORS. Balasan JSON.
 * Hanya fungsi di daftar putih (RPC_WL) yang boleh dipanggil. */
var RPC_WL = {
  getKonteks:1, simpanPenerimaan:1, simpanPengiriman:1,
  mulaiPekerjaan:1, selesaikanPekerjaan:1, daftarPekerjaanBerjalan:1, daftarPekerjaanSelesai:1,
  ambilPekerjaan:1, simpanEditPekerjaan:1,
  riwayatInput:1, ambilEntri:1, simpanEditEntri:1, batalkanEntriSendiri:1,
  antrianReview:1, tinjauTransfer:1, daftarPermintaan:1, tinjauPermintaan:1,
  laporanSusut:1, laporanStok:1, riwayatPenerimaan:1, laporanPenjualan:1, laporanHpp:1,
  kalender:1, ocrSuratJalan:1,
  daftarPengguna:1, simpanPengguna:1, aktivitasStaf:1,
  daftarSku:1, simpanSku:1, hapusSku:1,
  siapkanOpname:1, simpanOpname:1, riwayatOpname:1,
  /* v7 */
  simpanPo:1, ubahPo:1, batalkanPo:1, daftarPo:1, poTerbuka:1, returTersedia:1,
  ringkasanPo:1, simpanInvoice:1, validasiInvoice:1, daftarInvoice:1,
  laporanNilaiStok:1, hitungUlangHpp:1,
  simpanKerusakan:1, daftarKerusakan:1, tinjauKerusakan:1,
  laporanStandarSusut:1, terapkanStandarSusut:1, diagnosa:1, prediksiBeli:1,
  simpanSo:1, ubahSo:1, batalkanSo:1, daftarSo:1, soTerbuka:1, eksporBulanan:1, statusBackup:1,
  /* v9 */
  tambahMaster:1, mulaiDaurUlang:1, selesaikanDaurUlang:1, daftarDaurUlang:1, ambilDaurUlang:1,
  ubahDaurUlang:1, batalkanDaurUlang:1, laporanDaurUlang:1
};

function doPost(e) {
  var out = { ok:false }, idKlien = '', cache = null;
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var fn = String(body.fn || '');
    if (!RPC_WL[fn]) throw new Error('Fungsi tidak dikenal: ' + fn);
    var f = globalThis[fn];
    if (typeof f !== 'function') throw new Error('Fungsi tidak tersedia: ' + fn);
    /* Idempotensi: frontend mengirim idKlien unik per aksi. Kalau balasan hilang di jalan
       (jaringan putus / redirect nyasar) dan frontend mengulang, permintaan yang sama TIDAK
       dijalankan dua kali — hasil pertama dikembalikan dari cache (10 menit). */
    idKlien = String(body.idKlien || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
    if (idKlien) {
      try { cache = CacheService.getScriptCache(); var ada = cache.get('rq:' + idKlien); if (ada) return jsonOut_(ada); } catch (x) { cache = null; }
    }
    out.ok = true;
    out.data = f.apply(null, body.args || []);
  } catch (err) {
    out.ok = false;
    out.error = (err && err.message) ? err.message : String(err);
  }
  var teks = JSON.stringify(out);
  if (idKlien && cache && out.ok && teks.length < 90000) { try { cache.put('rq:' + idKlien, teks, 600); } catch (x) {} }
  return jsonOut_(teks);
}
function jsonOut_(teks) { return ContentService.createTextOutput(teks).setMimeType(ContentService.MimeType.JSON); }

/* ================= UTIL SHEET ================= */

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function sheet_(nama) {
  var sh = ss_().getSheetByName(nama);
  if (!sh) {
    var head = HEADER[nama];
    if (!head) throw new Error('Sheet "' + nama + '" belum ada. Jalankan setupSistem() dulu.');
    sh = ss_().insertSheet(nama);                       // sheet baru (mis. Permintaan_Ubah) dibuat otomatis
    sh.getRange(1, 1, 1, head.length).setValues([head]);
    sh.setFrozenRows(1);
  }
  return sh;
}

var KOLOM_TANGGAL_ = /^(Tanggal|Tanggal_Invoice|Perkiraan_Datang|Tanggal_Kirim|Tanggal_Terima)$/;
/* Memo per eksekusi: satu sheet dibaca dari Spreadsheet sekali saja per request
   (getKonteks dulu membaca sheet yang sama berulang kali -> 6-10 detik). Dibuang setiap ada tulis. */
var MEMO_BACA_ = {};
function lupakanMemo_(nama) { if (nama) delete MEMO_BACA_[nama]; else { MEMO_BACA_ = {}; BATCH_DICOBA_ = false; } }
function salinBaris_(r) { var o = {}; for (var k in r) o[k] = r[k]; return o; }
var BATCH_DICOBA_ = false;
function baca_(nama) {
  if (MEMO_BACA_[nama]) return MEMO_BACA_[nama].map(salinBaris_);
  if (!BATCH_DICOBA_) {                     // sekali per request: tarik semua sheet dalam 1 panggilan API
    BATCH_DICOBA_ = true;
    try { bacaSemuaBatch_(); } catch (e) { /* jatuh ke getValues per sheet */ }
    if (MEMO_BACA_[nama]) return MEMO_BACA_[nama].map(salinBaris_);
  }
  var out = bacaSheet_(nama);
  MEMO_BACA_[nama] = out;
  return out.map(salinBaris_);
}

/* Sheets API (advanced service "Sheets" v4): semua sheet sekaligus lewat batchGet.
   ~0,3 dtk untuk 18 sheet, dibanding ~0,15 dtk x 18 kalau getValues satu-satu. */
var KOLOM_WAKTU_ = /^Waktu/;
var SERIAL_EPOCH_ = 25569;                  // 1970-01-01 dalam hari serial Sheets (basis 1899-12-30)
function offsetZonaMs_(ms) {
  var z = Utilities.formatDate(new Date(ms), APP.zona, 'Z');   // '+0700'
  var m = /^([+-])(\d\d)(\d\d)$/.exec(z); if (!m) return 0;
  return (m[1] === '-' ? -1 : 1) * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10)) * 60000;
}
function serialKeDate_(serial) {
  var ms = Math.round((serial - SERIAL_EPOCH_) * 86400000);   // seolah-olah UTC
  return new Date(ms - offsetZonaMs_(ms));                    // geser ke zona spreadsheet
}
function bacaSemuaBatch_() {
  if (typeof Sheets === 'undefined' || !Sheets.Spreadsheets || !Sheets.Spreadsheets.Values) return false;
  var ss = ss_(), ada = {};
  ss.getSheets().forEach(function (sh) { ada[sh.getName()] = true; });
  var daftar = Object.keys(SHEET).map(function (k) { return SHEET[k]; }).filter(function (n) { return ada[n] && HEADER[n]; });
  if (!daftar.length) return false;
  var res = Sheets.Spreadsheets.Values.batchGet(ss.getId(), {
    ranges: daftar.map(function (n) { return "'" + n + "'"; }),
    valueRenderOption: 'UNFORMATTED_VALUE', dateTimeRenderOption: 'SERIAL_NUMBER'
  });
  var vrs = (res && res.valueRanges) || [];
  if (vrs.length !== daftar.length) return false;
  daftar.forEach(function (nama, idx) {
    var head = HEADER[nama], vals = vrs[idx].values || [], out = [];
    for (var i = 1; i < vals.length; i++) {                   // baris 0 = header
      var row = vals[i] || [];
      if (row.join('') === '') continue;
      var o = { _baris: i + 1 };
      for (var c = 0; c < head.length; c++) {
        var v = row[c]; if (v === undefined || v === null) v = '';
        if (typeof v === 'number') {
          if (KOLOM_WAKTU_.test(head[c])) v = serialKeDate_(v);
          else if (KOLOM_TANGGAL_.test(head[c])) v = tglStr_(serialKeDate_(v));
        } else if (KOLOM_TANGGAL_.test(head[c]) && Object.prototype.toString.call(v) === '[object Date]') v = tglStr_(v);
        o[head[c]] = v;
      }
      out.push(o);
    }
    MEMO_BACA_[nama] = out;
  });
  return true;
}
function bacaSheet_(nama) {
  var sh = sheet_(nama);
  var lastRow = sh.getLastRow();
  var head = HEADER[nama];
  if (lastRow < 2) return [];
  var val = sh.getRange(2, 1, lastRow - 1, head.length).getValues();
  var out = [];
  for (var i = 0; i < val.length; i++) {
    if (val[i].join('') === '') continue;
    var o = { _baris: i + 2 };
    for (var c = 0; c < head.length; c++) {
      var v = val[i][c];
      /* Sheets mengubah teks 'YYYY-MM-DD' jadi Date; kolom tanggal selalu dinormalkan kembali ke string */
      if (KOLOM_TANGGAL_.test(head[c]) && Object.prototype.toString.call(v) === '[object Date]') v = tglStr_(v);
      o[head[c]] = v;
    }
    out.push(o);
  }
  return out;
}

function tambah_(nama, obj) {
  var head = HEADER[nama];
  var row = head.map(function (h) { return (obj[h] === undefined || obj[h] === null) ? '' : obj[h]; });
  sheet_(nama).appendRow(row);
  lupakanMemo_(nama);
  return row;
}

function ubahBaris_(nama, baris, obj) {
  var head = HEADER[nama];
  var sh = sheet_(nama);
  Object.keys(obj).forEach(function (k) {
    var idx = head.indexOf(k);
    if (idx >= 0) sh.getRange(baris, idx + 1).setValue(obj[k]);
  });
  lupakanMemo_(nama);
}

function getSetting_(kunci) {
  try {
    var rows = baca_(SHEET.SETTING);
    for (var i = 0; i < rows.length; i++) if (rows[i].Kunci === kunci) return String(rows[i].Nilai);
  } catch (e) {}
  return '';
}

function setSetting_(kunci, nilai) {
  var sh = sheet_(SHEET.SETTING);
  var rows = baca_(SHEET.SETTING);
  lupakanMemo_(SHEET.SETTING);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].Kunci === kunci) { sh.getRange(rows[i]._baris, 2).setValue(nilai); return; }
  }
  sh.appendRow([kunci, nilai, '']);
}

function catatLog_(aksi, ref, detail) {
  try {
    tambah_(SHEET.LOG, { Waktu: new Date(), Email: emailAktif_(), Aksi: aksi, Referensi: ref, Detail: detail });
  } catch (e) {}
}

function emailAktif_() {
  var e = '';
  try { e = Session.getActiveUser().getEmail(); } catch (err) {}
  return e || 'anonim';
}

function tglStr_(d) { return Utilities.formatDate(d || new Date(), APP.zona, 'yyyy-MM-dd'); }

/** Tanggal transaksi: default hari ini; boleh dimundurkan (lupa input kemarin) maks MAKS_MUNDUR_HARI, tidak boleh ke depan. */
function tglValid_(s) {
  var hariIni = tglStr_(new Date());
  s = String(s || '').trim();
  if (!s) return hariIni;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error('Format tanggal harus YYYY-MM-DD.');
  if (s > hariIni) throw new Error('Tanggal tidak boleh di masa depan.');
  var batas = new Date(); batas.setDate(batas.getDate() - MAKS_MUNDUR_HARI);
  if (s < tglStr_(batas)) throw new Error('Tanggal terlalu lama (maks ' + MAKS_MUNDUR_HARI + ' hari ke belakang).');
  return s;
}

function buatId_(prefix) {
  return prefix + '-' + Utilities.formatDate(new Date(), APP.zona, 'yyMMdd-HHmmss') + '-' +
         Math.floor(Math.random() * 900 + 100);
}

function angka_(v) {
  if (v === '' || v === null || v === undefined) return 0;
  var n = parseFloat(String(v).replace(/,/g, '.'));
  return isNaN(n) ? 0 : n;
}

function bulat_(n, d) {
  var f = Math.pow(10, d === undefined ? 2 : d);
  return Math.round(n * f) / f;
}

function jam_(d) { return Utilities.formatDate(new Date(d), APP.zona, 'dd MMM HH:mm'); }

/* ================= PENGGUNA & AKSES ================= */

/**
 * ident = { nama, pin } — dipakai kalau akun staff bukan Google Workspace
 * satu domain, sehingga Apps Script tidak bisa membaca emailnya.
 */
function penggunaSaatIni_(ident) {
  pastikanSkema_();
  ident = ident || {};
  var email = emailAktif_();
  var emailAda = email && email !== 'anonim';
  // PAKSA_LOGIN_MANUAL = YA (default): semua orang, termasuk pemilik Sheet, login dengan Nama + PIN.
  var paksaManual = (getSetting_('PAKSA_LOGIN_MANUAL') || 'YA').toUpperCase() === 'YA';
  if (paksaManual) emailAda = false;

  if (emailAda) {
    var rows = baca_(SHEET.PENGGUNA);
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].Email).toLowerCase().trim() === email.toLowerCase() &&
          String(rows[i].Aktif).toUpperCase() !== 'TIDAK') {
        return { email: email, nama: rows[i].Nama || email, peran: rows[i].Peran || PERAN.STAF,
                 lokasi: rows[i].Lokasi || '', terdaftar: true, identitasManual: false };
      }
    }
    var terbuka = (getSetting_('AKSES_TERBUKA') || 'YA').toUpperCase() === 'YA';
    if (!terbuka) throw new Error('Akses ditolak. Email ' + email + ' belum terdaftar di Master_Pengguna.');
    return { email: email, nama: email.split('@')[0], peran: getSetting_('PERAN_DEFAULT') || PERAN.STAF,
             lokasi: '', terdaftar: false, identitasManual: false };
  }

  var nama = String(ident.nama || '').trim();
  var pin  = String(ident.pin || '').trim();
  var peran = getSetting_('PERAN_DEFAULT') || PERAN.STAF;
  var lokasi = '';
  var terdaftar = false;

  if (nama) {
    var pr = baca_(SHEET.PENGGUNA);
    for (var j = 0; j < pr.length; j++) {
      if (String(pr[j].Nama).toLowerCase().trim() !== nama.toLowerCase()) continue;
      if (String(pr[j].Aktif).toUpperCase() === 'TIDAK') throw new Error('Akun "' + nama + '" dinonaktifkan. Hubungi admin.');
      var pinUser = String(pr[j].PIN || '').trim();
      if (!pinUser) throw new Error('Akun "' + pr[j].Nama + '" belum punya PIN. Minta admin mengatur PIN di menu Admin > Pengguna.');
      if (pin !== pinUser) throw new Error('PIN salah untuk ' + pr[j].Nama + '.');
      nama = String(pr[j].Nama);          // pakai ejaan resmi
      peran = pr[j].Peran || peran;
      lokasi = pr[j].Lokasi || '';
      terdaftar = true;
      break;
    }
    if (!terdaftar) {
      var terbukaM = (getSetting_('AKSES_TERBUKA') || 'YA').toUpperCase() === 'YA';
      if (!terbukaM) throw new Error('Nama "' + nama + '" belum terdaftar. Minta admin menambahkan kamu.');
      var pinDarurat = String(getSetting_('PIN_SUPERVISOR') || '').trim();
      if (pinDarurat && pin === pinDarurat) peran = PERAN.SUPERVISOR;
    }
  }

  return { email: '', nama: nama || '(belum diisi)', peran: peran, lokasi: lokasi,
           terdaftar: terdaftar, identitasManual: true, perluNama: !nama };
}

function bolehReview_(u) { return u.peran === PERAN.SUPERVISOR || u.peran === PERAN.ADMIN; }
function bolehAdmin_(u)  { return u.peran === PERAN.ADMIN; }

/** HPP & harga hanya untuk manager (Supervisor / Admin). STAF tidak pernah menerimanya. */
function bolehLihatHpp_(u) { return bolehReview_(u); }

/** Entri dihitung di stok kecuali DIBATALKAN. DITANDAI tetap dihitung (kejadiannya nyata). */
function dihitung_(r) { return r.Status !== STATUS_TRANSFER.DIBATALKAN; }

function biayaProsesPerKg_() { return angka_(getSetting_('BIAYA_PROSES_PER_KG')); }
function mataUang_() { return getSetting_('MATA_UANG') || 'Rp'; }

/* ================= MASTER ================= */

function petaItem_() {
  var peta = {};
  baca_(SHEET.ITEM).forEach(function (r) {
    if (!r.Kode_Item) return;
    peta[r.Kode_Item] = {
      kode: r.Kode_Item, nama: r.Nama_Item, kategori: r.Kategori,
      harga: angka_(r.Harga_Per_Kg), aktif: r.Aktif,
      awal: angka_(r.Stok_Awal)
    };
  });
  return peta;
}

/**
 * SKU scrap untuk satu produk: SCR-<kode produk>. Dibuat kalau belum ada.
 * Scrap disimpan per produk supaya bisa dilihat stoknya dan dijual lewat ④.
 */
function skuScrapUntuk_(produk) {
  var kode = PREFIX_SCRAP + produk.kode;
  var rows = baca_(SHEET.ITEM);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].Kode_Item === kode) {
      return { kode: kode, nama: rows[i].Nama_Item, kategori: rows[i].Kategori, harga: angka_(rows[i].Harga_Per_Kg) };
    }
  }
  var nama = 'Scrap · ' + produk.nama;
  tambah_(SHEET.ITEM, { Kode_Item: kode, Nama_Item: nama, Kategori: KATEGORI_ITEM.SCRAP,
                        Harga_Per_Kg: '', Stok_Awal: 0, Aktif: 'YA' });
  catatLog_('SKU_SCRAP', kode, 'dibuat otomatis untuk ' + produk.nama);
  return { kode: kode, nama: nama, kategori: KATEGORI_ITEM.SCRAP, harga: 0 };
}

/**
 * v9: tambah master langsung dari form (search bar "+ tambah baru"). Semua peran boleh.
 * jenis: 'SUPPLIER' | 'CUSTOMER' | 'ITEM'.  p = { nama, kategori (item: BAHAN_BAKU|BARANG_JADI|KEDUANYA) }
 * Nama yang sudah ada (tanpa peduli huruf besar/kecil) tidak digandakan — yang lama dipakai (diaktifkan lagi kalau nonaktif).
 */
function tambahMaster(jenis, p, ident) {
  var u = penggunaSaatIni_(ident);
  p = p || {};
  var nama = String(p.nama || '').replace(/\s+/g, ' ').trim();
  if (!nama) throw new Error('Nama belum diisi.');
  if (nama.length > 80) throw new Error('Nama terlalu panjang (maks 80 karakter).');
  jenis = String(jenis || '').toUpperCase();
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();
  try {
    if (jenis === 'SUPPLIER' || jenis === 'CUSTOMER') {
      var sheet = jenis === 'SUPPLIER' ? SHEET.SUPPLIER : SHEET.CUSTOMER;
      var kolKode = jenis === 'SUPPLIER' ? 'Kode_Supplier' : 'Kode_Customer';
      var kolNama = jenis === 'SUPPLIER' ? 'Nama_Supplier' : 'Nama_Customer';
      var awalan = jenis === 'SUPPLIER' ? 'SUP-' : 'CUS-';
      var rows = baca_(sheet), maks = 0;
      for (var i = 0; i < rows.length; i++) {
        var m = /(\d+)\s*$/.exec(String(rows[i][kolKode] || '')); if (m) maks = Math.max(maks, parseInt(m[1], 10));
        if (String(rows[i][kolNama] || '').trim().toLowerCase() === nama.toLowerCase()) {
          if (String(rows[i].Aktif).toUpperCase() === 'TIDAK') { ubahBaris_(sheet, rows[i]._baris, { Aktif: 'YA' }); catatLog_('TAMBAH_MASTER', rows[i][kolKode], jenis + ' diaktifkan lagi: ' + rows[i][kolNama]); }
          return { ok: true, ada: true, jenis: jenis, kode: rows[i][kolKode], nama: rows[i][kolNama] };
        }
      }
      var kode = awalan + String(maks + 1).padStart(3, '0');
      var obj = { Keterangan: 'ditambah dari form oleh ' + u.nama + ' ' + tglStr_(new Date()), Aktif: 'YA' };
      obj[kolKode] = kode; obj[kolNama] = nama;
      tambah_(sheet, obj);
      catatLog_('TAMBAH_MASTER', kode, jenis + ' baru: ' + nama);
      return { ok: true, ada: false, jenis: jenis, kode: kode, nama: nama };
    }
    if (jenis === 'ITEM') {
      var kat = [KATEGORI_ITEM.BAHAN_BAKU, KATEGORI_ITEM.BARANG_JADI, KATEGORI_ITEM.KEDUANYA].indexOf(p.kategori) >= 0 ? p.kategori : KATEGORI_ITEM.BAHAN_BAKU;
      var items = baca_(SHEET.ITEM), adaKode = {};
      for (var j = 0; j < items.length; j++) {
        adaKode[String(items[j].Kode_Item).toUpperCase()] = true;
        if (String(items[j].Nama_Item || '').trim().toLowerCase() === nama.toLowerCase()) {
          if (String(items[j].Aktif).toUpperCase() === 'TIDAK') { ubahBaris_(SHEET.ITEM, items[j]._baris, { Aktif: 'YA' }); catatLog_('TAMBAH_MASTER', items[j].Kode_Item, 'item diaktifkan lagi: ' + items[j].Nama_Item); }
          return { ok: true, ada: true, jenis: jenis, kode: items[j].Kode_Item, nama: items[j].Nama_Item, kategori: items[j].Kategori };
        }
      }
      var dasar = (kat === KATEGORI_ITEM.BARANG_JADI ? 'FG-' : 'RM-') +
                  nama.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 20).replace(/-+$/, '');
      if (dasar.length < 4) dasar += '-ITEM';
      var kodeItem = dasar, n = 2;
      while (adaKode[kodeItem]) { kodeItem = dasar + '-' + n; n++; }
      tambah_(SHEET.ITEM, { Kode_Item: kodeItem, Nama_Item: nama, Kategori: kat, Harga_Per_Kg: '', Stok_Awal: 0, Aktif: 'YA' });
      catatLog_('TAMBAH_MASTER', kodeItem, 'item baru: ' + nama + ' (' + kat + ') oleh ' + u.nama);
      return { ok: true, ada: false, jenis: jenis, kode: kodeItem, nama: nama, kategori: kat };
    }
    throw new Error('Jenis master tidak dikenal: ' + jenis);
  } finally { lock.releaseLock(); }
}

/* ================= BOOTSTRAP ================= */

function getKonteks(ident) {
  var u = penggunaSaatIni_(ident);

  var items = baca_(SHEET.ITEM).filter(function (r) {
    return String(r.Aktif).toUpperCase() !== 'TIDAK' && r.Kode_Item;
  }).map(function (r) {
    return { kode: r.Kode_Item, nama: r.Nama_Item, kategori: r.Kategori };
  });

  var supplier = baca_(SHEET.SUPPLIER).filter(function (r) {
    return String(r.Aktif).toUpperCase() !== 'TIDAK' && r.Nama_Supplier;
  }).map(function (r) { return { kode: r.Kode_Supplier, nama: r.Nama_Supplier }; });

  var customer = baca_(SHEET.CUSTOMER).filter(function (r) {
    return String(r.Aktif).toUpperCase() !== 'TIDAK' && r.Nama_Customer;
  }).map(function (r) { return { kode: r.Kode_Customer, nama: r.Nama_Customer }; });

  var hariIni = tglStr_(new Date());
  var rcv = baca_(SHEET.PENERIMAAN);
  var snd = baca_(SHEET.PENGIRIMAN);
  var pkj = baca_(SHEET.PEKERJAAN);

  function hitungStatus(rows, st) {
    return rows.filter(function (r) { return r.Status === st; }).length;
  }
  function menunggu(rows) { return hitungStatus(rows, STATUS_TRANSFER.MENUNGGU); }
  function ditandai(rows) { return hitungStatus(rows, STATUS_TRANSFER.DITANDAI); }

  var berjalan = pkj.filter(function (r) { return r.Status === STATUS_PEKERJAAN.BERJALAN; });
  var kgProses = berjalan.reduce(function (a, r) { return a + angka_(r.Total_Bahan_Baku_Kg); }, 0);

  var masukHariIni = rcv.filter(function (r) {
    return r.Jenis === JENIS_PENERIMAAN.MASUK && String(r.Tanggal) === hariIni && dihitung_(r);
  }).reduce(function (a, r) { return a + angka_(r.Qty_Kg); }, 0);

  var keluarHariIni = snd.filter(function (r) {
    return r.Jenis === JENIS_PENGIRIMAN.KELUAR && String(r.Tanggal) === hariIni && dihitung_(r);
  }).reduce(function (a, r) { return a + angka_(r.Qty_Kg); }, 0);

  var susutTinggi = pkj.filter(function (r) {
    return r.Status === STATUS_PEKERJAAN.SELESAI && r.Status_Susut !== 'NORMAL' && r.Status_Susut &&
           tglStr_(new Date(r.Waktu_Selesai)) === hariIni;
  }).length;

  /* stok per item untuk petunjuk di form ("tersedia: … kg") — v9: satu lokasi (GBJ) */
  var stokSemua = hitungStokSemua_(), stok = {};
  var dipesan = soDipesan_();
  Object.keys(stokSemua).forEach(function (k) { stok[k] = { gbj: bulat_(stokSemua[k].gbj, 2), dipesan: bulat_(dipesan[k] || 0, 2) }; });
  var daurBerjalanN = baca_(SHEET.DAUR).filter(function (r) { return r.Status === STATUS_DAUR.BERJALAN; }).length;
  var permintaanMenunggu = bolehReview_(u)
    ? baca_(SHEET.PERMINTAAN).filter(function (r) { return r.Status === STATUS_PERMINTAAN.MENUNGGU; }).length : 0;
  var kerusakanMenunggu = bolehReview_(u)
    ? baca_(SHEET.KERUSAKAN).filter(function (r) { return r.Status === STATUS_TRANSFER.MENUNGGU; }).length : 0;
  var poTerbukaN = baca_(SHEET.PO).filter(function (r) { return r.Status === STATUS_PO.TERBUKA || r.Status === STATUS_PO.SEBAGIAN; }).length;
  var invoiceMenunggu = bolehReview_(u)
    ? baca_(SHEET.INVOICE).filter(function (r) { return r.Status === STATUS_INVOICE.MENUNGGU; }).length : 0;
  /* barang yang akan datang (PO terbuka) — untuk semua peran, TANPA harga */
  var poDatang = baca_(SHEET.PO).filter(function (r) { return r.Status === STATUS_PO.TERBUKA || r.Status === STATUS_PO.SEBAGIAN; })
    .map(function (r) { var o = ringkasPo_(r, false); return { noPo: o.noPo, supplier: o.supplier, item: o.item, kode: o.kode, sisa: o.sisa, datang: o.perkiraanDatang, spesifikasi: o.spesifikasi }; })
    .sort(function (a, b) { return String(a.datang || '9999').localeCompare(String(b.datang || '9999')); });
  var perluBeli = bolehReview_(u) ? prediksiBeli(ident).filter(function (x) { return x.status === 'PERLU_BELI'; }).length : 0;
  var soHariIni = (typeof soKirimHariIni_ === 'function') ? soKirimHariIni_(hariIni) : [];
  var soTerbukaN = baca_(SHEET.SO).filter(function (r) { return r.Status === STATUS_SO.TERBUKA || r.Status === STATUS_SO.SEBAGIAN; }).length;

  return {
    app: { nama: APP.nama, versi: APP.versi, satuan: APP.satuan },
    user: u,
    hariIni: hariIni,
    maksMundurHari: MAKS_MUNDUR_HARI,
    maksEditHari: maksEditHari_(),
    stok: stok,
    bisaReview: bolehReview_(u),
    bisaAdmin: bolehAdmin_(u),
    lihatHpp: bolehLihatHpp_(u),
    bisaPo: bolehPo_(u),
    metodeHpp: metodeHpp_(),
    wajibPo: wajibPo_(),
    mataUang: mataUang_(),
    identitasManual: !!u.identitasManual,
    perluNama: !!u.perluNama,
    daftarNama: u.identitasManual ? baca_(SHEET.PENGGUNA)
        .filter(function (r) { return r.Nama && String(r.Aktif).toUpperCase() !== 'TIDAK'; })
        .map(function (r) { return String(r.Nama); }) : [],
    ocrAktif: (getSetting_('OCR_AKTIF') || 'YA').toUpperCase() === 'YA' && typeof Drive !== 'undefined',
    bahasa: getSetting_('BAHASA_DEFAULT') || 'id',
    items: items,
    supplier: supplier,
    customer: customer,
    wajibSjKeluar: (getSetting_('WAJIB_SJ_KELUAR') || 'YA').toUpperCase() === 'YA',
    poDatang: poDatang,
    soHariIni: soHariIni,
    leadTimeHari: leadTimeHari_(),
    ringkasan: {
      perluBeli: perluBeli,
      menungguReview   : menunggu(rcv) + menunggu(snd),
      ditandai         : ditandai(rcv) + ditandai(snd),
      daurBerjalan     : daurBerjalanN,
      pekerjaanBerjalan: berjalan.length,
      kgSedangDiproses : bulat_(kgProses, 1),
      masukHariIni     : bulat_(masukHariIni, 1),
      keluarHariIni    : bulat_(keluarHariIni, 1),
      susutTinggiHariIni: susutTinggi,
      permintaanMenunggu: permintaanMenunggu,
      kerusakanMenunggu: kerusakanMenunggu,
      invoiceMenunggu: invoiceMenunggu,
      poTerbuka: poTerbukaN,
      soTerbuka: soTerbukaN
    }
  };
}

/* =================================================================
   ⓪  PEMBELIAN MASUK & RETUR   (Supplier ↔ GBJ)
   ================================================================= */

/**
 * p = { jenis:'MASUK'|'RETUR', supplier, noSuratJalan, baris:[{kode,qty}],
 *       catatan, foto, qtyOcr, ident }
 */
function simpanPenerimaan(p) {
  var u = penggunaSaatIni_(p && p.ident);
  if (!p || !p.baris || !p.baris.length) throw new Error('Item belum diisi.');
  var jenis = p.jenis === JENIS_PENERIMAAN.RETUR ? JENIS_PENERIMAAN.RETUR : JENIS_PENERIMAAN.MASUK;
  if (!String(p.supplier || '').trim()) throw new Error('Supplier belum dipilih.');
  if (jenis === JENIS_PENERIMAAN.MASUK && !String(p.noSuratJalan || '').trim()) {
    throw new Error('No. surat jalan wajib diisi untuk penerimaan barang.');
  }

  var peta = petaItem_();
  var foto = p.foto ? unggahFoto_(p.foto, jenis === JENIS_PENERIMAAN.RETUR ? 'RTR' : 'RCV')
                    : { url: '', id: '' };

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();   // di dalam lock: baca ulang dari sheet, jangan pakai memo sebelum lock
  try {
    var now = new Date();
    var tanggal = tglValid_(p.tanggal);
    var qtyOcr = angka_(p.qtyOcr);
    var totalQty = 0;
    p.baris.forEach(function (b) { totalQty += angka_(b.qty); });

    /* v7: PO (penerimaan) & penerimaan asal (retur) */
    var poRows = {}, poSemua = null;
    var returSisa = null;
    if (jenis === JENIS_PENERIMAAN.MASUK) {
      poSemua = baca_(SHEET.PO); poSemua.forEach(function (r) { poRows[r.ID] = r; });
      if (wajibPo_() && p.baris.some(function (b) { return !b.idPo; })) throw new Error('Penerimaan wajib merujuk PO (WAJIB_PO = YA).');
    } else {
      returSisa = {}; hitungReturSisa_(null).forEach(function (x) { returSisa[x.id] = x; });
    }

    var ids = [], poDisentuh = {};
    p.baris.forEach(function (b, i) {
      var it = peta[b.kode];
      var qty = angka_(b.qty);
      var idPo = '', harga = '', idAsal = '';
      if (jenis === JENIS_PENERIMAAN.MASUK && b.idPo) {
        var po = poRows[b.idPo];
        if (!po) throw new Error('PO tidak ditemukan: ' + b.idPo);
        if (po.Status === STATUS_PO.DIBATALKAN) throw new Error('PO ' + po.No_PO + ' sudah dibatalkan.');
        if (String(po.Supplier) !== String(p.supplier)) throw new Error('Supplier tidak sama dengan PO ' + po.No_PO + ' (' + po.Supplier + ').');
        it = peta[po.Kode_Item]; idPo = po.ID; harga = angka_(po.Harga_Per_Kg); poDisentuh[po.ID] = 1;
      }
      if (jenis === JENIS_PENERIMAAN.RETUR) {
        if (!b.idAsal) throw new Error('Retur harus merujuk penerimaan yang sudah tercatat (pilih barang yang diterima).');
        var asal = returSisa[b.idAsal];
        if (!asal) throw new Error('Penerimaan asal tidak ditemukan / sudah habis diretur: ' + b.idAsal);
        if (qty > asal.sisa + 0.0001) throw new Error('Qty retur ' + it.nama + ' melebihi yang bisa diretur (' + asal.sisa + ' kg).');
        if (String(asal.supplier) !== String(p.supplier)) throw new Error('Supplier tidak sama dengan penerimaan asal (' + asal.supplier + ').');
        it = peta[asal.kode]; idAsal = asal.id; asal.sisa -= qty;
      }
      if (!it) throw new Error('Item tidak dikenal: ' + b.kode);
      if (qty <= 0) throw new Error('Qty harus lebih dari 0 untuk ' + it.nama);

      var id = buatId_(jenis === JENIS_PENERIMAAN.RETUR ? 'RTR' : 'RCV');
      ids.push(id);
      tambah_(SHEET.PENERIMAAN, {
        ID: id, Waktu: now, Tanggal: tanggal, Jenis: jenis,
        Supplier: p.supplier, No_Surat_Jalan: p.noSuratJalan || '',
        Kode_Item: it.kode, Nama_Item: it.nama, Qty_Kg: qty,
        Qty_OCR: (i === 0 && qtyOcr) ? qtyOcr : '',
        Selisih_OCR: (i === 0 && qtyOcr) ? bulat_(totalQty - qtyOcr, 3) : '',
        Foto_URL: foto.url, Foto_ID: foto.id,
        Dicatat_Oleh: u.email || ('manual:' + u.nama), Nama_Pencatat: u.nama,
        Status: STATUS_TRANSFER.MENUNGGU,
        Ditinjau_Oleh: '', Waktu_Tinjau: '', Catatan_Tinjau: '',
        Catatan: p.catatan || '', Log_Edit: '',
        ID_PO: idPo, Harga_Per_Kg: harga, ID_Penerimaan_Asal: idAsal, Catatan_QC: p.catatanQc || ''
      });
    });
    Object.keys(poDisentuh).forEach(sinkronPo_);

    catatLog_(jenis === JENIS_PENERIMAAN.RETUR ? 'RETUR' : 'PENERIMAAN',
              ids.join(','), p.supplier + ' • ' + bulat_(totalQty, 2) + ' kg');
    return { ok: true, ids: ids, jumlah: ids.length, totalKg: bulat_(totalQty, 2), jenis: jenis, tanpaPo: jenis === JENIS_PENERIMAAN.MASUK && !Object.keys(poDisentuh).length };
  } finally {
    lock.releaseLock();
  }
}

/* =================================================================
   ④  PENJUALAN KELUAR & RETUR DARI CUSTOMER   (GBJ ↔ Customer)
   ================================================================= */

/**
 * p = { jenis:'KELUAR'|'RETUR_MASUK', customer, noSuratJalan, baris:[{kode,qty}],
 *       catatan, foto, ident }
 */
function simpanPengiriman(p) {
  var u = penggunaSaatIni_(p && p.ident);
  if (!p || !p.baris || !p.baris.length) throw new Error('Item belum diisi.');
  var jenis = p.jenis === JENIS_PENGIRIMAN.RETUR_MASUK ? JENIS_PENGIRIMAN.RETUR_MASUK
                                                       : JENIS_PENGIRIMAN.KELUAR;
  if (!String(p.customer || '').trim()) throw new Error('Customer belum dipilih.');

  var wajibSJ = (getSetting_('WAJIB_SJ_KELUAR') || 'YA').toUpperCase() === 'YA';
  if (jenis === JENIS_PENGIRIMAN.KELUAR && wajibSJ && !String(p.noSuratJalan || '').trim()) {
    throw new Error('No. surat jalan wajib diisi untuk barang keluar.');
  }

  var peta = petaItem_();
  var foto = p.foto ? unggahFoto_(p.foto, jenis === JENIS_PENGIRIMAN.RETUR_MASUK ? 'RTC' : 'OUT')
                    : { url: '', id: '' };

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();   // di dalam lock: baca ulang dari sheet, jangan pakai memo sebelum lock
  try {
    var now = new Date();
    var tanggal = tglValid_(p.tanggal);
    var fifoJual = (jenis === JENIS_PENGIRIMAN.KELUAR && metodeHpp_() === 'FIFO') ? hitungFifo_() : null;
    var ids = [], total = 0;
    /* v8: sales order — baris pengiriman boleh merujuk baris SO (item ikut SO, customer harus sama, tidak melebihi sisa) */
    var soRows = {}, soDisentuh = {};
    if (jenis === JENIS_PENGIRIMAN.KELUAR && p.baris.some(function (b) { return b.idSo; })) {
      baca_(SHEET.SO).forEach(function (r) { soRows[r.ID] = r; });
    }

    p.baris.forEach(function (b) {
      var it = peta[b.kode], idSo = '';
      if (jenis === JENIS_PENGIRIMAN.KELUAR && b.idSo) {
        var so = soRows[b.idSo];
        if (!so) throw new Error('Sales order tidak ditemukan: ' + b.idSo);
        if (so.Status === STATUS_SO.DIBATALKAN || so.Status === STATUS_SO.SELESAI) throw new Error('SO ' + so.No_SO + ' sudah ' + so.Status + '.');
        if (String(so.Customer) !== String(p.customer)) throw new Error('Customer tidak sama dengan SO ' + so.No_SO + ' (' + so.Customer + ').');
        var sisaSo = angka_(so.Qty_Kg) - angka_(so.Qty_Dikirim_Kg) - (soDisentuh[so.ID] || 0);
        if (angka_(b.qty) > sisaSo + 0.0001) throw new Error('Qty ' + so.Nama_Item + ' melebihi sisa SO ' + so.No_SO + ' (' + bulat_(sisaSo, 2) + ' kg).');
        it = peta[so.Kode_Item]; idSo = so.ID; soDisentuh[so.ID] = (soDisentuh[so.ID] || 0) + angka_(b.qty);
      }
      if (!it) throw new Error('Item tidak dikenal: ' + b.kode);
      var qty = angka_(b.qty);
      if (qty <= 0) throw new Error('Qty harus lebih dari 0 untuk ' + it.nama);
      total += qty;

      var id = buatId_(jenis === JENIS_PENGIRIMAN.RETUR_MASUK ? 'RTC' : 'OUT');
      ids.push(id);
      tambah_(SHEET.PENGIRIMAN, {
        ID: id, Waktu: now, Tanggal: tanggal, Jenis: jenis,
        Customer: p.customer, No_Surat_Jalan: p.noSuratJalan || '',
        Kode_Item: it.kode, Nama_Item: it.nama, Qty_Kg: qty,
        Foto_URL: foto.url, Foto_ID: foto.id,
        Dicatat_Oleh: u.email || ('manual:' + u.nama), Nama_Pencatat: u.nama,
        Status: STATUS_TRANSFER.MENUNGGU,
        Ditinjau_Oleh: '', Waktu_Tinjau: '', Catatan_Tinjau: '',
        Catatan: p.catatan || '', Log_Edit: '',
        HPP_Per_Kg: fifoJual ? hargaKeluarGbjFifo_(fifoJual, it.kode, qty, peta) : '',
        ID_SO: idSo
      });
    });
    Object.keys(soDisentuh).forEach(function (idSo) { sinkronSo_(idSo); });

    catatLog_(jenis === JENIS_PENGIRIMAN.RETUR_MASUK ? 'RETUR_CUSTOMER' : 'PENJUALAN',
              ids.join(','), p.customer + ' • ' + bulat_(total, 2) + ' kg');
    return { ok: true, ids: ids, jumlah: ids.length, totalKg: bulat_(total, 2), jenis: jenis };
  } finally {
    lock.releaseLock();
  }
}

/* =================================================================
   ①  PEKERJAAN  (bahan baku dari GBJ → barang jadi & scrap kembali ke GBJ)
   ================================================================= */

/** p = { kodeProduk, bahanBaku:[{kode,qty}], catatan, foto, ident } */
function mulaiPekerjaan(p) {
  var u = penggunaSaatIni_(p && p.ident);
  if (!p || !p.kodeProduk) throw new Error('Produk belum dipilih.');
  if (!p.bahanBaku || !p.bahanBaku.length) throw new Error('Bahan baku belum diisi.');

  var peta = petaItem_();
  var produk = peta[p.kodeProduk];
  if (!produk) throw new Error('Produk tidak dikenal.');

  var foto = p.foto ? unggahFoto_(p.foto, 'JOB-START') : { url: '', id: '' };

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();   // di dalam lock: baca ulang dari sheet, jangan pakai memo sebelum lock
  try {
    var now = new Date();
    var tanggal = tglValid_(p.tanggal);
    var id = buatId_('JOB');
    var total = 0, hppBahan = 0;
    var fifo = metodeHpp_() === 'FIFO' ? hitungFifo_() : null;

    p.bahanBaku.forEach(function (b) {
      var it = peta[b.kode];
      if (!it) throw new Error('Bahan baku tidak dikenal: ' + b.kode);
      var q = angka_(b.qty);
      if (q <= 0) throw new Error('Qty bahan baku harus > 0 (' + it.nama + ')');
      total += q;
      var harga = fifo ? hargaDariFifo_(fifo, it.kode, q, peta) : it.harga;   // snapshot harga saat job dimulai (FIFO batch tertua di gudang)
      var nilai = q * harga;
      hppBahan += nilai;
      tambah_(SHEET.DETAIL, {
        ID: buatId_('DTL'), ID_Pekerjaan: id, Jenis: JENIS_DETAIL.BAHAN_BAKU,
        Kode_Item: it.kode, Nama_Item: it.nama, Qty_Kg: q,
        Harga_Per_Kg: bulat_(harga, 2), Nilai: bulat_(nilai, 0), Waktu: now
      });
    });

    var hppProses = total * biayaProsesPerKg_();

    tambah_(SHEET.PEKERJAAN, {
      ID: id, Waktu_Mulai: now, Waktu_Selesai: '', Tanggal: tanggal,
      Kode_Produk: produk.kode, Nama_Produk: produk.nama, Status: STATUS_PEKERJAAN.BERJALAN,
      Total_Bahan_Baku_Kg: bulat_(total, 3),
      Total_Barang_Jadi_Kg: '', Total_Scrap_Kg: '',
      Susut_Kg: '', Susut_Persen: '', Status_Susut: '',
      HPP_Bahan: bulat_(hppBahan, 0), HPP_Proses: bulat_(hppProses, 0),
      HPP_Total: bulat_(hppBahan + hppProses, 0), HPP_Per_Kg: '', Nilai_Susut: '',
      Operator: u.email || ('manual:' + u.nama), Nama_Operator: u.nama,
      Foto_Mulai_URL: foto.url, Foto_Selesai_URL: '', Catatan: p.catatan || ''
    });

    catatLog_('PEKERJAAN_MULAI', id, produk.nama + ' • ' + bulat_(total, 2) + ' kg');
    var out = { ok: true, id: id, produk: produk.nama, totalKg: bulat_(total, 2) };
    if (bolehLihatHpp_(u)) out.hpp = { bahan: bulat_(hppBahan, 0), proses: bulat_(hppProses, 0),
                                       total: bulat_(hppBahan + hppProses, 0) };
    return out;
  } finally {
    lock.releaseLock();
  }
}

/** p = { id, barangJadi:[{kode,qty}], scrap:[{kode,qty}], catatan, foto, ident } */
function selesaikanPekerjaan(p) {
  var u = penggunaSaatIni_(p && p.ident);
  if (!p || !p.id) throw new Error('ID pekerjaan kosong.');
  if (!p.barangJadi || !p.barangJadi.length) throw new Error('Barang jadi belum diisi.');

  var peta = petaItem_();
  var foto = p.foto ? unggahFoto_(p.foto, 'JOB-END') : { url: '', id: '' };

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();   // di dalam lock: baca ulang dari sheet, jangan pakai memo sebelum lock
  try {
    var jobs = baca_(SHEET.PEKERJAAN);
    var job = null;
    for (var i = 0; i < jobs.length; i++) if (jobs[i].ID === p.id) job = jobs[i];
    if (!job) throw new Error('Pekerjaan tidak ditemukan.');
    if (job.Status === STATUS_PEKERJAAN.SELESAI) throw new Error('Pekerjaan ini sudah ditutup.');

    var now = new Date();
    var totalJadi = 0, totalScrap = 0;

    (p.barangJadi || []).forEach(function (b) {
      var it = peta[b.kode]; if (!it) throw new Error('Item tidak dikenal: ' + b.kode);
      var q = angka_(b.qty); if (q <= 0) throw new Error('Qty barang jadi harus > 0 (' + it.nama + ')');
      totalJadi += q;
      tambah_(SHEET.DETAIL, { ID: buatId_('DTL'), ID_Pekerjaan: job.ID, Jenis: JENIS_DETAIL.BARANG_JADI,
        Kode_Item: it.kode, Nama_Item: it.nama, Qty_Kg: q, Waktu: now });
    });

    /* scrap: satu angka, dicatat sebagai SKU scrap milik produk ini */
    var scrapKg = angka_(p.scrapKg);
    (p.scrap || []).forEach(function (b) { scrapKg += angka_(b.qty); });   // format lama (list) masih diterima
    if (scrapKg < 0) throw new Error('Scrap tidak boleh negatif.');
    if (scrapKg > 0) {
      var produkJob = peta[job.Kode_Produk] || { kode: job.Kode_Produk, nama: job.Nama_Produk };
      var scr = skuScrapUntuk_(produkJob);
      totalScrap = scrapKg;
      tambah_(SHEET.DETAIL, { ID: buatId_('DTL'), ID_Pekerjaan: job.ID, Jenis: JENIS_DETAIL.SCRAP,
        Kode_Item: scr.kode, Nama_Item: scr.nama, Qty_Kg: scrapKg, Waktu: now });
    }

    var masuk = angka_(job.Total_Bahan_Baku_Kg);
    var h = hitungSusut_(masuk, totalJadi, totalScrap, job.Kode_Produk);

    /* HPP: total biaya dibagi kg barang jadi; nilai susut = kg susut × harga rata-rata bahan */
    var hppTotal = angka_(job.HPP_Total);
    var hppPerKg = totalJadi > 0 ? hppTotal / totalJadi : 0;
    var hargaRata = masuk > 0 ? angka_(job.HPP_Bahan) / masuk : 0;
    var nilaiSusut = Math.max(0, h.susut) * hargaRata;

    ubahBaris_(SHEET.PEKERJAAN, job._baris, {
      Waktu_Selesai: now, Status: STATUS_PEKERJAAN.SELESAI,
      Total_Barang_Jadi_Kg: bulat_(totalJadi, 3),
      Total_Scrap_Kg: bulat_(totalScrap, 3),
      Susut_Kg: h.susut, Susut_Persen: h.persen, Status_Susut: h.status,
      HPP_Per_Kg: bulat_(hppPerKg, 0), Nilai_Susut: bulat_(nilaiSusut, 0),
      Foto_Selesai_URL: foto.url,
      Catatan: [job.Catatan, p.catatan].filter(String).join(' | ')
    });

    /* susutnya dari bahan apa — dialokasikan proporsional ke tiap bahan baku */
    var rincian = rincianSusutJob_(job.ID, angka_(job.Total_Bahan_Baku_Kg), h.susut);

    catatLog_('PEKERJAAN_SELESAI', job.ID, 'susut ' + h.susut + ' kg (' + h.persen + '%, ' + h.status + ')');
    var out = { ok: true, susut: h.susut, persen: h.persen, status: h.status,
                batas: h.batas, standar: h.standar, produk: job.Nama_Produk,
                masuk: masuk, jadi: bulat_(totalJadi, 2),
                scrap: bulat_(totalScrap, 2), rincian: rincian };
    if (bolehLihatHpp_(u)) {
      out.hpp = { bahan: angka_(job.HPP_Bahan), proses: angka_(job.HPP_Proses),
                  total: hppTotal, perKg: bulat_(hppPerKg, 0), nilaiSusut: bulat_(nilaiSusut, 0) };
    }
    return out;
  } finally {
    lock.releaseLock();
  }
}

/**
 * SUSUT = Bahan Baku Masuk − Barang Jadi − Scrap   (kg)
 */
function hitungSusut_(bahanBaku, barangJadi, scrap, kodeProduk) {
  var susut = bahanBaku - barangJadi - scrap;
  var persen = bahanBaku > 0 ? (susut / bahanBaku) * 100 : 0;
  var std = standarSusut_(kodeProduk);
  var batas = std.normal + std.toleransi;
  var status;
  if (persen < 0) status = 'ANOMALI';
  else if (persen > batas) status = 'TINGGI';
  else status = 'NORMAL';
  return { susut: bulat_(susut, 3), persen: bulat_(persen, 2), status: status,
           batas: bulat_(batas, 2), standar: bulat_(std.normal, 2) };
}

function standarSusut_(kodeProduk) {
  var rows = baca_(SHEET.STANDAR);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].Kode_Produk === kodeProduk) {
      return { normal: angka_(rows[i].Susut_Normal_Persen) || DEFAULT_SUSUT_NORMAL_PERSEN,
               toleransi: angka_(rows[i].Toleransi_Persen) || DEFAULT_TOLERANSI_PERSEN };
    }
  }
  return { normal: DEFAULT_SUSUT_NORMAL_PERSEN, toleransi: DEFAULT_TOLERANSI_PERSEN };
}

/**
 * Susut satu job dipecah ke bahan bakunya, proporsional terhadap kg masuk.
 * Job satu bahan -> angkanya persis. Job banyak bahan -> perkiraan.
 */
function rincianSusutJob_(idJob, totalMasuk, susut, detailCache) {
  var det = (detailCache || baca_(SHEET.DETAIL)).filter(function (d) {
    return d.ID_Pekerjaan === idJob && d.Jenis === JENIS_DETAIL.BAHAN_BAKU;
  });
  if (!det.length || totalMasuk <= 0) return [];
  return det.map(function (d) {
    var q = angka_(d.Qty_Kg);
    return { kode: d.Kode_Item, nama: d.Nama_Item, masuk: bulat_(q, 2),
             susut: bulat_(susut * (q / totalMasuk), 3),
             porsi: bulat_((q / totalMasuk) * 100, 1) };
  }).sort(function (a, b) { return b.susut - a.susut; });
}

function daftarPekerjaanBerjalan(ident) {
  var u = penggunaSaatIni_(ident);
  var lihatHpp = bolehLihatHpp_(u);
  var det = baca_(SHEET.DETAIL);
  return baca_(SHEET.PEKERJAAN)
    .filter(function (r) { return r.Status === STATUS_PEKERJAAN.BERJALAN; })
    .map(function (r) {
      var bahan = det.filter(function (d) {
        return d.ID_Pekerjaan === r.ID && d.Jenis === JENIS_DETAIL.BAHAN_BAKU;
      }).map(function (d) { return { kode: d.Kode_Item, nama: d.Nama_Item, qty: angka_(d.Qty_Kg) }; })
        .sort(function (a, b) { return b.qty - a.qty; });
      var mulai = new Date(r.Waktu_Mulai);
      var jamJalan = Math.max(0, Math.round((Date.now() - mulai.getTime()) / 3600000 * 10) / 10);
      var o = {
        id: r.ID, produk: r.Nama_Produk, kodeProduk: r.Kode_Produk,
        totalKg: bulat_(angka_(r.Total_Bahan_Baku_Kg), 2),
        bahanUtama: bahan.length ? bahan[0].nama : '',
        bahan: bahan, jumlahBahan: bahan.length,
        mulai: jam_(mulai), jamJalan: jamJalan,
        operator: r.Nama_Operator,
        batas: standarSusut_(r.Kode_Produk).normal + standarSusut_(r.Kode_Produk).toleransi
      };
      if (lihatHpp) o.hpp = { bahan: angka_(r.HPP_Bahan), proses: angka_(r.HPP_Proses), total: angka_(r.HPP_Total) };
      return o;
    })
    .sort(function (a, b) { return b.totalKg - a.totalKg; });
}

/* =================================================================
   ANTRIAN REVIEW  (penerimaan + pengiriman)
   ================================================================= */

/**
 * status: 'MENUNGGU' (default) atau 'DITANDAI' (arsip untuk direvisi).
 */
function antrianReview(ident, status) {
  var u = penggunaSaatIni_(ident);
  if (!bolehReview_(u)) throw new Error('Hanya Supervisor / Admin yang bisa membuka antrian review.');
  var target = (status === STATUS_TRANSFER.DITANDAI) ? STATUS_TRANSFER.DITANDAI : STATUS_TRANSFER.MENUNGGU;

  var out = [];

  var noPoDariId = {};
  baca_(SHEET.PO).forEach(function (p) { noPoDariId[p.ID] = { noPo: p.No_PO, spesifikasi: p.Spesifikasi || '' }; });
  baca_(SHEET.PENERIMAAN).forEach(function (r) {
    if (r.Status !== target) return;
    var po = r.ID_PO ? noPoDariId[r.ID_PO] : null;
    out.push({
      id: r.ID, sumber: 'PENERIMAAN', jenis: r.Jenis, tanggal: r.Tanggal,
      idPo: r.ID_PO || '', noPo: po ? po.noPo : '', spesifikasi: po ? po.spesifikasi : '', catatanQc: r.Catatan_QC || '',
      tanpaPo: r.Jenis === JENIS_PENERIMAAN.MASUK && !r.ID_PO,
      label: r.Jenis === JENIS_PENERIMAAN.RETUR ? 'GBJ → ' + r.Supplier : r.Supplier + ' → GBJ',
      waktuRaw: new Date(r.Waktu).getTime(), waktu: jam_(r.Waktu),
      item: r.Nama_Item, kode: r.Kode_Item, qty: angka_(r.Qty_Kg),
      noSuratJalan: r.No_Surat_Jalan, supplier: r.Supplier,
      qtyOcr: r.Qty_OCR === '' ? null : angka_(r.Qty_OCR),
      selisih: r.Selisih_OCR === '' ? null : angka_(r.Selisih_OCR),
      foto: r.Foto_URL, fotoId: r.Foto_ID, pencatat: r.Nama_Pencatat, catatan: r.Catatan,
      catatanTinjau: r.Catatan_Tinjau, ditinjauOleh: r.Ditinjau_Oleh
    });
  });

  baca_(SHEET.PENGIRIMAN).forEach(function (r) {
    if (r.Status !== target) return;
    out.push({
      id: r.ID, sumber: 'PENGIRIMAN', jenis: r.Jenis,
      label: r.Jenis === JENIS_PENGIRIMAN.RETUR_MASUK ? r.Customer + ' → GBJ' : 'GBJ → ' + r.Customer,
      waktuRaw: new Date(r.Waktu).getTime(), waktu: jam_(r.Waktu),
      item: r.Nama_Item, kode: r.Kode_Item, qty: angka_(r.Qty_Kg),
      noSuratJalan: r.No_Surat_Jalan, supplier: r.Customer,
      qtyOcr: null, selisih: null,
      foto: r.Foto_URL, fotoId: r.Foto_ID, pencatat: r.Nama_Pencatat, catatan: r.Catatan,
      catatanTinjau: r.Catatan_Tinjau, ditinjauOleh: r.Ditinjau_Oleh
    });
  });

  return out.sort(function (a, b) { return b.waktuRaw - a.waktuRaw; });
}

/**
 * aksi: 'setuju' → DISETUJUI (final)
 *       'tandai' → DITANDAI  (diarsipkan, bisa dibuka lagi; tetap dihitung di stok)
 *       'batal'  → DIBATALKAN (final; tidak dihitung di stok)
 * MENUNGGU boleh ke mana saja. DITANDAI boleh ke DISETUJUI / DIBATALKAN.
 */
function tinjauTransfer(id, aksi, catatan, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehReview_(u)) throw new Error('Tidak punya izin review.');
  var status = (aksi === 'setuju') ? STATUS_TRANSFER.DISETUJUI
             : (aksi === 'batal')  ? STATUS_TRANSFER.DIBATALKAN
             : STATUS_TRANSFER.DITANDAI;
  var nama = sheetDariId_(id);

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();   // di dalam lock: baca ulang dari sheet, jangan pakai memo sebelum lock
  try {
    var rows = baca_(nama);
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].ID === id) {
        var skrg = rows[i].Status;
        if (skrg === STATUS_TRANSFER.DISETUJUI || skrg === STATUS_TRANSFER.DIBATALKAN) {
          throw new Error('Entri ini sudah final (' + skrg + ').');
        }
        if (skrg === STATUS_TRANSFER.DITANDAI && status === STATUS_TRANSFER.DITANDAI) {
          throw new Error('Entri ini sudah ditandai.');
        }
        var catatanBaru = [rows[i].Catatan_Tinjau, catatan].filter(String).join(' | ');
        ubahBaris_(nama, rows[i]._baris, {
          Status: status, Ditinjau_Oleh: u.nama, Waktu_Tinjau: new Date(),
          Catatan_Tinjau: catatanBaru
        });
        if (nama === SHEET.PENERIMAAN && rows[i].ID_PO) sinkronPo_(rows[i].ID_PO);
        if (nama === SHEET.PENGIRIMAN && rows[i].ID_SO) sinkronSo_(rows[i].ID_SO);
        catatLog_('REVIEW', id, status);
        return { ok: true, status: status };
      }
    }
    throw new Error('Entri tidak ditemukan: ' + id);
  } finally {
    lock.releaseLock();
  }
}

function tinjauMassal(ids, aksi, catatan, ident) {
  var hasil = { ok: 0, gagal: 0 };
  (ids || []).forEach(function (id) {
    try { tinjauTransfer(id, aksi, catatan, ident); hasil.ok++; } catch (e) { hasil.gagal++; }
  });
  return hasil;
}

/* =================================================================
   LAPORAN
   ================================================================= */

/** Total susut + susutnya dari bahan apa. */
function laporanSusut(hari, ident) {
  penggunaSaatIni_(ident);
  hari = hari || 30;
  var batas = new Date();
  batas.setDate(batas.getDate() - hari);

  var rows = baca_(SHEET.PEKERJAAN).filter(function (r) {
    return r.Status === STATUS_PEKERJAAN.SELESAI && new Date(r.Waktu_Selesai) >= batas;
  });
  var detAll = baca_(SHEET.DETAIL);

  var totalMasuk = 0, totalJadi = 0, totalScrap = 0, totalSusut = 0, jobTinggi = 0;
  var perProduk = {}, perBahan = {};

  rows.forEach(function (r) {
    var masuk = angka_(r.Total_Bahan_Baku_Kg);
    var susut = angka_(r.Susut_Kg);
    totalMasuk += masuk;
    totalJadi  += angka_(r.Total_Barang_Jadi_Kg);
    totalScrap += angka_(r.Total_Scrap_Kg);
    totalSusut += susut;
    if (r.Status_Susut && r.Status_Susut !== 'NORMAL') jobTinggi++;

    var k = r.Kode_Produk;
    if (!perProduk[k]) perProduk[k] = { kode: k, nama: r.Nama_Produk, jobs: 0, masuk: 0, jadi: 0, scrap: 0, susut: 0, tinggi: 0 };
    var pp = perProduk[k];
    pp.jobs++; pp.masuk += masuk; pp.jadi += angka_(r.Total_Barang_Jadi_Kg);
    pp.scrap += angka_(r.Total_Scrap_Kg); pp.susut += susut;
    if (r.Status_Susut && r.Status_Susut !== 'NORMAL') pp.tinggi++;

    /* susutnya apa — alokasi proporsional ke bahan baku job ini */
    rincianSusutJob_(r.ID, masuk, susut, detAll).forEach(function (b) {
      if (!perBahan[b.kode]) perBahan[b.kode] = { kode: b.kode, nama: b.nama, masuk: 0, susut: 0, jobs: 0 };
      perBahan[b.kode].masuk += b.masuk;
      perBahan[b.kode].susut += b.susut;
      perBahan[b.kode].jobs++;
    });
  });

  var ringkasProduk = Object.keys(perProduk).map(function (k) {
    var p = perProduk[k];
    p.persen = p.masuk > 0 ? bulat_((p.susut / p.masuk) * 100, 2) : 0;
    var std = standarSusut_(k);
    p.batas = bulat_(std.normal + std.toleransi, 2);
    p.masuk = bulat_(p.masuk, 2); p.jadi = bulat_(p.jadi, 2);
    p.scrap = bulat_(p.scrap, 2); p.susut = bulat_(p.susut, 2);
    return p;
  }).sort(function (a, b) { return b.susut - a.susut; });

  var ringkasBahan = Object.keys(perBahan).map(function (k) {
    var b = perBahan[k];
    b.persen = b.masuk > 0 ? bulat_((b.susut / b.masuk) * 100, 2) : 0;
    b.porsiDariTotal = totalSusut > 0 ? bulat_((b.susut / totalSusut) * 100, 1) : 0;
    b.masuk = bulat_(b.masuk, 2); b.susut = bulat_(b.susut, 2);
    return b;
  }).sort(function (a, b) { return b.susut - a.susut; });

  var detail = rows.map(function (r) {
    return {
      id: r.ID, produk: r.Nama_Produk,
      tanggal: jam_(r.Waktu_Selesai),
      masuk: angka_(r.Total_Bahan_Baku_Kg), jadi: angka_(r.Total_Barang_Jadi_Kg),
      scrap: angka_(r.Total_Scrap_Kg), susut: angka_(r.Susut_Kg),
      persen: angka_(r.Susut_Persen), status: r.Status_Susut, operator: r.Nama_Operator
    };
  }).reverse();

  return {
    hari: hari,
    total: {
      jobs: rows.length, jobTinggi: jobTinggi,
      masuk: bulat_(totalMasuk, 2), jadi: bulat_(totalJadi, 2), scrap: bulat_(totalScrap, 2),
      susut: bulat_(totalSusut, 2),
      persen: totalMasuk > 0 ? bulat_((totalSusut / totalMasuk) * 100, 2) : 0
    },
    perBahan: ringkasBahan,
    perProduk: ringkasProduk,
    detail: detail.slice(0, 100)
  };
}

/**
 * Stok berjalan + dari mana asalnya. v9: SATU lokasi (GBJ) — pekerjaan memakai bahan dari GBJ
 * dan hasilnya (barang jadi + scrap) langsung masuk GBJ lagi. Tidak ada transfer.
 * GBJ = stok awal + pembelian − retur ke supplier + retur dari customer − terjual
 *       − bahan baku dipakai + barang jadi + scrap − scrap ke chassen + biji plastik daur ulang
 *       − rusak (disetujui) ± penyesuaian opname
 */
function hitungStokSemua_() {
  var peta = petaItem_();
  var stok = {};

  function sel(kode) {
    if (!stok[kode]) {
      var it = peta[kode] || { nama: kode };
      stok[kode] = { kode: kode, nama: it.nama, kategori: it.kategori || '',
                     awal: it.awal || 0,
                     beli: 0, retur: 0, jual: 0, returCust: 0,
                     dipakai: 0, dihasilkan: 0, daurKirim: 0, daurHasil: 0,
                     opname: 0, rusak: 0,
                     gbj: it.awal || 0 };
    }
    return stok[kode];
  }
  Object.keys(peta).forEach(sel);

  baca_(SHEET.PENERIMAAN).forEach(function (r) {
    if (!dihitung_(r)) return;
    var s = sel(r.Kode_Item), q = angka_(r.Qty_Kg);
    if (r.Jenis === JENIS_PENERIMAAN.RETUR) { s.retur += q; s.gbj -= q; }
    else { s.beli += q; s.gbj += q; }
  });

  baca_(SHEET.PENGIRIMAN).forEach(function (r) {
    if (!dihitung_(r)) return;
    var s = sel(r.Kode_Item), q = angka_(r.Qty_Kg);
    if (r.Jenis === JENIS_PENGIRIMAN.RETUR_MASUK) { s.returCust += q; s.gbj += q; }
    else { s.jual += q; s.gbj -= q; }
  });

  baca_(SHEET.DETAIL).forEach(function (d) {
    var s = sel(d.Kode_Item), q = angka_(d.Qty_Kg);
    if (d.Jenis === JENIS_DETAIL.BAHAN_BAKU) { s.dipakai += q; s.gbj -= q; }
    else { s.dihasilkan += q; s.gbj += q; }
  });

  /* v9: daur ulang — scrap keluar ke chassen, biji plastik kembali (batch DIBATALKAN tidak dihitung) */
  var daurAktif = {};
  baca_(SHEET.DAUR).forEach(function (r) { if (r.Status !== STATUS_DAUR.DIBATALKAN) daurAktif[r.ID] = true; });
  baca_(SHEET.DAUR_DETAIL).forEach(function (d) {
    if (!daurAktif[d.ID_Daur]) return;
    var s = sel(d.Kode_Item), q = angka_(d.Qty_Kg);
    if (d.Jenis === JENIS_DAUR_DETAIL.SCRAP) { s.daurKirim += q; s.gbj -= q; }
    else { s.daurHasil += q; s.gbj += q; }
  });

  /* barang rusak yang sudah disetujui manager */
  baca_(SHEET.KERUSAKAN).forEach(function (r) {
    if (r.Status !== STATUS_TRANSFER.DISETUJUI) return;
    var s = sel(r.Kode_Item), q = angka_(r.Qty_Kg);
    s.rusak += q; s.gbj -= q;
  });

  /* penyesuaian dari stock opname: selisih = fisik − sistem saat dihitung */
  baca_(SHEET.OPNAME).forEach(function (r) {
    var s = sel(r.Kode_Item), d = angka_(r.Selisih);
    s.opname += d; s.gbj += d;
  });
  return stok;
}

function laporanStok(ident) {
  penggunaSaatIni_(ident);
  var stok = hitungStokSemua_();

  var daftar = Object.keys(stok).map(function (k) {
    var s = stok[k];
    ['awal','beli','retur','jual','returCust','dipakai','dihasilkan','daurKirim','daurHasil','opname','rusak','gbj'].forEach(function (f) {
      s[f] = bulat_(s[f], 2);
    });
    s.total = s.gbj;
    return s;
  }).filter(function (s) {
    return s.awal || s.beli || s.retur || s.jual || s.returCust ||
           s.dipakai || s.dihasilkan || s.daurKirim || s.daurHasil || s.opname || s.rusak;
  }).sort(function (a, b) { return b.total - a.total; });

  var tot = { beli: 0, retur: 0, jual: 0, returCust: 0, rusak: 0, daurKirim: 0, daurHasil: 0, gbj: 0, total: 0 };
  daftar.forEach(function (s) {
    tot.beli += s.beli; tot.retur += s.retur;
    tot.jual += s.jual; tot.returCust += s.returCust;
    tot.rusak += s.rusak; tot.daurKirim += s.daurKirim; tot.daurHasil += s.daurHasil;
    tot.gbj += s.gbj; tot.total += s.total;
  });
  Object.keys(tot).forEach(function (k) { tot[k] = bulat_(tot[k], 2); });

  return { total: tot, daftar: daftar };
}

/** Riwayat pembelian & retur. */
function riwayatPenerimaan(hari, ident) {
  penggunaSaatIni_(ident);
  var batas = new Date();
  batas.setDate(batas.getDate() - (hari || 30));
  var rows = baca_(SHEET.PENERIMAAN).filter(function (r) { return new Date(r.Waktu) >= batas; });

  var totMasuk = 0, totRetur = 0;
  rows.forEach(function (r) {
    if (!dihitung_(r)) return;
    if (r.Jenis === JENIS_PENERIMAAN.RETUR) totRetur += angka_(r.Qty_Kg);
    else totMasuk += angka_(r.Qty_Kg);
  });

  var perSupplier = {};
  rows.forEach(function (r) {
    if (!dihitung_(r)) return;
    var k = r.Supplier || '(tanpa supplier)';
    if (!perSupplier[k]) perSupplier[k] = { supplier: k, masuk: 0, retur: 0 };
    if (r.Jenis === JENIS_PENERIMAAN.RETUR) perSupplier[k].retur += angka_(r.Qty_Kg);
    else perSupplier[k].masuk += angka_(r.Qty_Kg);
  });

  return {
    hari: hari || 30,
    total: { masuk: bulat_(totMasuk, 2), retur: bulat_(totRetur, 2), bersih: bulat_(totMasuk - totRetur, 2) },
    perSupplier: Object.keys(perSupplier).map(function (k) {
      var s = perSupplier[k];
      s.masuk = bulat_(s.masuk, 2); s.retur = bulat_(s.retur, 2);
      s.bersih = bulat_(s.masuk - s.retur, 2);
      return s;
    }).sort(function (a, b) { return b.bersih - a.bersih; }),
    detail: rows.map(function (r) {
      return { id: r.ID, waktu: jam_(r.Waktu), jenis: r.Jenis, supplier: r.Supplier,
               noSuratJalan: r.No_Surat_Jalan, item: r.Nama_Item, qty: angka_(r.Qty_Kg),
               status: r.Status, pencatat: r.Nama_Pencatat, foto: r.Foto_URL, fotoId: r.Foto_ID };
    }).reverse().slice(0, 150)
  };
}

/** Barang keluar ke customer + retur dari customer. */
function laporanPenjualan(hari, ident) {
  penggunaSaatIni_(ident);
  var batas = new Date();
  batas.setDate(batas.getDate() - (hari || 30));
  var rows = baca_(SHEET.PENGIRIMAN).filter(function (r) { return new Date(r.Waktu) >= batas; });

  var totKeluar = 0, totRetur = 0;
  var perCustomer = {}, perItem = {};

  rows.forEach(function (r) {
    if (!dihitung_(r)) return;
    var q = angka_(r.Qty_Kg);
    var retur = r.Jenis === JENIS_PENGIRIMAN.RETUR_MASUK;
    if (retur) totRetur += q; else totKeluar += q;

    var c = r.Customer || '(tanpa customer)';
    if (!perCustomer[c]) perCustomer[c] = { customer: c, keluar: 0, retur: 0 };
    if (retur) perCustomer[c].retur += q; else perCustomer[c].keluar += q;

    var k = r.Kode_Item;
    if (!perItem[k]) perItem[k] = { kode: k, nama: r.Nama_Item, keluar: 0, retur: 0 };
    if (retur) perItem[k].retur += q; else perItem[k].keluar += q;
  });

  function rapikan(obj) {
    return Object.keys(obj).map(function (k) {
      var x = obj[k];
      x.keluar = bulat_(x.keluar, 2); x.retur = bulat_(x.retur, 2);
      x.bersih = bulat_(x.keluar - x.retur, 2);
      return x;
    }).sort(function (a, b) { return b.bersih - a.bersih; });
  }

  return {
    hari: hari || 30,
    total: { keluar: bulat_(totKeluar, 2), retur: bulat_(totRetur, 2),
             bersih: bulat_(totKeluar - totRetur, 2) },
    perCustomer: rapikan(perCustomer),
    perItem: rapikan(perItem),
    detail: rows.map(function (r) {
      return { id: r.ID, waktu: jam_(r.Waktu), jenis: r.Jenis, customer: r.Customer,
               noSuratJalan: r.No_Surat_Jalan, item: r.Nama_Item, qty: angka_(r.Qty_Kg),
               status: r.Status, pencatat: r.Nama_Pencatat, foto: r.Foto_URL, fotoId: r.Foto_ID };
    }).reverse().slice(0, 150)
  };
}

/* =================================================================
   RIWAYAT INPUT & EDIT
   -----------------------------------------------------------------
   Aturan:
   - Supervisor / Admin : boleh edit entri apa pun, status apa pun.
   - STAF               : hanya entri yang dia catat sendiri dan masih MENUNGGU.
   - Setiap edit dicatat di kolom Log_Edit (siapa, kapan, apa yang berubah)
     dan di Log_Audit. Status tidak berubah karena edit.
   ================================================================= */

var JENIS_RIWAYAT = {
  BELI_MASUK : { sheet: 'PENERIMAAN', filter: function (r) { return r.Jenis === JENIS_PENERIMAAN.MASUK; } },
  BELI_RETUR : { sheet: 'PENERIMAAN', filter: function (r) { return r.Jenis === JENIS_PENERIMAAN.RETUR; } },
  JUAL_KELUAR: { sheet: 'PENGIRIMAN', filter: function (r) { return r.Jenis === JENIS_PENGIRIMAN.KELUAR; } },
  JUAL_RETUR : { sheet: 'PENGIRIMAN', filter: function (r) { return r.Jenis === JENIS_PENGIRIMAN.RETUR_MASUK; } }
};

function penandaPencatat_(u) { return u.email || ('manual:' + u.nama); }

/* Batas edit: entri lebih tua dari MAKS_EDIT_HARI (bawaan 30 hari, dihitung dari tanggal transaksi)
   dikunci untuk SEMUA peran — periode lama dianggap sudah ditutup. */
function maksEditHari_() { var n = parseInt(getSetting_('MAKS_EDIT_HARI'), 10); return isNaN(n) || n <= 0 ? 30 : n; }
function umurHari_(tanggal, waktu) {
  var d = tanggal ? new Date(String(tanggal) + 'T00:00:00') : new Date(waktu);
  if (isNaN(d.getTime())) d = new Date(waktu);
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}
function dalamBatasEdit_(r) { return umurHari_(r.Tanggal, r.Waktu) <= maksEditHari_(); }
/* Aturan v8:
   - STAF: entri sendiri, hanya selama masih MENUNGGU → ubah/batalkan langsung (tanpa usulan). Setelah disetujui: lihat saja.
   - SUPERVISOR/ADMIN: ubah kapan saja (termasuk yang sudah disetujui).
   - Semua: tidak bisa lagi setelah MAKS_EDIT_HARI. */
function alasanKunci_(u, r) {
  if (r.Status === STATUS_TRANSFER.DIBATALKAN) return 'DIBATALKAN';
  if (!dalamBatasEdit_(r)) return 'LEWAT_BATAS';
  if (bolehReview_(u)) return '';
  if (r.Dicatat_Oleh !== penandaPencatat_(u)) return 'BUKAN_MILIK';
  if (r.Status !== STATUS_TRANSFER.MENUNGGU) return 'SUDAH_DITINJAU';
  return '';
}
function bolehEditEntri_(u, r) { return alasanKunci_(u, r) === ''; }

function sheetDariId_(id) {
  var pre = String(id).slice(0, 4);
  if (pre === 'OUT-' || pre === 'RTC-') return SHEET.PENGIRIMAN;
  if (pre === 'DUR-') return SHEET.DAUR;
  if (pre === 'JOB-') return SHEET.PEKERJAAN;
  return SHEET.PENERIMAAN;
}

function ringkasEntri_(r, nama, u, tertunda) {
  var o = {
    id: r.ID, waktu: jam_(r.Waktu), tanggal: r.Tanggal,
    item: r.Nama_Item, kode: r.Kode_Item, qty: angka_(r.Qty_Kg),
    status: r.Status, pencatat: r.Nama_Pencatat, catatan: r.Catatan,
    noSuratJalan: r.No_Surat_Jalan || '',
    foto: r.Foto_URL, fotoId: r.Foto_ID,
    catatanTinjau: r.Catatan_Tinjau || '', logEdit: r.Log_Edit || '',
    idPo: r.ID_PO || '', idAsal: r.ID_Penerimaan_Asal || '', catatanQc: r.Catatan_QC || '', idSo: r.ID_SO || '',
    bolehEdit: bolehEditEntri_(u, r),
    bolehBatal: bolehEditEntri_(u, r) && (bolehReview_(u) ? (r.Status === STATUS_TRANSFER.MENUNGGU || r.Status === STATUS_TRANSFER.DITANDAI) : true),
    kunci: alasanKunci_(u, r),            // '' | SUDAH_DITINJAU | LEWAT_BATAS | BUKAN_MILIK | DIBATALKAN
    perluPersetujuan: false,
    usulan: (tertunda && tertunda[r.ID]) || null,
    ditinjauOleh: r.Ditinjau_Oleh || '', lokasi: r.Lokasi || ''
  };
  if (nama === SHEET.PENERIMAAN) { o.partner = r.Supplier; o.jenis = r.Jenis; }
  if (nama === SHEET.PENGIRIMAN) { o.partner = r.Customer; o.jenis = r.Jenis; }
  return o;
}

/** Riwayat input satu proses, terbaru dulu. */
function riwayatInput(jenis, hari, ident) {
  var u = penggunaSaatIni_(ident);
  var def = JENIS_RIWAYAT[jenis];
  if (!def) throw new Error('Jenis riwayat tidak dikenal: ' + jenis);
  var nama = SHEET[def.sheet];
  var batas = new Date();
  batas.setDate(batas.getDate() - (hari || 14));
  var tertunda = permintaanTertunda_();
  return baca_(nama)
    .filter(function (r) { return def.filter(r) && new Date(r.Waktu) >= batas; })
    .map(function (r) { return ringkasEntri_(r, nama, u, tertunda); })
    .reverse()
    .slice(0, 60);
}

/** Satu entri lengkap untuk form edit. */
function ambilEntri(id, ident) {
  var u = penggunaSaatIni_(ident);
  var nama = sheetDariId_(id);
  if (nama === SHEET.PEKERJAAN) throw new Error('Pakai ambilPekerjaan untuk job.');
  if (nama === SHEET.DAUR) throw new Error('Pakai ambilDaurUlang untuk daur ulang.');
  var rows = baca_(nama);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].ID === id) {
      var o = ringkasEntri_(rows[i], nama, u, permintaanTertunda_());
      o.sheet = nama;
      return o;
    }
  }
  throw new Error('Entri tidak ditemukan: ' + id);
}

/** Susun perubahan untuk satu entri: validasi + kolom yang berubah + log manusiawi. Tidak menulis. */
function susunEdit_(nama, r, perubahan) {
  perubahan = perubahan || {};
  var peta = petaItem_();
  var ubah = {}, log = [];

  if (perubahan.kode !== undefined && perubahan.kode !== r.Kode_Item) {
    var it = peta[perubahan.kode];
    if (!it) throw new Error('Item tidak dikenal: ' + perubahan.kode);
    ubah.Kode_Item = it.kode; ubah.Nama_Item = it.nama;
    log.push('item: ' + r.Nama_Item + ' → ' + it.nama);
  }
  if (perubahan.qty !== undefined) {
    var q = angka_(perubahan.qty);
    if (q <= 0) throw new Error('Qty harus lebih dari 0.');
    if (q !== angka_(r.Qty_Kg)) { ubah.Qty_Kg = q; log.push('qty: ' + angka_(r.Qty_Kg) + ' → ' + q + ' kg'); }
  }
  if (perubahan.tanggal !== undefined) {
    var tg = tglValid_(perubahan.tanggal);
    if (tg !== String(r.Tanggal)) { ubah.Tanggal = tg; log.push('tanggal: ' + r.Tanggal + ' → ' + tg); }
  }
  if (perubahan.partner !== undefined) {
    var kolom = nama === SHEET.PENERIMAAN ? 'Supplier' : nama === SHEET.PENGIRIMAN ? 'Customer' : null;
    if (kolom && String(perubahan.partner) !== String(r[kolom])) {
      if (!String(perubahan.partner).trim()) throw new Error(kolom + ' tidak boleh kosong.');
      ubah[kolom] = perubahan.partner; log.push(kolom.toLowerCase() + ': ' + r[kolom] + ' → ' + perubahan.partner);
    }
  }
  if (perubahan.noSuratJalan !== undefined &&
      String(perubahan.noSuratJalan) !== String(r.No_Surat_Jalan || '')) {
    ubah.No_Surat_Jalan = perubahan.noSuratJalan;
    log.push('surat jalan: ' + (r.No_Surat_Jalan || '—') + ' → ' + (perubahan.noSuratJalan || '—'));
  }
  if (perubahan.catatan !== undefined && String(perubahan.catatan) !== String(r.Catatan || '')) {
    ubah.Catatan = perubahan.catatan; log.push('catatan diubah');
  }
  return { ubah: ubah, log: log };
}

function cariEntri_(nama, id) {
  var rows = baca_(nama);
  for (var i = 0; i < rows.length; i++) if (rows[i].ID === id) return rows[i];
  throw new Error('Entri tidak ditemukan: ' + id);
}

/** Terapkan perubahan ke entri (dipanggil oleh supervisor langsung, atau saat usulan disetujui). */
function terapkanEdit_(nama, id, perubahan, olehNama, awalan) {
  var r = cariEntri_(nama, id);
  var hasil = susunEdit_(nama, r, perubahan);
  if (!hasil.log.length) return { ok: true, berubah: false };
  if (hasil.ubah.Kode_Item && (r.ID_PO || r.ID_Penerimaan_Asal || r.ID_SO)) throw new Error('Item tidak bisa diganti karena entri ini merujuk PO / SO / penerimaan asal. Batalkan lalu buat baru.');
  var stempel = Utilities.formatDate(new Date(), APP.zona, 'dd/MM HH:mm') + ' ' + olehNama + ': ' + (awalan || '') + hasil.log.join('; ');
  hasil.ubah.Log_Edit = [r.Log_Edit, stempel].filter(String).join('\n');
  ubahBaris_(nama, r._baris, hasil.ubah);
  if (nama === SHEET.PENERIMAAN && r.ID_PO && hasil.ubah.Qty_Kg !== undefined) sinkronPo_(r.ID_PO);
  if (nama === SHEET.PENGIRIMAN && r.ID_SO && hasil.ubah.Qty_Kg !== undefined) sinkronSo_(r.ID_SO);
  catatLog_('EDIT', id, hasil.log.join('; '));
  return { ok: true, berubah: true, log: hasil.log };
}

/**
 * perubahan = { kode, qty, tanggal, partner, noSuratJalan, catatan }  (yang tidak dikirim = tidak diubah)
 * v8: STAF mengubah langsung entri sendiri yang masih MENUNGGU; setelah ditinjau hanya SUPERVISOR/ADMIN.
 * Semua peran terkunci setelah MAKS_EDIT_HARI. (Mekanisme usulan Permintaan_Ubah tetap ada untuk data lama.)
 */
function simpanEditEntri(id, perubahan, ident, alasan) {
  var u = penggunaSaatIni_(ident);
  var nama = sheetDariId_(id);
  if (nama === SHEET.PEKERJAAN) throw new Error('Pakai simpanEditPekerjaan untuk job.');
  if (nama === SHEET.DAUR) throw new Error('Pakai ubahDaurUlang untuk daur ulang.');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();   // di dalam lock: baca ulang dari sheet, jangan pakai memo sebelum lock
  try {
    var r = cariEntri_(nama, id);
    var kunci = alasanKunci_(u, r);
    if (kunci) throw new Error(pesanKunci_(kunci));
    return terapkanEdit_(nama, id, perubahan, u.nama, bolehReview_(u) ? '' : 'staf');
  } finally {
    lock.releaseLock();
  }
}

function pesanKunci_(kunci) {
  return kunci === 'SUDAH_DITINJAU' ? 'Entri sudah ditinjau supervisor — hanya supervisor/manager yang bisa mengubahnya.'
       : kunci === 'LEWAT_BATAS' ? 'Entri lebih tua dari ' + maksEditHari_() + ' hari — periode sudah ditutup, tidak bisa diubah.'
       : kunci === 'BUKAN_MILIK' ? 'Hanya entri yang kamu catat sendiri yang bisa diubah.'
       : kunci === 'DIBATALKAN' ? 'Entri sudah dibatalkan.' : 'Entri terkunci.';
}
/** Batal: supervisor lewat tinjauTransfer; staf → entri sendiri yang masih MENUNGGU langsung dibatalkan. */
function batalkanEntriSendiri(id, alasan, ident) {
  var u = penggunaSaatIni_(ident);
  var nama = sheetDariId_(id);
  if (nama === SHEET.DAUR) return batalkanDaurUlang(id, alasan, ident);
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();   // di dalam lock: baca ulang dari sheet, jangan pakai memo sebelum lock
  try {
    var r = cariEntri_(nama, id);
    var kunci = alasanKunci_(u, r);
    if (kunci) throw new Error(pesanKunci_(kunci));
    if (bolehReview_(u)) { lock.releaseLock(); lock = null; return tinjauTransfer(id, 'batal', alasan, ident); }
    ubahBaris_(nama, r._baris, {
      Status: STATUS_TRANSFER.DIBATALKAN, Ditinjau_Oleh: u.nama + ' (sendiri)', Waktu_Tinjau: new Date(),
      Catatan_Tinjau: [r.Catatan_Tinjau, 'dibatalkan sendiri' + (alasan ? ': ' + alasan : '')].filter(String).join(' | ')
    });
    if (nama === SHEET.PENERIMAAN && r.ID_PO) sinkronPo_(r.ID_PO);
    if (nama === SHEET.PENGIRIMAN && r.ID_SO) sinkronSo_(r.ID_SO);
    catatLog_('BATAL_SENDIRI', id, r.Nama_Item + ' ' + angka_(r.Qty_Kg) + ' kg' + (alasan ? ' | ' + alasan : ''));
    return { ok: true, status: STATUS_TRANSFER.DIBATALKAN };
  } finally {
    if (lock) lock.releaseLock();
  }
}

/* ---------- permintaan perubahan (usulan staf → persetujuan supervisor) ---------- */

function ajukanPermintaan_(u, jenis, nama, r, usulan, alasan, ringkasan) {
  var tertunda = baca_(SHEET.PERMINTAAN).filter(function (p) {
    return p.ID_Entri === r.ID && p.Status === STATUS_PERMINTAAN.MENUNGGU;
  });
  if (tertunda.length) throw new Error('Sudah ada usulan yang menunggu untuk entri ini (' + tertunda[0].ID + '). Tunggu supervisor meninjau.');
  var id = buatId_('REQ');
  tambah_(SHEET.PERMINTAAN, {
    ID: id, Waktu: new Date(), Jenis: jenis, ID_Entri: r.ID, Sheet_Entri: nama,
    Ringkasan: ringkasan || '', Usulan: JSON.stringify(usulan || {}), Alasan: alasan || '',
    Diajukan_Oleh: penandaPencatat_(u), Nama_Pengaju: u.nama,
    Status: STATUS_PERMINTAAN.MENUNGGU, Ditinjau_Oleh: '', Waktu_Tinjau: '', Catatan_Tinjau: ''
  });
  catatLog_('AJUKAN_' + jenis, r.ID, (ringkasan || '') + (alasan ? ' | ' + alasan : ''));
  return { ok: true, berubah: false, diajukan: true, idPermintaan: id, jenis: jenis };
}

/** Peta ID_Entri → usulan yang masih menunggu (untuk tanda di riwayat). */
function permintaanTertunda_() {
  var peta = {};
  baca_(SHEET.PERMINTAAN).forEach(function (p) {
    if (p.Status === STATUS_PERMINTAAN.MENUNGGU) peta[p.ID_Entri] = { id: p.ID, jenis: p.Jenis, ringkasan: p.Ringkasan, pengaju: p.Nama_Pengaju };
  });
  return peta;
}

/** Antrian usulan untuk supervisor. status: MENUNGGU (default) | DISETUJUI | DITOLAK */
function daftarPermintaan(ident, status) {
  var u = penggunaSaatIni_(ident);
  if (!bolehReview_(u)) throw new Error('Hanya Supervisor / Admin yang bisa melihat usulan perubahan.');
  status = status || STATUS_PERMINTAAN.MENUNGGU;
  var cache = {};
  function entri(nama, id) {
    if (!cache[nama]) cache[nama] = baca_(nama);
    for (var i = 0; i < cache[nama].length; i++) if (cache[nama][i].ID === id) return cache[nama][i];
    return null;
  }
  return baca_(SHEET.PERMINTAAN).filter(function (p) { return p.Status === status; }).map(function (p) {
    var r = entri(p.Sheet_Entri, p.ID_Entri);
    var usulan = {}; try { usulan = JSON.parse(p.Usulan || '{}'); } catch (e) {}
    var o = { id: p.ID, waktu: jam_(p.Waktu), jenis: p.Jenis, idEntri: p.ID_Entri, sheet: p.Sheet_Entri,
              ringkasan: p.Ringkasan, alasan: p.Alasan, pengaju: p.Nama_Pengaju, status: p.Status,
              ditinjau: p.Ditinjau_Oleh, catatanTinjau: p.Catatan_Tinjau, usulan: usulan, entri: null };
    if (r && p.Sheet_Entri === SHEET.PEKERJAAN) {
      o.entri = { produk: r.Nama_Produk, masuk: angka_(r.Total_Bahan_Baku_Kg), jadi: angka_(r.Total_Barang_Jadi_Kg),
                  scrap: angka_(r.Total_Scrap_Kg), status: r.Status, tanggal: r.Tanggal, operator: r.Nama_Operator };
    } else if (r) {
      o.entri = { item: r.Nama_Item, kode: r.Kode_Item, qty: angka_(r.Qty_Kg), tanggal: r.Tanggal, status: r.Status,
                  partner: r.Supplier || r.Customer || '', noSuratJalan: r.No_Surat_Jalan || '', catatan: r.Catatan || '',
                  jenis: r.Jenis || r.Arah, foto: r.Foto_URL, fotoId: r.Foto_ID, pencatat: r.Nama_Pencatat };
      if (usulan.kode && usulan.kode !== r.Kode_Item) { var it = petaItem_()[usulan.kode]; o.usulanNamaItem = it ? it.nama : usulan.kode; }
    }
    return o;
  }).reverse().slice(0, 80);
}

/** Supervisor: setuju (terapkan) / tolak usulan. */
function tinjauPermintaan(id, aksi, catatan, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehReview_(u)) throw new Error('Hanya Supervisor / Admin yang bisa meninjau usulan.');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();   // di dalam lock: baca ulang dari sheet, jangan pakai memo sebelum lock
  try {
    var p = cariEntri_(SHEET.PERMINTAAN, id);
    if (p.Status !== STATUS_PERMINTAAN.MENUNGGU) throw new Error('Usulan sudah ditinjau (' + p.Status + ').');
    var usulan = {}; try { usulan = JSON.parse(p.Usulan || '{}'); } catch (e) {}
    var hasil = null;
    if (aksi === 'setuju') {
      var awalan = 'disetujui dari usulan ' + p.Nama_Pengaju + ' (' + p.ID + '): ';
      if (p.Jenis === JENIS_PERMINTAAN.EDIT) {
        hasil = terapkanEdit_(p.Sheet_Entri, p.ID_Entri, usulan, u.nama, awalan);
      } else if (p.Jenis === JENIS_PERMINTAAN.BATAL) {
        hasil = tinjauTransfer(p.ID_Entri, 'batal', [p.Alasan, catatan].filter(String).join(' | '), ident);
      } else if (p.Jenis === JENIS_PERMINTAAN.EDIT_JOB) {
        hasil = simpanEditPekerjaan(p.ID_Entri, usulan, ident, awalan);
      } else throw new Error('Jenis usulan tidak dikenal: ' + p.Jenis);
    } else if (aksi !== 'tolak') throw new Error('Aksi tidak dikenal: ' + aksi);

    ubahBaris_(SHEET.PERMINTAAN, p._baris, {
      Status: aksi === 'setuju' ? STATUS_PERMINTAAN.DISETUJUI : STATUS_PERMINTAAN.DITOLAK,
      Ditinjau_Oleh: u.nama, Waktu_Tinjau: new Date(), Catatan_Tinjau: catatan || ''
    });
    catatLog_(aksi === 'setuju' ? 'SETUJU_USULAN' : 'TOLAK_USULAN', p.ID_Entri, p.ID + ' ' + p.Jenis + (catatan ? ' | ' + catatan : ''));
    return { ok: true, status: aksi === 'setuju' ? STATUS_PERMINTAAN.DISETUJUI : STATUS_PERMINTAAN.DITOLAK, hasil: hasil };
  } finally {
    lock.releaseLock();
  }
}

/* ---------- pekerjaan: riwayat & edit ---------- */

function alasanKunciJob_(u, r) {
  var tglRef = r.Waktu_Selesai ? tglStr_(new Date(r.Waktu_Selesai)) : r.Tanggal;
  if (umurHari_(tglRef, r.Waktu_Selesai || r.Waktu_Mulai) > maksEditHari_()) return 'LEWAT_BATAS';
  if (bolehReview_(u)) return '';
  if (r.Operator !== penandaPencatat_(u)) return 'BUKAN_MILIK';
  /* staf: pekerjaan sendiri, hanya dalam 24 jam setelah dimulai/ditutup */
  var acuan = new Date(r.Waktu_Selesai || r.Waktu_Mulai).getTime();
  if (Date.now() - acuan > 24 * 3600000) return 'SUDAH_DITINJAU';
  return '';
}
function bolehEditJob_(u, r) { return alasanKunciJob_(u, r) === ''; }

function daftarPekerjaanSelesai(hari, ident) {
  var u = penggunaSaatIni_(ident);
  var lihatHpp = bolehLihatHpp_(u);
  var batas = new Date();
  batas.setDate(batas.getDate() - (hari || 14));
  var tertunda = permintaanTertunda_();
  return baca_(SHEET.PEKERJAAN)
    .filter(function (r) { return r.Status === STATUS_PEKERJAAN.SELESAI && new Date(r.Waktu_Selesai) >= batas; })
    .map(function (r) {
      var o = { usulan: tertunda[r.ID] || null, perluPersetujuan: false, kunci: alasanKunciJob_(u, r),
        id: r.ID, produk: r.Nama_Produk, kodeProduk: r.Kode_Produk,
        selesai: jam_(r.Waktu_Selesai), masuk: angka_(r.Total_Bahan_Baku_Kg),
        jadi: angka_(r.Total_Barang_Jadi_Kg), scrap: angka_(r.Total_Scrap_Kg),
        susut: angka_(r.Susut_Kg), persen: angka_(r.Susut_Persen), status: r.Status_Susut,
        operator: r.Nama_Operator, logEdit: r.Log_Edit || '', bolehEdit: bolehEditJob_(u, r)
      };
      if (lihatHpp) o.hpp = { total: angka_(r.HPP_Total), perKg: angka_(r.HPP_Per_Kg) };
      return o;
    })
    .reverse().slice(0, 60);
}

function ambilPekerjaan(id, ident) {
  var u = penggunaSaatIni_(ident);
  var rows = baca_(SHEET.PEKERJAAN), r = null;
  for (var i = 0; i < rows.length; i++) if (rows[i].ID === id) r = rows[i];
  if (!r) throw new Error('Pekerjaan tidak ditemukan.');
  var det = baca_(SHEET.DETAIL).filter(function (d) { return d.ID_Pekerjaan === id; });
  function ambil(jenis) {
    return det.filter(function (d) { return d.Jenis === jenis; })
              .map(function (d) { return { kode: d.Kode_Item, nama: d.Nama_Item, qty: angka_(d.Qty_Kg) }; });
  }
  return {
    id: r.ID, produk: r.Nama_Produk, kodeProduk: r.Kode_Produk, status: r.Status,
    catatan: r.Catatan || '', logEdit: r.Log_Edit || '',
    bahanBaku: ambil(JENIS_DETAIL.BAHAN_BAKU), barangJadi: ambil(JENIS_DETAIL.BARANG_JADI),
    scrap: ambil(JENIS_DETAIL.SCRAP),
    scrapKg: ambil(JENIS_DETAIL.SCRAP).reduce(function (a, b) { return a + b.qty; }, 0),
    bolehEdit: bolehEditJob_(u, r), kunci: alasanKunciJob_(u, r), perluPersetujuan: false, tanggal: r.Tanggal,
    usulan: permintaanTertunda_()[r.ID] || null
  };
}

/**
 * p = { kodeProduk, bahanBaku:[{kode,qty}], barangJadi:[...], scrap:[...], catatan }
 * Baris detail lama diganti; susut & HPP dihitung ulang. Harga bahan memakai harga SAAT INI.
 */
function simpanEditPekerjaan(id, p, ident, awalanLog) {
  var u = penggunaSaatIni_(ident);
  p = p || {};
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();   // di dalam lock: baca ulang dari sheet, jangan pakai memo sebelum lock
  try {
    var rows = baca_(SHEET.PEKERJAAN), r = null;
    for (var i = 0; i < rows.length; i++) if (rows[i].ID === id) r = rows[i];
    if (!r) throw new Error('Pekerjaan tidak ditemukan.');
    var kunciJob = alasanKunciJob_(u, r);
    if (kunciJob) throw new Error(kunciJob === 'SUDAH_DITINJAU' ? 'Pekerjaan hanya bisa diubah operatornya dalam 24 jam — setelah itu minta supervisor.' : pesanKunci_(kunciJob));
    if (!p.bahanBaku || !p.bahanBaku.length) throw new Error('Bahan baku tidak boleh kosong.');
    var selesai = r.Status === STATUS_PEKERJAAN.SELESAI;
    if (selesai && (!p.barangJadi || !p.barangJadi.length)) throw new Error('Barang jadi tidak boleh kosong.');

    var peta = petaItem_();
    var produk = peta[p.kodeProduk || r.Kode_Produk];
    if (!produk) throw new Error('Produk tidak dikenal.');

    /* hapus detail lama — dari bawah ke atas supaya nomor baris tidak bergeser */
    var sh = sheet_(SHEET.DETAIL);
    baca_(SHEET.DETAIL).filter(function (d) { return d.ID_Pekerjaan === id; })
      .map(function (d) { return d._baris; })
      .sort(function (a, b) { return b - a; })
      .forEach(function (baris) { sh.deleteRow(baris); });
    lupakanMemo_(SHEET.DETAIL);

    var now = new Date();
    var total = 0, hppBahan = 0, totalJadi = 0, totalScrap = 0;
    var fifoEd = metodeHpp_() === 'FIFO' ? hitungFifo_() : null;
    function tulis(list, jenis, hitung) {
      (list || []).forEach(function (b) {
        var it = peta[b.kode]; if (!it) throw new Error('Item tidak dikenal: ' + b.kode);
        var q = angka_(b.qty); if (q <= 0) return;
        var hargaB = jenis === JENIS_DETAIL.BAHAN_BAKU ? (fifoEd ? hargaDariFifo_(fifoEd, it.kode, q, peta) : it.harga) : '';
        var nilai = jenis === JENIS_DETAIL.BAHAN_BAKU ? q * hargaB : '';
        hitung(q, nilai);
        tambah_(SHEET.DETAIL, { ID: buatId_('DTL'), ID_Pekerjaan: id, Jenis: jenis,
          Kode_Item: it.kode, Nama_Item: it.nama, Qty_Kg: q,
          Harga_Per_Kg: jenis === JENIS_DETAIL.BAHAN_BAKU ? bulat_(hargaB, 2) : '',
          Nilai: nilai === '' ? '' : bulat_(nilai, 0), Waktu: now });
      });
    }
    tulis(p.bahanBaku,  JENIS_DETAIL.BAHAN_BAKU,  function (q, n) { total += q; hppBahan += n; });
    tulis(p.barangJadi, JENIS_DETAIL.BARANG_JADI, function (q) { totalJadi += q; });
    var scrapKgEd = angka_(p.scrapKg);
    (p.scrap || []).forEach(function (b) { scrapKgEd += angka_(b.qty); });
    if (scrapKgEd > 0) {
      var scrEd = skuScrapUntuk_(produk);
      totalScrap = scrapKgEd;
      tambah_(SHEET.DETAIL, { ID: buatId_('DTL'), ID_Pekerjaan: id, Jenis: JENIS_DETAIL.SCRAP,
        Kode_Item: scrEd.kode, Nama_Item: scrEd.nama, Qty_Kg: scrapKgEd, Harga_Per_Kg: '', Nilai: '', Waktu: now });
    }
    if (total <= 0) throw new Error('Total bahan baku harus > 0.');

    var hppProses = total * biayaProsesPerKg_();
    var hppTotal = hppBahan + hppProses;
    var ubah = {
      Kode_Produk: produk.kode, Nama_Produk: produk.nama,
      Total_Bahan_Baku_Kg: bulat_(total, 3),
      HPP_Bahan: bulat_(hppBahan, 0), HPP_Proses: bulat_(hppProses, 0), HPP_Total: bulat_(hppTotal, 0)
    };
    var log = ['bahan ' + angka_(r.Total_Bahan_Baku_Kg) + ' → ' + bulat_(total, 2) + ' kg'];
    if (p.catatan !== undefined) ubah.Catatan = p.catatan;

    if (selesai) {
      var h = hitungSusut_(total, totalJadi, totalScrap, produk.kode);
      var hargaRata = total > 0 ? hppBahan / total : 0;
      ubah.Total_Barang_Jadi_Kg = bulat_(totalJadi, 3);
      ubah.Total_Scrap_Kg = bulat_(totalScrap, 3);
      ubah.Susut_Kg = h.susut; ubah.Susut_Persen = h.persen; ubah.Status_Susut = h.status;
      ubah.HPP_Per_Kg = bulat_(totalJadi > 0 ? hppTotal / totalJadi : 0, 0);
      ubah.Nilai_Susut = bulat_(Math.max(0, h.susut) * hargaRata, 0);
      log.push('jadi ' + angka_(r.Total_Barang_Jadi_Kg) + ' → ' + bulat_(totalJadi, 2) + ' kg');
      log.push('susut ' + angka_(r.Susut_Persen) + '% → ' + h.persen + '%');
    }
    if (produk.kode !== r.Kode_Produk) log.push('produk: ' + r.Nama_Produk + ' → ' + produk.nama);

    var stempel = Utilities.formatDate(now, APP.zona, 'dd/MM HH:mm') + ' ' + u.nama + ': ' + (awalanLog || '') + log.join('; ');
    ubah.Log_Edit = [r.Log_Edit, stempel].filter(String).join('\n');
    ubahBaris_(SHEET.PEKERJAAN, r._baris, ubah);
    catatLog_('EDIT_PEKERJAAN', id, log.join('; '));

    var out = { ok: true, log: log, masuk: bulat_(total, 2) };
    if (selesai) { out.susut = ubah.Susut_Kg; out.persen = ubah.Susut_Persen; out.status = ubah.Status_Susut; }
    if (bolehLihatHpp_(u)) out.hpp = { total: ubah.HPP_Total, perKg: ubah.HPP_Per_Kg || 0 };
    return out;
  } finally {
    lock.releaseLock();
  }
}

/* =================================================================
   ADMINISTRASI
   ================================================================= */

/* ---------- pengguna (ADMIN) ---------- */

function daftarPengguna(ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehAdmin_(u)) throw new Error('Hanya Admin yang bisa mengelola pengguna.');
  return baca_(SHEET.PENGGUNA).map(function (r) {
    return { baris: r._baris, email: r.Email || '', nama: r.Nama, peran: r.Peran || PERAN.STAF,
             lokasi: r.Lokasi || '', punyaPin: !!String(r.PIN || '').trim(),
             aktif: String(r.Aktif).toUpperCase() !== 'TIDAK' };
  });
}

/**
 * p = { baris (kosong = tambah baru), nama, email, peran, lokasi, pin (kosong = tidak diubah;
 *       'HAPUS' = kosongkan), aktif }
 */
function simpanPengguna(p, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehAdmin_(u)) throw new Error('Hanya Admin yang bisa mengelola pengguna.');
  p = p || {};
  var nama = String(p.nama || '').trim();
  if (!nama) throw new Error('Nama wajib diisi.');
  var peran = [PERAN.STAF, PERAN.SUPERVISOR, PERAN.ADMIN].indexOf(p.peran) >= 0 ? p.peran : PERAN.STAF;
  var pin = p.pin === undefined || p.pin === null ? undefined : String(p.pin).trim();
  if (pin !== undefined && pin !== '' && pin !== 'HAPUS' && !/^\d{4,8}$/.test(pin)) {
    throw new Error('PIN harus 4–8 angka.');
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();   // di dalam lock: baca ulang dari sheet, jangan pakai memo sebelum lock
  try {
    var rows = baca_(SHEET.PENGGUNA);
    // nama harus unik
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].Nama).toLowerCase() === nama.toLowerCase() && rows[i]._baris !== p.baris) {
        throw new Error('Nama "' + nama + '" sudah dipakai.');
      }
    }
    // jangan sampai admin terakhir dinonaktifkan / diturunkan
    var adminAktif = rows.filter(function (r) {
      return r.Peran === PERAN.ADMIN && String(r.Aktif).toUpperCase() !== 'TIDAK';
    });
    var target = null;
    for (var k = 0; k < rows.length; k++) if (rows[k]._baris === p.baris) target = rows[k];
    if (target && target.Peran === PERAN.ADMIN && adminAktif.length <= 1 &&
        (peran !== PERAN.ADMIN || p.aktif === false)) {
      throw new Error('Tidak bisa — ini admin terakhir yang aktif.');
    }

    var log;
    if (target) {
      var ubah = { Nama: nama, Email: p.email || '', Peran: peran, Lokasi: p.lokasi || '',
                   Aktif: p.aktif === false ? 'TIDAK' : 'YA' };
      if (pin === 'HAPUS') ubah.PIN = '';
      else if (pin) ubah.PIN = pin;
      ubahBaris_(SHEET.PENGGUNA, target._baris, ubah);
      log = 'ubah ' + nama + ' → ' + peran + (ubah.Aktif === 'TIDAK' ? ' (nonaktif)' : '') + (pin ? ' (PIN diubah)' : '');
    } else {
      tambah_(SHEET.PENGGUNA, { Email: p.email || '', Nama: nama, Peran: peran, Lokasi: p.lokasi || '',
                                PIN: (pin && pin !== 'HAPUS') ? pin : '', Aktif: p.aktif === false ? 'TIDAK' : 'YA' });
      log = 'tambah ' + nama + ' (' + peran + ')';
    }
    catatLog_('ADMIN_PENGGUNA', nama, log);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

/** Aktivitas satu pengguna (atau semua kalau nama kosong) dalam N hari. */
function aktivitasStaf(nama, hari, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehReview_(u)) throw new Error('Hanya Supervisor / Admin.');
  hari = hari || 30;
  var batas = new Date(); batas.setDate(batas.getDate() - hari);
  var target = String(nama || '').trim().toLowerCase();
  function cocok(n) { return !target || String(n || '').toLowerCase() === target; }

  var per = {};
  function tambah(n, jenis, kg, waktu, label) {
    if (!cocok(n)) return;
    var k = n || '(tanpa nama)';
    if (!per[k]) per[k] = { nama: k, total: 0, kg: 0, jenis: {}, terakhir: 0, kejadian: [] };
    var x = per[k];
    x.total++; x.kg += kg;
    x.jenis[jenis] = (x.jenis[jenis] || 0) + 1;
    var t = new Date(waktu).getTime();
    if (t > x.terakhir) x.terakhir = t;
    x.kejadian.push({ t: t, waktu: jam_(waktu), jenis: jenis, label: label, kg: kg });
  }

  baca_(SHEET.PENERIMAAN).forEach(function (r) {
    if (new Date(r.Waktu) < batas) return;
    tambah(r.Nama_Pencatat, r.Jenis === JENIS_PENERIMAAN.RETUR ? 'RETUR_SUPPLIER' : 'MASUK', angka_(r.Qty_Kg), r.Waktu, r.Nama_Item + ' · ' + r.Supplier);
  });
  baca_(SHEET.PENGIRIMAN).forEach(function (r) {
    if (new Date(r.Waktu) < batas) return;
    tambah(r.Nama_Pencatat, r.Jenis === JENIS_PENGIRIMAN.RETUR_MASUK ? 'RETUR_CUSTOMER' : 'KELUAR', angka_(r.Qty_Kg), r.Waktu, r.Nama_Item + ' · ' + r.Customer);
  });
  baca_(SHEET.DAUR).forEach(function (r) {
    if (r.Status === STATUS_DAUR.DIBATALKAN) return;
    if (new Date(r.Waktu_Kirim) >= batas) tambah(r.Nama_Pencatat, 'DAUR_KIRIM', angka_(r.Total_Scrap_Kg), r.Waktu_Kirim, r.Vendor);
    if (r.Status === STATUS_DAUR.SELESAI && r.Waktu_Terima && new Date(r.Waktu_Terima) >= batas) tambah(r.Nama_Penerima, 'DAUR_TERIMA', angka_(r.Total_Hasil_Kg), r.Waktu_Terima, r.Vendor);
  });
  baca_(SHEET.PEKERJAAN).forEach(function (r) {
    if (new Date(r.Waktu_Mulai) < batas) return;
    tambah(r.Nama_Operator, 'JOB', angka_(r.Total_Bahan_Baku_Kg), r.Waktu_Mulai, r.Nama_Produk);
  });
  baca_(SHEET.OPNAME).forEach(function (r) {
    if (new Date(r.Waktu) < batas) return;
    tambah(r.Nama_Pencatat, 'OPNAME', Math.abs(angka_(r.Selisih)), r.Waktu, r.Nama_Item + ' · ' + r.Lokasi);
  });
  // review & edit dari log audit
  baca_(SHEET.LOG).forEach(function (r) {
    if (new Date(r.Waktu) < batas) return;
    if (r.Aksi !== 'REVIEW' && r.Aksi !== 'EDIT' && r.Aksi !== 'EDIT_PEKERJAAN' && r.Aksi !== 'BATAL_SENDIRI') return;
    // nama pelaku ada di detail? Log_Audit menyimpan email; untuk manual-ident pakai Ditinjau_Oleh — cukup hitung per aksi
  });

  var daftar = Object.keys(per).map(function (k) {
    var x = per[k];
    x.kg = bulat_(x.kg, 1);
    x.terakhirTxt = x.terakhir ? jam_(new Date(x.terakhir)) : '';
    x.kejadian.sort(function (a, b) { return b.t - a.t; });
    x.kejadian = x.kejadian.slice(0, 80);
    return x;
  }).sort(function (a, b) { return b.total - a.total; });

  return { hari: hari, daftar: daftar };
}

/* ---------- SKU (SUPERVISOR / ADMIN) ---------- */

function daftarSku(ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehReview_(u)) throw new Error('Hanya Supervisor / Admin.');
  var dipakai = skuDipakai_();
  var lihatHpp = bolehLihatHpp_(u);
  return baca_(SHEET.ITEM).map(function (r) {
    var o = { baris: r._baris, kode: r.Kode_Item, nama: r.Nama_Item, kategori: r.Kategori,
              awal: angka_(r.Stok_Awal),
              aktif: String(r.Aktif).toUpperCase() !== 'TIDAK', dipakai: !!dipakai[r.Kode_Item] };
    if (lihatHpp) o.harga = angka_(r.Harga_Per_Kg);
    return o;
  });
}

function skuDipakai_() {
  var d = {};
  [SHEET.PENERIMAAN, SHEET.PENGIRIMAN, SHEET.DETAIL, SHEET.OPNAME, SHEET.DAUR_DETAIL].forEach(function (nama) {
    baca_(nama).forEach(function (r) { if (r.Kode_Item) d[r.Kode_Item] = true; });
  });
  baca_(SHEET.PEKERJAAN).forEach(function (r) { if (r.Kode_Produk) d[r.Kode_Produk] = true; });
  return d;
}

/** p = { baris (kosong = baru), kode, nama, kategori, harga, awal, aktif } */
function simpanSku(p, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehReview_(u)) throw new Error('Hanya Supervisor / Admin.');
  p = p || {};
  var kode = String(p.kode || '').trim().toUpperCase().replace(/\s+/g, '-');
  var nama = String(p.nama || '').trim();
  if (!kode || !nama) throw new Error('Kode dan nama wajib diisi.');
  if (!/^[A-Z0-9][A-Z0-9\-_.]{1,30}$/.test(kode)) throw new Error('Kode: huruf/angka/strip saja, 2–31 karakter.');
  var kat = [KATEGORI_ITEM.BAHAN_BAKU, KATEGORI_ITEM.BARANG_JADI, KATEGORI_ITEM.KEDUANYA].indexOf(p.kategori) >= 0
            ? p.kategori : KATEGORI_ITEM.BAHAN_BAKU;

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();   // di dalam lock: baca ulang dari sheet, jangan pakai memo sebelum lock
  try {
    var rows = baca_(SHEET.ITEM), target = null;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i]._baris === p.baris) target = rows[i];
      else if (String(rows[i].Kode_Item).toUpperCase() === kode) throw new Error('Kode "' + kode + '" sudah ada.');
    }
    var ubah = { Kode_Item: kode, Nama_Item: nama, Kategori: kat,
                 Stok_Awal: angka_(p.awal !== undefined ? p.awal : p.awalGBJ),
                 Aktif: p.aktif === false ? 'TIDAK' : 'YA' };
    if (p.harga !== undefined && p.harga !== null && String(p.harga) !== '') ubah.Harga_Per_Kg = angka_(p.harga);
    if (target) {
      if (target.Kode_Item !== kode && skuDipakai_()[target.Kode_Item]) {
        throw new Error('Kode tidak bisa diganti — SKU ini sudah dipakai di transaksi. Nonaktifkan lalu buat yang baru.');
      }
      ubahBaris_(SHEET.ITEM, target._baris, ubah);
      catatLog_('ADMIN_SKU', kode, 'ubah ' + nama);
    } else {
      if (ubah.Harga_Per_Kg === undefined) ubah.Harga_Per_Kg = '';
      tambah_(SHEET.ITEM, ubah);
      catatLog_('ADMIN_SKU', kode, 'tambah ' + nama);
    }
    return { ok: true, kode: kode };
  } finally {
    lock.releaseLock();
  }
}

/** Hapus beneran kalau belum pernah dipakai; kalau sudah, nonaktifkan. */
function hapusSku(kode, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehReview_(u)) throw new Error('Hanya Supervisor / Admin.');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();   // di dalam lock: baca ulang dari sheet, jangan pakai memo sebelum lock
  try {
    var rows = baca_(SHEET.ITEM), target = null;
    for (var i = 0; i < rows.length; i++) if (rows[i].Kode_Item === kode) target = rows[i];
    if (!target) throw new Error('SKU tidak ditemukan: ' + kode);
    if (skuDipakai_()[kode]) {
      ubahBaris_(SHEET.ITEM, target._baris, { Aktif: 'TIDAK' });
      catatLog_('ADMIN_SKU', kode, 'nonaktif (sudah dipakai)');
      return { ok: true, dihapus: false, dinonaktifkan: true };
    }
    sheet_(SHEET.ITEM).deleteRow(target._baris);
    lupakanMemo_(SHEET.ITEM);
    catatLog_('ADMIN_SKU', kode, 'hapus');
    return { ok: true, dihapus: true, dinonaktifkan: false };
  } finally {
    lock.releaseLock();
  }
}

/* ---------- STOCK OPNAME (SUPERVISOR / ADMIN) ---------- */

/**
 * Daftar item + stok sistem, siap diisi stok fisik. v9: satu lokasi (GBJ).
 */
function siapkanOpname(ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehReview_(u)) throw new Error('Hanya Supervisor / Admin yang bisa stock opname.');
  var lokasi = LOKASI.GBJ;
  var stok = {};
  laporanStok(ident).daftar.forEach(function (s) { stok[s.kode] = s; });
  var items = baca_(SHEET.ITEM).filter(function (r) {
    return r.Kode_Item && String(r.Aktif).toUpperCase() !== 'TIDAK';
  }).map(function (r) {
    var s = stok[r.Kode_Item];
    return { kode: r.Kode_Item, nama: r.Nama_Item, kategori: r.Kategori, sistem: s ? s.gbj : 0 };
  });
  return { lokasi: lokasi, waktu: jam_(new Date()), items: items };
}

/**
 * p = { baris:[{kode, fisik}], catatan }
 * Baris yang fisik-nya kosong dilewati. Selisih 0 tetap dicatat (bukti sudah dihitung).
 */
function simpanOpname(p, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehReview_(u)) throw new Error('Hanya Supervisor / Admin yang bisa stock opname.');
  if (!p || !p.baris || !p.baris.length) throw new Error('Belum ada item yang dihitung.');
  var lokasi = LOKASI.GBJ;

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();   // di dalam lock: baca ulang dari sheet, jangan pakai memo sebelum lock
  try {
    var peta = petaItem_();
    var stok = {};
    laporanStok(ident).daftar.forEach(function (s) { stok[s.kode] = s; });
    var now = new Date();
    var idSesi = buatId_('OPN');
    var n = 0, totalSelisih = 0, plus = 0, minus = 0;

    p.baris.forEach(function (b) {
      if (b.fisik === '' || b.fisik === null || b.fisik === undefined) return;
      var it = peta[b.kode]; if (!it) throw new Error('Item tidak dikenal: ' + b.kode);
      var fisik = angka_(b.fisik);
      if (fisik < 0) throw new Error('Stok fisik tidak boleh negatif (' + it.nama + ').');
      var s = stok[b.kode];
      var sistem = s ? s.gbj : 0;
      var selisih = bulat_(fisik - sistem, 3);
      n++; totalSelisih += selisih;
      if (selisih > 0) plus += selisih; else minus += -selisih;
      tambah_(SHEET.OPNAME, {
        ID: buatId_('OPI'), ID_Sesi: idSesi, Waktu: now, Tanggal: tglStr_(now), Lokasi: lokasi,
        Kode_Item: it.kode, Nama_Item: it.nama,
        Stok_Sistem: bulat_(sistem, 3), Stok_Fisik: fisik, Selisih: selisih,
        Catatan: b.catatan || p.catatan || '',
        Dicatat_Oleh: penandaPencatat_(u), Nama_Pencatat: u.nama
      });
    });
    if (!n) throw new Error('Belum ada item yang diisi stok fisiknya.');

    catatLog_('OPNAME', idSesi, lokasi + ' • ' + n + ' item • selisih ' + bulat_(totalSelisih, 2) + ' kg');
    return { ok: true, idSesi: idSesi, lokasi: lokasi, jumlahItem: n,
             selisih: bulat_(totalSelisih, 2), lebih: bulat_(plus, 2), kurang: bulat_(minus, 2) };
  } finally {
    lock.releaseLock();
  }
}

function riwayatOpname(hari, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehReview_(u)) throw new Error('Hanya Supervisor / Admin.');
  var batas = new Date(); batas.setDate(batas.getDate() - (hari || 90));
  var sesi = {};
  baca_(SHEET.OPNAME).forEach(function (r) {
    if (new Date(r.Waktu) < batas) return;
    var k = r.ID_Sesi;
    if (!sesi[k]) sesi[k] = { idSesi: k, waktuRaw: new Date(r.Waktu).getTime(), waktu: jam_(r.Waktu),
                              lokasi: r.Lokasi, oleh: r.Nama_Pencatat, jumlahItem: 0,
                              lebih: 0, kurang: 0, item: [] };
    var x = sesi[k], d = angka_(r.Selisih);
    x.jumlahItem++;
    if (d > 0) x.lebih += d; else x.kurang += -d;
    x.item.push({ nama: r.Nama_Item, kode: r.Kode_Item, sistem: angka_(r.Stok_Sistem),
                  fisik: angka_(r.Stok_Fisik), selisih: d, catatan: r.Catatan });
  });
  return Object.keys(sesi).map(function (k) {
    var x = sesi[k];
    x.lebih = bulat_(x.lebih, 2); x.kurang = bulat_(x.kurang, 2);
    x.item.sort(function (a, b) { return Math.abs(b.selisih) - Math.abs(a.selisih); });
    return x;
  }).sort(function (a, b) { return b.waktuRaw - a.waktuRaw; });
}

/* =================================================================
   KALENDER AKTIVITAS  (Beranda)
   ================================================================= */

/**
 * bulan: 'yyyy-MM'. Mengembalikan ringkasan per hari + daftar kejadian.
 * HPP / harga tidak pernah ikut di sini.
 */
function kalender(bulan, ident) {
  penggunaSaatIni_(ident);
  var m = /^(\d{4})-(\d{2})$/.exec(String(bulan || ''));
  var now = new Date();
  var thn = m ? parseInt(m[1], 10) : now.getFullYear();
  var bln = m ? parseInt(m[2], 10) - 1 : now.getMonth();
  var awal = new Date(thn, bln, 1), akhir = new Date(thn, bln + 1, 1);

  var hari = {};
  function h(d) {
    var k = tglStr_(d);
    if (!hari[k]) hari[k] = { tanggal: k, masuk: 0, keluar: 0, daur: 0, job: 0,
                              susutTinggi: 0, menunggu: 0, ditandai: 0, kg: 0, kejadian: [] };
    return hari[k];
  }
  function dalam(d) { return d >= awal && d < akhir; }
  function pushK(d, obj) { var x = h(d); x.kejadian.push(obj); }

  baca_(SHEET.PENERIMAAN).forEach(function (r) {
    var d = new Date(r.Waktu); if (!dalam(d) || !dihitung_(r)) return;
    var x = h(d), q = angka_(r.Qty_Kg);
    var retur = r.Jenis === JENIS_PENERIMAAN.RETUR;
    if (retur) x.keluar += q; else { x.masuk += q; x.kg += q; }
    if (r.Status === STATUS_TRANSFER.MENUNGGU) x.menunggu++;
    if (r.Status === STATUS_TRANSFER.DITANDAI) x.ditandai++;
    pushK(d, { t: d.getTime(), jam: Utilities.formatDate(d, APP.zona, 'HH:mm'),
      jenis: retur ? 'RETUR_SUPPLIER' : 'MASUK', label: (retur ? 'GBJ → ' : '') + r.Supplier + (retur ? '' : ' → GBJ'),
      item: r.Nama_Item, qty: q, status: r.Status, oleh: r.Nama_Pencatat, id: r.ID, sheet: 'entri' });
  });

  baca_(SHEET.PENGIRIMAN).forEach(function (r) {
    var d = new Date(r.Waktu); if (!dalam(d) || !dihitung_(r)) return;
    var x = h(d), q = angka_(r.Qty_Kg);
    var retur = r.Jenis === JENIS_PENGIRIMAN.RETUR_MASUK;
    if (retur) x.masuk += q; else x.keluar += q;
    if (r.Status === STATUS_TRANSFER.MENUNGGU) x.menunggu++;
    if (r.Status === STATUS_TRANSFER.DITANDAI) x.ditandai++;
    pushK(d, { t: d.getTime(), jam: Utilities.formatDate(d, APP.zona, 'HH:mm'),
      jenis: retur ? 'RETUR_CUSTOMER' : 'KELUAR', label: retur ? r.Customer + ' → GBJ' : 'GBJ → ' + r.Customer,
      item: r.Nama_Item, qty: q, status: r.Status, oleh: r.Nama_Pencatat, id: r.ID, sheet: 'entri' });
  });

  /* v9: daur ulang scrap — kirim ke chassen & terima biji plastik */
  baca_(SHEET.DAUR).forEach(function (r) {
    if (r.Status === STATUS_DAUR.DIBATALKAN) return;
    var dk = new Date(r.Waktu_Kirim);
    if (dalam(dk)) {
      var xk = h(dk); xk.daur = (xk.daur || 0) + 1;
      pushK(dk, { t: dk.getTime(), jam: Utilities.formatDate(dk, APP.zona, 'HH:mm'),
        jenis: 'DAUR_KIRIM', label: 'Scrap → ' + r.Vendor, item: '', qty: angka_(r.Total_Scrap_Kg),
        status: r.Status, oleh: r.Nama_Pencatat, id: r.ID, sheet: 'daur' });
    }
    if (r.Status === STATUS_DAUR.SELESAI && r.Waktu_Terima) {
      var dt = new Date(r.Waktu_Terima);
      if (dalam(dt)) {
        var xt = h(dt); xt.daur = (xt.daur || 0) + 1;
        if (r.Status_Susut && r.Status_Susut !== 'NORMAL') xt.susutTinggi++;
        pushK(dt, { t: dt.getTime(), jam: Utilities.formatDate(dt, APP.zona, 'HH:mm'),
          jenis: 'DAUR_TERIMA', label: r.Vendor + ' → GBJ', item: '', qty: angka_(r.Total_Hasil_Kg),
          status: r.Status_Susut, susut: angka_(r.Susut_Kg), persen: angka_(r.Susut_Persen),
          oleh: r.Nama_Penerima, id: r.ID, sheet: 'daur' });
      }
    }
  });

  baca_(SHEET.PEKERJAAN).forEach(function (r) {
    var dm = new Date(r.Waktu_Mulai);
    if (dalam(dm)) {
      var x = h(dm); x.job++;
      pushK(dm, { t: dm.getTime(), jam: Utilities.formatDate(dm, APP.zona, 'HH:mm'),
        jenis: 'JOB_MULAI', label: r.Nama_Produk, item: '', qty: angka_(r.Total_Bahan_Baku_Kg),
        status: r.Status, oleh: r.Nama_Operator, id: r.ID, sheet: 'job' });
    }
    if (r.Status === STATUS_PEKERJAAN.SELESAI && r.Waktu_Selesai) {
      var ds = new Date(r.Waktu_Selesai);
      if (dalam(ds)) {
        var y = h(ds);
        if (r.Status_Susut && r.Status_Susut !== 'NORMAL') y.susutTinggi++;
        pushK(ds, { t: ds.getTime(), jam: Utilities.formatDate(ds, APP.zona, 'HH:mm'),
          jenis: 'JOB_SELESAI', label: r.Nama_Produk, item: '', qty: angka_(r.Total_Barang_Jadi_Kg),
          status: r.Status_Susut, susut: angka_(r.Susut_Kg), persen: angka_(r.Susut_Persen),
          oleh: r.Nama_Operator, id: r.ID, sheet: 'job' });
      }
    }
  });

  var sesiOpn = {};
  baca_(SHEET.OPNAME).forEach(function (r) {
    var d = new Date(r.Waktu); if (!dalam(d)) return;
    var k = r.ID_Sesi;
    if (!sesiOpn[k]) { sesiOpn[k] = { d: d, lokasi: r.Lokasi, n: 0, selisih: 0, oleh: r.Nama_Pencatat }; }
    sesiOpn[k].n++; sesiOpn[k].selisih += angka_(r.Selisih);
  });
  Object.keys(sesiOpn).forEach(function (k) {
    var o = sesiOpn[k]; var x = h(o.d); x.opname = (x.opname || 0) + 1;
    pushK(o.d, { t: o.d.getTime(), jam: Utilities.formatDate(o.d, APP.zona, 'HH:mm'),
      jenis: 'OPNAME', label: o.lokasi + ' · ' + o.n + ' item', item: '', qty: bulat_(o.selisih, 1),
      status: '', oleh: o.oleh });
  });

  var daftar = Object.keys(hari).sort().map(function (k) {
    var x = hari[k];
    x.kejadian.sort(function (a, b) { return b.t - a.t; });
    x.masuk = bulat_(x.masuk, 1); x.keluar = bulat_(x.keluar, 1); x.kg = bulat_(x.kg, 1);
    return x;
  });

  return {
    bulan: Utilities.formatDate(awal, APP.zona, 'yyyy-MM'),
    hariIni: tglStr_(now),
    jumlahHari: new Date(thn, bln + 1, 0).getDate(),
    hariPertama: awal.getDay(),           // 0 = Minggu
    hari: daftar
  };
}

/* =================================================================
   HPP — hanya manager
   ================================================================= */

function laporanHpp(hari, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehLihatHpp_(u)) throw new Error('HPP hanya bisa dilihat Supervisor / Admin.');
  hari = hari || 30;
  var batas = new Date();
  batas.setDate(batas.getDate() - hari);

  var rows = baca_(SHEET.PEKERJAAN).filter(function (r) {
    return r.Status === STATUS_PEKERJAAN.SELESAI && new Date(r.Waktu_Selesai) >= batas;
  });

  var tot = { jobs: 0, jadi: 0, hppBahan: 0, hppProses: 0, hppTotal: 0, nilaiSusut: 0 };
  var perProduk = {};
  rows.forEach(function (r) {
    var jadi = angka_(r.Total_Barang_Jadi_Kg);
    tot.jobs++; tot.jadi += jadi;
    tot.hppBahan += angka_(r.HPP_Bahan); tot.hppProses += angka_(r.HPP_Proses);
    tot.hppTotal += angka_(r.HPP_Total); tot.nilaiSusut += angka_(r.Nilai_Susut);
    var k = r.Kode_Produk;
    if (!perProduk[k]) perProduk[k] = { kode: k, nama: r.Nama_Produk, jobs: 0, jadi: 0, hppTotal: 0, nilaiSusut: 0, minPerKg: null, maxPerKg: null };
    var pp = perProduk[k];
    pp.jobs++; pp.jadi += jadi; pp.hppTotal += angka_(r.HPP_Total); pp.nilaiSusut += angka_(r.Nilai_Susut);
    var pk = angka_(r.HPP_Per_Kg);
    if (pk > 0) { pp.minPerKg = pp.minPerKg === null ? pk : Math.min(pp.minPerKg, pk);
                  pp.maxPerKg = pp.maxPerKg === null ? pk : Math.max(pp.maxPerKg, pk); }
  });
  tot.perKg = tot.jadi > 0 ? bulat_(tot.hppTotal / tot.jadi, 0) : 0;
  ['jadi'].forEach(function (f) { tot[f] = bulat_(tot[f], 2); });
  ['hppBahan','hppProses','hppTotal','nilaiSusut'].forEach(function (f) { tot[f] = bulat_(tot[f], 0); });

  var ringkas = Object.keys(perProduk).map(function (k) {
    var p = perProduk[k];
    p.perKg = p.jadi > 0 ? bulat_(p.hppTotal / p.jadi, 0) : 0;
    p.jadi = bulat_(p.jadi, 2); p.hppTotal = bulat_(p.hppTotal, 0); p.nilaiSusut = bulat_(p.nilaiSusut, 0);
    p.minPerKg = p.minPerKg === null ? 0 : bulat_(p.minPerKg, 0);
    p.maxPerKg = p.maxPerKg === null ? 0 : bulat_(p.maxPerKg, 0);
    return p;
  }).sort(function (a, b) { return b.hppTotal - a.hppTotal; });

  var detail = rows.map(function (r) {
    return { id: r.ID, produk: r.Nama_Produk, tanggal: jam_(r.Waktu_Selesai),
             masuk: angka_(r.Total_Bahan_Baku_Kg), jadi: angka_(r.Total_Barang_Jadi_Kg),
             hppBahan: angka_(r.HPP_Bahan), hppProses: angka_(r.HPP_Proses),
             hppTotal: angka_(r.HPP_Total), perKg: angka_(r.HPP_Per_Kg),
             susut: angka_(r.Susut_Kg), nilaiSusut: angka_(r.Nilai_Susut), status: r.Status_Susut };
  }).reverse().slice(0, 100);

  return { hari: hari, mataUang: mataUang_(), biayaProsesPerKg: biayaProsesPerKg_(),
           total: tot, perProduk: ringkas, detail: detail };
}

/* ==== Media.gs ==== */
/**********************************************************************
 * IPC — Inventory & Production Control (MVP)
 * File 3 of 3 : Media.gs   — foto bukti + OCR surat jalan
 **********************************************************************/

/* ================= FOTO BUKTI ================= */

function dataUrlKeBlob_(dataUrl, namaFile) {
  var m = String(dataUrl).match(/^data:([^;]+);base64,(.*)$/);
  if (!m) throw new Error('Format foto tidak valid.');
  var bytes = Utilities.base64Decode(m[2]);
  return Utilities.newBlob(bytes, m[1], namaFile);
}

/**
 * Simpan foto ke folder Drive, atur agar bisa dilihat via link.
 * return { url, id }
 */
function unggahFoto_(dataUrl, prefix) {
  try {
    var stempel = Utilities.formatDate(new Date(), APP.zona, 'yyyyMMdd-HHmmss');
    var nama = (prefix || 'IPC') + '_' + stempel + '_' + emailAktif_().split('@')[0] + '.jpg';
    var blob = dataUrlKeBlob_(dataUrl, nama);
    var folder = ambilAtauBuatFolder_();
    var file = folder.createFile(blob);
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      // domain bisa melarang link sharing — foto tetap tersimpan
    }
    return { url: file.getUrl(), id: file.getId() };
  } catch (e) {
    catatLog_('FOTO_GAGAL', '', String(e));
    return { url: '', id: '', error: String(e) };
  }
}

/** Dipanggil dari UI (upload duluan, lalu simpan transfer). */
function unggahFoto(dataUrl, prefix) {
  penggunaSaatIni_();
  return unggahFoto_(dataUrl, prefix);
}

/* ================= OCR SURAT JALAN ================= */

/**
 * Baca surat jalan dari foto. Butuh Advanced Drive Service (v2 atau v3).
 * return { ok, teks, noSuratJalan, kandidatQty:[{qty,satuan,konteks}], qtySaran }
 */
function ocrSuratJalan(dataUrl) {
  penggunaSaatIni_();
  if ((getSetting_('OCR_AKTIF') || 'YA').toUpperCase() !== 'YA') {
    return { ok: false, pesan: 'OCR dimatikan di Pengaturan.' };
  }
  if (typeof Drive === 'undefined') {
    return { ok: false, pesan: 'Advanced Drive Service belum diaktifkan (Services > Drive API).' };
  }

  var docId = null;
  try {
    var blob = dataUrlKeBlob_(dataUrl, 'ocr_' + Date.now() + '.jpg');
    var bahasa = getSetting_('OCR_BAHASA') || 'id';
    var res;

    if (Drive.Files && typeof Drive.Files.insert === 'function') {           // Drive v2
      res = Drive.Files.insert(
        { title: 'OCR_TEMP_' + Date.now(), mimeType: 'application/vnd.google-apps.document' },
        blob, { ocr: true, ocrLanguage: bahasa });
    } else if (Drive.Files && typeof Drive.Files.create === 'function') {    // Drive v3
      res = Drive.Files.create(
        { name: 'OCR_TEMP_' + Date.now(), mimeType: 'application/vnd.google-apps.document' },
        blob, { ocrLanguage: bahasa });
    } else {
      return { ok: false, pesan: 'Drive API tidak mendukung OCR di project ini.' };
    }

    docId = res.id;
    var teks = DocumentApp.openById(docId).getBody().getText();
    var hasil = parseSuratJalan_(teks);
    hasil.ok = true;
    hasil.teks = teks.slice(0, 3000);
    catatLog_('OCR', hasil.noSuratJalan || '', 'saran qty: ' + hasil.qtySaran);
    return hasil;

  } catch (e) {
    return { ok: false, pesan: 'OCR gagal: ' + e };
  } finally {
    if (docId) { try { DriveApp.getFileById(docId).setTrashed(true); } catch (e2) {} }
  }
}

/**
 * Ambil no surat jalan + kandidat qty dari teks OCR.
 * Murni string parsing — aman dites di luar Apps Script.
 */
function parseSuratJalan_(teks) {
  var t = String(teks || '').replace(/ /g, ' ');
  var baris = t.split(/\r?\n/);

  /* --- nomor surat jalan --- */
  var noSJ = '';
  var polaNo = [
    /(?:surat\s*jalan|no\.?\s*sj|nomor\s*sj|sj\s*no|delivery\s*(?:order|note))\s*[:#.\-]?\s*([A-Z0-9][A-Z0-9\/\-\.]{3,})/i,
    /\b(SJ[\/\-][A-Z0-9\/\-\.]{3,})\b/i,
    /\b(DO[\/\-][A-Z0-9\/\-\.]{3,})\b/i
  ];
  for (var i = 0; i < polaNo.length && !noSJ; i++) {
    var m = t.match(polaNo[i]);
    if (m) noSJ = m[1].replace(/[.,;:]+$/, '').trim();
  }

  /* --- kandidat kuantitas --- */
  var satuanPola = '(kg|kgs|kilogram|gr|gram|ltr|liter|pcs|pc|pack|pak|bks|ctn|carton|karton|dus|box|sak|zak|bal|roll|unit)';
  var kandidat = [];
  var reQty = new RegExp('(\\d{1,3}(?:[.,]\\d{3})*(?:[.,]\\d{1,3})?|\\d+(?:[.,]\\d{1,3})?)\\s*' + satuanPola + '\\b', 'gi');

  baris.forEach(function (b) {
    var mm;
    reQty.lastIndex = 0;
    while ((mm = reQty.exec(b)) !== null) {
      var q = normalisasiAngka_(mm[1]);
      if (q > 0 && q < 10000000) {
        kandidat.push({ qty: q, satuan: mm[2].toLowerCase(), konteks: b.trim().slice(0, 90) });
      }
    }
  });

  /* baris yang menyebut jumlah/qty/total tanpa satuan */
  var reLabel = /(?:qty|quantity|jumlah|jml|total|banyaknya|netto|net\s*weight|berat)\s*[:=]?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,3})?|\d+(?:[.,]\d{1,3})?)/gi;
  var mL;
  while ((mL = reLabel.exec(t)) !== null) {
    var qv = normalisasiAngka_(mL[1]);
    if (qv > 0 && qv < 10000000) {
      kandidat.push({ qty: qv, satuan: '', konteks: potongSekitar_(t, mL.index) });
    }
  }

  /* dedupe, prioritas: punya satuan dulu, lalu nilai terbesar */
  var seen = {}, unik = [];
  kandidat.forEach(function (k) {
    var key = k.qty + '|' + k.satuan;
    if (seen[key]) return;
    seen[key] = true;
    unik.push(k);
  });
  unik.sort(function (a, b) {
    if (!!b.satuan !== !!a.satuan) return b.satuan ? 1 : -1;
    return b.qty - a.qty;
  });

  return {
    noSuratJalan: noSJ,
    kandidatQty: unik.slice(0, 8),
    qtySaran: unik.length ? unik[0].qty : null,
    satuanSaran: unik.length ? unik[0].satuan : ''
  };
}

/** "1.250,5" / "1,250.5" / "1250" -> 1250.5 */
function normalisasiAngka_(s) {
  var v = String(s).trim();
  var adaTitik = v.indexOf('.') >= 0, adaKoma = v.indexOf(',') >= 0;
  if (adaTitik && adaKoma) {
    if (v.lastIndexOf(',') > v.lastIndexOf('.')) v = v.replace(/\./g, '').replace(',', '.');
    else v = v.replace(/,/g, '');
  } else if (adaKoma) {
    var bagian = v.split(',');
    if (bagian.length === 2 && bagian[1].length === 3 && bagian[0].length <= 3) v = v.replace(',', '');
    else v = v.replace(',', '.');
  } else if (adaTitik) {
    var bg = v.split('.');
    if (bg.length > 2) v = v.replace(/\./g, '');
    else if (bg.length === 2 && bg[1].length === 3 && bg[0].length <= 3) v = v.replace('.', '');
  }
  var n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function potongSekitar_(teks, idx) {
  var a = Math.max(0, idx - 30), b = Math.min(teks.length, idx + 50);
  return teks.slice(a, b).replace(/\s+/g, ' ').trim();
}

/* ================= TES CEPAT (jalankan manual di editor) ================= */

function tesParserSuratJalan() {
  var contoh = [
    'PT CONTOH PANGAN NUSANTARA',
    'SURAT JALAN No: SJ/2026/09/0184',
    'Kepada: Gudang Produksi',
    '1. Kacang Mete Mentah W240 ......... 250 kg',
    '2. Kacang Tanah Java .............. 1.250,5 kg',
    'Total Netto : 1500,5',
    'Jumlah koli: 32 karton'
  ].join('\n');
  Logger.log(JSON.stringify(parseSuratJalan_(contoh), null, 2));
}

/* ==== Pembelian.gs ==== */
/**********************************************************************
 * IPC — Inventory & Production Control (v7)
 * File 4 : Pembelian.gs
 *
 * Modul v7: migrasi skema, Pesanan Pembelian (PO), penerimaan vs PO,
 * retur dari penerimaan, invoice + validasi, HPP FIFO, laporan barang rusak,
 * standar susut per produk.
 **********************************************************************/

/* ================= MIGRASI SKEMA (otomatis sekali per versi) ================= */

/** Tambah sheet/kolom/setting yang belum ada. Aman dijalankan berulang. */
function migrasiSkema() {
  lupakanMemo_();
  var ss = ss_();
  migrasiV9_(ss);
  Object.keys(SHEET).forEach(function (k) {
    var nama = SHEET[k], head = HEADER[nama];
    var sh = ss.getSheetByName(nama);
    if (!sh) {
      sh = ss.insertSheet(nama);
      sh.getRange(1, 1, 1, head.length).setValues([head]);
      sh.setFrozenRows(1);
      return;
    }
    var maxKol = sh.getMaxColumns();
    var ada = sh.getRange(1, 1, 1, maxKol).getValues()[0].map(String);
    var kurang = head.filter(function (h) { return ada.indexOf(h) < 0; });
    if (!kurang.length) return;
    var terakhir = 0;
    for (var i = ada.length - 1; i >= 0; i--) if (ada[i]) { terakhir = i + 1; break; }
    if (terakhir + kurang.length > maxKol) sh.insertColumnsAfter(Math.max(terakhir, 1), terakhir + kurang.length - maxKol);
    sh.getRange(1, terakhir + 1, 1, kurang.length).setValues([kurang]);
  });
  /* setting baru */
  var rows = baca_(SHEET.SETTING), adaKunci = {};
  rows.forEach(function (r) { adaKunci[r.Kunci] = true; });
  var shS = sheet_(SHEET.SETTING);
  DEFAULT_SETTING.forEach(function (d) { if (!adaKunci[d[0]]) shS.appendRow(d); });
  lupakanMemo_();
  try { PropertiesService.getScriptProperties().setProperty('SKEMA_VERSI', APP.versi); } catch (e) {}
  return 'Skema v' + APP.versi + ' siap.';
}

/**
 * v9: gudang produksi (GP) dihapus → satu lokasi.
 *  - Master_Item: Stok_Awal_GP digabung ke Stok_Awal_GBJ, kolomnya dihapus, header jadi 'Stok_Awal'.
 *  - Sheet 'Transfer' lama tidak dipakai lagi → diganti nama 'Transfer_lama' (data tetap ada, tidak dihitung;
 *    transfer GBJ↔GP dalam satu gudang memang saling meniadakan).
 * Aman dijalankan berulang.
 */
function migrasiV9_(ss) {
  var sh = ss.getSheetByName(SHEET.ITEM);
  if (sh) {
    var maxKol = sh.getMaxColumns();
    var head = sh.getRange(1, 1, 1, maxKol).getValues()[0].map(String);
    var iGbj = head.indexOf('Stok_Awal_GBJ'), iGp = head.indexOf('Stok_Awal_GP'), n = sh.getLastRow();
    if (iGbj >= 0 && iGp >= 0 && n >= 2) {
      var vG = sh.getRange(2, iGbj + 1, n - 1, 1).getValues(), vP = sh.getRange(2, iGp + 1, n - 1, 1).getValues();
      sh.getRange(2, iGbj + 1, n - 1, 1).setValues(vG.map(function (r, i) { return [angka_(r[0]) + angka_(vP[i][0])]; }));
    }
    if (iGp >= 0) { sh.deleteColumn(iGp + 1); if (iGp < iGbj) iGbj--; }
    if (iGbj >= 0) sh.getRange(1, iGbj + 1).setValue('Stok_Awal');
    lupakanMemo_(SHEET.ITEM);
  }
  var trf = ss.getSheetByName('Transfer');
  if (trf) { try { trf.setName('Transfer_lama'); } catch (e) {} }
}

/** Dipanggil di awal tiap request: migrasi hanya kalau versi skema berubah (1 property read). */
function pastikanSkema_() {
  if (typeof PropertiesService === 'undefined') return;
  try {
    var v = PropertiesService.getScriptProperties().getProperty('SKEMA_VERSI');
    if (v !== APP.versi) migrasiSkema();
  } catch (e) {}
}

/* ================= UTIL ================= */

function metodeHpp_() { return (getSetting_('METODE_HPP') || 'FIFO').toUpperCase() === 'MASTER' ? 'MASTER' : 'FIFO'; }
function wajibPo_()   { return (getSetting_('WAJIB_PO') || 'TIDAK').toUpperCase() === 'YA'; }

/** Kunci urutan kronologis: tanggal transaksi + jam pencatatan (supaya backdate tetap urut). */
function kunciWaktu_(tanggal, waktu) {
  var jam = '00:00:00.000';
  try { jam = Utilities.formatDate(new Date(waktu), APP.zona, 'HH:mm:ss.SSS'); } catch (e) {}
  return String(tanggal || '') + 'T' + jam;
}
/* urutan kalau waktu sama persis: penambahan lapisan dulu, baru pemakaian */
var PRIORITAS_EV_ = { MASUK: 0, RETUR_CUST: 0, JOB_SELESAI: 0, DAUR_TERIMA: 0, OPNAME: 1, JOB_MULAI: 3, RETUR: 3, JUAL: 3, RUSAK: 3, DAUR_KIRIM: 3 };

/* =================================================================
   PESANAN PEMBELIAN (PO) — manager
   ================================================================= */

function bolehPo_(u) { return bolehReview_(u); }

function nomorPoBaru_() {
  var tgl = Utilities.formatDate(new Date(), APP.zona, 'yyMMdd');
  var n = baca_(SHEET.PO).filter(function (r) { return String(r.No_PO).indexOf('PO-' + tgl) === 0; })
    .map(function (r) { return String(r.No_PO); });
  var uniq = {}; n.forEach(function (x) { uniq[x] = 1; });
  return 'PO-' + tgl + '-' + String(Object.keys(uniq).length + 1).padStart(2, '0');
}

/**
 * p = { supplier, tanggal, perkiraanDatang, catatan,
 *       baris:[{ kode, qty, harga, spesifikasi }] }
 */
function simpanPo(p, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehPo_(u)) throw new Error('Hanya Manager / Admin yang bisa membuat pesanan pembelian.');
  if (!p || !String(p.supplier || '').trim()) throw new Error('Supplier belum dipilih.');
  if (!p.baris || !p.baris.length) throw new Error('Item PO belum diisi.');
  var peta = petaItem_();
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();   // di dalam lock: baca ulang dari sheet, jangan pakai memo sebelum lock
  try {
    var now = new Date(), tanggal = tglValid_(p.tanggal);
    var datang = String(p.perkiraanDatang || '').trim();
    if (datang && !/^\d{4}-\d{2}-\d{2}$/.test(datang)) throw new Error('Format perkiraan datang harus YYYY-MM-DD.');
    var noPo = nomorPoBaru_(), ids = [], total = 0, nilai = 0;
    p.baris.forEach(function (b) {
      var it = peta[b.kode]; if (!it) throw new Error('Item tidak dikenal: ' + b.kode);
      var q = angka_(b.qty), h = angka_(b.harga);
      if (q <= 0) throw new Error('Qty harus > 0 (' + it.nama + ')');
      if (h <= 0) throw new Error('Harga beli per kg harus diisi (' + it.nama + ')');
      var id = buatId_('PO'); ids.push(id); total += q; nilai += q * h;
      tambah_(SHEET.PO, {
        ID: id, No_PO: noPo, Waktu: now, Tanggal: tanggal, Supplier: p.supplier,
        Kode_Item: it.kode, Nama_Item: it.nama, Qty_Kg: q, Harga_Per_Kg: h,
        Spesifikasi: b.spesifikasi || '', Perkiraan_Datang: datang, Qty_Diterima_Kg: 0,
        Status: STATUS_PO.TERBUKA, Dibuat_Oleh: penandaPencatat_(u), Nama_Pembuat: u.nama,
        Catatan: p.catatan || '', Log_Edit: ''
      });
    });
    catatLog_('PO_BUAT', noPo, p.supplier + ' • ' + ids.length + ' item • ' + bulat_(total, 2) + ' kg • ' + mataUang_() + ' ' + bulat_(nilai, 0));
    return { ok: true, noPo: noPo, ids: ids, totalKg: bulat_(total, 2), nilai: bulat_(nilai, 0) };
  } finally { lock.releaseLock(); }
}

/** perubahan = { qty, harga, spesifikasi, perkiraanDatang, catatan } untuk satu baris PO */
function ubahPo(id, perubahan, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehPo_(u)) throw new Error('Hanya Manager / Admin yang bisa mengubah PO.');
  perubahan = perubahan || {};
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();   // di dalam lock: baca ulang dari sheet, jangan pakai memo sebelum lock
  try {
    var r = cariEntri_(SHEET.PO, id);
    if (r.Status === STATUS_PO.DIBATALKAN) throw new Error('PO sudah dibatalkan.');
    var ubah = {}, log = [];
    if (perubahan.qty !== undefined) {
      var q = angka_(perubahan.qty);
      if (q <= 0) throw new Error('Qty harus > 0.');
      if (q < angka_(r.Qty_Diterima_Kg)) throw new Error('Qty tidak boleh lebih kecil dari yang sudah diterima (' + angka_(r.Qty_Diterima_Kg) + ' kg).');
      if (q !== angka_(r.Qty_Kg)) { ubah.Qty_Kg = q; log.push('qty: ' + angka_(r.Qty_Kg) + ' → ' + q); }
    }
    if (perubahan.harga !== undefined) {
      var h = angka_(perubahan.harga);
      if (h <= 0) throw new Error('Harga harus > 0.');
      if (h !== angka_(r.Harga_Per_Kg)) { ubah.Harga_Per_Kg = h; log.push('harga: ' + angka_(r.Harga_Per_Kg) + ' → ' + h); }
    }
    if (perubahan.spesifikasi !== undefined && String(perubahan.spesifikasi) !== String(r.Spesifikasi || '')) { ubah.Spesifikasi = perubahan.spesifikasi; log.push('spesifikasi diubah'); }
    if (perubahan.perkiraanDatang !== undefined && String(perubahan.perkiraanDatang) !== String(r.Perkiraan_Datang || '')) { ubah.Perkiraan_Datang = perubahan.perkiraanDatang; log.push('perkiraan datang: ' + (r.Perkiraan_Datang || '—') + ' → ' + (perubahan.perkiraanDatang || '—')); }
    if (perubahan.catatan !== undefined && String(perubahan.catatan) !== String(r.Catatan || '')) { ubah.Catatan = perubahan.catatan; log.push('catatan diubah'); }
    if (!log.length) return { ok: true, berubah: false };
    var stempel = Utilities.formatDate(new Date(), APP.zona, 'dd/MM HH:mm') + ' ' + u.nama + ': ' + log.join('; ');
    ubah.Log_Edit = [r.Log_Edit, stempel].filter(String).join('\n');
    ubahBaris_(SHEET.PO, r._baris, ubah);
    if (ubah.Qty_Kg !== undefined) sinkronPo_(id);
    catatLog_('PO_UBAH', id, log.join('; '));
    return { ok: true, berubah: true, log: log };
  } finally { lock.releaseLock(); }
}

function batalkanPo(id, alasan, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehPo_(u)) throw new Error('Hanya Manager / Admin yang bisa membatalkan PO.');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();   // di dalam lock: baca ulang dari sheet, jangan pakai memo sebelum lock
  try {
    var r = cariEntri_(SHEET.PO, id);
    if (angka_(r.Qty_Diterima_Kg) > 0) throw new Error('PO sudah ada penerimaan (' + angka_(r.Qty_Diterima_Kg) + ' kg) — tidak bisa dibatalkan, ubah qty-nya saja.');
    var stempel = Utilities.formatDate(new Date(), APP.zona, 'dd/MM HH:mm') + ' ' + u.nama + ': dibatalkan' + (alasan ? ' — ' + alasan : '');
    ubahBaris_(SHEET.PO, r._baris, { Status: STATUS_PO.DIBATALKAN, Log_Edit: [r.Log_Edit, stempel].filter(String).join('\n') });
    catatLog_('PO_BATAL', id, alasan || '');
    return { ok: true };
  } finally { lock.releaseLock(); }
}

/** Hitung ulang Qty_Diterima & Status satu baris PO dari semua penerimaan (yang dihitung) yang merujuknya. */
function sinkronPo_(idPo) {
  var r = null, rows = baca_(SHEET.PO);
  for (var i = 0; i < rows.length; i++) if (rows[i].ID === idPo) r = rows[i];
  if (!r) return;
  var diterima = 0;
  baca_(SHEET.PENERIMAAN).forEach(function (p) {
    if (p.ID_PO === idPo && p.Jenis === JENIS_PENERIMAAN.MASUK && dihitung_(p)) diterima += angka_(p.Qty_Kg);
  });
  var status = r.Status === STATUS_PO.DIBATALKAN ? STATUS_PO.DIBATALKAN
             : diterima <= 0 ? STATUS_PO.TERBUKA
             : diterima + 0.0001 >= angka_(r.Qty_Kg) ? STATUS_PO.SELESAI : STATUS_PO.SEBAGIAN;
  ubahBaris_(SHEET.PO, r._baris, { Qty_Diterima_Kg: bulat_(diterima, 3), Status: status });
}

function ringkasPo_(r, lihatHarga) {
  var o = {
    id: r.ID, noPo: r.No_PO, tanggal: r.Tanggal, supplier: r.Supplier,
    kode: r.Kode_Item, item: r.Nama_Item, qty: angka_(r.Qty_Kg), diterima: angka_(r.Qty_Diterima_Kg),
    sisa: bulat_(Math.max(0, angka_(r.Qty_Kg) - angka_(r.Qty_Diterima_Kg)), 3),
    spesifikasi: r.Spesifikasi || '', perkiraanDatang: r.Perkiraan_Datang || '', status: r.Status,
    pembuat: r.Nama_Pembuat, catatan: r.Catatan || '', logEdit: r.Log_Edit || ''
  };
  if (lihatHarga) { o.harga = angka_(r.Harga_Per_Kg); o.nilai = bulat_(o.qty * o.harga, 0); }
  return o;
}

/** Daftar PO. status: '' (semua aktif = TERBUKA+SEBAGIAN) | TERBUKA | SEBAGIAN | SELESAI | DIBATALKAN | SEMUA */
function daftarPo(ident, status, hari) {
  var u = penggunaSaatIni_(ident);
  var lihatHarga = bolehLihatHpp_(u);
  var batas = new Date(); batas.setDate(batas.getDate() - (hari || 90));
  return baca_(SHEET.PO).filter(function (r) {
    if (status === 'SEMUA') return new Date(r.Waktu) >= batas;
    if (!status) return r.Status === STATUS_PO.TERBUKA || r.Status === STATUS_PO.SEBAGIAN;
    return r.Status === status && new Date(r.Waktu) >= batas;
  }).map(function (r) { return ringkasPo_(r, lihatHarga); }).reverse();
}

/** Baris PO yang masih bisa diterima (untuk form penerimaan staf) — tanpa harga. */
function poTerbuka(ident) {
  penggunaSaatIni_(ident);
  return baca_(SHEET.PO).filter(function (r) {
    return r.Status === STATUS_PO.TERBUKA || r.Status === STATUS_PO.SEBAGIAN;
  }).map(function (r) { return ringkasPo_(r, false); });
}

/* =================================================================
   RETUR: hanya dari penerimaan yang sudah tercatat
   ================================================================= */

/** Penerimaan MASUK yang masih bisa diretur: sisa = diterima − retur yang sudah merujuknya. */
function returTersedia(ident, supplier) {
  penggunaSaatIni_(ident);
  return hitungReturSisa_(supplier);
}
function hitungReturSisa_(supplier) {
  var rows = baca_(SHEET.PENERIMAAN);
  var sudah = {};
  rows.forEach(function (r) {
    if (r.Jenis === JENIS_PENERIMAAN.RETUR && r.ID_Penerimaan_Asal && dihitung_(r)) {
      sudah[r.ID_Penerimaan_Asal] = (sudah[r.ID_Penerimaan_Asal] || 0) + angka_(r.Qty_Kg);
    }
  });
  return rows.filter(function (r) {
    return r.Jenis === JENIS_PENERIMAAN.MASUK && dihitung_(r) && (!supplier || r.Supplier === supplier);
  }).map(function (r) {
    var sisa = bulat_(angka_(r.Qty_Kg) - (sudah[r.ID] || 0), 3);
    return { id: r.ID, tanggal: r.Tanggal, supplier: r.Supplier, kode: r.Kode_Item, item: r.Nama_Item,
             diterima: angka_(r.Qty_Kg), sudahRetur: bulat_(sudah[r.ID] || 0, 3), sisa: sisa,
             noSuratJalan: r.No_Surat_Jalan || '', idPo: r.ID_PO || '', status: r.Status };
  }).filter(function (x) { return x.sisa > 0; }).reverse().slice(0, 100);
}

/* =================================================================
   INVOICE — manager unggah & validasi
   ================================================================= */

/** Σ(qty diterima × harga PO) untuk satu No_PO + rincian per baris. */
function ringkasanPo(noPo, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehLihatHpp_(u)) throw new Error('Hanya Manager / Admin.');
  var baris = baca_(SHEET.PO).filter(function (r) { return r.No_PO === noPo; });
  if (!baris.length) throw new Error('PO tidak ditemukan: ' + noPo);
  var total = 0, totalDiterima = 0, nilaiDiterima = 0;
  var rincian = baris.map(function (r) {
    var o = ringkasPo_(r, true);
    o.nilaiDiterima = bulat_(o.diterima * o.harga, 0);
    total += o.nilai; totalDiterima += o.diterima; nilaiDiterima += o.nilaiDiterima;
    return o;
  });
  var invoices = baca_(SHEET.INVOICE).filter(function (r) { return r.No_PO === noPo; }).map(ringkasInvoice_);
  return { noPo: noPo, supplier: baris[0].Supplier, tanggal: baris[0].Tanggal, status: statusPoGabungan_(baris),
           nilaiPo: bulat_(total, 0), kgDiterima: bulat_(totalDiterima, 2), nilaiDiterima: bulat_(nilaiDiterima, 0),
           baris: rincian, invoices: invoices };
}

function statusPoGabungan_(baris) {
  var aktif = baris.filter(function (r) { return r.Status !== STATUS_PO.DIBATALKAN; });
  if (!aktif.length) return STATUS_PO.DIBATALKAN;
  if (aktif.every(function (r) { return r.Status === STATUS_PO.SELESAI; })) return STATUS_PO.SELESAI;
  if (aktif.some(function (r) { return angka_(r.Qty_Diterima_Kg) > 0; })) return STATUS_PO.SEBAGIAN;
  return STATUS_PO.TERBUKA;
}

function ringkasInvoice_(r) {
  return { id: r.ID, tanggal: r.Tanggal, noPo: r.No_PO, supplier: r.Supplier, noInvoice: r.No_Invoice,
           tanggalInvoice: r.Tanggal_Invoice || '', totalInvoice: angka_(r.Total_Invoice), totalSistem: angka_(r.Total_Sistem),
           selisih: angka_(r.Selisih), file: r.File_URL || '', fileId: r.File_ID || '', status: r.Status,
           pengunggah: r.Nama_Pengunggah, validator: r.Divalidasi_Oleh || '', catatan: r.Catatan || '' };
}

/** p = { noPo, noInvoice, tanggalInvoice, totalInvoice, file (dataUrl), catatan } */
function simpanInvoice(p, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehPo_(u)) throw new Error('Hanya Manager / Admin yang bisa mengunggah invoice.');
  if (!p || !p.noPo) throw new Error('No. PO kosong.');
  if (!String(p.noInvoice || '').trim()) throw new Error('No. invoice wajib diisi.');
  var totalInv = angka_(p.totalInvoice);
  if (totalInv <= 0) throw new Error('Total invoice harus > 0.');
  var rk = ringkasanPo(p.noPo, ident);
  var file = p.file ? unggahFoto_(p.file, 'INV') : { url: '', id: '' };
  var id = buatId_('INV');
  tambah_(SHEET.INVOICE, {
    ID: id, Waktu: new Date(), Tanggal: tglStr_(new Date()), No_PO: p.noPo, Supplier: rk.supplier,
    No_Invoice: p.noInvoice, Tanggal_Invoice: p.tanggalInvoice || '', Total_Invoice: totalInv,
    Total_Sistem: rk.nilaiDiterima, Selisih: bulat_(totalInv - rk.nilaiDiterima, 0),
    File_URL: file.url, File_ID: file.id, Status: STATUS_INVOICE.MENUNGGU,
    Diunggah_Oleh: penandaPencatat_(u), Nama_Pengunggah: u.nama, Divalidasi_Oleh: '', Waktu_Validasi: '', Catatan: p.catatan || ''
  });
  catatLog_('INVOICE_UNGGAH', id, p.noPo + ' • ' + p.noInvoice + ' • ' + mataUang_() + ' ' + bulat_(totalInv, 0) + ' (sistem ' + bulat_(rk.nilaiDiterima, 0) + ')');
  return { ok: true, id: id, totalSistem: rk.nilaiDiterima, selisih: bulat_(totalInv - rk.nilaiDiterima, 0) };
}

/**
 * Validasi invoice. aksi: 'valid' | 'tolak'.
 * hargaBaru = { <kode item>: harga } opsional — kalau harga di invoice beda, harga PO & batch penerimaan diperbarui (dasar FIFO).
 */
function validasiInvoice(id, aksi, hargaBaru, catatan, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehPo_(u)) throw new Error('Hanya Manager / Admin yang bisa memvalidasi invoice.');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();   // di dalam lock: baca ulang dari sheet, jangan pakai memo sebelum lock
  try {
    var inv = cariEntri_(SHEET.INVOICE, id);
    if (inv.Status !== STATUS_INVOICE.MENUNGGU) throw new Error('Invoice sudah ' + inv.Status + '.');
    var diubah = [];
    if (aksi === 'valid' && hargaBaru && typeof hargaBaru === 'object') {
      var poRows = baca_(SHEET.PO).filter(function (r) { return r.No_PO === inv.No_PO; });
      var rcv = baca_(SHEET.PENERIMAAN);
      Object.keys(hargaBaru).forEach(function (kode) {
        var h = angka_(hargaBaru[kode]); if (h <= 0) return;
        poRows.forEach(function (r) {
          if (r.Kode_Item !== kode || angka_(r.Harga_Per_Kg) === h) return;
          var stempel = Utilities.formatDate(new Date(), APP.zona, 'dd/MM HH:mm') + ' ' + u.nama + ': harga ' + angka_(r.Harga_Per_Kg) + ' → ' + h + ' (invoice ' + inv.No_Invoice + ')';
          ubahBaris_(SHEET.PO, r._baris, { Harga_Per_Kg: h, Log_Edit: [r.Log_Edit, stempel].filter(String).join('\n') });
          rcv.forEach(function (p) { if (p.ID_PO === r.ID) ubahBaris_(SHEET.PENERIMAAN, p._baris, { Harga_Per_Kg: h }); });
          diubah.push(r.Nama_Item + ': ' + angka_(r.Harga_Per_Kg) + ' → ' + h);
        });
      });
    }
    var rk = ringkasanPo(inv.No_PO, ident);
    ubahBaris_(SHEET.INVOICE, inv._baris, {
      Status: aksi === 'valid' ? STATUS_INVOICE.VALID : STATUS_INVOICE.DITOLAK,
      Total_Sistem: rk.nilaiDiterima, Selisih: bulat_(angka_(inv.Total_Invoice) - rk.nilaiDiterima, 0),
      Divalidasi_Oleh: u.nama, Waktu_Validasi: new Date(),
      Catatan: [inv.Catatan, catatan, diubah.length ? 'harga diperbarui: ' + diubah.join('; ') : ''].filter(String).join(' | ')
    });
    catatLog_(aksi === 'valid' ? 'INVOICE_VALID' : 'INVOICE_TOLAK', id, inv.No_PO + (diubah.length ? ' • ' + diubah.join('; ') : ''));
    return { ok: true, status: aksi === 'valid' ? STATUS_INVOICE.VALID : STATUS_INVOICE.DITOLAK, hargaDiubah: diubah,
             selisih: bulat_(angka_(inv.Total_Invoice) - rk.nilaiDiterima, 0) };
  } finally { lock.releaseLock(); }
}

function daftarInvoice(ident, status) {
  var u = penggunaSaatIni_(ident);
  if (!bolehLihatHpp_(u)) throw new Error('Hanya Manager / Admin.');
  return baca_(SHEET.INVOICE).filter(function (r) { return !status || r.Status === status; })
    .map(ringkasInvoice_).reverse().slice(0, 100);
}

/* =================================================================
   HPP FIFO — mesin lapisan (batch) per item. v9: satu lokasi (GBJ).
   ================================================================= */

/**
 * Putar ulang semua kejadian secara kronologis. Setiap penerimaan = lapisan {qty, harga}.
 * Pemakaian mengambil lapisan tertua dulu. Pekerjaan memakai bahan dari gudang dan hasilnya kembali ke gudang.
 * Daur ulang: scrap keluar (nilai lapisannya = Nilai_Scrap), biji plastik kembali dengan harga (nilai scrap + jasa) / kg.
 * Hasil: { lapisan: {kode:[{qty,harga,asal}]}, biaya: {idKejadian: nilai}, hargaJob: {idJob:{kode:hargaRata}}, nilaiDaur: {idDaur: nilaiScrap} }
 */
function hitungFifo_(sampaiTanggal) {
  var peta = petaItem_();
  var batasK = sampaiTanggal ? String(sampaiTanggal) + 'T23:59:59.999' : null;   // opsional: posisi per akhir tanggal tertentu
  var L = {};   // kode -> [{qty,harga,asal}]
  function lap(kode) { if (!L[kode]) L[kode] = []; return L[kode]; }
  function hargaCadangan(kode) {
    var q = 0, n = 0, arr = L[kode] || [];
    arr.forEach(function (x) { q += x.qty; n += x.qty * x.harga; });
    if (q > 0) return n / q;
    return peta[kode] ? peta[kode].harga : 0;
  }
  function tambahLap(kode, qty, harga, asal) { if (qty > 0) lap(kode).push({ qty: qty, harga: harga, asal: asal }); }
  /** ambil qty (FIFO). Kalau lapisan kurang, sisanya dinilai harga cadangan. Kembalikan {nilai, lapisan:[{qty,harga,asal}]} */
  function ambil(kode, qty, asalKhusus) {
    var arr = lap(kode), sisa = qty, nilai = 0, diambil = [];
    if (asalKhusus) {
      for (var j = 0; j < arr.length && sisa > 0; j++) {
        if (arr[j].asal !== asalKhusus) continue;
        var a = Math.min(arr[j].qty, sisa); arr[j].qty -= a; sisa -= a; nilai += a * arr[j].harga; diambil.push({ qty: a, harga: arr[j].harga, asal: arr[j].asal });
      }
    }
    while (sisa > 0 && arr.length) {
      var x = arr[0], a2 = Math.min(x.qty, sisa);
      x.qty -= a2; sisa -= a2; nilai += a2 * x.harga; diambil.push({ qty: a2, harga: x.harga, asal: x.asal });
      if (x.qty <= 0.0000001) arr.shift();
    }
    for (var k = arr.length - 1; k >= 0; k--) if (arr[k].qty <= 0.0000001) arr.splice(k, 1);
    if (sisa > 0) { var hc = hargaCadangan(kode) || (peta[kode] ? peta[kode].harga : 0); nilai += sisa * hc; diambil.push({ qty: sisa, harga: hc, asal: 'CADANGAN' }); }
    return { nilai: nilai, lapisan: diambil };
  }

  /* stok awal = lapisan pertama */
  Object.keys(peta).forEach(function (k) { tambahLap(k, peta[k].awal || 0, peta[k].harga || 0, 'AWAL'); });

  var ev = [];
  var poHarga = {}; baca_(SHEET.PO).forEach(function (r) { poHarga[r.ID] = angka_(r.Harga_Per_Kg); });
  baca_(SHEET.PENERIMAAN).forEach(function (r) {
    if (!dihitung_(r)) return;
    var harga = angka_(r.Harga_Per_Kg) || (r.ID_PO && poHarga[r.ID_PO]) || 0;
    ev.push({ k: kunciWaktu_(r.Tanggal, r.Waktu), t: r.Jenis === JENIS_PENERIMAAN.RETUR ? 'RETUR' : 'MASUK', r: r, harga: harga });
  });
  baca_(SHEET.PENGIRIMAN).forEach(function (r) {
    if (!dihitung_(r)) return;
    ev.push({ k: kunciWaktu_(r.Tanggal, r.Waktu), t: r.Jenis === JENIS_PENGIRIMAN.RETUR_MASUK ? 'RETUR_CUST' : 'JUAL', r: r });
  });
  var detail = baca_(SHEET.DETAIL), detPerJob = {};
  detail.forEach(function (d) { (detPerJob[d.ID_Pekerjaan] = detPerJob[d.ID_Pekerjaan] || []).push(d); });
  baca_(SHEET.PEKERJAAN).forEach(function (r) {
    ev.push({ k: kunciWaktu_(r.Tanggal, r.Waktu_Mulai), t: 'JOB_MULAI', r: r });
    if (r.Status === STATUS_PEKERJAAN.SELESAI) {
      /* pekerjaan bisa lewat tengah malam: pakai tanggal selesai sungguhan supaya JOB_SELESAI tidak terurut sebelum JOB_MULAI */
      var tglSelesai = r.Tanggal;
      try { var ts = tglStr_(new Date(r.Waktu_Selesai)); if (ts > String(r.Tanggal || '')) tglSelesai = ts; } catch (e) {}
      ev.push({ k: kunciWaktu_(tglSelesai, r.Waktu_Selesai), t: 'JOB_SELESAI', r: r });
    }
  });
  /* v9: daur ulang scrap */
  var detDaur = {};
  baca_(SHEET.DAUR_DETAIL).forEach(function (d) { (detDaur[d.ID_Daur] = detDaur[d.ID_Daur] || []).push(d); });
  baca_(SHEET.DAUR).forEach(function (r) {
    if (r.Status === STATUS_DAUR.DIBATALKAN) return;
    ev.push({ k: kunciWaktu_(r.Tanggal, r.Waktu_Kirim), t: 'DAUR_KIRIM', r: r });
    if (r.Status === STATUS_DAUR.SELESAI && r.Waktu_Terima) {
      var tglT = r.Tanggal_Terima || r.Tanggal;
      try { var tt = tglStr_(new Date(r.Waktu_Terima)); if (!r.Tanggal_Terima && tt > String(r.Tanggal || '')) tglT = tt; } catch (e2) {}
      if (String(tglT) < String(r.Tanggal || '')) tglT = r.Tanggal;
      ev.push({ k: kunciWaktu_(tglT, r.Waktu_Terima), t: 'DAUR_TERIMA', r: r });
    }
  });
  baca_(SHEET.OPNAME).forEach(function (r) { ev.push({ k: kunciWaktu_(r.Tanggal, r.Waktu), t: 'OPNAME', r: r }); });
  baca_(SHEET.KERUSAKAN).forEach(function (r) {
    if (r.Status === STATUS_TRANSFER.DISETUJUI) ev.push({ k: kunciWaktu_(r.Tanggal, r.Waktu), t: 'RUSAK', r: r });
  });
  if (batasK) ev = ev.filter(function (e) { return e.k <= batasK; });
  ev.sort(function (a, b) {
    if (a.k !== b.k) return a.k < b.k ? -1 : 1;
    /* satu pekerjaan / batch daur ulang yang mulai & selesai di milidetik yang sama: MULAI / KIRIM tetap lebih dulu */
    if (a.r === b.r && a.t !== b.t) return (a.t === 'JOB_MULAI' || a.t === 'DAUR_KIRIM') ? -1 : 1;
    return (PRIORITAS_EV_[a.t] || 0) - (PRIORITAS_EV_[b.t] || 0);
  });

  var biaya = {}, hargaJob = {}, hppJob = {}, nilaiDaur = {};
  ev.forEach(function (e) {
    var r = e.r, q;
    switch (e.t) {
      case 'MASUK':      tambahLap(r.Kode_Item, angka_(r.Qty_Kg), e.harga || hargaCadangan(r.Kode_Item), r.ID); break;
      case 'RETUR':      biaya[r.ID] = ambil(r.Kode_Item, angka_(r.Qty_Kg), r.ID_Penerimaan_Asal || null).nilai; break;
      case 'JUAL':       biaya[r.ID] = ambil(r.Kode_Item, angka_(r.Qty_Kg)).nilai; break;
      case 'RETUR_CUST': tambahLap(r.Kode_Item, angka_(r.Qty_Kg), hargaCadangan(r.Kode_Item), r.ID); break;
      case 'RUSAK':      biaya[r.ID] = ambil(r.Kode_Item, angka_(r.Qty_Kg)).nilai; break;
      case 'OPNAME':
        var d = angka_(r.Selisih);
        if (d > 0) tambahLap(r.Kode_Item, d, hargaCadangan(r.Kode_Item), r.ID);
        else if (d < 0) biaya[r.ID] = ambil(r.Kode_Item, -d).nilai;
        break;
      case 'JOB_MULAI':
        var tot = 0, hj = {};
        (detPerJob[r.ID] || []).forEach(function (d) {
          if (d.Jenis !== JENIS_DETAIL.BAHAN_BAKU) return;
          q = angka_(d.Qty_Kg); var h = ambil(d.Kode_Item, q);
          tot += h.nilai; hj[d.Kode_Item] = q > 0 ? h.nilai / q : 0;
        });
        biaya[r.ID] = tot; hargaJob[r.ID] = hj; hppJob[r.ID] = tot;
        break;
      case 'JOB_SELESAI':
        var jadi = 0; (detPerJob[r.ID] || []).forEach(function (d) { if (d.Jenis === JENIS_DETAIL.BARANG_JADI) jadi += angka_(d.Qty_Kg); });
        var hppTotal = (hppJob[r.ID] || 0) + angka_(r.Total_Bahan_Baku_Kg) * biayaProsesPerKg_();
        var hpk = jadi > 0 ? hppTotal / jadi : 0;
        (detPerJob[r.ID] || []).forEach(function (d) {
          if (d.Jenis === JENIS_DETAIL.BARANG_JADI) tambahLap(d.Kode_Item, angka_(d.Qty_Kg), hpk, r.ID);
          if (d.Jenis === JENIS_DETAIL.SCRAP)       tambahLap(d.Kode_Item, angka_(d.Qty_Kg), 0, r.ID);   // scrap dinilai 0 — nilainya muncul lagi lewat daur ulang (jasa)
        });
        break;
      case 'DAUR_KIRIM':
        var ns = 0;
        (detDaur[r.ID] || []).forEach(function (d) { if (d.Jenis === JENIS_DAUR_DETAIL.SCRAP) ns += ambil(d.Kode_Item, angka_(d.Qty_Kg)).nilai; });
        nilaiDaur[r.ID] = ns; biaya[r.ID] = ns;
        break;
      case 'DAUR_TERIMA':
        var hasilKg = 0; (detDaur[r.ID] || []).forEach(function (d) { if (d.Jenis === JENIS_DAUR_DETAIL.HASIL) hasilKg += angka_(d.Qty_Kg); });
        var hargaHasil = hasilKg > 0 ? ((nilaiDaur[r.ID] || 0) + angka_(r.Biaya_Jasa)) / hasilKg : 0;
        (detDaur[r.ID] || []).forEach(function (d) { if (d.Jenis === JENIS_DAUR_DETAIL.HASIL) tambahLap(d.Kode_Item, angka_(d.Qty_Kg), hargaHasil, r.ID); });
        break;
    }
  });
  return { lapisan: L, biaya: biaya, hargaJob: hargaJob, nilaiDaur: nilaiDaur };
}

/** Harga rata-rata FIFO untuk qty yang akan dipakai SEKARANG dari gudang (dari hasil hitungFifo_ yang sudah ada). */
function hargaDariFifo_(fifo, kode, qty, peta) {
  var arr = fifo.lapisan[kode] || [];
  var sisa = qty, nilai = 0;
  for (var i = 0; i < arr.length && sisa > 0; i++) { var a = Math.min(arr[i].qty, sisa); nilai += a * arr[i].harga; sisa -= a; }
  if (sisa > 0) {
    var q = 0, n = 0;
    arr.forEach(function (y) { q += y.qty; n += y.qty * y.harga; });
    nilai += sisa * (q > 0 ? n / q : (peta[kode] ? peta[kode].harga : 0));
  }
  var h = qty > 0 ? nilai / qty : 0;
  return h > 0 ? h : (peta[kode] ? peta[kode].harga : 0);
}

/** Harga FIFO barang yang keluar dari gudang sekarang (untuk HPP penjualan). */
function hargaKeluarGbjFifo_(fifo, kode, qty, peta) {
  var arr = fifo.lapisan[kode] || [];
  var sisa = qty, nilai = 0;
  for (var i = 0; i < arr.length && sisa > 0; i++) { var a = Math.min(arr[i].qty, sisa); nilai += a * arr[i].harga; sisa -= a; }
  if (sisa > 0) nilai += sisa * (peta[kode] ? peta[kode].harga : 0);
  return qty > 0 ? bulat_(nilai / qty, 2) : 0;
}

/** Laporan nilai stok FIFO per item (manager). v9: satu lokasi. */
function laporanNilaiStok(ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehLihatHpp_(u)) throw new Error('Hanya Manager / Admin.');
  var peta = petaItem_(), L = hitungFifo_().lapisan;
  var daftar = [], tot = { qty: 0, nilai: 0 };
  Object.keys(L).forEach(function (k) {
    var arr = L[k], q = 0, n = 0; arr.forEach(function (x) { q += x.qty; n += x.qty * x.harga; });
    if (q <= 0.0001) return;
    daftar.push({ kode: k, nama: peta[k] ? peta[k].nama : k, kategori: peta[k] ? peta[k].kategori : '',
                  qty: bulat_(q, 2), total: bulat_(q, 2), nilai: bulat_(n, 0), rata: bulat_(n / q, 0),
                  lapisan: arr.map(function (x) { return { qty: bulat_(x.qty, 2), harga: bulat_(x.harga, 0), asal: x.asal }; }) });
    tot.qty += q; tot.nilai += n;
  });
  daftar.sort(function (a, b) { return b.nilai - a.nilai; });
  tot.qty = bulat_(tot.qty, 2); tot.nilai = bulat_(tot.nilai, 0);
  return { metode: metodeHpp_(), daftar: daftar, total: tot };
}

/** Hitung ulang HPP semua pekerjaan dari mesin FIFO (setelah harga diperbarui lewat invoice). Manager. */
function hitungUlangHpp(ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehPo_(u)) throw new Error('Hanya Manager / Admin.');
  if (metodeHpp_() !== 'FIFO') throw new Error('METODE_HPP bukan FIFO.');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();   // di dalam lock: baca ulang dari sheet, jangan pakai memo sebelum lock
  try {
    var f = hitungFifo_(), detail = baca_(SHEET.DETAIL), jobs = baca_(SHEET.PEKERJAAN), diubah = 0;
    var peta = petaItem_();
    jobs.forEach(function (r) {
      if (f.biaya[r.ID] === undefined) return;
      var hppBahan = bulat_(f.biaya[r.ID], 0);
      var hj = f.hargaJob[r.ID] || {};
      detail.forEach(function (d) {
        if (d.ID_Pekerjaan !== r.ID || d.Jenis !== JENIS_DETAIL.BAHAN_BAKU) return;
        var h = hj[d.Kode_Item]; if (h === undefined) return;
        ubahBaris_(SHEET.DETAIL, d._baris, { Harga_Per_Kg: bulat_(h, 2), Nilai: bulat_(h * angka_(d.Qty_Kg), 0) });
      });
      if (Math.abs(hppBahan - angka_(r.HPP_Bahan)) < 1) return;
      var hppProses = angka_(r.HPP_Proses), hppTotal = hppBahan + hppProses;
      var ubah = { HPP_Bahan: hppBahan, HPP_Total: bulat_(hppTotal, 0) };
      var jadi = angka_(r.Total_Barang_Jadi_Kg), masuk = angka_(r.Total_Bahan_Baku_Kg);
      if (r.Status === STATUS_PEKERJAAN.SELESAI && jadi > 0) {
        ubah.HPP_Per_Kg = bulat_(hppTotal / jadi, 0);
        ubah.Nilai_Susut = bulat_(angka_(r.Susut_Kg) * (masuk > 0 ? hppBahan / masuk : 0), 0);
      }
      ubahBaris_(SHEET.PEKERJAAN, r._baris, ubah); diubah++;
    });
    /* v9: HPP biji plastik daur ulang ikut dihitung ulang (nilai scrap dari FIFO + biaya jasa) */
    var daurDiubah = 0;
    baca_(SHEET.DAUR).forEach(function (r) {
      if (r.Status !== STATUS_DAUR.SELESAI || f.nilaiDaur[r.ID] === undefined) return;
      var ns = bulat_(f.nilaiDaur[r.ID], 0), hasil = angka_(r.Total_Hasil_Kg);
      var hppT = ns + angka_(r.Biaya_Jasa), hpk = hasil > 0 ? bulat_(hppT / hasil, 0) : 0;
      if (Math.abs(ns - angka_(r.Nilai_Scrap)) < 1 && Math.abs(hpk - angka_(r.HPP_Per_Kg)) < 1) return;
      ubahBaris_(SHEET.DAUR, r._baris, { Nilai_Scrap: ns, HPP_Total: bulat_(hppT, 0), HPP_Per_Kg: hpk });
      baca_(SHEET.DAUR_DETAIL).forEach(function (d) { if (d.ID_Daur === r.ID && d.Jenis === JENIS_DAUR_DETAIL.HASIL) ubahBaris_(SHEET.DAUR_DETAIL, d._baris, { Harga_Per_Kg: hpk, Nilai: bulat_(hpk * angka_(d.Qty_Kg), 0) }); });
      daurDiubah++;
    });
    catatLog_('HPP_HITUNG_ULANG', '', diubah + ' pekerjaan, ' + daurDiubah + ' daur ulang diperbarui');
    return { ok: true, diubah: diubah, daurDiubah: daurDiubah };
  } finally { lock.releaseLock(); }
}

/* =================================================================
   BARANG RUSAK — staf mencatat, manager menyetujui
   ================================================================= */

/** p = { kode, qty, penyebab, tanggal, foto, catatan, ident } — HANYA STAF. (v9: lokasi selalu GBJ) */
function simpanKerusakan(p) {
  var u = penggunaSaatIni_(p && p.ident);
  if (bolehReview_(u)) throw new Error('Laporan barang rusak harus dicatat oleh STAF gudang (bukan manager).');
  if (!p || !p.kode) throw new Error('Item belum dipilih.');
  var lok = LOKASI.GBJ;
  var q = angka_(p.qty); if (q <= 0) throw new Error('Qty harus > 0.');
  if (!String(p.penyebab || '').trim()) throw new Error('Penyebab kerusakan wajib diisi.');
  var it = petaItem_()[p.kode]; if (!it) throw new Error('Item tidak dikenal: ' + p.kode);
  var foto = p.foto ? unggahFoto_(p.foto, 'RUSAK') : { url: '', id: '' };
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();   // di dalam lock: baca ulang dari sheet, jangan pakai memo sebelum lock
  try {
    var id = buatId_('DMG');
    tambah_(SHEET.KERUSAKAN, {
      ID: id, Waktu: new Date(), Tanggal: tglValid_(p.tanggal), Lokasi: lok,
      Kode_Item: it.kode, Nama_Item: it.nama, Qty_Kg: q, Penyebab: p.penyebab,
      Foto_URL: foto.url, Foto_ID: foto.id, Dicatat_Oleh: penandaPencatat_(u), Nama_Pencatat: u.nama,
      Status: STATUS_TRANSFER.MENUNGGU, Ditinjau_Oleh: '', Waktu_Tinjau: '', Catatan_Tinjau: '',
      Nilai_Kerugian: '', Catatan: p.catatan || '', Log_Edit: ''
    });
    catatLog_('RUSAK_LAPOR', id, it.nama + ' ' + q + ' kg @' + lok + ' — ' + p.penyebab);
    return { ok: true, id: id, item: it.nama, qty: q };
  } finally { lock.releaseLock(); }
}

function ringkasKerusakan_(r, lihatNilai) {
  var o = { id: r.ID, waktu: jam_(r.Waktu), tanggal: r.Tanggal, lokasi: r.Lokasi, kode: r.Kode_Item, item: r.Nama_Item,
            qty: angka_(r.Qty_Kg), penyebab: r.Penyebab, foto: r.Foto_URL, fotoId: r.Foto_ID, pencatat: r.Nama_Pencatat,
            status: r.Status, ditinjau: r.Ditinjau_Oleh || '', catatanTinjau: r.Catatan_Tinjau || '', catatan: r.Catatan || '' };
  if (lihatNilai) o.nilaiKerugian = angka_(r.Nilai_Kerugian);
  return o;
}

/** status: MENUNGGU (default) | DISETUJUI | DIBATALKAN | SEMUA. Staf hanya melihat laporannya sendiri. */
function daftarKerusakan(ident, status, hari) {
  var u = penggunaSaatIni_(ident);
  var spv = bolehReview_(u);
  var batas = new Date(); batas.setDate(batas.getDate() - (hari || 30));
  status = status || STATUS_TRANSFER.MENUNGGU;
  return baca_(SHEET.KERUSAKAN).filter(function (r) {
    if (!spv && r.Dicatat_Oleh !== penandaPencatat_(u)) return false;
    if (status !== 'SEMUA' && r.Status !== status) return false;
    return new Date(r.Waktu) >= batas;
  }).map(function (r) { return ringkasKerusakan_(r, spv); }).reverse().slice(0, 100);
}

/** aksi: 'setuju' (stok berkurang, nilai kerugian FIFO dihitung) | 'batal' */
function tinjauKerusakan(id, aksi, catatan, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehReview_(u)) throw new Error('Hanya Supervisor / Admin yang bisa meninjau laporan rusak.');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();   // di dalam lock: baca ulang dari sheet, jangan pakai memo sebelum lock
  try {
    var r = cariEntri_(SHEET.KERUSAKAN, id);
    if (r.Status !== STATUS_TRANSFER.MENUNGGU) throw new Error('Laporan sudah ' + r.Status + '.');
    var status = aksi === 'setuju' ? STATUS_TRANSFER.DISETUJUI : STATUS_TRANSFER.DIBATALKAN;
    ubahBaris_(SHEET.KERUSAKAN, r._baris, { Status: status, Ditinjau_Oleh: u.nama, Waktu_Tinjau: new Date(),
      Catatan_Tinjau: [r.Catatan_Tinjau, catatan].filter(String).join(' | ') });
    var nilai = 0;
    if (status === STATUS_TRANSFER.DISETUJUI) {
      nilai = bulat_(hitungFifo_().biaya[id] || 0, 0);
      ubahBaris_(SHEET.KERUSAKAN, r._baris, { Nilai_Kerugian: nilai });
    }
    catatLog_(aksi === 'setuju' ? 'RUSAK_SETUJU' : 'RUSAK_BATAL', id, r.Nama_Item + ' ' + angka_(r.Qty_Kg) + ' kg' + (nilai ? ' • rugi ' + nilai : ''));
    return { ok: true, status: status, nilaiKerugian: nilai };
  } finally { lock.releaseLock(); }
}

/* =================================================================
   STANDAR SUSUT PER PRODUK — dari data aktual
   ================================================================= */

/** Statistik susut per produk (pekerjaan SELESAI, N hari terakhir) vs standar sekarang. */
function laporanStandarSusut(hari, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehReview_(u)) throw new Error('Hanya Supervisor / Admin.');
  var batas = new Date(); batas.setDate(batas.getDate() - (hari || 90));
  var std = {}; baca_(SHEET.STANDAR).forEach(function (r) { std[r.Kode_Produk] = { normal: angka_(r.Susut_Normal_Persen), toleransi: angka_(r.Toleransi_Persen), baris: r._baris }; });
  var per = {};
  baca_(SHEET.PEKERJAAN).forEach(function (r) {
    if (r.Status !== STATUS_PEKERJAAN.SELESAI || new Date(r.Waktu_Selesai) < batas) return;
    var k = r.Kode_Produk;
    if (!per[k]) per[k] = { kode: k, nama: r.Nama_Produk, jobs: 0, masuk: 0, jadi: 0, scrap: 0, susut: 0, persen: [], tinggi: 0 };
    var s = per[k]; s.jobs++;
    s.masuk += angka_(r.Total_Bahan_Baku_Kg); s.jadi += angka_(r.Total_Barang_Jadi_Kg); s.scrap += angka_(r.Total_Scrap_Kg); s.susut += angka_(r.Susut_Kg);
    s.persen.push(angka_(r.Susut_Persen)); if (r.Status_Susut && r.Status_Susut !== 'NORMAL') s.tinggi++;
  });
  return { hari: hari || 90, daftar: Object.keys(per).map(function (k) {
    var s = per[k], p = s.persen.slice().sort(function (a, b) { return a - b; });
    var rata = p.reduce(function (a, b) { return a + b; }, 0) / p.length;
    var varian = p.reduce(function (a, b) { return a + (b - rata) * (b - rata); }, 0) / p.length;
    var sd = Math.sqrt(varian);
    var median = p.length % 2 ? p[(p.length - 1) / 2] : (p[p.length / 2 - 1] + p[p.length / 2]) / 2;
    var st = std[k] || { normal: DEFAULT_SUSUT_NORMAL_PERSEN, toleransi: DEFAULT_TOLERANSI_PERSEN };
    return { kode: k, nama: s.nama, jobs: s.jobs, masuk: bulat_(s.masuk, 1), jadi: bulat_(s.jadi, 1), scrap: bulat_(s.scrap, 1),
             susutKg: bulat_(s.susut, 1), rataTertimbang: s.masuk > 0 ? bulat_(s.susut / s.masuk * 100, 2) : 0,
             rata: bulat_(rata, 2), median: bulat_(median, 2), min: bulat_(p[0], 2), maks: bulat_(p[p.length - 1], 2), sd: bulat_(sd, 2),
             tinggi: s.tinggi, standarNormal: st.normal, standarToleransi: st.toleransi, adaStandar: !!std[k],
             saranNormal: bulat_(rata, 1), saranToleransi: bulat_(Math.max(0.5, sd), 1) };
  }).sort(function (a, b) { return b.jobs - a.jobs; }) };
}

/** Manager: tulis standar susut untuk satu produk ke Master_Standar_Susut. */
function terapkanStandarSusut(kode, normal, toleransi, catatan, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehReview_(u)) throw new Error('Hanya Supervisor / Admin.');
  var n = angka_(normal), t = angka_(toleransi);
  if (n < 0 || n > 100 || t < 0 || t > 100) throw new Error('Persen tidak masuk akal.');
  var it = petaItem_()[kode]; if (!it) throw new Error('Produk tidak dikenal: ' + kode);
  var rows = baca_(SHEET.STANDAR), ada = null;
  rows.forEach(function (r) { if (r.Kode_Produk === kode) ada = r; });
  var ket = catatan || ('dari data aktual, ' + u.nama + ' ' + tglStr_(new Date()));
  if (ada) ubahBaris_(SHEET.STANDAR, ada._baris, { Nama_Produk: it.nama, Susut_Normal_Persen: n, Toleransi_Persen: t, Catatan: ket });
  else tambah_(SHEET.STANDAR, { Kode_Produk: kode, Nama_Produk: it.nama, Susut_Normal_Persen: n, Toleransi_Persen: t, Catatan: ket });
  catatLog_('STANDAR_SUSUT', kode, n + '% ± ' + t + '%');
  return { ok: true, kode: kode, normal: n, toleransi: t };
}

/* ================= PREDIKSI KAPAN PERLU BELI (manager) ================= */
function leadTimeHari_() { var n = parseInt(getSetting_('LEAD_TIME_HARI'), 10); return isNaN(n) || n < 0 ? 7 : n; }
/**
 * Per bahan baku: pemakaian rata-rata per hari (dari bahan yang masuk ke pekerjaan, N hari terakhir),
 * stok sekarang, sisa hari sampai habis, PO yang masih terbuka, dan saran beli.
 * status: PERLU_BELI (habis sebelum lead time & belum ada PO cukup) | PO_JALAN | AMAN | TIDAK_DIPAKAI
 */
function prediksiBeli(ident, hari) {
  var u = penggunaSaatIni_(ident);
  if (!bolehReview_(u)) throw new Error('Hanya Supervisor / Admin.');
  hari = hari || 30;
  var lead = leadTimeHari_(), buffer = 14;
  var batas = new Date(); batas.setDate(batas.getDate() - hari);
  var peta = petaItem_(), stok = hitungStokSemua_();
  var pakai = {}, jobBaru = {};
  baca_(SHEET.PEKERJAAN).forEach(function (r) { if (new Date(r.Waktu_Mulai) >= batas) jobBaru[r.ID] = true; });
  baca_(SHEET.DETAIL).forEach(function (d) {
    if (d.Jenis !== JENIS_DETAIL.BAHAN_BAKU || !jobBaru[d.ID_Pekerjaan]) return;
    pakai[d.Kode_Item] = (pakai[d.Kode_Item] || 0) + angka_(d.Qty_Kg);
  });
  var poSisa = {}, poEta = {};
  baca_(SHEET.PO).forEach(function (r) {
    if (r.Status !== STATUS_PO.TERBUKA && r.Status !== STATUS_PO.SEBAGIAN) return;
    var sisa = Math.max(0, angka_(r.Qty_Kg) - angka_(r.Qty_Diterima_Kg));
    poSisa[r.Kode_Item] = (poSisa[r.Kode_Item] || 0) + sisa;
    if (r.Perkiraan_Datang && (!poEta[r.Kode_Item] || String(r.Perkiraan_Datang) < poEta[r.Kode_Item])) poEta[r.Kode_Item] = String(r.Perkiraan_Datang);
  });
  var out = [];
  Object.keys(peta).forEach(function (k) {
    var it = peta[k];
    if (it.kategori !== KATEGORI_ITEM.BAHAN_BAKU && it.kategori !== KATEGORI_ITEM.KEDUANYA) return;
    if (String(it.aktif || 'YA').toUpperCase() === 'TIDAK') return;
    var st = stok[k] || { gbj: 0 }, total = st.gbj;
    var rata = (pakai[k] || 0) / hari;
    var sisaHari = rata > 0 ? total / rata : null;
    var sisaPo = poSisa[k] || 0;
    var kebutuhan = rata * (lead + buffer);
    var saran = Math.max(0, kebutuhan - total - sisaPo);
    var status = rata <= 0 ? 'TIDAK_DIPAKAI'
               : (sisaHari <= lead && sisaPo <= 0) ? 'PERLU_BELI'
               : (sisaHari <= lead && sisaPo > 0) ? 'PO_JALAN'
               : 'AMAN';
    out.push({ kode: k, nama: it.nama, stok: bulat_(total, 2),
               rataHari: bulat_(rata, 2), sisaHari: sisaHari === null ? null : bulat_(sisaHari, 1),
               poSisa: bulat_(sisaPo, 2), poEta: poEta[k] || '', saranBeli: bulat_(saran, 0),
               leadTime: lead, status: status });
  });
  out.sort(function (a, b) {
    var ua = a.sisaHari === null ? 1e9 : a.sisaHari, ub = b.sisaHari === null ? 1e9 : b.sisaHari; return ua - ub;
  });
  return out;
}

/* ================= DIAGNOSA KECEPATAN (admin) ================= */
/** Mengukur berapa lama tiap langkah getKonteks di server — untuk mencari bagian yang lambat. */
function diagnosa(ident) {
  var t0 = Date.now(), hasil = [], sebelum = t0;
  function catat(label) { var kini = Date.now(); hasil.push([label, kini - sebelum]); sebelum = kini; }
  var u = penggunaSaatIni_(ident);
  if (!bolehReview_(u)) throw new Error('Hanya Supervisor / Admin.');
  catat('penggunaSaatIni_');
  lupakanMemo_();
  Object.keys(SHEET).forEach(function (k) { var n = baca_(SHEET[k]).length; catat('baca ' + SHEET[k] + ' (' + n + ' baris)'); });
  hitungStokSemua_(); catat('hitungStokSemua_ (memo)');
  lupakanMemo_(); hitungStokSemua_(); catat('hitungStokSemua_ (dingin)');
  lupakanMemo_(); getKonteks(ident); catat('getKonteks (dingin)');
  getKonteks(ident); catat('getKonteks (memo)');
  return { totalMs: Date.now() - t0, langkah: hasil };
}

/* ==== Penjualan.gs ==== */
/*************************************************************************
 * IPC — Inventory & Production Control (v9)
 * File 5 : Penjualan.gs
 *
 * Modul v8: sales order (pesanan customer), ekspor keuangan bulanan (CSV),
 * backup otomatis harian.
 *************************************************************************/

/* =================================================================
   SALES ORDER — manager membuat, gudang mengirim sesuai SO
   Harga jual HANYA untuk Manager / Direktur / Admin (bolehLihatHpp_).
   ================================================================= */

function nomorSoBaru_() {
  var awalan = 'SO-' + Utilities.formatDate(new Date(), APP.zona, 'yyMMdd') + '-';
  var n = 0;
  baca_(SHEET.SO).forEach(function (r) {
    if (String(r.No_SO).indexOf(awalan) === 0) { var k = parseInt(String(r.No_SO).slice(awalan.length), 10); if (k > n) n = k; }
  });
  return awalan + String(n + 1).padStart(2, '0');
}

/** p = { customer, tanggal, tanggalKirim, baris:[{kode, qty, harga}], catatan } */
function simpanSo(p, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehPo_(u)) throw new Error('Hanya Manager / Admin yang bisa membuat sales order.');
  if (!p || !String(p.customer || '').trim()) throw new Error('Customer belum dipilih.');
  if (!p.baris || !p.baris.length) throw new Error('Item SO belum diisi.');
  var kirim = String(p.tanggalKirim || '').trim();
  if (kirim && !/^\d{4}-\d{2}-\d{2}$/.test(kirim)) throw new Error('Format tanggal kirim harus YYYY-MM-DD.');
  var peta = petaItem_();
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();
  try {
    var now = new Date(), tanggal = tglValid_(p.tanggal);
    var noSo = nomorSoBaru_(), ids = [], total = 0, nilai = 0;
    p.baris.forEach(function (b) {
      var it = peta[b.kode]; if (!it) throw new Error('Item tidak dikenal: ' + b.kode);
      var q = angka_(b.qty), h = angka_(b.harga);
      if (q <= 0) throw new Error('Qty harus > 0 (' + it.nama + ')');
      if (h < 0) throw new Error('Harga jual tidak boleh negatif (' + it.nama + ')');
      var id = buatId_('SO'); ids.push(id); total += q; nilai += q * h;
      tambah_(SHEET.SO, {
        ID: id, No_SO: noSo, Waktu: now, Tanggal: tanggal, Customer: p.customer,
        Kode_Item: it.kode, Nama_Item: it.nama, Qty_Kg: q, Harga_Per_Kg: h,
        Tanggal_Kirim: kirim, Qty_Dikirim_Kg: 0, Status: STATUS_SO.TERBUKA,
        Dibuat_Oleh: penandaPencatat_(u), Nama_Pembuat: u.nama, Catatan: p.catatan || '', Log_Edit: ''
      });
    });
    catatLog_('SO_BUAT', noSo, p.customer + ' • ' + ids.length + ' item • ' + bulat_(total, 2) + ' kg • ' + mataUang_() + ' ' + bulat_(nilai, 0));
    return { ok: true, noSo: noSo, ids: ids, totalKg: bulat_(total, 2), nilai: bulat_(nilai, 0) };
  } finally { lock.releaseLock(); }
}

function ubahSo(id, perubahan, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehPo_(u)) throw new Error('Hanya Manager / Admin yang bisa mengubah SO.');
  perubahan = perubahan || {};
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();
  try {
    var r = cariEntri_(SHEET.SO, id);
    if (r.Status === STATUS_SO.DIBATALKAN) throw new Error('SO sudah dibatalkan.');
    var ubah = {}, log = [];
    if (perubahan.qty !== undefined) {
      var q = angka_(perubahan.qty);
      if (q <= 0) throw new Error('Qty harus > 0.');
      if (q < angka_(r.Qty_Dikirim_Kg)) throw new Error('Qty tidak boleh lebih kecil dari yang sudah dikirim (' + angka_(r.Qty_Dikirim_Kg) + ' kg).');
      if (q !== angka_(r.Qty_Kg)) { ubah.Qty_Kg = q; log.push('qty: ' + angka_(r.Qty_Kg) + ' → ' + q); }
    }
    if (perubahan.harga !== undefined) {
      var h = angka_(perubahan.harga);
      if (h < 0) throw new Error('Harga tidak boleh negatif.');
      if (h !== angka_(r.Harga_Per_Kg)) { ubah.Harga_Per_Kg = h; log.push('harga: ' + angka_(r.Harga_Per_Kg) + ' → ' + h); }
    }
    if (perubahan.tanggalKirim !== undefined && String(perubahan.tanggalKirim) !== String(r.Tanggal_Kirim || '')) { ubah.Tanggal_Kirim = perubahan.tanggalKirim; log.push('tanggal kirim: ' + (r.Tanggal_Kirim || '—') + ' → ' + (perubahan.tanggalKirim || '—')); }
    if (perubahan.catatan !== undefined && String(perubahan.catatan) !== String(r.Catatan || '')) { ubah.Catatan = perubahan.catatan; log.push('catatan diubah'); }
    if (!log.length) return { ok: true, berubah: false };
    var stempel = Utilities.formatDate(new Date(), APP.zona, 'dd/MM HH:mm') + ' ' + u.nama + ': ' + log.join('; ');
    ubah.Log_Edit = [r.Log_Edit, stempel].filter(String).join('\n');
    ubahBaris_(SHEET.SO, r._baris, ubah);
    if (ubah.Qty_Kg !== undefined) sinkronSo_(id);
    catatLog_('SO_UBAH', id, log.join('; '));
    return { ok: true, berubah: true, log: log };
  } finally { lock.releaseLock(); }
}

function batalkanSo(id, alasan, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehPo_(u)) throw new Error('Hanya Manager / Admin yang bisa membatalkan SO.');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();
  try {
    var r = cariEntri_(SHEET.SO, id);
    if (r.Status === STATUS_SO.DIBATALKAN) throw new Error('SO sudah dibatalkan.');
    if (angka_(r.Qty_Dikirim_Kg) > 0) throw new Error('Sudah ada pengiriman untuk baris SO ini — kurangi qty saja, jangan batalkan.');
    var stempel = Utilities.formatDate(new Date(), APP.zona, 'dd/MM HH:mm') + ' ' + u.nama + ': dibatalkan' + (alasan ? ' — ' + alasan : '');
    ubahBaris_(SHEET.SO, r._baris, { Status: STATUS_SO.DIBATALKAN, Log_Edit: [r.Log_Edit, stempel].filter(String).join('\n') });
    catatLog_('SO_BATAL', id, alasan || '');
    return { ok: true };
  } finally { lock.releaseLock(); }
}

/** Hitung ulang Qty_Dikirim & status satu baris SO dari Pengiriman KELUAR yang merujuknya. */
function sinkronSo_(idSo) {
  var r = null, rows = baca_(SHEET.SO);
  for (var i = 0; i < rows.length; i++) if (rows[i].ID === idSo) r = rows[i];
  if (!r) return;
  var dikirim = 0;
  baca_(SHEET.PENGIRIMAN).forEach(function (p) {
    if (p.ID_SO === idSo && p.Jenis === JENIS_PENGIRIMAN.KELUAR && dihitung_(p)) dikirim += angka_(p.Qty_Kg);
  });
  var status = r.Status === STATUS_SO.DIBATALKAN ? STATUS_SO.DIBATALKAN
             : dikirim <= 0 ? STATUS_SO.TERBUKA
             : dikirim + 0.0001 >= angka_(r.Qty_Kg) ? STATUS_SO.SELESAI : STATUS_SO.SEBAGIAN;
  ubahBaris_(SHEET.SO, r._baris, { Qty_Dikirim_Kg: bulat_(dikirim, 3), Status: status });
}

function ringkasSo_(r, lihatHarga) {
  var o = {
    id: r.ID, noSo: r.No_SO, tanggal: r.Tanggal, customer: r.Customer,
    kode: r.Kode_Item, item: r.Nama_Item, qty: angka_(r.Qty_Kg), dikirim: angka_(r.Qty_Dikirim_Kg),
    sisa: bulat_(Math.max(0, angka_(r.Qty_Kg) - angka_(r.Qty_Dikirim_Kg)), 3),
    tanggalKirim: r.Tanggal_Kirim || '', status: r.Status, pembuat: r.Nama_Pembuat, catatan: r.Catatan || '', logEdit: r.Log_Edit || ''
  };
  if (lihatHarga) { o.harga = angka_(r.Harga_Per_Kg); o.nilai = bulat_(o.qty * o.harga, 0); }
  return o;
}

/** status: '' = terbuka (TERBUKA/SEBAGIAN) | 'SEMUA' | status tertentu. Harga hanya untuk yang boleh lihat HPP. */
function daftarSo(ident, status, hari) {
  var u = penggunaSaatIni_(ident);
  var lihatHarga = bolehLihatHpp_(u);
  var batas = new Date(); batas.setDate(batas.getDate() - (hari || 90));
  return baca_(SHEET.SO).filter(function (r) {
    if (status === 'SEMUA') return new Date(r.Waktu) >= batas;
    if (!status) return r.Status === STATUS_SO.TERBUKA || r.Status === STATUS_SO.SEBAGIAN;
    return r.Status === status && new Date(r.Waktu) >= batas;
  }).map(function (r) { return ringkasSo_(r, lihatHarga); }).reverse();
}

/** Untuk form pengiriman (staf): baris SO yang masih harus dikirim, TANPA harga. */
function soTerbuka(ident) {
  penggunaSaatIni_(ident);
  return baca_(SHEET.SO).filter(function (r) {
    return r.Status === STATUS_SO.TERBUKA || r.Status === STATUS_SO.SEBAGIAN;
  }).map(function (r) { return ringkasSo_(r, false); })
    .sort(function (a, b) { return String(a.tanggalKirim || '9999').localeCompare(String(b.tanggalKirim || '9999')); });
}

/** Beranda: SO yang jatuh tempo hari ini atau sudah lewat (tanpa harga). */
function soKirimHariIni_(hariIni) {
  return baca_(SHEET.SO).filter(function (r) {
    return (r.Status === STATUS_SO.TERBUKA || r.Status === STATUS_SO.SEBAGIAN) && r.Tanggal_Kirim && String(r.Tanggal_Kirim) <= hariIni;
  }).map(function (r) {
    var o = ringkasSo_(r, false);
    return { id: o.id, noSo: o.noSo, customer: o.customer, item: o.item, kode: o.kode, sisa: o.sisa, kirim: o.tanggalKirim };
  }).sort(function (a, b) { return String(a.kirim).localeCompare(String(b.kirim)); });
}

/** kg per item yang sudah dipesan customer tapi belum dikirim (stok "dicadangkan"). */
function soDipesan_() {
  var m = {};
  baca_(SHEET.SO).forEach(function (r) {
    if (r.Status !== STATUS_SO.TERBUKA && r.Status !== STATUS_SO.SEBAGIAN) return;
    m[r.Kode_Item] = (m[r.Kode_Item] || 0) + Math.max(0, angka_(r.Qty_Kg) - angka_(r.Qty_Dikirim_Kg));
  });
  return m;
}

/* =================================================================
   EKSPOR KEUANGAN BULANAN (CSV) — Manager / Direktur / Admin
   ================================================================= */

function csvBaris_(arr) {
  return arr.map(function (v) {
    if (v === null || v === undefined) return '';
    var s = String(v);
    if (/[";\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  }).join(';');
}
function csv_(header, rows) {
  return '﻿' + [csvBaris_(header)].concat(rows.map(csvBaris_)).join('\r\n');
}
function dalamBulan_(tanggal, bulan) { return String(tanggal || '').slice(0, 7) === bulan; }
function akhirBulan_(bulan) {
  var y = parseInt(bulan.slice(0, 4), 10), m = parseInt(bulan.slice(5, 7), 10);
  var d = new Date(y, m, 0);
  return bulan + '-' + String(d.getDate()).padStart(2, '0');
}

/**
 * bulan = 'YYYY-MM'. Mengembalikan beberapa file CSV (pemisah ; supaya Excel Indonesia langsung membuka):
 * pembelian, penjualan, produksi (HPP), rusak, daur_ulang (v9), nilai_stok (posisi akhir bulan, FIFO), ringkasan.
 */
function eksporBulanan(bulan, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehLihatHpp_(u)) throw new Error('Ekspor keuangan hanya untuk Manager / Direktur / Admin.');
  if (!/^\d{4}-\d{2}$/.test(String(bulan || ''))) throw new Error('Format bulan harus YYYY-MM.');
  var peta = petaItem_(), cur = mataUang_();
  var poById = {}; baca_(SHEET.PO).forEach(function (r) { poById[r.ID] = r; });
  var soById = {}; baca_(SHEET.SO).forEach(function (r) { soById[r.ID] = r; });
  var invByPo = {}; baca_(SHEET.INVOICE).forEach(function (r) { if (r.Status === STATUS_INVOICE.VALID) invByPo[r.No_PO] = r.No_Invoice; });
  var tot = { beliKg: 0, beliRp: 0, returKg: 0, returRp: 0, jualKg: 0, jualRp: 0, hppJualRp: 0, hppJualSoRp: 0, jualTanpaSoKg: 0, returCustKg: 0,
              jobs: 0, hppBahan: 0, hppProses: 0, susutKg: 0, susutRp: 0, rusakKg: 0, rusakRp: 0 };

  /* --- pembelian: penerimaan & retur ke supplier --- */
  var beli = [];
  baca_(SHEET.PENERIMAAN).forEach(function (r) {
    if (!dalamBulan_(r.Tanggal, bulan) || !dihitung_(r)) return;
    var retur = r.Jenis === JENIS_PENERIMAAN.RETUR;
    var harga = angka_(r.Harga_Per_Kg) || (peta[r.Kode_Item] ? peta[r.Kode_Item].harga : 0);
    var q = angka_(r.Qty_Kg), nilai = bulat_(q * harga, 0);
    var po = r.ID_PO ? poById[r.ID_PO] : null;
    beli.push([r.Tanggal, r.ID, retur ? 'RETUR' : 'MASUK', r.Supplier, po ? po.No_PO : '', po ? (invByPo[po.No_PO] || '') : '',
               r.No_Surat_Jalan, r.Kode_Item, r.Nama_Item, q, harga, retur ? -nilai : nilai, r.Status, r.Nama_Pencatat, r.Catatan_QC || '']);
    if (retur) { tot.returKg += q; tot.returRp += nilai; } else { tot.beliKg += q; tot.beliRp += nilai; }
  });

  /* --- penjualan: keluar & retur dari customer --- */
  var jual = [];
  baca_(SHEET.PENGIRIMAN).forEach(function (r) {
    if (!dalamBulan_(r.Tanggal, bulan) || !dihitung_(r)) return;
    var retur = r.Jenis === JENIS_PENGIRIMAN.RETUR_MASUK;
    var so = r.ID_SO ? soById[r.ID_SO] : null;
    var hargaJual = so ? angka_(so.Harga_Per_Kg) : '';
    var q = angka_(r.Qty_Kg), hpp = angka_(r.HPP_Per_Kg);
    var nilaiJual = hargaJual === '' ? '' : bulat_(q * hargaJual, 0);
    var nilaiHpp = bulat_(q * hpp, 0);
    jual.push([r.Tanggal, r.ID, retur ? 'RETUR_CUSTOMER' : 'KELUAR', r.Customer, so ? so.No_SO : '', r.No_Surat_Jalan,
               r.Kode_Item, r.Nama_Item, q, hargaJual, nilaiJual, hpp || '', retur ? '' : nilaiHpp,
               (nilaiJual === '' || retur) ? '' : bulat_(nilaiJual - nilaiHpp, 0), r.Status, r.Nama_Pencatat]);
    if (retur) tot.returCustKg += q;
    else {
      tot.jualKg += q; tot.hppJualRp += nilaiHpp;
      if (nilaiJual === '') tot.jualTanpaSoKg += q;
      else { tot.jualRp += nilaiJual; tot.hppJualSoRp += nilaiHpp; }
    }
  });

  /* --- produksi: pekerjaan selesai di bulan itu --- */
  var prod = [];
  baca_(SHEET.PEKERJAAN).forEach(function (r) {
    if (r.Status !== STATUS_PEKERJAAN.SELESAI || !r.Waktu_Selesai) return;
    var tglSelesai = tglStr_(new Date(r.Waktu_Selesai));
    if (!dalamBulan_(tglSelesai, bulan)) return;
    prod.push([tglSelesai, r.ID, r.Kode_Produk, r.Nama_Produk, angka_(r.Total_Bahan_Baku_Kg), angka_(r.Total_Barang_Jadi_Kg), angka_(r.Total_Scrap_Kg),
               angka_(r.Susut_Kg), angka_(r.Susut_Persen), r.Status_Susut, angka_(r.HPP_Bahan), angka_(r.HPP_Proses), angka_(r.HPP_Total), angka_(r.HPP_Per_Kg), angka_(r.Nilai_Susut), r.Nama_Operator]);
    tot.jobs++; tot.hppBahan += angka_(r.HPP_Bahan); tot.hppProses += angka_(r.HPP_Proses); tot.susutKg += angka_(r.Susut_Kg); tot.susutRp += angka_(r.Nilai_Susut);
  });

  /* --- barang rusak disetujui --- */
  var rusak = [];
  baca_(SHEET.KERUSAKAN).forEach(function (r) {
    if (r.Status !== STATUS_TRANSFER.DISETUJUI || !dalamBulan_(r.Tanggal, bulan)) return;
    rusak.push([r.Tanggal, r.ID, r.Lokasi, r.Kode_Item, r.Nama_Item, angka_(r.Qty_Kg), angka_(r.Nilai_Kerugian), r.Penyebab, r.Nama_Pencatat, r.Ditinjau_Oleh]);
    tot.rusakKg += angka_(r.Qty_Kg); tot.rusakRp += angka_(r.Nilai_Kerugian);
  });

  /* --- daur ulang scrap (v9): batch diterima di bulan itu --- */
  var daur = [], totDaur = { batch: 0, scrap: 0, hasil: 0, susut: 0, jasa: 0, nilaiScrap: 0 };
  baca_(SHEET.DAUR).forEach(function (r) {
    if (r.Status !== STATUS_DAUR.SELESAI || !r.Waktu_Terima) return;
    var tglT = r.Tanggal_Terima || tglStr_(new Date(r.Waktu_Terima));
    if (!dalamBulan_(tglT, bulan)) return;
    daur.push([r.Tanggal, tglT, r.ID, r.Vendor, r.No_Surat_Jalan, angka_(r.Total_Scrap_Kg), angka_(r.Total_Hasil_Kg), angka_(r.Susut_Kg), angka_(r.Susut_Persen), r.Status_Susut,
               angka_(r.Nilai_Scrap), angka_(r.Biaya_Jasa), angka_(r.HPP_Total), angka_(r.HPP_Per_Kg), r.Nama_Pencatat, r.Nama_Penerima]);
    totDaur.batch++; totDaur.scrap += angka_(r.Total_Scrap_Kg); totDaur.hasil += angka_(r.Total_Hasil_Kg); totDaur.susut += angka_(r.Susut_Kg);
    totDaur.jasa += angka_(r.Biaya_Jasa); totDaur.nilaiScrap += angka_(r.Nilai_Scrap);
  });

  /* --- nilai stok posisi akhir bulan (FIFO) — v9: satu lokasi --- */
  var L = hitungFifo_(akhirBulan_(bulan)).lapisan, stokRows = [], nilaiStok = 0;
  Object.keys(L).forEach(function (k) {
    var q = 0, n = 0; L[k].forEach(function (x) { q += x.qty; n += x.qty * x.harga; });
    if (q <= 0.0001) return;
    stokRows.push([k, peta[k] ? peta[k].nama : k, bulat_(q, 2), bulat_(n / q, 0), bulat_(n, 0), L[k].length]);
    nilaiStok += n;
  });

  var ringkasan = [
    ['Periode', bulan], ['Mata uang', cur],
    ['Pembelian (kg)', bulat_(tot.beliKg, 2)], ['Pembelian (nilai)', bulat_(tot.beliRp, 0)],
    ['Retur ke supplier (kg)', bulat_(tot.returKg, 2)], ['Retur ke supplier (nilai)', bulat_(tot.returRp, 0)],
    ['Penjualan (kg)', bulat_(tot.jualKg, 2)], ['Penjualan tanpa SO / tanpa harga (kg)', bulat_(tot.jualTanpaSoKg, 2)],
    ['Penjualan (nilai, dari harga SO)', bulat_(tot.jualRp, 0)],
    ['HPP barang terjual (semua pengiriman)', bulat_(tot.hppJualRp, 0)], ['HPP barang terjual (yang ada harga SO)', bulat_(tot.hppJualSoRp, 0)],
    ['Laba kotor (penjualan − HPP, hanya yang ada harga SO)', bulat_(tot.jualRp - tot.hppJualSoRp, 0)],
    ['Retur dari customer (kg)', bulat_(tot.returCustKg, 2)],
    ['Pekerjaan selesai', tot.jobs], ['HPP bahan (produksi)', bulat_(tot.hppBahan, 0)], ['HPP proses (produksi)', bulat_(tot.hppProses, 0)],
    ['Susut (kg)', bulat_(tot.susutKg, 2)], ['Susut (nilai)', bulat_(tot.susutRp, 0)],
    ['Barang rusak (kg)', bulat_(tot.rusakKg, 2)], ['Barang rusak (nilai)', bulat_(tot.rusakRp, 0)],
    ['Daur ulang scrap: batch selesai', totDaur.batch], ['Daur ulang: scrap dikirim (kg)', bulat_(totDaur.scrap, 2)],
    ['Daur ulang: biji plastik diterima (kg)', bulat_(totDaur.hasil, 2)], ['Daur ulang: susut chassen (kg)', bulat_(totDaur.susut, 2)],
    ['Daur ulang: biaya jasa chassen (nilai)', bulat_(totDaur.jasa, 0)],
    ['Nilai stok akhir bulan (FIFO)', bulat_(nilaiStok, 0)],
    ['Catatan', 'Nilai penjualan & laba hanya untuk pengiriman yang merujuk SO (ada harga jual); pengiriman tanpa SO tercantum di kolom kg-nya. HPP belum memuat overhead pabrik. PPN tidak dihitung.']
  ];

  catatLog_('EKSPOR', bulan, u.nama);
  return {
    bulan: bulan,
    files: [
      { nama: 'ringkasan_' + bulan + '.csv', csv: csv_(['Keterangan', 'Nilai'], ringkasan) },
      { nama: 'pembelian_' + bulan + '.csv', csv: csv_(['Tanggal', 'ID', 'Jenis', 'Supplier', 'No_PO', 'No_Invoice', 'No_Surat_Jalan', 'Kode_Item', 'Nama_Item', 'Qty_Kg', 'Harga_Per_Kg', 'Nilai', 'Status', 'Pencatat', 'Catatan_QC'], beli) },
      { nama: 'penjualan_' + bulan + '.csv', csv: csv_(['Tanggal', 'ID', 'Jenis', 'Customer', 'No_SO', 'No_Surat_Jalan', 'Kode_Item', 'Nama_Item', 'Qty_Kg', 'Harga_Jual_Per_Kg', 'Nilai_Jual', 'HPP_Per_Kg', 'Nilai_HPP', 'Laba_Kotor', 'Status', 'Pencatat'], jual) },
      { nama: 'produksi_' + bulan + '.csv', csv: csv_(['Tanggal_Selesai', 'ID', 'Kode_Produk', 'Nama_Produk', 'Bahan_Kg', 'Jadi_Kg', 'Scrap_Kg', 'Susut_Kg', 'Susut_Persen', 'Status_Susut', 'HPP_Bahan', 'HPP_Proses', 'HPP_Total', 'HPP_Per_Kg', 'Nilai_Susut', 'Operator'], prod) },
      { nama: 'rusak_' + bulan + '.csv', csv: csv_(['Tanggal', 'ID', 'Lokasi', 'Kode_Item', 'Nama_Item', 'Qty_Kg', 'Nilai_Kerugian', 'Penyebab', 'Pencatat', 'Disetujui_Oleh'], rusak) },
      { nama: 'daur_ulang_' + bulan + '.csv', csv: csv_(['Tanggal_Kirim', 'Tanggal_Terima', 'ID', 'Vendor_Chassen', 'No_Surat_Jalan', 'Scrap_Kg', 'Hasil_Kg', 'Susut_Kg', 'Susut_Persen', 'Status_Susut', 'Nilai_Scrap', 'Biaya_Jasa', 'HPP_Total', 'HPP_Per_Kg', 'Pengirim', 'Penerima'], daur) },
      { nama: 'nilai_stok_' + bulan + '.csv', csv: csv_(['Kode_Item', 'Nama_Item', 'Qty_Kg', 'Harga_Rata', 'Nilai', 'Jumlah_Batch'], stokRows) }
    ],
    ringkasan: ringkasan
  };
}

/* =================================================================
   BACKUP OTOMATIS — salinan Sheet tiap hari ke folder Drive "IPC Backup"
   Jalankan pasangBackupHarian() SEKALI dari editor Apps Script (butuh izin pemicu).
   ================================================================= */

var NAMA_FOLDER_BACKUP_ = 'IPC Backup';
var SIMPAN_BACKUP_ = 30;   // salinan terakhir yang disimpan

function folderBackup_() {
  var it = DriveApp.getFoldersByName(NAMA_FOLDER_BACKUP_);
  return it.hasNext() ? it.next() : DriveApp.createFolder(NAMA_FOLDER_BACKUP_);
}

/** Dipanggil pemicu waktu. Salin Sheet database → "IPC Backup yyyy-MM-dd", hapus yang lebih tua dari SIMPAN_BACKUP_ salinan. */
function backupHarian() {
  var ss = ss_(), folder = folderBackup_();
  var nama = 'IPC Backup ' + Utilities.formatDate(new Date(), APP.zona, 'yyyy-MM-dd HH.mm');
  DriveApp.getFileById(ss.getId()).makeCopy(nama, folder);
  var files = [], it = folder.getFiles();
  while (it.hasNext()) { var f = it.next(); if (f.getName().indexOf('IPC Backup ') === 0) files.push(f); }
  files.sort(function (a, b) { return a.getName() < b.getName() ? 1 : -1; });   // terbaru dulu
  for (var i = SIMPAN_BACKUP_; i < files.length; i++) files[i].setTrashed(true);
  try { catatLog_('BACKUP', nama, files.length + ' salinan'); } catch (e) {}
  return nama;
}

/** Pasang pemicu harian jam 02:00 (hapus pemicu lama supaya tidak dobel). Jalankan dari editor. */
function pasangBackupHarian() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'backupHarian') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('backupHarian').timeBased().everyDays(1).atHour(2).create();
  var pertama = backupHarian();
  return 'Backup harian terpasang (02:00). Salinan pertama: ' + pertama;
}

/** Info untuk menu Admin: apakah pemicu terpasang, salinan terakhir. */
function statusBackup(ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehReview_(u)) throw new Error('Hanya Supervisor / Admin.');
  var terpasang = false;
  try { terpasang = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'backupHarian'; }); } catch (e) {}
  var terakhir = '', jumlah = 0;
  try {
    var it = DriveApp.getFoldersByName(NAMA_FOLDER_BACKUP_);
    if (it.hasNext()) {
      var files = it.next().getFiles();
      while (files.hasNext()) { var f = files.next(); if (f.getName().indexOf('IPC Backup ') === 0) { jumlah++; if (f.getName() > terakhir) terakhir = f.getName(); } }
    }
  } catch (e) {}
  return { terpasang: terpasang, terakhir: terakhir, jumlah: jumlah, simpan: SIMPAN_BACKUP_ };
}

/* ==== DaurUlang.gs ==== */
/*************************************************************************
 * IPC — Inventory & Production Control (v9)
 * File 6 : DaurUlang.gs
 *
 * Modul v9: DAUR ULANG SCRAP → BIJI PLASTIK.
 * Pabrik tidak punya mesin chassen sendiri: scrap dikirim ke pabrik lain (vendor),
 * digiling/dichassen, kembali sebagai biji plastik daur ulang (bahan baku) dengan
 * susut + biaya jasa. Dua langkah seperti pekerjaan:
 *   1. mulaiDaurUlang     — scrap keluar gudang (status BERJALAN)
 *   2. selesaikanDaurUlang — biji plastik masuk gudang, susut & HPP dihitung (SELESAI)
 * HPP biji plastik daur ulang = (nilai FIFO scrap + biaya jasa) / kg hasil → masuk mesin FIFO.
 * Biaya jasa / nilai / HPP HANYA untuk Manager / Direktur / Admin (bolehLihatHpp_).
 *************************************************************************/

function standarChassen_() {
  var n = angka_(getSetting_('SUSUT_CHASSEN_PERSEN')), t = angka_(getSetting_('TOLERANSI_CHASSEN_PERSEN'));
  return { normal: getSetting_('SUSUT_CHASSEN_PERSEN') === '' ? DEFAULT_SUSUT_CHASSEN_PERSEN : n,
           toleransi: getSetting_('TOLERANSI_CHASSEN_PERSEN') === '' ? DEFAULT_TOLERANSI_CHASSEN_PERSEN : t };
}

function hitungSusutChassen_(scrapKg, hasilKg) {
  var susut = scrapKg - hasilKg;
  var persen = scrapKg > 0 ? (susut / scrapKg) * 100 : 0;
  var std = standarChassen_(), batas = std.normal + std.toleransi;
  var status = persen < 0 ? 'ANOMALI' : persen > batas ? 'TINGGI' : 'NORMAL';
  return { susut: bulat_(susut, 3), persen: bulat_(persen, 2), status: status, batas: bulat_(batas, 2), standar: bulat_(std.normal, 2) };
}

function cariDaur_(id) {
  var rows = baca_(SHEET.DAUR);
  for (var i = 0; i < rows.length; i++) if (rows[i].ID === id) return rows[i];
  throw new Error('Batch daur ulang tidak ditemukan: ' + id);
}

function detailDaur_(id, jenis, cache) {
  return (cache || baca_(SHEET.DAUR_DETAIL)).filter(function (d) { return d.ID_Daur === id && (!jenis || d.Jenis === jenis); })
    .map(function (d) { return { kode: d.Kode_Item, nama: d.Nama_Item, qty: angka_(d.Qty_Kg) }; });
}

/**
 * p = { vendor, tanggal, noSuratJalan, scrap:[{kode,qty}], catatan, foto, ident }
 * vendor = tempat mesin chassen (dari daftar supplier — bisa ditambah dari form).
 */
function mulaiDaurUlang(p) {
  var u = penggunaSaatIni_(p && p.ident);
  if (!p || !String(p.vendor || '').trim()) throw new Error('Tempat chassen (vendor) belum dipilih.');
  if (!p.scrap || !p.scrap.length) throw new Error('Scrap yang dikirim belum diisi.');
  var peta = petaItem_();
  var foto = p.foto ? unggahFoto_(p.foto, 'DAUR-KIRIM') : { url: '', id: '' };
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();
  try {
    var now = new Date(), tanggal = tglValid_(p.tanggal);
    var id = buatId_('DUR'), total = 0;
    p.scrap.forEach(function (b) {
      var it = peta[b.kode]; if (!it) throw new Error('Item tidak dikenal: ' + b.kode);
      if (it.kategori !== KATEGORI_ITEM.SCRAP) throw new Error(it.nama + ' bukan scrap — hanya SKU scrap yang bisa dikirim ke chassen.');
      var q = angka_(b.qty); if (q <= 0) throw new Error('Qty harus > 0 (' + it.nama + ')');
      total += q;
      tambah_(SHEET.DAUR_DETAIL, { ID: buatId_('DDT'), ID_Daur: id, Jenis: JENIS_DAUR_DETAIL.SCRAP,
        Kode_Item: it.kode, Nama_Item: it.nama, Qty_Kg: q, Harga_Per_Kg: '', Nilai: '', Waktu: now });
    });
    tambah_(SHEET.DAUR, {
      ID: id, Waktu_Kirim: now, Waktu_Terima: '', Tanggal: tanggal, Tanggal_Terima: '',
      Vendor: String(p.vendor).trim(), No_Surat_Jalan: p.noSuratJalan || '',
      Total_Scrap_Kg: bulat_(total, 3), Total_Hasil_Kg: '', Susut_Kg: '', Susut_Persen: '', Status_Susut: '',
      Nilai_Scrap: '', Biaya_Jasa: '', HPP_Total: '', HPP_Per_Kg: '', Status: STATUS_DAUR.BERJALAN,
      Dicatat_Oleh: penandaPencatat_(u), Nama_Pencatat: u.nama, Diterima_Oleh: '', Nama_Penerima: '',
      Foto_Kirim_URL: foto.url, Foto_Terima_URL: '', Catatan: p.catatan || '', Log_Edit: ''
    });
    catatLog_('DAUR_KIRIM', id, p.vendor + ' • ' + bulat_(total, 2) + ' kg scrap');
    return { ok: true, id: id, vendor: p.vendor, totalKg: bulat_(total, 2) };
  } finally { lock.releaseLock(); }
}

/**
 * p = { id, hasil:[{kode,qty}], tanggalTerima, biayaJasa (hanya manager), catatan, foto, ident }
 * hasil = biji plastik daur ulang (SKU bahan baku — bisa ditambah dari form).
 */
function selesaikanDaurUlang(p) {
  var u = penggunaSaatIni_(p && p.ident);
  if (!p || !p.id) throw new Error('ID batch kosong.');
  if (!p.hasil || !p.hasil.length) throw new Error('Biji plastik yang diterima belum diisi.');
  var peta = petaItem_();
  var foto = p.foto ? unggahFoto_(p.foto, 'DAUR-TERIMA') : { url: '', id: '' };
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();
  try {
    var r = cariDaur_(p.id);
    if (r.Status !== STATUS_DAUR.BERJALAN) throw new Error('Batch ini sudah ' + r.Status + '.');
    var now = new Date(), tglTerima = tglValid_(p.tanggalTerima);
    if (tglTerima < String(r.Tanggal)) throw new Error('Tanggal terima tidak boleh sebelum tanggal kirim (' + r.Tanggal + ').');
    var jasa = bolehLihatHpp_(u) ? angka_(p.biayaJasa) : 0;
    if (jasa < 0) throw new Error('Biaya jasa tidak boleh negatif.');
    var hasilKg = 0, baris = [];
    p.hasil.forEach(function (b) {
      var it = peta[b.kode]; if (!it) throw new Error('Item tidak dikenal: ' + b.kode);
      if (it.kategori !== KATEGORI_ITEM.BAHAN_BAKU && it.kategori !== KATEGORI_ITEM.KEDUANYA) throw new Error(it.nama + ' bukan bahan baku — hasil chassen harus dicatat sebagai bahan baku (biji plastik).');
      var q = angka_(b.qty); if (q <= 0) throw new Error('Qty harus > 0 (' + it.nama + ')');
      hasilKg += q; baris.push({ it: it, q: q });
    });
    var scrapKg = angka_(r.Total_Scrap_Kg);
    var h = hitungSusutChassen_(scrapKg, hasilKg);
    /* nilai scrap menurut FIFO (batch ini sudah tercatat sebagai DAUR_KIRIM) */
    var nilaiScrap = 0;
    if (metodeHpp_() === 'FIFO') { try { nilaiScrap = hitungFifo_().nilaiDaur[r.ID] || 0; } catch (e) { nilaiScrap = 0; } }
    var hppTotal = nilaiScrap + jasa, hppPerKg = hasilKg > 0 ? hppTotal / hasilKg : 0;
    baris.forEach(function (b) {
      tambah_(SHEET.DAUR_DETAIL, { ID: buatId_('DDT'), ID_Daur: r.ID, Jenis: JENIS_DAUR_DETAIL.HASIL,
        Kode_Item: b.it.kode, Nama_Item: b.it.nama, Qty_Kg: b.q, Harga_Per_Kg: bulat_(hppPerKg, 2), Nilai: bulat_(hppPerKg * b.q, 0), Waktu: now });
    });
    ubahBaris_(SHEET.DAUR, r._baris, {
      Waktu_Terima: now, Tanggal_Terima: tglTerima, Status: STATUS_DAUR.SELESAI,
      Total_Hasil_Kg: bulat_(hasilKg, 3), Susut_Kg: h.susut, Susut_Persen: h.persen, Status_Susut: h.status,
      Nilai_Scrap: bulat_(nilaiScrap, 0), Biaya_Jasa: bolehLihatHpp_(u) ? bulat_(jasa, 0) : '',
      HPP_Total: bulat_(hppTotal, 0), HPP_Per_Kg: bulat_(hppPerKg, 0),
      Diterima_Oleh: penandaPencatat_(u), Nama_Penerima: u.nama, Foto_Terima_URL: foto.url,
      Catatan: [r.Catatan, p.catatan].filter(String).join(' | ')
    });
    catatLog_('DAUR_TERIMA', r.ID, r.Vendor + ' • ' + bulat_(hasilKg, 2) + ' kg dari ' + bulat_(scrapKg, 2) + ' kg scrap • susut ' + h.persen + '% (' + h.status + ')');
    var out = { ok: true, id: r.ID, vendor: r.Vendor, scrap: bulat_(scrapKg, 2), hasil: bulat_(hasilKg, 2),
                susut: h.susut, persen: h.persen, status: h.status, batas: h.batas, standar: h.standar };
    if (bolehLihatHpp_(u)) out.hpp = { nilaiScrap: bulat_(nilaiScrap, 0), jasa: bulat_(jasa, 0), total: bulat_(hppTotal, 0), perKg: bulat_(hppPerKg, 0) };
    return out;
  } finally { lock.releaseLock(); }
}

function ringkasDaur_(r, lihatHarga, detCache) {
  var o = {
    id: r.ID, tanggal: r.Tanggal, tanggalTerima: r.Tanggal_Terima || '', kirim: jam_(r.Waktu_Kirim),
    terima: r.Waktu_Terima ? jam_(r.Waktu_Terima) : '', vendor: r.Vendor, noSuratJalan: r.No_Surat_Jalan || '',
    scrapKg: angka_(r.Total_Scrap_Kg), hasilKg: angka_(r.Total_Hasil_Kg), susut: angka_(r.Susut_Kg), persen: angka_(r.Susut_Persen),
    statusSusut: r.Status_Susut || '', status: r.Status, pencatat: r.Nama_Pencatat, penerima: r.Nama_Penerima || '',
    fotoKirim: r.Foto_Kirim_URL || '', fotoTerima: r.Foto_Terima_URL || '', catatan: r.Catatan || '',
    /* log edit: angka jasa disaring untuk staf */
    logEdit: lihatHarga ? (r.Log_Edit || '') : String(r.Log_Edit || '').split('\n').map(function (l) { return l.replace(/;?\s*jasa: [^;\n]*/g, '').replace(/:\s*$/, ': (biaya diubah)'); }).join('\n'),
    scrap: detailDaur_(r.ID, JENIS_DAUR_DETAIL.SCRAP, detCache), hasil: detailDaur_(r.ID, JENIS_DAUR_DETAIL.HASIL, detCache)
  };
  if (r.Status === STATUS_DAUR.BERJALAN) {
    var mulai = new Date(r.Waktu_Kirim);
    o.hariJalan = Math.max(0, Math.round((Date.now() - mulai.getTime()) / 86400000 * 10) / 10);
  }
  if (lihatHarga) o.hpp = { nilaiScrap: angka_(r.Nilai_Scrap), jasa: angka_(r.Biaya_Jasa), total: angka_(r.HPP_Total), perKg: angka_(r.HPP_Per_Kg), jasaKosong: r.Biaya_Jasa === '' };
  return o;
}

/** status: '' = BERJALAN | SELESAI | DIBATALKAN | SEMUA. Harga hanya untuk yang boleh lihat HPP. */
function daftarDaurUlang(ident, status, hari) {
  var u = penggunaSaatIni_(ident), lihat = bolehLihatHpp_(u);
  var batas = new Date(); batas.setDate(batas.getDate() - (hari || 90));
  var det = baca_(SHEET.DAUR_DETAIL);
  return baca_(SHEET.DAUR).filter(function (r) {
    if (!status) return r.Status === STATUS_DAUR.BERJALAN;
    if (status === 'SEMUA') return new Date(r.Waktu_Kirim) >= batas;
    return r.Status === status && new Date(r.Waktu_Kirim) >= batas;
  }).map(function (r) {
    var o = ringkasDaur_(r, lihat, det);
    o.bolehUbah = bolehReview_(u);
    o.bolehBatal = (bolehReview_(u) || (r.Status === STATUS_DAUR.BERJALAN && r.Dicatat_Oleh === penandaPencatat_(u))) && r.Status !== STATUS_DAUR.DIBATALKAN;
    o.batas = standarChassen_().normal + standarChassen_().toleransi;
    return o;
  }).reverse().slice(0, 100);
}

function ambilDaurUlang(id, ident) {
  var u = penggunaSaatIni_(ident);
  var r = cariDaur_(id);
  var o = ringkasDaur_(r, bolehLihatHpp_(u));
  o.bolehUbah = bolehReview_(u);
  o.bolehBatal = (bolehReview_(u) || (r.Status === STATUS_DAUR.BERJALAN && r.Dicatat_Oleh === penandaPencatat_(u))) && r.Status !== STATUS_DAUR.DIBATALKAN;
  o.batas = standarChassen_().normal + standarChassen_().toleransi;
  return o;
}

/** Manager: perubahan = { biayaJasa, vendor, noSuratJalan, catatan }. Biaya jasa diubah → HPP dihitung ulang. */
function ubahDaurUlang(id, perubahan, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehReview_(u)) throw new Error('Hanya Manager / Admin yang bisa mengubah batch daur ulang.');
  perubahan = perubahan || {};
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();
  try {
    var r = cariDaur_(id);
    if (r.Status === STATUS_DAUR.DIBATALKAN) throw new Error('Batch sudah dibatalkan.');
    var ubah = {}, log = [];
    if (perubahan.vendor !== undefined && String(perubahan.vendor).trim() && String(perubahan.vendor).trim() !== String(r.Vendor)) { ubah.Vendor = String(perubahan.vendor).trim(); log.push('vendor: ' + r.Vendor + ' → ' + ubah.Vendor); }
    if (perubahan.noSuratJalan !== undefined && String(perubahan.noSuratJalan) !== String(r.No_Surat_Jalan || '')) { ubah.No_Surat_Jalan = perubahan.noSuratJalan; log.push('surat jalan: ' + (r.No_Surat_Jalan || '—') + ' → ' + (perubahan.noSuratJalan || '—')); }
    if (perubahan.catatan !== undefined && String(perubahan.catatan) !== String(r.Catatan || '')) { ubah.Catatan = perubahan.catatan; log.push('catatan diubah'); }
    if (perubahan.biayaJasa !== undefined && perubahan.biayaJasa !== null && String(perubahan.biayaJasa) !== '') {
      var jasa = angka_(perubahan.biayaJasa); if (jasa < 0) throw new Error('Biaya jasa tidak boleh negatif.');
      if (jasa !== angka_(r.Biaya_Jasa) || r.Biaya_Jasa === '') {
        ubah.Biaya_Jasa = bulat_(jasa, 0); log.push('jasa: ' + (r.Biaya_Jasa === '' ? '—' : angka_(r.Biaya_Jasa)) + ' → ' + bulat_(jasa, 0));
        if (r.Status === STATUS_DAUR.SELESAI) {
          var hasil = angka_(r.Total_Hasil_Kg), hppT = angka_(r.Nilai_Scrap) + jasa, hpk = hasil > 0 ? hppT / hasil : 0;
          ubah.HPP_Total = bulat_(hppT, 0); ubah.HPP_Per_Kg = bulat_(hpk, 0);
          baca_(SHEET.DAUR_DETAIL).forEach(function (d) { if (d.ID_Daur === id && d.Jenis === JENIS_DAUR_DETAIL.HASIL) ubahBaris_(SHEET.DAUR_DETAIL, d._baris, { Harga_Per_Kg: bulat_(hpk, 2), Nilai: bulat_(hpk * angka_(d.Qty_Kg), 0) }); });
        }
      }
    }
    if (!log.length) return { ok: true, berubah: false };
    var stempel = Utilities.formatDate(new Date(), APP.zona, 'dd/MM HH:mm') + ' ' + u.nama + ': ' + log.join('; ');
    ubah.Log_Edit = [r.Log_Edit, stempel].filter(String).join('\n');
    ubahBaris_(SHEET.DAUR, r._baris, ubah);
    catatLog_('DAUR_UBAH', id, log.join('; '));
    return { ok: true, berubah: true, log: log, hppPerKg: ubah.HPP_Per_Kg };
  } finally { lock.releaseLock(); }
}

/** Batal: manager kapan saja; staf hanya batch sendiri yang masih BERJALAN. Stok scrap kembali (batch tidak dihitung). */
function batalkanDaurUlang(id, alasan, ident) {
  var u = penggunaSaatIni_(ident);
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();
  try {
    var r = cariDaur_(id);
    if (r.Status === STATUS_DAUR.DIBATALKAN) throw new Error('Batch sudah dibatalkan.');
    if (!bolehReview_(u)) {
      if (r.Dicatat_Oleh !== penandaPencatat_(u)) throw new Error('Hanya batch yang kamu catat sendiri yang bisa dibatalkan.');
      if (r.Status !== STATUS_DAUR.BERJALAN) throw new Error('Batch sudah selesai — minta manager untuk membatalkan.');
    }
    var stempel = Utilities.formatDate(new Date(), APP.zona, 'dd/MM HH:mm') + ' ' + u.nama + ': dibatalkan' + (alasan ? ' — ' + alasan : '');
    ubahBaris_(SHEET.DAUR, r._baris, { Status: STATUS_DAUR.DIBATALKAN, Log_Edit: [r.Log_Edit, stempel].filter(String).join('\n') });
    catatLog_('DAUR_BATAL', id, alasan || '');
    return { ok: true, status: STATUS_DAUR.DIBATALKAN };
  } finally { lock.releaseLock(); }
}

/** Laporan daur ulang N hari terakhir (batch SELESAI): total, per vendor, detail. Harga hanya untuk manager. */
function laporanDaurUlang(hari, ident) {
  var u = penggunaSaatIni_(ident), lihat = bolehLihatHpp_(u);
  hari = hari || 90;
  var batas = new Date(); batas.setDate(batas.getDate() - hari);
  var det = baca_(SHEET.DAUR_DETAIL);
  var rows = baca_(SHEET.DAUR).filter(function (r) { return r.Status === STATUS_DAUR.SELESAI && r.Waktu_Terima && new Date(r.Waktu_Terima) >= batas; });
  var berjalan = baca_(SHEET.DAUR).filter(function (r) { return r.Status === STATUS_DAUR.BERJALAN; });
  var tot = { batch: rows.length, scrap: 0, hasil: 0, susut: 0, tinggi: 0, jasa: 0, nilaiScrap: 0, hppTotal: 0, berjalan: berjalan.length,
              scrapBerjalan: berjalan.reduce(function (a, r) { return a + angka_(r.Total_Scrap_Kg); }, 0) };
  var perVendor = {};
  rows.forEach(function (r) {
    tot.scrap += angka_(r.Total_Scrap_Kg); tot.hasil += angka_(r.Total_Hasil_Kg); tot.susut += angka_(r.Susut_Kg);
    if (r.Status_Susut && r.Status_Susut !== 'NORMAL') tot.tinggi++;
    tot.jasa += angka_(r.Biaya_Jasa); tot.nilaiScrap += angka_(r.Nilai_Scrap); tot.hppTotal += angka_(r.HPP_Total);
    var v = r.Vendor || '(tanpa vendor)';
    if (!perVendor[v]) perVendor[v] = { vendor: v, batch: 0, scrap: 0, hasil: 0, susut: 0, jasa: 0, tinggi: 0 };
    var x = perVendor[v]; x.batch++; x.scrap += angka_(r.Total_Scrap_Kg); x.hasil += angka_(r.Total_Hasil_Kg); x.susut += angka_(r.Susut_Kg); x.jasa += angka_(r.Biaya_Jasa);
    if (r.Status_Susut && r.Status_Susut !== 'NORMAL') x.tinggi++;
  });
  var std = standarChassen_();
  var out = {
    hari: hari, standar: std.normal, toleransi: std.toleransi, batas: bulat_(std.normal + std.toleransi, 2),
    total: { batch: tot.batch, berjalan: tot.berjalan, scrapBerjalan: bulat_(tot.scrapBerjalan, 2), scrap: bulat_(tot.scrap, 2), hasil: bulat_(tot.hasil, 2), susut: bulat_(tot.susut, 2),
             persen: tot.scrap > 0 ? bulat_(tot.susut / tot.scrap * 100, 2) : 0, tinggi: tot.tinggi },
    perVendor: Object.keys(perVendor).map(function (k) {
      var x = perVendor[k]; var o = { vendor: x.vendor, batch: x.batch, scrap: bulat_(x.scrap, 2), hasil: bulat_(x.hasil, 2), susut: bulat_(x.susut, 2),
        persen: x.scrap > 0 ? bulat_(x.susut / x.scrap * 100, 2) : 0, tinggi: x.tinggi };
      if (lihat) { o.jasa = bulat_(x.jasa, 0); o.jasaPerKg = x.hasil > 0 ? bulat_(x.jasa / x.hasil, 0) : 0; }
      return o;
    }).sort(function (a, b) { return b.scrap - a.scrap; }),
    detail: rows.map(function (r) { return ringkasDaur_(r, lihat, det); }).reverse().slice(0, 100)
  };
  if (lihat) out.total.jasa = bulat_(tot.jasa, 0), out.total.nilaiScrap = bulat_(tot.nilaiScrap, 0), out.total.hppTotal = bulat_(tot.hppTotal, 0),
             out.total.hppPerKg = tot.hasil > 0 ? bulat_(tot.hppTotal / tot.hasil, 0) : 0;
  return out;
}

  return {
    fns: globalThis,
    atur: function (o) { if ('APP' in o) APP = o.APP; if ('SHEET' in o) SHEET = o.SHEET; if ('HEADER' in o) HEADER = o.HEADER; if ('JENIS_PENERIMAAN' in o) JENIS_PENERIMAAN = o.JENIS_PENERIMAAN; if ('JENIS_PENGIRIMAN' in o) JENIS_PENGIRIMAN = o.JENIS_PENGIRIMAN; if ('STATUS_TRANSFER' in o) STATUS_TRANSFER = o.STATUS_TRANSFER; if ('STATUS_PEKERJAAN' in o) STATUS_PEKERJAAN = o.STATUS_PEKERJAAN; if ('STATUS_DAUR' in o) STATUS_DAUR = o.STATUS_DAUR; if ('JENIS_DAUR_DETAIL' in o) JENIS_DAUR_DETAIL = o.JENIS_DAUR_DETAIL; if ('JENIS_PERMINTAAN' in o) JENIS_PERMINTAAN = o.JENIS_PERMINTAAN; if ('STATUS_PERMINTAAN' in o) STATUS_PERMINTAAN = o.STATUS_PERMINTAAN; if ('MAKS_MUNDUR_HARI' in o) MAKS_MUNDUR_HARI = o.MAKS_MUNDUR_HARI; if ('STATUS_PO' in o) STATUS_PO = o.STATUS_PO; if ('STATUS_INVOICE' in o) STATUS_INVOICE = o.STATUS_INVOICE; if ('STATUS_SO' in o) STATUS_SO = o.STATUS_SO; if ('JENIS_DETAIL' in o) JENIS_DETAIL = o.JENIS_DETAIL; if ('KATEGORI_ITEM' in o) KATEGORI_ITEM = o.KATEGORI_ITEM; if ('PREFIX_SCRAP' in o) PREFIX_SCRAP = o.PREFIX_SCRAP; if ('PERAN' in o) PERAN = o.PERAN; if ('LOKASI' in o) LOKASI = o.LOKASI; if ('DEFAULT_SUSUT_NORMAL_PERSEN' in o) DEFAULT_SUSUT_NORMAL_PERSEN = o.DEFAULT_SUSUT_NORMAL_PERSEN; if ('DEFAULT_TOLERANSI_PERSEN' in o) DEFAULT_TOLERANSI_PERSEN = o.DEFAULT_TOLERANSI_PERSEN; if ('DEFAULT_SUSUT_CHASSEN_PERSEN' in o) DEFAULT_SUSUT_CHASSEN_PERSEN = o.DEFAULT_SUSUT_CHASSEN_PERSEN; if ('DEFAULT_TOLERANSI_CHASSEN_PERSEN' in o) DEFAULT_TOLERANSI_CHASSEN_PERSEN = o.DEFAULT_TOLERANSI_CHASSEN_PERSEN; if ('DUMMY_ITEM' in o) DUMMY_ITEM = o.DUMMY_ITEM; if ('DUMMY_SUPPLIER' in o) DUMMY_SUPPLIER = o.DUMMY_SUPPLIER; if ('DUMMY_CUSTOMER' in o) DUMMY_CUSTOMER = o.DUMMY_CUSTOMER; if ('DUMMY_PENGGUNA' in o) DUMMY_PENGGUNA = o.DUMMY_PENGGUNA; if ('DUMMY_STANDAR' in o) DUMMY_STANDAR = o.DUMMY_STANDAR; if ('DEFAULT_SETTING' in o) DEFAULT_SETTING = o.DEFAULT_SETTING; if ('RPC_WL' in o) RPC_WL = o.RPC_WL; if ('KOLOM_TANGGAL_' in o) KOLOM_TANGGAL_ = o.KOLOM_TANGGAL_; if ('MEMO_BACA_' in o) MEMO_BACA_ = o.MEMO_BACA_; if ('BATCH_DICOBA_' in o) BATCH_DICOBA_ = o.BATCH_DICOBA_; if ('KOLOM_WAKTU_' in o) KOLOM_WAKTU_ = o.KOLOM_WAKTU_; if ('SERIAL_EPOCH_' in o) SERIAL_EPOCH_ = o.SERIAL_EPOCH_; if ('JENIS_RIWAYAT' in o) JENIS_RIWAYAT = o.JENIS_RIWAYAT; if ('PRIORITAS_EV_' in o) PRIORITAS_EV_ = o.PRIORITAS_EV_; if ('NAMA_FOLDER_BACKUP_' in o) NAMA_FOLDER_BACKUP_ = o.NAMA_FOLDER_BACKUP_; if ('SIMPAN_BACKUP_' in o) SIMPAN_BACKUP_ = o.SIMPAN_BACKUP_; },
    vars: function () { return { APP: APP, SHEET: SHEET, HEADER: HEADER, JENIS_PENERIMAAN: JENIS_PENERIMAAN, JENIS_PENGIRIMAN: JENIS_PENGIRIMAN, STATUS_TRANSFER: STATUS_TRANSFER, STATUS_PEKERJAAN: STATUS_PEKERJAAN, STATUS_DAUR: STATUS_DAUR, JENIS_DAUR_DETAIL: JENIS_DAUR_DETAIL, JENIS_PERMINTAAN: JENIS_PERMINTAAN, STATUS_PERMINTAAN: STATUS_PERMINTAAN, MAKS_MUNDUR_HARI: MAKS_MUNDUR_HARI, STATUS_PO: STATUS_PO, STATUS_INVOICE: STATUS_INVOICE, STATUS_SO: STATUS_SO, JENIS_DETAIL: JENIS_DETAIL, KATEGORI_ITEM: KATEGORI_ITEM, PREFIX_SCRAP: PREFIX_SCRAP, PERAN: PERAN, LOKASI: LOKASI, DEFAULT_SUSUT_NORMAL_PERSEN: DEFAULT_SUSUT_NORMAL_PERSEN, DEFAULT_TOLERANSI_PERSEN: DEFAULT_TOLERANSI_PERSEN, DEFAULT_SUSUT_CHASSEN_PERSEN: DEFAULT_SUSUT_CHASSEN_PERSEN, DEFAULT_TOLERANSI_CHASSEN_PERSEN: DEFAULT_TOLERANSI_CHASSEN_PERSEN, DUMMY_ITEM: DUMMY_ITEM, DUMMY_SUPPLIER: DUMMY_SUPPLIER, DUMMY_CUSTOMER: DUMMY_CUSTOMER, DUMMY_PENGGUNA: DUMMY_PENGGUNA, DUMMY_STANDAR: DUMMY_STANDAR, DEFAULT_SETTING: DEFAULT_SETTING, RPC_WL: RPC_WL, KOLOM_TANGGAL_: KOLOM_TANGGAL_, MEMO_BACA_: MEMO_BACA_, BATCH_DICOBA_: BATCH_DICOBA_, KOLOM_WAKTU_: KOLOM_WAKTU_, SERIAL_EPOCH_: SERIAL_EPOCH_, JENIS_RIWAYAT: JENIS_RIWAYAT, PRIORITAS_EV_: PRIORITAS_EV_, NAMA_FOLDER_BACKUP_: NAMA_FOLDER_BACKUP_, SIMPAN_BACKUP_: SIMPAN_BACKUP_ }; }
  };
}
