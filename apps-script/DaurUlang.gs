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
    /* nilai scrap menurut FIFO (batch ini sudah tercatat sebagai DAUR_KIRIM) */
    var nilaiScrap = 0;
    if (metodeHpp_() === 'FIFO') { try { nilaiScrap = hitungFifo_().nilaiDaur[r.ID] || 0; } catch (e) { nilaiScrap = 0; } }
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
