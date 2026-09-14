/**********************************************************************
 * IPC — Inventory & Production Control (MVP v4)
 * File 2 of 3 : Server.gs
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

/* ================= UTIL SHEET ================= */

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function sheet_(nama) {
  var sh = ss_().getSheetByName(nama);
  if (!sh) throw new Error('Sheet "' + nama + '" belum ada. Jalankan setupSistem() dulu.');
  return sh;
}

function baca_(nama) {
  var sh = sheet_(nama);
  var lastRow = sh.getLastRow();
  var head = HEADER[nama];
  if (lastRow < 2) return [];
  var val = sh.getRange(2, 1, lastRow - 1, head.length).getValues();
  var out = [];
  for (var i = 0; i < val.length; i++) {
    if (val[i].join('') === '') continue;
    var o = { _baris: i + 2 };
    for (var c = 0; c < head.length; c++) o[head[c]] = val[i][c];
    out.push(o);
  }
  return out;
}

function tambah_(nama, obj) {
  var head = HEADER[nama];
  var row = head.map(function (h) { return (obj[h] === undefined || obj[h] === null) ? '' : obj[h]; });
  sheet_(nama).appendRow(row);
  return row;
}

function ubahBaris_(nama, baris, obj) {
  var head = HEADER[nama];
  var sh = sheet_(nama);
  Object.keys(obj).forEach(function (k) {
    var idx = head.indexOf(k);
    if (idx >= 0) sh.getRange(baris, idx + 1).setValue(obj[k]);
  });
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
  ident = ident || {};
  var email = emailAktif_();
  var emailAda = email && email !== 'anonim';

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
  var peran = getSetting_('PERAN_DEFAULT') || PERAN.STAF;
  var pinBenar = String(getSetting_('PIN_SUPERVISOR') || '').trim();
  if (pinBenar && String(ident.pin || '').trim() === pinBenar) peran = PERAN.SUPERVISOR;

  if (nama) {
    var pr = baca_(SHEET.PENGGUNA);
    for (var j = 0; j < pr.length; j++) {
      if (String(pr[j].Nama).toLowerCase().trim() === nama.toLowerCase() &&
          String(pr[j].Aktif).toUpperCase() !== 'TIDAK') {
        if (peran !== PERAN.SUPERVISOR) peran = pr[j].Peran || peran;
        break;
      }
    }
  }

  return { email: '', nama: nama || '(belum diisi)', peran: peran, lokasi: '',
           terdaftar: false, identitasManual: true, perluNama: !nama };
}

