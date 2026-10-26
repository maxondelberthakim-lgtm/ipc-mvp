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
const SPV = { nama: 'Manager', pin: '1357' }, STAF = { nama: 'Staff Gudang', pin: '1111' }, BAS = { nama: 'Bastari', pin: '4433' };
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
  const st2 = JSON.parse(E.m.panggil('statusBackup', [BAS], 'sb2'));
  ok('akun tanpa modul MANAJEMEN (Bastari) tidak boleh lihat status backup', !st2.ok && /Manajemen/.test(st2.error), st2);
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
    ok('getKonteks setelah migrasi ok (versi 11.1)', k.ok && k.data.app.versi === '12.4.1', k.error);
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
console.log('— 8. Migrasi v10.1 → v11: kolom Akses, akun modul, entri MENUNGGU difinalkan —');
{
  const K = bukaMesin();
  const ADM8 = { nama: 'Admin', pin: '1234' };
  JSON.parse(K.m.panggil('getKonteks', [ADM8], 'm81'));
  const dump = JSON.parse(JSON.stringify(K.m.eksporSemua()));
  const tgl = K.m.fns.tglStr_(new Date()), now = new Date().toISOString();
  /* bentuk v10.1: pengguna tanpa kolom Akses, akun Manager Produksi / Sales Manager masih aktif */
  dump.Master_Pengguna = [
    ['Email','Nama','Peran','Lokasi','PIN','Aktif'],
    ['', 'Admin', 'ADMIN', 'HQ', '1234', 'YA'],
    ['', 'Manager', 'SUPERVISOR', 'GBJ', '1357', 'YA'],
    ['', 'Manager Produksi', 'SUPERVISOR', 'Produksi', '1122', 'YA'],
    ['', 'Sales Manager', 'SUPERVISOR', 'Sales', '3344', 'YA'],
    ['', 'Staff Gudang', 'STAF', 'GBJ', '1111', 'YA'],
  ];
  const hP = dump.Penerimaan[0];
  const rowP = hP.map(() => ''); const set = (h, r, k, v) => { r[h.indexOf(k)] = v; };
  set(hP, rowP, 'ID', 'RCV-LAMA-1'); set(hP, rowP, 'Waktu', now); set(hP, rowP, 'Tanggal', tgl); set(hP, rowP, 'Jenis', 'MASUK'); set(hP, rowP, 'Supplier', 'PT Sumber Biji Plastik');
  set(hP, rowP, 'Kode_Item', 'RM-BP-KW'); set(hP, rowP, 'Nama_Item', 'Biji Plastik KW'); set(hP, rowP, 'Qty_Kg', 100); set(hP, rowP, 'No_Surat_Jalan', 'SJ/LAMA'); set(hP, rowP, 'Status', 'MENUNGGU'); set(hP, rowP, 'Nama_Pencatat', 'Staff Gudang'); set(hP, rowP, 'Dicatat_Oleh', 'manual:Staff Gudang');
  dump.Penerimaan.push(rowP);
  const hK = dump.Kerusakan[0]; const rowK = hK.map(() => '');
  set(hK, rowK, 'ID', 'DMG-LAMA-1'); set(hK, rowK, 'Waktu', now); set(hK, rowK, 'Tanggal', tgl); set(hK, rowK, 'Lokasi', 'GBJ'); set(hK, rowK, 'Kode_Item', 'RM-BP-KW'); set(hK, rowK, 'Nama_Item', 'Biji Plastik KW');
  set(hK, rowK, 'Qty_Kg', 5); set(hK, rowK, 'Penyebab', 'basah'); set(hK, rowK, 'Status', 'MENUNGGU'); set(hK, rowK, 'Nama_Pencatat', 'Staff Gudang'); set(hK, rowK, 'Dicatat_Oleh', 'manual:Staff Gudang');
  dump.Kerusakan.push(rowK);
  K.db.close();
  const L = bukaMesin(); L.m.imporSemua(dump);
  const users = JSON.parse(L.m.panggil('daftarPengguna', [ADM8], 'm82'));
  ok('Yansen (PO,SO,GUDANG — v12.0.1), Deny (SO), Bastari (PRODUKSI) ditambahkan', users.ok && users.data.some((u) => u.nama === 'Yansen' && u.akses === 'PO,SO,GUDANG') && users.data.some((u) => u.nama === 'Deny' && u.akses === 'SO') && users.data.some((u) => u.nama === 'Bastari' && u.akses === 'PRODUKSI'), users.ok ? users.data.map((u) => u.nama + ':' + u.akses) : users.error);
  ok('Manager Produksi, Sales Manager & Staff Gudang dinonaktifkan (v11.1), Manager tetap semua modul', users.data.find((u) => u.nama === 'Manager Produksi').aktif === false && users.data.find((u) => u.nama === 'Sales Manager').aktif === false && users.data.find((u) => u.nama === 'Staff Gudang').aktif === false && users.data.find((u) => u.nama === 'Manager').modul.PO && users.data.find((u) => u.nama === 'Manager').modul.GUDANG);
  const lama = JSON.parse(L.m.panggil('getKonteks', [{ nama: 'Manager Produksi', pin: '1122' }], 'm83'));
  ok('login akun lama ditolak (nonaktif)', !lama.ok && /dinonaktifkan/.test(lama.error), lama.error);
  const kB = JSON.parse(L.m.panggil('getKonteks', [{ nama: 'Bastari', pin: '4433' }], 'm84'));
  ok('Bastari login: modul PRODUKSI saja, tetap lihat harga', kB.ok && kB.data.modul.PRODUKSI && !kB.data.modul.PO && kB.data.lihatHpp === true, kB.ok ? kB.data.modul : kB.error);
  const rcv = L.m.fns.baca_(L.m.vars.SHEET.PENERIMAAN).find((r) => r.ID === 'RCV-LAMA-1');
  const dmg = L.m.fns.baca_(L.m.vars.SHEET.KERUSAKAN).find((r) => r.ID === 'DMG-LAMA-1');
  ok('entri MENUNGGU lama → DISETUJUI (ditinjau: sistem)', rcv.Status === 'DISETUJUI' && /sistem/.test(rcv.Ditinjau_Oleh) && dmg.Status === 'DISETUJUI' && L.m.fns.angka_(dmg.Nilai_Kerugian) >= 0, [rcv.Status, dmg.Status]);
  const st = JSON.parse(L.m.panggil('laporanStok', [ADM8], 'm85'));
  ok('rusak lama kini dihitung di stok (rusak 5)', st.ok && st.data.daftar.find((x) => x.kode === 'RM-BP-KW').rusak === 5, st.ok ? st.data.daftar.find((x) => x.kode === 'RM-BP-KW') : st.error);
  ok('log MIGRASI_V11 tercatat', L.m.fns.baca_(L.m.vars.SHEET.LOG).some((r) => r.Aksi === 'MIGRASI_V11'));
  const dump2 = JSON.parse(JSON.stringify(L.m.eksporSemua())); L.db.close();
  const Mm = bukaMesin(); Mm.m.imporSemua(dump2);
  const u2 = JSON.parse(Mm.m.panggil('daftarPengguna', [ADM8], 'm86'));
  ok('migrasi idempoten: akun tidak digandakan', u2.ok && u2.data.filter((u) => u.nama === 'Yansen').length === 1 && u2.data.length === 8 && u2.data.find((u) => u.nama === 'Yansen').akses === 'PO,SO,GUDANG', u2.ok ? u2.data.length : u2.error);
  Mm.db.close();
}
console.log('— 9. hapusTransaksiSebelum(tanggal): data uji sebelum go-live dibuang, data sesudahnya + master + foto yang masih dipakai tetap —');
{
  const Z = bukaMesin();
  const ADM = { nama: 'Admin', pin: '1234' }, YS = { nama: 'Yansen', pin: '2211' }, BS = { nama: 'Bastari', pin: '4433' };
  JSON.parse(Z.m.panggil('getKonteks', [ADM], 'z0'));
  const sup = Z.m.vars.DUMMY_SUPPLIER[0][1], KW = 'RM-BP-KW';
  const t = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return Z.m.fns.tglStr_(d); };
  const batas = t(3);
  const po = JSON.parse(Z.m.panggil('simpanPo', [{ supplier: sup, tanggal: t(10), baris: [{ kode: KW, qty: 500, harga: 12000 }] }, YS], 'z1'));
  ok('PO uji (10 hari lalu) dibuat', po.ok, po.error);
  const rcLama = JSON.parse(Z.m.panggil('simpanPenerimaan', [{ jenis: 'BELI_MASUK', supplier: sup, tanggal: t(9), noSuratJalan: 'SJ-LAMA', baris: [{ kode: KW, qty: 500, idPo: po.data.ids[0] }], foto: PNG, ident: YS }], 'z2'));
  ok('penerimaan uji (9 hari lalu, dengan foto) dibuat', rcLama.ok, rcLama.error);
  const rcBaru = JSON.parse(Z.m.panggil('simpanPenerimaan', [{ jenis: 'BELI_MASUK', supplier: sup, tanggal: batas, noSuratJalan: 'SJ-BARU', baris: [{ kode: KW, qty: 100 }], foto: PNG, ident: YS }], 'z3'));
  ok('penerimaan sungguhan (tepat di tanggal batas, dengan foto) dibuat', rcBaru.ok, rcBaru.error);
  const shLama = JSON.parse(Z.m.panggil('simpanLaporanShift', [{ tanggal: t(8), shift: '1', blowing: { operator: 'Sri', ambil: [{ kode: KW, qty: 50 }], hasil: [{ kualitas: 'KW', qty: 48 }] } }, BS], 'z4'));
  const shBaru = JSON.parse(Z.m.panggil('simpanLaporanShift', [{ tanggal: t(1), shift: '1', blowing: { operator: 'Sri', ambil: [{ kode: KW, qty: 40 }], hasil: [{ kualitas: 'KW', qty: 39 }] } }, BS], 'z5'));
  ok('laporan shift lama + baru dibuat', shLama.ok && shBaru.ok, [shLama.error, shBaru.error]);
  const rusak = JSON.parse(Z.m.panggil('simpanKerusakan', [{ tanggal: t(7), kode: KW, qty: 5, penyebab: 'basah', ident: YS }], 'z6'));
  ok('laporan rusak uji dibuat', rusak.ok, rusak.error);
  const fotoSebelum = Z.sql.exec('SELECT COUNT(*) AS n FROM foto').toArray()[0].n;
  const sebelum = JSON.parse(JSON.stringify(Z.m.eksporSemua()));   // salinan — baris asli diubah di tempat
  const nItem = sebelum.Master_Item.length, nUser = sebelum.Master_Pengguna.length, nDetSebelum = sebelum.Laporan_Shift_Detail.length - 1;
  const hasil = Z.m.fns.hapusTransaksiSebelum(batas);
  const foto = Z.m.bersihkanFotoYatim();
  Z.m.simpan();
  const sesudah = Z.m.eksporSemua();
  const baris = (n) => sesudah[n].length - 1;
  ok('ringkasan: penerimaan 1, PO 1, shift 1, rusak 1 dihapus', hasil.dihapus.Penerimaan === 1 && hasil.dihapus.Pesanan_Pembelian === 1 && hasil.dihapus.Laporan_Shift === 1 && hasil.dihapus.Laporan_Shift_Detail >= 1 && hasil.dihapus.Kerusakan === 1, hasil);
  /* DB file dipakai bersama bagian sebelumnya → bandingkan relatif: baris bertanggal ≥ batas tidak berubah, < batas habis */
  const kolT = (n) => sesudah[n][0].indexOf('Tanggal');
  const lamaSisa = (n) => sesudah[n].slice(1).filter((r) => String(r[kolT(n)]).slice(0, 10) < batas).length;
  const baruSebelum = (n) => sebelum[n].slice(1).filter((r) => String(r[kolT(n)]).slice(0, 10) >= batas).length;
  const baruSesudah = (n) => sesudah[n].slice(1).filter((r) => String(r[kolT(n)]).slice(0, 10) >= batas).length;
  const sheets = ['Penerimaan', 'Pengiriman', 'Laporan_Shift', 'Pesanan_Pembelian', 'Kerusakan', 'Sales_Order', 'Invoice', 'Stock_Opname', 'Daur_Ulang'];
  ok('tidak ada lagi baris bertanggal < batas di sheet transaksi', sheets.every((n) => lamaSisa(n) === 0), sheets.map((n) => n + ':' + lamaSisa(n)));
  ok('baris bertanggal ≥ batas utuh (penerimaan batas + shift baru)', sheets.every((n) => baruSesudah(n) === baruSebelum(n)) && baruSesudah('Penerimaan') >= 1 && baruSesudah('Laporan_Shift') >= 1, sheets.map((n) => n + ':' + baruSebelum(n) + '→' + baruSesudah(n)));
  const idShift = new Set(sesudah.Laporan_Shift.slice(1).map((r) => r[0]));
  ok('detail shift hanya milik laporan yang tersisa (detail lama ikut terhapus)', sesudah.Laporan_Shift_Detail.slice(1).every((r) => idShift.has(r[1])) && sesudah.Laporan_Shift_Detail.length < sebelum.Laporan_Shift_Detail.length, [sebelum.Laporan_Shift_Detail.length, sesudah.Laporan_Shift_Detail.length]);
  ok('master item & pengguna tidak disentuh', baris('Master_Item') + 1 === nItem && baris('Master_Pengguna') + 1 === nUser);
  const iFoto = sesudah.Penerimaan[0].indexOf('Foto_ID');
  const fotoDipakai = new Set(sesudah.Penerimaan.slice(1).map((r) => String(r[iFoto])).filter(Boolean));
  const fotoDb = Z.sql.exec('SELECT id FROM foto').toArray().map((r) => String(r.id));
  ok('foto yatim dihapus (≥1), semua foto tersisa masih dirujuk penerimaan', foto.dihapus >= 1 && fotoDb.length === fotoDipakai.size && fotoDb.every((id) => fotoDipakai.has(id)), [fotoSebelum, foto, fotoDb.length, fotoDipakai.size]);
  const log = sesudah.Log_Audit.slice(1).filter((r) => r[2] === 'HAPUS_DATA_UJI');
  ok('log HAPUS_DATA_UJI tercatat', log.length === 1 && String(log[0][3]) === batas, log[0]);
  const stok = JSON.parse(Z.m.panggil('laporanStok', [ADM], 'z7'));
  ok('laporanStok masih jalan setelah penghapusan', stok.ok, stok.error);
  const ulang = Z.m.fns.hapusTransaksiSebelum(batas);
  ok('diulang → 0 baris (idempoten)', ulang.total === 0, ulang);
  const tolak = JSON.parse(Z.m.panggil('hapusTransaksiSebelum', [batas], 'z8'));
  ok('tidak bisa dipanggil dari aplikasi (bukan daftar putih RPC)', !tolak.ok && /tidak dikenal/.test(tolak.error), tolak);
  Z.db.close();
}
console.log('\n— 10. v12.4: panggilan gagal di tengah → rollback (tidak ada SO/PO setengah jadi) —');
{
  const R = bukaMesin();
  const ADM = { nama: 'Admin', pin: '1234' }, DN = { nama: 'Deny', pin: '3322' };
  JSON.parse(R.m.panggil('getKonteks', [ADM], 'r0'));
  const cus = R.m.vars.DUMMY_CUSTOMER[0][1], hari = R.m.fns.tglStr_(new Date());
  const sebelum = R.m.fns.baca_(R.m.vars.SHEET.SO).length, logSebelum = R.m.fns.baca_(R.m.vars.SHEET.LOG).length;
  const baris = []; for (let i = 0; i < 18; i++) baris.push({ kode: 'FG-PB-KW', qty: 25 + i, harga: i === 7 ? '' : 20000, ukuran: (10 + i) + ' x ' + (20 + i) });
  const g = JSON.parse(R.m.panggil('simpanSo', [{ customer: cus, tanggal: hari, tanggalKirim: hari, topHari: 0, baris }, DN], 'r1'));
  ok('SO 18 baris dengan baris #8 tanpa harga → ditolak, pesan menyebut "Baris #8"', !g.ok && /Baris #8/.test(g.error), g.error);
  ok('TIDAK ada baris SO yang tersisa di memori (rollback)', R.m.fns.baca_(R.m.vars.SHEET.SO).length === sebelum, R.m.fns.baca_(R.m.vars.SHEET.SO).length);
  ok('log audit juga tidak bertambah', R.m.fns.baca_(R.m.vars.SHEET.LOG).length === logSebelum);
  baris[7].harga = 20000;
  const okSo = JSON.parse(R.m.panggil('simpanSo', [{ customer: cus, tanggal: hari, tanggalKirim: hari, topHari: 0, baris }, DN], 'r2'));
  ok('setelah diperbaiki: SO 18 baris tersimpan sekaligus', okSo.ok && okSo.data.ids.length === 18 && R.m.fns.baca_(R.m.vars.SHEET.SO).filter((r) => r.No_SO === okSo.data.noSo).length === 18, okSo.error);
  /* mesin baru dari SQLite yang sama → 18 baris tetap ada, tidak ada sisa dari percobaan gagal */
  const R2 = bukaMesin();
  const rows = R2.m.fns.baca_(R2.m.vars.SHEET.SO);
  ok('dibuka ulang dari SQLite: 18 baris SO itu ada, total baris = sebelum + 18', rows.filter((r) => r.No_SO === okSo.data.noSo).length === 18 && rows.length === sebelum + 18, [rows.length, sebelum]);
  const gp = JSON.parse(R2.m.panggil('simpanPo', [{ supplier: R2.m.vars.DUMMY_SUPPLIER[0][1], baris: [{ kode: 'RM-BP-KW', qty: 10, harga: 1 }, { kode: 'RM-BP-KW', qty: 0, harga: 1 }] }, { nama: 'Yansen', pin: '2211' }], 'r3'));
  ok('PO dengan baris #2 qty 0 → ditolak dengan nomor baris, tidak ada PO setengah jadi', !gp.ok && /Baris #2/.test(gp.error) && !R2.m.fns.baca_(R2.m.vars.SHEET.PO).some((r) => r.Qty_Kg === 10 && r.Harga_Per_Kg === 1), gp.error);
  /* fungsi yang MENULIS lalu baru gagal di baris berikutnya (simpanPengiriman: baris 1 ditulis, baris 2 'Item tidak dikenal') → mesin membuang tulisan baris 1 */
  const kirimSebelum = R2.m.fns.baca_(R2.m.vars.SHEET.PENGIRIMAN).length;
  const gk = JSON.parse(R2.m.panggil('simpanPengiriman', [{ jenis: 'KELUAR', customer: cus, baris: [{ kode: 'FG-PB-KW', qty: 1 }, { kode: 'XX-TIDAK-ADA', qty: 1 }], ident: { nama: 'Yansen', pin: '2211' } }], 'r4'));
  ok('pengiriman: baris 1 sudah ditulis lalu baris 2 gagal → ditolak DAN baris 1 ikut dibuang (rollback mesin)', !gk.ok && /tidak dikenal/.test(gk.error) && R2.m.fns.baca_(R2.m.vars.SHEET.PENGIRIMAN).length === kirimSebelum, [gk.error, R2.m.fns.baca_(R2.m.vars.SHEET.PENGIRIMAN).length, kirimSebelum]);
  const R3 = bukaMesin();
  ok('dibuka ulang: SQLite juga tidak menyimpan baris 1 yang gagal', R3.m.fns.baca_(R3.m.vars.SHEET.PENGIRIMAN).length === kirimSebelum);
  R.db.close(); R2.db.close(); R3.db.close();
}
try { fs.unlinkSync(file); } catch (e) {}
console.log('\n================ ' + pass + ' lulus, ' + fail + ' gagal ================');
process.exit(fail ? 1 : 0);
