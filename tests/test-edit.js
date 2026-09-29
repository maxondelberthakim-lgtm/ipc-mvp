const {ctx}=require('./harness.js');
let pass=0,fail=0;
const ok=(l,c,e)=>{c?(pass++,console.log('  ✓',l)):(fail++,console.log('  ✗',l,e===undefined?'':JSON.stringify(e)))};
function tolak(label, fn, pola){ let e=''; try{ fn(); }catch(x){ e=String(x.message||x); } ok(label, pola.test(e), e); }
// email kosong -> identitas manual, supaya peran bisa diuji
const fs=require('fs');
const src=fs.readFileSync(__dirname+'/harness.js','utf8').replace("return 'pemilik@contoh.co.id';","return '';");
fs.writeFileSync(__dirname+'/.h2.js', src);
const {ctx:c2}=require(__dirname+'/.h2.js');
c2.setupSistem();
c2.setSetting_('AKSES_TERBUKA','YA'); // Sri = nama tak terdaftar
const STAF={nama:'Staff Gudang',pin:'1111'}, STAF2={nama:'Sri'}, SPV={nama:'Manager',pin:'1357'};

console.log('— Riwayat input per proses —');
c2.simpanPenerimaan({jenis:'MASUK',supplier:'PT Sumber Biji Plastik',noSuratJalan:'SJ/1',baris:[{kode:'RM-BP-KW',qty:500}],ident:STAF});
c2.simpanPenerimaan({jenis:'RETUR',supplier:'PT Sumber Biji Plastik',baris:[{kode:'RM-BP-KW',qty:20,idAsal:c2.returTersedia(STAF)[0].id}],ident:STAF});
c2.simpanPengiriman({jenis:'KELUAR',customer:'PT Nursery Hijau Lestari',noSuratJalan:'DO/1',baris:[{kode:'RM-BP-KW',qty:50}],ident:STAF});
const rM=c2.riwayatInput('BELI_MASUK',14,STAF);
ok('riwayat masuk: 1 entri', rM.length===1 && rM[0].qty===500 && rM[0].partner==='PT Sumber Biji Plastik', rM);
ok('riwayat retur supplier terpisah', c2.riwayatInput('BELI_RETUR',14,STAF).length===1);
tolak('riwayat transfer tidak ada lagi (v9)', ()=>c2.riwayatInput('TRF_KE_GP',14,STAF), /tidak dikenal/);
ok('riwayat keluar', c2.riwayatInput('JUAL_KELUAR',14,STAF)[0].qty===50);
tolak('jenis salah ditolak', ()=>c2.riwayatInput('XXX',14,STAF), /tidak dikenal/);

console.log('\n— Izin edit (v8) —');
const idM = rM[0].id;
ok('pencatat sendiri boleh edit langsung selama MENUNGGU', rM[0].bolehEdit===true && rM[0].kunci==='' && rM[0].perluPersetujuan===false);
const rLain = c2.riwayatInput('BELI_MASUK',14,STAF2)[0];
ok('staf lain TIDAK boleh edit (kunci BUKAN_MILIK)', rLain.bolehEdit===false && rLain.kunci==='BUKAN_MILIK');
tolak('staf lain ditolak server', ()=>c2.simpanEditEntri(idM,{qty:510},STAF2), /catat sendiri/);
ok('supervisor boleh edit', c2.riwayatInput('BELI_MASUK',14,SPV)[0].bolehEdit===true);

