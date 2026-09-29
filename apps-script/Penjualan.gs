/*************************************************************************
 * IPC — Inventory & Production Control (v10)
 * File 5 : Penjualan.gs
 *
 * Modul v8: sales order (pesanan customer), ekspor keuangan bulanan (CSV),
 * backup otomatis harian.
 *************************************************************************/

/* =================================================================
   SALES ORDER — manager membuat, gudang mengirim sesuai SO
   Harga jual HANYA untuk Manager / Direktur / Admin (bolehLihatHpp_).
   ================================================================= */

function nomorSoBaru_() {
  var awalan = 'SO-' + Utilities.formatDate(new Date(), APP.zona, 'yyMMdd') + '-';
  var n = 0;
  baca_(SHEET.SO).forEach(function (r) {
    if (String(r.No_SO).indexOf(awalan) === 0) { var k = parseInt(String(r.No_SO).slice(awalan.length), 10); if (k > n) n = k; }
  });
  return awalan + String(n + 1).padStart(2, '0');
}

/** p = { customer, tanggal, tanggalKirim, topHari, baris:[{kode, qty, harga}], catatan } — v10: TOP wajib diisi (0 = tunai). */
function simpanSo(p, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehPo_(u)) throw new Error('Hanya Manager / Admin yang bisa membuat sales order.');
  if (!p || !String(p.customer || '').trim()) throw new Error('Customer belum dipilih.');
  if (!p.baris || !p.baris.length) throw new Error('Item SO belum diisi.');
  var kirim = String(p.tanggalKirim || '').trim();
  if (!kirim) throw new Error('Tanggal kirim belum diisi.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(kirim)) throw new Error('Format tanggal kirim harus YYYY-MM-DD.');
  var peta = petaItem_();
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();
  try {
    var now = new Date(), tanggal = tglValid_(p.tanggal);
    if (p.topHari === undefined || p.topHari === null || String(p.topHari).trim() === '') throw new Error('TOP (hari) belum diisi — isi 0 untuk tunai.');
    var top = topValid_(p.topHari), jatuhTempo = jatuhTempo_(kirim || tanggal, top);
    var noSo = nomorSoBaru_(), ids = [], total = 0, nilai = 0;
    p.baris.forEach(function (b) {
      var it = peta[b.kode]; if (!it) throw new Error('Item tidak dikenal: ' + b.kode);
      var q = angka_(b.qty), h = angka_(b.harga);
      if (q <= 0) throw new Error('Qty harus > 0 (' + it.nama + ')');
      if (b.harga === undefined || b.harga === null || String(b.harga).trim() === '' || h <= 0) throw new Error('Harga jual belum diisi (' + it.nama + ')');
      var id = buatId_('SO'); ids.push(id); total += q; nilai += q * h;
      tambah_(SHEET.SO, {
        ID: id, No_SO: noSo, Waktu: now, Tanggal: tanggal, Customer: p.customer,
        Kode_Item: it.kode, Nama_Item: it.nama, Qty_Kg: q, Harga_Per_Kg: h,
        Tanggal_Kirim: kirim, Qty_Dikirim_Kg: 0, Status: STATUS_SO.TERBUKA,
        Dibuat_Oleh: penandaPencatat_(u), Nama_Pembuat: u.nama, Catatan: p.catatan || '', Log_Edit: '',
        TOP_Hari: top, Jatuh_Tempo: jatuhTempo
      });
    });
    catatLog_('SO_BUAT', noSo, p.customer + ' • ' + ids.length + ' item • ' + bulat_(total, 2) + ' kg • ' + mataUang_() + ' ' + bulat_(nilai, 0));
    return { ok: true, noSo: noSo, ids: ids, totalKg: bulat_(total, 2), nilai: bulat_(nilai, 0) };
  } finally { lock.releaseLock(); }
}

