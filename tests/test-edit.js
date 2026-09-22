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
c2.simpanPenerimaan({jenis:'MASUK',supplier:'CV Mitra Mete Sulawesi',noSuratJalan:'SJ/1',baris:[{kode:'RM-CSW-W240',qty:500}],ident:STAF});
c2.simpanPenerimaan({jenis:'RETUR',supplier:'CV Mitra Mete Sulawesi',baris:[{kode:'RM-CSW-W240',qty:20,idAsal:c2.returTersedia(STAF)[0].id}],ident:STAF});
c2.simpanPengiriman({jenis:'KELUAR',customer:'PT Ritel Nusantara',noSuratJalan:'DO/1',baris:[{kode:'RM-CSW-W240',qty:50}],ident:STAF});
const rM=c2.riwayatInput('BELI_MASUK',14,STAF);
ok('riwayat masuk: 1 entri', rM.length===1 && rM[0].qty===500 && rM[0].partner==='CV Mitra Mete Sulawesi', rM);
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
const e2 = c2.simpanEditEntri(idM,{kode:'RM-CSW-W320'},SPV);
ok('supervisor: langsung diterapkan', e2.berubah===true && !e2.diajukan);
ok('ganti item tercatat', /item: Kacang Mete Mentah W240 → Kacang Mete Mentah W320/.test(c2.baca_(c2.SHEET.PENERIMAAN).find(r=>r.ID===idM).Log_Edit));
ok('stok ikut angka baru', c2.laporanStok(SPV).daftar.find(s=>s.kode==='RM-CSW-W320').beli===510);

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
ok('masih dihitung di stok sebelum batal', c2.laporanStok(SPV).daftar.find(s=>s.kode==='RM-CSW-W240').jual===50);
const b1 = c2.batalkanEntriSendiri(idOut,'dobel input',STAF);
ok('staf: langsung DIBATALKAN', b1.status==='DIBATALKAN' && !b1.diajukan, b1);
ok('status DIBATALKAN, ditinjau oleh diri sendiri', (()=>{const r=c2.baca_(c2.SHEET.PENGIRIMAN).find(r=>r.ID===idOut); return r.Status==='DIBATALKAN' && /sendiri/.test(r.Ditinjau_Oleh) && /dobel input/.test(r.Catatan_Tinjau);})());
ok('keluar dari stok', (c2.laporanStok(SPV).daftar.find(s=>s.kode==='RM-CSW-W240')||{jual:0}).jual===0);
tolak('tidak bisa dibatalkan 2x', ()=>c2.batalkanEntriSendiri(idOut,'x',STAF), /sudah dibatalkan/);
ok('supervisor batalkan lewat jalur review', (()=>{ const r2=c2.simpanPengiriman({jenis:'KELUAR',customer:'PT Ritel Nusantara',noSuratJalan:'DO/2',baris:[{kode:'RM-CSW-W240',qty:5}],ident:STAF}); const b=c2.batalkanEntriSendiri(r2.ids[0],'salah',SPV); return b.status==='DIBATALKAN'; })());

console.log('\n— Tanggal transaksi —');
const hariIni = c2.tglStr_(new Date());
const kemarin = c2.tglStr_(new Date(Date.now()-864e5));
const rK = c2.simpanPenerimaan({jenis:'MASUK',supplier:'CV Mitra Mete Sulawesi',noSuratJalan:'SJ/K',baris:[{kode:'RM-CSW-W240',qty:10}],tanggal:kemarin,ident:STAF});
ok('tanggal kemarin tersimpan', c2.baca_(c2.SHEET.PENERIMAAN).find(r=>r.ID===rK.ids[0]).Tanggal===kemarin);
ok('default = hari ini', c2.baca_(c2.SHEET.PENERIMAAN).find(r=>r.ID===idM).Tanggal===hariIni);
tolak('tanggal masa depan ditolak', ()=>c2.mulaiPekerjaan({kodeProduk:'FG-MM-CSW',bahanBaku:[{kode:'RM-CSW-W240',qty:1}],tanggal:'2099-01-01',ident:STAF}), /masa depan/);
tolak('tanggal terlalu lama ditolak', ()=>c2.mulaiPekerjaan({kodeProduk:'FG-MM-CSW',bahanBaku:[{kode:'RM-CSW-W240',qty:1}],tanggal:'2020-01-01',ident:STAF}), /terlalu lama/);
tolak('format salah ditolak', ()=>c2.mulaiPekerjaan({kodeProduk:'FG-MM-CSW',bahanBaku:[{kode:'RM-CSW-W240',qty:1}],tanggal:'16/09/2026',ident:STAF}), /YYYY-MM-DD/);
ok('kg masuk hari ini pakai Tanggal (kemarin tidak ikut)', c2.getKonteks(SPV).ringkasan.masukHariIni===520);
ok('supervisor ubah tanggal entri', /tanggal: /.test(c2.simpanEditEntri(rK.ids[0],{tanggal:hariIni},SPV).log.join()));

console.log('\n— Stok per item di konteks (petunjuk form) —');
const kS = c2.getKonteks(STAF);
ok('stok W240 di gudang tersedia (tanpa gp)', kS.stok['RM-CSW-W240'] && kS.stok['RM-CSW-W240'].gp===undefined && kS.stok['RM-CSW-W240'].gbj===c2.laporanStok(SPV).daftar.find(s=>s.kode==='RM-CSW-W240').gbj, kS.stok['RM-CSW-W240']);
ok('hariIni & maksMundurHari dikirim', kS.hariIni===hariIni && kS.maksMundurHari===60);

