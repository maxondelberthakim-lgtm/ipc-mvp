/* Uji beban mesin Cloudflare: isi ±1 tahun data pabrik sintetis lewat RPC asli,
   sebar tanggalnya ke 365 hari ke belakang, lalu ukur waktu muat (cold start DO)
   dan waktu tiap fungsi berat. Jalankan: node tools/bench-cf.js [hariKerja=300] */
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');
const H = require(path.join(__dirname, '..', 'tests', 'harness-cf.js'));
const HARI = parseInt(process.argv[2] || '300', 10);
const file = path.join(require('os').tmpdir(), 'ipc-bench.db');
try { fs.unlinkSync(file); } catch (e) {}

function buka() {
  const db = new DatabaseSync(file);
  const sql = { exec(q, ...p) { const st = db.prepare(q); if (/^\s*(SELECT|PRAGMA)/i.test(q)) { const rows = st.all(...p); return { toArray: () => rows }; } st.run(...p); return { toArray: () => [] }; } };
  const M = H.muatEsm(path.join(__dirname, '..', 'cloudflare', 'src', 'mesin.js'));
  const t0 = process.hrtime.bigint();
  const m = new M.Mesin({ sql, asalFoto: 'https://api.test', log: (a, b) => { if (a === 'muat') console.log('  muat:', JSON.stringify(b)); } });
  return { db, sql, m, msMuat: Number(process.hrtime.bigint() - t0) / 1e6 };
}
const MGR = { nama: 'Manager', pin: '1357' }, STAF = { nama: 'Staff Gudang', pin: '1111' };
let A = buka();
const m = A.m;
const rpc = (fn, args, id) => { const r = JSON.parse(m.panggil(fn, args, id)); if (!r.ok) throw new Error(fn + ': ' + r.error); return r.data; };
const item = m.vars.DUMMY_ITEM, RM = item.filter(r => r[2] === 'BAHAN_BAKU' && r[0] !== 'RM-BP-DU').map(r => r[0]), FG = item.filter(r => r[2] === 'BARANG_JADI').map(r => r[0]);
const SUP = m.vars.DUMMY_SUPPLIER.map(r => r[1]), CUS = m.vars.DUMMY_CUSTOMER.map(r => r[1]);
let seq = 0; const idk = () => 'b' + (seq++);
const acak = (n) => Math.floor(Math.random() * n), pilih = (a) => a[acak(a.length)];

