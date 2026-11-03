/*************************************************************************
 * IPC — Inventory & Production Control (v13)
 * File 10 : Kiriman.gs
 *
 * v13 "ALUR KIRIM": urutan kerja di lapangan = siapkan → cetak surat jalan → tanda tangan → muat → berangkat → foto SJ.
 *   1. siapkanKiriman   — DRAFT: customer (atau tempat chassen) + item + kg + tanggal rencana. TANPA foto, TANPA pergerakan
 *                         stok. Nomor surat jalan (SJ/YYYY/MM/NNN) langsung diberikan dan dokumen SJ dibuat → bisa dicetak.
 *   2. kirimKiriman     — KIRIM: qty sebenarnya (boleh beda → SJ dibuat ulang dengan nomor yang SAMA), tanggal, foto SJ yang
 *                         sudah ditandatangani (boleh "menyusul"). BARU SEKARANG stok bergerak: CUSTOMER → simpanPengiriman
 *                         (baris Pengiriman, sinkron SO, HPP) · DAUR → mulaiDaurUlang (status BERJALAN).
 *   3. fotoSj           — tambah / ganti foto SJ sesudah kirim (Manager/Admin gudang, tanpa batas 24 jam, selama bulan terbuka).
 * Draft hidup di sheet Kiriman + Kiriman_Detail dan TIDAK PERNAH dibaca oleh hitungStokSemua_, hitungRata_, sinkronSo_,
 * laporan, maupun tutup bulan. Baris Pengiriman / Daur_Ulang yang lahir dari kiriman membawa ID_Kiriman.
 * Kiriman lama (sebelum v13, tanpa ID_Kiriman) tetap tampil sebagai "sudah dikirim" — dikelompokkan per customer + waktu simpan,
 * tanpa migrasi data. Tidak ada rupiah di modul ini.
 *************************************************************************/

var JENIS_KIRIMAN  = { CUSTOMER: 'CUSTOMER', DAUR: 'DAUR' };
var STATUS_KIRIMAN = { DISIAPKAN: 'DISIAPKAN', DIKIRIM: 'DIKIRIM', DIBATALKAN: 'DIBATALKAN' };
var MAKS_RENCANA_HARI = 90;
/* daftar / penghitung "Belum foto DO": kiriman v13 ditunggu fotonya 90 hari; kiriman lama (sebelum v13, foto opsional) hanya 14 hari supaya tidak menumpuk */
var HARI_BELUM_FOTO = 90, HARI_BELUM_FOTO_LAMA = 14;
function batasHari_(n) { var d = new Date(); d.setDate(d.getDate() - n); return d; }   // tanggal rencana kirim paling jauh ke depan

/* Akses (keputusan c + masukan Max 3 Nov: DO dibuat DARI SO):
   - membuat / mengubah / membatalkan DO (draft, tanpa efek stok) = siapa pun yang boleh membuat surat jalan (Manager/Admin dengan GUDANG atau SO);
   - MENGIRIM (stok bergerak) dan foto DO sesudah kirim = Manager/Admin dengan GUDANG;
   - melihat daftar = modul GUDANG atau SO. */
function bolehKirim_(u) { return !!u && bolehReview_(u) && bolehModul_(u, MODUL.GUDANG); }
function bolehSiapkan_(u) { return !!u && bolehSj_(u); }
function bolehLihatKiriman_(u) { return !!u && (bolehModul_(u, MODUL.GUDANG) || bolehModul_(u, MODUL.SO)); }
function wajibKirim_(u) { if (!bolehKirim_(u)) throw new Error('Hanya Manager / Admin dengan akses Gudang yang bisa mengirim kiriman.'); }
function wajibSiapkan_(u) { if (!bolehSiapkan_(u)) throw new Error('Hanya Manager / Admin dengan akses Gudang atau Sales order yang bisa membuat DO (surat jalan).'); }
function wajibLihatKiriman_(u) { if (!bolehLihatKiriman_(u)) throw new Error('Akun ' + u.nama + ' tidak punya akses Gudang / Sales order.'); }
function stempelKiriman_(u, teks) { return Utilities.formatDate(new Date(), APP.zona, 'dd/MM HH:mm') + ' ' + u.nama + ': ' + teks; }

/** Tanggal rencana kirim: kosong = hari ini; boleh ke depan (maks MAKS_RENCANA_HARI), mundur sesuai MAKS_MUNDUR_HARI, bulan belum ditutup. */
function tglRencana_(s) {
  var hariIni = tglStr_(new Date());
  s = String(s || '').trim();
  if (!s) return hariIni;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error('Format tanggal harus YYYY-MM-DD.');
  var maju = new Date(); maju.setDate(maju.getDate() + MAKS_RENCANA_HARI);
  if (s > tglStr_(maju)) throw new Error('Tanggal rencana terlalu jauh (maks ' + MAKS_RENCANA_HARI + ' hari ke depan).');
  var mundur = new Date(); mundur.setDate(mundur.getDate() - MAKS_MUNDUR_HARI);
  if (s < tglStr_(mundur)) throw new Error('Tanggal terlalu lama (maks ' + MAKS_MUNDUR_HARI + ' hari ke belakang).');
  if (bulanTertutup_(s)) throw new Error('Bulan ' + s.slice(0, 7) + ' sudah ditutup.');
  return s;
}

