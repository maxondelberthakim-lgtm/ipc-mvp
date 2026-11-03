/* bench-ui.mjs — kecepatan UI H-Plast IPC di viewport HP (sama dengan e2e-v11: 420×940 @2x), Worker lokal (wrangler dev).
   Jalankan lewat run-e2e-mac.sh --bench (Worker segar + salinan build yang menunjuk ke 127.0.0.1:8787).
   (a) pindah layar: klik tombol nav bawah (Beranda / Produksi / Laporan / Admin) dan tile beranda "Barang keluar";
       waktu = event klik (event.timeStamp) → frame pertama (dicek tiap rAF) yang memuat section #v-<view> terlihat
       → frame itu selesai dilukis (MessageChannel dari dalam rAF). "settle" = sama, tapi menunggu juga animasi/transisi CSS
       (non-infinite) di dalam view itu selesai (= nilai biasa kalau tidak ada animasi).
   (b) simpan: klik tombol simpan sungguhan → toast sukses dipanggil → frame berikutnya selesai dilukis; "api" = durasi POST /exec simpan.
   Pengisian form tidak diukur (meniru e2e-v11). Login Manager (semua modul).
   Env: PW_DIR, E2E_BROWSER (chromium), CHROME_PATH, E2E_REDUCED_MOTION, APP_URL, BENCH_REPS (10), BENCH_SAVE_REPS (10),
        BENCH_CPU_THROTTLE (Chromium saja, mis. 4 = HP menengah; default 1 = tanpa), BENCH_JSON (tulis hasil), E2E_TIMEOUT_S. */