function ubahSo(id, perubahan, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehPo_(u)) throw new Error('Hanya Manager / Admin yang bisa mengubah SO.');
  perubahan = perubahan || {};
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();
  try {
    var r = cariEntri_(SHEET.SO, id);
    if (r.Status === STATUS_SO.DIBATALKAN) throw new Error('SO sudah dibatalkan.');
    var ubah = {}, log = [];
    if (perubahan.qty !== undefined) {
      var q = angka_(perubahan.qty);
      if (q <= 0) throw new Error('Qty harus > 0.');
      if (q < angka_(r.Qty_Dikirim_Kg)) throw new Error('Qty tidak boleh lebih kecil dari yang sudah dikirim (' + angka_(r.Qty_Dikirim_Kg) + ' kg).');
      if (q !== angka_(r.Qty_Kg)) { ubah.Qty_Kg = q; log.push('qty: ' + angka_(r.Qty_Kg) + ' → ' + q); }
    }
    if (perubahan.harga !== undefined) {
      var h = angka_(perubahan.harga);
      if (h < 0) throw new Error('Harga tidak boleh negatif.');
      if (h !== angka_(r.Harga_Per_Kg)) { ubah.Harga_Per_Kg = h; log.push('harga: ' + angka_(r.Harga_Per_Kg) + ' → ' + h); }
    }
    if (perubahan.tanggalKirim !== undefined && String(perubahan.tanggalKirim) !== String(r.Tanggal_Kirim || '')) { ubah.Tanggal_Kirim = perubahan.tanggalKirim; log.push('tanggal kirim: ' + (r.Tanggal_Kirim || '—') + ' → ' + (perubahan.tanggalKirim || '—')); }
    if (perubahan.topHari !== undefined && topValid_(perubahan.topHari) !== angka_(r.TOP_Hari)) { ubah.TOP_Hari = topValid_(perubahan.topHari); log.push('TOP: ' + angka_(r.TOP_Hari) + ' → ' + ubah.TOP_Hari + ' hari'); }
    if (perubahan.catatan !== undefined && String(perubahan.catatan) !== String(r.Catatan || '')) { ubah.Catatan = perubahan.catatan; log.push('catatan diubah'); }
    if (!log.length) return { ok: true, berubah: false };
    if (ubah.Tanggal_Kirim !== undefined || ubah.TOP_Hari !== undefined) ubah.Jatuh_Tempo = jatuhTempo_((ubah.Tanggal_Kirim !== undefined ? ubah.Tanggal_Kirim : r.Tanggal_Kirim) || r.Tanggal, ubah.TOP_Hari !== undefined ? ubah.TOP_Hari : angka_(r.TOP_Hari));
    var stempel = Utilities.formatDate(new Date(), APP.zona, 'dd/MM HH:mm') + ' ' + u.nama + ': ' + log.join('; ');
    ubah.Log_Edit = [r.Log_Edit, stempel].filter(String).join('\n');
    ubahBaris_(SHEET.SO, r._baris, ubah);
    if (ubah.Qty_Kg !== undefined) sinkronSo_(id);
    catatLog_('SO_UBAH', id, log.join('; '));
    return { ok: true, berubah: true, log: log };
  } finally { lock.releaseLock(); }
}

function batalkanSo(id, alasan, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehPo_(u)) throw new Error('Hanya Manager / Admin yang bisa membatalkan SO.');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();
  try {
    var r = cariEntri_(SHEET.SO, id);
    if (r.Status === STATUS_SO.DIBATALKAN) throw new Error('SO sudah dibatalkan.');
    if (angka_(r.Qty_Dikirim_Kg) > 0) throw new Error('Sudah ada pengiriman untuk baris SO ini — kurangi qty saja, jangan batalkan.');
    var stempel = Utilities.formatDate(new Date(), APP.zona, 'dd/MM HH:mm') + ' ' + u.nama + ': dibatalkan' + (alasan ? ' — ' + alasan : '');
    ubahBaris_(SHEET.SO, r._baris, { Status: STATUS_SO.DIBATALKAN, Log_Edit: [r.Log_Edit, stempel].filter(String).join('\n') });
    catatLog_('SO_BATAL', id, alasan || '');
    return { ok: true };
  } finally { lock.releaseLock(); }
}