function cariKiriman_(id) { return cariEntri_(SHEET.KIRIMAN, id); }
function detailKiriman_(id, cache) {
  return (cache || baca_(SHEET.KIRIMAN_DETAIL)).filter(function (d) { return d.ID_Kiriman === id; })
    .map(function (d) { return { kode: d.Kode_Item, nama: d.Nama_Item, qty: angka_(d.Qty_Kg), idSo: d.ID_SO || '' }; });
}
function hapusDetailKiriman_(id) {
  var sh = sheet_(SHEET.KIRIMAN_DETAIL);
  var rows = baca_(SHEET.KIRIMAN_DETAIL).filter(function (d) { return d.ID_Kiriman === id; }).sort(function (a, b) { return b._baris - a._baris; });
  rows.forEach(function (d) { sh.deleteRow(d._baris); });
  if (rows.length) lupakanMemo_(SHEET.KIRIMAN_DETAIL);
}
function tulisDetailKiriman_(id, baris, now) {
  baris.forEach(function (b) {
    tambah_(SHEET.KIRIMAN_DETAIL, { ID: buatId_('KDT'), ID_Kiriman: id, Kode_Item: b.kode, Nama_Item: b.nama, Qty_Kg: b.qty, ID_SO: b.idSo || '', Waktu: now });
  });
}

/** kg yang sudah dijadwalkan (draft DISIAPKAN) per baris SO — dipakai kartu SO ("dijadwalkan X kg") dan batas rencana. */
function petaDijadwalkanSo_(kecuali) {
  var aktif = {}, ada = false, out = {};
  baca_(SHEET.KIRIMAN).forEach(function (k) { if (k.Status === STATUS_KIRIMAN.DISIAPKAN && k.Jenis === JENIS_KIRIMAN.CUSTOMER && k.ID !== kecuali) { aktif[k.ID] = 1; ada = true; } });
  if (!ada) return out;
  baca_(SHEET.KIRIMAN_DETAIL).forEach(function (d) { if (aktif[d.ID_Kiriman] && d.ID_SO) out[d.ID_SO] = (out[d.ID_SO] || 0) + angka_(d.Qty_Kg); });
  return out;
}

/** DO per nomor SO (kartu SO & beranda): [{id, nomor, status, tanggalRencana, tanggalKirim, foto, totalKg}] — yang dibatalkan tidak ikut. */
function kirimanPerSo_() {
  var perId = {}, out = {};
  var rows = baca_(SHEET.KIRIMAN).filter(function (k) { return k.Jenis === JENIS_KIRIMAN.CUSTOMER && k.Status !== STATUS_KIRIMAN.DIBATALKAN; });
  if (!rows.length) return out;
  rows.forEach(function (k) { perId[k.ID] = k; });
  var soNo = {}; baca_(SHEET.SO).forEach(function (r) { soNo[r.ID] = r.No_SO; });
  var sudah = {};
  baca_(SHEET.KIRIMAN_DETAIL).forEach(function (d) {
    var k = perId[d.ID_Kiriman], no = d.ID_SO ? soNo[d.ID_SO] : '';
    if (!k || !no || sudah[no + '|' + k.ID]) return;
    sudah[no + '|' + k.ID] = 1;
    (out[no] = out[no] || []).push({ id: k.ID, nomor: k.No_Surat_Jalan || '', status: k.Status, tanggalRencana: k.Tanggal_Rencana || '',
                                     tanggalKirim: k.Tanggal_Kirim || '', foto: !!k.Foto_SJ_URL, totalKg: angka_(k.Total_Kg) });
  });
  return out;
}

/**
 * Periksa & rapikan baris — SEMUA baris diperiksa dulu, gagal satu = gagal semua (pesan menyebut nomor baris).
 * CUSTOMER: baris ber-idSo mengambil item dari SO (customer harus sama; rencana lain + terkirim + baris ini ≤ qty SO).
 * DAUR: hanya SKU scrap. opsi.kecuali = draft yang sedang diubah (jadwalnya sendiri tidak dihitung dua kali);
 * opsi.cekStok = stok kurang hanya menjadi PERINGATAN (produksi mungkin selesai sebelum muat), bukan penolakan.
 */
