/* E2E v11.1: PWA asli (docs/app, API → wrangler dev) → Worker lokal → Durable Object SQLite.
   Alur v11 (revamp akses, tanpa review): Yansen (PO) buat PO; staf terima barang → langsung final (tidak ada antrian);
   Bastari (PRODUKSI) isi laporan shift 2 mesin + opname produksi; Deny (SO) buat SO; staf kirim sesuai SO;
   staf lapor rusak → stok langsung turun; Manager batalkan laporan rusak; daur ulang; Admin rekonsiliasi;
   akses per modul ditegakkan di UI & server; staf tidak melihat Rp. Cek error console. */
import { chromium } from 'playwright';
const APP = 'http://127.0.0.1:8090/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage({ viewport: { width: 420, height: 940 }, deviceScaleFactor: 2 });
const errs = []; p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
const api = [], mulai = new Map(); p.on('request', r => { if (r.url().includes('8787/exec')) mulai.set(r, Date.now()); });
p.on('response', r => { const q = r.request(); if (mulai.has(q)) { api.push({ fn: JSON.parse(q.postData()).fn, ms: Date.now() - mulai.get(q), status: r.status() }); mulai.delete(q); } });
const W = ms => p.waitForTimeout(ms);
const toasts = []; await p.exposeFunction('__toast', t => toasts.push(t));
p.on('dialog', d => d.accept('uji e2e'));
const SUF = ' ' + Date.now().toString(36).slice(-4);
const PNG = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';
let pass = 0, fail = 0; const ok = (l, c, e) => { c ? (pass++, console.log('  ✓', l)) : (fail++, console.log('  ✗', l, e === undefined ? '' : JSON.stringify(e))); };
async function login(nama, pin) { await p.evaluate(() => keluar()); await W(300); await p.selectOption('#identPilih', nama); await p.fill('#identPin', pin); await p.click('text=Simpan & mulai'); await p.waitForFunction((n) => S.ctx && S.ctx.user && S.ctx.user.nama === n, nama, { timeout: 15000 }); await W(600); return p.$eval('#hdrUser', e => e.textContent); }
const T = async (sel) => (await p.$eval(sel, e => e.textContent)).replace(/\s+/g, ' ').trim();
const hidden = (sel) => p.$eval(sel, e => e.classList.contains('hide'));
const rpc = (fn, args) => p.evaluate(([fn, args]) => panggil(fn, args.concat([S.ident])).then(r => ({ ok: true, r }), e => ({ ok: false, e: e.message })), [fn, args]);

await p.goto(APP); await W(1500);
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
  const pc = await b.newContext({ acceptDownloads: true }); const pp = await pc.newPage();
  /* sandbox tidak bisa ke cdnjs — sajikan html2pdf 0.10.1 yang sama dari npm */
  await pp.route('https://cdnjs.cloudflare.com/**', r => r.fulfill({ path: '/home/claude/h2p/node_modules/html2pdf.js/dist/html2pdf.bundle.min.js', contentType: 'application/javascript' }));
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
await p.click('text=☑ Pilih SO'); await W(300);
ok('v12.2: mode pilih → checkbox di tiap kartu, tombol Gabung nonaktif sebelum 2 dipilih', (await p.$$eval('#soBody .rev input[type=checkbox]', c => c.length)) === 2 && (await p.$eval('#btnGabungSo', b => b.disabled)) === true);
await p.click('#so-' + noA + ' input[type=checkbox]'); await W(200); await p.click('#so-' + noB + ' input[type=checkbox]'); await W(300);
ok('v12.2: 2 SO dipilih → tombol Gabung aktif', (await p.$eval('#btnGabungSo', b => b.disabled)) === false && /2 SO dipilih/.test(await T('#soBody')));
await p.screenshot({ path: '/home/claude/s122-pilih.png', fullPage: false });
await p.click('#btnGabungSo'); await W(2500);
const soG = await p.evaluate(() => panggil('daftarSo', [S.ident, '', 30]));
ok('v12.2: Gabung → satu nomor SO (' + noA + ') dengan 2 baris, toast tampil', toasts.some(t => /SO digabung/.test(t)) && soG.every(r => r.noSo === noA) && soG.length === 2 && (await p.$$eval('#soBody .rev', r => r.length)) === 1, soG.map(r => r.noSo));
ok('v12.2: invoice lama SO yang digabung tetap aktif (nomor tujuan), kartu punya tombol Pisah', /✂ Pisah/.test(await T('#soBody')));
await p.click('text=✂ Pisah'); await W(400);
ok('v12.2: mode pisah → checkbox per baris, tombol Pisah nonaktif sebelum dipilih', (await p.$$eval('#soBody .listrow input[type=checkbox]', c => c.length)) === 2 && (await p.$eval('#btnPisahSo', b => b.disabled)) === true);
await p.click('#soBody .listrow input[type=checkbox]'); await W(300);
ok('v12.2: 1 baris dipilih → tombol "Pisah ke SO baru" aktif', (await p.$eval('#btnPisahSo', b => b.disabled)) === false);
await p.screenshot({ path: '/home/claude/s122-pisah.png', fullPage: false });
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

