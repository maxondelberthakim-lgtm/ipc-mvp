/**********************************************************************
 * IPC — Inventory & Production Control (v10.1)
 * File 7 : Produksi.gs — laporan shift (blowing + cutting) & opname produksi
 *
 * Alur produksi Mike:
 *   2 shift × 12 jam (08.00–20.00, 20.00–08.00). Satu laporan per shift, dua mesin, operator TERPISAH:
 *   BLOWING : operator blowing mengambil biji plastik dari gudang → roll per kualitas + BS per kualitas
 *   CUTTING : operator cutting mengambil roll (dari tumpukan — boleh dari shift mana pun) → polybag per kualitas + BS
 * Laporan ini HANYA untuk mencatat: siapa mengerjakan apa & berapa, biji plastik yang keluar gudang, BS.
 * Tidak ada hubungan otomatis antar mesin dan tidak ada susut per shift — roll jadi dan roll dipakai
 * masing-masing ditotal; sisanya dihitung di opname produksi akhir bulan (rekonsiliasi).
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

/** Nama operator yang pernah dipakai (per mesin) + pengguna aktif — untuk search bar operator. */
function daftarOperator_() {
  var ada = { BLOWING: {}, CUTTING: {} }, out = { BLOWING: [], CUTTING: [] };
  function tambah(m, n) { n = String(n || '').trim(); if (!n) return; var k = n.toLowerCase(); if (ada[m][k]) return; ada[m][k] = true; out[m].push(n); }
  baca_(SHEET.SHIFT).forEach(function (r) {
    String(r.Operator_Blowing || '').split(',').forEach(function (n) { tambah('BLOWING', n); });
    String(r.Operator_Cutting || '').split(',').forEach(function (n) { tambah('CUTTING', n); });
  });
  baca_(SHEET.PENGGUNA).forEach(function (r) { if (String(r.Aktif).toUpperCase() !== 'TIDAK') { tambah('BLOWING', r.Nama); tambah('CUTTING', r.Nama); } });
  out.BLOWING.sort(function (a, b) { return a.localeCompare(b); }); out.CUTTING.sort(function (a, b) { return a.localeCompare(b); });
  return out;
}

/** Untuk form laporan shift: kualitas + SKU-nya, bahan baku, operator per mesin, shift + jam. */
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
  return { kualitas: kualitas, kurang: kurang, bahan: bahan, operator: daftarOperator_(), shift: DAFTAR_SHIFT, jamShift: JAM_SHIFT, hariIni: tglStr_(new Date()) };
}

function bolehShift_(u) { return bolehReview_(u); }

