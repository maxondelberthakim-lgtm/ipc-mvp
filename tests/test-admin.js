const fs=require('fs');
let src=fs.readFileSync(__dirname+'/harness.js','utf8').replace("return 'max@eramas.co.id';","return '';");
fs.writeFileSync(__dirname + '/.h3.js', src);
const {ctx}=require(__dirname + '/.h3.js');
let pass=0,fail=0;
const ok=(l,c,e)=>{c?(pass++,console.log('  ✓',l)):(fail++,console.log('  ✗',l,JSON.stringify(e)))};
function tolak(label, fn, pola){ let e=''; try{ fn(); }catch(x){ e=String(x.message||x); } ok(label, pola.test(e), e); }
ctx.setupSistem();
const ANTO={nama:'Pak Anto',pin:'1111'}, YANTO={nama:'Yanto',pin:'2222'};

console.log('— SKU: tambah / ubah / hapus —');
tolak('staf tidak boleh', ()=>ctx.daftarSku(YANTO), /Supervisor/);
const n0 = ctx.daftarSku(ANTO).length;
const r1 = ctx.simpanSku({kode:'rm pistachio', nama:'Pistachio Mentah', kategori:'BAHAN_BAKU', harga:320000, awalGBJ:50}, ANTO);
ok('kode dinormalisasi', r1.kode==='RM-PISTACHIO', r1);
ok('SKU bertambah 1', ctx.daftarSku(ANTO).length===n0+1);
ok('muncul di dropdown', ctx.getKonteks(ANTO).items.some(i=>i.kode==='RM-PISTACHIO'));
ok('stok awal ikut', ctx.laporanStok(ANTO).daftar.find(s=>s.kode==='RM-PISTACHIO').gbj===50);
ok('harga tampil ke supervisor', ctx.daftarSku(ANTO).find(s=>s.kode==='RM-PISTACHIO').harga===320000);
tolak('kode dobel ditolak', ()=>ctx.simpanSku({kode:'RM-PISTACHIO', nama:'X', kategori:'BAHAN_BAKU'}, ANTO), /sudah ada/);
tolak('kode aneh ditolak', ()=>ctx.simpanSku({kode:'a', nama:'X'}, ANTO), /Kode/);
const b = ctx.daftarSku(ANTO).find(s=>s.kode==='RM-PISTACHIO').baris;
ctx.simpanSku({baris:b, kode:'RM-PISTACHIO', nama:'Pistachio Mentah Iran', kategori:'BAHAN_BAKU', harga:330000, awalGBJ:50, awalGP:0}, ANTO);
ok('ubah nama', ctx.daftarSku(ANTO).find(s=>s.kode==='RM-PISTACHIO').nama==='Pistachio Mentah Iran');
// belum dipakai -> hapus beneran
const h1 = ctx.hapusSku('RM-PISTACHIO', ANTO);
ok('belum dipakai -> dihapus beneran', h1.dihapus===true && !ctx.daftarSku(ANTO).some(s=>s.kode==='RM-PISTACHIO'), h1);
// sudah dipakai -> nonaktif
ctx.simpanPenerimaan({jenis:'MASUK',supplier:'X',noSuratJalan:'A',baris:[{kode:'RM-ALM-NP',qty:10}],ident:YANTO});
const h2 = ctx.hapusSku('RM-ALM-NP', ANTO);
ok('sudah dipakai -> dinonaktifkan, bukan dihapus', h2.dinonaktifkan===true && ctx.daftarSku(ANTO).find(s=>s.kode==='RM-ALM-NP').aktif===false, h2);
ok('nonaktif hilang dari dropdown', !ctx.getKonteks(ANTO).items.some(i=>i.kode==='RM-ALM-NP'));
ok('riwayat stok tetap utuh', ctx.laporanStok(ANTO).daftar.find(s=>s.kode==='RM-ALM-NP').beli===10);
tolak('ganti kode SKU yang sudah dipakai ditolak', ()=>ctx.simpanSku({baris:ctx.daftarSku(ANTO).find(s=>s.kode==='RM-ALM-NP').baris, kode:'RM-ALM-X', nama:'Almond', kategori:'BAHAN_BAKU'}, ANTO), /sudah dipakai/);

