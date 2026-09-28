/* v7 (diperbarui v10): PO + TOP, penerimaan vs PO, retur dari penerimaan, invoice, HPP rata-rata, barang rusak, batchGet, doPost idempoten */
const fs=require('fs');
let src=fs.readFileSync(__dirname+'/harness.js','utf8').replace("return 'pemilik@contoh.co.id';","return '';");
fs.writeFileSync(__dirname + '/.h7.js', src);
const {ctx}=require(__dirname + '/.h7.js');
let pass=0,fail=0;
const ok=(l,c,e)=>{c?(pass++,console.log('  ✓',l)):(fail++,console.log('  ✗',l,e===undefined?'':JSON.stringify(e)))};
function tolak(label, fn, pola){ let e=''; try{ fn(); }catch(x){ e=String(x.message||x); } ok(label, pola.test(e), e); }
ctx.setupSistem();
const SPV={nama:'Manager',pin:'1357'}, STAF={nama:'Staff Gudang',pin:'1111'}, DIR={nama:'Direktur',pin:'2468'};
const SUP='PT Sumber Biji Plastik', KW='RM-BP-KW', SUPR='RM-BP-SUP';

console.log('— Migrasi skema —');
ok('migrasiSkema jalan tanpa error', /siap/.test(ctx.migrasiSkema()));
ok('sheet Pesanan_Pembelian ada', !!ctx.SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pesanan_Pembelian'));
ok('setting METODE_HPP = RATA (v10)', ctx.getSetting_('METODE_HPP')==='RATA');
ok('header PO & SO punya TOP_Hari & Jatuh_Tempo', ctx.HEADER['Pesanan_Pembelian'].indexOf('TOP_Hari')>=0 && ctx.HEADER['Sales_Order'].indexOf('Jatuh_Tempo')>=0);

console.log('\n— PO + TOP —');
tolak('staf tidak boleh buat PO', ()=>ctx.simpanPo({supplier:SUP,baris:[{kode:KW,qty:100,harga:1000}]},STAF), /Manager/);
tolak('PO tanpa harga ditolak', ()=>ctx.simpanPo({supplier:SUP,baris:[{kode:KW,qty:100}]},SPV), /Harga beli/);
tolak('TOP > 365 ditolak', ()=>ctx.simpanPo({supplier:SUP,topHari:400,baris:[{kode:KW,qty:100,harga:1000}]},SPV), /TOP maksimal/);
const po1 = ctx.simpanPo({supplier:SUP, perkiraanDatang:'2026-09-20', topHari:30, baris:[
  {kode:KW, qty:1000, harga:12000, spesifikasi:'KW hitam, MFI 0.3–0.5'},
  {kode:SUPR, qty:500,  harga:15000, spesifikasi:'Super bening'} ]}, SPV);
ok('PO dibuat: 2 baris, nilai 19,5 jt', po1.ids.length===2 && po1.nilai===12000*1000+15000*500, po1);
ok('No PO format PO-YYMMDD-01', /^PO-\d{6}-01$/.test(po1.noPo), po1.noPo);
const po1Row = ctx.baca_(ctx.SHEET.PO).find(r=>r.ID===po1.ids[0]);
ok('TOP 30 hari, jatuh tempo = perkiraan datang + 30 = 2026-10-20', po1Row.TOP_Hari===30 && po1Row.Jatuh_Tempo==='2026-10-20', [po1Row.TOP_Hari, po1Row.Jatuh_Tempo]);
const po2 = ctx.simpanPo({supplier:SUP, baris:[{kode:KW, qty:200, harga:12500}]}, SPV);
ok('PO kedua nomor -02, TOP default 0 = tunai, jatuh tempo = tanggal PO', /-02$/.test(po2.noPo) && ctx.baca_(ctx.SHEET.PO).find(r=>r.ID===po2.ids[0]).TOP_Hari===0 && ctx.baca_(ctx.SHEET.PO).find(r=>r.ID===po2.ids[0]).Jatuh_Tempo===ctx.tglStr_(new Date()));
const terbuka = ctx.poTerbuka(STAF);
ok('staf lihat 3 baris PO terbuka tanpa harga', terbuka.length===3 && terbuka[0].harga===undefined && terbuka.every(x=>x.status==='TERBUKA'), terbuka[0]);
const dPo = ctx.daftarPo(SPV);
ok('manager lihat harga, topHari & jatuhTempo di daftarPo', dPo[0].harga>0 && dPo.some(x=>x.topHari===30 && x.jatuhTempo==='2026-10-20'), dPo[0]);
const lineKW = terbuka.find(x=>x.kode===KW && x.qty===1000);
ok('spesifikasi ikut', /MFI/.test(lineKW.spesifikasi));
ok('ubah TOP PO → jatuh tempo ikut', (()=>{ const r=ctx.ubahPo(lineKW.id,{topHari:45},SPV); const row=ctx.baca_(ctx.SHEET.PO).find(x=>x.ID===lineKW.id); return r.ok && row.TOP_Hari===45 && row.Jatuh_Tempo==='2026-11-04'; })());

console.log('\n— Penerimaan vs PO —');
tolak('supplier beda dengan PO ditolak', ()=>ctx.simpanPenerimaan({jenis:'MASUK',supplier:'Lain',noSuratJalan:'SJ/1',baris:[{kode:KW,qty:400,idPo:lineKW.id}],ident:STAF}), /Supplier tidak sama/);
const rc1 = ctx.simpanPenerimaan({jenis:'MASUK',supplier:SUP,noSuratJalan:'SJ/1',catatanQc:'karung utuh',baris:[{kode:KW,qty:400,idPo:lineKW.id}],ident:STAF});
ok('penerimaan sebagian tersimpan', rc1.ok && rc1.totalKg===400 && rc1.tanpaPo===false, rc1);
let rowRc = ctx.baca_(ctx.SHEET.PENERIMAAN).find(r=>r.ID===rc1.ids[0]);
ok('harga batch = harga PO (12000)', rowRc.Harga_Per_Kg===12000 && rowRc.ID_PO===lineKW.id && /karung/.test(rowRc.Catatan_QC), rowRc);
let poRow = ctx.baca_(ctx.SHEET.PO).find(r=>r.ID===lineKW.id);
ok('PO: diterima 400, status SEBAGIAN', poRow.Qty_Diterima_Kg===400 && poRow.Status==='SEBAGIAN', poRow);
const rc2 = ctx.simpanPenerimaan({jenis:'MASUK',supplier:SUP,noSuratJalan:'SJ/2',baris:[{kode:KW,qty:600,idPo:lineKW.id}],ident:STAF});
poRow = ctx.baca_(ctx.SHEET.PO).find(r=>r.ID===lineKW.id);
ok('PO: diterima 1000, status SELESAI', poRow.Qty_Diterima_Kg===1000 && poRow.Status==='SELESAI');
ok('PO selesai hilang dari poTerbuka', !ctx.poTerbuka(STAF).some(x=>x.id===lineKW.id));
const rc3 = ctx.simpanPenerimaan({jenis:'MASUK',supplier:SUP,noSuratJalan:'SJ/3',baris:[{kode:KW,qty:100}],ident:STAF});
ok('penerimaan tanpa PO ditandai tanpaPo', rc3.tanpaPo===true);
ctx.setSetting_('WAJIB_PO','YA');
tolak('WAJIB_PO=YA: tanpa PO ditolak', ()=>ctx.simpanPenerimaan({jenis:'MASUK',supplier:SUP,noSuratJalan:'SJ/4',baris:[{kode:KW,qty:1}],ident:STAF}), /wajib merujuk PO/);
ctx.setSetting_('WAJIB_PO','TIDAK');
ctx.tinjauTransfer(rc2.ids[0],'batal','salah',SPV);
poRow = ctx.baca_(ctx.SHEET.PO).find(r=>r.ID===lineKW.id);
ok('penerimaan dibatalkan → PO diterima 400, SEBAGIAN lagi', poRow.Qty_Diterima_Kg===400 && poRow.Status==='SEBAGIAN', poRow);
tolak('ubah qty PO di bawah yang diterima ditolak', ()=>ctx.ubahPo(lineKW.id,{qty:300},SPV), /sudah diterima/);
ok('ubah qty PO ke 400 → SELESAI', (()=>{ ctx.ubahPo(lineKW.id,{qty:400},SPV); return ctx.baca_(ctx.SHEET.PO).find(r=>r.ID===lineKW.id).Status==='SELESAI'; })());
tolak('PO yang sudah ada penerimaan tidak bisa dibatalkan', ()=>ctx.batalkanPo(lineKW.id,'x',SPV), /sudah ada penerimaan/);
ok('PO tanpa penerimaan bisa dibatalkan', ctx.batalkanPo(po2.ids[0],'ganti supplier',SPV).ok && ctx.baca_(ctx.SHEET.PO).find(r=>r.ID===po2.ids[0]).Status==='DIBATALKAN');

console.log('\n— Retur hanya dari penerimaan —');
const rt = ctx.returTersedia(STAF, SUP);
ok('bisa diretur: RCV1 400 & RCV3 100 (RCV2 dibatalkan tidak muncul)', rt.length===2 && rt.every(x=>x.id!==rc2.ids[0]), rt);
const retur = ctx.simpanPenerimaan({jenis:'RETUR',supplier:SUP,baris:[{kode:KW,qty:50,idAsal:rc1.ids[0]}],catatan:'rusak',ident:STAF});
ok('retur 50 dari RCV1', retur.ok && ctx.baca_(ctx.SHEET.PENERIMAAN).find(r=>r.ID===retur.ids[0]).ID_Penerimaan_Asal===rc1.ids[0]);
ok('sisa RCV1 = 350', ctx.returTersedia(STAF, SUP).find(x=>x.id===rc1.ids[0]).sisa===350);
tolak('retur 351 ditolak', ()=>ctx.simpanPenerimaan({jenis:'RETUR',supplier:SUP,baris:[{kode:KW,qty:351,idAsal:rc1.ids[0]}],ident:STAF}), /melebihi/);
ok('stok GBJ KW = 400+100-50 = 450', ctx.getKonteks(STAF).stok[KW].gbj===450);

console.log('\n— HPP rata-rata bergerak —');
// RCV1 400 @12000 (PO) + RCV3 100 tanpa harga → pakai rata-rata saat itu (12000) ; retur 50 keluar @12000 → 450 kg @12000
const nilai = ctx.laporanNilaiStok(SPV);
const nKw = nilai.daftar.find(x=>x.kode===KW);
ok('nilai stok KW: 450 kg @12.000 (penerimaan tanpa harga ikut rata-rata)', nKw.qty===450 && nKw.rata===12000 && nKw.nilai===450*12000, nKw);
ok('tidak ada lapisan FIFO lagi', nKw.lapisan===undefined && nilai.metode==='RATA');
tolak('staf tidak boleh lihat nilai stok', ()=>ctx.laporanNilaiStok(STAF), /Manager/);
// penerimaan @13.000 → rata-rata naik: (450×12000 + 150×13000)/600 = 12.250
const po3 = ctx.simpanPo({supplier:SUP, baris:[{kode:KW, qty:150, harga:13000}]}, SPV);
ctx.simpanPenerimaan({jenis:'MASUK',supplier:SUP,noSuratJalan:'SJ/5',baris:[{kode:KW,qty:150,idPo:po3.ids[0]}],ident:STAF});
ok('rata-rata bergerak: (450×12.000 + 150×13.000)/600 = 12.250', ctx.laporanNilaiStok(SPV).daftar.find(x=>x.kode===KW).rata===12250);
const s1 = ctx.simpanLaporanShift({shift:'1', mesin:'BLOWING', operator:'Sri', ambil:[{kode:KW, qty:250}], hasil:[{kualitas:'KW', qty:240}], bs:[{kualitas:'KW', qty:2}]}, SPV);
const rata = ctx.hitungRata_();
ok('nilai bahan shift = 250 × 12.250 (rata-rata), proses 250 × 2.500', rata.biaya[s1.id]===250*12250 && rata.proses[s1.id]===250*2500, [rata.biaya[s1.id], rata.proses[s1.id]]);
const hargaRoll = (250*12250 + 250*2500)/240;
ok('roll KW dinilai (bahan + proses)/hasil = 13.281', Math.abs(rata.pos['WIP-ROLL-KW'].rata - hargaRoll) < 0.01, rata.pos['WIP-ROLL-KW']);
ctx.setSetting_('METODE_HPP','MASTER');
ok('METODE_HPP=MASTER → nilai stok pakai harga master (13.000)', ctx.hitungRata_().pos[KW].rata!==undefined && ctx.metodeHpp_()==='MASTER');
ctx.setSetting_('METODE_HPP','RATA');
const s2 = ctx.simpanLaporanShift({shift:'1', mesin:'CUTTING', operator:'Rina', hasil:[{kualitas:'KW', qty:230}], bs:[{kualitas:'KW', qty:5}]}, SPV);
const hargaPb = 235*hargaRoll/230;
const nilai2 = ctx.laporanNilaiStok(SPV).daftar.find(x=>x.kode==='FG-PB-KW');
ok('polybag dinilai roll terpakai / polybag', nilai2.qty===230 && Math.abs(nilai2.rata-hargaPb)<=1, nilai2);
const jual = ctx.simpanPengiriman({jenis:'KELUAR',customer:'PT Nursery Hijau Lestari',noSuratJalan:'DO/1',baris:[{kode:'FG-PB-KW',qty:100}],ident:STAF});
ok('penjualan mencatat HPP_Per_Kg rata-rata polybag', Math.abs(ctx.baca_(ctx.SHEET.PENGIRIMAN).find(r=>r.ID===jual.ids[0]).HPP_Per_Kg-hargaPb)<=0.01);

console.log('\n— Invoice & validasi (harga berubah → HPP dihitung ulang) —');
tolak('staf tidak bisa unggah invoice', ()=>ctx.simpanInvoice({noPo:po1.noPo,noInvoice:'INV-1',totalInvoice:1},STAF), /Manager/);
const rk = ctx.ringkasanPo(po1.noPo, SPV);
ok('ringkasan PO: diterima 400 kg, nilai diterima 4,8 jt', rk.kgDiterima===400 && rk.nilaiDiterima===400*12000, rk);
const inv = ctx.simpanInvoice({noPo:po1.noPo,noInvoice:'INV-2026-001',tanggalInvoice:'2026-09-16',totalInvoice:400*12200,file:'data:image/jpeg;base64,xx'},SPV);
ok('invoice: selisih = 400×200 = 80rb', inv.selisih===80000, inv);
ok('daftarInvoice MENUNGGU 1', ctx.daftarInvoice(SPV,'MENUNGGU').length===1);
const val = ctx.validasiInvoice(inv.id,'valid',{[KW]:12200},'harga naik sesuai invoice',SPV);
ok('valid + harga KW diperbarui', val.status==='VALID' && val.hargaDiubah.length===1 && val.selisih===0, val);
ok('harga PO & batch RCV1 jadi 12200', ctx.baca_(ctx.SHEET.PO).find(r=>r.ID===lineKW.id).Harga_Per_Kg===12200 && ctx.baca_(ctx.SHEET.PENERIMAAN).find(r=>r.ID===rc1.ids[0]).Harga_Per_Kg===12200);
tolak('invoice tidak bisa divalidasi 2x', ()=>ctx.validasiInvoice(inv.id,'valid',null,'',SPV), /sudah VALID/);
const hppLama = ctx.baca_(ctx.SHEET.PENGIRIMAN).find(r=>r.ID===jual.ids[0]).HPP_Per_Kg;
const ulang = ctx.hitungUlangHpp(SPV);
const hppBaru = ctx.baca_(ctx.SHEET.PENGIRIMAN).find(r=>r.ID===jual.ids[0]).HPP_Per_Kg;
ok('hitungUlangHpp: HPP pengiriman naik mengikuti harga baru', ulang.diubah>=1 && hppBaru>hppLama, [ulang, hppLama, hppBaru]);
ok('HPP baru = rata-rata ulang dari mesin', Math.abs(hppBaru - ctx.hitungRata_().biaya[jual.ids[0]]/100) < 0.01);

console.log('\n— Barang rusak —');
tolak('manager tidak boleh mencatat rusak', ()=>ctx.simpanKerusakan({lokasi:'GBJ',kode:KW,qty:5,penyebab:'basah',ident:SPV}), /STAF/);
tolak('tanpa penyebab ditolak', ()=>ctx.simpanKerusakan({lokasi:'GBJ',kode:KW,qty:5,ident:STAF}), /Penyebab/);
const dmg = ctx.simpanKerusakan({lokasi:'GBJ',kode:KW,qty:20,penyebab:'karung bocor kena hujan',ident:STAF});
ok('laporan rusak tersimpan MENUNGGU', dmg.ok && ctx.daftarKerusakan(STAF)[0].status==='MENUNGGU');
ok('stok belum berkurang sebelum disetujui (600 − 250 diambil blowing)', ctx.getKonteks(STAF).stok[KW].gbj===350);
ok('getKonteks spv: 1 laporan rusak menunggu', ctx.getKonteks(SPV).ringkasan.kerusakanMenunggu===1);
tolak('staf tidak bisa setujui', ()=>ctx.tinjauKerusakan(dmg.id,'setuju','',STAF), /Supervisor/);
const tk = ctx.tinjauKerusakan(dmg.id,'setuju','dicek langsung',SPV);
ok('disetujui: nilai kerugian rata-rata > 0', tk.status==='DISETUJUI' && tk.nilaiKerugian>0, tk);
ok('stok gudang turun 20 → 330', ctx.getKonteks(STAF).stok[KW].gbj===330);
ok('laporanStok punya kolom rusak=20', ctx.laporanStok(SPV).daftar.find(s=>s.kode===KW).rusak===20);
ok('staf lihat laporannya sendiri (DISETUJUI) tanpa nilai', (()=>{const d=ctx.daftarKerusakan(STAF,'DISETUJUI')[0]; return d && d.nilaiKerugian===undefined;})());
ok('spv lihat nilai kerugian', ctx.daftarKerusakan(SPV,'DISETUJUI')[0].nilaiKerugian===tk.nilaiKerugian);

console.log('\n— Standar susut & pekerjaan tidak ada lagi (v10) —');
ok('fungsi standar susut / pekerjaan tidak ada', typeof ctx.laporanStandarSusut!=='function' && typeof ctx.terapkanStandarSusut!=='function' && typeof ctx.mulaiPekerjaan!=='function' && typeof ctx.hitungFifo_!=='function');
ok('sheet Master_Standar_Susut tidak dibuat', !ctx.SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Master_Standar_Susut'));

console.log('\n— Kolom tanggal jadi Date di Sheets → dinormalkan ke YYYY-MM-DD —');
{
  const rowPo = ctx.baca_(ctx.SHEET.PO)[0];
  const tglAsli = rowPo.Tanggal;
  ctx.ubahBaris_(ctx.SHEET.PO, rowPo._baris, { Tanggal: new Date(tglAsli+'T00:00:00'), Perkiraan_Datang: new Date('2026-09-20T00:00:00'), Jatuh_Tempo: new Date('2026-11-04T00:00:00') });
  const d = ctx.daftarPo(SPV,'SEMUA',365).find(x=>x.id===rowPo.ID);
  ok('daftarPo.tanggal tetap string YYYY-MM-DD', d.tanggal===tglAsli, d.tanggal);
  ok('perkiraanDatang & jatuhTempo string YYYY-MM-DD', d.perkiraanDatang==='2026-09-20' && d.jatuhTempo==='2026-11-04', [d.perkiraanDatang, d.jatuhTempo]);
  const rowRc = ctx.baca_(ctx.SHEET.PENERIMAAN)[0];
  ctx.ubahBaris_(ctx.SHEET.PENERIMAAN, rowRc._baris, { Tanggal: new Date(rowRc.Tanggal+'T00:00:00') });
  const f = ctx.hitungRata_();
  ok('rata-rata tetap jalan dengan Tanggal Date (posisi KW ada)', !!(f.pos[KW]) && f.pos[KW].qty>0, Object.keys(f.pos));
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
  const f1 = ctx.hitungRata_(); ctx.lupakanMemo_();
  ok('rata-rata identik lewat jalur batch', JSON.stringify(f1.pos)===JSON.stringify(ctx.hitungRata_().pos));
}

console.log('\n— doPost: idKlien idempoten (ulang kirim tidak dobel) —');
{
  const cacheMap = {};
  ctx.CacheService = { getScriptCache(){ return { get:k=>cacheMap[k]||null, put:(k,v)=>{ cacheMap[k]=v; } }; } };
  ctx.ContentService = { MimeType:{JSON:'json'}, createTextOutput(t){ return { _t:t, setMimeType(){ return this; } }; } };
  const nPo = ctx.baca_(ctx.SHEET.PO).length;
  const body = JSON.stringify({ fn:'simpanPo', idKlien:'abc-123', args:[{supplier:SUP, baris:[{kode:KW, qty:7, harga:1000}]}, SPV] });
  const r1 = JSON.parse(ctx.doPost({ postData:{ contents: body } })._t);
  const r2 = JSON.parse(ctx.doPost({ postData:{ contents: body } })._t);
  ok('panggilan pertama sukses', r1.ok && r1.data.noPo, r1);
  ok('ulang dengan idKlien sama -> hasil sama, PO tidak dibuat dua kali', r2.ok && r2.data.noPo===r1.data.noPo && ctx.baca_(ctx.SHEET.PO).length===nPo+1, [r2, ctx.baca_(ctx.SHEET.PO).length-nPo]);
  const r3 = JSON.parse(ctx.doPost({ postData:{ contents: JSON.stringify({ fn:'simpanPo', idKlien:'abc-124', args:[{supplier:SUP, baris:[{kode:KW, qty:7, harga:1000}]}, SPV] }) } })._t);
  ok('idKlien beda -> PO baru', r3.ok && r3.data.noPo!==r1.data.noPo && ctx.baca_(ctx.SHEET.PO).length===nPo+2);
  const r4 = JSON.parse(ctx.doPost({ postData:{ contents: JSON.stringify({ fn:'hitungRata_', args:[] }) } })._t);
  ok('fungsi di luar daftar putih ditolak', !r4.ok && /tidak dikenal/.test(r4.error));
  const r5 = JSON.parse(ctx.doPost({ postData:{ contents: JSON.stringify({ fn:'simpanPo', idKlien:'x', args:[{supplier:SUP, baris:[]}, SPV] }) } })._t);
  ok('error tidak di-cache (ulang tetap error, bukan hasil lama)', !r5.ok && /Item PO/.test(r5.error) && cacheMap['rq:x']===undefined);
  const r6 = JSON.parse(ctx.doPost({ postData:{ contents: JSON.stringify({ fn:'simpanLaporanShift', idKlien:'shf-1', args:[{shift:'2', mesin:'BLOWING', operator:'Sri', ambil:[{kode:KW, qty:5}], hasil:[{kualitas:'KW', qty:4}]}, SPV] }) } })._t);
  ok('laporan shift lewat doPost', r6.ok && /^SHF-/.test(r6.data.id), r6);
}

console.log('\n— Laporan stok: rincian neraca = saldo (termasuk barang rusak) —');
{
  const ls = ctx.laporanStok(SPV);
  let cocok = true, adaRusak = false;
  ls.daftar.forEach(s => {
    const gbj = s.awal + s.beli + s.returCust + s.dihasilkan + s.daurHasil - s.retur - s.jual - s.dipakai - s.daurKirim - s.rusak + s.opname;
    if (Math.abs(gbj - s.gbj) > 0.01) { cocok = false; console.log('   beda:', s.kode, gbj, s.gbj); }
    if (s.rusak) adaRusak = true;
  });
  ok('setiap baris neraca menjumlah tepat ke saldo gudang', cocok);
  ok('ada item dengan barang rusak disetujui di laporan', adaRusak);
  ok('total rusak ikut di ringkasan', ls.total.rusak > 0, ls.total);
}

fs.unlinkSync(__dirname + '/.h7.js');
console.log('\n================ '+pass+' lulus, '+fail+' gagal ================');
process.exit(fail?1:0);