import { createRequire } from 'module';
import { writeFileSync } from 'fs';
const ENV = process.env;
const need = createRequire(ENV.PW_DIR ? ENV.PW_DIR.replace(/\/*$/, '/') : import.meta.url);
const pw = (() => { try { return need('playwright'); } catch (e) { return need('playwright-core'); } })();
const APP = ENV.APP_URL || 'http://127.0.0.1:8090/';
const BROWSER = (ENV.E2E_BROWSER || 'chromium').toLowerCase();
const RM = /^(1|true|ya|reduce)$/i.test(ENV.E2E_REDUCED_MOTION || '');
const REPS = +ENV.BENCH_REPS || 10, SREPS = +ENV.BENCH_SAVE_REPS || 10, CPU = +ENV.BENCH_CPU_THROTTLE || 1;
const LOKAL = /^(https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)|data:|blob:|about:)/;
setTimeout(() => { console.log('\nTIMEOUT: bench > ' + (+ENV.E2E_TIMEOUT_S || 900) + ' dtk'); process.exit(3); }, 1000 * (+ENV.E2E_TIMEOUT_S || 900)).unref();

const b = await pw[BROWSER].launch({ ...(BROWSER === 'chromium' ? { executablePath: ENV.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' } : {}),
  proxy: { server: 'http://127.0.0.1:9', bypass: '127.0.0.1,localhost' } });   /* semua host selain 127.0.0.1 → gagal */
const VIEWPORT = { width: 420, height: 940 };
const p = await b.newPage({ viewport: VIEWPORT, deviceScaleFactor: 2, ...(RM ? { reducedMotion: 'reduce' } : {}) });
if (CPU > 1 && BROWSER === 'chromium') await (await p.context().newCDPSession(p)).send('Emulation.setCPUThrottlingRate', { rate: CPU });
const errs = [], luar = new Set();
p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
p.on('console', m => { if (m.type() !== 'error') return; const lu = (m.location() || {}).url || ''; if (lu && !LOKAL.test(lu)) { luar.add(lu); return; } errs.push('CONSOLE: ' + m.text()); });
p.on('requestfailed', r => { if (!LOKAL.test(r.url())) luar.add(r.url()); });
p.on('dialog', d => d.accept('uji bench'));
let inflight = 0;
const apiReq = r => r.url().includes(':8787/');
p.on('request', r => { if (apiReq(r)) inflight++; });
p.on('requestfinished', r => { if (apiReq(r)) inflight--; });
p.on('requestfailed', r => { if (apiReq(r)) inflight--; });
const W = ms => p.waitForTimeout(ms);
/* tenang = tidak ada panggilan Worker yang berjalan selama `ms` (maks 15 dtk) */
async function tenang(ms = 300) { const t = Date.now(); while (Date.now() - t < 15000) { if (inflight <= 0) { await W(ms); if (inflight <= 0) return; } else await W(25); } }

/* --- alat ukur di halaman: dipasang sebelum klik, mulai saat event klik (fase capture, sebelum handler app) --- */
await p.addInitScript(() => {
  window.__toastLog = [];
  window.__pasangToast = () => {
    if (window.__toastDibungkus || typeof window.toast !== 'function') return;
    const asli = window.toast;
    window.toast = function (m, j) { window.__toastLog.push({ t: performance.now(), m: String(m), j: j || '' }); return asli.apply(this, arguments); };
    window.__toastDibungkus = true;
  };
  const terlihat = (el) => {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0 || r.bottom <= 0 || r.top >= innerHeight) return false;
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; }
    return true;
  };
  const animasiJalan = (el) => (el.getAnimations ? el.getAnimations({ subtree: true }) : []).some(a => a.playState === 'running' && a.effect && a.effect.getTiming().iterations !== Infinity);
  const raf = () => new Promise(r => requestAnimationFrame(r));
  /* dipanggil dari dalam callback rAF (frame N, sebelum dilukis): pesan MessageChannel jalan setelah frame N selesai dilukis */
  const naLukis = () => new Promise(res => { const ch = new MessageChannel(); ch.port1.onmessage = () => res(performance.now()); ch.port2.postMessage(0); });
  /* jenis 'view': syarat = selector terlihat; jenis 'toast': syarat = toast (bukan 'bad') yang cocok regex setelah klik */
  window.__siapkan = (jenis, arg) => {
    performance.clearResourceTimings();
    window.__hasil = new Promise((selesai) => {
      document.addEventListener('click', async function h(e) {
        document.removeEventListener('click', h, true);
        const now = performance.now();
        const t0 = e.timeStamp > 0 && e.timeStamp <= now ? e.timeStamp : now;
        const batas = t0 + 20000, out = { t0, input: now - t0 };
        /* listener bubble di window jalan SETELAH handler klik app → js = klik → handler app selesai */
        window.addEventListener('click', function sesudah() { window.removeEventListener('click', sesudah); out.js = performance.now() - t0; });
        try {
          let tRaf = 0;
          for (;;) {
            await raf(); tRaf = performance.now();
            if (tRaf > batas) { out.err = 'timeout'; break; }
            if (jenis === 'view') { if (terlihat(document.querySelector(arg))) break; continue; }
            const log = window.__toastLog.filter(x => x.t >= t0);
            const bad = log.find(x => x.j === 'bad'); if (bad) { out.err = 'toast bad: ' + bad.m; break; }
            const okT = log.find(x => new RegExp(arg, 'i').test(x.m)); if (okT) { out.toast = okT.m; out.tToast = okT.t - t0; break; }
          }
          const tLukis = await naLukis();
          out.ms = tLukis - t0;
          out.render = tLukis - tRaf;   /* style + layout + paint frame itu (dari awal callback rAF sampai selesai dilukis) */
          if (jenis === 'view' && !out.err) {
            const el = document.querySelector(arg);
            if (!animasiJalan(el)) out.settle = out.ms;
            else { do { await raf(); } while (animasiJalan(el) && performance.now() < batas); out.settle = (await naLukis()) - t0; }
          }
          const ex = performance.getEntriesByType('resource').filter(r => /:8787\/exec/.test(r.name) && r.startTime >= t0 - 1);
          if (ex.length) out.api = ex[0].responseEnd - ex[0].startTime;
        } catch (er) { out.err = String(er && er.message || er); }
        selesai(out);
      }, true);
    });
  };
});

async function ukur(jenis, arg, klik) {
  await p.evaluate(([j, a]) => window.__siapkan(j, a), [jenis, arg]);
  if (typeof klik === 'string') await p.click(klik); else await klik();
  return p.evaluate(() => window.__hasil);
}
const urut = a => a.slice().sort((x, y) => x - y);
function statistik(xs) {
  if (!xs.length) return null; const s = urut(xs), n = s.length;
  const med = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
  const p90 = s[Math.min(n - 1, Math.ceil(0.9 * n) - 1)];
  return { n, median: +med.toFixed(1), p90: +p90.toFixed(1), min: +s[0].toFixed(1), max: +s[n - 1].toFixed(1) };
}
/* combo app terbuka saat FOCUS: lepas fokus dulu (blur app menutup daftar setelah 180 ms), lalu klik → ketik → pilih item pertama */
async function pilihCombo(sel, ketik) {
  await p.evaluate(() => { const a = document.activeElement; if (a && a !== document.body && a.blur) a.blur(); }); await W(250);
  await p.click(sel); if (ketik) await p.type(sel, ketik); await W(250);
  await p.click(sel + ' ~ .combo-list .combo-item'); await W(150);
}
async function login(nama, pin) {
  await p.evaluate(() => keluar()); await W(300);
  await p.selectOption('#identPilih', nama); await p.fill('#identPin', pin); await p.click('text=Simpan & mulai');
  await p.waitForFunction((n) => S.ctx && S.ctx.user && S.ctx.user.nama === n, nama, { timeout: 15000 }); await tenang();
}

