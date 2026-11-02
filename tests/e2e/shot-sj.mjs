import { chromium } from 'playwright';
const call=(fn,args)=>fetch('http://127.0.0.1:8787/exec',{method:'POST',body:JSON.stringify({fn,args,idKlien:'s'+Math.random()})}).then(r=>r.json());
const YS={nama:'Yansen',pin:'2211'};
const d=await call('daftarDokumen',[YS,'SJ']);
const aktif=d.data.filter(x=>x.status==='AKTIF');
console.log(aktif.map(x=>x.nomor+' '+x.pihak+' '+x.totalKg));
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const p=await b.newPage({viewport:{width:900,height:1100}});
for (const [i,x] of aktif.slice(0,2).entries()){ await p.goto('http://127.0.0.1:8787/dok/'+x.token); await p.waitForTimeout(500); await p.screenshot({path:'/home/claude/s129-sj'+i+'.png',fullPage:true}); }
await b.close();