function periksaBarisKiriman_(jenis, tujuan, baris, opsi) {
  opsi = opsi || {};
  if (!baris || !baris.length) throw new Error('Item belum diisi.');
  var peta = petaItem_(), out = [], total = 0, peringatan = [];
  var soRows = {}, dijadwalkan = {}, disentuh = {};
  if (jenis === JENIS_KIRIMAN.CUSTOMER && baris.some(function (b) { return b && b.idSo; })) {
    baca_(SHEET.SO).forEach(function (r) { soRows[r.ID] = r; });
    dijadwalkan = petaDijadwalkanSo_(opsi.kecuali);
  }
  var butuh = {};
  baris.forEach(function (b, i) {
    var no = 'Baris #' + (i + 1), it = b && b.kode ? peta[b.kode] : null, idSo = '';
    var q = angka_(b && b.qty);
    if (jenis === JENIS_KIRIMAN.CUSTOMER && b && b.idSo) {
      var so = soRows[b.idSo];
      if (!so) throw new Error(no + ': sales order tidak ditemukan (' + b.idSo + ').');
      if (so.Status === STATUS_SO.DIBATALKAN || so.Status === STATUS_SO.SELESAI) throw new Error(no + ' (' + so.Nama_Item + '): SO ' + so.No_SO + ' sudah ' + so.Status + '.');
      if (String(so.Customer) !== String(tujuan)) throw new Error(no + ': customer tidak sama dengan SO ' + so.No_SO + ' (' + so.Customer + ').');
      it = peta[so.Kode_Item]; idSo = so.ID;
      var sisa = angka_(so.Qty_Kg) - angka_(so.Qty_Dikirim_Kg) - (dijadwalkan[so.ID] || 0) - (disentuh[so.ID] || 0);
      if (q > sisa + 0.0001) throw new Error(no + ' (' + so.Nama_Item + '): ' + bulat_(q, 2) + ' kg melebihi sisa SO ' + so.No_SO + ' yang belum dijadwalkan (' + bulat_(Math.max(0, sisa), 2) + ' kg).');
      disentuh[so.ID] = (disentuh[so.ID] || 0) + q;
    }
    if (!it) throw new Error(no + ': item tidak dikenal' + (b && b.kode ? ' (' + b.kode + ')' : '') + '.');
    if (jenis === JENIS_KIRIMAN.DAUR && it.kategori !== KATEGORI_ITEM.SCRAP) throw new Error(no + ' (' + it.nama + '): bukan scrap — hanya SKU scrap yang bisa dikirim ke chassen.');
    if (!(q > 0)) throw new Error(no + ' (' + it.nama + '): qty harus > 0.');
    out.push({ kode: it.kode, nama: it.nama, qty: bulat_(q, 3), idSo: idSo });
    total += q;
    butuh[it.kode] = (butuh[it.kode] || 0) + q;
  });
  if (opsi.cekStok) {
    var stok = hitungStokSemua_();
    Object.keys(butuh).forEach(function (k) {
      var ada = stok[k] ? stok[k].gbj : 0;
      if (butuh[k] > ada + 0.0001) peringatan.push({ kode: k, nama: peta[k].nama, butuh: bulat_(butuh[k], 2), stok: bulat_(ada, 2) });
    });
  }
  return { baris: out, total: bulat_(total, 3), peringatan: peringatan };
}
function samaBaris_(a, b) {
  var k = function (x) { return [x.kode, bulat_(angka_(x.qty), 3), x.idSo || ''].join('|'); };
  return a.length === b.length && a.map(k).sort().join(';') === b.map(k).sort().join(';');
}

/**
 * p = { jenis:'CUSTOMER'|'DAUR', tujuan (nama customer / tempat chassen), tanggalRencana, baris:[{kode,qty,idSo}], pengangkut, catatan, nomor? }
 * Mengembalikan { ok, id, nomor, token, idDokumen, totalKg, peringatan:[{kode,nama,butuh,stok}] }.
 */
function siapkanKiriman(p, ident) {
  var u = penggunaSaatIni_(ident);
  wajibSiapkan_(u);
  p = p || {};
  var jenis = p.jenis === JENIS_KIRIMAN.DAUR ? JENIS_KIRIMAN.DAUR : JENIS_KIRIMAN.CUSTOMER;
  var tujuan = String(p.tujuan || '').trim();
  if (!tujuan) throw new Error(jenis === JENIS_KIRIMAN.DAUR ? 'Tempat chassen (vendor) belum dipilih.' : 'Customer belum dipilih.');
  var tanggal = tglRencana_(p.tanggalRencana);
  var cek = periksaBarisKiriman_(jenis, tujuan, p.baris, { cekStok: true });
  var pengangkut = String(p.pengangkut || '').trim().slice(0, 120);
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();
  var id, now = new Date();
  try {
    id = buatId_('KRM');
    tulisDetailKiriman_(id, cek.baris, now);
    tambah_(SHEET.KIRIMAN, {
      ID: id, Jenis: jenis, Tujuan: tujuan, No_Surat_Jalan: '', Status: STATUS_KIRIMAN.DISIAPKAN,
      Tanggal_Rencana: tanggal, Tanggal_Kirim: '', Pengangkut: pengangkut, Total_Kg: cek.total,
      Foto_SJ_URL: '', Foto_SJ_ID: '', ID_Dokumen: '', Ref_Kirim: '',
      Dibuat_Oleh: penandaPencatat_(u), Nama_Pembuat: u.nama, Waktu_Dibuat: now,
      Dikirim_Oleh: '', Nama_Pengirim: '', Waktu_Kirim: '', Catatan: String(p.catatan || ''), Log_Edit: ''
    });
  } finally { lock.releaseLock(); }
  /* surat jalan dibuat sekarang juga (nomor SJ/YYYY/MM/NNN, bisa langsung dicetak); kalau gagal, seluruh permintaan batal (rollback mesin) */
  var dok = buatDokumen({ jenis: 'SJ', ref: id, nomor: String(p.nomor || ''), pengangkut: pengangkut, tanggal: tglStr_(new Date()) }, ident);
  ubahBaris_(SHEET.KIRIMAN, cariKiriman_(id)._baris, { No_Surat_Jalan: dok.nomor, ID_Dokumen: dok.id });
  catatLog_('KIRIMAN_SIAP', id, (jenis === JENIS_KIRIMAN.DAUR ? 'chassen ' : '') + tujuan + ' • ' + bulat_(cek.total, 2) + ' kg • ' + dok.nomor +
            (cek.peringatan.length ? ' • stok kurang: ' + cek.peringatan.map(function (x) { return x.nama; }).join(', ') : ''));
  return { ok: true, id: id, nomor: dok.nomor, token: dok.token, idDokumen: dok.id, totalKg: bulat_(cek.total, 2), peringatan: cek.peringatan };
}

