/* DIBUAT OTOMATIS oleh tools/build-cf.py — jangan diedit; ubah apps-script/*.gs lalu jalankan ulang. */
/* eslint-disable */
export function pasangBackend(G) {
  var SpreadsheetApp = G.SpreadsheetApp, LockService = G.LockService, Utilities = G.Utilities, Session = G.Session, DriveApp = G.DriveApp, PropertiesService = G.PropertiesService, CacheService = G.CacheService, ScriptApp = G.ScriptApp, HtmlService = G.HtmlService, ContentService = G.ContentService, DocumentApp = G.DocumentApp, Logger = G.Logger, Sheets = G.Sheets;
  var console = G.console;
  /* doPost() memakai globalThis[fn]; di sini "globalThis" = peta fungsi backend (bukan global Worker) */
  var globalThis = { setupSistem: setupSistem, seedJika: seedJika, seedUlangMaster: seedUlangMaster, resetUntukGoLive: resetUntukGoLive, ambilAtauBuatFolder_: ambilAtauBuatFolder_, doGet: doGet, include: include, doPost: doPost, jsonOut_: jsonOut_, ss_: ss_, sheet_: sheet_, lupakanMemo_: lupakanMemo_, salinBaris_: salinBaris_, baca_: baca_, offsetZonaMs_: offsetZonaMs_, serialKeDate_: serialKeDate_, bacaSemuaBatch_: bacaSemuaBatch_, bacaSheet_: bacaSheet_, tambah_: tambah_, ubahBaris_: ubahBaris_, getSetting_: getSetting_, setSetting_: setSetting_, catatLog_: catatLog_, emailAktif_: emailAktif_, tglStr_: tglStr_, tglValid_: tglValid_, buatId_: buatId_, angka_: angka_, bulat_: bulat_, jam_: jam_, penggunaSaatIni_: penggunaSaatIni_, bolehReview_: bolehReview_, bolehAdmin_: bolehAdmin_, bolehLihatHpp_: bolehLihatHpp_, dihitung_: dihitung_, biayaProsesPerKg_: biayaProsesPerKg_, mataUang_: mataUang_, petaItem_: petaItem_, tambahMaster: tambahMaster, getKonteks: getKonteks, simpanPenerimaan: simpanPenerimaan, simpanPengiriman: simpanPengiriman, antrianReview: antrianReview, tinjauTransfer: tinjauTransfer, tinjauMassal: tinjauMassal, hitungStokSemua_: hitungStokSemua_, laporanStok: laporanStok, riwayatPenerimaan: riwayatPenerimaan, laporanPenjualan: laporanPenjualan, penandaPencatat_: penandaPencatat_, maksEditHari_: maksEditHari_, umurHari_: umurHari_, dalamBatasEdit_: dalamBatasEdit_, alasanKunci_: alasanKunci_, bolehEditEntri_: bolehEditEntri_, sheetDariId_: sheetDariId_, ringkasEntri_: ringkasEntri_, riwayatInput: riwayatInput, ambilEntri: ambilEntri, susunEdit_: susunEdit_, cariEntri_: cariEntri_, terapkanEdit_: terapkanEdit_, simpanEditEntri: simpanEditEntri, pesanKunci_: pesanKunci_, batalkanEntriSendiri: batalkanEntriSendiri, ajukanPermintaan_: ajukanPermintaan_, permintaanTertunda_: permintaanTertunda_, daftarPermintaan: daftarPermintaan, tinjauPermintaan: tinjauPermintaan, daftarPengguna: daftarPengguna, simpanPengguna: simpanPengguna, aktivitasStaf: aktivitasStaf, daftarSku: daftarSku, skuDipakai_: skuDipakai_, simpanSku: simpanSku, hapusSku: hapusSku, siapkanOpname: siapkanOpname, simpanOpname: simpanOpname, riwayatOpname: riwayatOpname, kalender: kalender, dataUrlKeBlob_: dataUrlKeBlob_, unggahFoto_: unggahFoto_, unggahFoto: unggahFoto, ocrSuratJalan: ocrSuratJalan, parseSuratJalan_: parseSuratJalan_, normalisasiAngka_: normalisasiAngka_, potongSekitar_: potongSekitar_, tesParserSuratJalan: tesParserSuratJalan, migrasiSkema: migrasiSkema, migrasiV9_: migrasiV9_, migrasiV10_: migrasiV10_, pastikanSkema_: pastikanSkema_, metodeHpp_: metodeHpp_, wajibPo_: wajibPo_, kunciWaktu_: kunciWaktu_, bolehPo_: bolehPo_, nomorPoBaru_: nomorPoBaru_, simpanPo: simpanPo, ubahPo: ubahPo, batalkanPo: batalkanPo, sinkronPo_: sinkronPo_, ringkasPo_: ringkasPo_, topValid_: topValid_, jatuhTempo_: jatuhTempo_, daftarPo: daftarPo, poTerbuka: poTerbuka, returTersedia: returTersedia, hitungReturSisa_: hitungReturSisa_, ringkasanPo: ringkasanPo, statusPoGabungan_: statusPoGabungan_, ringkasInvoice_: ringkasInvoice_, simpanInvoice: simpanInvoice, validasiInvoice: validasiInvoice, daftarInvoice: daftarInvoice, hitungRata_: hitungRata_, hargaRataItem_: hargaRataItem_, laporanNilaiStok: laporanNilaiStok, hitungUlangHpp: hitungUlangHpp, simpanKerusakan: simpanKerusakan, ringkasKerusakan_: ringkasKerusakan_, daftarKerusakan: daftarKerusakan, tinjauKerusakan: tinjauKerusakan, leadTimeHari_: leadTimeHari_, prediksiBeli: prediksiBeli, diagnosa: diagnosa, nomorSoBaru_: nomorSoBaru_, simpanSo: simpanSo, ubahSo: ubahSo, batalkanSo: batalkanSo, sinkronSo_: sinkronSo_, ringkasSo_: ringkasSo_, daftarSo: daftarSo, soTerbuka: soTerbuka, soKirimHariIni_: soKirimHariIni_, soDipesan_: soDipesan_, csvBaris_: csvBaris_, csv_: csv_, dalamBulan_: dalamBulan_, akhirBulan_: akhirBulan_, eksporBulanan: eksporBulanan, folderBackup_: folderBackup_, backupHarian: backupHarian, pasangBackupHarian: pasangBackupHarian, statusBackup: statusBackup, standarChassen_: standarChassen_, hitungSusutChassen_: hitungSusutChassen_, cariDaur_: cariDaur_, detailDaur_: detailDaur_, mulaiDaurUlang: mulaiDaurUlang, selesaikanDaurUlang: selesaikanDaurUlang, ringkasDaur_: ringkasDaur_, daftarDaurUlang: daftarDaurUlang, ambilDaurUlang: ambilDaurUlang, ubahDaurUlang: ubahDaurUlang, batalkanDaurUlang: batalkanDaurUlang, laporanDaurUlang: laporanDaurUlang, petaKualitas_: petaKualitas_, daftarOperator_: daftarOperator_, konfigurasiShift: konfigurasiShift, bolehShift_: bolehShift_, simpanLaporanShift: simpanLaporanShift, susunShift_: susunShift_, tulisDetailShift_: tulisDetailShift_, ringkasShift_: ringkasShift_, daftarLaporanShift: daftarLaporanShift, ambilLaporanShift: ambilLaporanShift, ubahLaporanShift: ubahLaporanShift, batalkanLaporanShift: batalkanLaporanShift, shiftAktif_: shiftAktif_, laporanProduksi: laporanProduksi, petaTutup_: petaTutup_, bulanTertutup_: bulanTertutup_, bulanTerakhirTertutup_: bulanTerakhirTertutup_, bulanSebelum_: bulanSebelum_, bulanValid_: bulanValid_, laporanBulanan_: laporanBulanan_, ringkasTutup_: ringkasTutup_, laporanBulanan: laporanBulanan, tutupBulan: tutupBulan, bukaBulan: bukaBulan, daftarTutupBulan: daftarTutupBulan };
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
  versi: '10.0.0',
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
  SHIFT      : 'Laporan_Shift',     // v10: laporan produksi per shift per mesin (blowing / cutting), diisi manager produksi
  SHIFT_DETAIL: 'Laporan_Shift_Detail',
  TUTUP      : 'Tutup_Bulan',       // v10: penutupan bulan — nilai stok awal/akhir, COGS, laba kotor, susut
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

/* v10: laporan shift. Satu baris per shift per mesin. Tidak perlu persetujuan.
   BLOWING : ambil biji plastik dari gudang (AMBIL) → hasil roll per kualitas (HASIL) + BS per kualitas (BS)
   CUTTING : hasil polybag per kualitas (HASIL) + BS per kualitas (BS); roll yang terpakai = hasil + BS (PAKAI_ROLL, otomatis) */
HEADER[SHEET.SHIFT] = [
  'ID','Waktu','Tanggal','Shift','Mesin','Operator',
  'Total_Ambil_Kg','Total_Hasil_Kg','Total_BS_Kg','Total_Roll_Pakai_Kg',
  'Dicatat_Oleh','Nama_Pencatat','Foto_URL','Catatan','Log_Edit','Status'
];
HEADER[SHEET.SHIFT_DETAIL] = [
  'ID','ID_Shift','Jenis','Kode_Item','Nama_Item','Kualitas','Qty_Kg','Waktu'
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
var JENIS_SHIFT  = { AMBIL: 'AMBIL', HASIL: 'HASIL', BS: 'BS', PAKAI_ROLL: 'PAKAI_ROLL' }; // v10: baris detail laporan shift
var STATUS_SHIFT = { AKTIF: 'AKTIF', DIBATALKAN: 'DIBATALKAN' };
var STATUS_TUTUP = { DITUTUP: 'DITUTUP', DIBUKA: 'DIBUKA' };
var DAFTAR_SHIFT = ['1', '2', '3'];
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
  [SHEET.PENERIMAAN, SHEET.PENGIRIMAN, SHEET.SHIFT, SHEET.OPNAME, SHEET.PO, SHEET.KERUSAKAN, SHEET.DAUR].forEach(function (n) {
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
   SHEET.PERMINTAAN, SHEET.PO, SHEET.INVOICE, SHEET.KERUSAKAN, SHEET.SO, SHEET.DAUR, SHEET.DAUR_DETAIL, SHEET.TUTUP].forEach(function (n) {
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
 * IPC — Inventory & Production Control (v10)
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
  riwayatInput:1, ambilEntri:1, simpanEditEntri:1, batalkanEntriSendiri:1,
  antrianReview:1, tinjauTransfer:1, daftarPermintaan:1, tinjauPermintaan:1,
  laporanStok:1, riwayatPenerimaan:1, laporanPenjualan:1,
  kalender:1, ocrSuratJalan:1,
  daftarPengguna:1, simpanPengguna:1, aktivitasStaf:1,
  daftarSku:1, simpanSku:1, hapusSku:1,
  siapkanOpname:1, simpanOpname:1, riwayatOpname:1,
  /* v7 */
  simpanPo:1, ubahPo:1, batalkanPo:1, daftarPo:1, poTerbuka:1, returTersedia:1,
  ringkasanPo:1, simpanInvoice:1, validasiInvoice:1, daftarInvoice:1,
  laporanNilaiStok:1, hitungUlangHpp:1,
  simpanKerusakan:1, daftarKerusakan:1, tinjauKerusakan:1,
  diagnosa:1, prediksiBeli:1,
  simpanSo:1, ubahSo:1, batalkanSo:1, daftarSo:1, soTerbuka:1, eksporBulanan:1, statusBackup:1,
  /* v9 */
  tambahMaster:1, mulaiDaurUlang:1, selesaikanDaurUlang:1, daftarDaurUlang:1, ambilDaurUlang:1,
  ubahDaurUlang:1, batalkanDaurUlang:1, laporanDaurUlang:1,
  /* v10: laporan shift produksi, laporan produksi, tutup bulan (COGS periodik) */
  konfigurasiShift:1, simpanLaporanShift:1, daftarLaporanShift:1, ambilLaporanShift:1, ubahLaporanShift:1, batalkanLaporanShift:1,
  laporanProduksi:1, laporanBulanan:1, tutupBulan:1, bukaBulan:1, daftarTutupBulan:1
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

var KOLOM_TANGGAL_ = /^(Tanggal|Tanggal_Invoice|Perkiraan_Datang|Tanggal_Kirim|Tanggal_Terima|Jatuh_Tempo)$/;
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
  if (bulanTertutup_(s)) throw new Error('Bulan ' + s.slice(0, 7) + ' sudah ditutup — transaksi bertanggal di bulan itu tidak bisa ditambah.');
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
      awal: angka_(r.Stok_Awal), kualitas: String(r.Kualitas || '').trim()
    };
  });
  return peta;
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
      var kat = [KATEGORI_ITEM.BAHAN_BAKU, KATEGORI_ITEM.BARANG_JADI, KATEGORI_ITEM.KEDUANYA, KATEGORI_ITEM.ROLL, KATEGORI_ITEM.SCRAP].indexOf(p.kategori) >= 0 ? p.kategori : KATEGORI_ITEM.BAHAN_BAKU;
      var kual = String(p.kualitas || '').trim().toUpperCase().replace(/\s+/g, '_');
      if (kual && !KUALITAS[kual]) throw new Error('Kualitas tidak dikenal: ' + p.kualitas + ' (pilih KW / SUPER / SUPER_PLUS atau kosong).');
      var items = baca_(SHEET.ITEM), adaKode = {};
      for (var j = 0; j < items.length; j++) {
        adaKode[String(items[j].Kode_Item).toUpperCase()] = true;
        if (String(items[j].Nama_Item || '').trim().toLowerCase() === nama.toLowerCase()) {
          if (String(items[j].Aktif).toUpperCase() === 'TIDAK') { ubahBaris_(SHEET.ITEM, items[j]._baris, { Aktif: 'YA' }); catatLog_('TAMBAH_MASTER', items[j].Kode_Item, 'item diaktifkan lagi: ' + items[j].Nama_Item); }
          return { ok: true, ada: true, jenis: jenis, kode: items[j].Kode_Item, nama: items[j].Nama_Item, kategori: items[j].Kategori };
        }
      }
      var dasar = (kat === KATEGORI_ITEM.BARANG_JADI ? 'FG-' : kat === KATEGORI_ITEM.ROLL ? 'WIP-' : kat === KATEGORI_ITEM.SCRAP ? 'SCR-' : 'RM-') +
                  nama.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 20).replace(/-+$/, '');
      if (dasar.length < 4) dasar += '-ITEM';
      var kodeItem = dasar, n = 2;
      while (adaKode[kodeItem]) { kodeItem = dasar + '-' + n; n++; }
      tambah_(SHEET.ITEM, { Kode_Item: kodeItem, Nama_Item: nama, Kategori: kat, Harga_Per_Kg: '', Stok_Awal: 0, Aktif: 'YA', Kualitas: kual });
      catatLog_('TAMBAH_MASTER', kodeItem, 'item baru: ' + nama + ' (' + kat + (kual ? ' ' + kual : '') + ') oleh ' + u.nama);
      return { ok: true, ada: false, jenis: jenis, kode: kodeItem, nama: nama, kategori: kat, kualitas: kual };
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
    return { kode: r.Kode_Item, nama: r.Nama_Item, kategori: r.Kategori, kualitas: String(r.Kualitas || '').trim() };
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

  function hitungStatus(rows, st) {
    return rows.filter(function (r) { return r.Status === st; }).length;
  }
  function menunggu(rows) { return hitungStatus(rows, STATUS_TRANSFER.MENUNGGU); }
  function ditandai(rows) { return hitungStatus(rows, STATUS_TRANSFER.DITANDAI); }

  /* v10: produksi hari ini dari laporan shift (polybag jadi dari cutting, BS dari kedua mesin) */
  var shiftHariIni = 0, jadiHariIni = 0, bsHariIni = 0;
  baca_(SHEET.SHIFT).forEach(function (r) {
    if (r.Status === STATUS_SHIFT.DIBATALKAN || String(r.Tanggal) !== hariIni) return;
    shiftHariIni++; bsHariIni += angka_(r.Total_BS_Kg);
    if (r.Mesin === MESIN.CUTTING) jadiHariIni += angka_(r.Total_Hasil_Kg);
  });

  var masukHariIni = rcv.filter(function (r) {
    return r.Jenis === JENIS_PENERIMAAN.MASUK && String(r.Tanggal) === hariIni && dihitung_(r);
  }).reduce(function (a, r) { return a + angka_(r.Qty_Kg); }, 0);

  var keluarHariIni = snd.filter(function (r) {
    return r.Jenis === JENIS_PENGIRIMAN.KELUAR && String(r.Tanggal) === hariIni && dihitung_(r);
  }).reduce(function (a, r) { return a + angka_(r.Qty_Kg); }, 0);

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
    kualitas: petaKualitas_().map(function (q) { return { kualitas: q.kualitas, nama: q.nama, biji: q.biji ? q.biji.kode : '', roll: q.roll ? q.roll.kode : '', jadi: q.jadi ? q.jadi.kode : '', bs: q.bs ? q.bs.kode : '' }; }),
    bulanTertutup: bulanTerakhirTertutup_(),
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
      shiftHariIni     : shiftHariIni,
      jadiHariIni      : bulat_(jadiHariIni, 1),
      bsHariIni        : bulat_(bsHariIni, 1),
      masukHariIni     : bulat_(masukHariIni, 1),
      keluarHariIni    : bulat_(keluarHariIni, 1),
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
    var rataJual = (jenis === JENIS_PENGIRIMAN.KELUAR && metodeHpp_() !== 'MASTER') ? hitungRata_() : null;
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
        HPP_Per_Kg: rataJual ? bulat_(hargaRataItem_(rataJual, it.kode, peta), 2) : (it.harga || ''),
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
        if (status === STATUS_TRANSFER.DIBATALKAN && bulanTertutup_(rows[i].Tanggal)) throw new Error(pesanKunci_('BULAN_TUTUP'));
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

/**
 * Stok berjalan + dari mana asalnya. Satu lokasi (GBJ).
 * GBJ = stok awal + pembelian − retur ke supplier + retur dari customer − terjual
 *       − biji plastik diambil blowing + roll hasil blowing − roll dipakai cutting + polybag hasil cutting + BS
 *       − BS ke chassen + biji plastik daur ulang − rusak (disetujui) ± penyesuaian opname
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

  /* v10: laporan shift — AMBIL (biji plastik keluar) & PAKAI_ROLL (roll keluar) mengurangi; HASIL (roll/polybag) & BS menambah */
  var shiftOk = shiftAktif_();
  baca_(SHEET.SHIFT_DETAIL).forEach(function (d) {
    if (!shiftOk[d.ID_Shift]) return;
    var s = sel(d.Kode_Item), q = angka_(d.Qty_Kg);
    if (d.Jenis === JENIS_SHIFT.AMBIL || d.Jenis === JENIS_SHIFT.PAKAI_ROLL) { s.dipakai += q; s.gbj -= q; }
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
  if (bulanTertutup_(r.Tanggal)) return 'BULAN_TUTUP';
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
  if (pre === 'SHF-') return SHEET.SHIFT;
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
  if (nama === SHEET.SHIFT) throw new Error('Pakai ambilLaporanShift untuk laporan shift.');
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
  if (bulanTertutup_(r.Tanggal)) throw new Error(pesanKunci_('BULAN_TUTUP'));
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
  if (nama === SHEET.SHIFT) throw new Error('Pakai ubahLaporanShift untuk laporan shift.');
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
       : kunci === 'BULAN_TUTUP' ? 'Bulan entri ini sudah ditutup (tutup buku) — tidak bisa diubah.'
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
    if (r) {
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
  baca_(SHEET.SHIFT).forEach(function (r) {
    if (r.Status === STATUS_SHIFT.DIBATALKAN || new Date(r.Waktu) < batas) return;
    tambah(r.Nama_Pencatat, 'SHIFT', angka_(r.Total_Hasil_Kg), r.Waktu, r.Mesin + ' S' + r.Shift + ' · ' + r.Operator);
  });
  baca_(SHEET.OPNAME).forEach(function (r) {
    if (new Date(r.Waktu) < batas) return;
    tambah(r.Nama_Pencatat, 'OPNAME', Math.abs(angka_(r.Selisih)), r.Waktu, r.Nama_Item + ' · ' + r.Lokasi);
  });
  // review & edit dari log audit
  baca_(SHEET.LOG).forEach(function (r) {
    if (new Date(r.Waktu) < batas) return;
    if (r.Aksi !== 'REVIEW' && r.Aksi !== 'EDIT' && r.Aksi !== 'SHIFT_UBAH' && r.Aksi !== 'BATAL_SENDIRI') return;
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
    var o = { baris: r._baris, kode: r.Kode_Item, nama: r.Nama_Item, kategori: r.Kategori, kualitas: String(r.Kualitas || '').trim(),
              awal: angka_(r.Stok_Awal),
              aktif: String(r.Aktif).toUpperCase() !== 'TIDAK', dipakai: !!dipakai[r.Kode_Item] };
    if (lihatHpp) o.harga = angka_(r.Harga_Per_Kg);
    return o;
  });
}

function skuDipakai_() {
  var d = {};
  [SHEET.PENERIMAAN, SHEET.PENGIRIMAN, SHEET.SHIFT_DETAIL, SHEET.OPNAME, SHEET.DAUR_DETAIL, SHEET.PO, SHEET.SO].forEach(function (nama) {
    baca_(nama).forEach(function (r) { if (r.Kode_Item) d[r.Kode_Item] = true; });
  });
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
  var kat = [KATEGORI_ITEM.BAHAN_BAKU, KATEGORI_ITEM.BARANG_JADI, KATEGORI_ITEM.KEDUANYA, KATEGORI_ITEM.ROLL, KATEGORI_ITEM.SCRAP].indexOf(p.kategori) >= 0
            ? p.kategori : KATEGORI_ITEM.BAHAN_BAKU;
  var kual = String(p.kualitas || '').trim().toUpperCase().replace(/\s+/g, '_');
  if (kual && !KUALITAS[kual]) throw new Error('Kualitas tidak dikenal: ' + p.kualitas + ' (pilih KW / SUPER / SUPER_PLUS atau kosong).');

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();   // di dalam lock: baca ulang dari sheet, jangan pakai memo sebelum lock
  try {
    var rows = baca_(SHEET.ITEM), target = null;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i]._baris === p.baris) target = rows[i];
      else if (String(rows[i].Kode_Item).toUpperCase() === kode) throw new Error('Kode "' + kode + '" sudah ada.');
    }
    var ubah = { Kode_Item: kode, Nama_Item: nama, Kategori: kat, Kualitas: kual,
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
    if (!hari[k]) hari[k] = { tanggal: k, masuk: 0, keluar: 0, daur: 0, shift: 0,
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

  /* v10: laporan shift — satu kejadian per laporan (blowing / cutting) */
  baca_(SHEET.SHIFT).forEach(function (r) {
    if (r.Status === STATUS_SHIFT.DIBATALKAN) return;
    var ds = new Date(String(r.Tanggal) + 'T12:00:00'); if (isNaN(ds.getTime())) ds = new Date(r.Waktu);
    if (!dalam(ds)) return;
    var x = h(ds); x.shift++;
    var blow = r.Mesin === MESIN.BLOWING;
    pushK(ds, { t: new Date(r.Waktu).getTime(), jam: 'S' + r.Shift,
      jenis: blow ? 'SHIFT_BLOWING' : 'SHIFT_CUTTING', label: (blow ? 'Blowing' : 'Cutting') + ' · ' + r.Operator,
      item: blow ? 'roll' : 'polybag', qty: angka_(r.Total_Hasil_Kg), bs: angka_(r.Total_BS_Kg),
      status: '', oleh: r.Nama_Pencatat, id: r.ID, sheet: 'shift' });
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
 * IPC — Inventory & Production Control (v10)
 * File 4 : Pembelian.gs
 *
 * Modul: migrasi skema, Pesanan Pembelian (PO), penerimaan vs PO,
 * retur dari penerimaan, invoice + validasi, harga rata-rata bergerak (v10),
 * laporan barang rusak, prediksi beli.
 **********************************************************************/

/* ================= MIGRASI SKEMA (otomatis sekali per versi) ================= */

/** Tambah sheet/kolom/setting yang belum ada. Aman dijalankan berulang. */
function migrasiSkema() {
  lupakanMemo_();
  var ss = ss_();
  migrasiV9_(ss);
  migrasiV10_(ss);
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

/**
 * v10: pekerjaan per job diganti laporan shift (blowing / cutting); HPP FIFO diganti rata-rata bergerak + COGS bulanan.
 *  - Sheet 'Pekerjaan', 'Pekerjaan_Detail', 'Master_Standar_Susut' tidak dipakai lagi → diganti nama '<nama>_lama' (data tetap ada, tidak dihitung).
 *  - Master_Item: kolom Kualitas diisi otomatis untuk SKU standar; SKU roll / polybag / BS per kualitas ditambah kalau belum ada.
 *  - Setting METODE_HPP 'FIFO' → 'RATA'.
 * Aman dijalankan berulang.
 */
function migrasiV10_(ss) {
  ['Pekerjaan', 'Pekerjaan_Detail', 'Master_Standar_Susut'].forEach(function (n) {
    var sh = ss.getSheetByName(n);
    if (sh && !ss.getSheetByName(n + '_lama')) { try { sh.setName(n + '_lama'); } catch (e) {} }
  });
  lupakanMemo_();
  var sh = ss.getSheetByName(SHEET.ITEM);
  if (sh) {
    var maxKol = sh.getMaxColumns();
    var head = sh.getRange(1, 1, 1, maxKol).getValues()[0].map(String);
    if (head.indexOf('Kualitas') < 0) {
      var terakhir = 0; for (var i = head.length - 1; i >= 0; i--) if (head[i]) { terakhir = i + 1; break; }
      if (terakhir + 1 > maxKol) sh.insertColumnsAfter(Math.max(terakhir, 1), 1);
      sh.getRange(1, terakhir + 1).setValue('Kualitas');
      lupakanMemo_(SHEET.ITEM);
    }
    /* kualitas + SKU baru dari DUMMY_ITEM (yang belum ada) */
    var rows = baca_(SHEET.ITEM), ada = {};
    rows.forEach(function (r) { ada[String(r.Kode_Item).toUpperCase()] = r; });
    DUMMY_ITEM.forEach(function (d) {
      var r = ada[String(d[0]).toUpperCase()];
      if (!r) tambah_(SHEET.ITEM, { Kode_Item: d[0], Nama_Item: d[1], Kategori: d[2], Harga_Per_Kg: d[3], Stok_Awal: d[4], Aktif: d[5], Kualitas: d[6] || '' });
      else if (!String(r.Kualitas || '').trim() && d[6]) ubahBaris_(SHEET.ITEM, r._baris, { Kualitas: d[6], Kategori: r.Kategori === KATEGORI_ITEM.BAHAN_BAKU && d[2] === KATEGORI_ITEM.SCRAP ? d[2] : r.Kategori });
    });
    /* BS lama yang terdaftar sebagai bahan baku (RM-BS-*) → nonaktif: BS sekarang SCR-BS-* (scrap) */
    rows.forEach(function (r) {
      if (/^RM-BS-/.test(String(r.Kode_Item)) && String(r.Aktif).toUpperCase() !== 'TIDAK') ubahBaris_(SHEET.ITEM, r._baris, { Aktif: 'TIDAK' });
    });
    lupakanMemo_(SHEET.ITEM);
  }
  var rowsS = baca_(SHEET.SETTING), ketS = {};
  DEFAULT_SETTING.forEach(function (d) { ketS[d[0]] = d[2]; });
  rowsS.forEach(function (r) {
    if (r.Kunci === 'METODE_HPP' && String(r.Nilai).toUpperCase() === 'FIFO') ubahBaris_(SHEET.SETTING, r._baris, { Nilai: 'RATA', Keterangan: ketS.METODE_HPP });
    else if (r.Kunci === 'BIAYA_PROSES_PER_KG' && ketS[r.Kunci] && r.Keterangan !== ketS[r.Kunci]) ubahBaris_(SHEET.SETTING, r._baris, { Keterangan: ketS[r.Kunci] });
  });
  /* akun manager produksi & sales manager (PIN bawaan — GANTI setelah login pertama) */
  var shP = ss.getSheetByName(SHEET.PENGGUNA);
  if (shP) {
    var adaNama = {};
    baca_(SHEET.PENGGUNA).forEach(function (r) { adaNama[String(r.Nama || '').trim().toLowerCase()] = true; });
    DUMMY_PENGGUNA.forEach(function (d) {
      if (d[3] !== 'Produksi' && d[3] !== 'Sales') return;
      if (adaNama[String(d[1]).toLowerCase()]) return;
      tambah_(SHEET.PENGGUNA, { Email: d[0], Nama: d[1], Peran: d[2], Lokasi: d[3], PIN: d[4], Aktif: d[5] });
    });
  }
  lupakanMemo_();
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

function metodeHpp_() { return (getSetting_('METODE_HPP') || 'RATA').toUpperCase() === 'MASTER' ? 'MASTER' : 'RATA'; }
function wajibPo_()   { return (getSetting_('WAJIB_PO') || 'TIDAK').toUpperCase() === 'YA'; }

/** Kunci urutan kronologis: tanggal transaksi + jam pencatatan (supaya backdate tetap urut). */
function kunciWaktu_(tanggal, waktu) {
  var jam = '00:00:00.000';
  try { jam = Utilities.formatDate(new Date(waktu), APP.zona, 'HH:mm:ss.SSS'); } catch (e) {}
  return String(tanggal || '') + 'T' + jam;
}
/* urutan kalau waktu sama persis: penambahan dulu, baru pemakaian */
var PRIORITAS_EV_ = { MASUK: 0, RETUR_CUST: 0, DAUR_TERIMA: 0, OPNAME: 1, SHIFT: 2, RETUR: 3, JUAL: 3, RUSAK: 3, DAUR_KIRIM: 3 };

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
 * p = { supplier, tanggal, perkiraanDatang, topHari, catatan,
 *       baris:[{ kode, qty, harga, spesifikasi }] }   (v10: topHari = termin pembayaran, jatuh tempo = perkiraan datang + TOP)
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
    var top = topValid_(p.topHari), jatuhTempo = jatuhTempo_(datang || tanggal, top);
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
        Catatan: p.catatan || '', Log_Edit: '', TOP_Hari: top, Jatuh_Tempo: jatuhTempo
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
    if (perubahan.topHari !== undefined && topValid_(perubahan.topHari) !== angka_(r.TOP_Hari)) { ubah.TOP_Hari = topValid_(perubahan.topHari); log.push('TOP: ' + angka_(r.TOP_Hari) + ' → ' + ubah.TOP_Hari + ' hari'); }
    if (ubah.Perkiraan_Datang !== undefined || ubah.TOP_Hari !== undefined) ubah.Jatuh_Tempo = jatuhTempo_(ubah.Perkiraan_Datang !== undefined ? ubah.Perkiraan_Datang : (r.Perkiraan_Datang || r.Tanggal), ubah.TOP_Hari !== undefined ? ubah.TOP_Hari : angka_(r.TOP_Hari));
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
    pembuat: r.Nama_Pembuat, catatan: r.Catatan || '', logEdit: r.Log_Edit || '',
    topHari: angka_(r.TOP_Hari), jatuhTempo: r.Jatuh_Tempo || ''
  };
  if (lihatHarga) { o.harga = angka_(r.Harga_Per_Kg); o.nilai = bulat_(o.qty * o.harga, 0); }
  return o;
}

/** v10: termin pembayaran (hari) — 0 = tunai. */
function topValid_(v) { var n = parseInt(v, 10); if (isNaN(n) || n < 0) return 0; if (n > 365) throw new Error('TOP maksimal 365 hari.'); return n; }
/** Jatuh tempo = tanggal acuan + TOP hari (YYYY-MM-DD). */
function jatuhTempo_(tanggal, top) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(tanggal || '')); if (!m) return '';
  var d = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10) + (parseInt(top, 10) || 0));
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
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
   HARGA RATA-RATA BERGERAK (v10) — satu angka per item, bukan lapisan
   ================================================================= */

/**
 * Putar ulang semua kejadian secara kronologis dengan harga rata-rata tertimbang bergerak.
 *  - Pembelian menambah qty & nilai pada harga PO / penerimaan (tanpa harga → rata-rata saat itu / harga master).
 *  - Pemakaian (jual, retur, rusak, opname minus, ambil produksi, scrap ke chassen) keluar pada rata-rata saat itu.
 *  - BLOWING: nilai biji plastik yang diambil + biaya proses per kg → dibebankan ke roll yang dihasilkan (BS dinilai 0).
 *  - CUTTING: nilai roll yang terpakai (rata-rata) → dibebankan ke polybag yang dihasilkan (BS dinilai 0).
 *  - Daur ulang: BS keluar 0, biji plastik daur ulang masuk pada biaya jasa / kg.
 * sampaiTanggal (opsional, 'YYYY-MM-DD'): posisi per akhir tanggal itu.
 * Hasil: { pos: {kode:{qty,nilai,rata}}, biaya: {idKejadian: nilai keluar}, nilaiDaur: {idDaur: nilai scrap},
 *          proses: {idShift: biaya proses} }
 */
function hitungRata_(sampaiTanggal) {
  var peta = petaItem_();
  var batasK = sampaiTanggal ? String(sampaiTanggal) + 'T23:59:59.999' : null;
  var pos = {};
  function sel(k) { if (!pos[k]) pos[k] = { qty: 0, nilai: 0 }; return pos[k]; }
  function rata(k) { var p = sel(k); if (p.qty > 0.0000001 && p.nilai !== 0) return p.nilai / p.qty; if (p.qty > 0.0000001) return 0; return peta[k] ? peta[k].harga : 0; }
  function masuk(k, q, h) { if (q <= 0) return; var p = sel(k); p.qty += q; p.nilai += q * h; }
  function keluar(k, q) { if (q <= 0) return 0; var p = sel(k), h = rata(k), n = q * h; p.qty -= q; p.nilai -= n; if (p.qty <= 0.0000001) { p.qty = 0; p.nilai = 0; } return n; }

  Object.keys(peta).forEach(function (k) { masuk(k, peta[k].awal || 0, peta[k].harga || 0); });

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
  var detShift = {};
  baca_(SHEET.SHIFT_DETAIL).forEach(function (d) { (detShift[d.ID_Shift] = detShift[d.ID_Shift] || []).push(d); });
  baca_(SHEET.SHIFT).forEach(function (r) {
    if (r.Status === STATUS_SHIFT.DIBATALKAN) return;
    ev.push({ k: kunciWaktu_(r.Tanggal, r.Waktu), t: 'SHIFT', r: r });
  });
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
    if (a.r === b.r && a.t !== b.t) return a.t === 'DAUR_KIRIM' ? -1 : 1;
    return (PRIORITAS_EV_[a.t] || 0) - (PRIORITAS_EV_[b.t] || 0);
  });

  var biaya = {}, nilaiDaur = {}, proses = {}, biayaProses = biayaProsesPerKg_();
  ev.forEach(function (e) {
    var r = e.r;
    switch (e.t) {
      case 'MASUK':      masuk(r.Kode_Item, angka_(r.Qty_Kg), e.harga || rata(r.Kode_Item)); break;
      case 'RETUR':      biaya[r.ID] = keluar(r.Kode_Item, angka_(r.Qty_Kg)); break;
      case 'JUAL':       biaya[r.ID] = keluar(r.Kode_Item, angka_(r.Qty_Kg)); break;
      case 'RETUR_CUST': masuk(r.Kode_Item, angka_(r.Qty_Kg), rata(r.Kode_Item)); break;
      case 'RUSAK':      biaya[r.ID] = keluar(r.Kode_Item, angka_(r.Qty_Kg)); break;
      case 'OPNAME':
        var d = angka_(r.Selisih);
        if (d > 0) masuk(r.Kode_Item, d, rata(r.Kode_Item));
        else if (d < 0) biaya[r.ID] = keluar(r.Kode_Item, -d);
        break;
      case 'SHIFT':
        var det = detShift[r.ID] || [], nilaiMasuk = 0, kgHasil = 0, kgAmbil = 0;
        det.forEach(function (x) {
          var q = angka_(x.Qty_Kg);
          if (x.Jenis === JENIS_SHIFT.AMBIL) { nilaiMasuk += keluar(x.Kode_Item, q); kgAmbil += q; }
          else if (x.Jenis === JENIS_SHIFT.PAKAI_ROLL) nilaiMasuk += keluar(x.Kode_Item, q);
          else if (x.Jenis === JENIS_SHIFT.HASIL) kgHasil += q;
        });
        var pr = r.Mesin === MESIN.BLOWING ? kgAmbil * biayaProses : 0;
        proses[r.ID] = pr; biaya[r.ID] = nilaiMasuk;
        var hargaHasil = kgHasil > 0 ? (nilaiMasuk + pr) / kgHasil : 0;
        det.forEach(function (x) {
          var q = angka_(x.Qty_Kg);
          if (x.Jenis === JENIS_SHIFT.HASIL) masuk(x.Kode_Item, q, hargaHasil);
          else if (x.Jenis === JENIS_SHIFT.BS) masuk(x.Kode_Item, q, 0);   // BS dinilai 0 — nilainya muncul lagi lewat jasa chassen
        });
        break;
      case 'DAUR_KIRIM':
        var ns = 0;
        (detDaur[r.ID] || []).forEach(function (x) { if (x.Jenis === JENIS_DAUR_DETAIL.SCRAP) ns += keluar(x.Kode_Item, angka_(x.Qty_Kg)); });
        nilaiDaur[r.ID] = ns; biaya[r.ID] = ns;
        break;
      case 'DAUR_TERIMA':
        var hasilKg = 0; (detDaur[r.ID] || []).forEach(function (x) { if (x.Jenis === JENIS_DAUR_DETAIL.HASIL) hasilKg += angka_(x.Qty_Kg); });
        var hargaDu = hasilKg > 0 ? ((nilaiDaur[r.ID] || 0) + angka_(r.Biaya_Jasa)) / hasilKg : 0;
        (detDaur[r.ID] || []).forEach(function (x) { if (x.Jenis === JENIS_DAUR_DETAIL.HASIL) masuk(x.Kode_Item, angka_(x.Qty_Kg), hargaDu); });
        break;
    }
  });
  Object.keys(pos).forEach(function (k) { pos[k].rata = pos[k].qty > 0.0000001 ? pos[k].nilai / pos[k].qty : (peta[k] ? peta[k].harga : 0); });
  return { pos: pos, biaya: biaya, nilaiDaur: nilaiDaur, proses: proses };
}

/** Harga rata-rata satu item SEKARANG dari hasil hitungRata_ (fallback harga master). */
function hargaRataItem_(rata, kode, peta) {
  var p = rata.pos[kode];
  if (p && p.qty > 0.0000001) return p.nilai / p.qty;
  return peta && peta[kode] ? peta[kode].harga : 0;
}

/** Laporan nilai stok per item (manager) — harga rata-rata bergerak. */
function laporanNilaiStok(ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehLihatHpp_(u)) throw new Error('Hanya Manager / Admin.');
  var peta = petaItem_(), pos = hitungRata_().pos;
  var daftar = [], tot = { qty: 0, nilai: 0 };
  Object.keys(pos).forEach(function (k) {
    var p = pos[k];
    if (p.qty <= 0.0001) return;
    daftar.push({ kode: k, nama: peta[k] ? peta[k].nama : k, kategori: peta[k] ? peta[k].kategori : '',
                  qty: bulat_(p.qty, 2), total: bulat_(p.qty, 2), nilai: bulat_(p.nilai, 0), rata: bulat_(p.rata, 0) });
    tot.qty += p.qty; tot.nilai += p.nilai;
  });
  daftar.sort(function (a, b) { return b.nilai - a.nilai; });
  tot.qty = bulat_(tot.qty, 2); tot.nilai = bulat_(tot.nilai, 0);
  return { metode: metodeHpp_(), daftar: daftar, total: tot };
}