/**
 * p = { tanggal, shift,
 *       blowing: { operator:[…]|'a, b', ambil:[{kode,qty}], hasil:[{kualitas,qty}], bs:[{kualitas,qty}] } | null (mesin tidak jalan),
 *       cutting: { operator:[…], rollPakai:[{kualitas,qty}], hasil:[{kualitas,qty}], bs:[{kualitas,qty}] } | null,
 *       catatan, foto, timpa }
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
      return r.Status !== STATUS_SHIFT.DIBATALKAN && String(r.Tanggal) === d.tanggal && String(r.Shift) === d.shift;
    });
    if (dobel.length && !p.timpa) throw new Error('Laporan shift ' + d.shift + ' tanggal ' + d.tanggal + ' sudah ada (' + dobel[0].ID + '). Buka laporan itu untuk mengubahnya.');
    tulisDetailShift_(id, d, now);
    tambah_(SHEET.SHIFT, kolomShift_(d, {
      ID: id, Waktu: now, Dicatat_Oleh: penandaPencatat_(u), Nama_Pencatat: u.nama, Foto_URL: foto.url,
      Catatan: p.catatan || '', Log_Edit: '', Status: STATUS_SHIFT.AKTIF
    }));
    catatLog_('SHIFT_SIMPAN', id, 'S' + d.shift + ' ' + d.tanggal + ' • blowing: ' + (d.blowing.operator || '—') + ' roll ' + bulat_(d.blowing.totalHasil, 1) + ' kg • cutting: ' + (d.cutting.operator || '—') + ' polybag ' + bulat_(d.cutting.totalHasil, 1) + ' kg • BS ' + bulat_(d.blowing.totalBs + d.cutting.totalBs, 1) + ' kg');
    return ringkasShift_(cariEntri_(SHEET.SHIFT, id), u);
  } finally { lock.releaseLock(); }
}

function kolomShift_(d, ekstra) {
  var o = {
    Tanggal: d.tanggal, Shift: d.shift, Operator_Blowing: d.blowing.operator, Operator_Cutting: d.cutting.operator,
    Total_Ambil_Kg: bulat_(d.blowing.totalAmbil, 3), Total_Roll_Kg: bulat_(d.blowing.totalHasil, 3), Total_BS_Blowing_Kg: bulat_(d.blowing.totalBs, 3),
    Total_Roll_Pakai_Kg: bulat_(d.cutting.totalRoll, 3), Total_Polybag_Kg: bulat_(d.cutting.totalHasil, 3), Total_BS_Cutting_Kg: bulat_(d.cutting.totalBs, 3)
  };
  Object.keys(ekstra || {}).forEach(function (k) { o[k] = ekstra[k]; });
  return o;
}

function operatorStr_(v) {
  var op = Array.isArray(v) ? v : String(v || '').split(',');
  return op.map(function (s) { return String(s || '').replace(/\s+/g, ' ').trim(); }).filter(String).join(', ');
}

/** Validasi + normalisasi isi laporan (dipakai simpan & ubah). Mesin yang tidak jalan = null / kosong. */
function susunShift_(p) {
  p = p || {};
  var tanggal = tglValid_(p.tanggal);
  var shift = String(p.shift || '').trim();
  if (DAFTAR_SHIFT.indexOf(shift) < 0) throw new Error('Shift harus 1 atau 2.');
  var peta = petaItem_(), kual = {};
  petaKualitas_().forEach(function (q) { kual[q.kualitas] = q; });
  function perKualitas(list, ambilSku, label) {
    var out = [], total = 0;
    (list || []).forEach(function (h) {
      var q = angka_(h.qty); if (q <= 0) return;
      var k = kual[h.kualitas]; if (!k) throw new Error('Kualitas tidak dikenal: ' + h.kualitas);
      var it = ambilSku(k);
      if (!it) throw new Error('SKU ' + label + ' untuk kualitas ' + k.nama + ' belum ada di Master_Item.');
      out.push({ kode: it.kode, nama: it.nama, kualitas: k.kualitas, qty: q }); total += q;
    });
    return { list: out, total: total };
  }
  var kosong = { operator: '', ambil: [], hasil: [], bs: [], roll: [], totalAmbil: 0, totalHasil: 0, totalBs: 0, totalRoll: 0, aktif: false };

  /* ---- BLOWING ---- */
  var b = p.blowing, blowing = JSON.parse(JSON.stringify(kosong));
  if (b && (operatorStr_(b.operator) || (b.ambil || []).length || (b.hasil || []).length || (b.bs || []).length)) {
    blowing.aktif = true;
    blowing.operator = operatorStr_(b.operator);
    if (!blowing.operator) throw new Error('Operator blowing belum diisi.');
    (b.ambil || []).forEach(function (x) {
      var q = angka_(x.qty); if (q <= 0) return;
      var it = peta[x.kode]; if (!it) throw new Error('Bahan baku tidak dikenal: ' + x.kode);
      if (it.kategori !== KATEGORI_ITEM.BAHAN_BAKU && it.kategori !== KATEGORI_ITEM.KEDUANYA) throw new Error(it.nama + ' bukan bahan baku.');
      blowing.ambil.push({ kode: it.kode, nama: it.nama, kualitas: it.kualitas || '', qty: q }); blowing.totalAmbil += q;
    });
    var hb = perKualitas(b.hasil, function (k) { return k.roll; }, 'roll'); blowing.hasil = hb.list; blowing.totalHasil = hb.total;
    var bb = perKualitas(b.bs, function (k) { return k.bs; }, 'BS'); blowing.bs = bb.list; blowing.totalBs = bb.total;
    if (!blowing.ambil.length && !blowing.hasil.length && !blowing.bs.length) throw new Error('Blowing: isi biji plastik yang diambil dan/atau roll jadi.');
  }

  /* ---- CUTTING ---- */
  var c = p.cutting, cutting = JSON.parse(JSON.stringify(kosong));
  if (c && (operatorStr_(c.operator) || (c.rollPakai || []).length || (c.hasil || []).length || (c.bs || []).length)) {
    cutting.aktif = true;
    cutting.operator = operatorStr_(c.operator);
    if (!cutting.operator) throw new Error('Operator cutting belum diisi.');
    var rc = perKualitas(c.rollPakai, function (k) { return k.roll; }, 'roll'); cutting.roll = rc.list; cutting.totalRoll = rc.total;
    var hc = perKualitas(c.hasil, function (k) { return k.jadi; }, 'polybag'); cutting.hasil = hc.list; cutting.totalHasil = hc.total;
    var bc = perKualitas(c.bs, function (k) { return k.bs; }, 'BS'); cutting.bs = bc.list; cutting.totalBs = bc.total;
    if (!cutting.roll.length && !cutting.hasil.length && !cutting.bs.length) throw new Error('Cutting: isi roll yang diambil dan/atau polybag jadi.');
  }
  if (!blowing.aktif && !cutting.aktif) throw new Error('Isi minimal satu mesin (blowing atau cutting).');
  return { tanggal: tanggal, shift: shift, blowing: blowing, cutting: cutting };
}

