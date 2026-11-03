/* E2E v11.1: PWA asli (docs/app, API → wrangler dev) → Worker lokal → Durable Object SQLite.
   Alur v11 (revamp akses, tanpa review): Yansen (PO) buat PO; staf terima barang → langsung final (tidak ada antrian);
   Bastari (PRODUKSI) isi laporan shift 2 mesin + opname produksi; Deny (SO) buat SO; staf kirim sesuai SO;
   staf lapor rusak → stok langsung turun; Manager batalkan laporan rusak; daur ulang; Admin rekonsiliasi;
   akses per modul ditegakkan di UI & server; staf tidak melihat Rp. Cek error console. */
/* Lingkungan lewat env — default = sandbox lama (/home/claude, /opt/pw-browsers). Di Mac semua diisi run-e2e-mac.sh (README → Mac):
   PW_DIR folder berisi node_modules/playwright atau playwright-core (default: cari dari folder skrip ini) · E2E_BROWSER chromium|webkit
   CHROME_PATH (chromium) · E2E_REDUCED_MOTION=1 → reducedMotion 'reduce' · APP_URL (default http://127.0.0.1:8090/)
   H2P_JS html2pdf.bundle.min.js lokal · E2E_OUT folder screenshot · E2E_TIMEOUT_S (default 600).
   Peramban & fetch Node hanya boleh ke 127.0.0.1/localhost: host lain lewat proxy mati (gagal), dicatat di akhir. */
