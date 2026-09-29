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
  versi: '10.1.0',
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
  PENERIMAAN : 'Penerimaan',        // ⓪ pembelian masuk & retur ke supplier
  PENGIRIMAN : 'Pengiriman',        // ④ penjualan keluar & retur dari customer
  SHIFT      : 'Laporan_Shift',     // v10.1: satu laporan per shift (blowing + cutting, operator terpisah), diisi manager produksi
  SHIFT_DETAIL: 'Laporan_Shift_Detail',
  TUTUP      : 'Tutup_Bulan',       // v10: penutupan bulan — nilai stok awal/akhir, COGS, laba kotor, susut
  OPNAME_PROD: 'Opname_Produksi',   // v10.1: hitungan fisik produksi bulanan oleh manager (buta — target tidak ditampilkan)
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
  'Kode_Item','Nama_Item','Kategori','Harga_Per_Kg','Stok_Awal','Aktif',
  'Kualitas'   // v10: KW / SUPER / SUPER_PLUS — menghubungkan biji plastik ↔ roll ↔ polybag ↔ BS di laporan shift
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

/* v10.1: laporan shift. SATU baris per shift (2 shift × 12 jam), memuat dua mesin dengan operator terpisah.
   BLOWING : operator, biji plastik diambil dari gudang (AMBIL) → roll per kualitas (HASIL) + BS per kualitas (BS)
   CUTTING : operator, roll yang diambil/dipakai per kualitas (PAKAI_ROLL, diisi manual) → polybag per kualitas (HASIL) + BS (BS)
   Tidak ada hubungan otomatis antar mesin — roll boleh menumpuk dari shift sebelumnya. Rekonsiliasi di akhir bulan. */
HEADER[SHEET.SHIFT] = [
  'ID','Waktu','Tanggal','Shift','Operator_Blowing','Operator_Cutting',
  'Total_Ambil_Kg','Total_Roll_Kg','Total_BS_Blowing_Kg','Total_Roll_Pakai_Kg','Total_Polybag_Kg','Total_BS_Cutting_Kg',
  'Dicatat_Oleh','Nama_Pencatat','Foto_URL','Catatan','Log_Edit','Status'
];
HEADER[SHEET.SHIFT_DETAIL] = [
  'ID','ID_Shift','Mesin','Jenis','Kode_Item','Nama_Item','Kualitas','Qty_Kg','Waktu'
];
/* v10.1: opname produksi bulanan — manager menghitung fisik (polybag jadi, BS, biji plastik di area produksi, roll, isi mesin).
   Sistem hanya menampilkan jumlah hitungannya; angka pembanding (biji keluar gudang menurut neraca) hanya untuk ADMIN. */