function tulisDetailShift_(id, d, now) {
  function tulis(mesin, list, jenis) {
    list.forEach(function (x) {
      tambah_(SHEET.SHIFT_DETAIL, { ID: buatId_('SDT'), ID_Shift: id, Mesin: mesin, Jenis: jenis, Kode_Item: x.kode, Nama_Item: x.nama, Kualitas: x.kualitas, Qty_Kg: bulat_(x.qty, 3), Waktu: now });
    });
  }
  tulis(MESIN.BLOWING, d.blowing.ambil, JENIS_SHIFT.AMBIL); tulis(MESIN.BLOWING, d.blowing.hasil, JENIS_SHIFT.HASIL); tulis(MESIN.BLOWING, d.blowing.bs, JENIS_SHIFT.BS);
  tulis(MESIN.CUTTING, d.cutting.roll, JENIS_SHIFT.PAKAI_ROLL); tulis(MESIN.CUTTING, d.cutting.hasil, JENIS_SHIFT.HASIL); tulis(MESIN.CUTTING, d.cutting.bs, JENIS_SHIFT.BS);
}

function pecahOperator_(s) { return String(s || '').split(',').map(function (x) { return x.trim(); }).filter(String); }

function ringkasShift_(r, u, detCache) {
  var det = (detCache || baca_(SHEET.SHIFT_DETAIL)).filter(function (d) { return d.ID_Shift === r.ID; });
  function ambil(mesin, jenis) {
    return det.filter(function (d) { return d.Mesin === mesin && d.Jenis === jenis; })
      .map(function (d) { return { kode: d.Kode_Item, nama: d.Nama_Item, kualitas: d.Kualitas || '', qty: angka_(d.Qty_Kg) }; });
  }
  var ambilKg = angka_(r.Total_Ambil_Kg), rollKg = angka_(r.Total_Roll_Kg), bsB = angka_(r.Total_BS_Blowing_Kg);
  var rollPakai = angka_(r.Total_Roll_Pakai_Kg), pbKg = angka_(r.Total_Polybag_Kg), bsC = angka_(r.Total_BS_Cutting_Kg);
  return {
    id: r.ID, waktu: jam_(r.Waktu), tanggal: r.Tanggal, shift: String(r.Shift), jam: JAM_SHIFT[String(r.Shift)] || '',
    blowing: { aktif: !!(r.Operator_Blowing || ambilKg || rollKg || bsB), operator: pecahOperator_(r.Operator_Blowing),
               ambil: ambil(MESIN.BLOWING, JENIS_SHIFT.AMBIL), hasil: ambil(MESIN.BLOWING, JENIS_SHIFT.HASIL), bs: ambil(MESIN.BLOWING, JENIS_SHIFT.BS),
               totalAmbil: ambilKg, totalHasil: rollKg, totalBs: bsB, persenBs: ambilKg > 0 ? bulat_(bsB / ambilKg * 100, 2) : 0 },
    cutting: { aktif: !!(r.Operator_Cutting || rollPakai || pbKg || bsC), operator: pecahOperator_(r.Operator_Cutting),
               rollPakai: ambil(MESIN.CUTTING, JENIS_SHIFT.PAKAI_ROLL), hasil: ambil(MESIN.CUTTING, JENIS_SHIFT.HASIL), bs: ambil(MESIN.CUTTING, JENIS_SHIFT.BS),
               totalRoll: rollPakai, totalHasil: pbKg, totalBs: bsC, persenBs: rollPakai > 0 ? bulat_(bsC / rollPakai * 100, 2) : 0 },
    totalBs: bulat_(bsB + bsC, 3),
    pencatat: r.Nama_Pencatat, foto: r.Foto_URL || '', catatan: r.Catatan || '', logEdit: r.Log_Edit || '', status: r.Status,
    bolehEdit: !!u && bolehShift_(u) && r.Status !== STATUS_SHIFT.DIBATALKAN && !bulanTertutup_(r.Tanggal)
  };
}

/** Daftar laporan shift N hari terakhir / satu tanggal (semua peran boleh lihat — tidak ada harga di sini). */
function daftarLaporanShift(ident, hari, tanggal) {
  var u = penggunaSaatIni_(ident);
  var batas = new Date(); batas.setDate(batas.getDate() - (hari || 14));
  var batasStr = tglStr_(batas), det = baca_(SHEET.SHIFT_DETAIL);
  return baca_(SHEET.SHIFT).filter(function (r) {
    if (r.Status === STATUS_SHIFT.DIBATALKAN) return false;
    if (tanggal) return String(r.Tanggal) === String(tanggal);
    return String(r.Tanggal) >= batasStr;
  }).map(function (r) { return ringkasShift_(r, u, det); })
    .sort(function (a, b) { return (b.tanggal + b.shift).localeCompare(a.tanggal + a.shift); });
}