await p.goto(APP); await W(1500); await tenang();
await p.evaluate(() => window.__pasangToast());
await login('Manager', '1357');
const hasil = { meta: { browser: BROWSER, versi: b.version(), viewport: VIEWPORT, dpr: 2, reducedMotion: RM, cpuThrottle: CPU, reps: REPS, saveReps: SREPS, app: APP, waktu: new Date().toISOString() }, nav: {}, simpan: {} };
hasil.meta.prefersReducedMotion = await p.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
console.log('Bench UI ·', BROWSER, b.version(), '·', VIEWPORT.width + '×' + VIEWPORT.height, '@2x · prefers-reduced-motion:', hasil.meta.prefersReducedMotion, '· CPU throttle', CPU + '×');

/* ---------------- (b) simpan → toast ---------------- */
const tgl = (mundur) => { const d = new Date(); d.setDate(d.getDate() - mundur); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
/* PO besar untuk dipakai berulang (dibuat lewat RPC, tidak diukur) */
await p.evaluate(() => { tampil('home'); bukaMutasi('BELI_MASUK'); }); await tenang();
await pilihCombo('#rcvPartner');
const supNama = await p.evaluate(() => comboNama('rcvPartner'));
const po = await p.evaluate((s) => panggil('simpanPo', [{ supplier: s, topHari: 30, baris: [{ kode: 'RM-BP-KW', qty: 1000000, harga: 12000 }] }, S.ident]).then(r => ({ ok: true, r }), e => ({ ok: false, e: e.message })), supNama);
if (!po.ok) { console.log('GAGAL siapkan PO:', po.e, '(supplier ' + supNama + ')'); process.exit(1); }

const SIMPAN = [
  { naam: 'Penerimaan barang (dari PO, 1 baris)', tombol: '#btnSimpanRcv', ok: 'tersimpan', siap: async () => {
      await p.evaluate(() => { tampil('home'); bukaMutasi('BELI_MASUK'); }); await tenang();
      await pilihCombo('#rcvPartner'); await tenang();
      const opt = await p.$$eval('#rcvPoPilih option', o => o.map(x => x.value).filter(Boolean));
      await p.selectOption('#rcvPoPilih', opt[0]); await W(150);
      await p.fill('#rcvNoSJ', 'SJ/BENCH/' + Date.now().toString(36));
      await p.evaluate(() => { S.baris.rcv = S.baris.rcv.slice(0, 1); S.baris.rcv[0].qty = '500'; gambarBaris('rcv'); });
    } },
  { naam: 'Laporan shift (blowing + cutting)', tombol: '#btnSimpanShift', ok: 'Laporan shift tersimpan', siap: async (i) => {
      await p.evaluate(() => tampil('shift')); await tenang(); await p.evaluate(() => segShift('new')); await tenang();
      await p.fill('#shiftTanggal', tgl(Math.floor(i / 2))); await p.click('#shiftP' + (i % 2 + 1)); await W(100);
      await p.fill('#blowingOperator', 'Sri'); await p.keyboard.press('Enter'); await W(100);
      await p.fill('#cuttingOperator', 'Rina'); await p.keyboard.press('Enter'); await W(100);
      await pilihCombo('#cb-ambil-0', 'Biji Plastik KW');
      await p.evaluate(() => { S.baris.ambil[0].qty = '250'; gambarBaris('ambil'); ringkasShift(); });
      await (await p.$$('#blowingHasilLines input'))[0].fill('240'); await (await p.$$('#blowingBsLines input'))[0].fill('20');
      await (await p.$$('#cuttingRollLines input'))[0].fill('236'); await (await p.$$('#cuttingHasilLines input'))[0].fill('235'); await (await p.$$('#cuttingBsLines input'))[0].fill('1');
      await W(150);
    } },
  { naam: 'Sales order (1 baris)', tombol: '#btnSimpanSo', ok: 'SO tersimpan', siap: async () => {
      await p.evaluate(() => { tampil('so'); segSo('baru'); }); await tenang();
      await pilihCombo('#soCustomer');
      await pilihCombo('#cb-so-0', 'Polybag KW');
      await p.evaluate(() => { S.baris.so[0].qty = '100'; S.baris.so[0].harga = '25000'; S.baris.so[0].ukuran = '30 x 50'; gambarBaris('so'); });
      await W(150);
    } },
];
for (const s of SIMPAN) {
  const ms = [], api = [], rnd = [], rinci = [];
  for (let i = 0; i <= SREPS; i++) {        /* i = 0 → pemanasan, tidak dihitung */
    await s.siap(i); await tenang();
    const r = await ukur('toast', s.ok, s.tombol);
    rinci.push(r);
    if (r.err) { console.log('  ✗', s.naam, '#' + i, r.err); errs.push('SIMPAN ' + s.naam + ': ' + r.err); await tenang(); continue; }
    if (i > 0) { ms.push(r.ms); rnd.push(r.render); if (r.api != null) api.push(r.api); }
    await tenang();
  }
  hasil.simpan[s.naam] = { ...statistik(ms), api: statistik(api), render: statistik(rnd), raw: ms.map(x => +x.toFixed(1)), contohToast: (rinci.find(r => r.toast) || {}).toast || '' };
}

/* ---------------- (a) pindah layar ---------------- */
const NAV = [
  { naam: 'Beranda (nav)', dari: '#nav-report', klik: '#nav-home', view: '#v-home' },
  { naam: 'Produksi (nav)', dari: '#nav-home', klik: '#nav-shift', view: '#v-shift' },
  { naam: 'Laporan (nav)', dari: '#nav-home', klik: '#nav-report', view: '#v-report' },
  { naam: 'Admin (nav)', dari: '#nav-home', klik: '#nav-admin', view: '#v-admin' },
  { naam: 'Barang keluar (tile beranda)', dari: '#nav-home', klik: () => p.locator('#v-home').getByRole('button', { name: /Barang keluar/ }).first().click(), view: '#v-beli' },
];
for (const n of NAV) {
  const ms = [], st = [], inp = [], js = [], rnd = [];
  for (let i = 0; i <= REPS; i++) {         /* i = 0 → pemanasan */
    await p.click(n.dari); await tenang(400);
    const r = await ukur('view', n.view, n.klik);
    if (r.err) { console.log('  ✗', n.naam, '#' + i, r.err); errs.push('NAV ' + n.naam + ': ' + r.err); continue; }
    if (i > 0) { ms.push(r.ms); st.push(r.settle); inp.push(r.input); rnd.push(r.render); if (r.js != null) js.push(r.js); }
  }
  await tenang();
  hasil.nav[n.naam] = { ...statistik(ms), js: statistik(js), render: statistik(rnd), settle: statistik(st), inputDelay: statistik(inp), raw: ms.map(x => +x.toFixed(1)) };
}

/* ---------------- laporan ---------------- */
const f = v => v == null ? '–' : String(Math.round(v * 10) / 10);
const pad = (s, w) => String(s).padEnd(w);
const med = o => f(o && o.median);
console.log('\n(a) pindah layar — klik → frame pertama dengan view terlihat selesai dilukis (ms), ' + REPS + '× (+1 pemanasan)');
console.log('   js = klik → handler app selesai · render = style+layout+paint frame itu · settle = + animasi CSS selesai (median)');
console.log('  ' + pad('aksi', 31) + pad('median', 8) + pad('p90', 8) + pad('min', 8) + pad('max', 8) + pad('js', 7) + pad('render', 8) + 'settle med/p90');
for (const [k, v] of Object.entries(hasil.nav)) console.log('  ' + pad(k, 31) + pad(f(v.median), 8) + pad(f(v.p90), 8) + pad(f(v.min), 8) + pad(f(v.max), 8) + pad(med(v.js), 7) + pad(med(v.render), 8) + med(v.settle) + ' / ' + f(v.settle && v.settle.p90));
console.log('\n(b) simpan — klik tombol simpan → toast sukses dilukis (ms), ' + SREPS + '× (+1 pemanasan); api = POST /exec simpan (median/p90)');
console.log('  ' + pad('aksi', 39) + pad('median', 8) + pad('p90', 8) + pad('min', 8) + pad('max', 8) + pad('render', 8) + 'api med/p90');
for (const [k, v] of Object.entries(hasil.simpan)) console.log('  ' + pad(k, 39) + pad(f(v.median), 8) + pad(f(v.p90), 8) + pad(f(v.min), 8) + pad(f(v.max), 8) + pad(med(v.render), 8) + med(v.api) + ' / ' + f(v.api && v.api.p90));
const errAsli = errs.filter(e => !/404/.test(e));
console.log('\nERRORS:', errAsli.length ? errAsli : 'tidak ada');
console.log('Permintaan ke luar 127.0.0.1 (diblok):', luar.size ? [...luar] : 'tidak ada');
hasil.errors = errAsli; hasil.diblok = [...luar];
if (ENV.BENCH_JSON) { writeFileSync(ENV.BENCH_JSON, JSON.stringify(hasil, null, 2)); console.log('JSON:', ENV.BENCH_JSON); }
await b.close();
process.exit(errAsli.length ? 1 : 0);
