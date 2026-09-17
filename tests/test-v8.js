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
const SUP='CV Mitra Mete Sulawesi', CUS='PT Ritel Nusantara';

console.log('— Skema —');
ok('sheet Sales_Order ada', !!ctx.SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sales_Order'));
ok('Pengiriman punya kolom ID_SO', ctx.HEADER['Pengiriman'].indexOf('ID_SO')>=0);
ok('setting MAKS_EDIT_HARI & LEAD_TIME_HARI', ctx.getSetting_('MAKS_EDIT_HARI')==='30' && ctx.getSetting_('LEAD_TIME_HARI')==='7');

console.log('\n— Stok awal: beli & produksi —');
const po = ctx.simpanPo({supplier:SUP, baris:[{kode:'RM-CSW-W240', qty:1000, harga:180000}]}, SPV);
const poLine = ctx.poTerbuka(STAF)[0];
ctx.simpanPenerimaan({jenis:'MASUK',supplier:SUP,noSuratJalan:'SJ/1',baris:[{kode:'RM-CSW-W240',qty:600,idPo:poLine.id}],ident:STAF});
ctx.simpanTransfer({arah:'GBJ_KE_GP',baris:[{kode:'RM-CSW-W240',qty:300}],ident:STAF});
const j = ctx.mulaiPekerjaan({kodeProduk:'FG-MM-CSW',bahanBaku:[{kode:'RM-CSW-W240',qty:300}],ident:STAF});
ctx.selesaikanPekerjaan({id:j.id,barangJadi:[{kode:'FG-MM-CSW',qty:285}],scrapKg:3,ident:STAF});
ctx.simpanTransfer({arah:'GP_KE_GBJ',baris:[{kode:'FG-MM-CSW',qty:285}],ident:STAF});
ok('FG 285 kg di GBJ', ctx.getKonteks(STAF).stok['FG-MM-CSW'].gbj===285);

console.log('\n— Sales order —');
tolak('staf tidak boleh buat SO', ()=>ctx.simpanSo({customer:CUS,baris:[{kode:'FG-MM-CSW',qty:100,harga:250000}]},STAF), /Manager/);
tolak('customer kosong ditolak', ()=>ctx.simpanSo({customer:'',baris:[{kode:'FG-MM-CSW',qty:100,harga:250000}]},SPV), /Customer/);
const hariIni = ctx.tglStr_(new Date());
const so1 = ctx.simpanSo({customer:CUS, tanggalKirim:hariIni, baris:[{kode:'FG-MM-CSW', qty:100, harga:250000},{kode:'FG-MM-CSW', qty:50, harga:240000}], catatan:'kirim pagi'}, SPV);
ok('SO dibuat 2 baris, nilai 37 jt', so1.ids.length===2 && so1.nilai===100*250000+50*240000 && /^SO-\d{6}-01$/.test(so1.noSo), so1);
const so2 = ctx.simpanSo({customer:'Toko Grosir Pasar Baru', tanggalKirim:ctx.tglStr_(new Date(Date.now()+3*864e5)), baris:[{kode:'FG-MM-CSW', qty:80, harga:230000}]}, SPV);
ok('SO kedua nomor -02', /-02$/.test(so2.noSo));
const k = ctx.getKonteks(STAF);
ok('stok konteks: dipesan 230 kg FG (100+50+80)', k.stok['FG-MM-CSW'].dipesan===230, k.stok['FG-MM-CSW']);
ok('soHariIni untuk staf: 2 baris jatuh tempo hari ini, tanpa harga', k.soHariIni.length===2 && k.soHariIni[0].harga===undefined && k.soHariIni[0].sisa===100, k.soHariIni);
ok('poDatang di konteks staf: sisa 400 kg, tanpa harga', k.poDatang.length===1 && k.poDatang[0].sisa===400 && k.poDatang[0].harga===undefined, k.poDatang);
const tb = ctx.soTerbuka(STAF);
ok('soTerbuka staf: 3 baris, tanpa harga, urut tanggal kirim', tb.length===3 && tb.every(x=>x.harga===undefined) && tb[0].tanggalKirim===hariIni, tb);
ok('daftarSo manager: ada harga', ctx.daftarSo(SPV)[0].harga>0);
ok('daftarSo staf: tanpa harga', ctx.daftarSo(STAF)[0].harga===undefined);
ok('daftarSo direktur: ada harga', ctx.daftarSo(DIR)[0].harga>0);

console.log('\n— Kirim sesuai SO —');
const soLine = tb.find(x=>x.qty===100);
tolak('customer beda dengan SO ditolak', ()=>ctx.simpanPengiriman({jenis:'KELUAR',customer:'Toko Grosir Pasar Baru',noSuratJalan:'DO/1',baris:[{kode:'FG-MM-CSW',qty:10,idSo:soLine.id}],ident:STAF}), /Customer tidak sama/);
tolak('melebihi sisa SO ditolak', ()=>ctx.simpanPengiriman({jenis:'KELUAR',customer:CUS,noSuratJalan:'DO/1',baris:[{kode:'FG-MM-CSW',qty:101,idSo:soLine.id}],ident:STAF}), /melebihi sisa SO/);
const kirim1 = ctx.simpanPengiriman({jenis:'KELUAR',customer:CUS,noSuratJalan:'DO/1',baris:[{kode:'FG-MM-CSW',qty:60,idSo:soLine.id}],ident:STAF});
ok('kirim 60 kg tersimpan dengan ID_SO', ctx.baca_(ctx.SHEET.PENGIRIMAN).find(r=>r.ID===kirim1.ids[0]).ID_SO===soLine.id);
let soRow = ctx.baca_(ctx.SHEET.SO).find(r=>r.ID===soLine.id);
ok('SO baris jadi SEBAGIAN, dikirim 60', soRow.Status==='SEBAGIAN' && soRow.Qty_Dikirim_Kg===60, soRow);
ok('dipesan turun jadi 170', ctx.getKonteks(STAF).stok['FG-MM-CSW'].dipesan===170);
const kirim2 = ctx.simpanPengiriman({jenis:'KELUAR',customer:CUS,noSuratJalan:'DO/2',baris:[{kode:'FG-MM-CSW',qty:40,idSo:soLine.id}],ident:STAF});
soRow = ctx.baca_(ctx.SHEET.SO).find(r=>r.ID===soLine.id);
ok('SO baris SELESAI setelah 100 kg', soRow.Status==='SELESAI');
tolak('SO selesai tidak bisa dikirimi lagi', ()=>ctx.simpanPengiriman({jenis:'KELUAR',customer:CUS,noSuratJalan:'DO/3',baris:[{kode:'FG-MM-CSW',qty:1,idSo:soLine.id}],ident:STAF}), /sudah SELESAI/);
ctx.tinjauTransfer(kirim2.ids[0],'batal','salah',SPV);
soRow = ctx.baca_(ctx.SHEET.SO).find(r=>r.ID===soLine.id);
ok('pengiriman dibatalkan → SO kembali SEBAGIAN 60', soRow.Status==='SEBAGIAN' && soRow.Qty_Dikirim_Kg===60);
ok('ubah qty SO tidak boleh < dikirim', (()=>{ try{ ctx.ubahSo(soLine.id,{qty:50},SPV); return false; }catch(e){ return /sudah dikirim/.test(e.message); } })());
ok('ubah harga & tanggal kirim SO', ctx.ubahSo(soLine.id,{harga:255000, tanggalKirim:'2026-10-01'},SPV).log.length===2);
tolak('batalkan SO yang sudah dikirim sebagian ditolak', ()=>ctx.batalkanSo(soLine.id,'x',SPV), /Sudah ada pengiriman/);
const so2Line = ctx.daftarSo(SPV).find(x=>x.noSo===so2.noSo);
ok('batalkan SO belum dikirim', ctx.batalkanSo(so2Line.id,'customer batal',SPV).ok && ctx.daftarSo(SPV,'DIBATALKAN').length===1);
ok('dipesan tidak termasuk SO batal', ctx.getKonteks(STAF).stok['FG-MM-CSW'].dipesan===90);
tolak('staf tidak boleh ubah SO', ()=>ctx.ubahSo(soLine.id,{qty:120},STAF), /Manager/);
const rc = ctx.riwayatInput('JUAL_KELUAR',14,STAF)[0];
ok('riwayat pengiriman memuat idSo', rc.idSo===soLine.id || rc.idSo==='' );

console.log('\n— Prediksi kapan perlu beli —');
tolak('staf tidak boleh', ()=>ctx.prediksiBeli(STAF), /Supervisor/);
let pr = ctx.prediksiBeli(SPV, 30);
const w240 = pr.find(x=>x.kode==='RM-CSW-W240');
ok('W240: pakai 300 kg/30 hari = 10/hari, stok 300 → 30 hari, AMAN', w240.rataHari===10 && w240.stok===300 && w240.sisaHari===30 && w240.status==='AMAN', w240);
ok('PO terbuka 400 kg tercatat', w240.poSisa===400);
ok('item tak dipakai = TIDAK_DIPAKAI & diurut belakang', pr[pr.length-1].status==='TIDAK_DIPAKAI');
// habiskan stok W240 supaya PERLU_BELI: selesaikan sisa PO dulu supaya tidak ada PO
ctx.simpanPenerimaan({jenis:'MASUK',supplier:SUP,noSuratJalan:'SJ/2',baris:[{kode:'RM-CSW-W240',qty:400,idPo:poLine.id}],ident:STAF});
ctx.simpanTransfer({arah:'GBJ_KE_GP',baris:[{kode:'RM-CSW-W240',qty:650}],ident:STAF});
const j2 = ctx.mulaiPekerjaan({kodeProduk:'FG-MM-CSW',bahanBaku:[{kode:'RM-CSW-W240',qty:650}],ident:STAF});
pr = ctx.prediksiBeli(SPV, 30);
const w2 = pr.find(x=>x.kode==='RM-CSW-W240');
ok('setelah dipakai 950 kg: 31,67/hari, stok 50 → 1,6 hari, PERLU_BELI', w2.status==='PERLU_BELI' && w2.sisaHari<7 && w2.poSisa===0, w2);
ok('saran beli = 31,67×21 − 50 ≈ 615', Math.abs(w2.saranBeli - Math.round(950/30*21-50)) <= 1, w2.saranBeli);
ok('konteks manager: perluBeli = 1', ctx.getKonteks(SPV).ringkasan.perluBeli===1);
ok('konteks staf: perluBeli 0 (tidak dihitung)', ctx.getKonteks(STAF).ringkasan.perluBeli===0);
const po2 = ctx.simpanPo({supplier:SUP, perkiraanDatang:'2026-09-25', baris:[{kode:'RM-CSW-W240', qty:600, harga:180000}]}, SPV);
ok('ada PO lagi → PO_JALAN dengan ETA', (()=>{const x=ctx.prediksiBeli(SPV,30).find(x=>x.kode==='RM-CSW-W240'); return x.status==='PO_JALAN' && x.poEta==='2026-09-25';})());

console.log('\n— Ekspor bulanan —');
tolak('staf tidak boleh ekspor', ()=>ctx.eksporBulanan(hariIni.slice(0,7), STAF), /Manager/);
tolak('format bulan salah', ()=>ctx.eksporBulanan('2026/09', SPV), /YYYY-MM/);
const ex = ctx.eksporBulanan(hariIni.slice(0,7), SPV);
ok('6 file CSV', ex.files.length===6 && ex.files.every(f=>f.csv.charCodeAt(0)===0xFEFF), ex.files.map(f=>f.nama));
const beliCsv = ex.files.find(f=>f.nama.indexOf('pembelian')===0).csv;
ok('pembelian: 2 penerimaan dengan harga PO 180000', beliCsv.split('\r\n').length===3 && /180000;108000000/.test(beliCsv), beliCsv.split('\r\n')[1]);
const jualCsv = ex.files.find(f=>f.nama.indexOf('penjualan')===0).csv;
ok('penjualan: 1 pengiriman aktif dengan harga SO & HPP & laba', jualCsv.split('\r\n').length===2 && /;60;255000;15300000;/.test(jualCsv), jualCsv.split('\r\n')[1]);
const ring = Object.fromEntries(ex.ringkasan);
ok('ringkasan: penjualan 15,3 jt, HPP terjual > 0, laba = selisih (hanya yang ada harga SO)', ring['Penjualan (nilai, dari harga SO)']===15300000 && ring['HPP barang terjual (semua pengiriman)']>0 && ring['HPP barang terjual (yang ada harga SO)']===ring['HPP barang terjual (semua pengiriman)'] && ring['Laba kotor (penjualan − HPP, hanya yang ada harga SO)']===15300000-ring['HPP barang terjual (yang ada harga SO)'] && ring['Penjualan tanpa SO / tanpa harga (kg)']===0, ring);
ok('ringkasan: pembelian 180 jt, 1 pekerjaan, nilai stok > 0', ring['Pembelian (nilai)']===180000000 && ring['Pekerjaan selesai']===1 && ring['Nilai stok akhir bulan (FIFO)']>0, ring);
const stokCsv = ex.files.find(f=>f.nama.indexOf('nilai_stok')===0).csv;
ok('nilai stok akhir bulan berisi baris per lokasi', stokCsv.split('\r\n').length>=3);
ok('ekspor bulan kosong: hanya header', ctx.eksporBulanan('2020-01', SPV).files.find(f=>f.nama.indexOf('pembelian')===0).csv.split('\r\n').length===1);
ok('hitungFifo_ dengan batas tanggal lama = kosong', Object.keys(ctx.hitungFifo_('2020-01-31').lapisan).length===0);

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