function ambilLaporanShift(id, ident) {
  var u = penggunaSaatIni_(ident);
  return ringkasShift_(cariEntri_(SHEET.SHIFT, id), u);
}

/** Ganti isi laporan (detail lama dihapus, ditulis ulang). Manager / Admin. p = payload lengkap seperti simpan (bagian yang tidak dikirim = tidak berubah). */
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
    var lama = ringkasShift_(r, u);
    var gab = { tanggal: p.tanggal || r.Tanggal, shift: p.shift || r.Shift,
                blowing: p.blowing !== undefined ? p.blowing : { operator: lama.blowing.operator, ambil: lama.blowing.ambil, hasil: lama.blowing.hasil, bs: lama.blowing.bs },
                cutting: p.cutting !== undefined ? p.cutting : { operator: lama.cutting.operator, rollPakai: lama.cutting.rollPakai, hasil: lama.cutting.hasil, bs: lama.cutting.bs } };
    var d = susunShift_(gab);
    if (bulanTertutup_(d.tanggal)) throw new Error('Bulan ' + d.tanggal.slice(0, 7) + ' sudah ditutup.');
    var dobel = baca_(SHEET.SHIFT).filter(function (x) { return x.ID !== id && x.Status !== STATUS_SHIFT.DIBATALKAN && String(x.Tanggal) === d.tanggal && String(x.Shift) === d.shift; });
    if (dobel.length) throw new Error('Laporan shift ' + d.shift + ' tanggal ' + d.tanggal + ' sudah ada (' + dobel[0].ID + ').');
    var sh = sheet_(SHEET.SHIFT_DETAIL);
    baca_(SHEET.SHIFT_DETAIL).filter(function (x) { return x.ID_Shift === id; }).map(function (x) { return x._baris; })
      .sort(function (a, b) { return b - a; }).forEach(function (baris) { sh.deleteRow(baris); });
    lupakanMemo_(SHEET.SHIFT_DETAIL);
    var now = new Date();
    tulisDetailShift_(id, d, now);
    var log = [];
    if (String(r.Tanggal) !== d.tanggal) log.push('tanggal ' + r.Tanggal + ' → ' + d.tanggal);
    if (String(r.Shift) !== d.shift) log.push('shift ' + r.Shift + ' → ' + d.shift);
    if (r.Operator_Blowing !== d.blowing.operator) log.push('operator blowing: ' + (d.blowing.operator || '—'));
    if (r.Operator_Cutting !== d.cutting.operator) log.push('operator cutting: ' + (d.cutting.operator || '—'));
    [['Total_Ambil_Kg', d.blowing.totalAmbil, 'ambil'], ['Total_Roll_Kg', d.blowing.totalHasil, 'roll jadi'], ['Total_BS_Blowing_Kg', d.blowing.totalBs, 'BS blowing'],
     ['Total_Roll_Pakai_Kg', d.cutting.totalRoll, 'roll dipakai'], ['Total_Polybag_Kg', d.cutting.totalHasil, 'polybag'], ['Total_BS_Cutting_Kg', d.cutting.totalBs, 'BS cutting']].forEach(function (k) {
      if (angka_(r[k[0]]) !== bulat_(k[1], 3)) log.push(k[2] + ' ' + angka_(r[k[0]]) + ' → ' + bulat_(k[1], 2) + ' kg');
    });
    if (!log.length) log.push('rincian diubah');
    var stempel = Utilities.formatDate(now, APP.zona, 'dd/MM HH:mm') + ' ' + u.nama + ': ' + log.join('; ');
    ubahBaris_(SHEET.SHIFT, r._baris, kolomShift_(d, { Catatan: p.catatan !== undefined ? p.catatan : r.Catatan, Log_Edit: [r.Log_Edit, stempel].filter(String).join('\n') }));
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

/** Laporan shift yang dihitung di stok (AKTIF) — peta id → baris. */
function shiftAktif_() {
  var aktif = {};
  baca_(SHEET.SHIFT).forEach(function (r) { if (r.Status !== STATUS_SHIFT.DIBATALKAN) aktif[r.ID] = r; });
  return aktif;
}

/**
 * Laporan produksi bulan 'YYYY-MM' (default bulan ini): total, per mesin, per operator (per mesin), per kualitas, per hari.
 * Tidak ada harga → semua peran boleh.
 */
