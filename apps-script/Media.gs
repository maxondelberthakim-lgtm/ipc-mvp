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
