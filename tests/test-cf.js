/* Tes lapisan Cloudflare: penyimpanan SQLite (potongan), muat ulang setelah hibernasi,
   dispatcher panggil() (= doPost), foto → R2 tertunda, ekspor/impor, backup. */
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const H = require('./harness-cf.js');
let pass = 0, fail = 0;
const ok = (l, c, e) => { c ? (pass++, console.log('  ✓', l)) : (fail++, console.log('  ✗', l, e === undefined ? '' : JSON.stringify(e))); };

const file = path.join(require('os').tmpdir(), 'ipc-cf-test-' + Date.now() + '.db');
function bukaMesin() {
  const db = new DatabaseSync(file);
  const sql = { exec(q, ...p) { const st = db.prepare(q); if (/^\s*(SELECT|PRAGMA)/i.test(q)) { const rows = st.all(...p); return { toArray: () => rows }; } st.run(...p); return { toArray: () => [] }; } };
  const M = H.muatEsm(path.join(__dirname, '..', 'cloudflare', 'src', 'mesin.js'));
  return { db, sql, m: new M.Mesin({ sql, asalFoto: 'https://api.test' }) };
}
const SPV = { nama: 'Manager', pin: '1357' }, STAF = { nama: 'Staff Gudang', pin: '1111' };
const PNG = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';

console.log('— 1. Setup awal di DB kosong → skema + master bawaan (DUMMY_* Config.gs) —');
let A = bukaMesin();
{
  const k = JSON.parse(A.m.panggil('getKonteks', [SPV], 'k1'));
  ok('getKonteks ok lewat panggil()', k.ok && k.data.items.length > 0 && k.data.user.peran === 'SUPERVISOR', k.error);
  ok('skema versi tersimpan di meta', A.m.props.get('SKEMA_VERSI') === A.m.vars.APP.versi, A.m.props.get('SKEMA_VERSI'));
  const n = A.sql.exec('SELECT COUNT(*) AS n FROM chunk').toArray()[0].n;
  ok('semua sheet tersimpan sebagai potongan', n >= Object.keys(A.m.vars.SHEET).length, n);
  const bad = JSON.parse(A.m.panggil('hitungFifo_', [], 'x'));
  ok('fungsi di luar daftar putih ditolak', !bad.ok && /tidak dikenal/.test(bad.error), bad);
  const bad2 = JSON.parse(A.m.panggil('getKonteks', [{ nama: 'Manager', pin: '0000' }], 'x2'));
  ok('PIN salah → error rapi (bukan crash)', !bad2.ok && bad2.error, bad2);
}

console.log('— 2. Transaksi + foto → potongan berubah, foto ke SQLite —');
let idRcv = '';
{
  const item = A.m.vars.DUMMY_ITEM[0][0], sup = A.m.vars.DUMMY_SUPPLIER[0][1];
  const r = JSON.parse(A.m.panggil('simpanPenerimaan', [{ jenis: 'BELI_MASUK', supplier: sup, baris: [{ kode: item, qty: 120 }], noSuratJalan: 'SJ-1', foto: PNG, ident: SPV }], 'rcv-1'));
  ok('simpanPenerimaan ok', r.ok, r.error);
  idRcv = r.data && (r.data.id || (r.data.ids && r.data.ids[0])) || '';
  const nF = A.sql.exec('SELECT COUNT(*) AS n FROM foto').toArray()[0].n;
  ok('foto tersimpan di tabel foto SQLite', nF === 1, nF);
  const rows = A.m.SS.sheets['Penerimaan'].rows;
  const iF = A.m.vars.HEADER['Penerimaan'].indexOf('Foto_URL');
  ok('URL foto = asal + /foto/<id>.jpg', /^https:\/\/api\.test\/foto\/[a-z0-9]+\.jpg$/.test(rows[1][iF]), rows[1][iF]);
  const idF = /foto\/([a-z0-9]+)\.jpg$/.exec(rows[1][iF])[1], f = A.m.ambilFoto(idF);
  ok('ambilFoto mengembalikan bytes JPEG', f && f.mime === 'image/jpeg' && f.data instanceof Uint8Array && f.data[0] === 0xFF && f.data[1] === 0xD8, f && [f.mime, f.data.length]);
  ok('foto tidak ada → null', A.m.ambilFoto('xyz') === null);
  const r2 = JSON.parse(A.m.panggil('simpanPenerimaan', [{ jenis: 'BELI_MASUK', supplier: sup, baris: [{ kode: item, qty: 120 }], noSuratJalan: 'SJ-1', foto: PNG, ident: SPV }], 'rcv-1'));
  ok('idKlien sama → balasan dari cache idem, tidak dobel', JSON.stringify(r2) === JSON.stringify(r) && A.m.SS.sheets['Penerimaan'].rows.length === 2, A.m.SS.sheets['Penerimaan'].rows.length);
  ok('cache idem tersimpan di SQLite', A.sql.exec("SELECT COUNT(*) AS n FROM idem WHERE id='rq:rcv-1'").toArray()[0].n === 1);
}

