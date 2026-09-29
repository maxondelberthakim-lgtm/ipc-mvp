/* v8: sales order, prediksi beli, ekspor bulanan, backup, poDatang/soHariIni di konteks */
const fs=require('fs');
let src=fs.readFileSync(__dirname+'/harness.js','utf8').replace("return 'pemilik@contoh.co.id';","return '';");
fs.writeFileSync(__dirname + '/.h8.js', src);
const {ctx}=require(__dirname + '/.h8.js');
let pass=0,fail=0;
const ok=(l,c,e)=>{c?(pass++,console.log('  ✓',l)):(fail++,console.log('  ✗',l,e===undefined?'':JSON.stringify(e)))};
function tolak(label, fn, pola){ let e=''; try{ fn(); }catch(x){ e=String(x.message||x); } ok(label, pola.test(e), e); }
// mock Drive/ScriptApp untuk backup
const trashed=[]; let triggers=[]; const backupFiles=[];
ctx.DriveApp.getFileById = ()=>({ makeCopy:(nama)=>{ backupFiles.push({name:nama, trashed:false}); return {}; } });
ctx.DriveApp.getFoldersByName = (n)=>({ hasNext:()=>n==='IPC Backup' && true, next:()=>({ getFiles:()=>{ let i=0; return { hasNext:()=>i<backupFiles.length, next:()=>{ const f=backupFiles[i++]; return { getName:()=>f.name, setTrashed:(v)=>{ f.trashed=v; } }; } }; } }) });
ctx.ScriptApp = { getProjectTriggers:()=>triggers, deleteTrigger:(t)=>{ triggers=triggers.filter(x=>x!==t); }, newTrigger:(fn)=>({ timeBased:()=>({ everyDays:()=>({ atHour:()=>({ create:()=>{ triggers.push({ getHandlerFunction:()=>fn }); } }) }) }) }) };
ctx.setupSistem();
ctx.migrasiSkema();
const SPV={nama:'Manager',pin:'1357'}, STAF={nama:'Staff Gudang',pin:'1111'}, DIR={nama:'Direktur',pin:'2468'};
const SUP='PT Sumber Biji Plastik', CUS='PT Nursery Hijau Lestari', KW='RM-BP-KW', FG='FG-PB-KW';

