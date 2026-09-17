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
var PRIORITAS_EV_ = { MASUK: 0, RETUR_CUST: 0, JOB_SELESAI: 0, OPNAME: 1, KE_GP: 2, KE_GBJ: 2, JOB_MULAI: 3, RETUR: 3, JUAL: 3, RUSAK: 3 };

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
   HPP FIFO — mesin lapisan (batch) per item per lokasi
   ================================================================= */

/**
 * Putar ulang semua kejadian secara kronologis. Setiap penerimaan = lapisan {qty, harga}.
 * Pemakaian mengambil lapisan tertua dulu. Transfer memindahkan lapisan apa adanya.
 * Hasil: { lapisan: {kode:{GBJ:[...],GP:[...]}}, biaya: {idKejadian: nilai}, hargaJob: {idJob:{kode:hargaRata}} }
 */
function hitungFifo_() {
  var peta = petaItem_();
  var L = {};   // kode -> { GBJ:[{qty,harga,asal}], GP:[...] }
  function lap(kode, lok) { if (!L[kode]) L[kode] = { GBJ: [], GP: [] }; return L[kode][lok]; }
  function hargaCadangan(kode) {
    var q = 0, n = 0, l = L[kode];
    if (l) [l.GBJ, l.GP].forEach(function (arr) { arr.forEach(function (x) { q += x.qty; n += x.qty * x.harga; }); });
    if (q > 0) return n / q;
    return peta[kode] ? peta[kode].harga : 0;
  }
  function tambahLap(kode, lok, qty, harga, asal) { if (qty > 0) lap(kode, lok).push({ qty: qty, harga: harga, asal: asal }); }
  /** ambil qty dari lokasi (FIFO). Kalau lapisan kurang, sisanya dinilai harga cadangan. Kembalikan {nilai, lapisan:[{qty,harga,asal}]} */
  function ambil(kode, lok, qty, asalKhusus) {
    var arr = lap(kode, lok), sisa = qty, nilai = 0, diambil = [];
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
  Object.keys(peta).forEach(function (k) {
    tambahLap(k, 'GBJ', peta[k].awalGBJ || 0, peta[k].harga || 0, 'AWAL');
    tambahLap(k, 'GP',  peta[k].awalGP  || 0, peta[k].harga || 0, 'AWAL');
  });

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
  baca_(SHEET.TRANSFER).forEach(function (r) {
    if (!dihitung_(r)) return;
    ev.push({ k: kunciWaktu_(r.Tanggal, r.Waktu), t: r.Arah === ARAH.KE_PRODUKSI ? 'KE_GP' : 'KE_GBJ', r: r });
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
  baca_(SHEET.OPNAME).forEach(function (r) { ev.push({ k: kunciWaktu_(r.Tanggal, r.Waktu), t: 'OPNAME', r: r }); });
  baca_(SHEET.KERUSAKAN).forEach(function (r) {
    if (r.Status === STATUS_TRANSFER.DISETUJUI) ev.push({ k: kunciWaktu_(r.Tanggal, r.Waktu), t: 'RUSAK', r: r });
  });
  ev.sort(function (a, b) {
    if (a.k !== b.k) return a.k < b.k ? -1 : 1;
    /* satu pekerjaan yang mulai & selesai di milidetik yang sama: MULAI tetap lebih dulu */
    if (a.r === b.r && a.t !== b.t) return a.t === 'JOB_MULAI' ? -1 : 1;
    return (PRIORITAS_EV_[a.t] || 0) - (PRIORITAS_EV_[b.t] || 0);
  });

  var biaya = {}, hargaJob = {}, hppJob = {};
  ev.forEach(function (e) {
    var r = e.r, q;
    switch (e.t) {
      case 'MASUK':      tambahLap(r.Kode_Item, 'GBJ', angka_(r.Qty_Kg), e.harga || hargaCadangan(r.Kode_Item), r.ID); break;
      case 'RETUR':      biaya[r.ID] = ambil(r.Kode_Item, 'GBJ', angka_(r.Qty_Kg), r.ID_Penerimaan_Asal || null).nilai; break;
      case 'JUAL':       biaya[r.ID] = ambil(r.Kode_Item, 'GBJ', angka_(r.Qty_Kg)).nilai; break;
      case 'RETUR_CUST': tambahLap(r.Kode_Item, 'GBJ', angka_(r.Qty_Kg), hargaCadangan(r.Kode_Item), r.ID); break;
      case 'KE_GP':      ambil(r.Kode_Item, 'GBJ', angka_(r.Qty_Kg)).lapisan.forEach(function (x) { tambahLap(r.Kode_Item, 'GP', x.qty, x.harga, x.asal); }); break;
      case 'KE_GBJ':     ambil(r.Kode_Item, 'GP',  angka_(r.Qty_Kg)).lapisan.forEach(function (x) { tambahLap(r.Kode_Item, 'GBJ', x.qty, x.harga, x.asal); }); break;
      case 'RUSAK':      biaya[r.ID] = ambil(r.Kode_Item, r.Lokasi === LOKASI.GP ? 'GP' : 'GBJ', angka_(r.Qty_Kg)).nilai; break;
      case 'OPNAME':
        var d = angka_(r.Selisih), lok = r.Lokasi === LOKASI.GP ? 'GP' : 'GBJ';
        if (d > 0) tambahLap(r.Kode_Item, lok, d, hargaCadangan(r.Kode_Item), r.ID);
        else if (d < 0) biaya[r.ID] = ambil(r.Kode_Item, lok, -d).nilai;
        break;
      case 'JOB_MULAI':
        var tot = 0, hj = {};
        (detPerJob[r.ID] || []).forEach(function (d) {
          if (d.Jenis !== JENIS_DETAIL.BAHAN_BAKU) return;
          q = angka_(d.Qty_Kg); var h = ambil(d.Kode_Item, 'GP', q);
          tot += h.nilai; hj[d.Kode_Item] = q > 0 ? h.nilai / q : 0;
        });
        biaya[r.ID] = tot; hargaJob[r.ID] = hj; hppJob[r.ID] = tot;
        break;
      case 'JOB_SELESAI':
        var jadi = 0; (detPerJob[r.ID] || []).forEach(function (d) { if (d.Jenis === JENIS_DETAIL.BARANG_JADI) jadi += angka_(d.Qty_Kg); });
        var hppTotal = (hppJob[r.ID] || 0) + angka_(r.Total_Bahan_Baku_Kg) * biayaProsesPerKg_();
        var hpk = jadi > 0 ? hppTotal / jadi : 0;
        (detPerJob[r.ID] || []).forEach(function (d) {
          if (d.Jenis === JENIS_DETAIL.BARANG_JADI) tambahLap(d.Kode_Item, 'GP', angka_(d.Qty_Kg), hpk, r.ID);
          if (d.Jenis === JENIS_DETAIL.SCRAP)       tambahLap(d.Kode_Item, 'GP', angka_(d.Qty_Kg), 0, r.ID);
        });
        break;
    }
  });
  return { lapisan: L, biaya: biaya, hargaJob: hargaJob };
}

/** Harga rata-rata FIFO untuk qty yang akan dipakai SEKARANG dari GP (dari hasil hitungFifo_ yang sudah ada). */
function hargaDariFifo_(fifo, kode, qty, peta) {
  var L = fifo.lapisan, arr = (L[kode] && L[kode].GP) || [];
  var sisa = qty, nilai = 0;
  for (var i = 0; i < arr.length && sisa > 0; i++) { var a = Math.min(arr[i].qty, sisa); nilai += a * arr[i].harga; sisa -= a; }
  if (sisa > 0) {
    var q = 0, n = 0;
    [ (L[kode] && L[kode].GBJ) || [], arr ].forEach(function (x) { x.forEach(function (y) { q += y.qty; n += y.qty * y.harga; }); });
    nilai += sisa * (q > 0 ? n / q : (peta[kode] ? peta[kode].harga : 0));
  }
  var h = qty > 0 ? nilai / qty : 0;
  return h > 0 ? h : (peta[kode] ? peta[kode].harga : 0);
}

/** Harga FIFO barang yang keluar dari GBJ sekarang (untuk HPP penjualan). */
function hargaKeluarGbjFifo_(fifo, kode, qty, peta) {
  var L = fifo.lapisan, arr = (L[kode] && L[kode].GBJ) || [];
  var sisa = qty, nilai = 0;
  for (var i = 0; i < arr.length && sisa > 0; i++) { var a = Math.min(arr[i].qty, sisa); nilai += a * arr[i].harga; sisa -= a; }
  if (sisa > 0) nilai += sisa * (peta[kode] ? peta[kode].harga : 0);
  return qty > 0 ? bulat_(nilai / qty, 2) : 0;
}

/** Laporan nilai stok FIFO per item per lokasi (manager). */
function laporanNilaiStok(ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehLihatHpp_(u)) throw new Error('Hanya Manager / Admin.');
  var peta = petaItem_(), L = hitungFifo_().lapisan;
  var daftar = [], tot = { gbj: 0, gp: 0, nilaiGBJ: 0, nilaiGP: 0 };
  Object.keys(L).forEach(function (k) {
    function ringkas(arr) {
      var q = 0, n = 0; arr.forEach(function (x) { q += x.qty; n += x.qty * x.harga; });
      return { qty: bulat_(q, 2), nilai: bulat_(n, 0), rata: q > 0 ? bulat_(n / q, 0) : 0,
               lapisan: arr.map(function (x) { return { qty: bulat_(x.qty, 2), harga: bulat_(x.harga, 0), asal: x.asal }; }) };
    }
    var g = ringkas(L[k].GBJ), p = ringkas(L[k].GP);
    if (!g.qty && !p.qty) return;
    daftar.push({ kode: k, nama: peta[k] ? peta[k].nama : k, kategori: peta[k] ? peta[k].kategori : '', gbj: g, gp: p,
                  total: bulat_(g.qty + p.qty, 2), nilai: bulat_(g.nilai + p.nilai, 0) });
    tot.gbj += g.qty; tot.gp += p.qty; tot.nilaiGBJ += g.nilai; tot.nilaiGP += p.nilai;
  });
  daftar.sort(function (a, b) { return b.nilai - a.nilai; });
  Object.keys(tot).forEach(function (k) { tot[k] = bulat_(tot[k], 0); });
  tot.nilai = bulat_(tot.nilaiGBJ + tot.nilaiGP, 0);
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
    catatLog_('HPP_HITUNG_ULANG', '', diubah + ' pekerjaan diperbarui');
    return { ok: true, diubah: diubah };
  } finally { lock.releaseLock(); }
}

/* =================================================================
   BARANG RUSAK — staf mencatat, manager menyetujui
   ================================================================= */

/** p = { lokasi:'GBJ'|'GP', kode, qty, penyebab, tanggal, foto, catatan, ident } — HANYA STAF. */
function simpanKerusakan(p) {
  var u = penggunaSaatIni_(p && p.ident);
  if (bolehReview_(u)) throw new Error('Laporan barang rusak harus dicatat oleh STAF gudang (bukan manager).');
  if (!p || !p.kode) throw new Error('Item belum dipilih.');
  var lok = p.lokasi === LOKASI.GP ? LOKASI.GP : LOKASI.GBJ;
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