/** Hitung ulang HPP tersimpan (HPP pengiriman, nilai kerugian rusak, HPP daur ulang) dari mesin rata-rata. Manager. */
function hitungUlangHpp(ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehPo_(u)) throw new Error('Hanya Manager / Admin.');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();
  try {
    var f = hitungRata_(), diubah = 0, daurDiubah = 0;
    baca_(SHEET.PENGIRIMAN).forEach(function (r) {
      if (r.Jenis !== JENIS_PENGIRIMAN.KELUAR || f.biaya[r.ID] === undefined) return;
      var q = angka_(r.Qty_Kg), h = q > 0 ? bulat_(f.biaya[r.ID] / q, 2) : 0;
      if (Math.abs(h - angka_(r.HPP_Per_Kg)) < 0.5) return;
      ubahBaris_(SHEET.PENGIRIMAN, r._baris, { HPP_Per_Kg: h }); diubah++;
    });
    baca_(SHEET.KERUSAKAN).forEach(function (r) {
      if (r.Status !== STATUS_TRANSFER.DISETUJUI || f.biaya[r.ID] === undefined) return;
      var n = bulat_(f.biaya[r.ID], 0);
      if (Math.abs(n - angka_(r.Nilai_Kerugian)) < 1) return;
      ubahBaris_(SHEET.KERUSAKAN, r._baris, { Nilai_Kerugian: n }); diubah++;
    });
    baca_(SHEET.DAUR).forEach(function (r) {
      if (r.Status !== STATUS_DAUR.SELESAI || f.nilaiDaur[r.ID] === undefined) return;
      var ns = bulat_(f.nilaiDaur[r.ID], 0), hasil = angka_(r.Total_Hasil_Kg);
      var hppT = ns + angka_(r.Biaya_Jasa), hpk = hasil > 0 ? bulat_(hppT / hasil, 0) : 0;
      if (Math.abs(ns - angka_(r.Nilai_Scrap)) < 1 && Math.abs(hpk - angka_(r.HPP_Per_Kg)) < 1) return;
      ubahBaris_(SHEET.DAUR, r._baris, { Nilai_Scrap: ns, HPP_Total: bulat_(hppT, 0), HPP_Per_Kg: hpk });
      baca_(SHEET.DAUR_DETAIL).forEach(function (d) { if (d.ID_Daur === r.ID && d.Jenis === JENIS_DAUR_DETAIL.HASIL) ubahBaris_(SHEET.DAUR_DETAIL, d._baris, { Harga_Per_Kg: hpk, Nilai: bulat_(hpk * angka_(d.Qty_Kg), 0) }); });
      daurDiubah++;
    });
    catatLog_('HPP_HITUNG_ULANG', '', diubah + ' entri, ' + daurDiubah + ' daur ulang diperbarui');
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

/** aksi: 'setuju' (stok berkurang, nilai kerugian dihitung pada harga rata-rata) | 'batal' */
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
      nilai = bulat_(hitungRata_().biaya[id] || 0, 0);
      ubahBaris_(SHEET.KERUSAKAN, r._baris, { Nilai_Kerugian: nilai });
    }
    catatLog_(aksi === 'setuju' ? 'RUSAK_SETUJU' : 'RUSAK_BATAL', id, r.Nama_Item + ' ' + angka_(r.Qty_Kg) + ' kg' + (nilai ? ' • rugi ' + nilai : ''));
    return { ok: true, status: status, nilaiKerugian: nilai };
  } finally { lock.releaseLock(); }
}

