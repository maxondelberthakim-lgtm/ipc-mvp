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
  migrasiV10_1_(ss);
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
/**
 * v10.1: Laporan_Shift dari "satu baris per mesin" (kolom Mesin + Operator) → "satu baris per shift" (Operator_Blowing / Operator_Cutting,
 * total per mesin). Detail mendapat kolom Mesin. Sheet lama diarsipkan sebagai *_lama. Aman diulang.
 */
function migrasiV10_1_(ss) {
  var sh = ss.getSheetByName(SHEET.SHIFT); if (!sh) return;
  var head = sh.getRange(1, 1, 1, sh.getMaxColumns()).getValues()[0].map(String);
  if (head.indexOf('Mesin') < 0) return;   // sudah format v10.1 (atau sheet kosong baru)
  lupakanMemo_();
  /* baca_() memakai HEADER v10.1 → sheet lama dibaca dengan header barisnya sendiri */
  function bacaLama(sheet) {
    if (!sheet || sheet.getLastRow() < 2) return [];
    var h = sheet.getRange(1, 1, 1, sheet.getMaxColumns()).getValues()[0].map(String);
    return sheet.getRange(2, 1, sheet.getLastRow() - 1, h.length).getValues().filter(function (v) { return v.join('') !== ''; }).map(function (v) {
      var o = {}; h.forEach(function (k, i) { if (!k) return; var x = v[i]; if (KOLOM_TANGGAL_.test(k) && Object.prototype.toString.call(x) === '[object Date]') x = tglStr_(x); o[k] = x; }); return o;
    });
  }
  var shD = ss.getSheetByName(SHEET.SHIFT_DETAIL);
  var lama = bacaLama(sh), detLama = bacaLama(shD);
  if (!ss.getSheetByName(SHEET.SHIFT + '_lama')) sh.setName(SHEET.SHIFT + '_lama'); else sh.setName(SHEET.SHIFT + '_lama2');
  if (shD) { if (!ss.getSheetByName(SHEET.SHIFT_DETAIL + '_lama')) shD.setName(SHEET.SHIFT_DETAIL + '_lama'); else shD.setName(SHEET.SHIFT_DETAIL + '_lama2'); }
  lupakanMemo_();
  [SHEET.SHIFT, SHEET.SHIFT_DETAIL].forEach(function (n) {
    var s2 = ss.insertSheet(n); s2.getRange(1, 1, 1, HEADER[n].length).setValues([HEADER[n]]); s2.setFrozenRows(1);
  });
  lupakanMemo_();
  /* gabungkan per tanggal+shift (yang AKTIF); yang dibatalkan dibiarkan di arsip */
  var grup = {}, urut = [];
  lama.forEach(function (r) {
    if (r.Status === STATUS_SHIFT.DIBATALKAN) return;
    var k = String(r.Tanggal) + '|' + String(r.Shift);
    if (!grup[k]) { grup[k] = { rows: [] }; urut.push(k); }
    grup[k].rows.push(r);
  });
  var detPer = {}; detLama.forEach(function (d) { (detPer[d.ID_Shift] = detPer[d.ID_Shift] || []).push(d); });
  urut.forEach(function (k) {
    var rows = grup[k], r0 = rows.rows[0], id = buatId_('SHF');
    var o = { ID: id, Waktu: r0.Waktu, Tanggal: r0.Tanggal, Shift: String(r0.Shift), Operator_Blowing: '', Operator_Cutting: '',
              Total_Ambil_Kg: 0, Total_Roll_Kg: 0, Total_BS_Blowing_Kg: 0, Total_Roll_Pakai_Kg: 0, Total_Polybag_Kg: 0, Total_BS_Cutting_Kg: 0,
              Dicatat_Oleh: r0.Dicatat_Oleh, Nama_Pencatat: r0.Nama_Pencatat, Foto_URL: r0.Foto_URL || '', Catatan: '', Log_Edit: '', Status: STATUS_SHIFT.AKTIF };
    var catatan = [], log = [];
    rows.rows.forEach(function (r) {
      var mesin = r.Mesin === MESIN.CUTTING ? MESIN.CUTTING : MESIN.BLOWING;
      if (mesin === MESIN.BLOWING) { o.Operator_Blowing = r.Operator; o.Total_Ambil_Kg += angka_(r.Total_Ambil_Kg); o.Total_Roll_Kg += angka_(r.Total_Hasil_Kg); o.Total_BS_Blowing_Kg += angka_(r.Total_BS_Kg); }
      else { o.Operator_Cutting = r.Operator; o.Total_Roll_Pakai_Kg += angka_(r.Total_Roll_Pakai_Kg); o.Total_Polybag_Kg += angka_(r.Total_Hasil_Kg); o.Total_BS_Cutting_Kg += angka_(r.Total_BS_Kg); }
      if (r.Catatan) catatan.push(r.Catatan); if (r.Log_Edit) log.push(r.Log_Edit);
      (detPer[r.ID] || []).forEach(function (d) {
        tambah_(SHEET.SHIFT_DETAIL, { ID: buatId_('SDT'), ID_Shift: id, Mesin: mesin, Jenis: d.Jenis, Kode_Item: d.Kode_Item, Nama_Item: d.Nama_Item, Kualitas: d.Kualitas || '', Qty_Kg: angka_(d.Qty_Kg), Waktu: d.Waktu || r0.Waktu });
      });
    });
    o.Catatan = catatan.join(' | '); o.Log_Edit = log.join('\n');
    tambah_(SHEET.SHIFT, o);
  });
  lupakanMemo_();
  catatLog_('MIGRASI_V10_1', '', urut.length + ' laporan shift digabung per shift');
}

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
        /* v10.1: satu laporan = dua mesin. Blowing: biji keluar (rata-rata) + biaya proses → roll. Cutting: roll keluar (rata-rata) → polybag. BS dinilai 0. */
        var det = detShift[r.ID] || [], totalNilai = 0, totalProses = 0;
        [MESIN.BLOWING, MESIN.CUTTING].forEach(function (mesin) {
          var dm = det.filter(function (x) { return (x.Mesin || (x.Jenis === JENIS_SHIFT.PAKAI_ROLL ? MESIN.CUTTING : MESIN.BLOWING)) === mesin; });
          var nilaiMasuk = 0, kgHasil = 0, kgAmbil = 0;
          dm.forEach(function (x) {
            var q = angka_(x.Qty_Kg);
            if (x.Jenis === JENIS_SHIFT.AMBIL || x.Jenis === JENIS_SHIFT.PAKAI_ROLL) { nilaiMasuk += keluar(x.Kode_Item, q); if (x.Jenis === JENIS_SHIFT.AMBIL) kgAmbil += q; }
            else if (x.Jenis === JENIS_SHIFT.HASIL) kgHasil += q;
          });
          var pr = mesin === MESIN.BLOWING ? kgAmbil * biayaProses : 0;
          var hargaHasil = kgHasil > 0 ? (nilaiMasuk + pr) / kgHasil : 0;
          dm.forEach(function (x) {
            var q = angka_(x.Qty_Kg);
            if (x.Jenis === JENIS_SHIFT.HASIL) masuk(x.Kode_Item, q, hargaHasil);
            else if (x.Jenis === JENIS_SHIFT.BS) masuk(x.Kode_Item, q, 0);   // BS dinilai 0 — nilainya muncul lagi lewat jasa chassen
          });
          totalNilai += nilaiMasuk; totalProses += pr;
        });
        proses[r.ID] = totalProses; biaya[r.ID] = totalNilai;
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
