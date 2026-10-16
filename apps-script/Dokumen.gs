/**
 * v12: dokumen (invoice customer dari SO, dokumen PO ke supplier), kontak WA, satuan bal, pengaturan dokumen.
 *
 * Dokumen = snapshot JSON (kop perusahaan, pihak, baris, total) + token rahasia. Worker menyajikannya di
 * GET /dok/<token> sebagai halaman cetak (tombol "Simpan PDF" = print). Link itu yang dikirim ke WA lewat wa.me.
 * Harga invoice = harga SO per kg, TANPA PPN (keputusan Max 16 Okt 2026). Satuan: disimpan kg; bal hanya tampilan
 * (1 bal = KG_PER_BAL kg, bawaan 25, bisa diubah Yansen di Pengaturan dokumen).
 */

function kgPerBal_() { var n = parseFloat(getSetting_('KG_PER_BAL')); return isNaN(n) || n <= 0 ? 25 : n; }

var KUNCI_PERUSAHAAN_ = { nama: 'PERUSAHAAN_NAMA', alamat: 'PERUSAHAAN_ALAMAT', telp: 'PERUSAHAAN_TELP', email: 'PERUSAHAAN_EMAIL',
                          bank: 'PERUSAHAAN_BANK', catatanInvoice: 'DOK_CATATAN_INVOICE', catatanPo: 'DOK_CATATAN_PO' };
function infoPerusahaan_() {
  var o = {};
  Object.keys(KUNCI_PERUSAHAAN_).forEach(function (k) { o[k] = String(getSetting_(KUNCI_PERUSAHAAN_[k]) || ''); });
  return o;
}
/** Boleh mengelola dokumen/kontak: SUPERVISOR dengan modul PO atau SO, atau ADMIN. */
function bolehDokumen_(u) { return bolehReview_(u) && (bolehModul_(u, MODUL.PO) || bolehModul_(u, MODUL.SO)); }

function pengaturanDokumen(ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehDokumen_(u)) throw new Error('Hanya akun dengan akses PO / Sales order.');
  return { kgPerBal: kgPerBal_(), perusahaan: infoPerusahaan_(), bolehUbah: bolehModul_(u, MODUL.PO) || bolehAdmin_(u) };
}
/** p = { kgPerBal, perusahaan:{nama, alamat, telp, email, bank, catatanInvoice, catatanPo} } — Yansen (modul PO) / Admin. */
function simpanPengaturanDokumen(p, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehReview_(u) || !(bolehModul_(u, MODUL.PO) || bolehAdmin_(u))) throw new Error('Hanya akun dengan akses PO (Yansen) / Admin.');
  p = p || {};
  if (p.kgPerBal !== undefined) {
    var n = parseFloat(p.kgPerBal);
    if (isNaN(n) || n <= 0 || n > 1000) throw new Error('Kg per bal harus angka > 0.');
    setSetting_('KG_PER_BAL', String(n));
  }
  var per = p.perusahaan || {};
  Object.keys(KUNCI_PERUSAHAAN_).forEach(function (k) { if (per[k] !== undefined) setSetting_(KUNCI_PERUSAHAAN_[k], String(per[k] || '').slice(0, 400)); });
  lupakanMemo_(SHEET.SETTING);
  catatLog_('PENGATURAN_DOKUMEN', '', 'kg/bal ' + kgPerBal_() + ' · ' + (infoPerusahaan_().nama || '-'));
  return pengaturanDokumen(ident);
}