/** Ubah draft (hanya DISIAPKAN): baris / tanggal rencana / kendaraan / catatan. Tujuan tetap. Surat jalan dibuat ulang dengan nomor yang sama. */
function ubahKiriman(id, p, ident) {
  var u = penggunaSaatIni_(ident);
  wajibSiapkan_(u);
  p = p || {};
  var k = cariKiriman_(id);
  if (k.Status !== STATUS_KIRIMAN.DISIAPKAN) throw new Error('Kiriman sudah ' + k.Status + ' — tidak bisa diubah.');
  var tanggal = p.tanggalRencana !== undefined ? tglRencana_(p.tanggalRencana) : String(k.Tanggal_Rencana || '');
  var cek = p.baris ? periksaBarisKiriman_(k.Jenis, k.Tujuan, p.baris, { kecuali: id, cekStok: true }) : null;
  var log = [], ubah = {};
  if (cek && !samaBaris_(cek.baris, detailKiriman_(id))) { ubah.Total_Kg = cek.total; log.push('item: ' + cek.baris.map(function (b) { return b.nama + ' ' + bulat_(b.qty, 2) + ' kg'; }).join(', ')); } else cek = null;
  if (tanggal !== String(k.Tanggal_Rencana || '')) { ubah.Tanggal_Rencana = tanggal; log.push('rencana: ' + k.Tanggal_Rencana + ' → ' + tanggal); }
  if (p.pengangkut !== undefined && String(p.pengangkut).trim().slice(0, 120) !== String(k.Pengangkut || '')) { ubah.Pengangkut = String(p.pengangkut).trim().slice(0, 120); log.push('kendaraan: ' + (k.Pengangkut || '—') + ' → ' + (ubah.Pengangkut || '—')); }
  if (p.catatan !== undefined && String(p.catatan) !== String(k.Catatan || '')) { ubah.Catatan = String(p.catatan); log.push('catatan diubah'); }
  if (!log.length) return { ok: true, berubah: false, nomor: k.No_Surat_Jalan };
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();
  try {
    if (cek) { hapusDetailKiriman_(id); tulisDetailKiriman_(id, cek.baris, new Date()); }
    ubah.Log_Edit = [k.Log_Edit, stempelKiriman_(u, log.join('; '))].filter(String).join('\n');
    ubahBaris_(SHEET.KIRIMAN, cariKiriman_(id)._baris, ubah);
  } finally { lock.releaseLock(); }
  var dok = buatDokumen({ jenis: 'SJ', ref: id, nomor: k.No_Surat_Jalan, pengangkut: ubah.Pengangkut !== undefined ? ubah.Pengangkut : k.Pengangkut, tanggal: tglStr_(new Date()) }, ident);
  ubahBaris_(SHEET.KIRIMAN, cariKiriman_(id)._baris, { ID_Dokumen: dok.id });
  catatLog_('KIRIMAN_UBAH', id, log.join('; '));
  return { ok: true, berubah: true, nomor: dok.nomor, token: dok.token, log: log, peringatan: cek ? cek.peringatan : [] };
}

/** Batal draft (hanya DISIAPKAN — tidak ada efek stok). Surat jalannya dibatalkan (link mati). Kiriman yang sudah dikirim dibatalkan lewat riwayat transaksinya. */
function batalkanKiriman(id, alasan, ident) {
  var u = penggunaSaatIni_(ident);
  wajibSiapkan_(u);
  alasan = alasanWajib_(alasan);
  var k = cariKiriman_(id);
  if (k.Status === STATUS_KIRIMAN.DIBATALKAN) throw new Error('Kiriman sudah dibatalkan.');
  if (k.Status === STATUS_KIRIMAN.DIKIRIM) throw new Error('Kiriman sudah dikirim — batalkan lewat riwayat barang keluar / daur ulang (stok ikut kembali).');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();
  try {
    var stempel = stempelKiriman_(u, 'dibatalkan — ' + alasan);
    ubahBaris_(SHEET.KIRIMAN, k._baris, { Status: STATUS_KIRIMAN.DIBATALKAN, Log_Edit: [k.Log_Edit, stempel].filter(String).join('\n') });
    baca_(SHEET.DOKUMEN).forEach(function (r) {
      if (r.Jenis !== 'SJ' || String(r.Ref) !== id || r.Status !== 'AKTIF') return;
      ubahBaris_(SHEET.DOKUMEN, r._baris, { Status: 'DIBATALKAN', Log_Edit: [r.Log_Edit, stempel].filter(String).join('\n') });
    });
    catatLog_('KIRIMAN_BATAL', id, (k.No_Surat_Jalan || '') + ' | ' + alasan);
    return { ok: true, status: STATUS_KIRIMAN.DIBATALKAN };
  } finally { lock.releaseLock(); }
}