console.log('\n— Edit pekerjaan: hitung ulang susut & HPP —');
const j = c2.mulaiPekerjaan({kodeProduk:'FG-MM-CSW',bahanBaku:[{kode:'RM-CSW-W240',qty:300}],ident:STAF2});
c2.selesaikanPekerjaan({id:j.id,barangJadi:[{kode:'FG-MM-CSW',qty:285}],scrapKg:3,ident:STAF2});
const sel = c2.daftarPekerjaanSelesai(14,STAF2);
ok('daftar selesai ada 1', sel.length===1 && sel[0].susut===12, sel[0]);
ok('operator boleh edit langsung (24 jam)', sel[0].bolehEdit===true);
ok('staf lain tidak boleh', c2.daftarPekerjaanSelesai(14,STAF)[0].bolehEdit===false);
ok('staf tidak lihat hpp di daftar selesai', sel[0].hpp===undefined);
ok('spv lihat hpp di daftar selesai', c2.daftarPekerjaanSelesai(14,SPV)[0].hpp.total===56250000);
const detSebelum = c2.baca_(c2.SHEET.DETAIL).filter(d=>d.ID_Pekerjaan===j.id).length;
const full = c2.ambilPekerjaan(j.id, STAF2);
ok('ambilPekerjaan: 1 bahan, 1 jadi, 1 scrap', full.bahanBaku.length===1 && full.barangJadi.length===1 && full.scrap.length===1);
// salah ketik: barang jadi 285 -> harusnya 275, scrap 3 -> 5
const e3 = c2.simpanEditPekerjaan(j.id, {bahanBaku:[{kode:'RM-CSW-W240',qty:300}], barangJadi:[{kode:'FG-MM-CSW',qty:275}], scrapKg:5}, STAF2);
ok('staf (operator, <24 jam): langsung diterapkan', e3.ok && !e3.diajukan && e3.susut===20 && e3.persen===6.67, e3);
ok('status jadi TINGGI (batas 5.5)', e3.status==='TINGGI');
ok('staf tidak dapat hpp di hasil', e3.hpp===undefined);
tolak('staf lain ditolak edit job', ()=>c2.simpanEditPekerjaan(j.id,{bahanBaku:[{kode:'RM-CSW-W240',qty:1}],barangJadi:[{kode:'FG-MM-CSW',qty:1}]},STAF), /catat sendiri/);
const detSesudah = c2.baca_(c2.SHEET.DETAIL).filter(d=>d.ID_Pekerjaan===j.id);
ok('baris detail diganti, bukan ditumpuk', detSesudah.length===detSebelum && detSesudah.length===3, detSesudah.length);
const rowJ = c2.baca_(c2.SHEET.PEKERJAAN).find(r=>r.ID===j.id);
ok('HPP per kg dihitung ulang: 56.250.000/275', rowJ.HPP_Per_Kg===Math.round(56250000/275), rowJ.HPP_Per_Kg);
ok('nilai susut 20 × 185.000', rowJ.Nilai_Susut===3700000, rowJ.Nilai_Susut);
ok('Log_Edit pekerjaan mencatat Sri', /Sri.*jadi 285 → 275/.test(rowJ.Log_Edit), rowJ.Log_Edit);
// lewat 24 jam → staf terkunci, supervisor masih bisa
c2.ubahBaris_(c2.SHEET.PEKERJAAN, rowJ._baris, { Waktu_Selesai: new Date(Date.now()-30*3600000) });
ok('operator setelah 24 jam: terkunci', c2.daftarPekerjaanSelesai(14,STAF2)[0].bolehEdit===false);
tolak('operator ditolak setelah 24 jam', ()=>c2.simpanEditPekerjaan(j.id,{bahanBaku:[{kode:'RM-CSW-W240',qty:300}],barangJadi:[{kode:'FG-MM-CSW',qty:280}]},STAF2), /24 jam/);
const e4 = c2.simpanEditPekerjaan(j.id, {bahanBaku:[{kode:'RM-CSW-W240',qty:300}], barangJadi:[{kode:'FG-MM-CSW',qty:285}], scrapKg:3}, SPV);
ok('supervisor bisa & dapat hpp', e4.hpp && e4.hpp.perKg===Math.round(56250000/285), e4.hpp);
c2.ubahBaris_(c2.SHEET.PEKERJAAN, rowJ._baris, { Waktu_Selesai: new Date(Date.now()-40*864e5), Tanggal: c2.tglStr_(new Date(Date.now()-40*864e5)) });
tolak('supervisor terkunci setelah 30 hari (job)', ()=>c2.simpanEditPekerjaan(j.id,{bahanBaku:[{kode:'RM-CSW-W240',qty:300}],barangJadi:[{kode:'FG-MM-CSW',qty:285}]},SPV), /periode sudah ditutup/);
c2.ubahBaris_(c2.SHEET.PEKERJAAN, rowJ._baris, { Waktu_Selesai: new Date(), Tanggal: c2.tglStr_(new Date()) });
ok('laporan susut konsisten setelah edit', c2.laporanSusut(30,SPV).total.susut===12);
ok('stok gudang ikut angka terbaru', c2.laporanStok(SPV).daftar.find(s=>s.kode==='FG-MM-CSW').gbj===285);

fs.unlinkSync(__dirname+'/.h2.js');
console.log('\n================ '+pass+' lulus, '+fail+' gagal ================');
process.exit(fail?1:0);