/** Hitung ulang Qty_Dikirim & status satu baris SO dari Pengiriman KELUAR yang merujuknya. */
function sinkronSo_(idSo) {
  var r = null, rows = baca_(SHEET.SO);
  for (var i = 0; i < rows.length; i++) if (rows[i].ID === idSo) r = rows[i];
  if (!r) return;
  var dikirim = 0;
  baca_(SHEET.PENGIRIMAN).forEach(function (p) {
    if (p.ID_SO === idSo && p.Jenis === JENIS_PENGIRIMAN.KELUAR && dihitung_(p)) dikirim += angka_(p.Qty_Kg);
  });
  var status = r.Status === STATUS_SO.DIBATALKAN ? STATUS_SO.DIBATALKAN
             : dikirim <= 0 ? STATUS_SO.TERBUKA
             : dikirim + 0.0001 >= angka_(r.Qty_Kg) ? STATUS_SO.SELESAI : STATUS_SO.SEBAGIAN;
  ubahBaris_(SHEET.SO, r._baris, { Qty_Dikirim_Kg: bulat_(dikirim, 3), Status: status });
}

function ringkasSo_(r, lihatHarga) {
  var o = {
    id: r.ID, noSo: r.No_SO, tanggal: r.Tanggal, customer: r.Customer,
    kode: r.Kode_Item, item: r.Nama_Item, qty: angka_(r.Qty_Kg), dikirim: angka_(r.Qty_Dikirim_Kg),
    sisa: bulat_(Math.max(0, angka_(r.Qty_Kg) - angka_(r.Qty_Dikirim_Kg)), 3),
    tanggalKirim: r.Tanggal_Kirim || '', status: r.Status, pembuat: r.Nama_Pembuat, catatan: r.Catatan || '', logEdit: r.Log_Edit || '',
    topHari: angka_(r.TOP_Hari), jatuhTempo: r.Jatuh_Tempo || ''
  };
  if (lihatHarga) { o.harga = angka_(r.Harga_Per_Kg); o.nilai = bulat_(o.qty * o.harga, 0); }
  return o;
}

/** status: '' = terbuka (TERBUKA/SEBAGIAN) | 'SEMUA' | status tertentu. Harga hanya untuk yang boleh lihat HPP. */
function daftarSo(ident, status, hari) {
  var u = penggunaSaatIni_(ident);
  var lihatHarga = bolehLihatHpp_(u);
  var batas = new Date(); batas.setDate(batas.getDate() - (hari || 90));
  return baca_(SHEET.SO).filter(function (r) {
    if (status === 'SEMUA') return new Date(r.Waktu) >= batas;
    if (!status) return r.Status === STATUS_SO.TERBUKA || r.Status === STATUS_SO.SEBAGIAN;
    return r.Status === status && new Date(r.Waktu) >= batas;
  }).map(function (r) { return ringkasSo_(r, lihatHarga); }).reverse();
}

/** Untuk form pengiriman (staf): baris SO yang masih harus dikirim, TANPA harga. */
function soTerbuka(ident) {
  penggunaSaatIni_(ident);
  return baca_(SHEET.SO).filter(function (r) {
    return r.Status === STATUS_SO.TERBUKA || r.Status === STATUS_SO.SEBAGIAN;
  }).map(function (r) { return ringkasSo_(r, false); })
    .sort(function (a, b) { return String(a.tanggalKirim || '9999').localeCompare(String(b.tanggalKirim || '9999')); });
}

/** Beranda: SO yang jatuh tempo hari ini atau sudah lewat (tanpa harga). */
function soKirimHariIni_(hariIni) {
  return baca_(SHEET.SO).filter(function (r) {
    return (r.Status === STATUS_SO.TERBUKA || r.Status === STATUS_SO.SEBAGIAN) && r.Tanggal_Kirim && String(r.Tanggal_Kirim) <= hariIni;
  }).map(function (r) {
    var o = ringkasSo_(r, false);
    return { id: o.id, noSo: o.noSo, customer: o.customer, item: o.item, kode: o.kode, sisa: o.sisa, kirim: o.tanggalKirim };
  }).sort(function (a, b) { return String(a.kirim).localeCompare(String(b.kirim)); });
}

/** kg per item yang sudah dipesan customer tapi belum dikirim (stok "dicadangkan"). */
function soDipesan_() {
  var m = {};
  baca_(SHEET.SO).forEach(function (r) {
    if (r.Status !== STATUS_SO.TERBUKA && r.Status !== STATUS_SO.SEBAGIAN) return;
    m[r.Kode_Item] = (m[r.Kode_Item] || 0) + Math.max(0, angka_(r.Qty_Kg) - angka_(r.Qty_Dikirim_Kg));
  });
  return m;
}