HEADER[SHEET.OPNAME_PROD] = [
  'ID','Bulan','Waktu','Tanggal','Dicatat_Oleh','Nama_Pencatat',
  'Polybag_Kg','BS_Kg','Biji_Produksi_Kg','Roll_Kg','WIP_Mesin_Kg','Total_Hitung_Kg',
  'Detail_JSON','Catatan','Status'
];
/* v10: tutup bulan — snapshot untuk pelaporan (COGS periodik = awal + pembelian + jasa + proses − akhir) */
HEADER[SHEET.TUTUP] = [
  'ID','Bulan','Waktu','Ditutup_Oleh','Nama_Penutup',
  'Nilai_Stok_Awal','Pembelian','Retur_Supplier','Biaya_Jasa_Chassen','Biaya_Proses','Nilai_Stok_Akhir','COGS',
  'Penjualan','Laba_Kotor','Masuk_Produksi_Kg','Hasil_Jadi_Kg','BS_Kg','Roll_Perubahan_Kg','Susut_Kg','Susut_Persen',
  'Detail_JSON','Catatan','Status'
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
  'Spesifikasi','Perkiraan_Datang','Qty_Diterima_Kg','Status','Dibuat_Oleh','Nama_Pembuat','Catatan','Log_Edit',
  'TOP_Hari','Jatuh_Tempo'   // v10: termin pembayaran (hari) & tanggal jatuh tempo
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
  'Tanggal_Kirim','Qty_Dikirim_Kg','Status','Dibuat_Oleh','Nama_Pembuat','Catatan','Log_Edit',
  'TOP_Hari','Jatuh_Tempo'   // v10: termin pembayaran (hari) & tanggal jatuh tempo
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

var MESIN        = { BLOWING: 'BLOWING', CUTTING: 'CUTTING' };                       // v10
var JENIS_SHIFT  = { AMBIL: 'AMBIL', HASIL: 'HASIL', BS: 'BS', PAKAI_ROLL: 'PAKAI_ROLL' }; // v10: baris detail laporan shift (per mesin)
var STATUS_SHIFT = { AKTIF: 'AKTIF', DIBATALKAN: 'DIBATALKAN' };
var STATUS_TUTUP = { DITUTUP: 'DITUTUP', DIBUKA: 'DIBUKA' };
var DAFTAR_SHIFT = ['1', '2'];                                                        // v10.1: 2 shift × 12 jam
var JAM_SHIFT    = { '1': '08.00–20.00', '2': '20.00–08.00' };
var STATUS_OPNAME_PROD = { AKTIF: 'AKTIF', DIBATALKAN: 'DIBATALKAN' };
var STATUS_DAUR      = { BERJALAN: 'BERJALAN', SELESAI: 'SELESAI', DIBATALKAN: 'DIBATALKAN' };   // v9
var JENIS_DAUR_DETAIL = { SCRAP: 'SCRAP', HASIL: 'HASIL' };                                       // v9: scrap keluar / biji plastik masuk

var JENIS_PERMINTAAN  = { EDIT: 'EDIT', BATAL: 'BATAL' };
var STATUS_PERMINTAAN = { MENUNGGU: 'MENUNGGU', DISETUJUI: 'DISETUJUI', DITOLAK: 'DITOLAK' };
var MAKS_MUNDUR_HARI  = 60;   // tanggal transaksi boleh dimundurkan maksimal sekian hari

var STATUS_PO      = { TERBUKA: 'TERBUKA', SEBAGIAN: 'SEBAGIAN', SELESAI: 'SELESAI', DIBATALKAN: 'DIBATALKAN' };
var STATUS_INVOICE = { MENUNGGU: 'MENUNGGU', VALID: 'VALID', DITOLAK: 'DITOLAK' };
var STATUS_SO      = STATUS_PO;   // TERBUKA / SEBAGIAN / SELESAI / DIBATALKAN

var KATEGORI_ITEM = {
  BAHAN_BAKU  : 'BAHAN_BAKU',  // biji plastik, pigmen, antifoam — diambil mesin blowing
  ROLL        : 'ROLL',        // v10: hasil blowing (setengah jadi), dipakai mesin cutting
  BARANG_JADI : 'BARANG_JADI', // polybag hasil cutting — dijual
  KEDUANYA    : 'KEDUANYA',
  SCRAP       : 'SCRAP'        // BS dari blowing & cutting → dikirim ke chassen → jadi biji plastik daur ulang
};
var KUALITAS = { KW: 'KW', SUPER: 'SUPER', SUPER_PLUS: 'SUPER_PLUS' };   // v10: nilai kolom Master_Item.Kualitas
var NAMA_KUALITAS = { KW: 'KW', SUPER: 'Super', SUPER_PLUS: 'Super Plus' };

var PERAN = { STAF: 'STAF', SUPERVISOR: 'SUPERVISOR', ADMIN: 'ADMIN' };
var LOKASI = { GBJ: 'GBJ' };   // v9: satu gudang saja — pekerjaan berjalan di GBJ

var DEFAULT_SUSUT_CHASSEN_PERSEN     = 5.0;   // v9: susut normal scrap → biji plastik di mesin chassen
var DEFAULT_TOLERANSI_CHASSEN_PERSEN = 3.0;

/* ------------------------------------------------------------------ *
 * DUMMY DATA — ganti lewat sheet Master_Item / Master_Supplier
 * ------------------------------------------------------------------ */
var DUMMY_ITEM = [
  // [kode, nama, kategori, harga pokok/kg (Agustus 2026), stok awal, aktif, kualitas]
  // Bahan baku — diambil mesin blowing
  ['RM-BP-KW' ,'Biji Plastik KW',         KATEGORI_ITEM.BAHAN_BAKU , 13000, 0, 'YA', KUALITAS.KW],
  ['RM-BP-SUP','Biji Plastik Super',      KATEGORI_ITEM.BAHAN_BAKU , 15000, 0, 'YA', KUALITAS.SUPER],
  ['RM-BP-SPL','Biji Plastik Super Plus', KATEGORI_ITEM.BAHAN_BAKU , 15000, 0, 'YA', KUALITAS.SUPER_PLUS],
  ['RM-PG-KW' ,'Pigmen KW',               KATEGORI_ITEM.BAHAN_BAKU , 28000, 0, 'YA', ''],
  ['RM-PG-SPL','Pigmen Super Plus',       KATEGORI_ITEM.BAHAN_BAKU , 33300, 0, 'YA', ''],
  ['RM-AF'    ,'Antifoam',                KATEGORI_ITEM.BAHAN_BAKU , 13500, 0, 'YA', ''],
  ['RM-BP-DU' ,'Biji Plastik Daur Ulang', KATEGORI_ITEM.BAHAN_BAKU , '',    0, 'YA', ''],   // hasil chassen dari BS — harga dari biaya jasa
  // Roll (hasil blowing, setengah jadi) — dipakai mesin cutting
  ['WIP-ROLL-KW' ,'Roll KW',              KATEGORI_ITEM.ROLL       , '',    0, 'YA', KUALITAS.KW],
  ['WIP-ROLL-SUP','Roll Super',           KATEGORI_ITEM.ROLL       , '',    0, 'YA', KUALITAS.SUPER],
  ['WIP-ROLL-SPL','Roll Super Plus',      KATEGORI_ITEM.ROLL       , '',    0, 'YA', KUALITAS.SUPER_PLUS],
  // Barang jadi — polybag
  ['FG-PB-KW' ,'Polybag KW',              KATEGORI_ITEM.BARANG_JADI, '',    0, 'YA', KUALITAS.KW],
  ['FG-PB-SUP','Polybag Super',           KATEGORI_ITEM.BARANG_JADI, '',    0, 'YA', KUALITAS.SUPER],
  ['FG-PB-SPL','Polybag Super Plus',      KATEGORI_ITEM.BARANG_JADI, '',    0, 'YA', KUALITAS.SUPER_PLUS],
  // BS (scrap) dari blowing & cutting — dikirim ke chassen
  ['SCR-BS-KW' ,'BS KW',                  KATEGORI_ITEM.SCRAP      , '',    0, 'YA', KUALITAS.KW],
  ['SCR-BS-SUP','BS Super',               KATEGORI_ITEM.SCRAP      , '',    0, 'YA', KUALITAS.SUPER],
  ['SCR-BS-SPL','BS Super Plus',          KATEGORI_ITEM.SCRAP      , '',    0, 'YA', KUALITAS.SUPER_PLUS]
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
  ['', 'Admin',            PERAN.ADMIN,      'HQ',       '1234', 'YA'],
  ['', 'Direktur',         PERAN.ADMIN,      'HQ',       '2468', 'YA'],
  ['', 'Manager',          PERAN.SUPERVISOR, 'GBJ',      '1357', 'YA'],
  ['', 'Manager Produksi', PERAN.SUPERVISOR, 'Produksi', '1122', 'YA'],   // v10: mengisi laporan shift
  ['', 'Sales Manager',    PERAN.SUPERVISOR, 'Sales',    '3344', 'YA'],   // v10: SO & PO
  ['', 'Staff Gudang',     PERAN.STAF,       'GBJ',      '1111', 'YA']
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
  ['BIAYA_PROSES_PER_KG','2500','Biaya proses (tenaga, listrik, gas, dll) per kg biji plastik yang masuk produksi (blowing). Dipakai untuk HPP & COGS bulanan.'],
  ['MATA_UANG','Rp','Simbol mata uang di tampilan HPP'],
  ['METODE_HPP','RATA','v10: RATA = harga rata-rata tertimbang dari pembelian (bergerak). MASTER = harga tetap dari Master_Item.'],
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
  [SHEET.PENERIMAAN, SHEET.PENGIRIMAN, SHEET.SHIFT, SHEET.OPNAME, SHEET.PO, SHEET.KERUSAKAN, SHEET.DAUR, SHEET.OPNAME_PROD].forEach(function (n) {
    var sh = ss.getSheetByName(n);
    if (sh && sh.getLastRow() >= 2) throw new Error('Sudah ada transaksi di ' + n + '. Ubah SKU lewat menu Admin > SKU, jangan seed ulang.');
  });
  [[SHEET.ITEM, DUMMY_ITEM],
   [SHEET.SUPPLIER, DUMMY_SUPPLIER], [SHEET.CUSTOMER, DUMMY_CUSTOMER]].forEach(function (pair) {
    var sh = ss.getSheetByName(pair[0]);
    if (sh.getLastRow() >= 2) sh.deleteRows(2, sh.getLastRow() - 1);
    sh.getRange(2, 1, pair[1].length, pair[1][0].length).setValues(pair[1]);
  });
  lupakanMemo_();
  catatLog_('SEED_ULANG_MASTER', '', DUMMY_ITEM.length + ' item, ' + DUMMY_SUPPLIER.length + ' supplier, ' + DUMMY_CUSTOMER.length + ' customer');
}

/**
 * Reset untuk go-live: HAPUS SEMUA transaksi uji coba (penerimaan, pengiriman,
 * pekerjaan, detail, opname, PO, SO, daur ulang), lalu isi ulang master dari DUMMY_*. Log_Audit & pengguna tetap.
 * Jalankan manual dari editor SEKALI sebelum sistem dipakai sungguhan. Tidak bisa dipanggil dari app.
 */
function resetUntukGoLive() {
  lupakanMemo_();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  [SHEET.PENERIMAAN, SHEET.PENGIRIMAN, SHEET.SHIFT, SHEET.SHIFT_DETAIL, SHEET.OPNAME,
   SHEET.PERMINTAAN, SHEET.PO, SHEET.INVOICE, SHEET.KERUSAKAN, SHEET.SO, SHEET.DAUR, SHEET.DAUR_DETAIL, SHEET.TUTUP, SHEET.OPNAME_PROD].forEach(function (n) {
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
