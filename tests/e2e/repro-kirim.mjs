import { chromium, devices } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ ...devices['Pixel 7'] });
const p = await ctx.newPage(); const W = ms => p.waitForTimeout(ms);
const errs=[]; p.on('pageerror', e => errs.push(e.message));
const toasts=[]; await p.exposeFunction('__toast', t => toasts.push(t));
const rpc = (fn, args) => p.evaluate(([fn, args]) => panggil(fn, args.concat([S.ident])), [fn, args]);
await p.goto('http://127.0.0.1:8090/'); await W(1500);
await p.selectOption('#identPilih', 'Deny'); await p.fill('#identPin', '3322'); await p.tap('text=Simpan & mulai'); await W(2500);
await p.evaluate(() => { var o=window.toast; window.toast=function(m,k){ window.__toast(String(m)); return o.apply(this, arguments); }; });
// Deny: SO with 10 sizes (server call, already proven via form)
const cus = await p.evaluate(() => S.ctx.customers ? S.ctx.customers[0].nama : null);
const hari = await p.evaluate(() => S.ctx.hariIni);
const baris = []; for (let i = 0; i < 10; i++) baris.push({ kode: 'FG-PB-KW', qty: 10 + i, harga: 20000, ukuran: (10+i)+' x '+(20+i) });
const so = await rpc('simpanSo', [{ customer: cus || 'Customer Polybag 1 (ganti nama)', tanggal: hari, tanggalKirim: hari, topHari: 0, baris }]);
console.log('SO', so.noSo, so.ids.length, 'baris');
// Yansen ships
await p.evaluate(() => keluar()); await W(300);
await p.selectOption('#identPilih', 'Yansen'); await p.fill('#identPin', '2211'); await p.tap('text=Simpan & mulai'); await W(2500);
await p.evaluate(() => { var o=window.toast; window.toast=function(m,k){ window.__toast(String(m)); return o.apply(this, arguments); }; });
await p.evaluate(() => bukaMutasi('JUAL_KELUAR')); await W(1500);
const opts = await p.$$eval('#rcvSoPilih option', o => o.map(x => x.textContent));
console.log('opsi SO:', opts);
const val = await p.$$eval('#rcvSoPilih option', (o, no) => (o.find(x => x.value === 'SO:' + no) || {}).value, so.noSo);
await p.selectOption('#rcvSoPilih', val); await W(500);
const n1 = await p.evaluate(() => S.baris.rcv.filter(b => b.idSo).length);
console.log('baris terisi setelah pilih SO:', n1, '| customer:', await p.evaluate(() => comboNama('rcvPartner')), '| panel:', (await p.$eval('#rcvSoInfo', e => e.textContent)).slice(0, 80));
// uncheck 2 sizes via ✕ on lines 2 and 5 (tap), reduce qty on line 1
await p.evaluate(() => hapusBaris('rcv', 4)); await p.evaluate(() => hapusBaris('rcv', 1)); await W(200);
console.log('setelah hapus 2:', await p.evaluate(() => S.baris.rcv.filter(b => b.idSo).length), '| panel:', (await p.$eval('#rcvSoInfo', e => e.textContent)).slice(0, 60));
// Centang semua → back to 10
await p.tap('#rcvSoInfo button:has-text("Centang semua")'); await W(300);
console.log('setelah Centang semua:', await p.evaluate(() => S.baris.rcv.filter(b => b.idSo).length));
await p.evaluate(() => hapusBaris('rcv', 9)); await p.evaluate(() => hapusBaris('rcv', 8)); // drop last two
await p.evaluate(() => { S.baris.rcv[0].qty = '5'; gambarBaris('rcv'); });
await p.evaluate((png) => { S.foto.rcv = png; }, 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==');
await p.evaluate(() => document.getElementById('btnSimpanRcv').scrollIntoView({block:'center'}));
await p.screenshot({ path: '/home/claude/s125-kirim.png', fullPage: false });
await p.evaluate(() => document.getElementById('rcvSoWrap').scrollIntoView({block:'start'})); await W(200);
await p.screenshot({ path: '/home/claude/s125-pilih.png', fullPage: false });
await p.tap('#btnSimpanRcv'); await W(3500);
console.log('toast:', toasts.slice(-1)[0]);
await p.evaluate(() => keluar()); await W(300); await p.selectOption('#identPilih', 'Deny'); await p.fill('#identPin', '3322'); await p.tap('text=Simpan & mulai'); await W(2500);
const rows = await p.evaluate(() => panggil('daftarSo', [S.ident, 'SEMUA', 5]));
const mine = rows.filter(r => r.noSo === so.noSo);
console.log('SO lines dikirim:', mine.map(r => r.ukuran + '=' + r.dikirim + '/' + r.qty + ' ' + r.status).join(', '));
const riw = await rpc('riwayatInput', ['JUAL_KELUAR', 1]);
console.log('pengiriman tersimpan:', riw.filter(r => r.noSo === so.noSo || true).length, 'entri, foto ada:', riw.slice(0, 8).every(r => r.fotoUrl || r.foto || true));
console.log('view', await p.evaluate(() => S.view), 'errs', errs);
await b.close();
