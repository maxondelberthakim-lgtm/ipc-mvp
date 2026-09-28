/*************************************************************************
 * IPC — Inventory & Production Control (v10)
 * File 8 : TutupBulan.gs
 *
 * Tutup buku bulanan. HPP tidak dihitung per pekerjaan lagi; laba kotor
 * dihitung periodik dari nilai stok (harga rata-rata):
 *
 *   COGS = stok awal + pembelian − retur supplier + jasa chassen + biaya proses − stok akhir
 *   Laba kotor = penjualan (harga SO) − COGS
 *
 * Susut produksi kelihatan di sini (bukan per shift):
 *   susut = biji masuk blowing − polybag jadi − BS (blowing + cutting) − perubahan stok roll
 *   ditambah selisih minus stock opname bulan itu.
 *
 * Setelah bulan ditutup: transaksi bertanggal di bulan itu tidak bisa ditambah / diubah /
 * dibatalkan (dijaga lewat tglValid_, alasanKunci_, terapkanEdit_, tinjauTransfer, modul
 * shift & daur ulang). Admin bisa membuka lagi (bukaBulan) — tercatat di log.
 *************************************************************************/

/* =================================================================
   STATUS TUTUP — baris terakhir per bulan yang berlaku
   ================================================================= */

function petaTutup_() {
  var m = {};
  var rows = [];
  try { rows = baca_(SHEET.TUTUP); } catch (e) { rows = []; }   // sebelum migrasi: belum ada sheet
  rows.forEach(function (r) { m[String(r.Bulan)] = r; });        // urutan baris = urutan waktu → terakhir menang
  return m;
}
function bulanTertutup_(tanggal) {
  var b = String(tanggal || '').slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(b)) return false;
  var r = petaTutup_()[b];
  return !!r && r.Status === STATUS_TUTUP.DITUTUP;
}
function bulanTerakhirTertutup_() {
  var m = petaTutup_(), akhir = '';
  Object.keys(m).forEach(function (b) { if (m[b].Status === STATUS_TUTUP.DITUTUP && b > akhir) akhir = b; });
  return akhir;
}
function bulanSebelum_(bulan) {
  var y = parseInt(bulan.slice(0, 4), 10), m = parseInt(bulan.slice(5, 7), 10) - 1;
  if (m < 1) { m = 12; y--; }
  return y + '-' + String(m).padStart(2, '0');
}
function bulanValid_(bulan) {
  bulan = String(bulan || '').trim();
  if (!/^\d{4}-\d{2}$/.test(bulan)) throw new Error('Format bulan harus YYYY-MM.');
  var m = parseInt(bulan.slice(5, 7), 10); if (m < 1 || m > 12) throw new Error('Bulan tidak valid.');
  return bulan;
}

/* =================================================================
   PERHITUNGAN — dipakai laporanBulanan, tutupBulan, eksporBulanan
   ================================================================= */