/**
 * KIRIM. p = { tanggalKirim (aturan tanggal transaksi: ≤ hari ini, bulan terbuka), baris:[{kode,qty,idSo}] (qty sebenarnya; kosong = sesuai draft),
 *              foto (opsional — "foto menyusul" → masuk daftar Belum foto SJ), pengangkut, catatan }
 * Baru sekarang stok bergerak. Qty berbeda dari draft → surat jalan dibuat ulang dengan nomor yang SAMA (versi lama DIGANTI) → cetakUlang: true.
 */
function kirimKiriman(id, p, ident) {
  var u = penggunaSaatIni_(ident);
  wajibKirim_(u);
  p = p || {};
  var k = cariKiriman_(id);
  if (k.Status !== STATUS_KIRIMAN.DISIAPKAN) throw new Error('Kiriman sudah ' + k.Status + '.');
  var tanggal = tglValid_(p.tanggalKirim);
  var draft = detailKiriman_(id);
  var masuk = p.baris && p.baris.length ? p.baris : draft.map(function (d) { return { kode: d.kode, qty: d.qty, idSo: d.idSo }; });
  var cek = periksaBarisKiriman_(k.Jenis, k.Tujuan, masuk, { kecuali: id });
  var berubah = !samaBaris_(cek.baris, draft);
  var pengangkut = p.pengangkut !== undefined ? String(p.pengangkut).trim().slice(0, 120) : String(k.Pengangkut || '');
  var catatan = [k.Catatan, p.catatan].filter(String).join(' | ');
  var foto = p.foto && String(p.foto).indexOf('data:image') === 0 ? p.foto : '';
  var hasil, ref;
  if (k.Jenis === JENIS_KIRIMAN.DAUR) {
    hasil = mulaiDaurUlang({ vendor: k.Tujuan, tanggal: tanggal, noSuratJalan: k.No_Surat_Jalan,
      scrap: cek.baris.map(function (b) { return { kode: b.kode, qty: b.qty }; }), catatan: catatan, foto: foto, ident: ident });
    ref = hasil.id;
  } else {
    hasil = simpanPengiriman({ jenis: JENIS_PENGIRIMAN.KELUAR, customer: k.Tujuan, tanggal: tanggal, noSuratJalan: k.No_Surat_Jalan,
      baris: cek.baris, catatan: catatan, foto: foto, ident: ident });
    ref = hasil.ids.join(',');
  }
  /* tautkan baris transaksi ke kiriman ini; foto SJ (kalau ada) sudah tersimpan di baris itu — Kiriman menyimpan salinannya */
  var fotoUrl = '', fotoId = '';
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();
  try {
    if (k.Jenis === JENIS_KIRIMAN.DAUR) {
      var d = cariEntri_(SHEET.DAUR, ref);
      ubahBaris_(SHEET.DAUR, d._baris, { ID_Kiriman: id });
      fotoUrl = d.Foto_Kirim_URL || '';
    } else {
      var ids = {}; hasil.ids.forEach(function (x) { ids[x] = 1; });
      baca_(SHEET.PENGIRIMAN).forEach(function (r) {
        if (!ids[r.ID]) return;
        ubahBaris_(SHEET.PENGIRIMAN, r._baris, { ID_Kiriman: id });
        if (r.Foto_URL) { fotoUrl = r.Foto_URL; fotoId = r.Foto_ID || ''; }
      });
    }
    if (berubah) { hapusDetailKiriman_(id); tulisDetailKiriman_(id, cek.baris, new Date()); }
    var stempel = stempelKiriman_(u, 'dikirim' + (berubah ? ' — qty diubah dari draft' : '') + (foto ? '' : ' — foto SJ menyusul'));
    ubahBaris_(SHEET.KIRIMAN, cariKiriman_(id)._baris, {
      Status: STATUS_KIRIMAN.DIKIRIM, Tanggal_Kirim: tanggal, Pengangkut: pengangkut, Ref_Kirim: ref, Total_Kg: cek.total,
      Foto_SJ_URL: fotoUrl, Foto_SJ_ID: fotoId, Dikirim_Oleh: penandaPencatat_(u), Nama_Pengirim: u.nama, Waktu_Kirim: new Date(),
      Log_Edit: [k.Log_Edit, stempel].filter(String).join('\n')
    });
  } finally { lock.releaseLock(); }
  var dok = null;
  if (berubah || pengangkut !== String(k.Pengangkut || '')) {   // surat jalan dibuat ulang — nomor sama, versi lama DIGANTI
    dok = buatDokumen({ jenis: 'SJ', ref: id, nomor: k.No_Surat_Jalan, pengangkut: pengangkut, tanggal: tglStr_(new Date()) }, ident);
    ubahBaris_(SHEET.KIRIMAN, cariKiriman_(id)._baris, { ID_Dokumen: dok.id });
  }
  catatLog_('KIRIMAN_KIRIM', id, k.Tujuan + ' • ' + bulat_(cek.total, 2) + ' kg • ' + k.No_Surat_Jalan + (foto ? '' : ' • foto menyusul'));
  return { ok: true, id: id, jenis: k.Jenis, nomor: k.No_Surat_Jalan, ref: ref, totalKg: bulat_(cek.total, 2),
           cetakUlang: !!dok, token: dok ? dok.token : '', fotoMenyusul: !foto };
}

