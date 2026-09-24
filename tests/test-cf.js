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
try { fs.unlinkSync(file); } catch (e) {}
console.log('\n================ ' + pass + ' lulus, ' + fail + ' gagal ================');
process.exit(fail ? 1 : 0);