console.log('— 3. Muat ulang (hibernasi DO) → data identik termasuk Date —');
const snapshot = JSON.stringify(A.m.eksporSemua(), (k, v) => v);
A.db.close();
let B = bukaMesin();
{
  const s1 = JSON.parse(snapshot), s2 = B.m.eksporSemua(); const beda = [];
  Object.keys(s1).forEach((n) => { if (JSON.stringify(s1[n]) !== JSON.stringify(s2[n])) beda.push(n + ': ' + JSON.stringify(s1[n]).slice(0, 200) + ' VS ' + JSON.stringify(s2[n]).slice(0, 200)); });
  ok('semua sheet & baris sama persis setelah muat ulang', !beda.length, beda);
  const w = B.m.SS.sheets['Penerimaan'].rows[1][B.m.vars.HEADER['Penerimaan'].indexOf('Waktu')];
  ok('kolom Waktu kembali sebagai Date', Object.prototype.toString.call(w) === '[object Date]' && !isNaN(w.getTime()), w);
  const s = JSON.parse(B.m.panggil('laporanStok', [SPV], 'ls1'));
  const it = s.data.daftar.find(x => x.kode === B.m.vars.DUMMY_ITEM[0][0]);
  ok('stok setelah muat ulang = 120 (gbj)', it && it.gbj === 120, it);
  const r3 = JSON.parse(B.m.panggil('simpanPenerimaan', [{ jenis: 'BELI_MASUK', supplier: 'x', baris: [{ kode: 'RM-X', qty: 1 }], noSuratJalan: 'SJ-X', ident: SPV }], 'rcv-1'));
  ok('idem cache bertahan setelah muat ulang', r3.ok && B.m.SS.sheets['Penerimaan'].rows.length === 2);
}

console.log('— 4. Potongan: >64 baris, hapus baris, migrasi & impor —');
{
  const item = B.m.vars.DUMMY_ITEM[0][0], sup = B.m.vars.DUMMY_SUPPLIER[0][1];
  for (let i = 0; i < 70; i++) B.m.panggil('simpanPenerimaan', [{ jenis: 'BELI_MASUK', supplier: sup, baris: [{ kode: item, qty: 1 }], noSuratJalan: 'SJ-B', ident: SPV }], 'bulk-' + i);
  const nChunk = B.sql.exec("SELECT COUNT(*) AS n FROM chunk WHERE sheet='Penerimaan'").toArray()[0].n;
  ok('Penerimaan 72 baris → 2 potongan', B.m.SS.sheets['Penerimaan'].rows.length === 72 && nChunk === 2, [B.m.SS.sheets['Penerimaan'].rows.length, nChunk]);
  const sebelum = JSON.stringify(B.m.eksporSemua(), (k, v) => v);
  B.db.close(); const C = bukaMesin();
  ok('72 baris utuh setelah muat ulang', JSON.stringify(C.m.eksporSemua(), (k, v) => v) === sebelum);
  /* hapus SKU (deleteRow) → potongan ditulis ulang */
  const kodeBaru = JSON.parse(C.m.panggil('tambahMaster', ['item', { nama: 'Uji Hapus', kategori: 'BAHAN_BAKU' }, SPV], 'tm1'));
  ok('tambahMaster ok', kodeBaru.ok && kodeBaru.data.kode, kodeBaru);
  const nItem = C.m.SS.sheets['Master_Item'].rows.length;
  const h = JSON.parse(C.m.panggil('hapusSku', [kodeBaru.data.kode, SPV], 'hs1'));
  ok('hapusSku ok, baris berkurang', h.ok && C.m.SS.sheets['Master_Item'].rows.length === nItem - 1, h);
  C.db.close(); const D = bukaMesin();
  ok('Master_Item setelah hapus + muat ulang konsisten', D.m.SS.sheets['Master_Item'].rows.length === nItem - 1 && !D.m.SS.sheets['Master_Item'].rows.some(r => r[0] === kodeBaru.data.kode));
  /* impor seluruh DB (dari Google Sheet lama) */
  const data = D.m.eksporSemua();
  data['Penerimaan'] = data['Penerimaan'].slice(0, 3);
  const im = D.m.imporSemua(JSON.parse(JSON.stringify(data)));
  ok('imporSemua mengganti isi & menjalankan pastikanSkema_', D.m.SS.sheets['Penerimaan'].rows.length === 3 && im.some(x => /^Penerimaan:2$/.test(x)), im);
  D.db.close(); const E = bukaMesin();
  ok('hasil impor bertahan setelah muat ulang', E.m.SS.sheets['Penerimaan'].rows.length === 3);
  /* Tanggal string tetap string (tidak jadi Date) */
  const iT = E.m.vars.HEADER['Penerimaan'].indexOf('Tanggal');
  ok('kolom Tanggal tersimpan sebagai string YYYY-MM-DD', /^\d{4}-\d{2}-\d{2}$/.test(E.m.SS.sheets['Penerimaan'].rows[1][iT]), E.m.SS.sheets['Penerimaan'].rows[1][iT]);
  const st = JSON.parse(E.m.panggil('statusBackup', [SPV], 'sb1'));
  ok('statusBackup (versi R2) ok', st.ok && st.data.simpan === 30 && st.data.terpasang === true, st);
  const st2 = JSON.parse(E.m.panggil('statusBackup', [STAF], 'sb2'));
  ok('staf tidak boleh lihat status backup', !st2.ok && /Supervisor/.test(st2.error), st2);
  E.db.close();
}