/**
 * Tambah / ganti foto surat jalan yang sudah ditandatangani. ref = ID kiriman (KRM-…) | 'OUT-…,OUT-…' (kiriman lama, satu grup) | 'DUR-…' (daur lama).
 * Manager / Admin dengan akses Gudang, tanpa batas 24 jam / MAKS_EDIT_HARI, selama bulan kirimnya belum ditutup. Foto lama dihapus dari penyimpanan.
 */
function fotoSj(ref, foto, ident) {
  var u = penggunaSaatIni_(ident);
  wajibKirim_(u);
  if (!foto || String(foto).indexOf('data:image') !== 0) throw new Error('Foto belum dipilih.');
  ref = String(ref || '').trim();
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();
  try {
    var k = null;
    if (/^KRM-/.test(ref)) {
      k = cariKiriman_(ref);
      if (k.Status !== STATUS_KIRIMAN.DIKIRIM) throw new Error(k.Status === STATUS_KIRIMAN.DISIAPKAN ? 'Kiriman belum dikirim — foto SJ diunggah saat Kirim.' : 'Kiriman sudah dibatalkan.');
      if (bulanTertutup_(k.Tanggal_Kirim)) throw new Error('Bulan kiriman ini sudah ditutup — foto tidak bisa diubah.');
    }
    var ids = (k ? String(k.Ref_Kirim || '') : ref).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    if (!ids.length) throw new Error('Kiriman tidak punya baris transaksi.');
    var target = [];   // { sheet, row, kolUrl, kolId }
    if (/^DUR-/.test(ids[0])) {
      var d = cariEntri_(SHEET.DAUR, ids[0]);
      if (d.Status === STATUS_DAUR.DIBATALKAN) throw new Error('Daur ulang ' + ids[0] + ' sudah dibatalkan.');
      if (bulanTertutup_(d.Tanggal)) throw new Error('Bulan kiriman ini sudah ditutup — foto tidak bisa diubah.');
      target.push({ sheet: SHEET.DAUR, row: d, kolUrl: 'Foto_Kirim_URL', kolId: '' });
    } else {
      var peta = {}; baca_(SHEET.PENGIRIMAN).forEach(function (r) { peta[r.ID] = r; });
      ids.forEach(function (id) {
        var r = peta[id];
        if (!r) throw new Error('Pengiriman tidak ditemukan: ' + id);
        if (r.Jenis !== JENIS_PENGIRIMAN.KELUAR) throw new Error('Bukan barang keluar ke customer: ' + id);
        if (r.Status === STATUS_TRANSFER.DIBATALKAN) throw new Error('Pengiriman ' + id + ' sudah dibatalkan.');
        if (bulanTertutup_(r.Tanggal)) throw new Error('Bulan kiriman ini sudah ditutup — foto tidak bisa diubah.');
        target.push({ sheet: SHEET.PENGIRIMAN, row: r, kolUrl: 'Foto_URL', kolId: 'Foto_ID' });
      });
    }
    var ganti = !!((k && k.Foto_SJ_URL) || target.some(function (t) { return !!t.row[t.kolUrl]; }));
    var f = unggahFoto_(foto, 'SJ');
    if (!f.url) throw new Error('Foto gagal disimpan' + (f.error ? ': ' + f.error : '.'));
    var dihapus = {};
    if (k && k.Foto_SJ_URL) { dihapus[k.Foto_SJ_URL] = 1; hapusFotoFile_(k.Foto_SJ_ID || '', k.Foto_SJ_URL); }
    target.forEach(function (t) { var url = t.row[t.kolUrl]; if (url && !dihapus[url]) { dihapus[url] = 1; hapusFotoFile_(t.kolId ? (t.row[t.kolId] || '') : '', url); } });
    var stempel = stempelKiriman_(u, ganti ? 'foto SJ diganti' : 'foto SJ ditambahkan');
    target.forEach(function (t) {
      var ubah = {}; ubah[t.kolUrl] = f.url; if (t.kolId) ubah[t.kolId] = f.id;
      if (HEADER[t.sheet].indexOf('Log_Edit') >= 0) ubah.Log_Edit = [t.row.Log_Edit, stempel].filter(String).join('\n');
      ubahBaris_(t.sheet, t.row._baris, ubah);
    });
    if (k) ubahBaris_(SHEET.KIRIMAN, k._baris, { Foto_SJ_URL: f.url, Foto_SJ_ID: f.id, Log_Edit: [k.Log_Edit, stempel].filter(String).join('\n') });
    catatLog_(ganti ? 'FOTO_GANTI' : 'FOTO_TAMBAH', ref, 'surat jalan' + (k ? ' ' + k.No_Surat_Jalan : ''));
    return { ok: true, foto: f.url, ganti: ganti };
  } finally { lock.releaseLock(); }
}

