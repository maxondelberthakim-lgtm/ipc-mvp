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