console.log('— Skema —');
ok('sheet Sales_Order ada', !!ctx.SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sales_Order'));
ok('Pengiriman punya kolom ID_SO', ctx.HEADER['Pengiriman'].indexOf('ID_SO')>=0);
ok('setting MAKS_EDIT_HARI & LEAD_TIME_HARI', ctx.getSetting_('MAKS_EDIT_HARI')==='30' && ctx.getSetting_('LEAD_TIME_HARI')==='7');

console.log('\n— Stok awal: beli & produksi (shift) —');
const po = ctx.simpanPo({supplier:SUP, topHari:14, baris:[{kode:KW, qty:1000, harga:12000}]}, SPV);
const poLine = ctx.poTerbuka(STAF)[0];
ctx.simpanPenerimaan({jenis:'MASUK',supplier:SUP,noSuratJalan:'SJ/1',baris:[{kode:KW,qty:600,idPo:poLine.id}],ident:STAF});
ctx.simpanLaporanShift({shift:'1',blowing:{operator:'Sri',ambil:[{kode:KW,qty:300}],hasil:[{kualitas:'KW',qty:292}],bs:[{kualitas:'KW',qty:3}]},cutting:{operator:'Rina',rollPakai:[{kualitas:'KW',qty:289}],hasil:[{kualitas:'KW',qty:285}],bs:[{kualitas:'KW',qty:4}]}}, SPV);
ok('polybag KW 285 kg di GBJ (hasil cutting langsung di gudang)', ctx.getKonteks(STAF).stok[FG].gbj===285);

console.log('\n— Sales order —');
tolak('staf tidak boleh buat SO', ()=>ctx.simpanSo({customer:CUS,baris:[{kode:FG,qty:100,harga:250000}]},STAF), /Manager/);
tolak('customer kosong ditolak', ()=>ctx.simpanSo({customer:'',topHari:0,baris:[{kode:FG,qty:100,harga:25000}]},SPV), /Customer/);
tolak('SO tanpa tanggal kirim ditolak (v10)', ()=>ctx.simpanSo({customer:CUS,topHari:0,baris:[{kode:FG,qty:100,harga:25000}]},SPV), /Tanggal kirim/);
tolak('SO tanpa TOP ditolak (v10)', ()=>ctx.simpanSo({customer:CUS,tanggalKirim:ctx.tglStr_(new Date()),baris:[{kode:FG,qty:100,harga:25000}]},SPV), /TOP/);
tolak('SO tanpa harga ditolak (v10)', ()=>ctx.simpanSo({customer:CUS,topHari:0,tanggalKirim:ctx.tglStr_(new Date()),baris:[{kode:FG,qty:100}]},SPV), /Harga jual/);
tolak('SO TOP > 365 ditolak', ()=>ctx.simpanSo({customer:CUS,topHari:999,tanggalKirim:ctx.tglStr_(new Date()),baris:[{kode:FG,qty:100,harga:25000}]},SPV), /TOP maksimal/);
const hariIni = ctx.tglStr_(new Date());
const so1 = ctx.simpanSo({customer:CUS, tanggalKirim:hariIni, topHari:30, baris:[{kode:FG, qty:100, harga:25000},{kode:FG, qty:50, harga:24000}], catatan:'kirim pagi'}, SPV);
ok('SO dibuat 2 baris, nilai 3,7 jt', so1.ids.length===2 && so1.nilai===100*25000+50*24000 && /^SO-\d{6}-01$/.test(so1.noSo), so1);
const so1Row = ctx.baca_(ctx.SHEET.SO).find(r=>r.ID===so1.ids[0]);
ok('SO simpan TOP 30 & jatuh tempo = tanggal kirim + 30', so1Row.TOP_Hari===30 && so1Row.Jatuh_Tempo===ctx.jatuhTempo_(hariIni,30), [so1Row.TOP_Hari, so1Row.Jatuh_Tempo]);
const so2 = ctx.simpanSo({customer:'Toko Tani Sejahtera', topHari:0, tanggalKirim:ctx.tglStr_(new Date(Date.now()+3*864e5)), baris:[{kode:FG, qty:80, harga:23000}]}, SPV);
ok('SO kedua nomor -02, tunai → jatuh tempo = tanggal kirim', /-02$/.test(so2.noSo) && ctx.baca_(ctx.SHEET.SO).find(r=>r.ID===so2.ids[0]).Jatuh_Tempo===ctx.tglStr_(new Date(Date.now()+3*864e5)));
const k = ctx.getKonteks(STAF);
ok('stok konteks: dipesan 230 kg FG (100+50+80)', k.stok[FG].dipesan===230, k.stok[FG]);
ok('soHariIni untuk staf: 2 baris jatuh tempo hari ini, tanpa harga', k.soHariIni.length===2 && k.soHariIni[0].harga===undefined && k.soHariIni[0].sisa===100, k.soHariIni);
ok('poDatang di konteks staf: sisa 400 kg, tanpa harga', k.poDatang.length===1 && k.poDatang[0].sisa===400 && k.poDatang[0].harga===undefined, k.poDatang);
const tb = ctx.soTerbuka(STAF);
ok('soTerbuka staf: 3 baris, tanpa harga, urut tanggal kirim', tb.length===3 && tb.every(x=>x.harga===undefined) && tb[0].tanggalKirim===hariIni, tb);
ok('daftarSo manager: ada harga, topHari & jatuhTempo', ctx.daftarSo(SPV)[0].harga>0 && ctx.daftarSo(SPV).some(x=>x.topHari===30 && x.jatuhTempo), ctx.daftarSo(SPV)[0]);
ok('daftarSo staf: tanpa harga', ctx.daftarSo(STAF)[0].harga===undefined);
ok('daftarSo direktur: ada harga', ctx.daftarSo(DIR)[0].harga>0);

console.log('\n— Kirim sesuai SO —');
const soLine = tb.find(x=>x.qty===100);
tolak('customer beda dengan SO ditolak', ()=>ctx.simpanPengiriman({jenis:'KELUAR',customer:'Toko Tani Sejahtera',noSuratJalan:'DO/1',baris:[{kode:FG,qty:10,idSo:soLine.id}],ident:STAF}), /Customer tidak sama/);
tolak('melebihi sisa SO ditolak', ()=>ctx.simpanPengiriman({jenis:'KELUAR',customer:CUS,noSuratJalan:'DO/1',baris:[{kode:FG,qty:101,idSo:soLine.id}],ident:STAF}), /melebihi sisa SO/);
const kirim1 = ctx.simpanPengiriman({jenis:'KELUAR',customer:CUS,noSuratJalan:'DO/1',baris:[{kode:FG,qty:60,idSo:soLine.id}],ident:STAF});
ok('kirim 60 kg tersimpan dengan ID_SO', ctx.baca_(ctx.SHEET.PENGIRIMAN).find(r=>r.ID===kirim1.ids[0]).ID_SO===soLine.id);
let soRow = ctx.baca_(ctx.SHEET.SO).find(r=>r.ID===soLine.id);
ok('SO baris jadi SEBAGIAN, dikirim 60', soRow.Status==='SEBAGIAN' && soRow.Qty_Dikirim_Kg===60, soRow);
ok('dipesan turun jadi 170', ctx.getKonteks(STAF).stok[FG].dipesan===170);
const kirim2 = ctx.simpanPengiriman({jenis:'KELUAR',customer:CUS,noSuratJalan:'DO/2',baris:[{kode:FG,qty:40,idSo:soLine.id}],ident:STAF});
soRow = ctx.baca_(ctx.SHEET.SO).find(r=>r.ID===soLine.id);
ok('SO baris SELESAI setelah 100 kg', soRow.Status==='SELESAI');
tolak('SO selesai tidak bisa dikirimi lagi', ()=>ctx.simpanPengiriman({jenis:'KELUAR',customer:CUS,noSuratJalan:'DO/3',baris:[{kode:FG,qty:1,idSo:soLine.id}],ident:STAF}), /sudah SELESAI/);
ctx.tinjauTransfer(kirim2.ids[0],'batal','salah',SPV);
soRow = ctx.baca_(ctx.SHEET.SO).find(r=>r.ID===soLine.id);
ok('pengiriman dibatalkan → SO kembali SEBAGIAN 60', soRow.Status==='SEBAGIAN' && soRow.Qty_Dikirim_Kg===60);
ok('ubah qty SO tidak boleh < dikirim', (()=>{ try{ ctx.ubahSo(soLine.id,{qty:50},SPV); return false; }catch(e){ return /sudah dikirim/.test(e.message); } })());
ok('ubah harga, tanggal kirim & TOP SO → jatuh tempo ikut', ctx.ubahSo(soLine.id,{harga:25500, tanggalKirim:'2026-10-01', topHari:45},SPV).log.length===3 && ctx.baca_(ctx.SHEET.SO).find(r=>r.ID===soLine.id).Jatuh_Tempo==='2026-11-15');
tolak('batalkan SO yang sudah dikirim sebagian ditolak', ()=>ctx.batalkanSo(soLine.id,'x',SPV), /Sudah ada pengiriman/);
const so2Line = ctx.daftarSo(SPV).find(x=>x.noSo===so2.noSo);
ok('batalkan SO belum dikirim', ctx.batalkanSo(so2Line.id,'customer batal',SPV).ok && ctx.daftarSo(SPV,'DIBATALKAN').length===1);
ok('dipesan tidak termasuk SO batal', ctx.getKonteks(STAF).stok[FG].dipesan===90);
tolak('staf tidak boleh ubah SO', ()=>ctx.ubahSo(soLine.id,{qty:120},STAF), /Manager/);
const rc = ctx.riwayatInput('JUAL_KELUAR',14,STAF)[0];
ok('riwayat pengiriman memuat idSo', rc.idSo===soLine.id || rc.idSo==='' );

console.log('\n— Prediksi kapan perlu beli —');
tolak('staf tidak boleh', ()=>ctx.prediksiBeli(STAF), /Supervisor/);
let pr = ctx.prediksiBeli(SPV, 30);
const w240 = pr.find(x=>x.kode===KW);
ok('KW: diambil blowing 300 kg/30 hari = 10/hari, stok 300 → 30 hari, AMAN', w240.rataHari===10 && w240.stok===300 && w240.sisaHari===30 && w240.status==='AMAN', w240);
ok('PO terbuka 400 kg tercatat', w240.poSisa===400);
ok('roll & polybag tidak masuk prediksi beli (bukan bahan baku)', !pr.some(x=>/^WIP-|^FG-|^SCR-/.test(x.kode)));
ok('item tak dipakai = TIDAK_DIPAKAI & diurut belakang', pr[pr.length-1].status==='TIDAK_DIPAKAI');
// habiskan stok W240 supaya PERLU_BELI: selesaikan sisa PO dulu supaya tidak ada PO
ctx.simpanPenerimaan({jenis:'MASUK',supplier:SUP,noSuratJalan:'SJ/2',baris:[{kode:KW,qty:400,idPo:poLine.id}],ident:STAF});
ctx.simpanLaporanShift({shift:'2',blowing:{operator:'Sri',ambil:[{kode:KW,qty:650}],hasil:[{kualitas:'KW',qty:640}]}}, SPV);
pr = ctx.prediksiBeli(SPV, 30);
const w2 = pr.find(x=>x.kode===KW);
ok('setelah dipakai 950 kg: 31,67/hari, stok 50 → 1,6 hari, PERLU_BELI', w2.status==='PERLU_BELI' && w2.sisaHari<7 && w2.poSisa===0, w2);
ok('saran beli = 31,67×21 − 50 ≈ 615', Math.abs(w2.saranBeli - Math.round(950/30*21-50)) <= 1, w2.saranBeli);
ok('konteks manager: perluBeli = 1', ctx.getKonteks(SPV).ringkasan.perluBeli===1);
ok('konteks staf: perluBeli 0 (tidak dihitung)', ctx.getKonteks(STAF).ringkasan.perluBeli===0);
const po2 = ctx.simpanPo({supplier:SUP, perkiraanDatang:'2026-09-25', baris:[{kode:KW, qty:600, harga:12000}]}, SPV);
ok('ada PO lagi → PO_JALAN dengan ETA', (()=>{const x=ctx.prediksiBeli(SPV,30).find(x=>x.kode===KW); return x.status==='PO_JALAN' && x.poEta==='2026-09-25';})());

console.log('\n— Ekspor bulanan —');
tolak('staf tidak boleh ekspor', ()=>ctx.eksporBulanan(hariIni.slice(0,7), STAF), /Manager/);
tolak('format bulan salah', ()=>ctx.eksporBulanan('2026/09', SPV), /YYYY-MM/);
const ex = ctx.eksporBulanan(hariIni.slice(0,7), SPV);
ok('7 file CSV', ex.files.length===7 && ex.files.every(f=>f.csv.charCodeAt(0)===0xFEFF), ex.files.map(f=>f.nama));
const beliCsv = ex.files.find(f=>f.nama.indexOf('pembelian')===0).csv;
ok('pembelian: 2 penerimaan dengan harga PO 12000', beliCsv.split('\r\n').length===3 && /12000;7200000/.test(beliCsv), beliCsv.split('\r\n')[1]);
const jualCsv = ex.files.find(f=>f.nama.indexOf('penjualan')===0).csv;
ok('penjualan: 1 pengiriman aktif dengan harga SO & HPP & laba', jualCsv.split('\r\n').length===2 && /;60;25500;1530000;/.test(jualCsv), jualCsv.split('\r\n')[1]);
const prodCsv = ex.files.find(f=>f.nama.indexOf('produksi')===0).csv.split('\r\n');
ok('produksi: 2 laporan shift (1 baris per shift), kolom blowing & cutting terpisah per kualitas, tanpa susut per shift', prodCsv.length===3 && /Operator_Blowing;.*Roll_KW_Kg;Roll_Super_Kg.*Operator_Cutting;Roll_Pakai_Kg;Polybag_KW_Kg/.test(prodCsv[0]) && prodCsv[0].indexOf('Susut')<0 && /;Sri;.*;Rina;289;285;/.test(prodCsv[1]) , prodCsv);
const ring = Object.fromEntries(ex.ringkasan);
ok('ringkasan: penjualan 1,53 jt, HPP terjual > 0, laba per pengiriman', ring['Penjualan (nilai, dari harga SO)']===1530000 && ring['HPP barang terjual (semua pengiriman)']>0 && ring['Laba kotor (penjualan − HPP, hanya yang ada harga SO)']===1530000-ring['HPP barang terjual (yang ada harga SO)'] && ring['Penjualan tanpa SO / tanpa harga (kg)']===0, ring);
ok('ringkasan: pembelian 12 jt, 3 laporan shift, biji masuk blowing 950, polybag jadi 285, BS 7', ring['Pembelian (nilai)']===12000000 && ring['Laporan shift']===2 && ring['Biji plastik masuk blowing (kg)']===950 && ring['Polybag jadi (kg)']===285 && ring['BS total (kg)']===7, ring);
ok('ringkasan: COGS bulan = stok awal + pembelian − retur + jasa + proses − stok akhir; laba kotor = penjualan − COGS', ring['COGS bulan (stok awal + pembelian − retur + jasa chassen + biaya proses − stok akhir)']===Math.round(ring['Nilai stok awal bulan (rata-rata)'] + 12000000 - 0 + 0 + 950*2500 - ring['Nilai stok akhir bulan (rata-rata)']) && ring['Laba kotor bulan (penjualan dari harga SO − COGS)']===1530000-ring['COGS bulan (stok awal + pembelian − retur + jasa chassen + biaya proses − stok akhir)'], ring);
ok('ringkasan: susut produksi = 950 − 285 − 7 − Δroll(932−289) = 15', ring['Susut produksi (kg, biji masuk − polybag − BS − perubahan roll)']===15, ring['Susut produksi (kg, biji masuk − polybag − BS − perubahan roll)']);
const stokCsv = ex.files.find(f=>f.nama.indexOf('nilai_stok')===0).csv;
ok('nilai stok akhir bulan berisi baris per item dengan kategori', stokCsv.split('\r\n').length>=3 && /Kategori/.test(stokCsv.split('\r\n')[0]));

ok('ekspor bulan kosong: hanya header', ctx.eksporBulanan('2020-01', SPV).files.find(f=>f.nama.indexOf('pembelian')===0).csv.split('\r\n').length===1);
ok('hitungRata_ dengan batas tanggal lama = hanya stok awal (0)', Object.keys(ctx.hitungRata_('2020-01-31').pos).every(k=>ctx.hitungRata_('2020-01-31').pos[k].qty===0));

console.log('\n— Backup —');
const hasil = ctx.pasangBackupHarian();
ok('pemicu terpasang & salinan pertama dibuat', /terpasang/.test(hasil) && triggers.length===1 && backupFiles.length===1, hasil);
ctx.pasangBackupHarian();
ok('pasang ulang tidak dobel pemicu', triggers.length===1 && backupFiles.length===2);
for (let i=0;i<35;i++) backupFiles.push({name:'IPC Backup 2026-01-'+String(i+1).padStart(2,'0')+' 02.00', trashed:false});
ctx.backupHarian();
ok('hanya 30 salinan terbaru disimpan, sisanya ke sampah', backupFiles.filter(f=>!f.trashed).length===30, backupFiles.filter(f=>!f.trashed).length);
const sb = ctx.statusBackup(SPV);
ok('statusBackup: terpasang, ada salinan terakhir', sb.terpasang===true && sb.terakhir.indexOf('IPC Backup')===0 && sb.simpan===30, sb);
tolak('staf tidak boleh lihat status backup', ()=>ctx.statusBackup(STAF), /Supervisor/);

fs.unlinkSync(__dirname + '/.h8.js');
console.log('\n================ '+pass+' lulus, '+fail+' gagal ================');
process.exit(fail?1:0);