/* ---------- daftar ---------- */
function dokSjAktif_() {
  var perRef = {}, perIds = {};
  baca_(SHEET.DOKUMEN).forEach(function (r) {
    if (r.Jenis !== 'SJ' || r.Status !== 'AKTIF') return;
    var ref = String(r.Ref || '');
    perRef[ref] = r.Token;
    if (/^OUT-/.test(ref)) perIds[ref.split(',').map(function (s) { return s.trim(); }).sort().join(',')] = r.Token;
  });
  return { perRef: perRef, perIds: perIds };
}
function bolehFotoSj_(u, tanggal) { return bolehKirim_(u) && !bulanTertutup_(tanggal); }
function ringkasKiriman_(k, det, dok, peta, soRows, u, lihatDok) {
  var noSo = {};
  var baris = detailKiriman_(k.ID, det).map(function (b) {
    var so = b.idSo ? soRows[b.idSo] : null, it = peta[b.kode];
    if (so && so.No_SO) noSo[so.No_SO] = 1;
    return { kode: b.kode, nama: b.nama, qty: b.qty, idSo: b.idSo, noSo: so ? so.No_SO : '', ukuran: so ? String(so.Ukuran || '') : (it ? it.ukuran : '') };
  });
  var siap = k.Status === STATUS_KIRIMAN.DISIAPKAN, dikirim = k.Status === STATUS_KIRIMAN.DIKIRIM;
  return {
    id: k.ID, lama: false, jenis: k.Jenis, tujuan: k.Tujuan, status: k.Status, noSuratJalan: k.No_Surat_Jalan || '',
    tanggalRencana: k.Tanggal_Rencana || '', tanggalKirim: k.Tanggal_Kirim || '', pengangkut: k.Pengangkut || '', totalKg: angka_(k.Total_Kg),
    baris: baris, noSo: Object.keys(noSo).sort().join(', '), foto: k.Foto_SJ_URL || '', ref: k.Ref_Kirim || '',
    pembuat: k.Nama_Pembuat || '', pengirim: k.Nama_Pengirim || '', waktuDibuat: jam_(k.Waktu_Dibuat), waktuKirim: k.Waktu_Kirim ? jam_(k.Waktu_Kirim) : '',
    catatan: k.Catatan || '', logEdit: k.Log_Edit || '', token: lihatDok ? (dok.perRef[k.ID] || '') : '',
    bolehKirim: siap && bolehKirim_(u), bolehUbah: siap && bolehSiapkan_(u), bolehBatal: siap && bolehSiapkan_(u),
    bolehFoto: dikirim && bolehFotoSj_(u, k.Tanggal_Kirim)
  };
}
/** Kiriman lama (sebelum v13): baris Pengiriman KELUAR / Daur_Ulang tanpa ID_Kiriman — dikelompokkan, tampil sebagai sudah dikirim. */
function kirimanLama_(jenis, batas, dok, soRows, peta, u, lihatDok) {
  var out = [];
  if (!jenis || jenis === JENIS_KIRIMAN.CUSTOMER) {
    var grup = {}, urut = [];
    baca_(SHEET.PENGIRIMAN).forEach(function (r) {
      if (r.Jenis !== JENIS_PENGIRIMAN.KELUAR || r.ID_Kiriman || !dihitung_(r) || new Date(r.Waktu) < batas) return;
      var key = r.Customer + '|' + kelompokWaktu_(r.Waktu);
      if (!grup[key]) { grup[key] = []; urut.push(key); }
      grup[key].push(r);
    });
    urut.forEach(function (key) {
      var rows = grup[key], ids = rows.map(function (r) { return r.ID; }), noSo = {}, total = 0, foto = '', r0 = rows[0];
      var baris = rows.map(function (r) {
        var so = r.ID_SO ? soRows[r.ID_SO] : null, it = peta[r.Kode_Item]; if (so && so.No_SO) noSo[so.No_SO] = 1;
        total += angka_(r.Qty_Kg); if (r.Foto_URL && !foto) foto = r.Foto_URL;
        return { id: r.ID, kode: r.Kode_Item, nama: r.Nama_Item, qty: angka_(r.Qty_Kg), idSo: r.ID_SO || '', noSo: so ? so.No_SO : '', ukuran: so ? String(so.Ukuran || '') : (it ? it.ukuran : '') };
      });
      out.push({ id: ids.join(','), lama: true, jenis: JENIS_KIRIMAN.CUSTOMER, tujuan: r0.Customer, status: STATUS_KIRIMAN.DIKIRIM, noSuratJalan: r0.No_Surat_Jalan || '',
        tanggalRencana: '', tanggalKirim: r0.Tanggal || '', pengangkut: '', totalKg: bulat_(total, 3), baris: baris, noSo: Object.keys(noSo).sort().join(', '),
        foto: foto, ref: ids.join(','), pembuat: '', pengirim: r0.Nama_Pencatat || '', waktuDibuat: '', waktuKirim: jam_(r0.Waktu), catatan: r0.Catatan || '', logEdit: '',
        token: lihatDok ? (dok.perIds[ids.slice().sort().join(',')] || '') : '', bolehKirim: false, bolehUbah: false, bolehBatal: false,
        bolehFoto: bolehFotoSj_(u, r0.Tanggal), waktuRaw: new Date(r0.Waktu).getTime() });
    });
  }
  if (!jenis || jenis === JENIS_KIRIMAN.DAUR) {
    var det = baca_(SHEET.DAUR_DETAIL);
    baca_(SHEET.DAUR).forEach(function (r) {
      if (r.ID_Kiriman || r.Status === STATUS_DAUR.DIBATALKAN || new Date(r.Waktu_Kirim) < batas) return;
      var baris = detailDaur_(r.ID, JENIS_DAUR_DETAIL.SCRAP, det).map(function (x) { return { kode: x.kode, nama: x.nama, qty: x.qty, idSo: '', noSo: '', ukuran: '' }; });
      out.push({ id: r.ID, lama: true, jenis: JENIS_KIRIMAN.DAUR, tujuan: r.Vendor, status: STATUS_KIRIMAN.DIKIRIM, noSuratJalan: r.No_Surat_Jalan || '',
        tanggalRencana: '', tanggalKirim: r.Tanggal || '', pengangkut: '', totalKg: angka_(r.Total_Scrap_Kg), baris: baris, noSo: '',
        foto: r.Foto_Kirim_URL || '', ref: r.ID, pembuat: '', pengirim: r.Nama_Pencatat || '', waktuDibuat: '', waktuKirim: jam_(r.Waktu_Kirim), catatan: r.Catatan || '', logEdit: '',
        token: lihatDok ? (dok.perRef[r.ID] || '') : '', bolehKirim: false, bolehUbah: false, bolehBatal: false,
        bolehFoto: bolehFotoSj_(u, r.Tanggal), daurStatus: r.Status, waktuRaw: new Date(r.Waktu_Kirim).getTime() });
    });
  }
  return out;
}
/**
 * tab: 'siap' (DISIAPKAN) | 'belumFoto' (sudah dikirim, tanpa foto SJ) | 'dikirim' (sudah dikirim, N hari terakhir) | 'semua'.
 * jenis: CUSTOMER | DAUR | '' (keduanya). Akses: modul GUDANG (token link hanya untuk yang boleh membuat surat jalan).
 */
