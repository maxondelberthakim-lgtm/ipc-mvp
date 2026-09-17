/**********************************************************************
 * IPC — Inventory & Production Control (MVP v6)
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

/* ================= API JSON (untuk frontend GitHub Pages) =================
 * Frontend statis di GitHub memanggil POST {fn, args} ke URL /exec ini.
 * Content-Type text/plain -> tidak kena preflight CORS. Balasan JSON.
 * Hanya fungsi di daftar putih (RPC_WL) yang boleh dipanggil. */
var RPC_WL = {
  getKonteks:1, simpanPenerimaan:1, simpanPengiriman:1, simpanTransfer:1,
  mulaiPekerjaan:1, selesaikanPekerjaan:1, daftarPekerjaanBerjalan:1, daftarPekerjaanSelesai:1,
  ambilPekerjaan:1, simpanEditPekerjaan:1,
  riwayatInput:1, ambilEntri:1, simpanEditEntri:1, batalkanEntriSendiri:1,
  antrianReview:1, tinjauTransfer:1, daftarPermintaan:1, tinjauPermintaan:1,
  laporanSusut:1, laporanStok:1, riwayatPenerimaan:1, laporanPenjualan:1, laporanHpp:1, riwayatTransfer:1,
  kalender:1, ocrSuratJalan:1,
  daftarPengguna:1, simpanPengguna:1, aktivitasStaf:1,
  daftarSku:1, simpanSku:1, hapusSku:1,
  siapkanOpname:1, simpanOpname:1, riwayatOpname:1,
  /* v7 */
  simpanPo:1, ubahPo:1, batalkanPo:1, daftarPo:1, poTerbuka:1, returTersedia:1,
  ringkasanPo:1, simpanInvoice:1, validasiInvoice:1, daftarInvoice:1,
  laporanNilaiStok:1, hitungUlangHpp:1,
  simpanKerusakan:1, daftarKerusakan:1, tinjauKerusakan:1,
  laporanStandarSusut:1, terapkanStandarSusut:1, diagnosa:1
};

function doPost(e) {
  var out = { ok:false };
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var fn = String(body.fn || '');
    if (!RPC_WL[fn]) throw new Error('Fungsi tidak dikenal: ' + fn);
    var f = globalThis[fn];
    if (typeof f !== 'function') throw new Error('Fungsi tidak tersedia: ' + fn);
    out.ok = true;
    out.data = f.apply(null, body.args || []);
  } catch (err) {
    out.ok = false;
    out.error = (err && err.message) ? err.message : String(err);
  }
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

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