console.log('\n— Staf: edit LANGSUNG selama MENUNGGU —');
const e1 = c2.simpanEditEntri(idM,{qty:510, noSuratJalan:'SJ/1-REV', catatan:'timbang ulang'},STAF);
ok('staf: langsung diterapkan', e1.ok && e1.berubah===true && !e1.diajukan, e1);
let rowM = c2.baca_(c2.SHEET.PENERIMAAN).find(r=>r.ID===idM);
ok('qty jadi 510, SJ berubah', rowM.Qty_Kg===510 && rowM.No_Surat_Jalan==='SJ/1-REV');
ok('Log_Edit menandai staf', /Staff Gudang: staf.*qty: 500 → 510 kg/.test(rowM.Log_Edit), rowM.Log_Edit);
ok('status tetap MENUNGGU', rowM.Status==='MENUNGGU');
ok('tidak ada usulan dibuat', c2.daftarPermintaan(SPV).length===0 && c2.getKonteks(SPV).ringkasan.permintaanMenunggu===0);
ok('edit tanpa perubahan -> berubah:false', c2.simpanEditEntri(idM,{qty:510},STAF).berubah===false);
tolak('qty 0 ditolak', ()=>c2.simpanEditEntri(idM,{qty:0},STAF), /lebih dari 0/);
tolak('staf tidak bisa lihat antrian usulan', ()=>c2.daftarPermintaan(STAF), /Supervisor/);
const e2 = c2.simpanEditEntri(idM,{kode:'RM-BP-SUP'},SPV);
ok('supervisor: langsung diterapkan', e2.berubah===true && !e2.diajukan);
ok('ganti item tercatat', /item: Biji Plastik KW → Biji Plastik Super/.test(c2.baca_(c2.SHEET.PENERIMAAN).find(r=>r.ID===idM).Log_Edit));
ok('stok ikut angka baru', c2.laporanStok(SPV).daftar.find(s=>s.kode==='RM-BP-SUP').beli===510);

console.log('\n— Setelah disetujui: staf hanya LIHAT, supervisor masih bisa ubah —');
c2.tinjauTransfer(idM,'setuju','',SPV);
const rS = c2.riwayatInput('BELI_MASUK',14,STAF)[0];
ok('staf: bolehEdit=false, kunci SUDAH_DITINJAU', rS.bolehEdit===false && rS.bolehBatal===false && rS.kunci==='SUDAH_DITINJAU', rS.kunci);
tolak('staf ditolak server setelah disetujui', ()=>c2.simpanEditEntri(idM,{qty:520},STAF), /sudah ditinjau/);
tolak('staf tidak bisa batalkan setelah disetujui', ()=>c2.batalkanEntriSendiri(idM,'x',STAF), /sudah ditinjau/);
ok('ambilEntri untuk staf tetap bisa (lihat detail)', c2.ambilEntri(idM,STAF).qty===510);
ok('supervisor masih bisa langsung', c2.simpanEditEntri(idM,{qty:520},SPV).berubah===true);
ok('ambilEntri kembalikan sheet', c2.ambilEntri(idM,SPV).sheet==='Penerimaan');

console.log('\n— Batas 30 hari: semua peran terkunci —');
const rowLama = c2.baca_(c2.SHEET.PENERIMAAN).find(r=>r.ID===idM);
c2.ubahBaris_(c2.SHEET.PENERIMAAN, rowLama._baris, { Tanggal: c2.tglStr_(new Date(Date.now()-40*864e5)) });
ok('supervisor: kunci LEWAT_BATAS', c2.riwayatInput('BELI_MASUK',14,SPV)[0].kunci==='LEWAT_BATAS');
tolak('supervisor ditolak ubah entri > 30 hari', ()=>c2.simpanEditEntri(idM,{qty:1},SPV), /periode sudah ditutup/);
c2.setSetting_('MAKS_EDIT_HARI','60');
ok('batas bisa diatur (60 hari) → boleh lagi', c2.riwayatInput('BELI_MASUK',14,SPV)[0].bolehEdit===true);
c2.setSetting_('MAKS_EDIT_HARI','30');
c2.ubahBaris_(c2.SHEET.PENERIMAAN, rowLama._baris, { Tanggal: c2.tglStr_(new Date()) });
ok('maksEditHari dikirim ke konteks', c2.getKonteks(STAF).maksEditHari===30);