function laporanProduksi(bulan, ident) {
  penggunaSaatIni_(ident);
  bulan = /^\d{4}-\d{2}$/.test(String(bulan || '')) ? String(bulan) : tglStr_(new Date()).slice(0, 7);
  var aktif = shiftAktif_(), det = baca_(SHEET.SHIFT_DETAIL);
  var perOperator = {}, perKualitas = {}, perHari = {};
  var tot = { shift: 0, ambil: 0, roll: 0, rollPakai: 0, jadi: 0, bsBlowing: 0, bsCutting: 0, bs: 0 };
  var pm = { BLOWING: { mesin: MESIN.BLOWING, shift: 0, masuk: 0, hasil: 0, bs: 0 }, CUTTING: { mesin: MESIN.CUTTING, shift: 0, masuk: 0, hasil: 0, bs: 0 } };
  function sel(m, k, init) { if (!m[k]) m[k] = init(); return m[k]; }
  Object.keys(aktif).forEach(function (id) {
    var r = aktif[id];
    if (!dalamBulan_(r.Tanggal, bulan)) return;
    tot.shift++;
    var ambil = angka_(r.Total_Ambil_Kg), roll = angka_(r.Total_Roll_Kg), bsB = angka_(r.Total_BS_Blowing_Kg);
    var rp = angka_(r.Total_Roll_Pakai_Kg), jadi = angka_(r.Total_Polybag_Kg), bsC = angka_(r.Total_BS_Cutting_Kg);
    tot.ambil += ambil; tot.roll += roll; tot.rollPakai += rp; tot.jadi += jadi; tot.bsBlowing += bsB; tot.bsCutting += bsC; tot.bs += bsB + bsC;
    if (r.Operator_Blowing || ambil || roll) { pm.BLOWING.shift++; pm.BLOWING.masuk += ambil; pm.BLOWING.hasil += roll; pm.BLOWING.bs += bsB; }
    if (r.Operator_Cutting || rp || jadi) { pm.CUTTING.shift++; pm.CUTTING.masuk += rp; pm.CUTTING.hasil += jadi; pm.CUTTING.bs += bsC; }
    var ph = sel(perHari, r.Tanggal, function () { return { tanggal: r.Tanggal, shift: 0, ambil: 0, roll: 0, rollPakai: 0, jadi: 0, bs: 0 }; });
    ph.shift++; ph.ambil += ambil; ph.roll += roll; ph.rollPakai += rp; ph.jadi += jadi; ph.bs += bsB + bsC;
    pecahOperator_(r.Operator_Blowing).forEach(function (op) {
      var po = sel(perOperator, op + '|BLOWING', function () { return { operator: op, mesin: MESIN.BLOWING, shift: 0, masuk: 0, hasil: 0, bs: 0 }; });
      po.shift++; po.masuk += ambil; po.hasil += roll; po.bs += bsB;
    });
    pecahOperator_(r.Operator_Cutting).forEach(function (op) {
      var po = sel(perOperator, op + '|CUTTING', function () { return { operator: op, mesin: MESIN.CUTTING, shift: 0, masuk: 0, hasil: 0, bs: 0 }; });
      po.shift++; po.masuk += rp; po.hasil += jadi; po.bs += bsC;
    });
  });
  det.forEach(function (d) {
    var r = aktif[d.ID_Shift]; if (!r || !dalamBulan_(r.Tanggal, bulan)) return;
    var q = d.Kualitas || '(tanpa kualitas)';
    var pk = sel(perKualitas, q, function () { return { kualitas: q, nama: NAMA_KUALITAS[q] || q, ambil: 0, roll: 0, rollPakai: 0, jadi: 0, bsBlowing: 0, bsCutting: 0, bs: 0 }; });
    var qty = angka_(d.Qty_Kg);
    if (d.Jenis === JENIS_SHIFT.AMBIL) pk.ambil += qty;
    else if (d.Jenis === JENIS_SHIFT.HASIL) { if (d.Mesin === MESIN.BLOWING) pk.roll += qty; else pk.jadi += qty; }
    else if (d.Jenis === JENIS_SHIFT.BS) { if (d.Mesin === MESIN.BLOWING) pk.bsBlowing += qty; else pk.bsCutting += qty; pk.bs += qty; }
    else if (d.Jenis === JENIS_SHIFT.PAKAI_ROLL) pk.rollPakai += qty;
  });
  function rapikan(o, dasar) { Object.keys(o).forEach(function (k) { if (typeof o[k] === 'number') o[k] = bulat_(o[k], 2); }); o.persenBs = dasar > 0 ? bulat_(o.bs / dasar * 100, 2) : 0; return o; }
  return {
    bulan: bulan,
    total: rapikan(tot, tot.ambil),
    perMesin: [rapikan(pm.BLOWING, pm.BLOWING.masuk), rapikan(pm.CUTTING, pm.CUTTING.masuk)].filter(function (m) { return m.shift > 0; }),
    perOperator: Object.keys(perOperator).map(function (k) { return rapikan(perOperator[k], perOperator[k].masuk); }).sort(function (a, b) { return a.mesin.localeCompare(b.mesin) || b.hasil - a.hasil; }),
    perKualitas: Object.keys(perKualitas).map(function (k) { return rapikan(perKualitas[k], perKualitas[k].ambil + perKualitas[k].rollPakai); }),
    perHari: Object.keys(perHari).sort().map(function (k) { return rapikan(perHari[k], perHari[k].ambil); }),
    rollSisaMenurutLaporan: bulat_(tot.roll - tot.rollPakai, 2)
  };
}