/* ---------- kontak WA ---------- */
function nomorWa_(s) {
  var d = String(s || '').replace(/[^0-9+]/g, '');
  if (d.indexOf('+') === 0) d = d.slice(1);
  if (d.indexOf('0') === 0) d = '62' + d.slice(1);
  if (!/^[1-9][0-9]{7,15}$/.test(d)) throw new Error('Nomor WA tidak valid: ' + s + ' (contoh 0812xxxx atau 62812xxxx).');
  return d;
}
function daftarKontakWa(ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehDokumen_(u)) throw new Error('Hanya akun dengan akses PO / Sales order.');
  return baca_(SHEET.KONTAK_WA).filter(function (r) { return String(r.Aktif).toUpperCase() !== 'TIDAK'; })
    .map(function (r) { return { id: r.ID, nama: r.Nama, nomor: r.Nomor }; })
    .sort(function (a, b) { return String(a.nama).localeCompare(String(b.nama)); });
}
/** p = { id (kosong = baru), nama, nomor } — nomor dinormalkan ke 62…; nomor yang sudah ada → namanya diperbarui. */
function simpanKontakWa(p, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehDokumen_(u)) throw new Error('Hanya akun dengan akses PO / Sales order.');
  p = p || {};
  var nama = String(p.nama || '').trim(), nomor = nomorWa_(p.nomor);
  if (!nama) throw new Error('Nama pemilik nomor wajib diisi.');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_(SHEET.KONTAK_WA);
  try {
    var rows = baca_(SHEET.KONTAK_WA), target = null;
    rows.forEach(function (r) { if ((p.id && r.ID === p.id) || (!p.id && String(r.Nomor) === nomor)) target = r; });
    if (target) {
      ubahBaris_(SHEET.KONTAK_WA, target._baris, { Nama: nama, Nomor: nomor, Aktif: 'YA' });
      return { ok: true, id: target.ID, nama: nama, nomor: nomor };
    }
    var id = buatId_('WA');
    tambah_(SHEET.KONTAK_WA, { ID: id, Nama: nama, Nomor: nomor, Aktif: 'YA', Waktu: new Date(), Dibuat_Oleh: u.nama });
    catatLog_('KONTAK_WA', id, nama + ' ' + nomor);
    return { ok: true, id: id, nama: nama, nomor: nomor };
  } finally { lock.releaseLock(); }
}
function hapusKontakWa(id, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehDokumen_(u)) throw new Error('Hanya akun dengan akses PO / Sales order.');
  var r = cariEntri_(SHEET.KONTAK_WA, id);
  ubahBaris_(SHEET.KONTAK_WA, r._baris, { Aktif: 'TIDAK' });
  return { ok: true };
}

/* ---------- dokumen ---------- */
function tokenDokumen_() {
  var abc = 'abcdefghijkmnpqrstuvwxyz23456789', s = '';
  for (var i = 0; i < 24; i++) s += abc.charAt(Math.floor(Math.random() * abc.length));
  return s;
}
function nomorInvoiceBaru_(tanggal) {
  var ym = String(tanggal).slice(0, 7), n = 0, awalan = 'INV/' + ym.slice(0, 4) + '/' + ym.slice(5, 7) + '/';
  baca_(SHEET.DOKUMEN).forEach(function (r) {
    if (r.Jenis === 'INVOICE' && String(r.Nomor).indexOf(awalan) === 0) { var k = parseInt(String(r.Nomor).slice(awalan.length), 10); if (!isNaN(k) && k > n) n = k; }
  });
  return awalan + ('00' + (n + 1)).slice(-3);
}
function barisDokumen_(kode, nama, qty, harga, kgPerBal, spesifikasi) {
  var bal = kgPerBal > 0 ? bulat_(qty / kgPerBal, 2) : 0;
  return { kode: kode, nama: nama, qty: bulat_(qty, 3), bal: bal, harga: bulat_(harga, 2), nilai: bulat_(qty * harga, 0), spesifikasi: spesifikasi || '' };
}
/**
 * p = { jenis:'INVOICE'|'PO', ref: No_SO | No_PO, nomor?, tanggal?, catatan?, perusahaan? (override kop sekali ini), jatuhTempo? }
 * INVOICE butuh modul SO; PO butuh modul PO. Mengembalikan { id, nomor, token, jenis } — URL = <asal API>/dok/<token> (disusun di klien).
 */
