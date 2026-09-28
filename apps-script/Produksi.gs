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