console.log('Mengisi', HARI, 'hari kerja …');
const t0 = Date.now();
const soTerbuka = [];
for (let h = 0; h < HARI; h++) {
  /* pembelian: PO + terima */
  for (let i = 0; i < 3; i++) {
    const kode = pilih(RM);
    const po = rpc('simpanPo', [{ supplier: pilih(SUP), baris: [{ kode, qty: 1000, harga: 13000 + acak(3000) }] }, MGR], idk());
    rpc('simpanPenerimaan', [{ jenis: 'BELI_MASUK', supplier: po.supplier || pilih(SUP), noSuratJalan: 'SJ/' + h + '/' + i, baris: [{ kode, qty: 1000 }], ident: STAF }], idk());
  }
  /* produksi: 6 pekerjaan, ditutup hari yang sama */
  for (let i = 0; i < 6; i++) {
    const produk = pilih(FG);
    const bahan = [{ kode: RM[acak(3)], qty: 400 + acak(200) }, { kode: RM[3 + acak(2)], qty: 5 + acak(5) }, { kode: 'RM-AF', qty: 2 }];
    const j = rpc('mulaiPekerjaan', [{ kodeProduk: produk, bahanBaku: bahan, ident: STAF }], idk());
    const total = bahan.reduce((s, b) => s + b.qty, 0);
    rpc('selesaikanPekerjaan', [{ id: j.id, barangJadi: [{ kode: produk, qty: Math.round(total * 0.96) }], scrapKg: Math.round(total * 0.02), ident: STAF }], idk());
  }
  /* penjualan: 2 SO + 4 pengiriman */
  for (let i = 0; i < 2; i++) {
    const kode = pilih(FG);
    const so = rpc('simpanSo', [{ customer: pilih(CUS), baris: [{ kode, qty: 800, harga: 25000 + acak(5000) }] }, MGR], idk());
    soTerbuka.push({ noSo: so.noSo, customer: so.customer, kode, sisa: 800, idSo: so.baris ? so.baris[0].id : null });
  }
  for (let i = 0; i < 4; i++) {
    const kode = pilih(FG);
    try { rpc('simpanPengiriman', [{ jenis: 'KELUAR', customer: pilih(CUS), noSuratJalan: 'DO/' + h + '/' + i, baris: [{ kode, qty: 150 + acak(150) }], ident: STAF }], idk()); } catch (e) { /* stok FG habis — lewati */ }
  }
  /* daur ulang seminggu sekali */
  if (h % 5 === 0) {
    try {
      const d = rpc('mulaiDaurUlang', [{ vendor: 'Vendor Chassen', noSuratJalan: 'CH/' + h, scrap: [{ kode: 'SCR-' + pilih(FG).slice(3), qty: 30 }], ident: STAF }], idk());
      rpc('selesaikanDaurUlang', [{ id: d.id, hasil: [{ kode: 'RM-BP-DU', qty: 28 }], biayaJasa: 60000, ident: MGR }], idk());
    } catch (e) { if (h === 0) console.log('  (daur ulang dilewati:', e.message.slice(0, 80) + ')'); }
  }
  /* kerusakan sesekali, opname bulanan */
  if (h % 15 === 0) { try { rpc('simpanKerusakan', [{ lokasi: 'GBJ', kode: pilih(RM), qty: 5, penyebab: 'karung sobek', ident: STAF }], idk()); } catch (e) {} }
  if (h % 22 === 21) { try { const o = rpc('siapkanOpname', [MGR], idk()); rpc('simpanOpname', [{ baris: o.daftar.slice(0, 5).map(x => ({ kode: x.kode, fisik: x.sistem })) }, MGR], idk()); } catch (e) { if (h === 21) console.log('  (opname dilewati:', e.message.slice(0, 80) + ')'); } }
  /* review: setujui antrian */
  if (h % 3 === 0) { try { rpc('antrianReview', [MGR], idk()).slice(0, 20).forEach(q => { try { rpc('tinjauTransfer', [q.id, 'DISETUJUI', '', MGR], idk()); } catch (e) {} }); } catch (e) {} }
}
console.log('  isi selesai dalam', ((Date.now() - t0) / 1000).toFixed(1), 'dtk');

/* sebar waktu ke 365 hari ke belakang, urutan dipertahankan */
{
  const H_ = m.vars.HEADER, SS = m.SS, semua = [];
  Object.keys(SS.sheets).forEach((n) => {
    const head = H_[n]; if (!head) return;
    const kolomW = head.map((h, i) => /^Waktu/.test(h) ? i : -1).filter(i => i >= 0);
    const kolomT = head.map((h, i) => /^(Tanggal|Tanggal_Invoice|Perkiraan_Datang|Tanggal_Kirim|Tanggal_Terima)$/.test(h) ? i : -1).filter(i => i >= 0);
    if (!kolomW.length) return;
    SS.sheets[n].rows.forEach((r, ri) => { if (ri === 0) return; kolomW.forEach((c) => { if (r[c] instanceof Date) semua.push({ n, r, c, t: r[c].getTime(), kolomT, ri }); }); });
  });
  semua.sort((a, b) => a.t - b.t);
  const kini = Date.now(), N = semua.length;
  semua.forEach((e, i) => {
    const baru = new Date(kini - Math.round(365 * 86400000 * (1 - i / N)));
    e.r[e.c] = baru;
  });
  /* Tanggal = tanggal dari Waktu pertama di baris itu */
  Object.keys(SS.sheets).forEach((n) => {
    const head = H_[n]; if (!head) return;
    const iW = head.findIndex(h => /^Waktu/.test(h)); if (iW < 0) return;
    const kolomT = head.map((h, i) => /^(Tanggal|Tanggal_Invoice|Perkiraan_Datang|Tanggal_Kirim|Tanggal_Terima)$/.test(h) ? i : -1).filter(i => i >= 0);
    SS.sheets[n].rows.forEach((r, ri) => { if (ri && r[iW] instanceof Date) kolomT.forEach((c) => { if (r[c]) r[c] = m.fns.tglStr_(r[iW]); }); });
    m.kotor.set(n, 'SEMUA');
  });
  m.fns.lupakanMemo_();
  m.simpan();
}
let totalBaris = 0; const ringkas = {};
Object.keys(m.SS.sheets).forEach((n) => { const k = m.SS.sheets[n].rows.length - 1; ringkas[n] = k; totalBaris += k; });
const nChunk = A.sql.exec('SELECT COUNT(*) AS n, SUM(LENGTH(data)) AS b FROM chunk').toArray()[0];
console.log('Baris per sheet:', JSON.stringify(ringkas));
console.log('TOTAL baris:', totalBaris, '| potongan SQLite:', nChunk.n, '| ukuran JSON:', (nChunk.b / 1048576).toFixed(1), 'MB');
A.db.close();