var KOLOM_TANGGAL_ = /^(Tanggal|Tanggal_Invoice|Perkiraan_Datang)$/;
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
      harga: angka_(r.Harga_Per_Kg),
      awalGBJ: angka_(r.Stok_Awal_GBJ), awalGP: angka_(r.Stok_Awal_GP)
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
                        Harga_Per_Kg: '', Stok_Awal_GBJ: 0, Stok_Awal_GP: 0, Aktif: 'YA' });
  catatLog_('SKU_SCRAP', kode, 'dibuat otomatis untuk ' + produk.nama);
  return { kode: kode, nama: nama, kategori: KATEGORI_ITEM.SCRAP, harga: 0 };
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
    return r.Jenis === JENIS_PENERIMAAN.MASUK && String(r.Tanggal) === hariIni && dihitung_(r);
  }).reduce(function (a, r) { return a + angka_(r.Qty_Kg); }, 0);

  var keluarHariIni = snd.filter(function (r) {
    return r.Jenis === JENIS_PENGIRIMAN.KELUAR && String(r.Tanggal) === hariIni && dihitung_(r);
  }).reduce(function (a, r) { return a + angka_(r.Qty_Kg); }, 0);

  var susutTinggi = pkj.filter(function (r) {
    return r.Status === STATUS_PEKERJAAN.SELESAI && r.Status_Susut !== 'NORMAL' && r.Status_Susut &&
           tglStr_(new Date(r.Waktu_Selesai)) === hariIni;
  }).length;

  /* stok per item untuk petunjuk di form ("tersedia di GBJ: … kg") */
  var stokSemua = hitungStokSemua_(), stok = {};
  Object.keys(stokSemua).forEach(function (k) { stok[k] = { gbj: bulat_(stokSemua[k].gbj, 2), gp: bulat_(stokSemua[k].gp, 2) }; });
  var permintaanMenunggu = bolehReview_(u)
    ? baca_(SHEET.PERMINTAAN).filter(function (r) { return r.Status === STATUS_PERMINTAAN.MENUNGGU; }).length : 0;
  var kerusakanMenunggu = bolehReview_(u)
    ? baca_(SHEET.KERUSAKAN).filter(function (r) { return r.Status === STATUS_TRANSFER.MENUNGGU; }).length : 0;
  var poTerbukaN = baca_(SHEET.PO).filter(function (r) { return r.Status === STATUS_PO.TERBUKA || r.Status === STATUS_PO.SEBAGIAN; }).length;
  var invoiceMenunggu = bolehReview_(u)
    ? baca_(SHEET.INVOICE).filter(function (r) { return r.Status === STATUS_INVOICE.MENUNGGU; }).length : 0;

  return {
    app: { nama: APP.nama, versi: APP.versi, satuan: APP.satuan },
    user: u,
    hariIni: hariIni,
    maksMundurHari: MAKS_MUNDUR_HARI,
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
    ringkasan: {
      menungguReview   : menunggu(trf) + menunggu(rcv) + menunggu(snd),
      ditandai         : ditandai(trf) + ditandai(rcv) + ditandai(snd),
      pekerjaanBerjalan: berjalan.length,
      kgSedangDiproses : bulat_(kgProses, 1),
      masukHariIni     : bulat_(masukHariIni, 1),
      keluarHariIni    : bulat_(keluarHariIni, 1),
      susutTinggiHariIni: susutTinggi,
      permintaanMenunggu: permintaanMenunggu,
      kerusakanMenunggu: kerusakanMenunggu,
      invoiceMenunggu: invoiceMenunggu,
      poTerbuka: poTerbukaN
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

    p.baris.forEach(function (b) {
      var it = peta[b.kode];
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
        HPP_Per_Kg: fifoJual ? hargaKeluarGbjFifo_(fifoJual, it.kode, qty, peta) : ''
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
  lupakanMemo_();   // di dalam lock: baca ulang dari sheet, jangan pakai memo sebelum lock
  try {
    var now = new Date();
    var tanggal = tglValid_(p.tanggal);
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
        ID: id, Waktu: now, Tanggal: tanggal, Arah: p.arah,
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
      var harga = fifo ? hargaDariFifo_(fifo, it.kode, q, peta) : it.harga;   // snapshot harga saat job dimulai (FIFO batch tertua di GP)
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
/** Stok semua item per lokasi (GBJ/GP) beserta rincian arusnya. Dipakai laporanStok & getKonteks. */
function hitungStokSemua_() {
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
                     opnameGBJ: 0, opnameGP: 0, rusakGBJ: 0, rusakGP: 0,
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

  /* barang rusak yang sudah disetujui manager */
  baca_(SHEET.KERUSAKAN).forEach(function (r) {
    if (r.Status !== STATUS_TRANSFER.DISETUJUI) return;
    var s = sel(r.Kode_Item), q = angka_(r.Qty_Kg);
    if (r.Lokasi === LOKASI.GP) { s.rusakGP += q; s.gp -= q; } else { s.rusakGBJ += q; s.gbj -= q; }
  });

  /* penyesuaian dari stock opname: selisih = fisik − sistem saat dihitung */
  baca_(SHEET.OPNAME).forEach(function (r) {
    var s = sel(r.Kode_Item), d = angka_(r.Selisih);
    if (r.Lokasi === LOKASI.GP) { s.opnameGP += d; s.gp += d; }
    else { s.opnameGBJ += d; s.gbj += d; }
  });
  return stok;
}

function laporanStok(ident) {
  penggunaSaatIni_(ident);
  var stok = hitungStokSemua_();

  var daftar = Object.keys(stok).map(function (k) {
    var s = stok[k];
    ['awalGBJ','awalGP','awal','beli','retur','jual','returCust',
     'keGP','keGBJ','dipakai','dihasilkan','opnameGBJ','opnameGP','rusakGBJ','rusakGP','gbj','gp'].forEach(function (f) {
      s[f] = bulat_(s[f], 2);
    });
    s.total = bulat_(s.gbj + s.gp, 2);
    return s;
  }).filter(function (s) {
    return s.awal || s.beli || s.retur || s.jual || s.returCust ||
           s.keGP || s.keGBJ || s.dipakai || s.dihasilkan || s.opnameGBJ || s.opnameGP || s.rusakGBJ || s.rusakGP;
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
  JUAL_RETUR : { sheet: 'PENGIRIMAN', filter: function (r) { return r.Jenis === JENIS_PENGIRIMAN.RETUR_MASUK; } },
  TRF_KE_GP  : { sheet: 'TRANSFER',   filter: function (r) { return r.Arah === ARAH.KE_PRODUKSI; } },
  TRF_KE_GBJ : { sheet: 'TRANSFER',   filter: function (r) { return r.Arah === ARAH.KE_GUDANG; } }
};

function penandaPencatat_(u) { return u.email || ('manual:' + u.nama); }

function bolehEditEntri_(u, r) {
  if (bolehReview_(u)) return true;
  return r.Status === STATUS_TRANSFER.MENUNGGU && r.Dicatat_Oleh === penandaPencatat_(u);
}

function sheetDariId_(id) {
  var pre = String(id).slice(0, 4);
  if (pre === 'TRF-') return SHEET.TRANSFER;
  if (pre === 'OUT-' || pre === 'RTC-') return SHEET.PENGIRIMAN;
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
    idPo: r.ID_PO || '', idAsal: r.ID_Penerimaan_Asal || '', catatanQc: r.Catatan_QC || '',
    /* staf: boleh MENGAJUKAN perubahan/pembatalan entri sendiri (butuh persetujuan); supervisor: langsung */
    bolehEdit: bolehReview_(u) || (r.Dicatat_Oleh === penandaPencatat_(u) && r.Status !== STATUS_TRANSFER.DIBATALKAN),
    bolehBatal: bolehReview_(u) ? (r.Status === STATUS_TRANSFER.MENUNGGU || r.Status === STATUS_TRANSFER.DITANDAI)
                                : (r.Dicatat_Oleh === penandaPencatat_(u) && r.Status !== STATUS_TRANSFER.DIBATALKAN),
    perluPersetujuan: !bolehReview_(u),
    usulan: (tertunda && tertunda[r.ID]) || null
  };
  if (nama === SHEET.PENERIMAAN) { o.partner = r.Supplier; o.jenis = r.Jenis; }
  if (nama === SHEET.PENGIRIMAN) { o.partner = r.Customer; o.jenis = r.Jenis; }
  if (nama === SHEET.TRANSFER)   { o.partner = ''; o.jenis = r.Arah; }
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
  if (perubahan.noSuratJalan !== undefined && nama !== SHEET.TRANSFER &&
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
  if (hasil.ubah.Kode_Item && (r.ID_PO || r.ID_Penerimaan_Asal)) throw new Error('Item tidak bisa diganti karena entri ini merujuk PO / penerimaan asal. Batalkan lalu buat baru.');
  var stempel = Utilities.formatDate(new Date(), APP.zona, 'dd/MM HH:mm') + ' ' + olehNama + ': ' + (awalan || '') + hasil.log.join('; ');
  hasil.ubah.Log_Edit = [r.Log_Edit, stempel].filter(String).join('\n');
  ubahBaris_(nama, r._baris, hasil.ubah);
  if (nama === SHEET.PENERIMAAN && r.ID_PO && hasil.ubah.Qty_Kg !== undefined) sinkronPo_(r.ID_PO);
  catatLog_('EDIT', id, hasil.log.join('; '));
  return { ok: true, berubah: true, log: hasil.log };
}

/**
 * perubahan = { kode, qty, tanggal, partner, noSuratJalan, catatan }  (yang tidak dikirim = tidak diubah)
 * SUPERVISOR/ADMIN: langsung diterapkan. STAF: menjadi USULAN (Permintaan_Ubah) yang menunggu persetujuan;
 * entri aslinya tidak berubah sampai disetujui.
 */
function simpanEditEntri(id, perubahan, ident, alasan) {
  var u = penggunaSaatIni_(ident);
  var nama = sheetDariId_(id);
  if (nama === SHEET.PEKERJAAN) throw new Error('Pakai simpanEditPekerjaan untuk job.');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();   // di dalam lock: baca ulang dari sheet, jangan pakai memo sebelum lock
  try {
    if (bolehReview_(u)) return terapkanEdit_(nama, id, perubahan, u.nama, '');

    var r = cariEntri_(nama, id);
    if (r.Dicatat_Oleh !== penandaPencatat_(u)) throw new Error('Hanya bisa mengajukan perubahan untuk entri yang kamu catat sendiri.');
    if (r.Status === STATUS_TRANSFER.DIBATALKAN) throw new Error('Entri sudah dibatalkan.');
    var hasil = susunEdit_(nama, r, perubahan);          // validasi dulu, supaya usulan yang salah tidak masuk antrian
    if (!hasil.log.length) return { ok: true, berubah: false };
    return ajukanPermintaan_(u, JENIS_PERMINTAAN.EDIT, nama, r, perubahan, alasan, hasil.log.join('; '));
  } finally {
    lock.releaseLock();
  }
}

/** Batal: supervisor langsung (lewat tinjauTransfer); staf → usulan BATAL untuk entrinya sendiri. */
function batalkanEntriSendiri(id, alasan, ident) {
  var u = penggunaSaatIni_(ident);
  if (bolehReview_(u)) return tinjauTransfer(id, 'batal', alasan, ident);
  var nama = sheetDariId_(id);
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();   // di dalam lock: baca ulang dari sheet, jangan pakai memo sebelum lock
  try {
    var r = cariEntri_(nama, id);
    if (r.Dicatat_Oleh !== penandaPencatat_(u)) throw new Error('Hanya entri sendiri yang bisa diajukan untuk dibatalkan.');
    if (r.Status === STATUS_TRANSFER.DIBATALKAN) throw new Error('Entri sudah dibatalkan.');
    return ajukanPermintaan_(u, JENIS_PERMINTAAN.BATAL, nama, r, {}, alasan, 'batalkan ' + r.Nama_Item + ' ' + angka_(r.Qty_Kg) + ' kg');
  } finally {
    lock.releaseLock();
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

function bolehEditJob_(u, r) {
  if (bolehReview_(u)) return true;
  return r.Operator === penandaPencatat_(u);   // staf: hanya sebagai usulan (butuh persetujuan)
}

function daftarPekerjaanSelesai(hari, ident) {
  var u = penggunaSaatIni_(ident);
  var lihatHpp = bolehLihatHpp_(u);
  var batas = new Date();
  batas.setDate(batas.getDate() - (hari || 14));
  var tertunda = permintaanTertunda_();
  return baca_(SHEET.PEKERJAAN)
    .filter(function (r) { return r.Status === STATUS_PEKERJAAN.SELESAI && new Date(r.Waktu_Selesai) >= batas; })
    .map(function (r) {
      var o = { usulan: tertunda[r.ID] || null, perluPersetujuan: !bolehReview_(u),
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
    bolehEdit: bolehEditJob_(u, r), perluPersetujuan: !bolehReview_(u), tanggal: r.Tanggal,
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
    if (!bolehReview_(u)) {
      /* STAF: hanya pekerjaannya sendiri, dan hanya sebagai USULAN yang menunggu persetujuan */
      if (r.Operator !== penandaPencatat_(u)) throw new Error('Hanya operator pekerjaan ini yang bisa mengajukan perubahan.');
      if (!p.bahanBaku || !p.bahanBaku.length) throw new Error('Bahan baku tidak boleh kosong.');
      var ringkas = 'ubah pekerjaan ' + r.Nama_Produk + ' (' + angka_(r.Total_Bahan_Baku_Kg) + ' kg bahan)';
      return ajukanPermintaan_(u, JENIS_PERMINTAAN.EDIT_JOB, SHEET.PEKERJAAN, r, p, p.alasan, ringkas);
    }
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
  baca_(SHEET.TRANSFER).forEach(function (r) {
    if (new Date(r.Waktu) < batas) return;
    tambah(r.Nama_Pencatat, r.Arah === ARAH.KE_PRODUKSI ? 'KE_GP' : 'KE_GBJ', angka_(r.Qty_Kg), r.Waktu, r.Nama_Item);
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
              awalGBJ: angka_(r.Stok_Awal_GBJ), awalGP: angka_(r.Stok_Awal_GP),
              aktif: String(r.Aktif).toUpperCase() !== 'TIDAK', dipakai: !!dipakai[r.Kode_Item] };
    if (lihatHpp) o.harga = angka_(r.Harga_Per_Kg);
    return o;
  });
}

function skuDipakai_() {
  var d = {};
  [SHEET.PENERIMAAN, SHEET.PENGIRIMAN, SHEET.TRANSFER, SHEET.DETAIL, SHEET.OPNAME].forEach(function (nama) {
    baca_(nama).forEach(function (r) { if (r.Kode_Item) d[r.Kode_Item] = true; });
  });
  baca_(SHEET.PEKERJAAN).forEach(function (r) { if (r.Kode_Produk) d[r.Kode_Produk] = true; });
  return d;
}

/** p = { baris (kosong = baru), kode, nama, kategori, harga, awalGBJ, awalGP, aktif } */
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
                 Stok_Awal_GBJ: angka_(p.awalGBJ), Stok_Awal_GP: angka_(p.awalGP),
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
 * Daftar item + stok sistem di satu lokasi, siap diisi stok fisik.
 */
function siapkanOpname(lokasi, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehReview_(u)) throw new Error('Hanya Supervisor / Admin yang bisa stock opname.');
  lokasi = lokasi === LOKASI.GP ? LOKASI.GP : LOKASI.GBJ;
  var stok = {};
  laporanStok(ident).daftar.forEach(function (s) { stok[s.kode] = s; });
  var items = baca_(SHEET.ITEM).filter(function (r) {
    return r.Kode_Item && String(r.Aktif).toUpperCase() !== 'TIDAK';
  }).map(function (r) {
    var s = stok[r.Kode_Item];
    return { kode: r.Kode_Item, nama: r.Nama_Item, kategori: r.Kategori,
             sistem: s ? (lokasi === LOKASI.GP ? s.gp : s.gbj) : 0 };
  });
  return { lokasi: lokasi, waktu: jam_(new Date()), items: items };
}

/**
 * p = { lokasi, baris:[{kode, fisik}], catatan }
 * Baris yang fisik-nya kosong dilewati. Selisih 0 tetap dicatat (bukti sudah dihitung).
 */
function simpanOpname(p, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehReview_(u)) throw new Error('Hanya Supervisor / Admin yang bisa stock opname.');
  if (!p || !p.baris || !p.baris.length) throw new Error('Belum ada item yang dihitung.');
  var lokasi = p.lokasi === LOKASI.GP ? LOKASI.GP : LOKASI.GBJ;

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
      var sistem = s ? (lokasi === LOKASI.GP ? s.gp : s.gbj) : 0;
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