function daftarKiriman(ident, tab, jenis, hari) {
  var u = penggunaSaatIni_(ident);
  wajibLihatKiriman_(u);
  tab = tab || 'siap'; jenis = jenis || '';
  hari = hari || (tab === 'belumFoto' ? HARI_BELUM_FOTO : 30);
  var batas = batasHari_(hari), batasLama = tab === 'belumFoto' ? batasHari_(Math.min(hari, HARI_BELUM_FOTO_LAMA)) : batas;
  var det = baca_(SHEET.KIRIMAN_DETAIL), dok = dokSjAktif_(), peta = petaItem_(), soRows = {}, lihatDok = bolehSj_(u);
  baca_(SHEET.SO).forEach(function (r) { soRows[r.ID] = r; });
  var out = [];
  baca_(SHEET.KIRIMAN).forEach(function (k) {
    if (jenis && k.Jenis !== jenis) return;
    if (tab === 'siap' && k.Status !== STATUS_KIRIMAN.DISIAPKAN) return;
    if ((tab === 'dikirim' || tab === 'belumFoto') && k.Status !== STATUS_KIRIMAN.DIKIRIM) return;
    if (tab === 'belumFoto' && k.Foto_SJ_URL) return;
    if (tab !== 'siap' && k.Waktu_Kirim && new Date(k.Waktu_Kirim) < batas) return;
    if (tab === 'semua' && k.Status === STATUS_KIRIMAN.DIBATALKAN && new Date(k.Waktu_Dibuat) < batas) return;
    var o = ringkasKiriman_(k, det, dok, peta, soRows, u, lihatDok);
    o.waktuRaw = new Date(k.Status === STATUS_KIRIMAN.DISIAPKAN ? k.Waktu_Dibuat : (k.Waktu_Kirim || k.Waktu_Dibuat)).getTime();
    out.push(o);
  });
  if (tab !== 'siap') kirimanLama_(jenis, batasLama, dok, soRows, peta, u, lihatDok).forEach(function (o) { if (tab !== 'belumFoto' || !o.foto) out.push(o); });
  if (tab === 'siap') out.sort(function (a, b) { return String(a.tanggalRencana).localeCompare(String(b.tanggalRencana)) || a.waktuRaw - b.waktuRaw; });
  else out.sort(function (a, b) { return b.waktuRaw - a.waktuRaw; });
  out.forEach(function (o) { delete o.waktuRaw; });
  return out.slice(0, 150);
}
/** Satu kiriman (untuk layar Kirim / detail). */
function ambilKiriman(id, ident) {
  var u = penggunaSaatIni_(ident);
  wajibLihatKiriman_(u);
  var k = cariKiriman_(id), soRows = {};
  baca_(SHEET.SO).forEach(function (r) { soRows[r.ID] = r; });
  var o = ringkasKiriman_(k, null, dokSjAktif_(), petaItem_(), soRows, u, bolehSj_(u));
  if (k.Status === STATUS_KIRIMAN.DISIAPKAN) {
    /* stok sekarang per item — petunjuk di layar Kirim (kg, tanpa harga) */
    var stok = hitungStokSemua_();
    o.baris.forEach(function (b) { b.stok = bulat_(stok[b.kode] ? stok[b.kode].gbj : 0, 2); });
  }
  return o;
}