console.log('— 5. Zona waktu Asia/Jakarta di Utilities.formatDate (Worker berjalan UTC) —');
{
  const F = bukaMesin();
  const d = new Date(Date.UTC(2026, 8, 23, 20, 30, 5));   // 23 Sep 20:30 UTC = 24 Sep 03:30 WIB
  ok('yyyy-MM-dd HH:mm dalam WIB', F.m.G.Utilities.formatDate(d, 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss') === '2026-09-24 03:30:05', F.m.G.Utilities.formatDate(d, 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss'));
  ok('Z = +0700', F.m.G.Utilities.formatDate(d, 'Asia/Jakarta', 'Z') === '+0700');
  ok('dd MMM HH:mm', F.m.G.Utilities.formatDate(d, 'Asia/Jakarta', 'dd MMM HH:mm') === '24 Sep 03:30');
  ok('yyMMdd-HHmmss (untuk ID)', F.m.G.Utilities.formatDate(d, 'Asia/Jakarta', 'yyMMdd-HHmmss') === '260924-033005');
  ok('tglStr_ memakai zona aplikasi', F.m.fns.tglStr_(d) === '2026-09-24');
  F.db.close();
}
console.log('— 6. Migrasi v9 → v10 di atas data sungguhan (cloudflare/ipc-live.json, kalau ada) —');
{
  const live = path.join(__dirname, '..', 'cloudflare', 'ipc-live.json');
  if (!fs.existsSync(live)) console.log('  (dilewati: ipc-live.json tidak ada)');
  else {
    const G6 = bukaMesin();
    const data = JSON.parse(fs.readFileSync(live, 'utf8'));
    const hasil = G6.m.imporSemua(data);
    ok('impor data v9 jalan', hasil.some((x) => /^Master_Item:/.test(x)), hasil);
    const ADM6 = { nama: 'Admin', pin: String(data.Master_Pengguna.find((r) => r[1] === 'Admin')[4]) };
    const k = JSON.parse(G6.m.panggil('getKonteks', [ADM6], 'mig-1'));
    ok('getKonteks setelah migrasi ok (versi 10.1)', k.ok && k.data.app.versi === '10.1.0', k.error);
    ok('peta kualitas lengkap (roll/polybag/BS ditambahkan)', k.data.kualitas.length === 3 && k.data.kualitas.every((q) => q.biji && q.roll && q.jadi && q.bs), k.data.kualitas);
    ok('RM-BS-* lama dinonaktifkan, SCR-BS-* aktif', !k.data.items.some((i) => /^RM-BS-/.test(i.kode)) && k.data.items.some((i) => i.kode === 'SCR-BS-KW' && i.kategori === 'SCRAP'));
    ok('item lama (FG-PB-HP, RM-BIJI-PLASTIK-DAUR-UL) tetap ada', k.data.items.some((i) => i.kode === 'FG-PB-HP') && k.data.items.some((i) => i.kode === 'RM-BIJI-PLASTIK-DAUR-UL'));
    ok('sheet Pekerjaan diarsipkan, Laporan_Shift dibuat', !G6.m.SS.sheets['Pekerjaan'] && !!G6.m.SS.sheets['Pekerjaan_lama'] && !!G6.m.SS.sheets['Laporan_Shift'] && !!G6.m.SS.sheets['Tutup_Bulan']);
    const pengguna = JSON.parse(G6.m.panggil('daftarPengguna', [ADM6], 'mig-2'));
    ok('akun Manager Produksi & Sales Manager ditambahkan', pengguna.ok && pengguna.data.some((u) => u.nama === 'Manager Produksi') && pengguna.data.some((u) => u.nama === 'Sales Manager'), pengguna.error);
    ok('METODE_HPP FIFO → RATA', G6.m.fns.getSetting_('METODE_HPP') === 'RATA');
    const stok = JSON.parse(G6.m.panggil('laporanStok', [ADM6], 'mig-3'));
    ok('laporan stok jalan (data lama pekerjaan tidak dihitung, tidak error)', stok.ok && stok.data.daftar.length >= 0, stok.error);
    const nilai = JSON.parse(G6.m.panggil('laporanNilaiStok', [ADM6], 'mig-4'));
    ok('nilai stok rata-rata jalan di data lama', nilai.ok && nilai.data.metode === 'RATA', nilai.error);
    const bulanLalu = G6.m.fns.bulanSebelum_(G6.m.fns.tglStr_(new Date()).slice(0, 7));
    const lb = JSON.parse(G6.m.panggil('laporanBulanan', [bulanLalu, ADM6], 'mig-5'));
    ok('laporan bulanan jalan di data lama', lb.ok && typeof lb.data.cogs === 'number', lb.error);
    const cfg = JSON.parse(G6.m.panggil('konfigurasiShift', [ADM6], 'mig-6'));
    ok('konfigurasi shift: tidak ada SKU yang kurang', cfg.ok && cfg.data.kurang.length === 0, cfg.ok ? cfg.data.kurang : cfg.error);
    const sh = JSON.parse(G6.m.panggil('simpanLaporanShift', [{ shift: '1', blowing: { operator: 'Operator Uji', ambil: [{ kode: 'RM-BP-KW', qty: 1 }], hasil: [{ kualitas: 'KW', qty: 0.9 }] } }, ADM6], 'mig-7'));
    ok('laporan shift bisa disimpan di data hasil migrasi', sh.ok && /^SHF-/.test(sh.data.id), sh.error);
    const eks = JSON.parse(G6.m.panggil('eksporBulanan', [G6.m.fns.tglStr_(new Date()).slice(0, 7), ADM6], 'mig-8'));
    ok('ekspor bulanan jalan', eks.ok && eks.data.files.length === 7, eks.error);
    G6.db.close();
  }
}
console.log('— 7. Migrasi v10 → v10.1: laporan shift per mesin digabung per tanggal+shift, operator terpisah —');
{
  const H = bukaMesin();
  const ADM7 = { nama: 'Admin', pin: '1234' };
  JSON.parse(H.m.panggil('getKonteks', [ADM7], 'm71'));
  const dump = JSON.parse(JSON.stringify(H.m.eksporSemua()));
  const tgl = H.m.fns.tglStr_(new Date()), now = new Date().toISOString();
  /* bentuk v10: satu baris per mesin, kolom Mesin/Operator/Total_Hasil_Kg/Total_BS_Kg, detail tanpa Mesin */
  dump.Laporan_Shift = [
    ['ID','Waktu','Tanggal','Shift','Mesin','Operator','Total_Ambil_Kg','Total_Roll_Pakai_Kg','Total_Hasil_Kg','Total_BS_Kg','Dicatat_Oleh','Nama_Pencatat','Foto_URL','Catatan','Log_Edit','Status'],
    ['SHF-A', now, tgl, '1', 'BLOWING', 'Sri, Budi', 250, 0, 240, 20, 'Admin', 'Admin', '', 'blowing lancar', '', 'AKTIF'],
    ['SHF-B', now, tgl, '1', 'CUTTING', 'Rina', 0, 240, 235, 5, 'Admin', 'Admin', '', '', '', 'AKTIF'],
    ['SHF-C', now, tgl, '3', 'BLOWING', 'Yanto', 10, 0, 9, 0, 'Admin', 'Admin', '', '', '', 'DIBATALKAN'],
  ];
  dump.Laporan_Shift_Detail = [
    ['ID','ID_Shift','Jenis','Kode_Item','Nama_Item','Kualitas','Qty_Kg','Waktu'],
    ['SDT-1', 'SHF-A', 'AMBIL', 'RM-BP-KW', 'Biji Plastik KW', 'KW', 250, now],
    ['SDT-2', 'SHF-A', 'HASIL', 'WIP-ROLL-KW', 'Roll KW', 'KW', 240, now],
    ['SDT-3', 'SHF-A', 'BS', 'SCR-BS-KW', 'BS KW', 'KW', 20, now],
    ['SDT-4', 'SHF-B', 'PAKAI_ROLL', 'WIP-ROLL-KW', 'Roll KW', 'KW', 240, now],
    ['SDT-5', 'SHF-B', 'HASIL', 'FG-PB-KW', 'Polybag KW', 'KW', 235, now],
    ['SDT-6', 'SHF-B', 'BS', 'SCR-BS-KW', 'BS KW', 'KW', 5, now],
    ['SDT-7', 'SHF-C', 'AMBIL', 'RM-BP-KW', 'Biji Plastik KW', 'KW', 10, now],
  ];
  H.db.close();
  const I = bukaMesin();
  I.m.imporSemua(dump);
  ok('sheet lama diarsipkan (Laporan_Shift_lama), sheet baru berkepala v10.1', !!I.m.SS.sheets['Laporan_Shift_lama'] && !!I.m.SS.sheets['Laporan_Shift_Detail_lama'] && I.m.SS.sheets['Laporan_Shift'].rows[0].indexOf('Operator_Blowing') >= 0 && I.m.SS.sheets['Laporan_Shift'].rows[0].indexOf('Mesin') < 0);
  const d = JSON.parse(I.m.panggil('daftarLaporanShift', [ADM7, 7], 'm72'));
  ok('2 laporan v10 (blowing + cutting, shift 1) → 1 laporan v10.1; yang dibatalkan tidak ikut', d.ok && d.data.length === 1 && d.data[0].shift === '1', d.ok ? d.data.map((x) => x.shift) : d.error);
  const g = d.data[0];
  ok('operator terpisah: blowing Sri+Budi, cutting Rina', g.blowing.operator.join(',') === 'Sri,Budi' && g.cutting.operator.join(',') === 'Rina', [g.blowing.operator, g.cutting.operator]);
  ok('angka per mesin: ambil 250, roll 240, BS blowing 20; roll dipakai 240, polybag 235, BS cutting 5', g.blowing.totalAmbil === 250 && g.blowing.totalHasil === 240 && g.blowing.totalBs === 20 && g.cutting.totalRoll === 240 && g.cutting.totalHasil === 235 && g.cutting.totalBs === 5, g);
  ok('detail dibawa dengan kolom Mesin (3 blowing + 3 cutting), catatan ikut', g.blowing.ambil.length === 1 && g.blowing.hasil.length === 1 && g.cutting.rollPakai.length === 1 && g.cutting.hasil.length === 1 && g.catatan === 'blowing lancar');
  const st = JSON.parse(I.m.panggil('laporanStok', [ADM7], 'm73'));
  ok('stok setelah migrasi: roll KW 240 − 240 = 0, polybag 235, BS 25', st.ok && st.data.daftar.find((x) => x.kode === 'WIP-ROLL-KW').gbj === 0 && st.data.daftar.find((x) => x.kode === 'FG-PB-KW').gbj === 235 && st.data.daftar.find((x) => x.kode === 'SCR-BS-KW').gbj === 25, st.ok ? st.data.daftar.filter((x) => /KW$/.test(x.kode)) : st.error);
  ok('log MIGRASI_V10_1 tercatat', I.m.fns.baca_(I.m.vars.SHEET.LOG).some((r) => r.Aksi === 'MIGRASI_V10_1'));
  /* impor ulang data yang sudah v10.1 → tidak digandakan */
  const dump2 = JSON.parse(JSON.stringify(I.m.eksporSemua()));
  I.db.close();
  const J = bukaMesin(); J.m.imporSemua(dump2);
  const d2 = JSON.parse(J.m.panggil('daftarLaporanShift', [ADM7, 7], 'm74'));
  ok('migrasi idempoten: impor ulang tetap 1 laporan, tidak ada _lama2', d2.ok && d2.data.length === 1 && !J.m.SS.sheets['Laporan_Shift_lama2'], d2.ok ? d2.data.length : d2.error);
  J.db.close();
}
try { fs.unlinkSync(file); } catch (e) {}
console.log('\n================ ' + pass + ' lulus, ' + fail + ' gagal ================');
process.exit(fail ? 1 : 0);
