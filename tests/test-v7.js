/* v7: PO, penerimaan vs PO, retur dari penerimaan, invoice, HPP FIFO, barang rusak, standar susut */
const fs=require('fs');
let src=fs.readFileSync(__dirname+'/harness.js','utf8').replace("return 'pemilik@contoh.co.id';","return '';");
fs.writeFileSync(__dirname + '/.h7.js', src);
const {ctx}=require(__dirname + '/.h7.js');
let pass=0,fail=0;
const ok=(l,c,e)=>{c?(pass++,console.log('  ✓',l)):(fail++,console.log('  ✗',l,e===undefined?'':JSON.stringify(e)))};
function tolak(label, fn, pola){ let e=''; try{ fn(); }catch(x){ e=String(x.message||x); } ok(label, pola.test(e), e); }
ctx.setupSistem();
const SPV={nama:'Manager',pin:'1357'}, STAF={nama:'Staff Gudang',pin:'1111'}, DIR={nama:'Direktur',pin:'2468'};
const SUP='CV Mitra Mete Sulawesi';

console.log('— Migrasi skema —');
ok('migrasiSkema jalan tanpa error', /siap/.test(ctx.migrasiSkema()));
ok('sheet Pesanan_Pembelian ada', !!ctx.SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pesanan_Pembelian'));
ok('setting METODE_HPP = FIFO', ctx.getSetting_('METODE_HPP')==='FIFO');

console.log('\n— PO —');
tolak('staf tidak boleh buat PO', ()=>ctx.simpanPo({supplier:SUP,baris:[{kode:'RM-CSW-W240',qty:100,harga:1000}]},STAF), /Manager/);
tolak('PO tanpa harga ditolak', ()=>ctx.simpanPo({supplier:SUP,baris:[{kode:'RM-CSW-W240',qty:100}]},SPV), /Harga beli/);
const po1 = ctx.simpanPo({supplier:SUP, perkiraanDatang:'2026-09-20', baris:[
  {kode:'RM-CSW-W240', qty:1000, harga:180000, spesifikasi:'W240 grade A, kadar air < 5%'},
  {kode:'RM-CSW-W320', qty:500,  harga:170000, spesifikasi:'W320'} ]}, SPV);
ok('PO dibuat: 2 baris, nilai 265 jt', po1.ids.length===2 && po1.nilai===180000*1000+170000*500, po1);
ok('No PO format PO-YYMMDD-01', /^PO-\d{6}-01$/.test(po1.noPo), po1.noPo);
const po2 = ctx.simpanPo({supplier:SUP, baris:[{kode:'RM-CSW-W240', qty:200, harga:190000}]}, SPV);
ok('PO kedua nomor -02', /-02$/.test(po2.noPo));
const terbuka = ctx.poTerbuka(STAF);
ok('staf lihat 3 baris PO terbuka tanpa harga', terbuka.length===3 && terbuka[0].harga===undefined && terbuka.every(x=>x.status==='TERBUKA'), terbuka[0]);
ok('manager lihat harga di daftarPo', ctx.daftarPo(SPV)[0].harga>0);
const lineW240 = terbuka.find(x=>x.kode==='RM-CSW-W240' && x.qty===1000);
ok('spesifikasi ikut', /grade A/.test(lineW240.spesifikasi));

console.log('\n— Penerimaan vs PO —');
tolak('supplier beda dengan PO ditolak', ()=>ctx.simpanPenerimaan({jenis:'MASUK',supplier:'Lain',noSuratJalan:'SJ/1',baris:[{kode:'RM-CSW-W240',qty:400,idPo:lineW240.id}],ident:STAF}), /Supplier tidak sama/);
const rc1 = ctx.simpanPenerimaan({jenis:'MASUK',supplier:SUP,noSuratJalan:'SJ/1',catatanQc:'karung utuh, kadar air 4%',baris:[{kode:'RM-CSW-W240',qty:400,idPo:lineW240.id}],ident:STAF});
ok('penerimaan sebagian tersimpan', rc1.ok && rc1.totalKg===400 && rc1.tanpaPo===false, rc1);
let rowRc = ctx.baca_(ctx.SHEET.PENERIMAAN).find(r=>r.ID===rc1.ids[0]);
ok('harga batch = harga PO (180000)', rowRc.Harga_Per_Kg===180000 && rowRc.ID_PO===lineW240.id && /kadar air/.test(rowRc.Catatan_QC), rowRc);
let poRow = ctx.baca_(ctx.SHEET.PO).find(r=>r.ID===lineW240.id);
ok('PO: diterima 400, status SEBAGIAN', poRow.Qty_Diterima_Kg===400 && poRow.Status==='SEBAGIAN', poRow);
const rc2 = ctx.simpanPenerimaan({jenis:'MASUK',supplier:SUP,noSuratJalan:'SJ/2',baris:[{kode:'RM-CSW-W240',qty:600,idPo:lineW240.id}],ident:STAF});
poRow = ctx.baca_(ctx.SHEET.PO).find(r=>r.ID===lineW240.id);
ok('PO: diterima 1000, status SELESAI', poRow.Qty_Diterima_Kg===1000 && poRow.Status==='SELESAI');
ok('PO selesai hilang dari poTerbuka', !ctx.poTerbuka(STAF).some(x=>x.id===lineW240.id));
const rc3 = ctx.simpanPenerimaan({jenis:'MASUK',supplier:SUP,noSuratJalan:'SJ/3',baris:[{kode:'RM-CSW-W240',qty:100}],ident:STAF});
ok('penerimaan tanpa PO ditandai tanpaPo', rc3.tanpaPo===true);
ctx.setSetting_('WAJIB_PO','YA');
tolak('WAJIB_PO=YA: tanpa PO ditolak', ()=>ctx.simpanPenerimaan({jenis:'MASUK',supplier:SUP,noSuratJalan:'SJ/4',baris:[{kode:'RM-CSW-W240',qty:1}],ident:STAF}), /wajib merujuk PO/);
ctx.setSetting_('WAJIB_PO','TIDAK');
// batal penerimaan -> PO turun lagi
ctx.tinjauTransfer(rc2.ids[0],'batal','salah',SPV);
poRow = ctx.baca_(ctx.SHEET.PO).find(r=>r.ID===lineW240.id);
ok('penerimaan dibatalkan → PO diterima 400, SEBAGIAN lagi', poRow.Qty_Diterima_Kg===400 && poRow.Status==='SEBAGIAN', poRow);
tolak('ubah qty PO di bawah yang diterima ditolak', ()=>ctx.ubahPo(lineW240.id,{qty:300},SPV), /sudah diterima/);
ok('ubah qty PO ke 400 → SELESAI', (()=>{ ctx.ubahPo(lineW240.id,{qty:400},SPV); return ctx.baca_(ctx.SHEET.PO).find(r=>r.ID===lineW240.id).Status==='SELESAI'; })());
tolak('PO yang sudah ada penerimaan tidak bisa dibatalkan', ()=>ctx.batalkanPo(lineW240.id,'x',SPV), /sudah ada penerimaan/);
ok('PO tanpa penerimaan bisa dibatalkan', ctx.batalkanPo(po2.ids[0],'ganti supplier',SPV).ok && ctx.baca_(ctx.SHEET.PO).find(r=>r.ID===po2.ids[0]).Status==='DIBATALKAN');

console.log('\n— Retur hanya dari penerimaan —');
const rt = ctx.returTersedia(STAF, SUP);
ok('bisa diretur: RCV1 400 & RCV3 100 (RCV2 dibatalkan tidak muncul)', rt.length===2 && rt.every(x=>x.id!==rc2.ids[0]), rt);
const retur = ctx.simpanPenerimaan({jenis:'RETUR',supplier:SUP,baris:[{kode:'RM-CSW-W240',qty:50,idAsal:rc1.ids[0]}],catatan:'rusak',ident:STAF});
ok('retur 50 dari RCV1', retur.ok && ctx.baca_(ctx.SHEET.PENERIMAAN).find(r=>r.ID===retur.ids[0]).ID_Penerimaan_Asal===rc1.ids[0]);
ok('sisa RCV1 = 350', ctx.returTersedia(STAF, SUP).find(x=>x.id===rc1.ids[0]).sisa===350);
tolak('retur 351 ditolak', ()=>ctx.simpanPenerimaan({jenis:'RETUR',supplier:SUP,baris:[{kode:'RM-CSW-W240',qty:351,idAsal:rc1.ids[0]}],ident:STAF}), /melebihi/);
ok('stok GBJ W240 = 400+100-50 = 450', ctx.getKonteks(STAF).stok['RM-CSW-W240'].gbj===450);

console.log('\n— HPP FIFO —');
// Master W240 = 185000. Batch RCV1 @180000 (350 sisa), RCV3 tanpa PO harga 0 -> pakai cadangan (rata2 lapisan)
ctx.simpanTransfer({arah:'GBJ_KE_GP',baris:[{kode:'RM-CSW-W240',qty:300}],ident:STAF});
const nilai = ctx.laporanNilaiStok(SPV);
const w240 = nilai.daftar.find(x=>x.kode==='RM-CSW-W240');
ok('nilai stok: GP 300 kg @180000 (lapisan RCV1)', w240.gp.qty===300 && w240.gp.rata===180000, w240.gp);
ok('nilai stok: GBJ 150 kg (50 RCV1 + 100 RCV3)', w240.gbj.qty===150, w240.gbj);
tolak('staf tidak boleh lihat nilai stok', ()=>ctx.laporanNilaiStok(STAF), /Manager/);
const j1 = ctx.mulaiPekerjaan({kodeProduk:'FG-MM-CSW',bahanBaku:[{kode:'RM-CSW-W240',qty:250}],ident:STAF});
let jobRow = ctx.baca_(ctx.SHEET.PEKERJAAN).find(r=>r.ID===j1.id);
ok('HPP bahan job = 250 × 180000 (FIFO), bukan 185000 master', jobRow.HPP_Bahan===250*180000, jobRow.HPP_Bahan);
ok('detail harga per kg = 180000', ctx.baca_(ctx.SHEET.DETAIL).find(d=>d.ID_Pekerjaan===j1.id).Harga_Per_Kg===180000);
ctx.setSetting_('METODE_HPP','MASTER');
const j2 = ctx.mulaiPekerjaan({kodeProduk:'FG-MM-CSW',bahanBaku:[{kode:'RM-CSW-W240',qty:10}],ident:STAF});
ok('METODE_HPP=MASTER → harga master 185000', ctx.baca_(ctx.SHEET.PEKERJAAN).find(r=>r.ID===j2.id).HPP_Bahan===10*185000);
ctx.setSetting_('METODE_HPP','FIFO');
ctx.selesaikanPekerjaan({id:j1.id,barangJadi:[{kode:'FG-MM-CSW',qty:240}],scrapKg:2,ident:STAF});
jobRow = ctx.baca_(ctx.SHEET.PEKERJAAN).find(r=>r.ID===j1.id);
const hppKg = jobRow.HPP_Per_Kg;
ok('HPP/kg produk jadi = (45jt + 250×2500)/240', hppKg===Math.round((250*180000+250*2500)/240), hppKg);
ctx.simpanTransfer({arah:'GP_KE_GBJ',baris:[{kode:'FG-MM-CSW',qty:240}],ident:STAF});
const nilai2 = ctx.laporanNilaiStok(SPV).daftar.find(x=>x.kode==='FG-MM-CSW');
ok('produk jadi di GBJ dinilai HPP/kg pekerjaan', nilai2.gbj.qty===240 && Math.abs(nilai2.gbj.rata-hppKg)<=1, nilai2.gbj);
const jual = ctx.simpanPengiriman({jenis:'KELUAR',customer:'PT Ritel Nusantara',noSuratJalan:'DO/1',baris:[{kode:'FG-MM-CSW',qty:100}],ident:STAF});
ok('penjualan mencatat HPP_Per_Kg FIFO', Math.abs(ctx.baca_(ctx.SHEET.PENGIRIMAN).find(r=>r.ID===jual.ids[0]).HPP_Per_Kg-hppKg)<=1);

console.log('\n— Invoice & validasi (harga berubah → HPP dihitung ulang) —');
tolak('staf tidak bisa unggah invoice', ()=>ctx.simpanInvoice({noPo:po1.noPo,noInvoice:'INV-1',totalInvoice:1},STAF), /Manager/);
const rk = ctx.ringkasanPo(po1.noPo, SPV);
ok('ringkasan PO: diterima 400 kg, nilai diterima 72jt', rk.kgDiterima===400 && rk.nilaiDiterima===400*180000, rk);
const inv = ctx.simpanInvoice({noPo:po1.noPo,noInvoice:'INV-2026-001',tanggalInvoice:'2026-09-16',totalInvoice:400*182000,file:'data:image/jpeg;base64,xx'},SPV);
ok('invoice: selisih = 400×2000 = 800rb', inv.selisih===800000, inv);
ok('daftarInvoice MENUNGGU 1', ctx.daftarInvoice(SPV,'MENUNGGU').length===1);
const val = ctx.validasiInvoice(inv.id,'valid',{'RM-CSW-W240':182000},'harga naik sesuai invoice',SPV);
ok('valid + harga W240 diperbarui', val.status==='VALID' && val.hargaDiubah.length===1 && val.selisih===0, val);
ok('harga PO & batch RCV1 jadi 182000', ctx.baca_(ctx.SHEET.PO).find(r=>r.ID===lineW240.id).Harga_Per_Kg===182000 && ctx.baca_(ctx.SHEET.PENERIMAAN).find(r=>r.ID===rc1.ids[0]).Harga_Per_Kg===182000);
tolak('invoice tidak bisa divalidasi 2x', ()=>ctx.validasiInvoice(inv.id,'valid',null,'',SPV), /sudah VALID/);
const ulang = ctx.hitungUlangHpp(SPV);
jobRow = ctx.baca_(ctx.SHEET.PEKERJAAN).find(r=>r.ID===j1.id);
ok('hitungUlangHpp: job 1 HPP bahan jadi 250×182000', ulang.diubah>=1 && jobRow.HPP_Bahan===250*182000, [ulang, jobRow.HPP_Bahan]);
ok('HPP/kg ikut naik', jobRow.HPP_Per_Kg===Math.round((250*182000+250*2500)/240));

console.log('\n— Barang rusak —');
tolak('manager tidak boleh mencatat rusak', ()=>ctx.simpanKerusakan({lokasi:'GBJ',kode:'RM-CSW-W240',qty:5,penyebab:'basah',ident:SPV}), /STAF/);
tolak('tanpa penyebab ditolak', ()=>ctx.simpanKerusakan({lokasi:'GBJ',kode:'RM-CSW-W240',qty:5,ident:STAF}), /Penyebab/);
const dmg = ctx.simpanKerusakan({lokasi:'GBJ',kode:'RM-CSW-W240',qty:20,penyebab:'karung bocor kena hujan',ident:STAF});
ok('laporan rusak tersimpan MENUNGGU', dmg.ok && ctx.daftarKerusakan(STAF)[0].status==='MENUNGGU');
ok('stok belum berkurang sebelum disetujui', ctx.getKonteks(STAF).stok['RM-CSW-W240'].gbj===150);
ok('getKonteks spv: 1 laporan rusak menunggu', ctx.getKonteks(SPV).ringkasan.kerusakanMenunggu===1);
tolak('staf tidak bisa setujui', ()=>ctx.tinjauKerusakan(dmg.id,'setuju','',STAF), /Supervisor/);
const tk = ctx.tinjauKerusakan(dmg.id,'setuju','dicek langsung',SPV);
ok('disetujui: nilai kerugian FIFO > 0', tk.status==='DISETUJUI' && tk.nilaiKerugian>0, tk);
ok('stok GBJ turun 20 → 130', ctx.getKonteks(STAF).stok['RM-CSW-W240'].gbj===130);
ok('laporanStok punya kolom rusakGBJ=20', ctx.laporanStok(SPV).daftar.find(s=>s.kode==='RM-CSW-W240').rusakGBJ===20);
ok('staf lihat laporannya sendiri (DISETUJUI) tanpa nilai', (()=>{const d=ctx.daftarKerusakan(STAF,'DISETUJUI')[0]; return d && d.nilaiKerugian===undefined;})());
ok('spv lihat nilai kerugian', ctx.daftarKerusakan(SPV,'DISETUJUI')[0].nilaiKerugian===tk.nilaiKerugian);

console.log('\n— Standar susut per produk —');
ctx.selesaikanPekerjaan({id:j2.id,barangJadi:[{kode:'FG-MM-CSW',qty:9.4}],scrapKg:0.2,ident:STAF});   // susut 4%
const ss = ctx.laporanStandarSusut(90, SPV);
const p = ss.daftar.find(x=>x.kode==='FG-MM-CSW');
ok('2 pekerjaan FG-MM-CSW', p && p.jobs===2, p);
ok('rata-rata = (3.2 + 4)/2 = 3.6', p.rata===3.6, p.rata);
ok('rata tertimbang = (8+0.4)/(260)', p.rataTertimbang===Math.round(8.4/260*100*100)/100, p.rataTertimbang);
ok('min/maks', p.min===3.2 && p.maks===4);
ok('standar sekarang 4 ± 1.5 (dari master)', p.standarNormal===4 && p.standarToleransi===1.5);
tolak('staf tidak boleh lihat', ()=>ctx.laporanStandarSusut(90, STAF), /Supervisor/);
const ts = ctx.terapkanStandarSusut('FG-MM-CSW', p.saranNormal, p.saranToleransi, '', SPV);
ok('standar diterapkan', ts.ok && ctx.baca_(ctx.SHEET.STANDAR).find(r=>r.Kode_Produk==='FG-MM-CSW').Susut_Normal_Persen===p.saranNormal);
ok('produk baru tanpa standar → ditambah', ctx.terapkanStandarSusut('FG-JM-BBQ',5,2,'',SPV).ok && ctx.baca_(ctx.SHEET.STANDAR).some(r=>r.Kode_Produk==='FG-JM-BBQ' && r.Susut_Normal_Persen===5));

console.log('\n— FIFO: pekerjaan lewat tengah malam —');
{
  // mulai 23:30 hari H, selesai 01:00 hari H+1 → JOB_SELESAI harus diputar SETELAH JOB_MULAI (lapisan FG berharga, bukan Rp 0)
  const jm = ctx.mulaiPekerjaan({kodeProduk:'FG-MM-CSW', bahanBaku:[{kode:'RM-CSW-W240', qty:10}], ident:STAF});
  const rowJ = ctx.baca_(ctx.SHEET.PEKERJAAN).find(r=>r.ID===jm.id);
  const H = new Date(rowJ.Tanggal+'T23:30:00'), H1 = new Date(H.getTime()+90*60000);
  ctx.ubahBaris_(ctx.SHEET.PEKERJAAN, rowJ._baris, { Waktu_Mulai: H });
  ctx.selesaikanPekerjaan({id:jm.id, barangJadi:[{kode:'FG-MM-CSW', qty:9.6}], scrapKg:0.2, ident:STAF});
  const rowJ2 = ctx.baca_(ctx.SHEET.PEKERJAAN).find(r=>r.ID===jm.id);
  ctx.ubahBaris_(ctx.SHEET.PEKERJAAN, rowJ2._baris, { Waktu_Selesai: H1 });
  const f = ctx.hitungFifo_();
  const lapFG = (f.lapisan['FG-MM-CSW'] && f.lapisan['FG-MM-CSW'].GP || []).filter(l=>l.asal===jm.id);
  ok('lapisan FG dari job lewat tengah malam ada & berharga > 0', lapFG.length===1 && lapFG[0].harga>0, lapFG);
  ok('biaya job terhitung', (f.biaya[jm.id]||0) > 0, f.biaya[jm.id]);
}

console.log('\n— Kolom tanggal jadi Date di Sheets → dinormalkan ke YYYY-MM-DD —');
{
  const rowPo = ctx.baca_(ctx.SHEET.PO)[0];
  const tglAsli = rowPo.Tanggal;
  ctx.ubahBaris_(ctx.SHEET.PO, rowPo._baris, { Tanggal: new Date(tglAsli+'T00:00:00'), Perkiraan_Datang: new Date('2026-09-20T00:00:00') });
  const d = ctx.daftarPo(SPV,'SEMUA',365).find(x=>x.id===rowPo.ID);
  ok('daftarPo.tanggal tetap string YYYY-MM-DD', d.tanggal===tglAsli, d.tanggal);
  ok('perkiraanDatang string YYYY-MM-DD', d.perkiraanDatang==='2026-09-20', d.perkiraanDatang);
  const rowRc = ctx.baca_(ctx.SHEET.PENERIMAAN)[0];
  ctx.ubahBaris_(ctx.SHEET.PENERIMAAN, rowRc._baris, { Tanggal: new Date(rowRc.Tanggal+'T00:00:00') });
  const f = ctx.hitungFifo_();
  ok('FIFO tetap jalan dengan Tanggal Date (lapisan W240 ada)', !!(f.lapisan['RM-CSW-W240']), Object.keys(f.lapisan));
  ok('kunci event pakai YYYY-MM-DD', ctx.baca_(ctx.SHEET.PENERIMAAN)[0].Tanggal===rowRc.Tanggal);
}

console.log('\n— Baca semua sheet sekaligus (Sheets API batchGet) —');
{
  const rawRow = ctx.SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Penerimaan').rows[1];
  const rawWaktu = rawRow[ctx.HEADER['Penerimaan'].indexOf('Waktu')];
  ctx.lupakanMemo_(); ctx.__batchCalls = 0;
  const r1 = ctx.baca_(ctx.SHEET.PENERIMAAN)[0];
  ok('1 panggilan batchGet mengisi memo', ctx.__batchCalls===1, ctx.__batchCalls);
  ok('Waktu kembali sebagai Date dengan milidetik sama', Object.prototype.toString.call(r1.Waktu)==='[object Date]' && r1.Waktu.getTime()===rawWaktu.getTime(), [r1.Waktu, rawWaktu]);
  ok('Tanggal string YYYY-MM-DD', /^\d{4}-\d{2}-\d{2}$/.test(r1.Tanggal), r1.Tanggal);
  ok('Qty tetap angka', typeof r1.Qty_Kg==='number');
  ctx.baca_(ctx.SHEET.PO); ctx.baca_(ctx.SHEET.ITEM); ctx.baca_(ctx.SHEET.SETTING);
  ok('sheet lain dari memo, tanpa panggilan tambahan', ctx.__batchCalls===1, ctx.__batchCalls);
  ok('_baris sesuai nomor baris sheet', r1._baris===2, r1._baris);
  const n1 = ctx.baca_(ctx.SHEET.PENERIMAAN).length; ctx.lupakanMemo_(ctx.SHEET.PENERIMAAN); ctx.lupakanMemo_(); ctx.__batchCalls=0;
  const n2 = ctx.baca_(ctx.SHEET.PENERIMAAN).length;
  ok('jumlah baris batch = getValues', n1===n2 && n2>0, [n1,n2]);
  const f1 = ctx.hitungFifo_(); ctx.lupakanMemo_();
  ok('FIFO identik lewat jalur batch', JSON.stringify(f1.lapisan)===JSON.stringify(ctx.hitungFifo_().lapisan));
}

console.log('\n— doPost: idKlien idempoten (ulang kirim tidak dobel) —');
{
  const cacheMap = {};
  ctx.CacheService = { getScriptCache(){ return { get:k=>cacheMap[k]||null, put:(k,v)=>{ cacheMap[k]=v; } }; } };
  ctx.ContentService = { MimeType:{JSON:'json'}, createTextOutput(t){ return { _t:t, setMimeType(){ return this; } }; } };
  const nPo = ctx.baca_(ctx.SHEET.PO).length;
  const body = JSON.stringify({ fn:'simpanPo', idKlien:'abc-123', args:[{supplier:SUP, baris:[{kode:'RM-CSW-W240', qty:7, harga:1000}]}, SPV] });
  const r1 = JSON.parse(ctx.doPost({ postData:{ contents: body } })._t);
  const r2 = JSON.parse(ctx.doPost({ postData:{ contents: body } })._t);
  ok('panggilan pertama sukses', r1.ok && r1.data.noPo, r1);
  ok('ulang dengan idKlien sama -> hasil sama, PO tidak dibuat dua kali', r2.ok && r2.data.noPo===r1.data.noPo && ctx.baca_(ctx.SHEET.PO).length===nPo+1, [r2, ctx.baca_(ctx.SHEET.PO).length-nPo]);
  const r3 = JSON.parse(ctx.doPost({ postData:{ contents: JSON.stringify({ fn:'simpanPo', idKlien:'abc-124', args:[{supplier:SUP, baris:[{kode:'RM-CSW-W240', qty:7, harga:1000}]}, SPV] }) } })._t);
  ok('idKlien beda -> PO baru', r3.ok && r3.data.noPo!==r1.data.noPo && ctx.baca_(ctx.SHEET.PO).length===nPo+2);
  const r4 = JSON.parse(ctx.doPost({ postData:{ contents: JSON.stringify({ fn:'hitungFifo_', args:[] }) } })._t);
  ok('fungsi di luar daftar putih ditolak', !r4.ok && /tidak dikenal/.test(r4.error));
  const r5 = JSON.parse(ctx.doPost({ postData:{ contents: JSON.stringify({ fn:'simpanPo', idKlien:'x', args:[{supplier:SUP, baris:[]}, SPV] }) } })._t);
  ok('error tidak di-cache (ulang tetap error, bukan hasil lama)', !r5.ok && /Item PO/.test(r5.error) && cacheMap['rq:x']===undefined);
}

console.log('\n— Laporan stok: rincian neraca = saldo (termasuk barang rusak) —');
{
  const ls = ctx.laporanStok(SPV);
  let cocok = true, adaRusak = false;
  ls.daftar.forEach(s => {
    const gbj = s.awalGBJ + s.beli + s.returCust + s.keGBJ - s.retur - s.jual - s.keGP - s.rusakGBJ + s.opnameGBJ;
    const gp  = s.awalGP + s.keGP + s.dihasilkan - s.keGBJ - s.dipakai - s.rusakGP + s.opnameGP;
    if (Math.abs(gbj - s.gbj) > 0.01 || Math.abs(gp - s.gp) > 0.01) { cocok = false; console.log('   beda:', s.kode, gbj, s.gbj, gp, s.gp); }
    if (s.rusakGBJ || s.rusakGP) adaRusak = true;
  });
  ok('setiap baris neraca menjumlah tepat ke saldo GBJ & GP', cocok);
  ok('ada item dengan barang rusak disetujui di laporan', adaRusak);
  ok('total rusak ikut di ringkasan', ls.total.rusak > 0, ls.total);
}

fs.unlinkSync(__dirname + '/.h7.js');
console.log('\n================ '+pass+' lulus, '+fail+' gagal ================');
process.exit(fail?1:0);
