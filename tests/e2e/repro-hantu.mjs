import { chromium, devices } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ ...devices['Pixel 7'] });
const p = await ctx.newPage(); const W = ms => p.waitForTimeout(ms);
await p.goto('http://127.0.0.1:8090/'); await W(1500);
await p.selectOption('#identPilih', 'Deny'); await p.fill('#identPin', '3322'); await p.tap('text=Simpan & mulai'); await W(2500);
await p.evaluate(() => { tampil('so'); segSo('baru'); }); await W(800);
let pindah = 0, total = 0;
for (let i = 0; i < 6; i++) {
  await p.evaluate(() => { tampil('so'); segSo('baru'); }); await W(500);
  for (let k = 0; k < i; k++) await p.evaluate(() => tambahBaris('so'));
  await W(150);
  const vh = await p.evaluate(() => innerHeight);
  // put this line's search box ~170px above the bottom edge so the dropdown hangs over the bottom menu
  await p.evaluate(([i, vh]) => { const el = document.getElementById('cb-so-'+i); const r = el.getBoundingClientRect(); scrollBy(0, r.top - (vh - 170)); }, [i, vh]);
  await W(150);
  await p.tap('#cb-so-' + i); await W(250);
  const items = await p.$$('#cb-so-' + i + ' ~ .combo-list .combo-item');
  const navTop = await p.evaluate(() => document.getElementById('nav-home').getBoundingClientRect().top);
  let target = null;
  for (const it of items) { const bb = await it.boundingBox(); if (bb && bb.y + bb.height/2 > navTop + 5 && bb.y + bb.height/2 < vh - 5) { target = bb; break; } }
  if (!target) { console.log('baris', i+1, 'daftar tidak menutupi menu bawah'); continue; }
  total++;
  await p.touchscreen.tap(target.x + target.width/2, target.y + target.height/2); await W(600);
  const v = await p.evaluate(() => S.view);
  if (v !== 'so') { pindah++; console.log('baris', i+1, '→ PINDAH ke halaman', v); }
  else console.log('baris', i+1, '→ tetap di SO, item terpilih:', await p.evaluate((i) => document.getElementById('cb-so-'+i).value, i));
}
console.log('HASIL: pindah halaman', pindah, 'dari', total, 'pilihan');
await b.close();