console.log('\n— Stock opname —');
ctx.simpanPenerimaan({jenis:'MASUK',supplier:'X',noSuratJalan:'B',baris:[{kode:'RM-CSW-W240',qty:1000}],ident:YANTO});
ctx.simpanTransfer({arah:'GBJ_KE_GP',baris:[{kode:'RM-CSW-W240',qty:300}],ident:YANTO});
tolak('staf tidak boleh opname', ()=>ctx.siapkanOpname('GBJ', YANTO), /Supervisor/);
const prep = ctx.siapkanOpname('GBJ', ANTO);
ok('daftar item GBJ dengan stok sistem', prep.items.find(i=>i.kode==='RM-CSW-W240').sistem===700, prep.items.find(i=>i.kode==='RM-CSW-W240'));
ok('item nonaktif tidak ikut', !prep.items.some(i=>i.kode==='RM-ALM-NP'));
// fisik: mete 688 (kurang 12), W320 tidak dihitung (kosong), sacha inchi seed 20 (lebih 20 — ada stok tak tercatat)
const o = ctx.simpanOpname({lokasi:'GBJ', baris:[
  {kode:'RM-CSW-W240', fisik:688, catatan:'karung sobek'},
  {kode:'RM-CSW-W320', fisik:''},
  {kode:'RM-SI-SEED', fisik:20}
], catatan:'opname bulanan'}, ANTO);
ok('2 item dicatat (yang kosong dilewati)', o.jumlahItem===2, o);
ok('kurang 12, lebih 20, bersih +8', o.kurang===12 && o.lebih===20 && o.selisih===8, o);
const st = ctx.laporanStok(ANTO);
ok('stok GBJ mete jadi 688 (= fisik)', st.daftar.find(s=>s.kode==='RM-CSW-W240').gbj===688);
ok('penyesuaian tercatat di neraca', st.daftar.find(s=>s.kode==='RM-CSW-W240').opnameGBJ===-12);
ok('sacha inchi muncul dari 0 jadi 20', st.daftar.find(s=>s.kode==='RM-SI-SEED').gbj===20);
ok('GP tidak tersentuh', st.daftar.find(s=>s.kode==='RM-CSW-W240').gp===300);
// neraca tetap konsisten
const m = st.daftar.find(s=>s.kode==='RM-CSW-W240');
ok('rumus GBJ + opname = saldo', Math.abs((m.awalGBJ + m.beli - m.retur + m.returCust - m.jual - m.keGP + m.keGBJ + m.opnameGBJ) - m.gbj) < 0.01);
// opname GP
const o2 = ctx.simpanOpname({lokasi:'GP', baris:[{kode:'RM-CSW-W240', fisik:295}]}, ANTO);
ok('opname GP: kurang 5', o2.kurang===5);
ok('GP jadi 295', ctx.laporanStok(ANTO).daftar.find(s=>s.kode==='RM-CSW-W240').gp===295);
// opname kedua di GBJ: sistem sekarang 688
ok('siapkanOpname pakai stok terbaru', ctx.siapkanOpname('GBJ', ANTO).items.find(i=>i.kode==='RM-CSW-W240').sistem===688);
const rw = ctx.riwayatOpname(90, ANTO);
ok('riwayat: 2 sesi, terbaru dulu', rw.length===2 && rw[0].lokasi==='GP' && rw[1].jumlahItem===2, rw.map(x=>[x.lokasi,x.jumlahItem]));
ok('riwayat sesi simpan catatan per item', rw[1].item.find(i=>i.kode==='RM-CSW-W240').catatan==='karung sobek');
tolak('fisik negatif ditolak', ()=>ctx.simpanOpname({lokasi:'GBJ', baris:[{kode:'RM-CSW-W240', fisik:-1}]}, ANTO), /negatif/);
tolak('semua kosong ditolak', ()=>ctx.simpanOpname({lokasi:'GBJ', baris:[{kode:'RM-CSW-W240', fisik:''}]}, ANTO), /Belum ada item/);
const kal = ctx.kalender(null, ANTO);
ok('opname muncul di kalender', kal.hari.some(h=>h.kejadian.some(e=>e.jenis==='OPNAME')));
ok('aktivitas staf hitung opname', ctx.aktivitasStaf('Pak Anto',30,ANTO).daftar[0].jenis.OPNAME===3, ctx.aktivitasStaf('Pak Anto',30,ANTO).daftar[0].jenis);

fs.unlinkSync(__dirname + '/.h3.js');
console.log('\n================ '+pass+' lulus, '+fail+' gagal ================');
process.exit(fail?1:0);