/* ---- Yansen: kirim sesuai SO, lapor rusak (langsung final) ---- */
await login('Yansen', '2211');
const so = await p.evaluate(() => panggil('soTerbuka', [S.ident]));
ok('Yansen melihat SO terbuka', so.length >= 1, so[0]);
await p.evaluate((ids) => bukaKirimSo(ids), so.filter(x => x.noSo === so[0].noSo).map(x => x.id).join(',')); await W(1200);
ok('v12.2: tekan SO di beranda → semua baris SO itu terisi di form kirim', (await p.evaluate(() => S.baris.rcv.filter(b => b.idSo).length)) === so.filter(x => x.noSo === so[0].noSo).length);
/* v12.5: pilihan SO per NOMOR — pilih sekali → semua ukuran masuk; panel Centang semua / Kosongkan; ✕ per baris */
await p.evaluate(() => bukaMutasi('JUAL_KELUAR')); await W(1200);
const soOpt = await p.$$eval('#rcvSoPilih option', o => o.map(x => x.value).filter(Boolean));
ok('v12.5: pilihan SO di form kirim per nomor SO (value SO:<no>), bukan per baris', soOpt.length >= 1 && soOpt.every(v => v.indexOf('SO:') === 0) && soOpt.length === new Set(so.map(x => x.noSo)).size, soOpt);
const noKirim = so[0].noSo, nBaris = so.filter(x => x.noSo === noKirim).length;
await p.selectOption('#rcvSoPilih', 'SO:' + noKirim); await W(500);
ok('v12.5: pilih SO → semua ' + nBaris + ' ukuran terisi, customer terisi, panel "n/n ukuran ikut dikirim" tampil', (await p.evaluate(() => S.baris.rcv.filter(b => b.idSo).length)) === nBaris && (await p.evaluate(() => comboNama('rcvPartner'))) === so[0].customer && (new RegExp(nBaris + '/' + nBaris)).test(await T('#rcvSoInfo')), await T('#rcvSoInfo'));
if (nBaris >= 2) {
  await p.evaluate(() => hapusBaris('rcv', 0)); await W(200);
  ok('v12.5: ✕ satu ukuran → panel (n−1)/n + tombol Centang semua', (new RegExp((nBaris - 1) + '/' + nBaris)).test(await T('#rcvSoInfo')) && /Centang semua/.test(await T('#rcvSoInfo')), await T('#rcvSoInfo'));
  await p.click('#rcvSoInfo button:has-text("Centang semua")'); await W(300);
  ok('v12.5: Centang semua → semua ukuran kembali terisi', (await p.evaluate(() => S.baris.rcv.filter(b => b.idSo).length)) === nBaris);
}
await p.click('#rcvSoInfo button:has-text("Kosongkan")'); await W(300);
ok('v12.5: Kosongkan → tidak ada baris SO, panel hilang', (await p.evaluate(() => S.baris.rcv.filter(b => b.idSo).length)) === 0 && (await hidden('#rcvSoInfo')));
await p.evaluate((ids) => bukaKirimSo(ids), so.filter(x => x.noSo === so[0].noSo).map(x => x.id).join(',')); await W(1200);
await p.evaluate(() => { S.baris.rcv = S.baris.rcv.slice(0, 1); gambarBaris('rcv'); });
/* v12.3: no. surat jalan opsional — sengaja dikosongkan */
ok('v12.3: label surat jalan bertanda (opsional) + hint', /opsional/.test(await T('#rcvSJWrap')));
await p.evaluate(() => { S.baris.rcv[0].qty = '100'; gambarBaris('rcv'); });
await p.evaluate((png) => { S.foto.rcv = png; }, PNG);
await p.evaluate(() => simpanMutasiUI()); await W(2500);
const rk1 = (await p.evaluate(() => panggil('riwayatInput', ['JUAL_KELUAR', 14, S.ident])))[0];
ok('pengiriman sesuai SO tersimpan & final', rk1.status === 'DISETUJUI');
ok('v12.3: pengiriman tersimpan TANPA no. surat jalan', rk1.noSuratJalan === '' || rk1.noSuratJalan === undefined, rk1.noSuratJalan);
ok('stok polybag KW 235 − 100 = 135', (await p.evaluate(() => panggil('laporanStok', [S.ident]))).daftar.find(x => x.kode === 'FG-PB-KW').gbj === 135);
/* v12.9: surat jalan (delivery order) — setelah simpan barang keluar, modal dokumen SJ langsung terbuka */
ok('v12.9: setelah simpan kiriman, modal Surat jalan terbuka (jenis SJ, ref = ID pengiriman, kolom kendaraan tampil)', !(await hidden('#dokWrap')) && (await p.evaluate(() => S.dok && S.dok.jenis === 'SJ' && /^OUT-/.test(S.dok.ref))) && !(await hidden('#dokPengangkutWrap')) && /Surat jalan/.test(await T('#dokJudul')), await T('#dokJudul'));
await p.fill('#dokPengangkut', 'B 1234 XYZ · Pak Udin');
await p.evaluate(() => buatDokUI()); await W(2500);
ok('v12.9: surat jalan dibuat: nomor SJ/…/001, total dalam kg, no. SJ diisi ke pengiriman', /SJ\/\d{4}\/\d{2}\/001/.test(await T('#dokHasil')) && /100 kg/.test(await T('#dokHasil')) && /diisi ke pengiriman/.test(await T('#dokHasil')), (await T('#dokHasil')).slice(0, 200));
const sjUrl = await p.$eval('#dokHasil input', e => e.value);
const sjHtml = await (await fetch(sjUrl)).text();
ok('v12.9: halaman /dok: SURAT JALAN, customer, referensi SO, kendaraan, kolom Kg tanpa harga, 3 tanda tangan, bukan bukti tagihan', /SURAT JALAN/.test(sjHtml) && /Referensi SO/.test(sjHtml) && /B 1234 XYZ/.test(sjHtml) && !/Harga \/ kg/.test(sjHtml) && !/Rp /.test(sjHtml) && /Sopir \/ ekspedisi/.test(sjHtml) && /Penerima/.test(sjHtml) && /bukan bukti tagihan/.test(sjHtml), sjHtml.length);
await p.evaluate(() => bukaWa(-1)); await W(800);
ok('v12.9: pesan WA surat jalan menyebut kg + link', /surat jalan SJ\//.test(await p.$eval('#waPesan', e => e.value)) && /100 kg/.test(await p.$eval('#waPesan', e => e.value)));
await p.evaluate(() => tutupWa()); await p.evaluate(() => tutupDok()); await W(300);
await p.evaluate(() => bukaMutasi('JUAL_KELUAR')); await W(1500);
ok('v12.9: riwayat barang keluar: kepala "Kiriman" per kiriman dengan tombol Surat jalan + nomor SJ', /📦 Kiriman/.test(await T('#rcvRiwayat')) && /Surat jalan/.test(await T('#rcvRiwayat')) && /SJ\/\d{4}\/\d{2}\/001/.test(await T('#rcvRiwayat')), (await T('#rcvRiwayat')).slice(0, 200));
const rkSj = (await p.evaluate(() => panggil('riwayatInput', ['JUAL_KELUAR', 14, S.ident])))[0];
ok('v12.9: baris pengiriman sekarang punya no. surat jalan = nomor dokumen', /^SJ\//.test(rkSj.noSuratJalan) && rkSj.bolehSj === true && !!rkSj.kelompok, rkSj.noSuratJalan);
await p.evaluate(() => tampil('rusak')); await W(800);
await p.click('#cb-rusak-0'); await p.type('#cb-rusak-0', 'Biji Plastik KW'); await W(300); await p.click('#cb-rusak-0 ~ .combo-list .combo-item'); await W(200);
await p.evaluate(() => { S.baris.rusak[0].qty = '5'; gambarBaris('rusak'); });
await p.fill('#rusakPenyebab', 'karung bocor');
await p.evaluate(() => simpanRusakUI()); await W(2500);
ok('laporan rusak tersimpan — stok langsung turun (750 − 5 = 745)', toasts.some(t => /stok sudah dikurangi/.test(t)) && (await p.evaluate(() => panggil('laporanStok', [S.ident]))).daftar.find(x => x.kode === 'RM-BP-KW').gbj === 745, toasts.slice(-1));
ok('riwayat rusak: DISETUJUI, Yansen (manager gudang) punya tombol batal', /Disetujui/.test(await T('#rusakRiwayat')) && /✕/.test(await T('#rusakRiwayat')));

/* ---- daur ulang BS ---- */
await p.evaluate(() => tampil('daur')); await W(600); await p.evaluate(() => segDaur('new')); await W(500);
await p.click('#daurVendor'); await p.type('#daurVendor', 'CV Chassen Mitra' + SUF); await W(300); await p.click('#daurVendor ~ .combo-list .combo-tambah'); await W(1200);
await p.click('#cb-daur-0'); await p.type('#cb-daur-0', 'BS KW'); await W(300); await p.click('#cb-daur-0 ~ .combo-list .combo-item'); await W(200);
await p.evaluate(() => { S.baris.daur[0].qty = '20'; gambarBaris('daur'); });
await p.evaluate(() => kirimDaurUI()); await W(800);
ok('v11.2: kirim ke chassen TANPA foto surat jalan ditolak', toasts.some(t => /Foto surat jalan chassen wajib/.test(t)), toasts.slice(-1));
await p.evaluate((png) => { S.foto.daur = png; }, PNG);
await p.evaluate(() => kirimDaurUI()); await W(2500);
ok('BS 20 kg dikirim ke chassen (dengan foto)', toasts.some(t => /dikirim|tersimpan/i.test(t)), toasts.slice(-1));
/* v12.9: surat jalan BS ke jasa daur ulang dari kartu daur ulang */
await p.evaluate(() => segDaur('list')); await W(1500);
ok('v12.9: kartu daur ulang punya tombol Surat jalan', /Surat jalan/.test(await T('#daurList')), (await T('#daurList')).slice(0, 200));
const durRows = await p.evaluate(() => panggil('daftarDaurUlang', [S.ident]));
await p.evaluate((d) => bukaDok('SJ', d.id, { nomor: d.noSuratJalan || '', sub: d.vendor }), durRows[0]); await W(1200);
ok('v12.9: modal SJ daur ulang: sub "Surat jalan BS ke jasa daur ulang"', /jasa daur ulang/.test(await T('#dokSub')));
await p.evaluate(() => buatDokUI()); await W(2500);
const sjdHtml = await (await fetch(await p.$eval('#dokHasil input', e => e.value))).text();
ok('v12.9: halaman SJ daur ulang: Jasa daur ulang, vendor, BS 20 kg, Referensi daur ulang', /Jasa daur ulang/.test(sjdHtml) && /Chassen Mitra/.test(sjdHtml) && /Referensi daur ulang/.test(sjdHtml) && /SURAT JALAN/.test(sjdHtml), sjdHtml.length);
await p.evaluate(() => tutupDok());
await p.screenshot({ path: '/home/claude/v11-yansen.png', fullPage: true });

/* ---- Manager: batalkan laporan rusak, laporan, SKU ---- */
ok('login manager', /Manager ·/.test(await login('Manager', '1357')));
ok('manager: semua tile tampil (PO, SO, gudang, rusak), Admin tampil', !(await hidden('#tilePo')) && !(await hidden('#tileSo')) && !(await hidden('#tileRusak')) && !(await hidden('#nav-admin')));
await p.evaluate(() => tampil('rusak')); await W(1000);
ok('manager melihat tombol batal di riwayat rusak', /✕/.test(await T('#rusakRiwayat')));
await p.click('#rusakRiwayat .btn.ghost:has-text("✕")'); await W(2000);
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
await p.screenshot({ path: '/home/claude/v11-mgr.png', fullPage: true });

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

/* ---- peran STAF masih bisa dibuat Admin: tidak lihat Rp ---- */
ok('Admin membuat akun STAF baru', (await rpc('simpanPengguna', [{ nama: 'Gudang Uji', peran: 'STAF', pin: '9999', aktif: true }])).ok);
await login('Gudang Uji', '9999');
ok('STAF baru: tile gudang tampil, PO/SO/Admin tidak, tidak ada Rp', (await p.$$eval('.mod-gudang', els => els.every(e => !e.classList.contains('hide')))) && (await hidden('#tilePo')) && (await hidden('#nav-admin')) && !/Rp\s?\d/.test(await T('body')));
ok('STAF baru: nilai stok ditolak server', !(await rpc('laporanNilaiStok', [])).ok);
await p.reload(); await W(2500);
ok('setelah reload: sesi tetap & stok dari SQLite', await p.evaluate(() => S.ctx && S.ctx.stok['FG-PB-KW'] && S.ctx.stok['FG-PB-KW'].gbj === 135));

console.log('\nAPI:', api.length, 'panggilan; rata-rata', Math.round(api.reduce((s, a) => s + a.ms, 0) / api.length), 'ms; terlama', Math.max(...api.map(a => a.ms)), 'ms (' + api.slice().sort((a, b) => b.ms - a.ms)[0].fn + '); non-200:', api.filter(a => a.status !== 200).length);
const errAsli = errs.filter(e => !/404|ERR_TUNNEL|fonts/.test(e)); console.log('ERRORS (di luar font/ikon):', errAsli.length ? errAsli : 'tidak ada');
console.log('\n================ ' + pass + ' lulus, ' + fail + ' gagal ================');
await b.close();
process.exit(fail || errAsli.length ? 1 : 0);