/** rataAkhir opsional (hasil hitungRata_(akhirBulan_(bulan))) supaya tidak dihitung dua kali. */
function laporanBulanan_(bulan, rataAkhir) {
  var peta = petaItem_();
  var akhir = akhirBulan_(bulan), awal = akhirBulan_(bulanSebelum_(bulan));
  var rAkhir = rataAkhir || hitungRata_(akhir), rAwal = hitungRata_(awal);
  function nilaiPos(P, kategori) {
    var n = 0, q = 0;
    Object.keys(P).forEach(function (k) {
      if (P[k].qty <= 0.0001) return;
      if (kategori && (!peta[k] || peta[k].kategori !== kategori)) return;
      n += P[k].nilai; q += P[k].qty;
    });
    return { nilai: n, qty: q };
  }
  var stokAwal = nilaiPos(rAwal.pos), stokAkhir = nilaiPos(rAkhir.pos);
  var perKategori = {};
  [KATEGORI_ITEM.BAHAN_BAKU, KATEGORI_ITEM.ROLL, KATEGORI_ITEM.BARANG_JADI, KATEGORI_ITEM.SCRAP, KATEGORI_ITEM.KEDUANYA].forEach(function (k) {
    var a = nilaiPos(rAwal.pos, k), z = nilaiPos(rAkhir.pos, k);
    if (a.qty > 0.0001 || z.qty > 0.0001) perKategori[k] = { awalKg: bulat_(a.qty, 2), awal: bulat_(a.nilai, 0), akhirKg: bulat_(z.qty, 2), akhir: bulat_(z.nilai, 0) };
  });

  /* pembelian & retur supplier (nilai dari harga penerimaan / PO / master) */
  var poHarga = {}; baca_(SHEET.PO).forEach(function (r) { poHarga[r.ID] = angka_(r.Harga_Per_Kg); });
  var beli = 0, beliKg = 0, retur = 0, returKg = 0;
  baca_(SHEET.PENERIMAAN).forEach(function (r) {
    if (!dalamBulan_(r.Tanggal, bulan) || !dihitung_(r)) return;
    var q = angka_(r.Qty_Kg);
    if (r.Jenis === JENIS_PENERIMAAN.RETUR) { retur += angka_(rAkhir.biaya[r.ID]); returKg += q; return; }
    var harga = angka_(r.Harga_Per_Kg) || (r.ID_PO && poHarga[r.ID_PO]) || (peta[r.Kode_Item] ? peta[r.Kode_Item].harga : 0);
    beli += q * harga; beliKg += q;
  });

  /* penjualan (harga SO) & pengiriman */
  var soById = {}; baca_(SHEET.SO).forEach(function (r) { soById[r.ID] = r; });
  var jual = 0, jualKg = 0, jualTanpaSoKg = 0, returCustKg = 0, hppJual = 0;
  baca_(SHEET.PENGIRIMAN).forEach(function (r) {
    if (!dalamBulan_(r.Tanggal, bulan) || !dihitung_(r)) return;
    var q = angka_(r.Qty_Kg);
    if (r.Jenis === JENIS_PENGIRIMAN.RETUR_MASUK) { returCustKg += q; return; }
    jualKg += q; hppJual += angka_(rAkhir.biaya[r.ID]);
    var so = r.ID_SO ? soById[r.ID_SO] : null;
    if (so) jual += q * angka_(so.Harga_Per_Kg); else jualTanpaSoKg += q;
  });

  /* jasa chassen: batch selesai (diterima) di bulan itu */
  var jasa = 0, daurBatch = 0, daurScrapKg = 0, daurHasilKg = 0;
  baca_(SHEET.DAUR).forEach(function (r) {
    if (r.Status !== STATUS_DAUR.SELESAI || !r.Waktu_Terima) return;
    var tglT = r.Tanggal_Terima || tglStr_(new Date(r.Waktu_Terima));
    if (!dalamBulan_(tglT, bulan)) return;
    jasa += angka_(r.Biaya_Jasa); daurBatch++; daurScrapKg += angka_(r.Total_Scrap_Kg); daurHasilKg += angka_(r.Total_Hasil_Kg);
  });

  /* produksi: laporan shift bulan itu */
  var pr = { shift: 0, blowing: 0, cutting: 0, ambilKg: 0, rollKg: 0, rollPakaiKg: 0, jadiKg: 0, bsBlowingKg: 0, bsCuttingKg: 0, proses: 0, nilaiBahan: 0 };
  var jadiPerKualitas = {}, bsPerKualitas = {}, detShift = {};
  baca_(SHEET.SHIFT_DETAIL).forEach(function (d) { (detShift[d.ID_Shift] = detShift[d.ID_Shift] || []).push(d); });
  baca_(SHEET.SHIFT).forEach(function (r) {
    if (r.Status === STATUS_SHIFT.DIBATALKAN || !dalamBulan_(r.Tanggal, bulan)) return;
    pr.shift++; pr.proses += angka_(rAkhir.proses[r.ID]); pr.nilaiBahan += angka_(rAkhir.biaya[r.ID]);
    var hasil = angka_(r.Total_Hasil_Kg), bs = angka_(r.Total_BS_Kg);
    if (r.Mesin === MESIN.BLOWING) { pr.blowing++; pr.ambilKg += angka_(r.Total_Ambil_Kg); pr.rollKg += hasil; pr.bsBlowingKg += bs; }
    else { pr.cutting++; pr.rollPakaiKg += angka_(r.Total_Roll_Pakai_Kg); pr.jadiKg += hasil; pr.bsCuttingKg += bs; }
    (detShift[r.ID] || []).forEach(function (x) {
      var k = x.Kualitas || '-', q = angka_(x.Qty_Kg);
      if (x.Jenis === JENIS_SHIFT.HASIL && r.Mesin === MESIN.CUTTING) jadiPerKualitas[k] = (jadiPerKualitas[k] || 0) + q;
      else if (x.Jenis === JENIS_SHIFT.BS) bsPerKualitas[k] = (bsPerKualitas[k] || 0) + q;
    });
  });
  var bsKg = pr.bsBlowingKg + pr.bsCuttingKg;
  var rollPerubahan = pr.rollKg - pr.rollPakaiKg;                       // roll bertambah (+) / berkurang (−)
  var susutProduksi = pr.ambilKg - pr.jadiKg - bsKg - rollPerubahan;     // = ambil − roll hasil − BS blowing

  /* selisih opname bulan itu (minus = susut / hilang, plus = temuan) */
  var opnameMinus = 0, opnamePlus = 0, opnameSesi = {};
  baca_(SHEET.OPNAME).forEach(function (r) {
    if (!dalamBulan_(r.Tanggal, bulan)) return;
    opnameSesi[r.ID_Sesi] = 1;
    var d = angka_(r.Selisih); if (d < 0) opnameMinus += -d; else opnamePlus += d;
  });
  var susutKg = susutProduksi + opnameMinus - opnamePlus;
  var susutPersen = pr.ambilKg > 0 ? bulat_(susutKg / pr.ambilKg * 100, 2) : 0;

  /* barang rusak disetujui */
  var rusak = 0, rusakKg = 0;
  baca_(SHEET.KERUSAKAN).forEach(function (r) {
    if (r.Status !== STATUS_TRANSFER.DISETUJUI || !dalamBulan_(r.Tanggal, bulan)) return;
    rusak += angka_(rAkhir.biaya[r.ID]); rusakKg += angka_(r.Qty_Kg);
  });

  var cogs = stokAwal.nilai + beli - retur + jasa + pr.proses - stokAkhir.nilai;
  var labaKotor = jual - cogs;
  return {
    bulan: bulan, mataUang: mataUang_(),
    nilaiStokAwal: bulat_(stokAwal.nilai, 0), stokAwalKg: bulat_(stokAwal.qty, 2),
    pembelian: bulat_(beli, 0), pembelianKg: bulat_(beliKg, 2),
    returSupplier: bulat_(retur, 0), returSupplierKg: bulat_(returKg, 2),
    jasaChassen: bulat_(jasa, 0), biayaProses: bulat_(pr.proses, 0),
    nilaiStokAkhir: bulat_(stokAkhir.nilai, 0), stokAkhirKg: bulat_(stokAkhir.qty, 2),
    cogs: bulat_(cogs, 0),
    penjualan: bulat_(jual, 0), penjualanKg: bulat_(jualKg, 2), penjualanTanpaSoKg: bulat_(jualTanpaSoKg, 2), returCustomerKg: bulat_(returCustKg, 2),
    hppPengiriman: bulat_(hppJual, 0),                                   // pembanding: nilai rata-rata barang yang dikirim
    labaKotor: bulat_(labaKotor, 0),
    marginPersen: jual > 0 ? bulat_(labaKotor / jual * 100, 2) : 0,
    produksi: {
      shift: pr.shift, blowing: pr.blowing, cutting: pr.cutting,
      masukProduksiKg: bulat_(pr.ambilKg, 2), rollKg: bulat_(pr.rollKg, 2), rollPakaiKg: bulat_(pr.rollPakaiKg, 2),
      hasilJadiKg: bulat_(pr.jadiKg, 2), bsBlowingKg: bulat_(pr.bsBlowingKg, 2), bsCuttingKg: bulat_(pr.bsCuttingKg, 2), bsKg: bulat_(bsKg, 2),
      nilaiBahan: bulat_(pr.nilaiBahan, 0), biayaProses: bulat_(pr.proses, 0),
      jadiPerKualitas: jadiPerKualitas, bsPerKualitas: bsPerKualitas
    },
    susut: {
      produksiKg: bulat_(susutProduksi, 2), opnameMinusKg: bulat_(opnameMinus, 2), opnamePlusKg: bulat_(opnamePlus, 2),
      sesiOpname: Object.keys(opnameSesi).length, totalKg: bulat_(susutKg, 2), persen: susutPersen
    },
    rollPerubahanKg: bulat_(rollPerubahan, 2),
    daurUlang: { batch: daurBatch, scrapKg: bulat_(daurScrapKg, 2), hasilKg: bulat_(daurHasilKg, 2), jasa: bulat_(jasa, 0) },
    rusak: { nilai: bulat_(rusak, 0), kg: bulat_(rusakKg, 2) },
    perKategori: perKategori,
    // ringkas untuk header Tutup_Bulan
    masukProduksiKg: bulat_(pr.ambilKg, 2), hasilJadiKg: bulat_(pr.jadiKg, 2), bsKg: bulat_(bsKg, 2),
    susutKg: bulat_(susutKg, 2), susutPersen: susutPersen
  };
}

