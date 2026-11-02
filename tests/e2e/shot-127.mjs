import { chromium, devices } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ ...devices['Pixel 7'] }); const p = await ctx.newPage(); const W = ms => p.waitForTimeout(ms);
await p.goto('http://127.0.0.1:8090/'); await W(1500);
await p.selectOption('#identPilih', 'Yansen'); await p.fill('#identPin', '2211'); await p.tap('text=Simpan & mulai'); await W(2500);
await p.evaluate(() => { tampil('beli'); bukaMutasi('BELI_MASUK'); }); await W(1000);
await p.evaluate(() => document.getElementById('rcvPhoto').scrollIntoView({block:'center'})); await p.tap('#rcvPhoto'); await W(400);
await p.screenshot({ path: '/home/claude/s127-sumber.png' });
await b.close();
