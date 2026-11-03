import { chromium, devices } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ ...devices['Pixel 7'] });
const p = await ctx.newPage();
const errs=[]; p.on('pageerror', e => errs.push('PAGEERROR '+e.message));
const nav=[]; p.on('framenavigated', f => { if (f === p.mainFrame()) nav.push(f.url()); });
const W = ms => p.waitForTimeout(ms);
await p.goto('http://127.0.0.1:8090/'); await W(1500);
await p.selectOption('#identPilih', 'Deny'); await p.fill('#identPin', '3322'); await p.tap('text=Simpan & mulai'); await W(2500);
const st = async (label) => { const s = await p.evaluate(() => ({ view: S.view, vis: [...document.querySelectorAll('section[id^="v-"]')].filter(x=>!x.classList.contains('hide')).map(x=>x.id).join(','), form: !!document.getElementById('btnSimpanSo'), soTab: S.soTab, y: Math.round(scrollY), toast: [...document.querySelectorAll('.toast')].map(x=>x.textContent).join(' | ') })); console.log(label.padEnd(40), JSON.stringify(s)); };
async function formSo(n, kosongHarga){
  await p.tap('#tileSo').catch(()=>p.evaluate(()=>tampil('so'))); await W(800);
  await p.evaluate(() => segSo('baru')); await W(700);
  await st('form dibuka');
  await p.tap('#soCustomer'); await W(200); await p.tap('#soCustomer ~ .combo-list .combo-item'); await W(200);
  await st('setelah pilih customer');
  for (let i = 0; i < n; i++) {
    if (i > 0) { await p.evaluate(() => [...document.querySelectorAll('#soBody button')].find(b=>b.textContent.trim()==='+ Item').scrollIntoView({block:'center'})); await p.tap('#soBody button:has-text("+ Item")'); await W(100); }
    await p.evaluate((i) => document.getElementById('cb-so-'+i).scrollIntoView({block:'center'}), i);
    await p.tap('#cb-so-' + i); await p.type('#cb-so-' + i, 'Polybag KW'); await W(200); await p.tap('#cb-so-' + i + ' ~ .combo-list .combo-item'); await W(100);
    if (i === 0) await st('setelah pilih item #1');
    if (i===0) console.log('combo', await p.evaluate(() => ({ kode: document.getElementById('cb-so-0').dataset.kode, val: document.getElementById('cb-so-0').value, listHidden: document.querySelector('#cb-so-0 ~ .combo-list').classList.contains('hide'), btns: [...document.querySelectorAll('#soBody button')].map(b=>b.textContent.trim()).join('|') })));
    const v = await p.evaluate(() => S.view); if (v !== 'so') { console.log('!!! PINDAH HALAMAN ke', v, 'setelah pilih item baris', i+1); }
    const nums = await (await p.$$('#soLines .line'))[i].$$('input[type=number]');
    await nums[0].fill(String(25 + i)); if (i !== kosongHarga) await nums[1].fill('20000');
  }
}
await formSo(18, 7);
await st('sebelum simpan');
await p.evaluate(() => document.getElementById('btnSimpanSo').scrollIntoView({block:'center'})); await p.tap('#btnSimpanSo'); await W(1500);
await st('A: 18 baris, #8 tanpa harga (tap)');
await W(3000); await st('A +3s');
// server rejection: fix price then make server fail
const nums8 = await (await p.$$('#soLines .line'))[7].$$('input[type=number]'); await nums8[1].fill('20000');
await p.evaluate(() => { const asli = window.panggil; window.__asli = asli; window.panggil = function(fn, args){ if (fn==='simpanSo') return Promise.reject(new Error('Server menolak (uji)')); return asli.apply(this, arguments); }; });
await p.evaluate(() => document.getElementById('btnSimpanSo').scrollIntoView({block:'center'})); await p.tap('#btnSimpanSo'); await W(1500);
await st('B: server menolak');
await W(3000); await st('B +3s');
await p.evaluate(() => { window.panggil = window.__asli; });
// tanggal kirim kosong
await p.fill('#soKirim', ''); await p.evaluate(() => document.getElementById('btnSimpanSo').scrollIntoView({block:'center'})); await p.tap('#btnSimpanSo'); await W(1500);
await st('C: tanggal kirim kosong');
// a line with item but no qty
await p.fill('#soKirim', '2026-10-30');
const n3 = await (await p.$$('#soLines .line'))[2].$$('input[type=number]'); await n3[0].fill('');
await p.evaluate(() => document.getElementById('btnSimpanSo').scrollIntoView({block:'center'})); await p.tap('#btnSimpanSo'); await W(1500);
await st('D: baris #3 qty kosong');
await n3[0].fill('30');
// press Enter on keyboard in qty field
await n3[0].focus(); await p.keyboard.press('Enter'); await W(1200);
await st('E: Enter di qty');
console.log('navigations', nav, 'errs', errs);
await b.close();