function ringkasTutup_(r) {
  var det = {}; try { det = JSON.parse(r.Detail_JSON || '{}'); } catch (e) {}
  return {
    id: r.ID, bulan: r.Bulan, waktu: r.Waktu, oleh: r.Nama_Penutup, status: r.Status, catatan: r.Catatan || '',
    nilaiStokAwal: angka_(r.Nilai_Stok_Awal), pembelian: angka_(r.Pembelian), returSupplier: angka_(r.Retur_Supplier),
    jasaChassen: angka_(r.Biaya_Jasa_Chassen), biayaProses: angka_(r.Biaya_Proses), nilaiStokAkhir: angka_(r.Nilai_Stok_Akhir),
    cogs: angka_(r.COGS), penjualan: angka_(r.Penjualan), labaKotor: angka_(r.Laba_Kotor),
    masukProduksiKg: angka_(r.Masuk_Produksi_Kg), hasilJadiKg: angka_(r.Hasil_Jadi_Kg), bsKg: angka_(r.BS_Kg),
    rollPerubahanKg: angka_(r.Roll_Perubahan_Kg), susutKg: angka_(r.Susut_Kg), susutPersen: angka_(r.Susut_Persen),
    detail: det
  };
}

/* =================================================================
   RPC — Manager / Admin
   ================================================================= */

