/*************************************************************************
 * IPC — Inventory & Production Control (v9)
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

/** p = { customer, tanggal, tanggalKirim, baris:[{kode, qty, harga}], catatan } */
function simpanSo(p, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehPo_(u)) throw new Error('Hanya Manager / Admin yang bisa membuat sales order.');
  if (!p || !String(p.customer || '').trim()) throw new Error('Customer belum dipilih.');
  if (!p.baris || !p.baris.length) throw new Error('Item SO belum diisi.');
  var kirim = String(p.tanggalKirim || '').trim();
  if (kirim && !/^\d{4}-\d{2}-\d{2}$/.test(kirim)) throw new Error('Format tanggal kirim harus YYYY-MM-DD.');
  var peta = petaItem_();
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();
  try {
    var now = new Date(), tanggal = tglValid_(p.tanggal);
    var noSo = nomorSoBaru_(), ids = [], total = 0, nilai = 0;
    p.baris.forEach(function (b) {
      var it = peta[b.kode]; if (!it) throw new Error('Item tidak dikenal: ' + b.kode);
      var q = angka_(b.qty), h = angka_(b.harga);
      if (q <= 0) throw new Error('Qty harus > 0 (' + it.nama + ')');
      if (h < 0) throw new Error('Harga jual tidak boleh negatif (' + it.nama + ')');
      var id = buatId_('SO'); ids.push(id); total += q; nilai += q * h;
      tambah_(SHEET.SO, {
        ID: id, No_SO: noSo, Waktu: now, Tanggal: tanggal, Customer: p.customer,
        Kode_Item: it.kode, Nama_Item: it.nama, Qty_Kg: q, Harga_Per_Kg: h,
        Tanggal_Kirim: kirim, Qty_Dikirim_Kg: 0, Status: STATUS_SO.TERBUKA,
        Dibuat_Oleh: penandaPencatat_(u), Nama_Pembuat: u.nama, Catatan: p.catatan || '', Log_Edit: ''
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
    if (perubahan.catatan !== undefined && String(perubahan.catatan) !== String(r.Catatan || '')) { ubah.Catatan = perubahan.catatan; log.push('catatan diubah'); }
    if (!log.length) return { ok: true, berubah: false };
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
    tanggalKirim: r.Tanggal_Kirim || '', status: r.Status, pembuat: r.Nama_Pembuat, catatan: r.Catatan || '', logEdit: r.Log_Edit || ''
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
 * pembelian, penjualan, produksi (HPP), rusak, daur_ulang (v9), nilai_stok (posisi akhir bulan, FIFO), ringkasan.
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
              jobs: 0, hppBahan: 0, hppProses: 0, susutKg: 0, susutRp: 0, rusakKg: 0, rusakRp: 0 };

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

  /* --- produksi: pekerjaan selesai di bulan itu --- */
  var prod = [];
  baca_(SHEET.PEKERJAAN).forEach(function (r) {
    if (r.Status !== STATUS_PEKERJAAN.SELESAI || !r.Waktu_Selesai) return;
    var tglSelesai = tglStr_(new Date(r.Waktu_Selesai));
    if (!dalamBulan_(tglSelesai, bulan)) return;
    prod.push([tglSelesai, r.ID, r.Kode_Produk, r.Nama_Produk, angka_(r.Total_Bahan_Baku_Kg), angka_(r.Total_Barang_Jadi_Kg), angka_(r.Total_Scrap_Kg),
               angka_(r.Susut_Kg), angka_(r.Susut_Persen), r.Status_Susut, angka_(r.HPP_Bahan), angka_(r.HPP_Proses), angka_(r.HPP_Total), angka_(r.HPP_Per_Kg), angka_(r.Nilai_Susut), r.Nama_Operator]);
    tot.jobs++; tot.hppBahan += angka_(r.HPP_Bahan); tot.hppProses += angka_(r.HPP_Proses); tot.susutKg += angka_(r.Susut_Kg); tot.susutRp += angka_(r.Nilai_Susut);
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

  /* --- nilai stok posisi akhir bulan (FIFO) — v9: satu lokasi --- */
  var L = hitungFifo_(akhirBulan_(bulan)).lapisan, stokRows = [], nilaiStok = 0;
  Object.keys(L).forEach(function (k) {
    var q = 0, n = 0; L[k].forEach(function (x) { q += x.qty; n += x.qty * x.harga; });
    if (q <= 0.0001) return;
    stokRows.push([k, peta[k] ? peta[k].nama : k, bulat_(q, 2), bulat_(n / q, 0), bulat_(n, 0), L[k].length]);
    nilaiStok += n;
  });

  var ringkasan = [
    ['Periode', bulan], ['Mata uang', cur],
    ['Pembelian (kg)', bulat_(tot.beliKg, 2)], ['Pembelian (nilai)', bulat_(tot.beliRp, 0)],
    ['Retur ke supplier (kg)', bulat_(tot.returKg, 2)], ['Retur ke supplier (nilai)', bulat_(tot.returRp, 0)],
    ['Penjualan (kg)', bulat_(tot.jualKg, 2)], ['Penjualan tanpa SO / tanpa harga (kg)', bulat_(tot.jualTanpaSoKg, 2)],
    ['Penjualan (nilai, dari harga SO)', bulat_(tot.jualRp, 0)],
    ['HPP barang terjual (semua pengiriman)', bulat_(tot.hppJualRp, 0)], ['HPP barang terjual (yang ada harga SO)', bulat_(tot.hppJualSoRp, 0)],
    ['Laba kotor (penjualan − HPP, hanya yang ada harga SO)', bulat_(tot.jualRp - tot.hppJualSoRp, 0)],
    ['Retur dari customer (kg)', bulat_(tot.returCustKg, 2)],
    ['Pekerjaan selesai', tot.jobs], ['HPP bahan (produksi)', bulat_(tot.hppBahan, 0)], ['HPP proses (produksi)', bulat_(tot.hppProses, 0)],
    ['Susut (kg)', bulat_(tot.susutKg, 2)], ['Susut (nilai)', bulat_(tot.susutRp, 0)],
    ['Barang rusak (kg)', bulat_(tot.rusakKg, 2)], ['Barang rusak (nilai)', bulat_(tot.rusakRp, 0)],
    ['Daur ulang scrap: batch selesai', totDaur.batch], ['Daur ulang: scrap dikirim (kg)', bulat_(totDaur.scrap, 2)],
    ['Daur ulang: biji plastik diterima (kg)', bulat_(totDaur.hasil, 2)], ['Daur ulang: susut chassen (kg)', bulat_(totDaur.susut, 2)],
    ['Daur ulang: biaya jasa chassen (nilai)', bulat_(totDaur.jasa, 0)],
    ['Nilai stok akhir bulan (FIFO)', bulat_(nilaiStok, 0)],
    ['Catatan', 'Nilai penjualan & laba hanya untuk pengiriman yang merujuk SO (ada harga jual); pengiriman tanpa SO tercantum di kolom kg-nya. HPP belum memuat overhead pabrik. PPN tidak dihitung.']
  ];

  catatLog_('EKSPOR', bulan, u.nama);
  return {
    bulan: bulan,
    files: [
      { nama: 'ringkasan_' + bulan + '.csv', csv: csv_(['Keterangan', 'Nilai'], ringkasan) },
      { nama: 'pembelian_' + bulan + '.csv', csv: csv_(['Tanggal', 'ID', 'Jenis', 'Supplier', 'No_PO', 'No_Invoice', 'No_Surat_Jalan', 'Kode_Item', 'Nama_Item', 'Qty_Kg', 'Harga_Per_Kg', 'Nilai', 'Status', 'Pencatat', 'Catatan_QC'], beli) },
      { nama: 'penjualan_' + bulan + '.csv', csv: csv_(['Tanggal', 'ID', 'Jenis', 'Customer', 'No_SO', 'No_Surat_Jalan', 'Kode_Item', 'Nama_Item', 'Qty_Kg', 'Harga_Jual_Per_Kg', 'Nilai_Jual', 'HPP_Per_Kg', 'Nilai_HPP', 'Laba_Kotor', 'Status', 'Pencatat'], jual) },
      { nama: 'produksi_' + bulan + '.csv', csv: csv_(['Tanggal_Selesai', 'ID', 'Kode_Produk', 'Nama_Produk', 'Bahan_Kg', 'Jadi_Kg', 'Scrap_Kg', 'Susut_Kg', 'Susut_Persen', 'Status_Susut', 'HPP_Bahan', 'HPP_Proses', 'HPP_Total', 'HPP_Per_Kg', 'Nilai_Susut', 'Operator'], prod) },
      { nama: 'rusak_' + bulan + '.csv', csv: csv_(['Tanggal', 'ID', 'Lokasi', 'Kode_Item', 'Nama_Item', 'Qty_Kg', 'Nilai_Kerugian', 'Penyebab', 'Pencatat', 'Disetujui_Oleh'], rusak) },
      { nama: 'daur_ulang_' + bulan + '.csv', csv: csv_(['Tanggal_Kirim', 'Tanggal_Terima', 'ID', 'Vendor_Chassen', 'No_Surat_Jalan', 'Scrap_Kg', 'Hasil_Kg', 'Susut_Kg', 'Susut_Persen', 'Status_Susut', 'Nilai_Scrap', 'Biaya_Jasa', 'HPP_Total', 'HPP_Per_Kg', 'Pengirim', 'Penerima'], daur) },
      { nama: 'nilai_stok_' + bulan + '.csv', csv: csv_(['Kode_Item', 'Nama_Item', 'Qty_Kg', 'Harga_Rata', 'Nilai', 'Jumlah_Batch'], stokRows) }
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