function bolehReview_(u) { return u.peran === PERAN.SUPERVISOR || u.peran === PERAN.ADMIN; }

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
      harga: angka_(r.Harga_Per_Kg),
      awalGBJ: angka_(r.Stok_Awal_GBJ), awalGP: angka_(r.Stok_Awal_GP)
    };
  });
  return peta;
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
  var trf = baca_(SHEET.TRANSFER);
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
    return r.Jenis === JENIS_PENERIMAAN.MASUK && tglStr_(new Date(r.Waktu)) === hariIni && dihitung_(r);
  }).reduce(function (a, r) { return a + angka_(r.Qty_Kg); }, 0);

  var keluarHariIni = snd.filter(function (r) {
    return r.Jenis === JENIS_PENGIRIMAN.KELUAR && tglStr_(new Date(r.Waktu)) === hariIni && dihitung_(r);
  }).reduce(function (a, r) { return a + angka_(r.Qty_Kg); }, 0);

  var susutTinggi = pkj.filter(function (r) {
    return r.Status === STATUS_PEKERJAAN.SELESAI && r.Status_Susut !== 'NORMAL' && r.Status_Susut &&
           tglStr_(new Date(r.Waktu_Selesai)) === hariIni;
  }).length;

  return {
    app: { nama: APP.nama, versi: APP.versi, satuan: APP.satuan },
    user: u,
    bisaReview: bolehReview_(u),
    lihatHpp: bolehLihatHpp_(u),
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
    ringkasan: {
      menungguReview   : menunggu(trf) + menunggu(rcv) + menunggu(snd),
      ditandai         : ditandai(trf) + ditandai(rcv) + ditandai(snd),
      pekerjaanBerjalan: berjalan.length,
      kgSedangDiproses : bulat_(kgProses, 1),
      masukHariIni     : bulat_(masukHariIni, 1),
      keluarHariIni    : bulat_(keluarHariIni, 1),
      susutTinggiHariIni: susutTinggi
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
    throw new Error('No. surat jalan wajib diisi untuk barang masuk.');
  }

  var peta = petaItem_();
  var foto = p.foto ? unggahFoto_(p.foto, jenis === JENIS_PENERIMAAN.RETUR ? 'RTR' : 'RCV')
                    : { url: '', id: '' };

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var now = new Date();
    var qtyOcr = angka_(p.qtyOcr);
    var totalQty = 0;
    p.baris.forEach(function (b) { totalQty += angka_(b.qty); });

    var ids = [];
    p.baris.forEach(function (b, i) {
      var it = peta[b.kode];
      if (!it) throw new Error('Item tidak dikenal: ' + b.kode);
      var qty = angka_(b.qty);
      if (qty <= 0) throw new Error('Qty harus lebih dari 0 untuk ' + it.nama);

      var id = buatId_(jenis === JENIS_PENERIMAAN.RETUR ? 'RTR' : 'RCV');
      ids.push(id);
      tambah_(SHEET.PENERIMAAN, {
        ID: id, Waktu: now, Tanggal: tglStr_(now), Jenis: jenis,
        Supplier: p.supplier, No_Surat_Jalan: p.noSuratJalan || '',
        Kode_Item: it.kode, Nama_Item: it.nama, Qty_Kg: qty,
        Qty_OCR: (i === 0 && qtyOcr) ? qtyOcr : '',
        Selisih_OCR: (i === 0 && qtyOcr) ? bulat_(totalQty - qtyOcr, 3) : '',
        Foto_URL: foto.url, Foto_ID: foto.id,
        Dicatat_Oleh: u.email || ('manual:' + u.nama), Nama_Pencatat: u.nama,
        Status: STATUS_TRANSFER.MENUNGGU,
        Ditinjau_Oleh: '', Waktu_Tinjau: '', Catatan_Tinjau: '',
        Catatan: p.catatan || ''
      });
    });

    catatLog_(jenis === JENIS_PENERIMAAN.RETUR ? 'RETUR' : 'PEMBELIAN',
              ids.join(','), p.supplier + ' • ' + bulat_(totalQty, 2) + ' kg');
    return { ok: true, ids: ids, jumlah: ids.length, totalKg: bulat_(totalQty, 2), jenis: jenis };
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
  try {
    var now = new Date();
    var ids = [], total = 0;

    p.baris.forEach(function (b) {
      var it = peta[b.kode];
      if (!it) throw new Error('Item tidak dikenal: ' + b.kode);
      var qty = angka_(b.qty);
      if (qty <= 0) throw new Error('Qty harus lebih dari 0 untuk ' + it.nama);
      total += qty;

      var id = buatId_(jenis === JENIS_PENGIRIMAN.RETUR_MASUK ? 'RTC' : 'OUT');
      ids.push(id);
      tambah_(SHEET.PENGIRIMAN, {
        ID: id, Waktu: now, Tanggal: tglStr_(now), Jenis: jenis,
        Customer: p.customer, No_Surat_Jalan: p.noSuratJalan || '',
        Kode_Item: it.kode, Nama_Item: it.nama, Qty_Kg: qty,
        Foto_URL: foto.url, Foto_ID: foto.id,
        Dicatat_Oleh: u.email || ('manual:' + u.nama), Nama_Pencatat: u.nama,
        Status: STATUS_TRANSFER.MENUNGGU,
        Ditinjau_Oleh: '', Waktu_Tinjau: '', Catatan_Tinjau: '',
        Catatan: p.catatan || ''
      });
    });

    catatLog_(jenis === JENIS_PENGIRIMAN.RETUR_MASUK ? 'RETUR_CUSTOMER' : 'PENJUALAN',
              ids.join(','), p.customer + ' • ' + bulat_(total, 2) + ' kg');
    return { ok: true, ids: ids, jumlah: ids.length, totalKg: bulat_(total, 2), jenis: jenis };
  } finally {
    lock.releaseLock();
  }
}