/** Laporan laba kotor & susut satu bulan (hitung langsung; kalau bulan sudah ditutup, snapshot ikut dikirim). */
function laporanBulanan(bulan, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehLihatHpp_(u)) throw new Error('Laporan bulanan hanya untuk Manager / Admin.');
  bulan = bulan ? bulanValid_(bulan) : bulanSebelum_(tglStr_(new Date()).slice(0, 7));
  var lap = laporanBulanan_(bulan);
  var t = petaTutup_()[bulan];
  lap.tertutup = !!t && t.Status === STATUS_TUTUP.DITUTUP;
  lap.snapshot = t ? ringkasTutup_(t) : null;
  lap.bulanIni = tglStr_(new Date()).slice(0, 7);
  lap.bolehTutup = bolehReview_(u) && !lap.tertutup && bulan < lap.bulanIni;
  lap.bolehBuka = bolehAdmin_(u) && lap.tertutup && bulan === bulanTerakhirTertutup_();
  return lap;
}

/** Tutup bulan: simpan snapshot, kunci transaksi bulan itu. Hanya bulan yang sudah lewat. */
function tutupBulan(bulan, catatan, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehReview_(u)) throw new Error('Hanya Manager / Admin yang bisa menutup bulan.');
  bulan = bulanValid_(bulan);
  var bulanIni = tglStr_(new Date()).slice(0, 7);
  if (bulan >= bulanIni) throw new Error('Bulan ' + bulan + ' belum selesai — tutup buku hanya untuk bulan yang sudah lewat.');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();
  try {
    var m = petaTutup_();
    if (m[bulan] && m[bulan].Status === STATUS_TUTUP.DITUTUP) throw new Error('Bulan ' + bulan + ' sudah ditutup.');
    var akhir = bulanTerakhirTertutup_();
    if (akhir && bulan < akhir) throw new Error('Bulan ' + akhir + ' sudah ditutup lebih dulu — buka dulu bulan itu kalau mau menutup ' + bulan + '.');
    var lap = laporanBulanan_(bulan), id = buatId_('TTP');
    tambah_(SHEET.TUTUP, {
      ID: id, Bulan: bulan, Waktu: new Date(), Ditutup_Oleh: penandaPencatat_(u), Nama_Penutup: u.nama,
      Nilai_Stok_Awal: lap.nilaiStokAwal, Pembelian: lap.pembelian, Retur_Supplier: lap.returSupplier,
      Biaya_Jasa_Chassen: lap.jasaChassen, Biaya_Proses: lap.biayaProses, Nilai_Stok_Akhir: lap.nilaiStokAkhir, COGS: lap.cogs,
      Penjualan: lap.penjualan, Laba_Kotor: lap.labaKotor,
      Masuk_Produksi_Kg: lap.masukProduksiKg, Hasil_Jadi_Kg: lap.hasilJadiKg, BS_Kg: lap.bsKg, Roll_Perubahan_Kg: lap.rollPerubahanKg,
      Susut_Kg: lap.susutKg, Susut_Persen: lap.susutPersen,
      Detail_JSON: JSON.stringify({ produksi: lap.produksi, susut: lap.susut, daurUlang: lap.daurUlang, rusak: lap.rusak, perKategori: lap.perKategori,
                                    penjualanKg: lap.penjualanKg, penjualanTanpaSoKg: lap.penjualanTanpaSoKg, hppPengiriman: lap.hppPengiriman, marginPersen: lap.marginPersen }),
      Catatan: catatan || '', Status: STATUS_TUTUP.DITUTUP
    });
    catatLog_('TUTUP_BULAN', bulan, u.nama + ' • COGS ' + mataUang_() + ' ' + lap.cogs + ' • laba kotor ' + lap.labaKotor + ' • susut ' + lap.susutKg + ' kg (' + lap.susutPersen + '%)');
    return { ok: true, id: id, bulan: bulan, cogs: lap.cogs, labaKotor: lap.labaKotor, susutKg: lap.susutKg, susutPersen: lap.susutPersen };
  } finally { lock.releaseLock(); }
}

