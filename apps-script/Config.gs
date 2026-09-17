/**********************************************************************
 * IPC — Inventory & Production Control (MVP v6)
 * File 1 of 3 : Config.gs
 *
 * SEMUA SATUAN KILOGRAM. Nama sheet & kolom Bahasa Indonesia.
 * UI bisa switch EN / ID.
 *
 * Jalankan setupSistem() SEKALI setelah paste semua file.
 **********************************************************************/

var APP = {
  nama: 'IPC — Inventory & Production Control',
  versi: '7.0.0',
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
  TRANSFER   : 'Transfer',          // ① GBJ→GP  ③ GP→GBJ
  PEKERJAAN  : 'Pekerjaan',         // ②
  DETAIL     : 'Pekerjaan_Detail',
  OPNAME     : 'Stock_Opname',      // hitung fisik → penyesuaian stok
  PERMINTAAN : 'Permintaan_Ubah',   // usulan edit/batal dari staf → butuh persetujuan supervisor
  PO         : 'Pesanan_Pembelian', // PO dari manager: apa yang akan datang, qty, harga, spesifikasi
  INVOICE    : 'Invoice',           // invoice supplier per PO, divalidasi manager (dasar harga FIFO)
  KERUSAKAN  : 'Kerusakan',         // laporan barang rusak dari staf → disetujui manager → stok berkurang
  LOG        : 'Log_Audit',
  SETTING    : 'Pengaturan'
};

var HEADER = {};

HEADER[SHEET.ITEM] = [
  'Kode_Item','Nama_Item','Kategori','Harga_Per_Kg','Stok_Awal_GBJ','Stok_Awal_GP','Aktif'
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
  'HPP_Per_Kg'   // v7: harga pokok FIFO barang yang keluar (untuk margin)
];