function buatDokumen(p, ident) {
  var u = penggunaSaatIni_(ident);
  p = p || {};
  var jenis = p.jenis === 'PO' ? 'PO' : 'INVOICE';
  if (jenis === 'INVOICE' && !bolehSo_(u)) throw new Error('Hanya akun dengan akses Sales order yang bisa membuat invoice.');
  if (jenis === 'PO' && !bolehPo_(u)) throw new Error('Hanya akun dengan akses PO yang bisa membuat dokumen PO.');
  var ref = String(p.ref || '').trim();
  if (!ref) throw new Error('Nomor SO / PO belum dipilih.');
  var tanggal = p.tanggal ? tglValid_(p.tanggal) : tglStr_(new Date());
  var kgPerBal = kgPerBal_(), per = infoPerusahaan_();
  if (p.perusahaan) Object.keys(KUNCI_PERUSAHAAN_).forEach(function (k) { if (p.perusahaan[k] !== undefined) per[k] = String(p.perusahaan[k] || ''); });
  var peta = petaItem_(), baris = [], pihak = {}, d = {};
  if (jenis === 'INVOICE') {
    var so = baca_(SHEET.SO).filter(function (r) { return String(r.No_SO) === ref && r.Status !== STATUS_SO.DIBATALKAN; });
    if (!so.length) throw new Error('SO ' + ref + ' tidak ditemukan / sudah dibatalkan.');
    so.forEach(function (r) { baris.push(barisDokumen_(r.Kode_Item, r.Nama_Item, angka_(r.Qty_Kg), angka_(r.Harga_Per_Kg), kgPerBal, '')); });
    pihak = { label: 'Customer', nama: so[0].Customer };
    d.tanggalKirim = so[0].Tanggal_Kirim || ''; d.topHari = angka_(so[0].TOP_Hari); d.jatuhTempo = p.jatuhTempo || so[0].Jatuh_Tempo || '';
    d.catatanBawah = per.catatanInvoice;
  } else {
    var po = baca_(SHEET.PO).filter(function (r) { return String(r.No_PO) === ref && r.Status !== STATUS_PO.DIBATALKAN; });
    if (!po.length) throw new Error('PO ' + ref + ' tidak ditemukan / sudah dibatalkan.');
    po.forEach(function (r) { baris.push(barisDokumen_(r.Kode_Item, r.Nama_Item, angka_(r.Qty_Kg), angka_(r.Harga_Per_Kg), kgPerBal, r.Spesifikasi)); });
    pihak = { label: 'Supplier', nama: po[0].Supplier };
    d.perkiraanDatang = po[0].Perkiraan_Datang || ''; d.topHari = angka_(po[0].TOP_Hari); d.jatuhTempo = po[0].Jatuh_Tempo || '';
    d.catatanBawah = per.catatanPo;
  }
  baris.forEach(function (b) { var it = peta[b.kode]; if (it && it.ukuran) b.ukuran = it.ukuran; });
  var total = 0, totalKg = 0; baris.forEach(function (b) { total += b.nilai; totalKg += b.qty; });
  var nomor = String(p.nomor || '').trim() || (jenis === 'INVOICE' ? nomorInvoiceBaru_(tanggal) : ref);
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_(SHEET.DOKUMEN);
  try {
    var id = buatId_(jenis === 'INVOICE' ? 'INV' : 'DPO'), token = tokenDokumen_();
    var lama = baca_(SHEET.DOKUMEN).filter(function (r) { return r.Jenis === jenis && String(r.Nomor) === nomor && r.Status === 'AKTIF'; });
    if (lama.length && jenis === 'INVOICE') throw new Error('Nomor ' + nomor + ' sudah dipakai invoice lain — batalkan yang lama atau pakai nomor lain.');
    /* dokumen PO: satu yang berlaku per nomor — versi lama otomatis diganti (link lama mati) */
    lama.forEach(function (r) {
      ubahBaris_(SHEET.DOKUMEN, r._baris, { Status: 'DIGANTI', Log_Edit: [r.Log_Edit, Utilities.formatDate(new Date(), APP.zona, 'dd/MM HH:mm') + ' ' + u.nama + ': diganti oleh ' + id].filter(String).join('\n') });
    });
    var data = { jenis: jenis, nomor: nomor, ref: ref, tanggal: tanggal, pihak: pihak, perusahaan: per, baris: baris,
                 total: bulat_(total, 0), totalKg: bulat_(totalKg, 3), totalBal: kgPerBal > 0 ? bulat_(totalKg / kgPerBal, 2) : 0, kgPerBal: kgPerBal,
                 catatan: String(p.catatan || ''), dibuatOleh: u.nama, waktu: Utilities.formatDate(new Date(), APP.zona, 'yyyy-MM-dd HH:mm') };
    Object.keys(d).forEach(function (k) { data[k] = d[k]; });
    tambah_(SHEET.DOKUMEN, { ID: id, Jenis: jenis, Nomor: nomor, Ref: ref, Tanggal: tanggal, Waktu: new Date(), Dibuat_Oleh: penandaPencatat_(u), Nama_Pembuat: u.nama,
                             Token: token, Data_JSON: JSON.stringify(data), Status: 'AKTIF', Log_Edit: '' });
    catatLog_(jenis === 'INVOICE' ? 'INVOICE_BUAT' : 'DOK_PO_BUAT', id, nomor + ' · ' + pihak.nama + ' · ' + bulat_(total, 0));
    return { ok: true, id: id, nomor: nomor, token: token, jenis: jenis, total: bulat_(total, 0), pihak: pihak.nama };
  } finally { lock.releaseLock(); }
}
/** Daftar dokumen (untuk satu ref, atau 60 terakhir). Token ikut (pengguna ini memang boleh membagikannya). */
function daftarDokumen(ident, jenis, ref) {
  var u = penggunaSaatIni_(ident);
  if (!bolehDokumen_(u)) throw new Error('Hanya akun dengan akses PO / Sales order.');
  return baca_(SHEET.DOKUMEN).filter(function (r) {
    if (jenis && r.Jenis !== jenis) return false;
    if (ref && String(r.Ref) !== String(ref)) return false;
    return true;
  }).map(function (r) {
    var d = {}; try { d = JSON.parse(r.Data_JSON || '{}'); } catch (e) {}
    return { id: r.ID, jenis: r.Jenis, nomor: r.Nomor, ref: r.Ref, tanggal: r.Tanggal, waktu: jam_(r.Waktu), pembuat: r.Nama_Pembuat,
             token: r.Status === 'AKTIF' ? r.Token : '', status: r.Status, pihak: d.pihak ? d.pihak.nama : '', total: d.total || 0, logEdit: r.Log_Edit || '' };
  }).reverse().slice(0, 60);
}
function batalkanDokumen(id, alasan, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehDokumen_(u)) throw new Error('Hanya akun dengan akses PO / Sales order.');
  alasan = alasanWajib_(alasan);
  var r = cariEntri_(SHEET.DOKUMEN, id);
  if (r.Status === 'DIBATALKAN') throw new Error('Dokumen sudah dibatalkan.');
  ubahBaris_(SHEET.DOKUMEN, r._baris, { Status: 'DIBATALKAN', Log_Edit: [r.Log_Edit, Utilities.formatDate(new Date(), APP.zona, 'dd/MM HH:mm') + ' ' + u.nama + ': dibatalkan — ' + alasan].filter(String).join('\n') });
  catatLog_('DOKUMEN_BATAL', id, r.Nomor + ' | ' + alasan);
  return { ok: true };
}
/** Dipanggil Worker untuk GET /dok/<token> (tanpa login — token adalah rahasianya). null kalau tidak ada / dibatalkan. */
function ambilDokumenPublik_(token) {
  token = String(token || '').replace(/[^a-z0-9]/g, '');
  if (token.length < 16) return null;
  var rows = baca_(SHEET.DOKUMEN);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].Token) === token) {
      if (rows[i].Status !== 'AKTIF') return { dibatalkan: true, diganti: rows[i].Status === 'DIGANTI', nomor: rows[i].Nomor };
      try { return JSON.parse(rows[i].Data_JSON || '{}'); } catch (e) { return null; }
    }
  }
  return null;
}