/* =================================================================
   OPNAME PRODUKSI (v10.1) — hitungan fisik bulanan oleh manager, "buta":
   sistem hanya menjumlahkan yang diisi; pembanding (biji plastik yang keluar
   gudang menurut neraca) hanya ditampilkan ke ADMIN lewat rekonsiliasiProduksi.
   ================================================================= */

/**
 * p = { bulan:'YYYY-MM', polybag:[{kualitas,qty}], bs:[{kualitas,qty}], biji:[{kode,qty}] (biji plastik/bahan di area produksi),
 *       roll:[{kualitas,qty}] (roll yang belum dipotong), wipMesin (kg plastik di dalam mesin), catatan }
 * Balasan HANYA berisi total hitungan si pengisi — tidak ada angka pembanding.
 */
function simpanOpnameProduksi(p, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehReview_(u)) throw new Error('Opname produksi hanya diisi Manager / Admin.');
  p = p || {};
  var bulan = bulanValid_(p.bulan || tglStr_(new Date()).slice(0, 7));
  if (bulan > tglStr_(new Date()).slice(0, 7)) throw new Error('Bulan belum berjalan.');
  if (bulanTertutup_(bulan + '-01')) throw new Error('Bulan ' + bulan + ' sudah ditutup.');
  var peta = petaItem_(), kual = {}; petaKualitas_().forEach(function (q) { kual[q.kualitas] = q; });
  function perK(list, label) {
    var out = [], tot = 0;
    (list || []).forEach(function (h) { var q = angka_(h.qty); if (q < 0) throw new Error(label + ': angka tidak boleh negatif.'); if (!kual[h.kualitas]) throw new Error('Kualitas tidak dikenal: ' + h.kualitas); if (q > 0) { out.push({ kualitas: h.kualitas, qty: q }); tot += q; } });
    return { list: out, total: tot };
  }
  var pb = perK(p.polybag, 'Polybag'), bs = perK(p.bs, 'BS'), roll = perK(p.roll, 'Roll');
  var biji = [], bijiTot = 0;
  (p.biji || []).forEach(function (b) { var q = angka_(b.qty); if (q < 0) throw new Error('Biji plastik: angka tidak boleh negatif.'); var it = peta[b.kode]; if (!it) throw new Error('Item tidak dikenal: ' + b.kode); if (q > 0) { biji.push({ kode: it.kode, nama: it.nama, qty: q }); bijiTot += q; } });
  var wip = angka_(p.wipMesin); if (wip < 0) throw new Error('Isi mesin tidak boleh negatif.');
  var total = pb.total + bs.total + bijiTot + roll.total + wip;
  if (total <= 0) throw new Error('Belum ada angka yang diisi.');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();
  try {
    var now = new Date(), id = buatId_('OPP');
    /* satu opname aktif per bulan: yang lama dibatalkan otomatis (riwayat tetap ada) */
    baca_(SHEET.OPNAME_PROD).forEach(function (r) {
      if (bulanStr_(r.Bulan) === bulan && r.Status === STATUS_OPNAME_PROD.AKTIF) ubahBaris_(SHEET.OPNAME_PROD, r._baris, { Status: STATUS_OPNAME_PROD.DIBATALKAN, Catatan: [r.Catatan, 'diganti oleh ' + id].filter(String).join(' | ') });
    });
    tambah_(SHEET.OPNAME_PROD, {
      ID: id, Bulan: bulan, Waktu: now, Tanggal: tglStr_(now), Dicatat_Oleh: penandaPencatat_(u), Nama_Pencatat: u.nama,
      Polybag_Kg: bulat_(pb.total, 3), BS_Kg: bulat_(bs.total, 3), Biji_Produksi_Kg: bulat_(bijiTot, 3), Roll_Kg: bulat_(roll.total, 3), WIP_Mesin_Kg: bulat_(wip, 3),
      Total_Hitung_Kg: bulat_(total, 3), Detail_JSON: JSON.stringify({ polybag: pb.list, bs: bs.list, biji: biji, roll: roll.list, wipMesin: wip }),
      Catatan: p.catatan || '', Status: STATUS_OPNAME_PROD.AKTIF
    });
    catatLog_('OPNAME_PRODUKSI', id, bulan + ' • ' + u.nama + ' • total ' + bulat_(total, 1) + ' kg');
    return { ok: true, id: id, bulan: bulan, polybagKg: bulat_(pb.total, 2), bsKg: bulat_(bs.total, 2), bijiProduksiKg: bulat_(bijiTot, 2), rollKg: bulat_(roll.total, 2), wipMesinKg: bulat_(wip, 2), totalKg: bulat_(total, 2) };
  } finally { lock.releaseLock(); }
}