/* ① ③ Transfer internal — TANPA surat jalan, cukup foto + timestamp */
HEADER[SHEET.TRANSFER] = [
  'ID','Waktu','Tanggal','Arah','Kode_Item','Nama_Item','Qty_Kg',
  'Foto_URL','Foto_ID','Dicatat_Oleh','Nama_Pencatat',
  'Status','Ditinjau_Oleh','Waktu_Tinjau','Catatan_Tinjau','Catatan','Log_Edit'
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

var ARAH = {
  KE_PRODUKSI : 'GBJ_KE_GP',
  KE_GUDANG   : 'GP_KE_GBJ'
};

var STATUS_TRANSFER = {
  MENUNGGU   : 'MENUNGGU',     // baru masuk, belum ditinjau
  DISETUJUI  : 'DISETUJUI',    // final
  DITANDAI   : 'DITANDAI',     // diarsipkan untuk direvisi nanti — TETAP dihitung di stok
  DIBATALKAN : 'DIBATALKAN'    // dibatalkan — TIDAK dihitung di stok
};

var STATUS_PEKERJAAN = { BERJALAN: 'BERJALAN', SELESAI: 'SELESAI' };

var JENIS_PERMINTAAN  = { EDIT: 'EDIT', BATAL: 'BATAL', EDIT_JOB: 'EDIT_JOB' };
var STATUS_PERMINTAAN = { MENUNGGU: 'MENUNGGU', DISETUJUI: 'DISETUJUI', DITOLAK: 'DITOLAK' };
var MAKS_MUNDUR_HARI  = 60;   // tanggal transaksi boleh dimundurkan maksimal sekian hari

var STATUS_PO      = { TERBUKA: 'TERBUKA', SEBAGIAN: 'SEBAGIAN', SELESAI: 'SELESAI', DIBATALKAN: 'DIBATALKAN' };
var STATUS_INVOICE = { MENUNGGU: 'MENUNGGU', VALID: 'VALID', DITOLAK: 'DITOLAK' };

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
var LOKASI = { GBJ: 'GBJ', GP: 'GP' };

var DEFAULT_SUSUT_NORMAL_PERSEN = 3.0;
var DEFAULT_TOLERANSI_PERSEN    = 1.5;

/* ------------------------------------------------------------------ *
 * DUMMY DATA — ganti lewat sheet Master_Item / Master_Supplier
 * ------------------------------------------------------------------ */
var DUMMY_ITEM = [
  // Bahan baku polybag (harga pokok per kg, Agustus 2026)
  ['RM-BP-KW' ,'Biji Plastik KW',         KATEGORI_ITEM.BAHAN_BAKU , 13000, 0, 0, 'YA'],
  ['RM-BP-SUP','Biji Plastik Super',      KATEGORI_ITEM.BAHAN_BAKU , 15000, 0, 0, 'YA'],
  ['RM-BP-SPL','Biji Plastik Super Plus', KATEGORI_ITEM.BAHAN_BAKU , 15000, 0, 0, 'YA'],
  ['RM-PG-KW' ,'Pigmen KW',               KATEGORI_ITEM.BAHAN_BAKU , 28000, 0, 0, 'YA'],
  ['RM-PG-SPL','Pigmen Super Plus',       KATEGORI_ITEM.BAHAN_BAKU , 33300, 0, 0, 'YA'],
  ['RM-AF'    ,'Antifoam',                KATEGORI_ITEM.BAHAN_BAKU , 13500, 0, 0, 'YA'],
  ['RM-BS-KW' ,'BS KW',                   KATEGORI_ITEM.BAHAN_BAKU , 13000, 0, 0, 'YA'],
  ['RM-BS-SUP','BS Super',                KATEGORI_ITEM.BAHAN_BAKU , 15000, 0, 0, 'YA'],
  ['RM-BS-SPL','BS Super Plus',           KATEGORI_ITEM.BAHAN_BAKU , 15000, 0, 0, 'YA'],
  // Barang jadi
  ['FG-PB-HP' ,'Polybag H Plast',         KATEGORI_ITEM.BARANG_JADI, '',    0, 0, 'YA']
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
  ['WAJIB_PO','TIDAK','YA = penerimaan barang harus merujuk PO. TIDAK = boleh tanpa PO (ditandai TANPA PO).']
];

/* ------------------------------------------------------------------ *
 * SETUP — jalankan sekali
 * ------------------------------------------------------------------ */
function setupSistem() {
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
  var sh = ss.getSheetByName(nama);
  if (sh.getLastRow() >= 2) return;
  if (!rows.length) return;
  sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

/**
 * Ganti isi Master_Item, Master_Supplier, Master_Customer & Master_Standar_Susut dengan daftar DUMMY_* di file ini.
 * Hanya boleh saat belum ada transaksi (aman untuk setup awal / ganti daftar SKU sebelum go-live).
 */
function seedUlangMaster() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  [SHEET.PENERIMAAN, SHEET.PENGIRIMAN, SHEET.TRANSFER, SHEET.PEKERJAAN, SHEET.OPNAME].forEach(function (n) {
    var sh = ss.getSheetByName(n);
    if (sh && sh.getLastRow() >= 2) throw new Error('Sudah ada transaksi di ' + n + '. Ubah SKU lewat menu Admin > SKU, jangan seed ulang.');
  });
  [[SHEET.ITEM, DUMMY_ITEM], [SHEET.STANDAR, DUMMY_STANDAR],
   [SHEET.SUPPLIER, DUMMY_SUPPLIER], [SHEET.CUSTOMER, DUMMY_CUSTOMER]].forEach(function (pair) {
    var sh = ss.getSheetByName(pair[0]);
    if (sh.getLastRow() >= 2) sh.deleteRows(2, sh.getLastRow() - 1);
    sh.getRange(2, 1, pair[1].length, pair[1][0].length).setValues(pair[1]);
  });
  catatLog_('SEED_ULANG_MASTER', '', DUMMY_ITEM.length + ' item, ' + DUMMY_SUPPLIER.length + ' supplier, ' + DUMMY_CUSTOMER.length + ' customer, ' + DUMMY_STANDAR.length + ' standar susut');
}

/**
 * Reset untuk go-live: HAPUS SEMUA transaksi uji coba (penerimaan, pengiriman, transfer,
 * pekerjaan, detail, opname), lalu isi ulang master dari DUMMY_*. Log_Audit & pengguna tetap.
 * Jalankan manual dari editor SEKALI sebelum sistem dipakai sungguhan. Tidak bisa dipanggil dari app.
 */
function resetUntukGoLive() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  [SHEET.PENERIMAAN, SHEET.PENGIRIMAN, SHEET.TRANSFER, SHEET.PEKERJAAN, SHEET.DETAIL, SHEET.OPNAME].forEach(function (n) {
    var sh = ss.getSheetByName(n);
    if (sh && sh.getLastRow() >= 2) sh.deleteRows(2, sh.getLastRow() - 1);
  });
  catatLog_('RESET_GO_LIVE', '', 'Semua transaksi uji coba dihapus');
  seedUlangMaster();
}

function ambilAtauBuatFolder_() {
  var id = getSetting_('FOLDER_FOTO_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var it = DriveApp.getFoldersByName(APP.folderFoto);
  return it.hasNext() ? it.next() : DriveApp.createFolder(APP.folderFoto);
}