/* =================================================================
   ① / ③  TRANSFER INTERNAL   (tanpa surat jalan)
   ================================================================= */

/** p = { arah, baris:[{kode,qty}], catatan, foto, ident } */
function simpanTransfer(p) {
  var u = penggunaSaatIni_(p && p.ident);
  if (!p || !p.arah || !p.baris || !p.baris.length) throw new Error('Data transfer tidak lengkap.');
  if (p.arah !== ARAH.KE_PRODUKSI && p.arah !== ARAH.KE_GUDANG) throw new Error('Arah transfer tidak dikenal.');

  var peta = petaItem_();
  var foto = p.foto ? unggahFoto_(p.foto, 'TRF') : { url: '', id: '' };

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var now = new Date();
    var ids = [], total = 0;

    p.baris.forEach(function (b) {
      var it = peta[b.kode];
      if (!it) throw new Error('Item tidak dikenal: ' + b.kode);
      var qty = angka_(b.qty);
      if (qty <= 0) throw new Error('Qty harus lebih dari 0 untuk ' + it.nama);
      total += qty;

      var id = buatId_('TRF');
      ids.push(id);
      tambah_(SHEET.TRANSFER, {
        ID: id, Waktu: now, Tanggal: tglStr_(now), Arah: p.arah,
        Kode_Item: it.kode, Nama_Item: it.nama, Qty_Kg: qty,
        Foto_URL: foto.url, Foto_ID: foto.id,
        Dicatat_Oleh: u.email || ('manual:' + u.nama), Nama_Pencatat: u.nama,
        Status: STATUS_TRANSFER.MENUNGGU,
        Ditinjau_Oleh: '', Waktu_Tinjau: '', Catatan_Tinjau: '',
        Catatan: p.catatan || ''
      });
    });

    catatLog_('TRANSFER', ids.join(','), p.arah + ' • ' + bulat_(total, 2) + ' kg');
    return { ok: true, ids: ids, jumlah: ids.length, totalKg: bulat_(total, 2) };
  } finally {
    lock.releaseLock();
  }
}

/* =================================================================
   ②  PEKERJAAN
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
  try {
    var now = new Date();
    var id = buatId_('JOB');
    var total = 0, hppBahan = 0;

    p.bahanBaku.forEach(function (b) {
      var it = peta[b.kode];
      if (!it) throw new Error('Bahan baku tidak dikenal: ' + b.kode);
      var q = angka_(b.qty);
      if (q <= 0) throw new Error('Qty bahan baku harus > 0 (' + it.nama + ')');
      total += q;
      var nilai = q * it.harga;          // snapshot harga saat job dimulai
      hppBahan += nilai;
      tambah_(SHEET.DETAIL, {
        ID: buatId_('DTL'), ID_Pekerjaan: id, Jenis: JENIS_DETAIL.BAHAN_BAKU,
        Kode_Item: it.kode, Nama_Item: it.nama, Qty_Kg: q,
        Harga_Per_Kg: it.harga, Nilai: bulat_(nilai, 0), Waktu: now
      });
    });

    var hppProses = total * biayaProsesPerKg_();

    tambah_(SHEET.PEKERJAAN, {
      ID: id, Waktu_Mulai: now, Waktu_Selesai: '', Tanggal: tglStr_(now),
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

    (p.scrap || []).forEach(function (b) {
      var it = peta[b.kode]; if (!it) throw new Error('Item tidak dikenal: ' + b.kode);
      var q = angka_(b.qty); if (q <= 0) return;
      totalScrap += q;
      tambah_(SHEET.DETAIL, { ID: buatId_('DTL'), ID_Pekerjaan: job.ID, Jenis: JENIS_DETAIL.SCRAP,
        Kode_Item: it.kode, Nama_Item: it.nama, Qty_Kg: q, Waktu: now });
    });

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
   ANTRIAN REVIEW  (penerimaan + transfer digabung)
   ================================================================= */