function ringkasOpnameProd_(r) {
  var det = {}; try { det = JSON.parse(r.Detail_JSON || '{}'); } catch (e) {}
  return { id: r.ID, bulan: bulanStr_(r.Bulan), waktu: jam_(r.Waktu), tanggal: r.Tanggal, pencatat: r.Nama_Pencatat, status: r.Status, catatan: r.Catatan || '',
           polybagKg: angka_(r.Polybag_Kg), bsKg: angka_(r.BS_Kg), bijiProduksiKg: angka_(r.Biji_Produksi_Kg), rollKg: angka_(r.Roll_Kg), wipMesinKg: angka_(r.WIP_Mesin_Kg), totalKg: angka_(r.Total_Hitung_Kg), detail: det };
}

/** Riwayat opname produksi (Manager / Admin) — tanpa angka pembanding. */
function daftarOpnameProduksi(ident, bulan) {
  var u = penggunaSaatIni_(ident);
  if (!bolehReview_(u)) throw new Error('Hanya Manager / Admin.');
  return baca_(SHEET.OPNAME_PROD).filter(function (r) { return !bulan || bulanStr_(r.Bulan) === bulan; })
    .map(ringkasOpnameProd_).sort(function (a, b) { return (b.bulan + b.tanggal).localeCompare(a.bulan + a.tanggal); });
}

/** Bahan yang keluar gudang ke produksi per item, menurut NERACA (bukan laporan shift): awal + masuk − keluar-bukan-produksi − akhir. */
function keluarGudangKeProduksi_(bulan) {
  var peta = petaItem_(), awal = akhirBulan_(bulanSebelum_(bulan)), akhir = akhirBulan_(bulan);
  var posAwal = posisiStokTanggal_(awal), posAkhir = posisiStokTanggal_(akhir);
  var m = {};
  function sel(k) { if (!m[k]) m[k] = { beli: 0, retur: 0, returCust: 0, jual: 0, rusak: 0, daurKirim: 0, daurHasil: 0, opname: 0, ambil: 0 }; return m[k]; }
  baca_(SHEET.PENERIMAAN).forEach(function (r) { if (!dalamBulan_(r.Tanggal, bulan) || !dihitung_(r)) return; var x = sel(r.Kode_Item); if (r.Jenis === JENIS_PENERIMAAN.RETUR) x.retur += angka_(r.Qty_Kg); else x.beli += angka_(r.Qty_Kg); });
  baca_(SHEET.PENGIRIMAN).forEach(function (r) { if (!dalamBulan_(r.Tanggal, bulan) || !dihitung_(r)) return; var x = sel(r.Kode_Item); if (r.Jenis === JENIS_PENGIRIMAN.RETUR_MASUK) x.returCust += angka_(r.Qty_Kg); else x.jual += angka_(r.Qty_Kg); });
  baca_(SHEET.KERUSAKAN).forEach(function (r) { if (r.Status === STATUS_TRANSFER.DISETUJUI && dalamBulan_(r.Tanggal, bulan)) sel(r.Kode_Item).rusak += angka_(r.Qty_Kg); });
  baca_(SHEET.OPNAME).forEach(function (r) { if (dalamBulan_(r.Tanggal, bulan)) sel(r.Kode_Item).opname += angka_(r.Selisih); });
  var daurAktif = {}; baca_(SHEET.DAUR).forEach(function (r) { if (r.Status !== STATUS_DAUR.DIBATALKAN) daurAktif[r.ID] = r; });
  baca_(SHEET.DAUR_DETAIL).forEach(function (d) {
    var r = daurAktif[d.ID_Daur]; if (!r) return;
    if (d.Jenis === JENIS_DAUR_DETAIL.HASIL && r.Status === STATUS_DAUR.SELESAI && dalamBulan_(r.Tanggal_Terima || r.Tanggal, bulan)) sel(d.Kode_Item).daurHasil += angka_(d.Qty_Kg);
    if (d.Jenis === JENIS_DAUR_DETAIL.SCRAP && dalamBulan_(r.Tanggal, bulan)) sel(d.Kode_Item).daurKirim += angka_(d.Qty_Kg);
  });
  var aktif = shiftAktif_();
  baca_(SHEET.SHIFT_DETAIL).forEach(function (d) { var r = aktif[d.ID_Shift]; if (r && d.Jenis === JENIS_SHIFT.AMBIL && dalamBulan_(r.Tanggal, bulan)) sel(d.Kode_Item).ambil += angka_(d.Qty_Kg); });
  var out = [], total = 0, totalAmbil = 0;
  Object.keys(peta).forEach(function (k) {
    var it = peta[k];
    if (it.kategori !== KATEGORI_ITEM.BAHAN_BAKU && it.kategori !== KATEGORI_ITEM.KEDUANYA) return;
    var x = sel(k), sAwal = posAwal[k] || 0, sAkhir = posAkhir[k] || 0;
    /* rumus Mike: awal + pembelian − akhir, dikoreksi pergerakan yang bukan ke produksi (retur, rusak, jual, daur ulang) */
    var keluar = sAwal + x.beli + x.returCust + x.daurHasil - x.retur - x.jual - x.rusak - x.daurKirim - sAkhir;
    if (!sAwal && !sAkhir && !x.beli && !x.ambil && !keluar) return;
    out.push({ kode: k, nama: it.nama, stokAwal: bulat_(sAwal, 2), pembelian: bulat_(x.beli, 2), lainMasuk: bulat_(x.returCust + x.daurHasil, 2), lainKeluar: bulat_(x.retur + x.jual + x.rusak + x.daurKirim, 2),
               opname: bulat_(x.opname, 2), stokAkhir: bulat_(sAkhir, 2), keluarKeProduksi: bulat_(keluar, 2), menurutShift: bulat_(x.ambil, 2) });
    total += keluar; totalAmbil += x.ambil;
  });
  return { daftar: out, total: bulat_(total, 2), totalMenurutShift: bulat_(totalAmbil, 2) };
}