/* =================================================================
   EKSPOR KEUANGAN BULANAN (CSV) — Manager / Direktur / Admin
   ================================================================= */

function csvBaris_(arr) {
  return arr.map(function (v) {
    if (v === null || v === undefined) return '';
    var s = String(v);
    if (/[";\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  }).join(';');
}
function csv_(header, rows) {
  return '﻿' + [csvBaris_(header)].concat(rows.map(csvBaris_)).join('\r\n');
}
function dalamBulan_(tanggal, bulan) { return String(tanggal || '').slice(0, 7) === bulan; }
function akhirBulan_(bulan) {
  var y = parseInt(bulan.slice(0, 4), 10), m = parseInt(bulan.slice(5, 7), 10);
  var d = new Date(y, m, 0);
  return bulan + '-' + String(d.getDate()).padStart(2, '0');
}

/**
 * bulan = 'YYYY-MM'. Mengembalikan beberapa file CSV (pemisah ; supaya Excel Indonesia langsung membuka):
 * pembelian, penjualan, produksi (laporan shift), rusak, daur_ulang, nilai_stok (posisi akhir bulan, harga rata-rata), ringkasan.
 */
function eksporBulanan(bulan, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehLihatHpp_(u)) throw new Error('Ekspor keuangan hanya untuk Manager / Direktur / Admin.');
  if (!/^\d{4}-\d{2}$/.test(String(bulan || ''))) throw new Error('Format bulan harus YYYY-MM.');
  var peta = petaItem_(), cur = mataUang_();
  var poById = {}; baca_(SHEET.PO).forEach(function (r) { poById[r.ID] = r; });
  var soById = {}; baca_(SHEET.SO).forEach(function (r) { soById[r.ID] = r; });
  var invByPo = {}; baca_(SHEET.INVOICE).forEach(function (r) { if (r.Status === STATUS_INVOICE.VALID) invByPo[r.No_PO] = r.No_Invoice; });
  var tot = { beliKg: 0, beliRp: 0, returKg: 0, returRp: 0, jualKg: 0, jualRp: 0, hppJualRp: 0, hppJualSoRp: 0, jualTanpaSoKg: 0, returCustKg: 0,
              shift: 0, ambilKg: 0, jadiKg: 0, bsKg: 0, rollKg: 0, rollPakaiKg: 0, fgKg: 0, bsBlowingKg: 0, bsCuttingKg: 0,
              hppBahan: 0, hppProses: 0, rusakKg: 0, rusakRp: 0 };

  /* --- pembelian: penerimaan & retur ke supplier --- */
  var beli = [];
  baca_(SHEET.PENERIMAAN).forEach(function (r) {
    if (!dalamBulan_(r.Tanggal, bulan) || !dihitung_(r)) return;
    var retur = r.Jenis === JENIS_PENERIMAAN.RETUR;
    var harga = angka_(r.Harga_Per_Kg) || (peta[r.Kode_Item] ? peta[r.Kode_Item].harga : 0);
    var q = angka_(r.Qty_Kg), nilai = bulat_(q * harga, 0);
    var po = r.ID_PO ? poById[r.ID_PO] : null;
    beli.push([r.Tanggal, r.ID, retur ? 'RETUR' : 'MASUK', r.Supplier, po ? po.No_PO : '', po ? (invByPo[po.No_PO] || '') : '',
               r.No_Surat_Jalan, r.Kode_Item, r.Nama_Item, q, harga, retur ? -nilai : nilai, r.Status, r.Nama_Pencatat, r.Catatan_QC || '']);
    if (retur) { tot.returKg += q; tot.returRp += nilai; } else { tot.beliKg += q; tot.beliRp += nilai; }
  });

  /* --- penjualan: keluar & retur dari customer --- */
  var jual = [];
  baca_(SHEET.PENGIRIMAN).forEach(function (r) {
    if (!dalamBulan_(r.Tanggal, bulan) || !dihitung_(r)) return;
    var retur = r.Jenis === JENIS_PENGIRIMAN.RETUR_MASUK;
    var so = r.ID_SO ? soById[r.ID_SO] : null;
    var hargaJual = so ? angka_(so.Harga_Per_Kg) : '';
    var q = angka_(r.Qty_Kg), hpp = angka_(r.HPP_Per_Kg);
    var nilaiJual = hargaJual === '' ? '' : bulat_(q * hargaJual, 0);
    var nilaiHpp = bulat_(q * hpp, 0);
    jual.push([r.Tanggal, r.ID, retur ? 'RETUR_CUSTOMER' : 'KELUAR', r.Customer, so ? so.No_SO : '', r.No_Surat_Jalan,
               r.Kode_Item, r.Nama_Item, q, hargaJual, nilaiJual, hpp || '', retur ? '' : nilaiHpp,
               (nilaiJual === '' || retur) ? '' : bulat_(nilaiJual - nilaiHpp, 0), r.Status, r.Nama_Pencatat]);
    if (retur) tot.returCustKg += q;
    else {
      tot.jualKg += q; tot.hppJualRp += nilaiHpp;
      if (nilaiJual === '') tot.jualTanpaSoKg += q;
      else { tot.jualRp += nilaiJual; tot.hppJualSoRp += nilaiHpp; }
    }
  });

  /* --- produksi (v10): laporan shift di bulan itu --- */
  var prod = [], detShift = {};
  baca_(SHEET.SHIFT_DETAIL).forEach(function (d) { (detShift[d.ID_Shift] = detShift[d.ID_Shift] || []).push(d); });
  var rataBulan = hitungRata_(akhirBulan_(bulan));
  baca_(SHEET.SHIFT).forEach(function (r) {
    if (r.Status === STATUS_SHIFT.DIBATALKAN || !dalamBulan_(r.Tanggal, bulan)) return;
    var per = {};
    (detShift[r.ID] || []).forEach(function (x) {
      var k = x.Mesin + ':' + x.Jenis + ':' + (x.Kualitas || '');
      if (x.Jenis === JENIS_SHIFT.AMBIL) k = 'AMBIL:' + x.Nama_Item;
      per[k] = (per[k] || 0) + angka_(x.Qty_Kg);
    });
    var ambilTxt = Object.keys(per).filter(function (k) { return k.indexOf('AMBIL:') === 0; }).map(function (k) { return k.slice(6) + ' ' + bulat_(per[k], 2); }).join(', ');
    function q(m, j, kual) { return bulat_(per[m + ':' + j + ':' + kual] || 0, 2); }
    var bahan = angka_(rataBulan.biaya[r.ID]), proses = angka_(rataBulan.proses[r.ID]);
    var bsB = angka_(r.Total_BS_Blowing_Kg), bsC = angka_(r.Total_BS_Cutting_Kg);
    prod.push([r.Tanggal, r.Shift, r.ID, r.Operator_Blowing, ambilTxt, angka_(r.Total_Ambil_Kg),
               q('BLOWING', JENIS_SHIFT.HASIL, KUALITAS.KW), q('BLOWING', JENIS_SHIFT.HASIL, KUALITAS.SUPER), q('BLOWING', JENIS_SHIFT.HASIL, KUALITAS.SUPER_PLUS), angka_(r.Total_Roll_Kg), bsB,
               r.Operator_Cutting, angka_(r.Total_Roll_Pakai_Kg),
               q('CUTTING', JENIS_SHIFT.HASIL, KUALITAS.KW), q('CUTTING', JENIS_SHIFT.HASIL, KUALITAS.SUPER), q('CUTTING', JENIS_SHIFT.HASIL, KUALITAS.SUPER_PLUS), angka_(r.Total_Polybag_Kg), bsC,
               bulat_(bahan, 0), bulat_(proses, 0), r.Nama_Pencatat, r.Catatan || '']);
    tot.shift++; tot.ambilKg += angka_(r.Total_Ambil_Kg); tot.jadiKg += angka_(r.Total_Polybag_Kg); tot.bsKg += bsB + bsC;
    tot.hppBahan += bahan; tot.hppProses += proses;
    tot.rollKg += angka_(r.Total_Roll_Kg); tot.bsBlowingKg += bsB;
    tot.rollPakaiKg += angka_(r.Total_Roll_Pakai_Kg); tot.fgKg += angka_(r.Total_Polybag_Kg); tot.bsCuttingKg += bsC;
  });

  /* --- barang rusak disetujui --- */
  var rusak = [];
  baca_(SHEET.KERUSAKAN).forEach(function (r) {
    if (r.Status !== STATUS_TRANSFER.DISETUJUI || !dalamBulan_(r.Tanggal, bulan)) return;
    rusak.push([r.Tanggal, r.ID, r.Lokasi, r.Kode_Item, r.Nama_Item, angka_(r.Qty_Kg), angka_(r.Nilai_Kerugian), r.Penyebab, r.Nama_Pencatat, r.Ditinjau_Oleh]);
    tot.rusakKg += angka_(r.Qty_Kg); tot.rusakRp += angka_(r.Nilai_Kerugian);
  });

  /* --- daur ulang scrap (v9): batch diterima di bulan itu --- */
  var daur = [], totDaur = { batch: 0, scrap: 0, hasil: 0, susut: 0, jasa: 0, nilaiScrap: 0 };
  baca_(SHEET.DAUR).forEach(function (r) {
    if (r.Status !== STATUS_DAUR.SELESAI || !r.Waktu_Terima) return;
    var tglT = r.Tanggal_Terima || tglStr_(new Date(r.Waktu_Terima));
    if (!dalamBulan_(tglT, bulan)) return;
    daur.push([r.Tanggal, tglT, r.ID, r.Vendor, r.No_Surat_Jalan, angka_(r.Total_Scrap_Kg), angka_(r.Total_Hasil_Kg), angka_(r.Susut_Kg), angka_(r.Susut_Persen), r.Status_Susut,
               angka_(r.Nilai_Scrap), angka_(r.Biaya_Jasa), angka_(r.HPP_Total), angka_(r.HPP_Per_Kg), r.Nama_Pencatat, r.Nama_Penerima]);
    totDaur.batch++; totDaur.scrap += angka_(r.Total_Scrap_Kg); totDaur.hasil += angka_(r.Total_Hasil_Kg); totDaur.susut += angka_(r.Susut_Kg);
    totDaur.jasa += angka_(r.Biaya_Jasa); totDaur.nilaiScrap += angka_(r.Nilai_Scrap);
  });

  /* --- nilai stok posisi akhir bulan (harga rata-rata) --- */
  var P = rataBulan.pos, stokRows = [], nilaiStok = 0;
  Object.keys(P).forEach(function (k) {
    if (P[k].qty <= 0.0001) return;
    stokRows.push([k, peta[k] ? peta[k].nama : k, peta[k] ? peta[k].kategori : '', bulat_(P[k].qty, 2), bulat_(P[k].rata, 0), bulat_(P[k].nilai, 0)]);
    nilaiStok += P[k].nilai;
  });

  /* --- laba kotor bulan (COGS total = stok awal + pembelian − retur + jasa + proses − stok akhir) --- */
  var lb = laporanBulanan_(bulan, rataBulan);

  var ringkasan = [
    ['Periode', bulan], ['Mata uang', cur],
    ['Pembelian (kg)', bulat_(tot.beliKg, 2)], ['Pembelian (nilai)', bulat_(tot.beliRp, 0)],
    ['Retur ke supplier (kg)', bulat_(tot.returKg, 2)], ['Retur ke supplier (nilai)', bulat_(tot.returRp, 0)],
    ['Penjualan (kg)', bulat_(tot.jualKg, 2)], ['Penjualan tanpa SO / tanpa harga (kg)', bulat_(tot.jualTanpaSoKg, 2)],
    ['Penjualan (nilai, dari harga SO)', bulat_(tot.jualRp, 0)],
    ['HPP barang terjual (semua pengiriman)', bulat_(tot.hppJualRp, 0)], ['HPP barang terjual (yang ada harga SO)', bulat_(tot.hppJualSoRp, 0)],
    ['Laba kotor (penjualan − HPP, hanya yang ada harga SO)', bulat_(tot.jualRp - tot.hppJualSoRp, 0)],
    ['Retur dari customer (kg)', bulat_(tot.returCustKg, 2)],
    ['Laporan shift', tot.shift], ['Biji plastik masuk blowing (kg)', bulat_(tot.ambilKg, 2)], ['Roll hasil blowing (kg)', bulat_(tot.rollKg, 2)],
    ['Roll dipakai cutting (kg)', bulat_(tot.rollPakaiKg, 2)], ['Polybag jadi (kg)', bulat_(tot.fgKg, 2)],
    ['BS blowing (kg)', bulat_(tot.bsBlowingKg, 2)], ['BS cutting (kg)', bulat_(tot.bsCuttingKg, 2)], ['BS total (kg)', bulat_(tot.bsKg, 2)],
    ['Susut produksi (kg, biji masuk − polybag − BS − perubahan roll)', bulat_(lb.susutKg, 2)], ['Susut produksi (%)', lb.susutPersen],
    ['Nilai bahan masuk produksi (rata-rata)', bulat_(tot.hppBahan, 0)], ['Biaya proses blowing', bulat_(tot.hppProses, 0)],
    ['Barang rusak (kg)', bulat_(tot.rusakKg, 2)], ['Barang rusak (nilai)', bulat_(tot.rusakRp, 0)],
    ['Daur ulang scrap: batch selesai', totDaur.batch], ['Daur ulang: scrap dikirim (kg)', bulat_(totDaur.scrap, 2)],
    ['Daur ulang: biji plastik diterima (kg)', bulat_(totDaur.hasil, 2)], ['Daur ulang: susut chassen (kg)', bulat_(totDaur.susut, 2)],
    ['Daur ulang: biaya jasa chassen (nilai)', bulat_(totDaur.jasa, 0)],
    ['Nilai stok awal bulan (rata-rata)', bulat_(lb.nilaiStokAwal, 0)], ['Nilai stok akhir bulan (rata-rata)', bulat_(nilaiStok, 0)],
    ['COGS bulan (stok awal + pembelian − retur + jasa chassen + biaya proses − stok akhir)', bulat_(lb.cogs, 0)],
    ['Laba kotor bulan (penjualan dari harga SO − COGS)', bulat_(lb.labaKotor, 0)],
    ['Catatan', 'Nilai penjualan hanya untuk pengiriman yang merujuk SO (ada harga jual); pengiriman tanpa SO tercantum di kolom kg-nya. COGS belum memuat overhead pabrik selain biaya proses per kg. PPN tidak dihitung.']
  ];

  catatLog_('EKSPOR', bulan, u.nama);
  return {
    bulan: bulan,
    files: [
      { nama: 'ringkasan_' + bulan + '.csv', csv: csv_(['Keterangan', 'Nilai'], ringkasan) },
      { nama: 'pembelian_' + bulan + '.csv', csv: csv_(['Tanggal', 'ID', 'Jenis', 'Supplier', 'No_PO', 'No_Invoice', 'No_Surat_Jalan', 'Kode_Item', 'Nama_Item', 'Qty_Kg', 'Harga_Per_Kg', 'Nilai', 'Status', 'Pencatat', 'Catatan_QC'], beli) },
      { nama: 'penjualan_' + bulan + '.csv', csv: csv_(['Tanggal', 'ID', 'Jenis', 'Customer', 'No_SO', 'No_Surat_Jalan', 'Kode_Item', 'Nama_Item', 'Qty_Kg', 'Harga_Jual_Per_Kg', 'Nilai_Jual', 'HPP_Per_Kg', 'Nilai_HPP', 'Laba_Kotor', 'Status', 'Pencatat'], jual) },
      { nama: 'produksi_' + bulan + '.csv', csv: csv_(['Tanggal', 'Shift', 'ID', 'Operator_Blowing', 'Ambil_Gudang', 'Ambil_Kg', 'Roll_KW_Kg', 'Roll_Super_Kg', 'Roll_Super_Plus_Kg', 'Roll_Kg', 'BS_Blowing_Kg', 'Operator_Cutting', 'Roll_Pakai_Kg', 'Polybag_KW_Kg', 'Polybag_Super_Kg', 'Polybag_Super_Plus_Kg', 'Polybag_Kg', 'BS_Cutting_Kg', 'Nilai_Bahan', 'Biaya_Proses', 'Pencatat', 'Catatan'], prod) },
      { nama: 'rusak_' + bulan + '.csv', csv: csv_(['Tanggal', 'ID', 'Lokasi', 'Kode_Item', 'Nama_Item', 'Qty_Kg', 'Nilai_Kerugian', 'Penyebab', 'Pencatat', 'Disetujui_Oleh'], rusak) },
      { nama: 'daur_ulang_' + bulan + '.csv', csv: csv_(['Tanggal_Kirim', 'Tanggal_Terima', 'ID', 'Vendor_Chassen', 'No_Surat_Jalan', 'Scrap_Kg', 'Hasil_Kg', 'Susut_Kg', 'Susut_Persen', 'Status_Susut', 'Nilai_Scrap', 'Biaya_Jasa', 'HPP_Total', 'HPP_Per_Kg', 'Pengirim', 'Penerima'], daur) },
      { nama: 'nilai_stok_' + bulan + '.csv', csv: csv_(['Kode_Item', 'Nama_Item', 'Kategori', 'Qty_Kg', 'Harga_Rata', 'Nilai'], stokRows) }
    ],
    ringkasan: ringkasan
  };
}

/* =================================================================
   BACKUP OTOMATIS — salinan Sheet tiap hari ke folder Drive "IPC Backup"
   Jalankan pasangBackupHarian() SEKALI dari editor Apps Script (butuh izin pemicu).
   ================================================================= */

var NAMA_FOLDER_BACKUP_ = 'IPC Backup';
var SIMPAN_BACKUP_ = 30;   // salinan terakhir yang disimpan

function folderBackup_() {
  var it = DriveApp.getFoldersByName(NAMA_FOLDER_BACKUP_);
  return it.hasNext() ? it.next() : DriveApp.createFolder(NAMA_FOLDER_BACKUP_);
}

/** Dipanggil pemicu waktu. Salin Sheet database → "IPC Backup yyyy-MM-dd", hapus yang lebih tua dari SIMPAN_BACKUP_ salinan. */
function backupHarian() {
  var ss = ss_(), folder = folderBackup_();
  var nama = 'IPC Backup ' + Utilities.formatDate(new Date(), APP.zona, 'yyyy-MM-dd HH.mm');
  DriveApp.getFileById(ss.getId()).makeCopy(nama, folder);
  var files = [], it = folder.getFiles();
  while (it.hasNext()) { var f = it.next(); if (f.getName().indexOf('IPC Backup ') === 0) files.push(f); }
  files.sort(function (a, b) { return a.getName() < b.getName() ? 1 : -1; });   // terbaru dulu
  for (var i = SIMPAN_BACKUP_; i < files.length; i++) files[i].setTrashed(true);
  try { catatLog_('BACKUP', nama, files.length + ' salinan'); } catch (e) {}
  return nama;
}

/** Pasang pemicu harian jam 02:00 (hapus pemicu lama supaya tidak dobel). Jalankan dari editor. */
function pasangBackupHarian() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'backupHarian') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('backupHarian').timeBased().everyDays(1).atHour(2).create();
  var pertama = backupHarian();
  return 'Backup harian terpasang (02:00). Salinan pertama: ' + pertama;
}

/** Info untuk menu Admin: apakah pemicu terpasang, salinan terakhir. */
function statusBackup(ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehReview_(u)) throw new Error('Hanya Supervisor / Admin.');
  var terpasang = false;
  try { terpasang = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'backupHarian'; }); } catch (e) {}
  var terakhir = '', jumlah = 0;
  try {
    var it = DriveApp.getFoldersByName(NAMA_FOLDER_BACKUP_);
    if (it.hasNext()) {
      var files = it.next().getFiles();
      while (files.hasNext()) { var f = files.next(); if (f.getName().indexOf('IPC Backup ') === 0) { jumlah++; if (f.getName() > terakhir) terakhir = f.getName(); } }
    }
  } catch (e) {}
  return { terpasang: terpasang, terakhir: terakhir, jumlah: jumlah, simpan: SIMPAN_BACKUP_ };
}