/**
 * status: 'MENUNGGU' (default) atau 'DITANDAI' (arsip untuk direvisi).
 */
function antrianReview(ident, status) {
  var u = penggunaSaatIni_(ident);
  if (!bolehReview_(u)) throw new Error('Hanya Supervisor / Admin yang bisa membuka antrian review.');
  var target = (status === STATUS_TRANSFER.DITANDAI) ? STATUS_TRANSFER.DITANDAI : STATUS_TRANSFER.MENUNGGU;

  var out = [];

  baca_(SHEET.PENERIMAAN).forEach(function (r) {
    if (r.Status !== target) return;
    out.push({
      id: r.ID, sumber: 'PENERIMAAN', jenis: r.Jenis,
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

  baca_(SHEET.TRANSFER).forEach(function (r) {
    if (r.Status !== target) return;
    out.push({
      id: r.ID, sumber: 'TRANSFER', jenis: r.Arah,
      label: r.Arah === ARAH.KE_PRODUKSI ? 'GBJ → GP' : 'GP → GBJ',
      waktuRaw: new Date(r.Waktu).getTime(), waktu: jam_(r.Waktu),
      item: r.Nama_Item, kode: r.Kode_Item, qty: angka_(r.Qty_Kg),
      noSuratJalan: '', supplier: '', qtyOcr: null, selisih: null,
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
  var pre = String(id).slice(0, 4);
  var nama = (pre === 'TRF-') ? SHEET.TRANSFER
           : (pre === 'OUT-' || pre === 'RTC-') ? SHEET.PENGIRIMAN
           : SHEET.PENERIMAAN;

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
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
 * Stok berjalan + dari mana asalnya.
 * GBJ = stok awal + pembelian masuk − retur − ke produksi + kembali dari produksi
 * GP  = stok awal + ke produksi − kembali − bahan baku dipakai + barang jadi + scrap
 */
function laporanStok(ident) {
  penggunaSaatIni_(ident);
  var peta = petaItem_();
  var stok = {};

  function sel(kode) {
    if (!stok[kode]) {
      var it = peta[kode] || { nama: kode };
      stok[kode] = { kode: kode, nama: it.nama, kategori: it.kategori || '',
                     awalGBJ: it.awalGBJ || 0, awalGP: it.awalGP || 0,
                     awal: (it.awalGBJ || 0) + (it.awalGP || 0),
                     beli: 0, retur: 0, jual: 0, returCust: 0,
                     keGP: 0, keGBJ: 0, dipakai: 0, dihasilkan: 0,
                     gbj: it.awalGBJ || 0, gp: it.awalGP || 0 };
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

  baca_(SHEET.TRANSFER).forEach(function (r) {
    if (!dihitung_(r)) return;
    var s = sel(r.Kode_Item), q = angka_(r.Qty_Kg);
    if (r.Arah === ARAH.KE_PRODUKSI) { s.keGP += q; s.gbj -= q; s.gp += q; }
    else { s.keGBJ += q; s.gp -= q; s.gbj += q; }
  });

  baca_(SHEET.DETAIL).forEach(function (d) {
    var s = sel(d.Kode_Item), q = angka_(d.Qty_Kg);
    if (d.Jenis === JENIS_DETAIL.BAHAN_BAKU) { s.dipakai += q; s.gp -= q; }
    else { s.dihasilkan += q; s.gp += q; }
  });

  var daftar = Object.keys(stok).map(function (k) {
    var s = stok[k];
    ['awalGBJ','awalGP','awal','beli','retur','jual','returCust',
     'keGP','keGBJ','dipakai','dihasilkan','gbj','gp'].forEach(function (f) {
      s[f] = bulat_(s[f], 2);
    });
    s.total = bulat_(s.gbj + s.gp, 2);
    return s;
  }).filter(function (s) {
    return s.awal || s.beli || s.retur || s.jual || s.returCust ||
           s.keGP || s.keGBJ || s.dipakai || s.dihasilkan;
  }).sort(function (a, b) { return b.total - a.total; });

  var tot = { beli: 0, retur: 0, jual: 0, returCust: 0, gbj: 0, gp: 0, total: 0 };
  daftar.forEach(function (s) {
    tot.beli += s.beli; tot.retur += s.retur;
    tot.jual += s.jual; tot.returCust += s.returCust;
    tot.gbj += s.gbj; tot.gp += s.gp; tot.total += s.total;
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
    if (!hari[k]) hari[k] = { tanggal: k, masuk: 0, keluar: 0, transfer: 0, job: 0,
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
      item: r.Nama_Item, qty: q, status: r.Status, oleh: r.Nama_Pencatat });
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
      item: r.Nama_Item, qty: q, status: r.Status, oleh: r.Nama_Pencatat });
  });

  baca_(SHEET.TRANSFER).forEach(function (r) {
    var d = new Date(r.Waktu); if (!dalam(d) || !dihitung_(r)) return;
    var x = h(d), q = angka_(r.Qty_Kg);
    x.transfer++;
    if (r.Status === STATUS_TRANSFER.MENUNGGU) x.menunggu++;
    if (r.Status === STATUS_TRANSFER.DITANDAI) x.ditandai++;
    pushK(d, { t: d.getTime(), jam: Utilities.formatDate(d, APP.zona, 'HH:mm'),
      jenis: r.Arah === ARAH.KE_PRODUKSI ? 'KE_GP' : 'KE_GBJ',
      label: r.Arah === ARAH.KE_PRODUKSI ? 'GBJ → GP' : 'GP → GBJ',
      item: r.Nama_Item, qty: q, status: r.Status, oleh: r.Nama_Pencatat });
  });

  baca_(SHEET.PEKERJAAN).forEach(function (r) {
    var dm = new Date(r.Waktu_Mulai);
    if (dalam(dm)) {
      var x = h(dm); x.job++;
      pushK(dm, { t: dm.getTime(), jam: Utilities.formatDate(dm, APP.zona, 'HH:mm'),
        jenis: 'JOB_MULAI', label: r.Nama_Produk, item: '', qty: angka_(r.Total_Bahan_Baku_Kg),
        status: r.Status, oleh: r.Nama_Operator });
    }
    if (r.Status === STATUS_PEKERJAAN.SELESAI && r.Waktu_Selesai) {
      var ds = new Date(r.Waktu_Selesai);
      if (dalam(ds)) {
        var y = h(ds);
        if (r.Status_Susut && r.Status_Susut !== 'NORMAL') y.susutTinggi++;
        pushK(ds, { t: ds.getTime(), jam: Utilities.formatDate(ds, APP.zona, 'HH:mm'),
          jenis: 'JOB_SELESAI', label: r.Nama_Produk, item: '', qty: angka_(r.Total_Barang_Jadi_Kg),
          status: r.Status_Susut, susut: angka_(r.Susut_Kg), persen: angka_(r.Susut_Persen),
          oleh: r.Nama_Operator });
      }
    }
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

function riwayatTransfer(hari, ident) {
  penggunaSaatIni_(ident);
  var batas = new Date();
  batas.setDate(batas.getDate() - (hari || 7));
  return baca_(SHEET.TRANSFER)
    .filter(function (r) { return new Date(r.Waktu) >= batas; })
    .map(function (r) {
      return { id: r.ID, waktu: jam_(r.Waktu), arah: r.Arah, item: r.Nama_Item,
               qty: angka_(r.Qty_Kg), status: r.Status, pencatat: r.Nama_Pencatat,
               foto: r.Foto_URL, fotoId: r.Foto_ID };
    }).reverse().slice(0, 150);
}