/** Posisi stok (kg) semua item pada akhir tanggal tertentu — dari mesin rata-rata (sudah termasuk opname & semua pergerakan). */
function posisiStokTanggal_(tanggal) {
  var pos = hitungRata_(tanggal).pos, out = {};
  Object.keys(pos).forEach(function (k) { out[k] = pos[k].qty; });
  return out;
}

/**
 * ADMIN saja: rekonsiliasi bulanan.
 *   keluar gudang ke produksi (neraca) + bahan yang sudah ada di produksi awal bulan  vs  hitungan fisik manager (polybag + BS + biji di produksi + roll + isi mesin)
 *   selisih = susut (atau angka yang tidak tercatat). Juga dibandingkan dengan laporan shift.
 */
function rekonsiliasiProduksi(bulan, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehAdmin_(u)) throw new Error('Rekonsiliasi hanya untuk Admin — angka pembanding tidak ditampilkan ke pengisi opname.');
  bulan = bulan ? bulanValid_(bulan) : tglStr_(new Date()).slice(0, 7);
  var g = keluarGudangKeProduksi_(bulan);
  var semuaOp = baca_(SHEET.OPNAME_PROD).filter(function (r) { return r.Status === STATUS_OPNAME_PROD.AKTIF; }).map(ringkasOpnameProd_);
  var op = semuaOp.filter(function (o) { return o.bulan === bulan; })[0] || null;
  var opLalu = semuaOp.filter(function (o) { return o.bulan === bulanSebelum_(bulan); })[0] || null;
  /* bahan yang sudah ada di area produksi pada awal bulan (biji + roll + isi mesin menurut opname bulan lalu) */
  var awalProduksi = opLalu ? bulat_(opLalu.bijiProduksiKg + opLalu.rollKg + opLalu.wipMesinKg, 2) : 0;
  var lp = laporanProduksi(bulan, ident);
  var seharusnya = bulat_(g.total + awalProduksi, 2);
  var hasil = { bulan: bulan, keluarGudang: g, awalProduksi: awalProduksi, adaOpnameLalu: !!opLalu, seharusnyaKg: seharusnya, opname: op,
                laporanShift: { ambil: lp.total.ambil, roll: lp.total.roll, rollPakai: lp.total.rollPakai, polybag: lp.total.jadi, bs: lp.total.bs, rollSisa: lp.rollSisaMenurutLaporan } };
  if (op) {
    hasil.selisihKg = bulat_(seharusnya - op.totalKg, 2);
    hasil.selisihPersen = seharusnya > 0 ? bulat_(hasil.selisihKg / seharusnya * 100, 2) : 0;
    hasil.bandingShift = { polybag: bulat_(op.polybagKg - lp.total.jadi, 2), bs: bulat_(op.bsKg - lp.total.bs, 2), roll: bulat_(op.rollKg - lp.rollSisaMenurutLaporan, 2) };
  }
  return hasil;
}