/* ---- cold start + fungsi berat ---- */
console.log('\nCold start (muat semua dari SQLite, seperti DO bangun dari hibernasi):');
const B = buka(); const mm = B.m;
console.log('  konstruktor Mesin total:', B.msMuat.toFixed(0), 'ms');
function ukur(label, fn, n) {
  n = n || 3; const t = [];
  for (let i = 0; i < n; i++) { const a = process.hrtime.bigint(); const r = fn(); t.push(Number(process.hrtime.bigint() - a) / 1e6); if (i === 0 && r && !r.ok) console.log('   !', label, r.error); }
  console.log('  ' + label.padEnd(34), 'pertama', t[0].toFixed(0).padStart(5), 'ms | selanjutnya', t.slice(1).map(x => x.toFixed(0)).join('/'), 'ms');
}
const P = (fn, args) => JSON.parse(mm.panggil(fn, args, 'u' + (seq++)));
ukur('getKonteks (buka app)', () => P('getKonteks', [STAF]));
ukur('getKonteks (manager)', () => P('getKonteks', [MGR]));
ukur('laporanStok', () => P('laporanStok', [MGR]));
ukur('laporanNilaiStok (FIFO)', () => P('laporanNilaiStok', [MGR]));
ukur('laporanHpp 90 hari', () => P('laporanHpp', [90, MGR]));
ukur('laporanSusut', () => P('laporanSusut', [90, MGR]));
ukur('kalender', () => P('kalender', [mm.fns.tglStr_(new Date()).slice(0, 7), MGR]));
ukur('riwayatInput', () => P('riwayatInput', ['PENERIMAAN', 30, STAF]));
ukur('daftarPekerjaanSelesai', () => P('daftarPekerjaanSelesai', [90, STAF]));
ukur('antrianReview', () => P('antrianReview', [MGR]));
ukur('daftarPo', () => P('daftarPo', [MGR, 'SEMUA', 365]));
ukur('daftarSo', () => P('daftarSo', [MGR, 'SEMUA', 365]));
ukur('eksporBulanan', () => P('eksporBulanan', [mm.fns.tglStr_(new Date()).slice(0, 7), MGR]));
ukur('simpanPenerimaan (tulis)', () => P('simpanPenerimaan', [{ jenis: 'BELI_MASUK', supplier: SUP[0], noSuratJalan: 'SJ/ukur', baris: [{ kode: RM[0], qty: 10 }], ident: STAF }]));
ukur('mulai+selesai pekerjaan (tulis)', () => { const j = P('mulaiPekerjaan', [{ kodeProduk: FG[0], bahanBaku: [{ kode: RM[0], qty: 10 }], ident: STAF }]); return P('selesaikanPekerjaan', [{ id: j.data.id, barangJadi: [{ kode: FG[0], qty: 9 }], scrapKg: 0.5, ident: STAF }]); });
ukur('hitungUlangHpp (semua job)', () => P('hitungUlangHpp', [MGR]), 2);
const k = P('getKonteks', [MGR]); console.log('\n  ukuran balasan getKonteks:', (JSON.stringify(k).length / 1024).toFixed(0), 'KB');
console.log('  proses RSS:', (process.memoryUsage().rss / 1048576).toFixed(0), 'MB');
B.db.close();