console.log('\n— Batal: staf batalkan entri sendiri yang MENUNGGU langsung —');
const idOut = c2.riwayatInput('JUAL_KELUAR',14,STAF)[0].id;
tolak('staf lain tidak bisa batalkan', ()=>c2.batalkanEntriSendiri(idOut,'x',STAF2), /catat sendiri/);
ok('masih dihitung di stok sebelum batal', c2.laporanStok(SPV).daftar.find(s=>s.kode==='RM-BP-KW').jual===50);
const b1 = c2.batalkanEntriSendiri(idOut,'dobel input',STAF);
ok('staf: langsung DIBATALKAN', b1.status==='DIBATALKAN' && !b1.diajukan, b1);
ok('status DIBATALKAN, ditinjau oleh diri sendiri', (()=>{const r=c2.baca_(c2.SHEET.PENGIRIMAN).find(r=>r.ID===idOut); return r.Status==='DIBATALKAN' && /sendiri/.test(r.Ditinjau_Oleh) && /dobel input/.test(r.Catatan_Tinjau);})());
ok('keluar dari stok', (c2.laporanStok(SPV).daftar.find(s=>s.kode==='RM-BP-KW')||{jual:0}).jual===0);
tolak('tidak bisa dibatalkan 2x', ()=>c2.batalkanEntriSendiri(idOut,'x',STAF), /sudah dibatalkan/);
ok('supervisor batalkan lewat jalur review', (()=>{ const r2=c2.simpanPengiriman({jenis:'KELUAR',customer:'PT Nursery Hijau Lestari',noSuratJalan:'DO/2',baris:[{kode:'RM-BP-KW',qty:5}],ident:STAF}); const b=c2.batalkanEntriSendiri(r2.ids[0],'salah',SPV); return b.status==='DIBATALKAN'; })());

console.log('\n— Tanggal transaksi —');
const hariIni = c2.tglStr_(new Date());
const kemarin = c2.tglStr_(new Date(Date.now()-864e5));
const rK = c2.simpanPenerimaan({jenis:'MASUK',supplier:'PT Sumber Biji Plastik',noSuratJalan:'SJ/K',baris:[{kode:'RM-BP-KW',qty:10}],tanggal:kemarin,ident:STAF});
ok('tanggal kemarin tersimpan', c2.baca_(c2.SHEET.PENERIMAAN).find(r=>r.ID===rK.ids[0]).Tanggal===kemarin);
ok('default = hari ini', c2.baca_(c2.SHEET.PENERIMAAN).find(r=>r.ID===idM).Tanggal===hariIni);
tolak('tanggal masa depan ditolak', ()=>c2.simpanLaporanShift({shift:'1',blowing:{operator:'Sri',ambil:[{kode:'RM-BP-KW',qty:1}],hasil:[{kualitas:'KW',qty:1}]},tanggal:'2099-01-01'}, SPV), /masa depan/);
tolak('tanggal terlalu lama ditolak', ()=>c2.simpanLaporanShift({shift:'1',blowing:{operator:'Sri',ambil:[{kode:'RM-BP-KW',qty:1}],hasil:[{kualitas:'KW',qty:1}]},tanggal:'2020-01-01'}, SPV), /terlalu lama/);
tolak('format salah ditolak', ()=>c2.simpanLaporanShift({shift:'1',blowing:{operator:'Sri',ambil:[{kode:'RM-BP-KW',qty:1}],hasil:[{kualitas:'KW',qty:1}]},tanggal:'16/09/2026'}, SPV), /YYYY-MM-DD/);
ok('kg masuk hari ini pakai Tanggal (kemarin tidak ikut)', c2.getKonteks(SPV).ringkasan.masukHariIni===520);
ok('supervisor ubah tanggal entri', /tanggal: /.test(c2.simpanEditEntri(rK.ids[0],{tanggal:hariIni},SPV).log.join()));

console.log('\n— Stok per item di konteks (petunjuk form) —');
const kS = c2.getKonteks(STAF);
ok('stok W240 di gudang tersedia (tanpa gp)', kS.stok['RM-BP-KW'] && kS.stok['RM-BP-KW'].gp===undefined && kS.stok['RM-BP-KW'].gbj===c2.laporanStok(SPV).daftar.find(s=>s.kode==='RM-BP-KW').gbj, kS.stok['RM-BP-KW']);
ok('hariIni & maksMundurHari dikirim', kS.hariIni===hariIni && kS.maksMundurHari===60);