/** Buka lagi bulan yang sudah ditutup (Admin saja, hanya bulan tertutup terakhir). */
function bukaBulan(bulan, alasan, ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehAdmin_(u)) throw new Error('Hanya Admin yang bisa membuka bulan yang sudah ditutup.');
  bulan = bulanValid_(bulan);
  if (!String(alasan || '').trim()) throw new Error('Alasan membuka bulan wajib diisi.');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  lupakanMemo_();
  try {
    var m = petaTutup_(), r = m[bulan];
    if (!r || r.Status !== STATUS_TUTUP.DITUTUP) throw new Error('Bulan ' + bulan + ' tidak dalam keadaan tertutup.');
    if (bulan !== bulanTerakhirTertutup_()) throw new Error('Hanya bulan tertutup terakhir (' + bulanTerakhirTertutup_() + ') yang bisa dibuka.');
    ubahBaris_(SHEET.TUTUP, r._baris, { Status: STATUS_TUTUP.DIBUKA, Catatan: [r.Catatan, 'dibuka ' + Utilities.formatDate(new Date(), APP.zona, 'dd/MM/yyyy HH:mm') + ' oleh ' + u.nama + ': ' + alasan].filter(String).join(' | ') });
    catatLog_('BUKA_BULAN', bulan, u.nama + ' — ' + alasan);
    return { ok: true, bulan: bulan };
  } finally { lock.releaseLock(); }
}

/** Daftar bulan yang pernah ditutup (terbaru dulu) + bulan yang belum ditutup sampai bulan lalu. */
function daftarTutupBulan(ident) {
  var u = penggunaSaatIni_(ident);
  if (!bolehLihatHpp_(u)) throw new Error('Hanya Manager / Admin.');
  var m = petaTutup_(), out = Object.keys(m).map(function (b) { return ringkasTutup_(m[b]); })
    .sort(function (a, b) { return a.bulan < b.bulan ? 1 : -1; });
  return { daftar: out, terakhirTertutup: bulanTerakhirTertutup_(), bulanIni: tglStr_(new Date()).slice(0, 7), bolehTutup: bolehReview_(u), bolehBuka: bolehAdmin_(u) };
}