import { createRequire } from 'module';
const ENV = process.env;
const need = createRequire(ENV.PW_DIR ? ENV.PW_DIR.replace(/\/*$/, '/') : import.meta.url);
const pw = (() => { try { return need('playwright'); } catch (e) { return need('playwright-core'); } })();
const APP = ENV.APP_URL || 'http://127.0.0.1:8090/';
const BROWSER = (ENV.E2E_BROWSER || 'chromium').toLowerCase();
const RM = /^(1|true|ya|reduce)$/i.test(ENV.E2E_REDUCED_MOTION || '');
const H2P = ENV.H2P_JS || '/home/claude/h2p/node_modules/html2pdf.js/dist/html2pdf.bundle.min.js';
const OUT = ENV.E2E_OUT || '/home/claude';
const LOKAL = /^(https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)|data:|blob:|about:)/;
setTimeout(() => { console.log('\nTIMEOUT: e2e > ' + (+ENV.E2E_TIMEOUT_S || 600) + ' dtk'); process.exit(3); }, 1000 * (+ENV.E2E_TIMEOUT_S || 600)).unref();
{ const f0 = globalThis.fetch; globalThis.fetch = (u, o) => LOKAL.test(String(u)) ? f0(u, o) : Promise.reject(new Error('E2E: fetch ke luar 127.0.0.1 diblok: ' + u)); }
const b = await pw[BROWSER].launch({ ...(BROWSER === 'chromium' ? { executablePath: ENV.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' } : {}),
  proxy: { server: 'http://127.0.0.1:9', bypass: '127.0.0.1,localhost' } });
const CTX_EKSTRA = RM ? { reducedMotion: 'reduce' } : {};
const p = await b.newPage({ viewport: { width: 420, height: 940 }, deviceScaleFactor: 2, ...CTX_EKSTRA });
console.log('peramban:', BROWSER, b.version(), RM ? '· reducedMotion=reduce' : '', '· app', APP);
const errs = [], luar = new Set(); p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
p.on('console', m => { if (m.type() !== 'error') return; const lu = (m.location() || {}).url || ''; if (lu && !LOKAL.test(lu)) { luar.add(lu); return; } errs.push('CONSOLE: ' + m.text()); });
p.on('requestfailed', r => { if (!LOKAL.test(r.url())) luar.add(r.url()); });
const api = [], mulai = new Map(); p.on('request', r => { if (r.url().includes('8787/exec')) mulai.set(r, Date.now()); });
p.on('response', r => { const q = r.request(); if (mulai.has(q)) { api.push({ fn: JSON.parse(q.postData()).fn, ms: Date.now() - mulai.get(q), status: r.status() }); mulai.delete(q); } });
const W = ms => p.waitForTimeout(ms);
const toasts = []; await p.exposeFunction('__toast', t => toasts.push(t));
let nativeDialog = 0, nativeDialogSebelum = 0; p.on('dialog', d => { nativeDialog++; d.accept('uji e2e'); });
/* v12.10: lembar dialog di dalam app — dijawab otomatis seperti dulu (kecuali window.__dlgManual) */
await p.addInitScript(() => { new MutationObserver(() => { const w = document.getElementById('dlgWrap'); if (!w || w.classList.contains('hide') || w.dataset.e2e || window.__dlgManual) return; w.dataset.e2e = '1'; setTimeout(() => { const i = document.getElementById('dlgInput'); if (i && !i.classList.contains('hide')) i.value = 'uji e2e'; document.getElementById('dlgOk').click(); delete w.dataset.e2e; }, 60); }).observe(document, { subtree: true, attributes: true, attributeFilter: ['class'] }); });
const SUF = ' ' + Date.now().toString(36).slice(-4);
const PNG = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';
let pass = 0, fail = 0; const ok = (l, c, e) => { c ? (pass++, console.log('  ✓', l)) : (fail++, console.log('  ✗', l, e === undefined ? '' : JSON.stringify(e))); };
async function login(nama, pin) { await p.evaluate(() => keluar()); await W(300); await p.selectOption('#identPilih', nama); await p.fill('#identPin', pin); await p.click('text=Simpan & mulai'); await p.waitForFunction((n) => S.ctx && S.ctx.user && S.ctx.user.nama === n, nama, { timeout: 15000 }); await W(600); return p.$eval('#hdrUser', e => e.textContent); }
const T = async (sel) => (await p.$eval(sel, e => e.textContent)).replace(/\s+/g, ' ').trim();
const hidden = (sel) => p.$eval(sel, e => e.classList.contains('hide'));
const rpc = (fn, args) => p.evaluate(([fn, args]) => panggil(fn, args.concat([S.ident])).then(r => ({ ok: true, r }), e => ({ ok: false, e: e.message })), [fn, args]);

await p.goto(APP); await W(1500);
console.log('prefers-reduced-motion: reduce →', await p.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches));
await p.evaluate(() => { const o = window.toast; window.toast = (m, j) => { window.__toast(m); o(m, j); }; });
ok('app terbuka & konteks awal dimuat dari Worker', await p.evaluate(() => !!(S && typeof panggil === 'function')));
ok('tidak ada tab Review / tile menunggu di DOM', !(await p.$('#nav-review')) && !(await p.$('#v-review')) && !(await p.$('#sQueue')));

/* ---- Yansen: hanya PO ---- */
ok('login Yansen (SUPERVISOR, modul PO)', /Yansen/.test(await login('Yansen', '2211')));
ok('Yansen (PO + SO + GUDANG, v12.0.1): tile PO, SO, Perlu beli & semua tile gudang tampil; Admin tampil (tab Dokumen); Laporan tampil',
  !(await hidden('#tilePo')) && !(await hidden('#tileSo')) && (await p.$$eval('.mod-gudang', els => els.every(e => !e.classList.contains('hide')))) && !(await hidden('#nav-admin')) && !(await hidden('#segAdmDok')) && !(await hidden('#nav-report')));
await p.evaluate(() => { tampil('po'); segPo('baru'); }); await W(700);
await p.click('#poSupplier'); await W(200); await p.click('#poSupplier ~ .combo-list .combo-item'); await W(200);
await p.fill('#poTop', '30');
await p.click('#cb-po-0'); await p.type('#cb-po-0', 'Biji Plastik KW'); await W(300); await p.click('#cb-po-0 ~ .combo-list .combo-item'); await W(200);
await p.evaluate(() => { S.baris.po[0].qty = '1000'; S.baris.po[0].harga = '12000'; gambarBaris('po'); });
await p.evaluate(() => simpanPoUI()); await W(2500);
ok('PO tersimpan oleh Yansen (toast)', toasts.some(t => /PO tersimpan/i.test(t)), toasts.slice(-1));

/* v12: Yansen ubah pengaturan dokumen + dokumen PO */
const pg = (await rpc('simpanPengaturanDokumen', [{ kgPerBal: 25, perusahaan: { nama: 'PT Plastik Uji', alamat: 'Jl. Uji 1', bank: 'BCA 123 a.n. PT Plastik Uji' } }])).r;
ok('v12: Yansen simpan kop perusahaan + kg/bal', pg && pg.perusahaan.nama === 'PT Plastik Uji' && pg.kgPerBal === 25, pg);
const poRows = await p.evaluate(() => panggil('daftarPo', [S.ident, '', 30]));
const dpo = (await rpc('buatDokumen', [{ jenis: 'PO', ref: poRows[0].noPo }])).r;
ok('v12: dokumen PO dibuat oleh Yansen (nomor = No PO)', dpo && dpo.ok && dpo.nomor === poRows[0].noPo, dpo);
const poHtml = await (await fetch('http://127.0.0.1:8787/dok/' + dpo.token)).text();
ok('v12: halaman PO: PURCHASE ORDER + kop PT Plastik Uji + supplier', /PURCHASE ORDER/.test(poHtml) && /PT Plastik Uji/.test(poHtml) && /Supplier/.test(poHtml));const ysSo = await rpc('simpanSo', [{ customer: 'PT Nursery Hijau Lestari', tanggalKirim: new Date().toISOString().slice(0,10), topHari: 0, baris: [{ kode: 'FG-PB-KW', qty: 1, harga: 1000 }] }]);
ok('v12.0.1: Yansen BISA simpan SO (server)', ysSo.ok, ysSo.e);
if (ysSo.ok) await rpc('batalkanSo', [ysSo.r.ids[0], 'uji e2e Yansen']);
ok('Yansen: laporan nilai stok (dengan Rp) bisa dibuka', (await rpc('laporanNilaiStok', [])).ok);

/* ---- Yansen: penerimaan dari PO + foto → langsung final (gudang dikerjakan Yansen) ---- */
ok('tidak ada akun Staff Gudang bawaan lagi', !(await p.$$eval('#identPilih option', o => o.map(x => x.value))).includes('Staff Gudang'));
await p.evaluate(() => bukaMutasi('BELI_MASUK')); await W(800);
await p.click('#rcvPartner'); await W(200); await p.click('#rcvPartner ~ .combo-list .combo-item'); await W(600);
const poOpt = await p.$$eval('#rcvPoPilih option', o => o.map(x => x.value).filter(Boolean));
ok('PO terbuka muncul di pilihan penerimaan', poOpt.length >= 1, poOpt);
await p.selectOption('#rcvPoPilih', poOpt[0]); await W(300);
await p.fill('#rcvNoSJ', 'SJ/E2E/1');
await p.evaluate(() => { S.baris.rcv[0].qty = '1000'; gambarBaris('rcv'); });
/* v11.2: simpan TANPA foto dulu (operasional dulu, foto menyusul) */
await p.evaluate(() => simpanMutasiUI()); await W(2500);
ok('penerimaan 1000 kg tersimpan TANPA foto (v11.2)', toasts.some(t => /tersimpan/i.test(t)), toasts.slice(-1));
await W(1200);
const riw = await p.evaluate(() => panggil('riwayatInput', ['BELI_MASUK', 14, S.ident]));
ok('riwayat: entri tanpa foto → bolehFoto, tombol "+ Foto" tampil', riw[0].bolehFoto === true && !riw[0].foto && /\+ Foto/.test(await T('#rcvRiwayat')), riw[0]);
ok('beranda: banner "belum ada foto" muncul', (await p.evaluate(() => panggil('getKonteks', [S.ident]))).ringkasan.tanpaFoto >= 1);
const tf = await p.evaluate((png) => panggil('tambahFoto', [S.ctx && 0, png, S.ident]).catch(e => ({ err: e.message })), PNG);
ok('tambahFoto tanpa id ditolak rapi', tf && tf.err, tf);
const tf2 = await p.evaluate(([id, png]) => panggil('tambahFoto', [id, png, S.ident]), [riw[0].id, PNG]);
ok('+ Foto: foto menyusul tersimpan ke entri', tf2.ok && /\/foto\//.test(tf2.foto), tf2);
const riw2 = await p.evaluate(() => panggil('riwayatInput', ['BELI_MASUK', 14, S.ident]));
ok('riwayat: setelah + Foto tidak ada tombol lagi, foto ada', riw2[0].foto && riw2[0].bolehFoto === false);
const tf3 = await p.evaluate(([id, png]) => panggil('tambahFoto', [id, png, S.ident]).catch(e => ({ err: e.message })), [riw[0].id, PNG]);
ok('foto kedua tanpa opsi ganti ditolak (petunjuk "Ganti foto")', tf3 && /Ganti foto/.test(tf3.err), tf3);
/* v12.7: ganti foto lewat UI riwayat: tombol 🔁 Ganti foto → lembar pilihan Kamera/Galeri → file → tambahFoto({ganti:true}) */
await p.evaluate(() => { tampil('beli'); bukaMutasi('BELI_MASUK'); }); await W(1500);
ok('v12.7: riwayat menampilkan tombol "Ganti foto" untuk entri yang sudah berfoto', /Ganti foto/.test(await T('#rcvRiwayat')) && riw2[0].bolehGanti === true, riw2[0] && riw2[0].bolehGanti);
await p.evaluate(() => { window.confirm = () => true; });
await p.click('#rcvRiwayat button:has-text("Ganti foto")'); await W(400);
ok('v12.7: lembar pilihan sumber foto muncul (Kamera / Galeri)', (await p.$('#fotoSumber')) !== null && /Kamera/.test(await T('#fotoSumber')) && /Galeri/.test(await T('#fotoSumber')));
await p.click('#fotoSumber button[data-s="kamera"]'); await W(200);
ok('v12.7: pilih Kamera → input file dapat atribut capture; lembar tertutup', (await p.$eval('#entriFile', e => e.getAttribute('capture'))) === 'environment' && (await p.$('#fotoSumber')) === null);
const fotoLama = riw2[0].foto;
await p.setInputFiles('#entriFile', { name: 'ganti.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(PNG.split(',')[1], 'base64') }); await W(2500);
const riw3 = await p.evaluate(() => panggil('riwayatInput', ['BELI_MASUK', 14, S.ident]));
ok('v12.7: foto diganti → URL baru, toast "Foto diganti"', toasts.some(t => /Foto diganti/.test(t)) && riw3[0].foto && riw3[0].foto !== fotoLama, [fotoLama, riw3[0].foto]);
ok('v12.7: foto lama sudah tidak ada di server (404), foto baru ada (200)', (await fetch(fotoLama)).status === 404 && (await fetch(riw3[0].foto)).status === 200);
await p.evaluate(() => { tampil('beli'); bukaMutasi('BELI_MASUK'); }); await W(800);
await p.click('#rcvPhoto'); await W(300);
ok('v12.7: kotak foto di form → lembar pilihan Kamera/Galeri; Galeri → tanpa capture', (await p.$('#fotoSumber')) !== null && (await (async () => { await p.click('#fotoSumber button[data-s="galeri"]'); await W(200); return (await p.$eval('#rcvFile', e => e.hasAttribute('capture'))) === false; })()));
const bt = await p.evaluate((id) => panggil('batalkanEntriSendiri', [id, '', S.ident]).catch(e => ({ err: e.message })), riw[0].id);
ok('v11.2: batal tanpa alasan ditolak server', bt && /Alasan pembatalan wajib/.test(bt.err), bt);
ok('riwayat: status DISETUJUI langsung, Yansen boleh edit (manager gudang)', riw[0].status === 'DISETUJUI' && riw[0].bolehEdit === true && riw[0].kunci === '', riw[0]);
ok('Yansen tidak boleh isi laporan shift (tab + Isi laporan tersembunyi)', await (async () => { await p.evaluate(() => tampil('shift')); await W(800); return hidden('#segShiftNew'); })());

/* ---- Bastari: laporan shift blowing + cutting ---- */
ok('login Bastari (modul PRODUKSI)', /Bastari/.test(await login('Bastari', '4433')));
ok('Bastari: tile PO/SO/gudang tersembunyi, Admin tampil (opname produksi)', (await hidden('#tilePo')) && (await hidden('#tileSo')) && (await p.$$eval('.mod-gudang', els => els.every(e => e.classList.contains('hide')))) && !(await hidden('#nav-admin')));
await p.evaluate(() => tampil('shift')); await W(900);
await p.evaluate(() => segShift('new')); await W(800);
ok('form shift: 2 shift, dua bagian mesin aktif', (await p.$$eval('#shiftPilihWrap button', b => b.length)) === 2 && !(await hidden('#blowingBody')) && !(await hidden('#cuttingBody')));
await p.fill('#blowingOperator', 'Sri'); await p.keyboard.press('Enter'); await W(200);
await p.fill('#cuttingOperator', 'Rina'); await p.keyboard.press('Enter'); await W(200);
await p.click('#cb-ambil-0'); await p.type('#cb-ambil-0', 'Biji Plastik KW'); await W(300); await p.click('#cb-ambil-0 ~ .combo-list .combo-item'); await W(200);
await p.evaluate(() => { S.baris.ambil[0].qty = '250'; gambarBaris('ambil'); ringkasShift(); });
await (await p.$$('#blowingHasilLines input'))[0].fill('240'); await (await p.$$('#blowingBsLines input'))[0].fill('20');
await (await p.$$('#cuttingRollLines input'))[0].fill('236'); await (await p.$$('#cuttingHasilLines input'))[0].fill('235'); await (await p.$$('#cuttingBsLines input'))[0].fill('1'); await W(200);
await p.evaluate(() => simpanShiftUI()); await W(2500);
ok('laporan shift tersimpan oleh Bastari', toasts.some(t => /Laporan shift tersimpan/i.test(t)), toasts.slice(-1));
const kartu = await T('#shiftRows');
ok('kartu: Blowing Sri · Cutting Rina · pencatat Bastari', /Sri/.test(kartu) && /Rina/.test(kartu) && /Bastari/.test(kartu), kartu.slice(0, 200));
await p.evaluate(() => { tampil('admin'); segAdm('opprod'); }); await W(1200);
ok('Bastari: tab Opname produksi tampil; Opname gudang / SKU / Rekonsiliasi tersembunyi', !(await hidden('#segAdmOpprod')) && (await hidden('#segAdmOpname')) && (await hidden('#segAdmSku')) && (await hidden('#segAdmRekon')));
await p.evaluate(() => { opprodIsi('polybag', 'KW', '230'); opprodIsi('bs', 'KW', '20'); opprodIsi('biji', 'RM-BP-KW', '5'); opprodIsi('roll', 'KW', '4'); S.opprod.wip = '3'; opprodRingkas(); });
await p.evaluate(() => simpanOpprodUI()); await W(2500);
ok('opname produksi tersimpan (262 kg)', toasts.some(t => /Opname produksi tersimpan/.test(t) && /262/.test(t)), toasts.slice(-1));
ok('Bastari: opname gudang ditolak server', !(await rpc('siapkanOpname', [])).ok);
ok('Bastari: PO ditolak server', !(await rpc('simpanPo', [{ supplier: 'PT Sumber Biji Plastik', baris: [{ kode: 'RM-BP-KW', qty: 1, harga: 1 }] }])).ok);

/* ---- Deny: SO ---- */
ok('login Deny (modul SO)', /Deny/.test(await login('Deny', '3322')));
ok('Deny: tile SO tampil, PO tersembunyi', !(await hidden('#tileSo')) && (await hidden('#tilePo')));
await p.evaluate(() => { tampil('so'); segSo('baru'); }); await W(700);
await p.click('#soCustomer'); await W(200); await p.click('#soCustomer ~ .combo-list .combo-item'); await W(200);
await p.click('#cb-so-0'); await p.type('#cb-so-0', 'Polybag KW'); await W(300); await p.click('#cb-so-0 ~ .combo-list .combo-item'); await W(200);
/* v12: satuan bal — 4 bal × 25 kg = 100 kg */
ok('v12: baris SO punya pilihan satuan kg/bal', (await p.$$eval('#soLines select', s => s.length)) >= 1);
ok('v12.1: baris SO punya kolom ukuran, terisi dari master SKU saat pilih item', (await p.$('#uk-so-0')) !== null);
ok('v12.1: form SO punya pilihan TOP dihitung dari (kirim / tanggal SO)', (await p.$$eval('#soTopDari option', o => o.map(x => x.value).join())) === 'KIRIM,DOKUMEN');
await p.evaluate(() => { S.baris.so[0].qty = '4'; S.baris.so[0].satuan = 'bal'; S.baris.so[0].harga = '25000'; S.baris.so[0].ukuran = '30 x 50'; gambarBaris('so'); });
await p.selectOption('#soTopDari', 'DOKUMEN');
ok('v12: hint "= 100 kg (4 bal × 25 kg)" tampil', /100 kg/.test(await T('#hs-so-0')), await T('#hs-so-0'));
ok('v12.0.1: kolom TOP SO terisi 0 (bukan placeholder kosong)', (await p.$eval('#soTop', e => e.value)) === '0');
await p.fill('#soTop', '14');
await p.evaluate(() => simpanSoUI()); await W(2500);
ok('SO tersimpan oleh Deny', toasts.some(t => /SO tersimpan/i.test(t)), toasts.slice(-1));
const soRows = await p.evaluate(() => panggil('daftarSo', [S.ident, '', 30]));
ok('v12: SO tersimpan dalam kg (4 bal → 100 kg)', soRows[0].qty === 100, soRows[0]);
ok('v12.1: SO menyimpan ukuran baris & TOP dari tanggal SO', soRows[0].ukuran === '30 x 50' && soRows[0].topDari === 'DOKUMEN', soRows[0]);
/* v12: invoice dari SO */
await p.evaluate(() => segSo('list')); await W(1200);
ok('v12: tombol Invoice tampil di kartu SO', /Invoice/.test(await T('#soBody')));
await p.evaluate((no) => bukaDok('INVOICE', no), soRows[0].noSo); await W(1200);
await p.fill('#dokCatatan', 'Terima kasih');
await p.evaluate(() => buatDokUI()); await W(2500);
ok('v12: invoice dibuat (nomor INV/…/001, link tampil)', /INV\/\d{4}\/\d{2}\/001/.test(await T('#dokHasil')) && /\/dok\/[a-z0-9]{24}$/.test(await p.$eval('#dokHasil input', e => e.value)), (await T('#dokHasil')).slice(0, 160));
const dokUrl = await p.$eval('#dokHasil input', e => e.value);
const dokHtml = await (await fetch(dokUrl)).text();
ok('v12: halaman /dok/<token> tampil: INVOICE, customer, 4 bal / 100 kg, total Rp 2.500.000, tanpa PPN', /INVOICE/.test(dokHtml) && /Bal/.test(dokHtml) && /2\.500\.000/.test(dokHtml) && /tanpa PPN/.test(dokHtml) && /Terima kasih/.test(dokHtml), dokHtml.length);
ok('v12: token salah → 404', (await fetch(dokUrl.replace(/[a-z0-9]{24}$/, 'zzzzzzzzzzzzzzzzzzzzzzzz'))).status === 404);
await p.evaluate(() => bukaWa(-1)); await W(1500);
ok('v12: form WA terbuka dengan pesan + link', !(await hidden('#waWrap')) && /\/dok\//.test(await p.$eval('#waPesan', e => e.value)));
await p.fill('#waNomor', '0812 3456 7890'); await p.fill('#waNama', 'Pak Budi Nursery');
await p.evaluate(() => { window.__waUrl = ''; window.open = function(u){ window.__waUrl = u; return null; }; });
await p.evaluate(() => bukaWaUI()); await W(2000);
const waUrl = await p.evaluate(() => window.__waUrl);
ok('v12: Buka WhatsApp → wa.me/6281234567890 dengan teks + link', /^https:\/\/wa\.me\/6281234567890\?text=/.test(waUrl) && /dok%2F/.test(waUrl), waUrl.slice(0, 80));
ok('v12: kontak tersimpan ke daftar', ((await rpc('daftarKontakWa', [])).r || []).some(k => k.nomor === '6281234567890' && /Budi/.test(k.nama)));
await p.evaluate(() => tutupDok());
/* v12.1: dokumen SO + download PDF */
await p.evaluate((no) => bukaDok('SO', no), soRows[0].noSo); await W(1200);
ok('v12.1: modal dokumen SO: nomor = No SO', (await p.$eval('#dokNomor', e => e.value)) === soRows[0].noSo);
await p.evaluate(() => buatDokUI()); await W(2500);
const soDocUrl = await p.$eval('#dokHasil input', e => e.value);
const soHtml = await (await fetch(soDocUrl)).text();
ok('v12.1: halaman dokumen SO: SALES ORDER, ukuran 30 x 50, TOP dari tanggal SO, tombol Download PDF', /SALES ORDER/.test(soHtml) && /Ukuran 30 x 50/.test(soHtml) && /dari tanggal SO/.test(soHtml) && /Download PDF/.test(soHtml) && /html2pdf/.test(soHtml));
{
  const pc = await b.newContext({ acceptDownloads: true, ...CTX_EKSTRA }); const pp = await pc.newPage();
  /* sandbox tidak bisa ke cdnjs — sajikan html2pdf 0.10.1 yang sama dari npm */
  await pp.route('https://cdnjs.cloudflare.com/**', r => r.fulfill({ path: H2P, contentType: 'application/javascript' }));
  const dl = pp.waitForEvent('download', { timeout: 25000 }).catch(() => null);
  await pp.goto(soDocUrl + '?unduh=1');
  const d = await dl;
  ok('v12.1: ?unduh=1 → file PDF terunduh (' + (d ? d.suggestedFilename() : 'tidak ada') + ')', !!d && /^SALES_ORDER_.*\.pdf$/.test(d.suggestedFilename()));
  await pc.close();
}
await p.evaluate(() => tutupDok());
/* v12.2: gabung / pisah SO langsung di daftar SO */
ok('v12.2/12.7: input foto default tanpa capture (galeri bisa dipilih); capture hanya dipasang saat pilih Kamera', (await p.$$eval('input[type=file]', i => i.filter(x => x.hasAttribute('capture') && x.id !== 'entriFile').length)) === 0);
await p.evaluate(() => { tampil('so'); segSo('baru'); }); await W(700);
await p.click('#soCustomer'); await W(200); await p.click('#soCustomer ~ .combo-list .combo-item'); await W(200);
await p.click('#cb-so-0'); await p.type('#cb-so-0', 'Polybag KW'); await W(300); await p.click('#cb-so-0 ~ .combo-list .combo-item'); await W(200);
await p.evaluate(() => { S.baris.so[0].qty = '50'; S.baris.so[0].harga = '25000'; S.baris.so[0].ukuran = '45 x 45'; gambarBaris('so'); });
await p.evaluate(() => simpanSoUI()); await W(2500);
const soRows2 = await p.evaluate(() => panggil('daftarSo', [S.ident, '', 30]));
const noA = soRows[0].noSo, noB = soRows2.find(r => r.noSo !== noA).noSo;
await p.evaluate(() => segSo('aktif')); await W(1200);
ok('v12.2: tombol "Pilih SO" ada di halaman daftar SO (2 SO terbuka)', /Pilih SO/.test(await T('#soBody')) && (await p.$$eval('#soBody .rev', r => r.length)) === 2);
await p.click('#soBody button:has-text("Pilih SO")'); await W(300);
ok('v12.2: mode pilih → checkbox di tiap kartu, tombol Gabung nonaktif sebelum 2 dipilih', (await p.$$eval('#soBody .rev input[type=checkbox]', c => c.length)) === 2 && (await p.$eval('#btnGabungSo', b => b.disabled)) === true);
await p.click('#so-' + noA + ' input[type=checkbox]'); await W(200); await p.click('#so-' + noB + ' input[type=checkbox]'); await W(300);
ok('v12.2: 2 SO dipilih → tombol Gabung aktif', (await p.$eval('#btnGabungSo', b => b.disabled)) === false && /2 SO dipilih/.test(await T('#soBody')));
await p.screenshot({ path: OUT + '/s122-pilih.png', fullPage: false });
await p.click('#btnGabungSo'); await W(2500);
const soG = await p.evaluate(() => panggil('daftarSo', [S.ident, '', 30]));
ok('v12.2: Gabung → satu nomor SO (' + noA + ') dengan 2 baris, toast tampil', toasts.some(t => /SO digabung/.test(t)) && soG.every(r => r.noSo === noA) && soG.length === 2 && (await p.$$eval('#soBody .rev', r => r.length)) === 1, soG.map(r => r.noSo));
ok('v12.2: invoice lama SO yang digabung tetap aktif (nomor tujuan), kartu punya tombol Pisah', /Pisah/.test(await T('#soBody')));
await p.click('#soBody button:has-text("Pisah")'); await W(400);
ok('v12.2: mode pisah → checkbox per baris, tombol Pisah nonaktif sebelum dipilih', (await p.$$eval('#soBody .listrow input[type=checkbox]', c => c.length)) === 2 && (await p.$eval('#btnPisahSo', b => b.disabled)) === true);
await p.click('#soBody .listrow input[type=checkbox]'); await W(300);
ok('v12.2: 1 baris dipilih → tombol "Pisah ke SO baru" aktif', (await p.$eval('#btnPisahSo', b => b.disabled)) === false);
await p.screenshot({ path: OUT + '/s122-pisah.png', fullPage: false });
await p.click('#btnPisahSo'); await W(2500);
const soP = await p.evaluate(() => panggil('daftarSo', [S.ident, '', 30]));
ok('v12.2: Pisah → SO baru ' + noA + '-P2 (1 baris) + SO asal (1 baris)', toasts.some(t => /dipindah ke/.test(t)) && soP.some(r => r.noSo === noA + '-P2') && soP.filter(r => r.noSo === noA).length === 1 && (await p.$$eval('#soBody .rev', r => r.length)) === 2, soP.map(r => r.noSo));
await p.evaluate(() => tampil('home')); await W(1500);
ok('v12.2: beranda "Kirim hari ini": satu baris per SO (bukan per item), ada jumlah item', (await p.$$eval('#kirimHariIni .hist', h => h.length)) === (await p.evaluate(() => S.ctx.soHariIni.length)) && /item/i.test(await T('#kirimHariIni')), await T('#kirimHariIni'));
/* v12.4: SO 18 baris lewat form sungguhan; baris #8 tanpa harga → pesan menyebut baris, disorot; lalu lengkap → tersimpan 18 baris */
await p.evaluate(() => { tampil('so'); segSo('baru'); }); await W(700);
await p.click('#soCustomer'); await W(200); await p.click('#soCustomer ~ .combo-list .combo-item'); await W(200);
for (let i = 0; i < 18; i++) {
  if (i > 0) { await p.click('#soBody button:has-text("+ Item")'); await W(120); }
  await p.click('#cb-so-' + i); await p.type('#cb-so-' + i, 'Polybag KW'); await W(200); await p.click('#cb-so-' + i + ' ~ .combo-list .combo-item'); await W(120);
  const nums = await (await p.$$('#soLines .line'))[i].$$('input[type=number]');
  await nums[0].fill(String(25 + i)); if (i !== 7) await nums[1].fill('20000');
  await p.fill('#uk-so-' + i, (10 + i) + ' x ' + (20 + i));
}
await p.evaluate(() => simpanSoUI()); await W(800);
ok('v12.4: 18 baris, #8 tanpa harga → pesan "Baris #8 (Polybag KW): harga belum diisi", baris disorot', toasts.some(t => /Baris #8 \(Polybag KW\): harga belum diisi/.test(t)) && (await p.$eval('#soLines .line:nth-child(8)', e => e.style.outline)) !== '', toasts.slice(-1));
const soSebelum = await p.evaluate(() => panggil('daftarSo', [S.ident, '', 30]));
const nums8 = await (await p.$$('#soLines .line'))[7].$$('input[type=number]'); await nums8[1].fill('20000');
await p.evaluate(() => simpanSoUI()); await W(3500);
const so18 = await p.evaluate(() => panggil('daftarSo', [S.ident, '', 30]));
ok('v12.4: setelah harga #8 diisi → SO 18 baris tersimpan sekaligus', toasts.some(t => /SO tersimpan/.test(t)) && so18.filter(r => r.noSo === so18[0].noSo).length === 18 && so18.length === soSebelum.length + 18, [so18.length, soSebelum.length]);

/* bersihkan: batalkan 18 baris itu supaya cek berikutnya tidak terganggu */
for (const r of so18.filter(x => x.noSo === so18[0].noSo)) await p.evaluate((id) => panggil('batalkanSo', [id, 'uji e2e 18 baris', S.ident]), r.id);
await W(500);
/* v12.3: tambah item ke SO terbuka langsung dari kartu */
await p.evaluate(() => { tampil('so'); segSo('aktif'); }); await W(1200);
ok('v12.3: kartu SO terbuka punya tombol "+ Item"', /\+ Item/.test(await T('#soBody')));
await p.evaluate((no) => soTambahItem(no), noA); await W(400);
ok('v12.3: form tambah item muncul di dalam kartu (baris item kosong siap diisi)', (await p.$('#soTambah-' + noA + ' #soLines')) !== null && (await p.$('#cb-so-0')) !== null);
await p.click('#cb-so-0'); await p.type('#cb-so-0', 'Polybag Super'); await W(300); await p.click('#cb-so-0 ~ .combo-list .combo-item'); await W(200);
await p.evaluate(() => { S.baris.so[0].qty = '30'; S.baris.so[0].harga = '27000'; S.baris.so[0].ukuran = '50 x 70'; gambarBaris('so'); });
await p.click('#btnTambahKeSo'); await W(2500);
const soT = await p.evaluate(() => panggil('daftarSo', [S.ident, '', 30]));
ok('v12.3: item ditambahkan ke ' + noA + ' (2 baris, item baru 30 kg ukuran 50 x 70, tanggal kirim ikut SO)', toasts.some(t => /ditambahkan ke/.test(t)) && soT.filter(r => r.noSo === noA).length === 2 && soT.some(r => r.noSo === noA && r.qty === 30 && r.ukuran === '50 x 70' && r.tanggalKirim === soT.find(x => x.noSo === noA && x.qty !== 30).tanggalKirim), soT.filter(r => r.noSo === noA));
/* Deny: Admin → Dokumen (lihat saja) */
await p.evaluate(() => { tampil('admin'); segAdm('dok'); }); await W(1200);
ok('v12: Deny lihat Pengaturan dokumen (readonly) + kontak', /Pengaturan dokumen/.test(await T('#admBody')) && /Budi/.test(await T('#admBody')) && (await p.$eval('#pengKgBal', e => e.readOnly)) === true);
ok('Deny: PO ditolak server', !(await rpc('simpanPo', [{ supplier: 'PT Sumber Biji Plastik', baris: [{ kode: 'RM-BP-KW', qty: 1, harga: 1 }] }])).ok);

/* ---- Yansen (GUDANG): v13 alur kirim — 1. SO · 2. Buat DO (cetak / WA) · 3. Kirim + foto DO yang sudah ditandatangani; lapor rusak ---- */
await login('Yansen', '2211');
const so = await p.evaluate(() => panggil('soTerbuka', [S.ident]));
ok('Yansen melihat SO terbuka', so.length >= 1, so[0]);
ok('v13: i18n — setiap kunci T.id ada di T.en', await p.evaluate(() => Object.keys(T.id).filter(k => !(k in T.en)).length === 0), await p.evaluate(() => Object.keys(T.id).filter(k => !(k in T.en))));
ok('v13: konteks: bisaKirim + bisaSj; tile "DO siap kirim" & "Belum foto DO" tampil di beranda (0)', (await p.evaluate(() => S.ctx.bisaKirim === true && S.ctx.bisaSj === true)) && !(await hidden('#tileSiapKirim')) && !(await hidden('#tileBelumFoto')) && (await T('#sSiapKirim')).trim() === '0', [await T('#sSiapKirim'), await T('#sBelumFoto')]);
ok('v13: soTerbuka membawa dijadwalkan = 0 & sisaRencana = sisa (belum ada DO)', so.every(x => x.dijadwalkan === 0 && x.sisaRencana === x.sisa), so[0]);
const barisKirim = so.find(x => x.sisaRencana >= 100), noKirim = barisKirim.noSo, idsSo = so.filter(x => x.noSo === noKirim).map(x => x.id), nBaris = idsSo.length;
/* v12.2 → v13: tekan SO di beranda / kartu SO → form Buat DO dengan semua baris SO itu terisi (bukan lagi form barang keluar) */
await p.evaluate((ids) => bukaKirimSo(ids), idsSo.join(',')); await W(1200);
ok('v13: tekan SO → layar DO (mode JUAL_DO): judul "Buat DO (surat jalan)", ' + nBaris + ' baris SO terisi, tanpa kotak foto & no. SJ, kolom kendaraan, tombol Simpan DO + Batal',
  (await p.evaluate(() => S.modeExt === 'JUAL_DO')) && /Buat DO/.test(await T('#rcvJudul')) && !(await hidden('#rcvForm')) && (await p.evaluate(() => S.baris.rcv.filter(b => b.idSo).length)) === nBaris
  && (await hidden('#rcvFotoWrap')) && (await hidden('#rcvSJWrap')) && !(await hidden('#rcvPengangkutWrap')) && (await T('#btnSimpanRcv')).trim() === 'Simpan DO' && !(await hidden('#btnBatalDo')), [await T('#rcvJudul'), await T('#btnSimpanRcv')]);
const hariIni = await p.evaluate(() => hariIniStr());
ok('v13: tanggal rencana kirim: label "rencana", default hari ini, max +90 hari', /rencana/i.test(await T('#rcvTanggalLabel')) && (await p.$eval('#rcvTanggal', e => e.value)) === hariIni && (await p.$eval('#rcvTanggal', e => e.max)) > hariIni, [await T('#rcvTanggalLabel'), await p.$eval('#rcvTanggal', e => e.max)]);
/* v12.5: pilihan SO per NOMOR — berlaku di form DO; Batal menutup form */
await p.evaluate(() => tutupFormDo()); await W(200);
ok('v13: Batal → form DO tertutup, daftar DO tetap tampil', (await hidden('#rcvForm')) && !(await hidden('#doBawah')));
await p.evaluate(() => bukaFormDo()); await W(1200);
const soOpt = await p.$$eval('#rcvSoPilih option', o => o.map(x => x.value).filter(Boolean));
ok('v12.5: pilihan SO di form DO per nomor SO (value SO:<no>), bukan per baris', soOpt.length >= 1 && soOpt.every(v => v.indexOf('SO:') === 0) && soOpt.length === new Set(so.map(x => x.noSo)).size, soOpt);
await p.selectOption('#rcvSoPilih', 'SO:' + noKirim); await W(500);
ok('v12.5: pilih SO → semua ' + nBaris + ' ukuran terisi, customer terisi, panel "n/n ukuran ikut dikirim" tampil', (await p.evaluate(() => S.baris.rcv.filter(b => b.idSo).length)) === nBaris && (await p.evaluate(() => comboNama('rcvPartner'))) === barisKirim.customer && (new RegExp(nBaris + '/' + nBaris)).test(await T('#rcvSoInfo')), await T('#rcvSoInfo'));
if (nBaris >= 2) {
  await p.evaluate(() => hapusBaris('rcv', 0)); await W(200);
  ok('v12.5: ✕ satu ukuran → panel (n−1)/n + tombol Centang semua', (new RegExp((nBaris - 1) + '/' + nBaris)).test(await T('#rcvSoInfo')) && /Centang semua/.test(await T('#rcvSoInfo')), await T('#rcvSoInfo'));
  await p.click('#rcvSoInfo button:has-text("Centang semua")'); await W(300);
  ok('v12.5: Centang semua → semua ukuran kembali terisi', (await p.evaluate(() => S.baris.rcv.filter(b => b.idSo).length)) === nBaris);
}
await p.click('#rcvSoInfo button:has-text("Kosongkan")'); await W(300);
ok('v12.5: Kosongkan → tidak ada baris SO, panel hilang', (await p.evaluate(() => S.baris.rcv.filter(b => b.idSo).length)) === 0 && (await hidden('#rcvSoInfo')));
/* Buat DO: satu baris SO, 100 kg, kendaraan diisi */
await p.evaluate((ids) => bukaKirimSo(ids), idsSo.join(',')); await W(1200);
await p.evaluate((id) => { S.baris.rcv = S.baris.rcv.filter(b => b.idSo === id); S.baris.rcv[0].qty = '100'; gambarBaris('rcv'); gambarSoInfo(); }, barisKirim.id);
await p.fill('#rcvPengangkut', 'B 1234 XYZ · Pak Udin');
await p.evaluate(() => simpanMutasiUI()); await W(2500);
ok('v13: Simpan DO → toast "DO tersimpan · SJ/YYYY/MM/001"; banner hasil: nomor, 100 kg, tombol Cetak DO + Kirim; form tertutup', toasts.some(t => /DO tersimpan · SJ\/\d{4}\/\d{2}\/001/.test(t)) && /SJ\/\d{4}\/\d{2}\/001/.test(await T('#doHasil')) && /100 kg/.test(await T('#doHasil')) && /Cetak DO/.test(await T('#doHasil')) && /Kirim/.test(await T('#doHasil')) && (await hidden('#rcvForm')), [toasts.slice(-1), (await T('#doHasil')).slice(0, 160)]);
ok('v13: stok polybag KW TETAP 235 setelah Simpan DO — stok belum bergerak', (await p.evaluate(() => panggil('laporanStok', [S.ident]))).daftar.find(x => x.kode === 'FG-PB-KW').gbj === 235);
const doSiap = await p.evaluate(() => panggil('daftarKiriman', [S.ident, 'siap', 'CUSTOMER']));
ok('v13: daftarKiriman siap: 1 DO DISIAPKAN 100 kg, nomor SJ, token dokumen, noSo, bolehKirim/Ubah/Batal', doSiap.length === 1 && doSiap[0].status === 'DISIAPKAN' && doSiap[0].totalKg === 100 && /^SJ\//.test(doSiap[0].noSuratJalan) && !!doSiap[0].token && doSiap[0].noSo === noKirim && doSiap[0].bolehKirim && doSiap[0].bolehUbah && doSiap[0].bolehBatal, doSiap[0]);
const daftarDo = await T('#doDaftar');
ok('v13: tab Siap kirim: kartu DO (nomor, rencana, kendaraan, Cetak DO / Ubah DO / Batalkan DO, tombol Kirim besar); counter 1', /SJ\//.test(daftarDo) && /B 1234 XYZ/.test(daftarDo) && /Cetak DO/.test(daftarDo) && /Ubah DO/.test(daftarDo) && /Batalkan DO/.test(daftarDo) && (await T('#cntDoSiap')).trim() === '1' && !!(await p.$('#doDaftar .btn.besar')), daftarDo.slice(0, 200));
await p.screenshot({ path: OUT + '/v13-do-siap.png', fullPage: true });
const soSesudah = await p.evaluate(() => panggil('soTerbuka', [S.ident]));
ok('v13: soTerbuka: baris yang dijadwalkan → dijadwalkan 100, sisaRencana = sisa − 100', soSesudah.some(x => x.id === barisKirim.id && x.dijadwalkan === 100 && x.sisaRencana === x.sisa - 100), soSesudah.find(x => x.id === barisKirim.id));
await p.evaluate(() => { tampil('so'); segSo('aktif'); }); await W(1500);
const kartuSoT = await T('#so-' + noKirim);
ok('v13: kartu SO: blok DO (nomor · 100 kg · rencana · Cetak DO · Kirim) + "dijadwalkan 100 kg"; tombol Kirim per baris hilang', /SJ\//.test(kartuSoT) && /100 kg/.test(kartuSoT) && /Cetak DO/.test(kartuSoT) && /dijadwalkan 100 kg/.test(kartuSoT) && (await p.$$('#so-' + noKirim + ' .do-baris button:has-text("Kirim")')).length === 1 && (await p.$$('#so-' + noKirim + ' .btnrow button:has-text("Kirim")')).length === 0, kartuSoT.slice(0, 300));
await p.screenshot({ path: OUT + '/v13-so-do.png', fullPage: true });
await p.evaluate(() => { tampil('home'); muatKonteks(true); }); await W(1500);
ok('v13: beranda: tile DO siap kirim = 1' + ((await p.evaluate((no) => (S.ctx.soHariIni || []).some(g => g.noSo === no), noKirim)) ? '; kartu Kirim hari ini punya tombol Kirim (DO siap)' : ''), (await T('#sSiapKirim')).trim() === '1' && ((await p.evaluate((no) => !(S.ctx.soHariIni || []).some(g => g.noSo === no), noKirim)) || /Kirim/.test(await T('#kirimHariIni'))), [await T('#sSiapKirim'), (await T('#kirimHariIni')).slice(0, 120)]);
/* 2. Cetak / WA — dokumen DO sudah ada sejak DO dibuat (mode lihat: tanpa form, hanya PDF / Cetak / WA) */
await p.evaluate(() => bukaKiriman('siap')); await W(1200);
await p.click('#doDaftar button:has-text("Cetak DO")'); await W(1500);
ok('v13: Cetak DO → modal dokumen mode lihat: form tersembunyi, judul = nomor DO · customer, daftar punya surat jalan', !(await hidden('#dokWrap')) && (await hidden('#dokForm')) && /SJ\//.test(await T('#dokJudul')) && /SJ\//.test(await T('#dokDaftar')), [await T('#dokJudul'), (await T('#dokDaftar')).slice(0, 200)]);
const sjUrl = await p.evaluate((tok) => urlDok(tok), doSiap[0].token);
const sjHtml = await (await fetch(sjUrl)).text();
ok('v13: halaman /dok DO (draft): SURAT JALAN, Referensi SO, kendaraan, kg tanpa harga, 3 tanda tangan, bukan bukti tagihan', /SURAT JALAN/.test(sjHtml) && /Referensi SO/.test(sjHtml) && /B 1234 XYZ/.test(sjHtml) && !/Harga \/ kg/.test(sjHtml) && !/Rp /.test(sjHtml) && /Sopir \/ ekspedisi/.test(sjHtml) && /Penerima/.test(sjHtml), sjHtml.length);
await p.evaluate(() => bukaWa(0)); await W(800);
ok('v12.9/v13: pesan WA surat jalan menyebut nomor + 100 kg + link', /surat jalan SJ\//.test(await p.$eval('#waPesan', e => e.value)) && /100 kg/.test(await p.$eval('#waPesan', e => e.value)), await p.$eval('#waPesan', e => e.value));
await p.evaluate(() => tutupWa()); await p.evaluate(() => tutupDok()); await W(300);
/* 3. Kirim: qty sebenarnya + tanggal + foto DO yang sudah ditandatangani (kamera / galeri / buat-cetak DO) */
await p.evaluate((id) => bukaKirimDo(id), doSiap[0].id); await W(1500);
ok('v13: lembar Kirim: qty 100 + stok 235 kg, tanggal kirim hari ini, kendaraan dari DO, kotak "Upload foto DO", tombol "Kirim · foto menyusul" + Cetak DO', !(await hidden('#kirimWrap')) && (await p.$eval('#kirim-q-0', e => e.value)) === '100' && /235 kg/.test(await T('#kirimBody')) && (await p.$eval('#kirimTanggal', e => e.value)) === hariIni && (await p.$eval('#kirimPengangkut', e => e.value)) === 'B 1234 XYZ · Pak Udin' && /Upload foto DO/.test(await T('#kirimBody')) && /foto menyusul/.test(await T('#btnKirimDo')) && /Cetak DO/.test(await T('#kirimBody')), (await T('#kirimBody')).slice(0, 300));
await p.screenshot({ path: OUT + '/v13-kirim.png', fullPage: true });
await p.evaluate(() => pilihFotoKirim()); await W(400);
ok('v13: kotak foto DO → pilihan Kamera / Galeri / "Buat / cetak DO"', /Kamera/.test(await T('#fotoSumber')) && /Galeri/.test(await T('#fotoSumber')) && /Buat \/ cetak DO/.test(await T('#fotoSumber')), await T('#fotoSumber'));
await p.click('#fotoSumber button:has-text("Buat / cetak DO")'); await W(1200);
ok('v13: "Buat / cetak DO" dari lembar Kirim → modal dokumen DO terbuka di atas lembar Kirim', !(await hidden('#dokWrap')) && !(await hidden('#kirimWrap')) && /SJ\//.test(await T('#dokJudul')) && (await p.$('#fotoSumber')) === null);
await p.evaluate(() => tutupDok()); await W(200);
await p.setInputFiles('#kirimFile', { name: 'do-ttd.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(PNG.split(',')[1], 'base64') }); await W(1500);
ok('v13: foto DO dipilih (input file) → kotak terisi, tombol jadi "Kirim"', (await p.$eval('#kirimPhoto', e => e.className)) === 'photo filled' && (await T('#btnKirimDo')).trim() === 'Kirim' && (await p.evaluate(() => !!S.foto.kirim)), [await p.$eval('#kirimPhoto', e => e.className), await T('#btnKirimDo')]);
await p.evaluate(() => kirimDoUI()); await W(3000);
ok('v13: Kirim → toast "Terkirim · SJ/…/001 · 100 kg"; banner Terkirim + Cetak DO + Tutup', toasts.some(t => /Terkirim · SJ\/\d{4}\/\d{2}\/001/.test(t)) && /Terkirim/.test(await T('#kirimBody')) && /Cetak DO/.test(await T('#kirimBody')) && /Tutup/.test(await T('#kirimBody')), [toasts.slice(-1), (await T('#kirimBody')).slice(0, 200)]);
await p.evaluate(() => tutupKirim()); await W(800);
const rk1 = (await p.evaluate(() => panggil('riwayatInput', ['JUAL_KELUAR', 14, S.ident])))[0];
ok('pengiriman sesuai SO tersimpan & final; v13: no. surat jalan = nomor DO, idKiriman terisi, foto ada, bukan kandidat surat jalan baru', rk1.status === 'DISETUJUI' && /^SJ\/\d{4}\/\d{2}\/001$/.test(rk1.noSuratJalan) && !!rk1.idKiriman && !!rk1.foto && rk1.bolehSj === false, rk1);
ok('stok polybag KW 235 − 100 = 135 — baru bergerak saat Kirim', (await p.evaluate(() => panggil('laporanStok', [S.ident]))).daftar.find(x => x.kode === 'FG-PB-KW').gbj === 135);
ok('v13: setelah kirim: tab Siap kirim kosong, counter kosong; riwayat barang keluar: kepala "Kiriman" dengan nomor DO + tombol Cetak DO', /Belum ada DO/.test(await T('#doDaftar')) && (await T('#cntDoSiap')).trim() === '' && /Kiriman/.test(await T('#rcvRiwayat')) && /SJ\/\d{4}\/\d{2}\/001/.test(await T('#rcvRiwayat')) && /Cetak DO/.test(await T('#rcvRiwayat')), [(await T('#doDaftar')).slice(0, 80), (await T('#rcvRiwayat')).slice(0, 200)]);
await p.evaluate(() => segDo('dikirim')); await W(1200);
ok('v13: tab Sudah dikirim: kartu DO "dikirim", foto DO ada, tombol Ganti foto DO + Cetak DO', /dikirim/.test(await T('#doDaftar')) && /foto DO ada/.test(await T('#doDaftar')) && /Ganti foto DO/.test(await T('#doDaftar')) && /Cetak DO/.test(await T('#doDaftar')), (await T('#doDaftar')).slice(0, 200));
await p.screenshot({ path: OUT + '/v13-dikirim.png', fullPage: true });
/* v13: DO kedua untuk sisa SO → Ubah DO (nomor tetap, dokumen dibuat ulang) → Batalkan DO (alasan wajib lewat lembar in-app) */
const sisaR = soSesudah.filter(x => x.noSo === noKirim && x.sisaRencana > 0);
if (sisaR.length) {
  await p.evaluate(() => bukaFormDo()); await W(800);
  await p.selectOption('#rcvSoPilih', 'SO:' + noKirim); await W(500);
  ok('v13: pilih SO di form DO → hanya sisa yang belum dijadwalkan yang masuk (' + sisaR.length + ' baris, qty = sisaRencana)', (await p.evaluate(() => S.baris.rcv.filter(b => b.idSo).length)) === sisaR.length && (await p.evaluate(() => S.baris.rcv.filter(b => b.idSo).map(b => parseFloat(b.qty)).sort().join(','))) === sisaR.map(x => x.sisaRencana).sort().join(','), await p.evaluate(() => S.baris.rcv));
  await p.evaluate(() => simpanMutasiUI()); await W(2500);
  const doB = await p.evaluate(() => panggil('daftarKiriman', [S.ident, 'siap', 'CUSTOMER']));
  ok('v13: DO kedua tersimpan (nomor …/002)', doB.length === 1 && /\/002$/.test(doB[0].noSuratJalan), doB[0]);
  await p.evaluate((id) => ubahDoUI(id), doB[0].id); await W(1500);
  ok('v13: Ubah DO → form terisi: judul "Ubah DO · nomor", baris & kendaraan dari DO', /Ubah DO/.test(await T('#rcvJudul')) && (await p.evaluate(() => S.baris.rcv.length)) === doB[0].baris.length && (await p.evaluate(() => comboNama('rcvPartner'))) === doB[0].tujuan, await T('#rcvJudul'));
  await p.evaluate(() => { S.baris.rcv[0].qty = String(Math.max(1, parseFloat(S.baris.rcv[0].qty) - 1)); gambarBaris('rcv'); });
  await p.fill('#rcvPengangkut', 'B 9 ABC');
  await p.evaluate(() => simpanMutasiUI()); await W(2500);
  const doB2 = await p.evaluate(() => panggil('daftarKiriman', [S.ident, 'siap', 'CUSTOMER']));
  ok('v13: DO diubah: toast, nomor tetap, total −1 kg, kendaraan baru, dokumen DO dibuat ulang (token baru)', toasts.some(t => /DO diubah/.test(t)) && doB2[0].noSuratJalan === doB[0].noSuratJalan && doB2[0].totalKg === doB[0].totalKg - 1 && doB2[0].pengangkut === 'B 9 ABC' && doB2[0].token !== doB[0].token, [doB[0], doB2[0]]);
  nativeDialogSebelum = nativeDialog;
  await p.evaluate((id) => batalDoUI(id), doB2[0].id); await W(2500);
  ok('v13: Batalkan DO → alasan lewat lembar in-app (bukan prompt), DO hilang dari Siap kirim, sisaRencana SO kembali', nativeDialog === nativeDialogSebelum && toasts.some(t => /DO dibatalkan/.test(t)) && (await p.evaluate(() => panggil('daftarKiriman', [S.ident, 'siap', 'CUSTOMER']))).length === 0 && (await p.evaluate(() => panggil('soTerbuka', [S.ident]))).filter(x => x.noSo === noKirim && x.sisaRencana > 0).length === sisaR.length, toasts.slice(-2));
}

await p.evaluate(() => tampil('rusak')); await W(800);
await p.click('#cb-rusak-0'); await p.type('#cb-rusak-0', 'Biji Plastik KW'); await W(300); await p.click('#cb-rusak-0 ~ .combo-list .combo-item'); await W(200);
await p.evaluate(() => { S.baris.rusak[0].qty = '5'; gambarBaris('rusak'); });
await p.fill('#rusakPenyebab', 'karung bocor');
await p.evaluate(() => simpanRusakUI()); await W(2500);
ok('laporan rusak tersimpan — stok langsung turun (750 − 5 = 745)', toasts.some(t => /stok sudah dikurangi/.test(t)) && (await p.evaluate(() => panggil('laporanStok', [S.ident]))).daftar.find(x => x.kode === 'RM-BP-KW').gbj === 745, toasts.slice(-1));
ok('riwayat rusak: DISETUJUI, Yansen (manager gudang) punya tombol batal', /Disetujui/.test(await T('#rusakRiwayat')) && (await p.$$('#rusakRiwayat .btn.ghost[aria-label]')).length > 0);

/* ---- daur ulang BS: v13 — Buat DO (BS ke chassen) → Kirim TANPA foto (foto menyusul) → tab Belum foto DO → Foto DO ---- */
await p.evaluate(() => tampil('daur')); await W(1000);
ok('v13: layar daur ulang: tab Siap kirim / Di chassen / Belum foto DO / Selesai + tombol "Buat DO (BS ke chassen)"; Siap kirim kosong', !(await hidden('#segDaurSiap')) && !(await hidden('#segDaurFoto')) && !(await hidden('#btnBuatDoDaur')) && /Belum ada DO/.test(await T('#daurSiap')), (await T('#daurSiap')).slice(0, 120));
await p.click('#btnBuatDoDaur'); await W(600);
ok('v13: form DO daur: judul BS ke chassen, tanpa kotak foto & no. SJ, ada tanggal rencana + kendaraan, tombol Simpan DO', /BS ke chassen/.test(await T('#daurNew h2')) && (await p.$('#daurPhoto')) === null && (await p.$('#daurNoSJ')) === null && !!(await p.$('#daurPengangkut')) && (await T('#btnKirimDaur')).trim() === 'Simpan DO', [await T('#daurNew h2'), await T('#btnKirimDaur')]);
await p.click('#daurVendor'); await p.type('#daurVendor', 'CV Chassen Mitra' + SUF); await W(300); await p.click('#daurVendor ~ .combo-list .combo-tambah'); await W(1200);
await p.click('#cb-daur-0'); await p.type('#cb-daur-0', 'BS KW'); await W(300); await p.click('#cb-daur-0 ~ .combo-list .combo-item'); await W(200);
await p.evaluate(() => { S.baris.daur[0].qty = '20'; gambarBaris('daur'); });
await p.fill('#daurPengangkut', 'L 300 · Pak Joko');
const bsSebelum = (await p.evaluate(() => panggil('laporanStok', [S.ident]))).daftar.find(x => x.kode === 'SCR-BS-KW').gbj;
await p.evaluate(() => simpanDoDaurUI()); await W(2500);
const dSiap = await p.evaluate(() => panggil('daftarKiriman', [S.ident, 'siap', 'DAUR']));
ok('v13: DO daur tersimpan: toast, tab Siap kirim 1 DO 20 kg (jenis DAUR, nomor …/00N), stok BS belum bergerak', toasts.some(t => /DO tersimpan · SJ\//.test(t)) && dSiap.length === 1 && dSiap[0].jenis === 'DAUR' && dSiap[0].totalKg === 20 && /^SJ\//.test(dSiap[0].noSuratJalan) && (await p.evaluate(() => panggil('laporanStok', [S.ident]))).daftar.find(x => x.kode === 'SCR-BS-KW').gbj === bsSebelum && /Kirim/.test(await T('#daurSiap')) && (await T('#cntDaurSiap')).trim() === '1', [dSiap[0], (await T('#daurSiap')).slice(0, 160)]);
await p.screenshot({ path: OUT + '/v13-daur-siap.png', fullPage: true });
await p.evaluate((id) => bukaKirimDo(id), dSiap[0].id); await W(1500);
ok('v13: lembar Kirim DO daur: qty 20, stok BS ' + bsSebelum + ' kg, kendaraan, tombol "Kirim · foto menyusul"', (await p.$eval('#kirim-q-0', e => e.value)) === '20' && (new RegExp(String(bsSebelum).replace('.', '[.,]') + ' kg')).test(await T('#kirimBody')) && (await p.$eval('#kirimPengangkut', e => e.value)) === 'L 300 · Pak Joko' && /foto menyusul/.test(await T('#btnKirimDo')), (await T('#kirimBody')).slice(0, 200));
await p.evaluate(() => kirimDoUI()); await W(3000);
const dur = await p.evaluate(() => panggil('daftarDaurUlang', [S.ident]));
ok('v13: kirim ke chassen TANPA foto diterima — banner foto menyusul; Daur_Ulang BERJALAN dengan idKiriman; stok BS −20', toasts.some(t => /Terkirim · SJ\//.test(t)) && /menyusul/i.test(await T('#kirimBody')) && dur.length >= 1 && dur[0].status === 'BERJALAN' && !!dur[0].idKiriman && (await p.evaluate(() => panggil('laporanStok', [S.ident]))).daftar.find(x => x.kode === 'SCR-BS-KW').gbj === bsSebelum - 20, [dur[0], (await T('#kirimBody')).slice(0, 160)]);
await p.evaluate(() => tutupKirim()); await W(800);
await p.evaluate(() => segDaur('belumFoto')); await W(1200);
const ctxBf = await p.evaluate(() => panggil('getKonteks', [S.ident]).then(c => c.ringkasan));
ok('v13: tab Belum foto DO (daur): 1 kiriman dengan tombol Foto DO; counter 1; ringkasan beranda belumFotoSj = 1, siapKirim = 0', /Foto DO/.test(await T('#daurFoto')) && (await T('#cntDaurFoto')).trim() === '1' && ctxBf.belumFotoSj === 1 && ctxBf.siapKirim === 0, [ctxBf, (await T('#daurFoto')).slice(0, 160)]);
await p.screenshot({ path: OUT + '/v13-daur-belum-foto.png', fullPage: true });
const dbf = await p.evaluate(() => panggil('daftarKiriman', [S.ident, 'belumFoto', 'DAUR']));
await p.evaluate((id) => { S.fotoDoTarget = { id: id, ganti: false }; }, dbf[0].id);
await p.setInputFiles('#doFile', { name: 'sj-chassen.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(PNG.split(',')[1], 'base64') }); await W(3000);
const dDik = await p.evaluate(() => panggil('daftarKiriman', [S.ident, 'dikirim', 'DAUR']));
ok('v13: Foto DO menyusul (fotoSj) → toast, tab Belum foto kosong, kiriman punya foto', toasts.some(t => /Foto DO tersimpan/.test(t)) && /Semua kiriman sudah ada foto/.test(await T('#daurFoto')) && dDik.length === 1 && !!dDik[0].foto, [toasts.slice(-1), dDik[0]]);
/* v12.9 → v13: surat jalan BS ke chassen = dokumen DO dari kiriman (dibuat saat DO), halaman /dok: Jasa daur ulang, vendor, Referensi daur ulang */
const sjdHtml = await (await fetch(await p.evaluate((tok) => urlDok(tok), dDik[0].token))).text();
ok('v13: halaman DO daur ulang: SURAT JALAN, Jasa daur ulang, vendor, Referensi daur ulang, kendaraan', /SURAT JALAN/.test(sjdHtml) && /Jasa daur ulang/.test(sjdHtml) && /Chassen Mitra/.test(sjdHtml) && /Referensi daur ulang/.test(sjdHtml) && /L 300/.test(sjdHtml), sjdHtml.length);
await p.evaluate(() => segDaur('list')); await W(1500);
ok('v13: kartu Di chassen: BERJALAN 20 kg, tombol Cetak DO (dokumen kiriman, bukan surat jalan baru)', /20 kg/.test(await T('#daurList')) && /Cetak DO/.test(await T('#daurList')) && !/Surat jalan/.test(await T('#daurList')), (await T('#daurList')).slice(0, 200));
await p.evaluate(() => keluar()); await W(600);
ok('v13: keluar() mengosongkan daftar DO / lembar Kirim / daftar daur', await p.evaluate(() => ['doDaftar', 'doHasil', 'kirimBody', 'daurSiap', 'daurFoto'].every(id => !document.getElementById(id).innerHTML) && document.getElementById('kirimWrap').classList.contains('hide')));
await login('Yansen', '2211');
await p.evaluate(() => tutupDok());
await p.screenshot({ path: OUT + '/v11-yansen.png', fullPage: true });

/* ---- Manager: batalkan laporan rusak, laporan, SKU ---- */
ok('login manager', /Manager ·/.test(await login('Manager', '1357')));
ok('manager: semua tile tampil (PO, SO, gudang, rusak), Admin tampil', !(await hidden('#tilePo')) && !(await hidden('#tileSo')) && !(await hidden('#tileRusak')) && !(await hidden('#nav-admin')));
await p.evaluate(() => tampil('rusak')); await W(1000);
ok('manager melihat tombol batal di riwayat rusak', (await p.$$('#rusakRiwayat .btn.ghost[aria-label]')).length > 0);
await p.click('#rusakRiwayat .btn.ghost[aria-label]'); await W(2000);
ok('laporan rusak dibatalkan → stok kembali 750', (await p.evaluate(() => panggil('laporanStok', [S.ident]))).daftar.find(x => x.kode === 'RM-BP-KW').gbj === 750);
/* v12.6: opname bertanggal di Admin → Opname gudang */
await p.evaluate(() => { tampil('admin'); segAdm('opname'); }); await W(1500);
ok('v12.6: form opname punya tanggal posisi (default hari ini, max hari ini)', (await p.$eval('#opTanggal', e => e.value)) === (await p.evaluate(() => hariIniStr())) && (await p.$eval('#opTanggal', e => e.max)) === (await p.evaluate(() => hariIniStr())));
const sysNow = await p.evaluate(() => S.opname.items.find(i => i.kode === 'RM-BP-KW').sistem);
const kemarin = await p.evaluate(() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); });
await p.fill('#opTanggal', kemarin); await p.$eval('#opTanggal', e => e.dispatchEvent(new Event('change'))); await W(1500);
const sysKemarin = await p.evaluate(() => S.opname.items.find(i => i.kode === 'RM-BP-KW').sistem);
ok('v12.6: ganti tanggal → kemarin: banner "posisi akhir" tampil, sistem biji KW = 0 (semua transaksi e2e hari ini) vs sekarang ' + sysNow, (await p.$eval('#opTanggal', e => e.value)) === kemarin && /posisi stok akhir/.test(await T('#admBody')) && sysKemarin === 0 && sysNow > 0, [sysNow, sysKemarin]);
const idxKw = await p.evaluate(() => S.opname.items.findIndex(i => i.kode === 'RM-BP-KW'));
await p.fill('#opr-' + idxKw + ' input', '20'); await p.evaluate(() => simpanOpnameUI()); await W(2500);
ok('v12.6: opname bertanggal kemarin: fisik 20 vs sistem 0 → +20, stok sekarang ' + sysNow + ' + 20', toasts.some(t => /Opname tersimpan|tersimpan/i.test(t) && /\+20/.test(t)) && (await p.evaluate(() => panggil('laporanStok', [S.ident]))).daftar.find(x => x.kode === 'RM-BP-KW').gbj === sysNow + 20, toasts.slice(-1));
ok('v12.6: riwayat opname menampilkan "posisi <tanggal>"', (new RegExp('posisi ' + kemarin)).test(await T('#opRiwayat')));
await p.evaluate(() => { tampil('report'); segRep('nilai'); }); await W(1200);
const nilai = await T('#repBody');
ok('nilai stok rata-rata (Rp) tampil untuk manager', /Rp\s?\d/.test(nilai), nilai.slice(0, 120));
await p.screenshot({ path: OUT + '/v11-mgr.png', fullPage: true });

/* ---- Admin: rekonsiliasi ---- */
ok('login Admin', /Admin/.test(await login('Admin', '1234')));
await p.evaluate(() => { tampil('admin'); segAdm('rekon'); }); await W(1500);
const rk = await T('#admBody');
ok('rekonsiliasi: keluar gudang 250, dihitung 262', /Rekonsiliasi produksi/.test(rk) && /250 kg/.test(rk) && /262 kg/.test(rk), rk.slice(0, 300));
await p.evaluate(() => { tampil('admin'); segAdm('user'); }); await W(1200);
const users = await T('#admBody');
ok('daftar pengguna: Yansen PO · Deny SO · Bastari PRODUKSI (chip akses)', /Yansen.*PO/.test(users) && /Deny.*SO/.test(users) && /Bastari.*PRODUKSI/.test(users), users.slice(0, 300));
await p.evaluate(() => bukaUser(S.users.findIndex(u => u.nama === 'Yansen'))); await W(300);
ok('form pengguna: checkbox akses, PO + SO + GUDANG tercentang (v12.0.1)', (await p.$$eval('.userAksesCb:checked', c => c.map(x => x.value))).sort().join() === 'GUDANG,PO,SO');
await p.evaluate(() => tutupUser());

/* ---- v12.10 "fluid": ikon garis (tanpa emoji), laporan KPI + grafik SVG + tooltip, lembar dialog di dalam app, kesalahan isian di kolom ---- */
await login('Admin', '1234'); await W(800);
const emojiTerlihat = () => p.evaluate(() => { const re = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2460}-\u{24FF}]/u, out = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) { const el = n.parentElement; if (!el || el.closest('#testBanner,#demoBanner,script,style') || !el.getClientRects().length) continue; if (re.test(n.textContent)) out.push(n.textContent.trim().slice(0, 40)); } return out; });
ok('v12.10: beranda tanpa emoji (ikon garis dari satu set)', (await emojiTerlihat()).length === 0 && (await p.$$eval('#v-home .action .ico svg use', e => e.length)) >= 6, await emojiTerlihat());
await p.click('#nav-report'); await W(300); await p.evaluate(() => segRep('produksi'));
await p.waitForFunction(() => !document.querySelector('#repBody .load')); await W(1400);
ok('v12.10: Laporan Produksi → 5 kartu KPI + grafik harian SVG', (await p.$$eval('#repBody .kpi', e => e.length)) === 5 && !!(await p.$('#repBody .grafik svg')), await p.$$eval('#repBody .kpi', e => e.length));
{ const g = await p.$('#repBody .grafik svg'); await g.scrollIntoViewIfNeeded(); await W(300); const bb = await g.boundingBox();
  await p.mouse.move(bb.x + bb.width * 0.97, bb.y + bb.height * 0.5); await W(300);
  ok('v12.10: arahkan ke grafik → tooltip (kg / tanggal) + garis bantu', await p.evaluate(() => { const t = document.querySelector('.tip.on'), x = document.querySelector('#repBody .grafik .xh'); return !!t && /kg|shift/.test(t.textContent) && x && getComputedStyle(x).opacity === '1'; }));
  await p.mouse.move(5, 5); await W(200); }
for (const [tab, n] of [['stok', 5], ['beli', 3], ['jual', 3]]) {
  await p.evaluate((t) => segRep(t), tab); await p.waitForFunction(() => !document.querySelector('#repBody .load')); await W(900);
  const k = await p.$$eval('#repBody .kpi', e => e.length);
  ok('v12.10: Laporan ' + tab + ' → kartu KPI' + (tab === 'stok' ? '' : ' + grafik 30 hari'), k >= n && (tab === 'stok' || !!(await p.$('#repBody .grafik svg'))), k);
}
await p.evaluate(() => { tampil('so'); segSo('aktif'); }); await W(1200);
if (await p.$('#soBody .btn.ghost')) {
  await p.evaluate(() => { window.__dlgManual = true; });
  await p.click('#soBody .btn.ghost >> nth=0'); await p.waitForSelector('#dlgWrap:not(.hide)'); await W(150);
  ok('v12.10: Batalkan SO → lembar alasan di dalam app (kata-kata sama, isian terfokus)', (await T('#dlgPesan')) === (await p.evaluate(() => t('alasanBatalSo'))) && (await p.evaluate(() => document.activeElement && document.activeElement.id === 'dlgInput')), await T('#dlgPesan'));
  await p.fill('#dlgInput', 'ab'); await p.click('#dlgOk'); await W(250);
  ok('v12.10: alasan < 3 huruf → ditanya lagi + "alasan wajib"', !(await hidden('#dlgWrap')) && (await p.$eval('#dlgPesan', e => e.textContent)) === (await p.evaluate(() => t('alasanBatalSo') + '\n' + t('alasanWajib'))));
  await p.click('#dlgBatal'); await W(300);
  ok('v12.10: Batal → lembar tertutup, SO tidak dibatalkan', (await hidden('#dlgWrap')) && !toasts.slice(-1).some(t => /dibatalkan/i.test(t)));
  await p.evaluate(() => { window.__dlgManual = false; });
}
await p.evaluate(() => { segSo('baru'); }); await W(500);
await p.click('#btnSimpanSo'); await W(400);
ok('v12.10: simpan SO kosong → kolom customer ditandai + pesan di bawahnya (toast tetap)', await p.evaluate(() => document.getElementById('soCustomer').classList.contains('salah') && !!document.querySelector('#v-so .salah-msg')) && toasts.length > 0);
await p.fill('#soCustomer', 'x'); await W(150);
ok('v12.10: mulai mengetik → tanda salah hilang', await p.evaluate(() => !document.getElementById('soCustomer').classList.contains('salah')));
await p.click('#nav-home'); await W(500);

/* ---- peran STAF masih bisa dibuat Admin: tidak lihat Rp ---- */
ok('Admin membuat akun STAF baru', (await rpc('simpanPengguna', [{ nama: 'Gudang Uji', peran: 'STAF', pin: '9999', aktif: true }])).ok);
await login('Gudang Uji', '9999');
ok('STAF baru: tile gudang tampil, PO/SO/Admin tidak, tidak ada Rp', (await p.$$eval('.mod-gudang', els => els.every(e => !e.classList.contains('hide')))) && (await hidden('#tilePo')) && (await hidden('#nav-admin')) && !/Rp\s?\d/.test(await T('body')));
ok('STAF baru: nilai stok ditolak server', !(await rpc('laporanNilaiStok', [])).ok);
await p.reload(); await W(2500);
ok('setelah reload: sesi tetap & stok dari SQLite', await p.evaluate(() => S.ctx && S.ctx.stok['FG-PB-KW'] && S.ctx.stok['FG-PB-KW'].gbj === 135));

ok('v12.10: tidak ada dialog bawaan browser (prompt / confirm) sepanjang uji', nativeDialog === 0, nativeDialog);
console.log('\nAPI:', api.length, 'panggilan; rata-rata', Math.round(api.reduce((s, a) => s + a.ms, 0) / api.length), 'ms; terlama', Math.max(...api.map(a => a.ms)), 'ms (' + api.slice().sort((a, b) => b.ms - a.ms)[0].fn + '); non-200:', api.filter(a => a.status !== 200).length);
const errAsli = errs.filter(e => !/404|ERR_TUNNEL|fonts/.test(e)); console.log('ERRORS (di luar font/ikon):', errAsli.length ? errAsli : 'tidak ada');
console.log('Permintaan ke luar 127.0.0.1 (diblok):', luar.size ? [...luar] : 'tidak ada');
console.log('\n================ ' + pass + ' lulus, ' + fail + ' gagal ================ (' + BROWSER + (RM ? ', reduced motion' : '') + ')');
await b.close();
process.exit(fail || errAsli.length ? 1 : 0);
