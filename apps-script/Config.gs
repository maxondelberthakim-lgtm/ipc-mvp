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
  versi: '6.0.0-mvp',
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
  'Status','Ditinjau_Oleh','Waktu_Tinjau','Catatan_Tinjau','Catatan','Log_Edit'
];

/* ④ Penjualan keluar (KELUAR) & retur dari customer (RETUR_MASUK) */
HEADER[SHEET.PENGIRIMAN] = [
  'ID','Waktu','Tanggal','Jenis','Customer','No_Surat_Jalan',
  'Kode_Item','Nama_Item','Qty_Kg',
  'Foto_URL','Foto_ID','Dicatat_Oleh','Nama_Pencatat',
  'Status','Ditinjau_Oleh','Waktu_Tinjau','Catatan_Tinjau','Catatan','Log_Edit'
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
  ['RM-CSW-W240','Kacang Mete Mentah W240',      KATEGORI_ITEM.BAHAN_BAKU , 185000, 0, 0, 'YA'],
  ['RM-CSW-W320','Kacang Mete Mentah W320',      KATEGORI_ITEM.BAHAN_BAKU , 170000, 0, 0, 'YA'],
  ['RM-CSW-LP'  ,'Kacang Mete Mentah LP (pecah)',KATEGORI_ITEM.BAHAN_BAKU , 120000, 0, 0, 'YA'],
  ['RM-PNT-JAVA','Kacang Tanah Java',            KATEGORI_ITEM.BAHAN_BAKU , 28000, 0, 0, 'YA'],
  ['RM-ALM-NP'  ,'Almond Non Pareil',            KATEGORI_ITEM.BAHAN_BAKU , 210000, 0, 0, 'YA'],
  ['RM-SI-SEED' ,'Sacha Inchi Seed',             KATEGORI_ITEM.BAHAN_BAKU , 95000, 0, 0, 'YA'],
  ['RM-MIN-GRG' ,'Minyak Goreng',                KATEGORI_ITEM.BAHAN_BAKU , 18500, 0, 0, 'YA'],
  ['RM-GRM-HLS' ,'Garam Halus',                  KATEGORI_ITEM.BAHAN_BAKU , 6000, 0, 0, 'YA'],
  ['RM-BMB-BBQ' ,'Bumbu Tabur BBQ',              KATEGORI_ITEM.BAHAN_BAKU , 45000, 0, 0, 'YA'],
  ['FG-MM-CSW'  ,'Max Mede Mete Panggang',       KATEGORI_ITEM.BARANG_JADI, '', 0, 0, 'YA'],
  ['FG-MM-ALM'  ,'Max Mede Almond Panggang',     KATEGORI_ITEM.BARANG_JADI, '', 0, 0, 'YA'],
  ['FG-JM-BBQ'  ,'Jomama Kacang Goreng BBQ',     KATEGORI_ITEM.BARANG_JADI, '', 0, 0, 'YA'],
  ['FG-JM-ASN'  ,'Jomama Kacang Goreng Asin',    KATEGORI_ITEM.BARANG_JADI, '', 0, 0, 'YA'],
  ['FG-SC-SI'   ,'Sachiko Sacha Inchi Oil',      KATEGORI_ITEM.BARANG_JADI, '', 0, 0, 'YA']
];

var DUMMY_SUPPLIER = [
  ['SUP-001','CV Mitra Mete Sulawesi','Mete gelondong & kupas','YA'],
  ['SUP-002','UD Tani Kacang Jaya',   'Kacang tanah lokal',    'YA'],
  ['SUP-003','PT Almond Import Nusantara','Almond & kacang impor','YA'],
  ['SUP-004','Koperasi Sacha Inchi Kalimantan','Sacha inchi seed','YA']
];

var DUMMY_CUSTOMER = [
  ['CUS-001','PT Ritel Nusantara',        'Modern trade — Jabodetabek','YA'],
  ['CUS-002','Toko Grosir Pasar Baru',    'Grosir curah',              'YA'],
  ['CUS-003','Distributor Bali Sejahtera','Distributor Bali & NTB',    'YA'],
  ['CUS-004','Ekspor — Singapore Trading','Ekspor curah',              'YA']
];

/* Pengguna contoh — GANTI PIN-nya. Kosongkan Email kalau pakai Gmail pribadi. */
var DUMMY_PENGGUNA = [
  ['', 'Pak Anto', PERAN.SUPERVISOR, 'GBJ', '1111', 'YA'],
  ['', 'Yanto',    PERAN.STAF,       'GBJ', '2222', 'YA'],
  ['', 'Sri',      PERAN.STAF,       'GP',  '3333', 'YA'],
  ['', 'Rina',     PERAN.STAF,       'GP',  '4444', 'YA']
];

var DUMMY_STANDAR = [
  ['FG-MM-CSW','Max Mede Mete Panggang',   4.0, 1.5, 'Susut panggang normal'],
  ['FG-MM-ALM','Max Mede Almond Panggang', 3.5, 1.5, ''],
  ['FG-JM-BBQ','Jomama Kacang Goreng BBQ', 6.0, 2.0, 'Susut goreng lebih tinggi'],
  ['FG-JM-ASN','Jomama Kacang Goreng Asin',6.0, 2.0, ''],
  ['FG-SC-SI' ,'Sachiko Sacha Inchi Oil',  2.0, 1.0, '']
];

var DEFAULT_SETTING = [
  ['FOLDER_FOTO_ID','', 'ID folder Drive tempat foto bukti disimpan (diisi otomatis)'],
  ['OCR_AKTIF','YA','Auto-baca surat jalan pembelian (butuh Advanced Drive Service)'],
  ['WAJIB_SJ_KELUAR','YA','Wajibkan no. surat jalan / DO saat barang keluar ke customer'],
  ['OCR_BAHASA','id','Bahasa OCR'],
  ['BAHASA_DEFAULT','id','Bahasa awal UI: id / en'],
  ['AKSES_TERBUKA','YA','YA = siapa pun yang punya link boleh pakai (MVP). TIDAK = hanya email di Master_Pengguna'],
  ['PERAN_DEFAULT','STAF','Peran untuk email yang belum terdaftar (kalau AKSES_TERBUKA = YA)'],
  ['PIN_SUPERVISOR','2468','PIN darurat supervisor (hanya untuk nama yang BELUM terdaftar). Lebih baik isi PIN per user di Master_Pengguna. GANTI PIN INI.'],
  ['BIAYA_PROSES_PER_KG','2500','Biaya proses (tenaga, listrik, gas, dll) per kg bahan baku masuk. Dipakai untuk HPP.'],
  ['MATA_UANG','Rp','Simbol mata uang di tampilan HPP']
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

function ambilAtauBuatFolder_() {
  var id = getSetting_('FOLDER_FOTO_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var it = DriveApp.getFoldersByName(APP.folderFoto);
  return it.hasNext() ? it.next() : DriveApp.createFolder(APP.folderFoto);
}