console.log('\n— Edit laporan shift: manager saja, detail ditulis ulang, tanggal mundur —');
const kemarin2 = c2.tglStr_(new Date(Date.now()-864e5));
const sh = c2.simpanLaporanShift({tanggal:kemarin2, shift:'2', blowing:{operator:['Sri','Budi'], ambil:[{kode:'RM-BP-KW',qty:300}], hasil:[{kualitas:'KW',qty:285}], bs:[{kualitas:'KW',qty:3}]}}, SPV);
ok('laporan bertanggal kemarin tersimpan', sh.tanggal===kemarin2 && sh.blowing.totalAmbil===300, sh);
ok('staf lihat laporan tapi tidak boleh edit', c2.daftarLaporanShift(STAF, 7)[0].bolehEdit===false);
tolak('staf ditolak ubah laporan shift', ()=>c2.ubahLaporanShift(sh.id, {blowing:{operator:'Sri', hasil:[{kualitas:'KW',qty:1}]}}, STAF), /Manager|Admin/);
tolak('staf ditolak batalkan laporan shift', ()=>c2.batalkanLaporanShift(sh.id, 'x', STAF), /Manager|Admin/);
tolak('simpanEditEntri untuk ID SHF- diarahkan ke ubahLaporanShift', ()=>c2.simpanEditEntri(sh.id, {qty:1}, SPV), /ubahLaporanShift/);
const detSebelum = c2.baca_(c2.SHEET.SHIFT_DETAIL).filter(d=>d.ID_Shift===sh.id).length;
// salah ketik: hasil 285 → 275, BS 3 → 5, operator ganti
const e3 = c2.ubahLaporanShift(sh.id, {blowing:{operator:['Sri'], ambil:[{kode:'RM-BP-KW',qty:300}], hasil:[{kualitas:'KW',qty:275}], bs:[{kualitas:'KW',qty:5}]}}, SPV);
ok('manager: langsung diterapkan, log roll & BS & operator', e3.ok && /roll jadi 285 → 275/.test(e3.log.join(';')) && /BS blowing 3 → 5/.test(e3.log.join(';')) && /operator blowing: Sri/.test(e3.log.join(';')), e3.log);
const detSesudah = c2.baca_(c2.SHEET.SHIFT_DETAIL).filter(d=>d.ID_Shift===sh.id);
ok('baris detail diganti, bukan ditumpuk', detSesudah.length===detSebelum && detSesudah.length===3, detSesudah.length);
const rowS = c2.baca_(c2.SHEET.SHIFT).find(r=>r.ID===sh.id);
ok('total di header ikut & Log_Edit mencatat Manager', rowS.Total_Roll_Kg===275 && rowS.Total_BS_Blowing_Kg===5 && rowS.Operator_Blowing==='Sri' && rowS.Operator_Cutting==='' && /Manager/.test(rowS.Log_Edit), rowS);
ok('ubah tanggal laporan ke hari ini', /tanggal/.test(c2.ubahLaporanShift(sh.id, {tanggal:hariIni}, SPV).log.join()) && c2.baca_(c2.SHEET.SHIFT).find(r=>r.ID===sh.id).Tanggal===hariIni);
tolak('ubah ke tanggal masa depan ditolak', ()=>c2.ubahLaporanShift(sh.id, {tanggal:'2099-01-01'}, SPV), /masa depan/);
ok('stok gudang ikut angka terbaru: roll KW 275', c2.laporanStok(SPV).daftar.find(s=>s.kode==='WIP-ROLL-KW').gbj===275);
ok('laporan produksi konsisten setelah edit', c2.laporanProduksi(null, SPV).total.roll===275 && c2.laporanProduksi(null, SPV).total.bs===5);

fs.unlinkSync(__dirname+'/.h2.js');
console.log('\n================ '+pass+' lulus, '+fail+' gagal ================');
process.exit(fail?1:0);