/* ================= PREDIKSI KAPAN PERLU BELI (manager) ================= */
function leadTimeHari_() { var n = parseInt(getSetting_('LEAD_TIME_HARI'), 10); return isNaN(n) || n < 0 ? 7 : n; }
/**
 * Per bahan baku: pemakaian rata-rata per hari (dari biji plastik yang diambil di laporan shift, N hari terakhir),
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
  var pakai = {}, shiftBaru = {}, batasStr = tglStr_(batas);
  baca_(SHEET.SHIFT).forEach(function (r) { if (r.Status !== STATUS_SHIFT.DIBATALKAN && String(r.Tanggal) >= batasStr) shiftBaru[r.ID] = true; });
  baca_(SHEET.SHIFT_DETAIL).forEach(function (d) {
    if (d.Jenis !== JENIS_SHIFT.AMBIL || !shiftBaru[d.ID_Shift]) return;
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
 * IPC — Inventory & Production Control (v10)
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

/** p = { customer, tanggal, tanggalKirim, topHari, baris:[{kode, qty, harga}], catatan } — v10: TOP wajib diisi (0 = tunai). */
function simpanSo(p, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehPo_(u)) throw new Error('Hanya Manager / Admin yang bisa membuat sales order.');
  if (!p || !String(p.customer || '').trim()) throw new Error('Customer belum dipilih.');
  if (!p.baris || !p.baris.length) throw new Error('Item SO belum diisi.');
  var kirim = String(p.tanggalKirim || '').trim();
  if (!kirim) throw new Error('Tanggal kirim belum diisi.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(kirim)) throw new Error('Format tanggal kirim harus YYYY-MM-DD.');
  var peta = petaItem_();
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();
  try {
    var now = new Date(), tanggal = tglValid_(p.tanggal);
    if (p.topHari === undefined || p.topHari === null || String(p.topHari).trim() === '') throw new Error('TOP (hari) belum diisi — isi 0 untuk tunai.');
    var top = topValid_(p.topHari), jatuhTempo = jatuhTempo_(kirim || tanggal, top);
    var noSo = nomorSoBaru_(), ids = [], total = 0, nilai = 0;
    p.baris.forEach(function (b) {
      var it = peta[b.kode]; if (!it) throw new Error('Item tidak dikenal: ' + b.kode);
      var q = angka_(b.qty), h = angka_(b.harga);
      if (q <= 0) throw new Error('Qty harus > 0 (' + it.nama + ')');
      if (b.harga === undefined || b.harga === null || String(b.harga).trim() === '' || h <= 0) throw new Error('Harga jual belum diisi (' + it.nama + ')');
      var id = buatId_('SO'); ids.push(id); total += q; nilai += q * h;
      tambah_(SHEET.SO, {
        ID: id, No_SO: noSo, Waktu: now, Tanggal: tanggal, Customer: p.customer,
        Kode_Item: it.kode, Nama_Item: it.nama, Qty_Kg: q, Harga_Per_Kg: h,
        Tanggal_Kirim: kirim, Qty_Dikirim_Kg: 0, Status: STATUS_SO.TERBUKA,
        Dibuat_Oleh: penandaPencatat_(u), Nama_Pembuat: u.nama, Catatan: p.catatan || '', Log_Edit: '',
        TOP_Hari: top, Jatuh_Tempo: jatuhTempo
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
    if (perubahan.topHari !== undefined && topValid_(perubahan.topHari) !== angka_(r.TOP_Hari)) { ubah.TOP_Hari = topValid_(perubahan.topHari); log.push('TOP: ' + angka_(r.TOP_Hari) + ' → ' + ubah.TOP_Hari + ' hari'); }
    if (perubahan.catatan !== undefined && String(perubahan.catatan) !== String(r.Catatan || '')) { ubah.Catatan = perubahan.catatan; log.push('catatan diubah'); }
    if (!log.length) return { ok: true, berubah: false };
    if (ubah.Tanggal_Kirim !== undefined || ubah.TOP_Hari !== undefined) ubah.Jatuh_Tempo = jatuhTempo_((ubah.Tanggal_Kirim !== undefined ? ubah.Tanggal_Kirim : r.Tanggal_Kirim) || r.Tanggal, ubah.TOP_Hari !== undefined ? ubah.TOP_Hari : angka_(r.TOP_Hari));
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
    tanggalKirim: r.Tanggal_Kirim || '', status: r.Status, pembuat: r.Nama_Pembuat, catatan: r.Catatan || '', logEdit: r.Log_Edit || '',
    topHari: angka_(r.TOP_Hari), jatuhTempo: r.Jatuh_Tempo || ''
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
 * pembelian, penjualan, produksi (laporan shift), rusak, daur_ulang, nilai_stok (posisi akhir bulan, harga rata-rata), ringkasan.
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
              shift: 0, ambilKg: 0, jadiKg: 0, bsKg: 0, rollKg: 0, rollPakaiKg: 0, fgKg: 0, bsBlowingKg: 0, bsCuttingKg: 0,
              hppBahan: 0, hppProses: 0, rusakKg: 0, rusakRp: 0 };

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

  /* --- produksi (v10): laporan shift di bulan itu --- */
  var prod = [], detShift = {};
  baca_(SHEET.SHIFT_DETAIL).forEach(function (d) { (detShift[d.ID_Shift] = detShift[d.ID_Shift] || []).push(d); });
  var rataBulan = hitungRata_(akhirBulan_(bulan));
  baca_(SHEET.SHIFT).forEach(function (r) {
    if (r.Status === STATUS_SHIFT.DIBATALKAN || !dalamBulan_(r.Tanggal, bulan)) return;
    var per = {};
    (detShift[r.ID] || []).forEach(function (x) {
      var k = x.Jenis + ':' + (x.Kualitas || '');
      if (x.Jenis === JENIS_SHIFT.AMBIL) k = 'AMBIL:' + x.Nama_Item;
      per[k] = (per[k] || 0) + angka_(x.Qty_Kg);
    });
    var ambilTxt = Object.keys(per).filter(function (k) { return k.indexOf('AMBIL:') === 0; }).map(function (k) { return k.slice(6) + ' ' + bulat_(per[k], 2); }).join(', ');
    function q(j, kual) { return bulat_(per[j + ':' + kual] || 0, 2); }
    var bahan = angka_(rataBulan.biaya[r.ID]), proses = angka_(rataBulan.proses[r.ID]);
    prod.push([r.Tanggal, r.Shift, r.Mesin, r.ID, r.Operator, ambilTxt, angka_(r.Total_Ambil_Kg), angka_(r.Total_Roll_Pakai_Kg),
               q(JENIS_SHIFT.HASIL, KUALITAS.KW), q(JENIS_SHIFT.HASIL, KUALITAS.SUPER), q(JENIS_SHIFT.HASIL, KUALITAS.SUPER_PLUS), angka_(r.Total_Hasil_Kg),
               q(JENIS_SHIFT.BS, KUALITAS.KW), q(JENIS_SHIFT.BS, KUALITAS.SUPER), q(JENIS_SHIFT.BS, KUALITAS.SUPER_PLUS), angka_(r.Total_BS_Kg),
               bulat_(bahan, 0), bulat_(proses, 0), r.Nama_Pencatat, r.Catatan || '']);
    tot.shift++; tot.ambilKg += angka_(r.Total_Ambil_Kg); tot.jadiKg += angka_(r.Total_Hasil_Kg); tot.bsKg += angka_(r.Total_BS_Kg);
    tot.hppBahan += bahan; tot.hppProses += proses;
    if (r.Mesin === MESIN.BLOWING) { tot.rollKg += angka_(r.Total_Hasil_Kg); tot.bsBlowingKg += angka_(r.Total_BS_Kg); }
    else { tot.rollPakaiKg += angka_(r.Total_Roll_Pakai_Kg); tot.fgKg += angka_(r.Total_Hasil_Kg); tot.bsCuttingKg += angka_(r.Total_BS_Kg); }
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

  /* --- nilai stok posisi akhir bulan (harga rata-rata) --- */
  var P = rataBulan.pos, stokRows = [], nilaiStok = 0;
  Object.keys(P).forEach(function (k) {
    if (P[k].qty <= 0.0001) return;
    stokRows.push([k, peta[k] ? peta[k].nama : k, peta[k] ? peta[k].kategori : '', bulat_(P[k].qty, 2), bulat_(P[k].rata, 0), bulat_(P[k].nilai, 0)]);
    nilaiStok += P[k].nilai;
  });

  /* --- laba kotor bulan (COGS total = stok awal + pembelian − retur + jasa + proses − stok akhir) --- */
  var lb = laporanBulanan_(bulan, rataBulan);

  var ringkasan = [
    ['Periode', bulan], ['Mata uang', cur],
    ['Pembelian (kg)', bulat_(tot.beliKg, 2)], ['Pembelian (nilai)', bulat_(tot.beliRp, 0)],
    ['Retur ke supplier (kg)', bulat_(tot.returKg, 2)], ['Retur ke supplier (nilai)', bulat_(tot.returRp, 0)],
    ['Penjualan (kg)', bulat_(tot.jualKg, 2)], ['Penjualan tanpa SO / tanpa harga (kg)', bulat_(tot.jualTanpaSoKg, 2)],
    ['Penjualan (nilai, dari harga SO)', bulat_(tot.jualRp, 0)],
    ['HPP barang terjual (semua pengiriman)', bulat_(tot.hppJualRp, 0)], ['HPP barang terjual (yang ada harga SO)', bulat_(tot.hppJualSoRp, 0)],
    ['Laba kotor (penjualan − HPP, hanya yang ada harga SO)', bulat_(tot.jualRp - tot.hppJualSoRp, 0)],
    ['Retur dari customer (kg)', bulat_(tot.returCustKg, 2)],
    ['Laporan shift', tot.shift], ['Biji plastik masuk blowing (kg)', bulat_(tot.ambilKg, 2)], ['Roll hasil blowing (kg)', bulat_(tot.rollKg, 2)],
    ['Roll dipakai cutting (kg)', bulat_(tot.rollPakaiKg, 2)], ['Polybag jadi (kg)', bulat_(tot.fgKg, 2)],
    ['BS blowing (kg)', bulat_(tot.bsBlowingKg, 2)], ['BS cutting (kg)', bulat_(tot.bsCuttingKg, 2)], ['BS total (kg)', bulat_(tot.bsKg, 2)],
    ['Susut produksi (kg, biji masuk − polybag − BS − perubahan roll)', bulat_(lb.susutKg, 2)], ['Susut produksi (%)', lb.susutPersen],
    ['Nilai bahan masuk produksi (rata-rata)', bulat_(tot.hppBahan, 0)], ['Biaya proses blowing', bulat_(tot.hppProses, 0)],
    ['Barang rusak (kg)', bulat_(tot.rusakKg, 2)], ['Barang rusak (nilai)', bulat_(tot.rusakRp, 0)],
    ['Daur ulang scrap: batch selesai', totDaur.batch], ['Daur ulang: scrap dikirim (kg)', bulat_(totDaur.scrap, 2)],
    ['Daur ulang: biji plastik diterima (kg)', bulat_(totDaur.hasil, 2)], ['Daur ulang: susut chassen (kg)', bulat_(totDaur.susut, 2)],
    ['Daur ulang: biaya jasa chassen (nilai)', bulat_(totDaur.jasa, 0)],
    ['Nilai stok awal bulan (rata-rata)', bulat_(lb.nilaiStokAwal, 0)], ['Nilai stok akhir bulan (rata-rata)', bulat_(nilaiStok, 0)],
    ['COGS bulan (stok awal + pembelian − retur + jasa chassen + biaya proses − stok akhir)', bulat_(lb.cogs, 0)],
    ['Laba kotor bulan (penjualan dari harga SO − COGS)', bulat_(lb.labaKotor, 0)],
    ['Catatan', 'Nilai penjualan hanya untuk pengiriman yang merujuk SO (ada harga jual); pengiriman tanpa SO tercantum di kolom kg-nya. COGS belum memuat overhead pabrik selain biaya proses per kg. PPN tidak dihitung.']
  ];

  catatLog_('EKSPOR', bulan, u.nama);
  return {
    bulan: bulan,
    files: [
      { nama: 'ringkasan_' + bulan + '.csv', csv: csv_(['Keterangan', 'Nilai'], ringkasan) },
      { nama: 'pembelian_' + bulan + '.csv', csv: csv_(['Tanggal', 'ID', 'Jenis', 'Supplier', 'No_PO', 'No_Invoice', 'No_Surat_Jalan', 'Kode_Item', 'Nama_Item', 'Qty_Kg', 'Harga_Per_Kg', 'Nilai', 'Status', 'Pencatat', 'Catatan_QC'], beli) },
      { nama: 'penjualan_' + bulan + '.csv', csv: csv_(['Tanggal', 'ID', 'Jenis', 'Customer', 'No_SO', 'No_Surat_Jalan', 'Kode_Item', 'Nama_Item', 'Qty_Kg', 'Harga_Jual_Per_Kg', 'Nilai_Jual', 'HPP_Per_Kg', 'Nilai_HPP', 'Laba_Kotor', 'Status', 'Pencatat'], jual) },
      { nama: 'produksi_' + bulan + '.csv', csv: csv_(['Tanggal', 'Shift', 'Mesin', 'ID', 'Operator', 'Ambil_Gudang', 'Ambil_Kg', 'Roll_Pakai_Kg', 'Hasil_KW_Kg', 'Hasil_Super_Kg', 'Hasil_Super_Plus_Kg', 'Hasil_Kg', 'BS_KW_Kg', 'BS_Super_Kg', 'BS_Super_Plus_Kg', 'BS_Kg', 'Nilai_Bahan', 'Biaya_Proses', 'Pencatat', 'Catatan'], prod) },
      { nama: 'rusak_' + bulan + '.csv', csv: csv_(['Tanggal', 'ID', 'Lokasi', 'Kode_Item', 'Nama_Item', 'Qty_Kg', 'Nilai_Kerugian', 'Penyebab', 'Pencatat', 'Disetujui_Oleh'], rusak) },
      { nama: 'daur_ulang_' + bulan + '.csv', csv: csv_(['Tanggal_Kirim', 'Tanggal_Terima', 'ID', 'Vendor_Chassen', 'No_Surat_Jalan', 'Scrap_Kg', 'Hasil_Kg', 'Susut_Kg', 'Susut_Persen', 'Status_Susut', 'Nilai_Scrap', 'Biaya_Jasa', 'HPP_Total', 'HPP_Per_Kg', 'Pengirim', 'Penerima'], daur) },
      { nama: 'nilai_stok_' + bulan + '.csv', csv: csv_(['Kode_Item', 'Nama_Item', 'Kategori', 'Qty_Kg', 'Harga_Rata', 'Nilai'], stokRows) }
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
    /* nilai scrap menurut harga rata-rata (batch ini sudah tercatat sebagai DAUR_KIRIM) */
    var nilaiScrap = 0;
    if (metodeHpp_() !== 'MASTER') { try { nilaiScrap = hitungRata_().nilaiDaur[r.ID] || 0; } catch (e) { nilaiScrap = 0; } }
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
    if (bulanTertutup_(r.Tanggal) || (r.Tanggal_Terima && bulanTertutup_(r.Tanggal_Terima))) throw new Error('Bulan batch ini sudah ditutup — tidak bisa diubah.');
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
    if (bulanTertutup_(r.Tanggal) || (r.Tanggal_Terima && bulanTertutup_(r.Tanggal_Terima))) throw new Error('Bulan batch ini sudah ditutup — tidak bisa dibatalkan.');
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

/* ==== Produksi.gs ==== */
/**********************************************************************
 * IPC — Inventory & Production Control (v10)
 * File 7 : Produksi.gs — laporan shift (blowing / cutting)
 *
 * Alur produksi Mike (v10):
 *   BLOWING : operator mengambil biji plastik dari gudang → keluar roll per kualitas + BS
 *   CUTTING : roll dipotong jadi polybag per kualitas + BS (roll yang terpakai = polybag + BS, otomatis)
 * Setiap shift, manager produksi mengisi SATU laporan per mesin. Tidak ada persetujuan.
 * Susut TIDAK dihitung per shift — muncul saat tutup bulan (opname): masuk produksi − jadi − BS − Δroll.
 **********************************************************************/

/** Peta kualitas → SKU biji plastik / roll / polybag / BS (dari Master_Item.Kualitas + Kategori). */
function petaKualitas_() {
  var per = {};
  baca_(SHEET.ITEM).forEach(function (r) {
    if (!r.Kode_Item || String(r.Aktif).toUpperCase() === 'TIDAK') return;
    var q = String(r.Kualitas || '').trim(); if (!q) return;
    if (!per[q]) per[q] = { kualitas: q, nama: NAMA_KUALITAS[q] || q, biji: null, roll: null, jadi: null, bs: null };
    var it = { kode: r.Kode_Item, nama: r.Nama_Item };
    if (r.Kategori === KATEGORI_ITEM.ROLL) per[q].roll = per[q].roll || it;
    else if (r.Kategori === KATEGORI_ITEM.BARANG_JADI || r.Kategori === KATEGORI_ITEM.KEDUANYA) per[q].jadi = per[q].jadi || it;
    else if (r.Kategori === KATEGORI_ITEM.SCRAP) per[q].bs = per[q].bs || it;
    else if (r.Kategori === KATEGORI_ITEM.BAHAN_BAKU) per[q].biji = per[q].biji || it;
  });
  var urut = [KUALITAS.KW, KUALITAS.SUPER, KUALITAS.SUPER_PLUS];
  return Object.keys(per).sort(function (a, b) {
    var ia = urut.indexOf(a), ib = urut.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  }).map(function (k) { return per[k]; });
}

/** Nama operator yang pernah dipakai + pengguna aktif (untuk search bar operator). */
function daftarOperator_() {
  var ada = {}, out = [];
  function tambah(n) { n = String(n || '').trim(); if (!n) return; var k = n.toLowerCase(); if (ada[k]) return; ada[k] = true; out.push(n); }
  baca_(SHEET.SHIFT).forEach(function (r) { String(r.Operator || '').split(',').forEach(tambah); });
  baca_(SHEET.PENGGUNA).forEach(function (r) { if (String(r.Aktif).toUpperCase() !== 'TIDAK') tambah(r.Nama); });
  return out.sort(function (a, b) { return a.localeCompare(b); });
}

/** Untuk form laporan shift: kualitas + SKU-nya, bahan baku, operator, shift. */
function konfigurasiShift(ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehShift_(u)) throw new Error('Laporan shift hanya diisi Manager / Admin.');
  var kualitas = petaKualitas_();
  var kurang = [];
  kualitas.forEach(function (q) {
    if (!q.roll) kurang.push('roll ' + q.nama);
    if (!q.jadi) kurang.push('polybag ' + q.nama);
    if (!q.bs) kurang.push('BS ' + q.nama);
  });
  var bahan = baca_(SHEET.ITEM).filter(function (r) {
    return r.Kode_Item && String(r.Aktif).toUpperCase() !== 'TIDAK' && (r.Kategori === KATEGORI_ITEM.BAHAN_BAKU || r.Kategori === KATEGORI_ITEM.KEDUANYA);
  }).map(function (r) { return { kode: r.Kode_Item, nama: r.Nama_Item, kualitas: r.Kualitas || '' }; });
  return { kualitas: kualitas, kurang: kurang, bahan: bahan, operator: daftarOperator_(), shift: DAFTAR_SHIFT, mesin: [MESIN.BLOWING, MESIN.CUTTING], hariIni: tglStr_(new Date()) };
}

function bolehShift_(u) { return bolehReview_(u); }

/**
 * p = { tanggal, shift, mesin, operator:[nama…] | 'a, b', ambil:[{kode,qty}] (BLOWING),
 *       hasil:[{kualitas,qty}], bs:[{kualitas,qty}], catatan, foto, ident }
 */
function simpanLaporanShift(p, ident) {
  var u = penggunaSaatIni_(ident || (p && p.ident));
  if (!bolehShift_(u)) throw new Error('Laporan shift hanya diisi Manager / Admin.');
  var d = susunShift_(p);
  var foto = p.foto ? unggahFoto_(p.foto, 'SHIFT') : { url: '', id: '' };
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();
  try {
    var now = new Date(), id = buatId_('SHF');
    if (bulanTertutup_(d.tanggal)) throw new Error('Bulan ' + d.tanggal.slice(0, 7) + ' sudah ditutup — tidak bisa tambah laporan.');
    var dobel = baca_(SHEET.SHIFT).filter(function (r) {
      return r.Status !== STATUS_SHIFT.DIBATALKAN && String(r.Tanggal) === d.tanggal && String(r.Shift) === d.shift && r.Mesin === d.mesin;
    });
    if (dobel.length && !p.timpa) throw new Error('Laporan ' + d.mesin + ' shift ' + d.shift + ' tanggal ' + d.tanggal + ' sudah ada (' + dobel[0].ID + '). Ubah yang itu, atau kirim ulang dengan timpa=true.');
    tulisDetailShift_(id, d, now);
    tambah_(SHEET.SHIFT, {
      ID: id, Waktu: now, Tanggal: d.tanggal, Shift: d.shift, Mesin: d.mesin, Operator: d.operator,
      Total_Ambil_Kg: bulat_(d.totalAmbil, 3), Total_Hasil_Kg: bulat_(d.totalHasil, 3), Total_BS_Kg: bulat_(d.totalBs, 3), Total_Roll_Pakai_Kg: bulat_(d.totalRoll, 3),
      Dicatat_Oleh: penandaPencatat_(u), Nama_Pencatat: u.nama, Foto_URL: foto.url, Catatan: p.catatan || '', Log_Edit: '', Status: STATUS_SHIFT.AKTIF
    });
    catatLog_('SHIFT_SIMPAN', id, d.mesin + ' S' + d.shift + ' ' + d.tanggal + ' • ' + d.operator + ' • jadi ' + bulat_(d.totalHasil, 1) + ' kg, BS ' + bulat_(d.totalBs, 1) + ' kg');
    return ringkasShift_(cariEntri_(SHEET.SHIFT, id), u);
  } finally { lock.releaseLock(); }
}

/** Validasi + normalisasi isi laporan (dipakai simpan & ubah). */
function susunShift_(p) {
  p = p || {};
  var tanggal = tglValid_(p.tanggal);
  var shift = String(p.shift || '').trim();
  if (DAFTAR_SHIFT.indexOf(shift) < 0) throw new Error('Shift harus 1, 2, atau 3.');
  var mesin = String(p.mesin || '').toUpperCase();
  if (mesin !== MESIN.BLOWING && mesin !== MESIN.CUTTING) throw new Error('Mesin harus BLOWING atau CUTTING.');
  var op = Array.isArray(p.operator) ? p.operator : String(p.operator || '').split(',');
  op = op.map(function (s) { return String(s || '').replace(/\s+/g, ' ').trim(); }).filter(String);
  if (!op.length) throw new Error('Operator belum diisi.');
  var peta = petaItem_(), kual = {}, urut = [];
  petaKualitas_().forEach(function (q) { kual[q.kualitas] = q; urut.push(q.kualitas); });

  var ambil = [], hasil = [], bs = [], roll = [];
  var totalAmbil = 0, totalHasil = 0, totalBs = 0, totalRoll = 0;
  if (mesin === MESIN.BLOWING) {
    (p.ambil || []).forEach(function (b) {
      var q = angka_(b.qty); if (q <= 0) return;
      var it = peta[b.kode]; if (!it) throw new Error('Bahan baku tidak dikenal: ' + b.kode);
      if (it.kategori !== KATEGORI_ITEM.BAHAN_BAKU && it.kategori !== KATEGORI_ITEM.KEDUANYA) throw new Error(it.nama + ' bukan bahan baku.');
      ambil.push({ kode: it.kode, nama: it.nama, kualitas: it.kualitas || '', qty: q }); totalAmbil += q;
    });
    if (!ambil.length) throw new Error('Biji plastik yang diambil dari gudang belum diisi.');
  }
  (p.hasil || []).forEach(function (h) {
    var q = angka_(h.qty); if (q <= 0) return;
    var k = kual[h.kualitas]; if (!k) throw new Error('Kualitas tidak dikenal: ' + h.kualitas);
    var it = mesin === MESIN.BLOWING ? k.roll : k.jadi;
    if (!it) throw new Error('SKU ' + (mesin === MESIN.BLOWING ? 'roll' : 'polybag') + ' untuk kualitas ' + k.nama + ' belum ada di Master_Item.');
    hasil.push({ kode: it.kode, nama: it.nama, kualitas: k.kualitas, qty: q }); totalHasil += q;
  });
  (p.bs || []).forEach(function (h) {
    var q = angka_(h.qty); if (q <= 0) return;
    var k = kual[h.kualitas]; if (!k) throw new Error('Kualitas tidak dikenal: ' + h.kualitas);
    if (!k.bs) throw new Error('SKU BS untuk kualitas ' + k.nama + ' belum ada di Master_Item.');
    bs.push({ kode: k.bs.kode, nama: k.bs.nama, kualitas: k.kualitas, qty: q }); totalBs += q;
  });
  if (!hasil.length && !bs.length) throw new Error('Hasil produksi belum diisi.');
  if (mesin === MESIN.CUTTING) {
    /* roll yang terpakai per kualitas = polybag + BS kualitas itu (otomatis) */
    var perQ = {};
    hasil.forEach(function (h) { perQ[h.kualitas] = (perQ[h.kualitas] || 0) + h.qty; });
    bs.forEach(function (h) { perQ[h.kualitas] = (perQ[h.kualitas] || 0) + h.qty; });
    Object.keys(perQ).forEach(function (q) {
      var k = kual[q]; if (!k.roll) throw new Error('SKU roll untuk kualitas ' + k.nama + ' belum ada di Master_Item.');
      roll.push({ kode: k.roll.kode, nama: k.roll.nama, kualitas: q, qty: perQ[q] }); totalRoll += perQ[q];
    });
  }
  return { tanggal: tanggal, shift: shift, mesin: mesin, operator: op.join(', '), ambil: ambil, hasil: hasil, bs: bs, roll: roll,
           totalAmbil: totalAmbil, totalHasil: totalHasil, totalBs: totalBs, totalRoll: totalRoll };
}

function tulisDetailShift_(id, d, now) {
  function tulis(list, jenis) {
    list.forEach(function (x) {
      tambah_(SHEET.SHIFT_DETAIL, { ID: buatId_('SDT'), ID_Shift: id, Jenis: jenis, Kode_Item: x.kode, Nama_Item: x.nama, Kualitas: x.kualitas, Qty_Kg: bulat_(x.qty, 3), Waktu: now });
    });
  }
  tulis(d.ambil, JENIS_SHIFT.AMBIL); tulis(d.hasil, JENIS_SHIFT.HASIL); tulis(d.bs, JENIS_SHIFT.BS); tulis(d.roll, JENIS_SHIFT.PAKAI_ROLL);
}

function ringkasShift_(r, u, detCache) {
  var det = (detCache || baca_(SHEET.SHIFT_DETAIL)).filter(function (d) { return d.ID_Shift === r.ID; });
  function ambil(jenis) {
    return det.filter(function (d) { return d.Jenis === jenis; })
      .map(function (d) { return { kode: d.Kode_Item, nama: d.Nama_Item, kualitas: d.Kualitas || '', qty: angka_(d.Qty_Kg) }; });
  }
  var totalHasil = angka_(r.Total_Hasil_Kg), totalBs = angka_(r.Total_BS_Kg);
  var dasar = r.Mesin === MESIN.BLOWING ? angka_(r.Total_Ambil_Kg) : angka_(r.Total_Roll_Pakai_Kg);
  return {
    id: r.ID, waktu: jam_(r.Waktu), tanggal: r.Tanggal, shift: String(r.Shift), mesin: r.Mesin,
    operator: String(r.Operator || '').split(',').map(function (s) { return s.trim(); }).filter(String),
    ambil: ambil(JENIS_SHIFT.AMBIL), hasil: ambil(JENIS_SHIFT.HASIL), bs: ambil(JENIS_SHIFT.BS), roll: ambil(JENIS_SHIFT.PAKAI_ROLL),
    totalAmbil: angka_(r.Total_Ambil_Kg), totalHasil: totalHasil, totalBs: totalBs, totalRoll: angka_(r.Total_Roll_Pakai_Kg),
    persenBs: dasar > 0 ? bulat_(totalBs / dasar * 100, 2) : (totalHasil + totalBs > 0 ? bulat_(totalBs / (totalHasil + totalBs) * 100, 2) : 0),
    pencatat: r.Nama_Pencatat, foto: r.Foto_URL || '', catatan: r.Catatan || '', logEdit: r.Log_Edit || '', status: r.Status,
    bolehEdit: !!u && bolehShift_(u) && r.Status !== STATUS_SHIFT.DIBATALKAN && !bulanTertutup_(r.Tanggal)
  };
}

/** Daftar laporan shift N hari terakhir (semua peran boleh lihat — tidak ada harga di sini). */
function daftarLaporanShift(ident, hari, tanggal) {
  var u = penggunaSaatIni_(ident);
  var batas = new Date(); batas.setDate(batas.getDate() - (hari || 14));
  var batasStr = tglStr_(batas), det = baca_(SHEET.SHIFT_DETAIL);
  return baca_(SHEET.SHIFT).filter(function (r) {
    if (r.Status === STATUS_SHIFT.DIBATALKAN) return false;
    if (tanggal) return String(r.Tanggal) === String(tanggal);
    return String(r.Tanggal) >= batasStr;
  }).map(function (r) { return ringkasShift_(r, u, det); })
    .sort(function (a, b) { return (b.tanggal + b.shift + b.mesin).localeCompare(a.tanggal + a.shift + a.mesin); });
}

function ambilLaporanShift(id, ident) {
  var u = penggunaSaatIni_(ident);
  return ringkasShift_(cariEntri_(SHEET.SHIFT, id), u);
}

/** Ganti isi laporan (detail lama dihapus, ditulis ulang). Manager / Admin. */
function ubahLaporanShift(id, p, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehShift_(u)) throw new Error('Hanya Manager / Admin.');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();
  try {
    var r = cariEntri_(SHEET.SHIFT, id);
    if (r.Status === STATUS_SHIFT.DIBATALKAN) throw new Error('Laporan sudah dibatalkan.');
    if (bulanTertutup_(r.Tanggal)) throw new Error('Bulan ' + String(r.Tanggal).slice(0, 7) + ' sudah ditutup — laporan tidak bisa diubah.');
    p = p || {};
    var gab = { tanggal: p.tanggal || r.Tanggal, shift: p.shift || r.Shift, mesin: p.mesin || r.Mesin, operator: p.operator !== undefined ? p.operator : r.Operator,
                ambil: p.ambil, hasil: p.hasil, bs: p.bs };
    var lama = ringkasShift_(r, u);
    if (gab.ambil === undefined) gab.ambil = lama.ambil;
    if (gab.hasil === undefined) gab.hasil = lama.hasil;
    if (gab.bs === undefined) gab.bs = lama.bs;
    var d = susunShift_(gab);
    if (bulanTertutup_(d.tanggal)) throw new Error('Bulan ' + d.tanggal.slice(0, 7) + ' sudah ditutup.');
    var sh = sheet_(SHEET.SHIFT_DETAIL);
    baca_(SHEET.SHIFT_DETAIL).filter(function (x) { return x.ID_Shift === id; }).map(function (x) { return x._baris; })
      .sort(function (a, b) { return b - a; }).forEach(function (baris) { sh.deleteRow(baris); });
    lupakanMemo_(SHEET.SHIFT_DETAIL);
    var now = new Date();
    tulisDetailShift_(id, d, now);
    var log = [];
    if (String(r.Tanggal) !== d.tanggal) log.push('tanggal ' + r.Tanggal + ' → ' + d.tanggal);
    if (String(r.Shift) !== d.shift) log.push('shift ' + r.Shift + ' → ' + d.shift);
    if (r.Operator !== d.operator) log.push('operator: ' + d.operator);
    if (angka_(r.Total_Ambil_Kg) !== bulat_(d.totalAmbil, 3)) log.push('ambil ' + angka_(r.Total_Ambil_Kg) + ' → ' + bulat_(d.totalAmbil, 2) + ' kg');
    if (angka_(r.Total_Hasil_Kg) !== bulat_(d.totalHasil, 3)) log.push('hasil ' + angka_(r.Total_Hasil_Kg) + ' → ' + bulat_(d.totalHasil, 2) + ' kg');
    if (angka_(r.Total_BS_Kg) !== bulat_(d.totalBs, 3)) log.push('BS ' + angka_(r.Total_BS_Kg) + ' → ' + bulat_(d.totalBs, 2) + ' kg');
    if (!log.length) log.push('rincian diubah');
    var stempel = Utilities.formatDate(now, APP.zona, 'dd/MM HH:mm') + ' ' + u.nama + ': ' + log.join('; ');
    ubahBaris_(SHEET.SHIFT, r._baris, {
      Tanggal: d.tanggal, Shift: d.shift, Mesin: d.mesin, Operator: d.operator,
      Total_Ambil_Kg: bulat_(d.totalAmbil, 3), Total_Hasil_Kg: bulat_(d.totalHasil, 3), Total_BS_Kg: bulat_(d.totalBs, 3), Total_Roll_Pakai_Kg: bulat_(d.totalRoll, 3),
      Catatan: p.catatan !== undefined ? p.catatan : r.Catatan, Log_Edit: [r.Log_Edit, stempel].filter(String).join('\n')
    });
    catatLog_('SHIFT_UBAH', id, log.join('; '));
    return { ok: true, log: log, laporan: ringkasShift_(cariEntri_(SHEET.SHIFT, id), u) };
  } finally { lock.releaseLock(); }
}

function batalkanLaporanShift(id, alasan, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehShift_(u)) throw new Error('Hanya Manager / Admin.');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();
  try {
    var r = cariEntri_(SHEET.SHIFT, id);
    if (r.Status === STATUS_SHIFT.DIBATALKAN) throw new Error('Laporan sudah dibatalkan.');
    if (bulanTertutup_(r.Tanggal)) throw new Error('Bulan ' + String(r.Tanggal).slice(0, 7) + ' sudah ditutup.');
    var stempel = Utilities.formatDate(new Date(), APP.zona, 'dd/MM HH:mm') + ' ' + u.nama + ': dibatalkan' + (alasan ? ' — ' + alasan : '');
    ubahBaris_(SHEET.SHIFT, r._baris, { Status: STATUS_SHIFT.DIBATALKAN, Log_Edit: [r.Log_Edit, stempel].filter(String).join('\n') });
    catatLog_('SHIFT_BATAL', id, alasan || '');
    return { ok: true };
  } finally { lock.releaseLock(); }
}

/** Laporan shift yang dihitung di stok (AKTIF) — detail + peta id → laporan. */
function shiftAktif_() {
  var aktif = {};
  baca_(SHEET.SHIFT).forEach(function (r) { if (r.Status !== STATUS_SHIFT.DIBATALKAN) aktif[r.ID] = r; });
  return aktif;
}

/**
 * Laporan produksi: per hari / mesin / operator / kualitas — kg hasil, BS, % BS, biji plastik masuk.
 * bulan 'YYYY-MM' (default bulan ini). Tidak ada harga → semua peran boleh.
 */
function laporanProduksi(bulan, ident) {
  penggunaSaatIni_(ident);
  bulan = /^\d{4}-\d{2}$/.test(String(bulan || '')) ? String(bulan) : tglStr_(new Date()).slice(0, 7);
  var aktif = shiftAktif_(), det = baca_(SHEET.SHIFT_DETAIL);
  var perMesin = {}, perOperator = {}, perKualitas = {}, perHari = {}, tot = { shift: 0, ambil: 0, roll: 0, jadi: 0, bs: 0, rollPakai: 0 };
  function sel(m, k, init) { if (!m[k]) m[k] = init(); return m[k]; }
  Object.keys(aktif).forEach(function (id) {
    var r = aktif[id];
    if (!dalamBulan_(r.Tanggal, bulan)) return;
    tot.shift++;
    var blow = r.Mesin === MESIN.BLOWING;
    var hasil = angka_(r.Total_Hasil_Kg), bs = angka_(r.Total_BS_Kg), ambil = angka_(r.Total_Ambil_Kg), rp = angka_(r.Total_Roll_Pakai_Kg);
    tot.ambil += ambil; tot.bs += bs; if (blow) tot.roll += hasil; else { tot.jadi += hasil; tot.rollPakai += rp; }
    var pm = sel(perMesin, r.Mesin, function () { return { mesin: r.Mesin, shift: 0, masuk: 0, hasil: 0, bs: 0 }; });
    pm.shift++; pm.masuk += blow ? ambil : rp; pm.hasil += hasil; pm.bs += bs;
    var ph = sel(perHari, r.Tanggal, function () { return { tanggal: r.Tanggal, shift: 0, ambil: 0, roll: 0, jadi: 0, bs: 0 }; });
    ph.shift++; ph.ambil += ambil; ph.bs += bs; if (blow) ph.roll += hasil; else ph.jadi += hasil;
    String(r.Operator || '').split(',').map(function (s) { return s.trim(); }).filter(String).forEach(function (op) {
      var po = sel(perOperator, op + '|' + r.Mesin, function () { return { operator: op, mesin: r.Mesin, shift: 0, hasil: 0, bs: 0 }; });
      po.shift++; po.hasil += hasil; po.bs += bs;
    });
  });
  det.forEach(function (d) {
    var r = aktif[d.ID_Shift]; if (!r || !dalamBulan_(r.Tanggal, bulan)) return;
    var q = d.Kualitas || '(tanpa kualitas)';
    var pk = sel(perKualitas, q, function () { return { kualitas: q, nama: NAMA_KUALITAS[q] || q, roll: 0, jadi: 0, bs: 0, rollPakai: 0 }; });
    var qty = angka_(d.Qty_Kg);
    if (d.Jenis === JENIS_SHIFT.HASIL) { if (r.Mesin === MESIN.BLOWING) pk.roll += qty; else pk.jadi += qty; }
    else if (d.Jenis === JENIS_SHIFT.BS) pk.bs += qty;
    else if (d.Jenis === JENIS_SHIFT.PAKAI_ROLL) pk.rollPakai += qty;
  });
  function rapikan(o, dasar) { Object.keys(o).forEach(function (k) { if (typeof o[k] === 'number') o[k] = bulat_(o[k], 2); }); o.persenBs = dasar > 0 ? bulat_(o.bs / dasar * 100, 2) : 0; return o; }
  return {
    bulan: bulan,
    total: rapikan(tot, tot.ambil),
    perMesin: Object.keys(perMesin).map(function (k) { return rapikan(perMesin[k], perMesin[k].masuk); }),
    perOperator: Object.keys(perOperator).map(function (k) { return rapikan(perOperator[k], perOperator[k].hasil + perOperator[k].bs); }).sort(function (a, b) { return b.hasil - a.hasil; }),
    perKualitas: Object.keys(perKualitas).map(function (k) { return rapikan(perKualitas[k], perKualitas[k].jadi + perKualitas[k].bs); }),
    perHari: Object.keys(perHari).sort().map(function (k) { return rapikan(perHari[k], perHari[k].ambil); })
  };
}

/* ==== TutupBulan.gs ==== */
/*************************************************************************
 * IPC — Inventory & Production Control (v10)
 * File 8 : TutupBulan.gs
 *
 * Tutup buku bulanan. HPP tidak dihitung per pekerjaan lagi; laba kotor
 * dihitung periodik dari nilai stok (harga rata-rata):
 *
 *   COGS = stok awal + pembelian − retur supplier + jasa chassen + biaya proses − stok akhir
 *   Laba kotor = penjualan (harga SO) − COGS
 *
 * Susut produksi kelihatan di sini (bukan per shift):
 *   susut = biji masuk blowing − polybag jadi − BS (blowing + cutting) − perubahan stok roll
 *   ditambah selisih minus stock opname bulan itu.
 *
 * Setelah bulan ditutup: transaksi bertanggal di bulan itu tidak bisa ditambah / diubah /
 * dibatalkan (dijaga lewat tglValid_, alasanKunci_, terapkanEdit_, tinjauTransfer, modul
 * shift & daur ulang). Admin bisa membuka lagi (bukaBulan) — tercatat di log.
 *************************************************************************/

/* =================================================================
   STATUS TUTUP — baris terakhir per bulan yang berlaku
   ================================================================= */

function petaTutup_() {
  var m = {};
  var rows = [];
  try { rows = baca_(SHEET.TUTUP); } catch (e) { rows = []; }   // sebelum migrasi: belum ada sheet
  rows.forEach(function (r) { m[String(r.Bulan)] = r; });        // urutan baris = urutan waktu → terakhir menang
  return m;
}
function bulanTertutup_(tanggal) {
  var b = String(tanggal || '').slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(b)) return false;
  var r = petaTutup_()[b];
  return !!r && r.Status === STATUS_TUTUP.DITUTUP;
}
function bulanTerakhirTertutup_() {
  var m = petaTutup_(), akhir = '';
  Object.keys(m).forEach(function (b) { if (m[b].Status === STATUS_TUTUP.DITUTUP && b > akhir) akhir = b; });
  return akhir;
}
function bulanSebelum_(bulan) {
  var y = parseInt(bulan.slice(0, 4), 10), m = parseInt(bulan.slice(5, 7), 10) - 1;
  if (m < 1) { m = 12; y--; }
  return y + '-' + String(m).padStart(2, '0');
}
function bulanValid_(bulan) {
  bulan = String(bulan || '').trim();
  if (!/^\d{4}-\d{2}$/.test(bulan)) throw new Error('Format bulan harus YYYY-MM.');
  var m = parseInt(bulan.slice(5, 7), 10); if (m < 1 || m > 12) throw new Error('Bulan tidak valid.');
  return bulan;
}

/* =================================================================
   PERHITUNGAN — dipakai laporanBulanan, tutupBulan, eksporBulanan
   ================================================================= */

/** rataAkhir opsional (hasil hitungRata_(akhirBulan_(bulan))) supaya tidak dihitung dua kali. */
function laporanBulanan_(bulan, rataAkhir) {
  var peta = petaItem_();
  var akhir = akhirBulan_(bulan), awal = akhirBulan_(bulanSebelum_(bulan));
  var rAkhir = rataAkhir || hitungRata_(akhir), rAwal = hitungRata_(awal);
  function nilaiPos(P, kategori) {
    var n = 0, q = 0;
    Object.keys(P).forEach(function (k) {
      if (P[k].qty <= 0.0001) return;
      if (kategori && (!peta[k] || peta[k].kategori !== kategori)) return;
      n += P[k].nilai; q += P[k].qty;
    });
    return { nilai: n, qty: q };
  }
  var stokAwal = nilaiPos(rAwal.pos), stokAkhir = nilaiPos(rAkhir.pos);
  var perKategori = {};
  [KATEGORI_ITEM.BAHAN_BAKU, KATEGORI_ITEM.ROLL, KATEGORI_ITEM.BARANG_JADI, KATEGORI_ITEM.SCRAP, KATEGORI_ITEM.KEDUANYA].forEach(function (k) {
    var a = nilaiPos(rAwal.pos, k), z = nilaiPos(rAkhir.pos, k);
    if (a.qty > 0.0001 || z.qty > 0.0001) perKategori[k] = { awalKg: bulat_(a.qty, 2), awal: bulat_(a.nilai, 0), akhirKg: bulat_(z.qty, 2), akhir: bulat_(z.nilai, 0) };
  });

  /* pembelian & retur supplier (nilai dari harga penerimaan / PO / master) */
  var poHarga = {}; baca_(SHEET.PO).forEach(function (r) { poHarga[r.ID] = angka_(r.Harga_Per_Kg); });
  var beli = 0, beliKg = 0, retur = 0, returKg = 0;
  baca_(SHEET.PENERIMAAN).forEach(function (r) {
    if (!dalamBulan_(r.Tanggal, bulan) || !dihitung_(r)) return;
    var q = angka_(r.Qty_Kg);
    if (r.Jenis === JENIS_PENERIMAAN.RETUR) { retur += angka_(rAkhir.biaya[r.ID]); returKg += q; return; }
    var harga = angka_(r.Harga_Per_Kg) || (r.ID_PO && poHarga[r.ID_PO]) || (peta[r.Kode_Item] ? peta[r.Kode_Item].harga : 0);
    beli += q * harga; beliKg += q;
  });

  /* penjualan (harga SO) & pengiriman */
  var soById = {}; baca_(SHEET.SO).forEach(function (r) { soById[r.ID] = r; });
  var jual = 0, jualKg = 0, jualTanpaSoKg = 0, returCustKg = 0, hppJual = 0;
  baca_(SHEET.PENGIRIMAN).forEach(function (r) {
    if (!dalamBulan_(r.Tanggal, bulan) || !dihitung_(r)) return;
    var q = angka_(r.Qty_Kg);
    if (r.Jenis === JENIS_PENGIRIMAN.RETUR_MASUK) { returCustKg += q; return; }
    jualKg += q; hppJual += angka_(rAkhir.biaya[r.ID]);
    var so = r.ID_SO ? soById[r.ID_SO] : null;
    if (so) jual += q * angka_(so.Harga_Per_Kg); else jualTanpaSoKg += q;
  });

  /* jasa chassen: batch selesai (diterima) di bulan itu */
  var jasa = 0, daurBatch = 0, daurScrapKg = 0, daurHasilKg = 0;
  baca_(SHEET.DAUR).forEach(function (r) {
    if (r.Status !== STATUS_DAUR.SELESAI || !r.Waktu_Terima) return;
    var tglT = r.Tanggal_Terima || tglStr_(new Date(r.Waktu_Terima));
    if (!dalamBulan_(tglT, bulan)) return;
    jasa += angka_(r.Biaya_Jasa); daurBatch++; daurScrapKg += angka_(r.Total_Scrap_Kg); daurHasilKg += angka_(r.Total_Hasil_Kg);
  });

  /* produksi: laporan shift bulan itu */
  var pr = { shift: 0, blowing: 0, cutting: 0, ambilKg: 0, rollKg: 0, rollPakaiKg: 0, jadiKg: 0, bsBlowingKg: 0, bsCuttingKg: 0, proses: 0, nilaiBahan: 0 };
  var jadiPerKualitas = {}, bsPerKualitas = {}, detShift = {};
  baca_(SHEET.SHIFT_DETAIL).forEach(function (d) { (detShift[d.ID_Shift] = detShift[d.ID_Shift] || []).push(d); });
  baca_(SHEET.SHIFT).forEach(function (r) {
    if (r.Status === STATUS_SHIFT.DIBATALKAN || !dalamBulan_(r.Tanggal, bulan)) return;
    pr.shift++; pr.proses += angka_(rAkhir.proses[r.ID]); pr.nilaiBahan += angka_(rAkhir.biaya[r.ID]);
    var hasil = angka_(r.Total_Hasil_Kg), bs = angka_(r.Total_BS_Kg);
    if (r.Mesin === MESIN.BLOWING) { pr.blowing++; pr.ambilKg += angka_(r.Total_Ambil_Kg); pr.rollKg += hasil; pr.bsBlowingKg += bs; }
    else { pr.cutting++; pr.rollPakaiKg += angka_(r.Total_Roll_Pakai_Kg); pr.jadiKg += hasil; pr.bsCuttingKg += bs; }
    (detShift[r.ID] || []).forEach(function (x) {
      var k = x.Kualitas || '-', q = angka_(x.Qty_Kg);
      if (x.Jenis === JENIS_SHIFT.HASIL && r.Mesin === MESIN.CUTTING) jadiPerKualitas[k] = (jadiPerKualitas[k] || 0) + q;
      else if (x.Jenis === JENIS_SHIFT.BS) bsPerKualitas[k] = (bsPerKualitas[k] || 0) + q;
    });
  });
  var bsKg = pr.bsBlowingKg + pr.bsCuttingKg;
  var rollPerubahan = pr.rollKg - pr.rollPakaiKg;                       // roll bertambah (+) / berkurang (−)
  var susutProduksi = pr.ambilKg - pr.jadiKg - bsKg - rollPerubahan;     // = ambil − roll hasil − BS blowing

  /* selisih opname bulan itu (minus = susut / hilang, plus = temuan) */
  var opnameMinus = 0, opnamePlus = 0, opnameSesi = {};
  baca_(SHEET.OPNAME).forEach(function (r) {
    if (!dalamBulan_(r.Tanggal, bulan)) return;
    opnameSesi[r.ID_Sesi] = 1;
    var d = angka_(r.Selisih); if (d < 0) opnameMinus += -d; else opnamePlus += d;
  });
  var susutKg = susutProduksi + opnameMinus - opnamePlus;
  var susutPersen = pr.ambilKg > 0 ? bulat_(susutKg / pr.ambilKg * 100, 2) : 0;

  /* barang rusak disetujui */
  var rusak = 0, rusakKg = 0;
  baca_(SHEET.KERUSAKAN).forEach(function (r) {
    if (r.Status !== STATUS_TRANSFER.DISETUJUI || !dalamBulan_(r.Tanggal, bulan)) return;
    rusak += angka_(rAkhir.biaya[r.ID]); rusakKg += angka_(r.Qty_Kg);
  });

  var cogs = stokAwal.nilai + beli - retur + jasa + pr.proses - stokAkhir.nilai;
  var labaKotor = jual - cogs;
  return {
    bulan: bulan, mataUang: mataUang_(),
    nilaiStokAwal: bulat_(stokAwal.nilai, 0), stokAwalKg: bulat_(stokAwal.qty, 2),
    pembelian: bulat_(beli, 0), pembelianKg: bulat_(beliKg, 2),
    returSupplier: bulat_(retur, 0), returSupplierKg: bulat_(returKg, 2),
    jasaChassen: bulat_(jasa, 0), biayaProses: bulat_(pr.proses, 0),
    nilaiStokAkhir: bulat_(stokAkhir.nilai, 0), stokAkhirKg: bulat_(stokAkhir.qty, 2),
    cogs: bulat_(cogs, 0),
    penjualan: bulat_(jual, 0), penjualanKg: bulat_(jualKg, 2), penjualanTanpaSoKg: bulat_(jualTanpaSoKg, 2), returCustomerKg: bulat_(returCustKg, 2),
    hppPengiriman: bulat_(hppJual, 0),                                   // pembanding: nilai rata-rata barang yang dikirim
    labaKotor: bulat_(labaKotor, 0),
    marginPersen: jual > 0 ? bulat_(labaKotor / jual * 100, 2) : 0,
    produksi: {
      shift: pr.shift, blowing: pr.blowing, cutting: pr.cutting,
      masukProduksiKg: bulat_(pr.ambilKg, 2), rollKg: bulat_(pr.rollKg, 2), rollPakaiKg: bulat_(pr.rollPakaiKg, 2),
      hasilJadiKg: bulat_(pr.jadiKg, 2), bsBlowingKg: bulat_(pr.bsBlowingKg, 2), bsCuttingKg: bulat_(pr.bsCuttingKg, 2), bsKg: bulat_(bsKg, 2),
      nilaiBahan: bulat_(pr.nilaiBahan, 0), biayaProses: bulat_(pr.proses, 0),
      jadiPerKualitas: jadiPerKualitas, bsPerKualitas: bsPerKualitas
    },
    susut: {
      produksiKg: bulat_(susutProduksi, 2), opnameMinusKg: bulat_(opnameMinus, 2), opnamePlusKg: bulat_(opnamePlus, 2),
      sesiOpname: Object.keys(opnameSesi).length, totalKg: bulat_(susutKg, 2), persen: susutPersen
    },
    rollPerubahanKg: bulat_(rollPerubahan, 2),
    daurUlang: { batch: daurBatch, scrapKg: bulat_(daurScrapKg, 2), hasilKg: bulat_(daurHasilKg, 2), jasa: bulat_(jasa, 0) },
    rusak: { nilai: bulat_(rusak, 0), kg: bulat_(rusakKg, 2) },
    perKategori: perKategori,
    // ringkas untuk header Tutup_Bulan
    masukProduksiKg: bulat_(pr.ambilKg, 2), hasilJadiKg: bulat_(pr.jadiKg, 2), bsKg: bulat_(bsKg, 2),
    susutKg: bulat_(susutKg, 2), susutPersen: susutPersen
  };
}

function ringkasTutup_(r) {
  var det = {}; try { det = JSON.parse(r.Detail_JSON || '{}'); } catch (e) {}
  return {
    id: r.ID, bulan: r.Bulan, waktu: r.Waktu, oleh: r.Nama_Penutup, status: r.Status, catatan: r.Catatan || '',
    nilaiStokAwal: angka_(r.Nilai_Stok_Awal), pembelian: angka_(r.Pembelian), returSupplier: angka_(r.Retur_Supplier),
    jasaChassen: angka_(r.Biaya_Jasa_Chassen), biayaProses: angka_(r.Biaya_Proses), nilaiStokAkhir: angka_(r.Nilai_Stok_Akhir),
    cogs: angka_(r.COGS), penjualan: angka_(r.Penjualan), labaKotor: angka_(r.Laba_Kotor),
    masukProduksiKg: angka_(r.Masuk_Produksi_Kg), hasilJadiKg: angka_(r.Hasil_Jadi_Kg), bsKg: angka_(r.BS_Kg),
    rollPerubahanKg: angka_(r.Roll_Perubahan_Kg), susutKg: angka_(r.Susut_Kg), susutPersen: angka_(r.Susut_Persen),
    detail: det
  };
}

/* =================================================================
   RPC — Manager / Admin
   ================================================================= */

/** Laporan laba kotor & susut satu bulan (hitung langsung; kalau bulan sudah ditutup, snapshot ikut dikirim). */
function laporanBulanan(bulan, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehLihatHpp_(u)) throw new Error('Laporan bulanan hanya untuk Manager / Admin.');
  bulan = bulan ? bulanValid_(bulan) : bulanSebelum_(tglStr_(new Date()).slice(0, 7));
  var lap = laporanBulanan_(bulan);
  var t = petaTutup_()[bulan];
  lap.tertutup = !!t && t.Status === STATUS_TUTUP.DITUTUP;
  lap.snapshot = t ? ringkasTutup_(t) : null;
  lap.bulanIni = tglStr_(new Date()).slice(0, 7);
  lap.bolehTutup = bolehReview_(u) && !lap.tertutup && bulan < lap.bulanIni;
  lap.bolehBuka = bolehAdmin_(u) && lap.tertutup && bulan === bulanTerakhirTertutup_();
  return lap;
}

/** Tutup bulan: simpan snapshot, kunci transaksi bulan itu. Hanya bulan yang sudah lewat. */
function tutupBulan(bulan, catatan, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehReview_(u)) throw new Error('Hanya Manager / Admin yang bisa menutup bulan.');
  bulan = bulanValid_(bulan);
  var bulanIni = tglStr_(new Date()).slice(0, 7);
  if (bulan >= bulanIni) throw new Error('Bulan ' + bulan + ' belum selesai — tutup buku hanya untuk bulan yang sudah lewat.');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();
  try {
    var m = petaTutup_();
    if (m[bulan] && m[bulan].Status === STATUS_TUTUP.DITUTUP) throw new Error('Bulan ' + bulan + ' sudah ditutup.');
    var akhir = bulanTerakhirTertutup_();
    if (akhir && bulan < akhir) throw new Error('Bulan ' + akhir + ' sudah ditutup lebih dulu — buka dulu bulan itu kalau mau menutup ' + bulan + '.');
    var lap = laporanBulanan_(bulan), id = buatId_('TTP');
    tambah_(SHEET.TUTUP, {
      ID: id, Bulan: bulan, Waktu: new Date(), Ditutup_Oleh: penandaPencatat_(u), Nama_Penutup: u.nama,
      Nilai_Stok_Awal: lap.nilaiStokAwal, Pembelian: lap.pembelian, Retur_Supplier: lap.returSupplier,
      Biaya_Jasa_Chassen: lap.jasaChassen, Biaya_Proses: lap.biayaProses, Nilai_Stok_Akhir: lap.nilaiStokAkhir, COGS: lap.cogs,
      Penjualan: lap.penjualan, Laba_Kotor: lap.labaKotor,
      Masuk_Produksi_Kg: lap.masukProduksiKg, Hasil_Jadi_Kg: lap.hasilJadiKg, BS_Kg: lap.bsKg, Roll_Perubahan_Kg: lap.rollPerubahanKg,
      Susut_Kg: lap.susutKg, Susut_Persen: lap.susutPersen,
      Detail_JSON: JSON.stringify({ produksi: lap.produksi, susut: lap.susut, daurUlang: lap.daurUlang, rusak: lap.rusak, perKategori: lap.perKategori,
                                    penjualanKg: lap.penjualanKg, penjualanTanpaSoKg: lap.penjualanTanpaSoKg, hppPengiriman: lap.hppPengiriman, marginPersen: lap.marginPersen }),
      Catatan: catatan || '', Status: STATUS_TUTUP.DITUTUP
    });
    catatLog_('TUTUP_BULAN', bulan, u.nama + ' • COGS ' + mataUang_() + ' ' + lap.cogs + ' • laba kotor ' + lap.labaKotor + ' • susut ' + lap.susutKg + ' kg (' + lap.susutPersen + '%)');
    return { ok: true, id: id, bulan: bulan, cogs: lap.cogs, labaKotor: lap.labaKotor, susutKg: lap.susutKg, susutPersen: lap.susutPersen };
  } finally { lock.releaseLock(); }
}

/** Buka lagi bulan yang sudah ditutup (Admin saja, hanya bulan tertutup terakhir). */
function bukaBulan(bulan, alasan, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehAdmin_(u)) throw new Error('Hanya Admin yang bisa membuka bulan yang sudah ditutup.');
  bulan = bulanValid_(bulan);
  if (!String(alasan || '').trim()) throw new Error('Alasan membuka bulan wajib diisi.');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();
  try {
    var m = petaTutup_(), r = m[bulan];
    if (!r || r.Status !== STATUS_TUTUP.DITUTUP) throw new Error('Bulan ' + bulan + ' tidak dalam keadaan tertutup.');
    if (bulan !== bulanTerakhirTertutup_()) throw new Error('Hanya bulan tertutup terakhir (' + bulanTerakhirTertutup_() + ') yang bisa dibuka.');
    ubahBaris_(SHEET.TUTUP, r._baris, { Status: STATUS_TUTUP.DIBUKA, Catatan: [r.Catatan, 'dibuka ' + Utilities.formatDate(new Date(), APP.zona, 'dd/MM/yyyy HH:mm') + ' oleh ' + u.nama + ': ' + alasan].filter(String).join(' | ') });
    catatLog_('BUKA_BULAN', bulan, u.nama + ' — ' + alasan);
    return { ok: true, bulan: bulan };
  } finally { lock.releaseLock(); }
}

/** Daftar bulan yang pernah ditutup (terbaru dulu) + bulan yang belum ditutup sampai bulan lalu. */
function daftarTutupBulan(ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehLihatHpp_(u)) throw new Error('Hanya Manager / Admin.');
  var m = petaTutup_(), out = Object.keys(m).map(function (b) { return ringkasTutup_(m[b]); })
    .sort(function (a, b) { return a.bulan < b.bulan ? 1 : -1; });
  return { daftar: out, terakhirTertutup: bulanTerakhirTertutup_(), bulanIni: tglStr_(new Date()).slice(0, 7), bolehTutup: bolehReview_(u), bolehBuka: bolehAdmin_(u) };
}

  return {
    fns: globalThis,
    atur: function (o) { if ('APP' in o) APP = o.APP; if ('SHEET' in o) SHEET = o.SHEET; if ('HEADER' in o) HEADER = o.HEADER; if ('JENIS_PENERIMAAN' in o) JENIS_PENERIMAAN = o.JENIS_PENERIMAAN; if ('JENIS_PENGIRIMAN' in o) JENIS_PENGIRIMAN = o.JENIS_PENGIRIMAN; if ('STATUS_TRANSFER' in o) STATUS_TRANSFER = o.STATUS_TRANSFER; if ('MESIN' in o) MESIN = o.MESIN; if ('JENIS_SHIFT' in o) JENIS_SHIFT = o.JENIS_SHIFT; if ('STATUS_SHIFT' in o) STATUS_SHIFT = o.STATUS_SHIFT; if ('STATUS_TUTUP' in o) STATUS_TUTUP = o.STATUS_TUTUP; if ('DAFTAR_SHIFT' in o) DAFTAR_SHIFT = o.DAFTAR_SHIFT; if ('STATUS_DAUR' in o) STATUS_DAUR = o.STATUS_DAUR; if ('JENIS_DAUR_DETAIL' in o) JENIS_DAUR_DETAIL = o.JENIS_DAUR_DETAIL; if ('JENIS_PERMINTAAN' in o) JENIS_PERMINTAAN = o.JENIS_PERMINTAAN; if ('STATUS_PERMINTAAN' in o) STATUS_PERMINTAAN = o.STATUS_PERMINTAAN; if ('MAKS_MUNDUR_HARI' in o) MAKS_MUNDUR_HARI = o.MAKS_MUNDUR_HARI; if ('STATUS_PO' in o) STATUS_PO = o.STATUS_PO; if ('STATUS_INVOICE' in o) STATUS_INVOICE = o.STATUS_INVOICE; if ('STATUS_SO' in o) STATUS_SO = o.STATUS_SO; if ('KATEGORI_ITEM' in o) KATEGORI_ITEM = o.KATEGORI_ITEM; if ('KUALITAS' in o) KUALITAS = o.KUALITAS; if ('NAMA_KUALITAS' in o) NAMA_KUALITAS = o.NAMA_KUALITAS; if ('PERAN' in o) PERAN = o.PERAN; if ('LOKASI' in o) LOKASI = o.LOKASI; if ('DEFAULT_SUSUT_CHASSEN_PERSEN' in o) DEFAULT_SUSUT_CHASSEN_PERSEN = o.DEFAULT_SUSUT_CHASSEN_PERSEN; if ('DEFAULT_TOLERANSI_CHASSEN_PERSEN' in o) DEFAULT_TOLERANSI_CHASSEN_PERSEN = o.DEFAULT_TOLERANSI_CHASSEN_PERSEN; if ('DUMMY_ITEM' in o) DUMMY_ITEM = o.DUMMY_ITEM; if ('DUMMY_SUPPLIER' in o) DUMMY_SUPPLIER = o.DUMMY_SUPPLIER; if ('DUMMY_CUSTOMER' in o) DUMMY_CUSTOMER = o.DUMMY_CUSTOMER; if ('DUMMY_PENGGUNA' in o) DUMMY_PENGGUNA = o.DUMMY_PENGGUNA; if ('DEFAULT_SETTING' in o) DEFAULT_SETTING = o.DEFAULT_SETTING; if ('RPC_WL' in o) RPC_WL = o.RPC_WL; if ('KOLOM_TANGGAL_' in o) KOLOM_TANGGAL_ = o.KOLOM_TANGGAL_; if ('MEMO_BACA_' in o) MEMO_BACA_ = o.MEMO_BACA_; if ('BATCH_DICOBA_' in o) BATCH_DICOBA_ = o.BATCH_DICOBA_; if ('KOLOM_WAKTU_' in o) KOLOM_WAKTU_ = o.KOLOM_WAKTU_; if ('SERIAL_EPOCH_' in o) SERIAL_EPOCH_ = o.SERIAL_EPOCH_; if ('JENIS_RIWAYAT' in o) JENIS_RIWAYAT = o.JENIS_RIWAYAT; if ('PRIORITAS_EV_' in o) PRIORITAS_EV_ = o.PRIORITAS_EV_; if ('NAMA_FOLDER_BACKUP_' in o) NAMA_FOLDER_BACKUP_ = o.NAMA_FOLDER_BACKUP_; if ('SIMPAN_BACKUP_' in o) SIMPAN_BACKUP_ = o.SIMPAN_BACKUP_; },
    vars: function () { return { APP: APP, SHEET: SHEET, HEADER: HEADER, JENIS_PENERIMAAN: JENIS_PENERIMAAN, JENIS_PENGIRIMAN: JENIS_PENGIRIMAN, STATUS_TRANSFER: STATUS_TRANSFER, MESIN: MESIN, JENIS_SHIFT: JENIS_SHIFT, STATUS_SHIFT: STATUS_SHIFT, STATUS_TUTUP: STATUS_TUTUP, DAFTAR_SHIFT: DAFTAR_SHIFT, STATUS_DAUR: STATUS_DAUR, JENIS_DAUR_DETAIL: JENIS_DAUR_DETAIL, JENIS_PERMINTAAN: JENIS_PERMINTAAN, STATUS_PERMINTAAN: STATUS_PERMINTAAN, MAKS_MUNDUR_HARI: MAKS_MUNDUR_HARI, STATUS_PO: STATUS_PO, STATUS_INVOICE: STATUS_INVOICE, STATUS_SO: STATUS_SO, KATEGORI_ITEM: KATEGORI_ITEM, KUALITAS: KUALITAS, NAMA_KUALITAS: NAMA_KUALITAS, PERAN: PERAN, LOKASI: LOKASI, DEFAULT_SUSUT_CHASSEN_PERSEN: DEFAULT_SUSUT_CHASSEN_PERSEN, DEFAULT_TOLERANSI_CHASSEN_PERSEN: DEFAULT_TOLERANSI_CHASSEN_PERSEN, DUMMY_ITEM: DUMMY_ITEM, DUMMY_SUPPLIER: DUMMY_SUPPLIER, DUMMY_CUSTOMER: DUMMY_CUSTOMER, DUMMY_PENGGUNA: DUMMY_PENGGUNA, DEFAULT_SETTING: DEFAULT_SETTING, RPC_WL: RPC_WL, KOLOM_TANGGAL_: KOLOM_TANGGAL_, MEMO_BACA_: MEMO_BACA_, BATCH_DICOBA_: BATCH_DICOBA_, KOLOM_WAKTU_: KOLOM_WAKTU_, SERIAL_EPOCH_: SERIAL_EPOCH_, JENIS_RIWAYAT: JENIS_RIWAYAT, PRIORITAS_EV_: PRIORITAS_EV_, NAMA_FOLDER_BACKUP_: NAMA_FOLDER_BACKUP_, SIMPAN_BACKUP_: SIMPAN_BACKUP_ }; }
  };
}
