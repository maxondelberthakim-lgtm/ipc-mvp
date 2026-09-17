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
c2.simpanTransfer({arah:'GBJ_KE_GP',baris:[{kode:'RM-CSW-W240',qty:300}],ident:STAF2});
c2.simpanPengiriman({jenis:'KELUAR',customer:'PT Ritel Nusantara',noSuratJalan:'DO/1',baris:[{kode:'RM-CSW-W240',qty:50}],ident:STAF});
const rM=c2.riwayatInput('BELI_MASUK',14,STAF);
ok('riwayat masuk: 1 entri', rM.length===1 && rM[0].qty===500 && rM[0].partner==='CV Mitra Mete Sulawesi', rM);
ok('riwayat retur supplier terpisah', c2.riwayatInput('BELI_RETUR',14,STAF).length===1);
ok('riwayat transfer ke GP', c2.riwayatInput('TRF_KE_GP',14,STAF).length===1);
ok('riwayat transfer ke GBJ kosong', c2.riwayatInput('TRF_KE_GBJ',14,STAF).length===0);
ok('riwayat keluar', c2.riwayatInput('JUAL_KELUAR',14,STAF)[0].qty===50);
tolak('jenis salah ditolak', ()=>c2.riwayatInput('XXX',14,STAF), /tidak dikenal/);

console.log('\n— Izin edit —');
const idM = rM[0].id;
ok('pencatat sendiri boleh edit (MENUNGGU)', rM[0].bolehEdit===true);
const rLain = c2.riwayatInput('BELI_MASUK',14,STAF2)[0];
ok('staf lain TIDAK boleh edit', rLain.bolehEdit===false);
tolak('staf lain ditolak server', ()=>c2.simpanEditEntri(idM,{qty:510},STAF2), /catat sendiri/);
ok('supervisor boleh edit', c2.riwayatInput('BELI_MASUK',14,SPV)[0].bolehEdit===true);

console.log('\n— Staf: edit = USULAN (entri tidak berubah sampai disetujui) —');
const e1 = c2.simpanEditEntri(idM,{qty:510, noSuratJalan:'SJ/1-REV', catatan:'timbang ulang'},STAF,'salah timbang');
ok('staf: hasil diajukan, bukan diterapkan', e1.ok && e1.diajukan && !e1.berubah && e1.jenis==='EDIT', e1);
let rowM = c2.baca_(c2.SHEET.PENERIMAAN).find(r=>r.ID===idM);
ok('qty masih 500 (belum disetujui)', rowM.Qty_Kg===500);
ok('riwayat staf tandai usulan menunggu', c2.riwayatInput('BELI_MASUK',14,STAF)[0].usulan.jenis==='EDIT');
tolak('usulan kedua untuk entri yang sama ditolak', ()=>c2.simpanEditEntri(idM,{qty:511},STAF), /Sudah ada usulan/);
tolak('staf tidak bisa lihat antrian usulan', ()=>c2.daftarPermintaan(STAF), /Supervisor/);
tolak('staf tidak bisa meninjau', ()=>c2.tinjauPermintaan(e1.idPermintaan,'setuju','',STAF), /Supervisor/);
ok('getKonteks spv: 1 usulan menunggu', c2.getKonteks(SPV).ringkasan.permintaanMenunggu===1);
ok('getKonteks staf: tidak dihitung', c2.getKonteks(STAF).ringkasan.permintaanMenunggu===0);
const q = c2.daftarPermintaan(SPV);
ok('antrian usulan: 1, ada entri & usulan', q.length===1 && q[0].entri.qty===500 && q[0].usulan.qty===510 && q[0].alasan==='salah timbang', q[0]);
const tj = c2.tinjauPermintaan(e1.idPermintaan,'setuju','ok dicek',SPV);
ok('disetujui → diterapkan', tj.status==='DISETUJUI' && tj.hasil.berubah===true, tj);
rowM = c2.baca_(c2.SHEET.PENERIMAAN).find(r=>r.ID===idM);
ok('qty jadi 510', rowM.Qty_Kg===510);
ok('no SJ berubah', rowM.No_Surat_Jalan==='SJ/1-REV');
ok('Log_Edit: disetujui oleh Manager dari usulan Staff Gudang', /Manager: disetujui dari usulan Staff Gudang .*qty: 500 → 510 kg/.test(rowM.Log_Edit), rowM.Log_Edit);
ok('status tetap MENUNGGU', rowM.Status==='MENUNGGU');
ok('antrian kosong lagi', c2.daftarPermintaan(SPV).length===0 && c2.daftarPermintaan(SPV,'DISETUJUI').length===1);
tolak('usulan tidak bisa ditinjau 2x', ()=>c2.tinjauPermintaan(e1.idPermintaan,'setuju','',SPV), /sudah ditinjau/);
// tolak
const e1b = c2.simpanEditEntri(idM,{qty:999},STAF,'iseng');
c2.tinjauPermintaan(e1b.idPermintaan,'tolak','angka tidak masuk akal',SPV);
ok('ditolak → qty tetap 510', c2.baca_(c2.SHEET.PENERIMAAN).find(r=>r.ID===idM).Qty_Kg===510);
ok('riwayat: usulan hilang setelah ditolak', c2.riwayatInput('BELI_MASUK',14,STAF)[0].usulan===null);
ok('edit tanpa perubahan -> berubah:false, tidak diajukan', (()=>{const x=c2.simpanEditEntri(idM,{qty:510},STAF); return x.berubah===false && !x.diajukan;})());
tolak('qty 0 ditolak sebelum masuk antrian', ()=>c2.simpanEditEntri(idM,{qty:0},STAF), /lebih dari 0/);
ok('antrian tetap kosong setelah usulan invalid', c2.daftarPermintaan(SPV).length===0);
// supervisor langsung
const e2 = c2.simpanEditEntri(idM,{kode:'RM-CSW-W320'},SPV);
ok('supervisor: langsung diterapkan', e2.berubah===true && !e2.diajukan);
ok('ganti item tercatat', /item: Kacang Mete Mentah W240 → Kacang Mete Mentah W320/.test(c2.baca_(c2.SHEET.PENERIMAAN).find(r=>r.ID===idM).Log_Edit));
ok('stok ikut angka baru', c2.laporanStok(SPV).daftar.find(s=>s.kode==='RM-CSW-W320').beli===510);

console.log('\n— Setelah review, staf masih boleh MENGAJUKAN (bukan mengubah) —');
c2.tinjauTransfer(idM,'setuju','',SPV);
ok('bolehEdit staf = true (ajukan), perluPersetujuan = true', (()=>{const r=c2.riwayatInput('BELI_MASUK',14,STAF)[0]; return r.bolehEdit===true && r.perluPersetujuan===true;})());
const e4s = c2.simpanEditEntri(idM,{qty:520},STAF);
ok('staf setelah DISETUJUI → tetap usulan', e4s.diajukan===true);
c2.tinjauPermintaan(e4s.idPermintaan,'tolak','',SPV);
ok('supervisor masih bisa langsung', c2.simpanEditEntri(idM,{qty:520},SPV).berubah===true);
ok('ambilEntri kembalikan sheet', c2.ambilEntri(idM,SPV).sheet==='Penerimaan');

console.log('\n— Batal: staf → usulan BATAL, supervisor setujui —');
const idOut = c2.riwayatInput('JUAL_KELUAR',14,STAF)[0].id;
tolak('staf lain tidak bisa ajukan batal', ()=>c2.batalkanEntriSendiri(idOut,'x',STAF2), /sendiri/);
const b1 = c2.batalkanEntriSendiri(idOut,'dobel input',STAF);
ok('staf: usulan BATAL diajukan', b1.diajukan && b1.jenis==='BATAL', b1);
ok('status masih MENUNGGU (belum disetujui)', c2.baca_(c2.SHEET.PENGIRIMAN).find(r=>r.ID===idOut).Status==='MENUNGGU');
ok('masih dihitung di stok', c2.laporanStok(SPV).daftar.find(s=>s.kode==='RM-CSW-W240').jual===50);
c2.tinjauPermintaan(b1.idPermintaan,'setuju','',SPV);
ok('status DIBATALKAN', c2.baca_(c2.SHEET.PENGIRIMAN).find(r=>r.ID===idOut).Status==='DIBATALKAN');
ok('keluar dari stok', (c2.laporanStok(SPV).daftar.find(s=>s.kode==='RM-CSW-W240')||{jual:0}).jual===0);
ok('alasan usulan ikut ke Catatan_Tinjau', /dobel input/.test(c2.baca_(c2.SHEET.PENGIRIMAN).find(r=>r.ID===idOut).Catatan_Tinjau));
tolak('tidak bisa diajukan batal 2x', ()=>c2.batalkanEntriSendiri(idOut,'x',STAF), /sudah dibatalkan/);

console.log('\n— Tanggal transaksi —');
const hariIni = c2.tglStr_(new Date());
const kemarin = c2.tglStr_(new Date(Date.now()-864e5));
const rK = c2.simpanPenerimaan({jenis:'MASUK',supplier:'CV Mitra Mete Sulawesi',noSuratJalan:'SJ/K',baris:[{kode:'RM-CSW-W240',qty:10}],tanggal:kemarin,ident:STAF});
ok('tanggal kemarin tersimpan', c2.baca_(c2.SHEET.PENERIMAAN).find(r=>r.ID===rK.ids[0]).Tanggal===kemarin);
ok('default = hari ini', c2.baca_(c2.SHEET.PENERIMAAN).find(r=>r.ID===idM).Tanggal===hariIni);
tolak('tanggal masa depan ditolak', ()=>c2.simpanTransfer({arah:'GBJ_KE_GP',baris:[{kode:'RM-CSW-W240',qty:1}],tanggal:'2099-01-01',ident:STAF}), /masa depan/);
tolak('tanggal terlalu lama ditolak', ()=>c2.simpanTransfer({arah:'GBJ_KE_GP',baris:[{kode:'RM-CSW-W240',qty:1}],tanggal:'2020-01-01',ident:STAF}), /terlalu lama/);
tolak('format salah ditolak', ()=>c2.simpanTransfer({arah:'GBJ_KE_GP',baris:[{kode:'RM-CSW-W240',qty:1}],tanggal:'16/09/2026',ident:STAF}), /YYYY-MM-DD/);
ok('kg masuk hari ini pakai Tanggal (kemarin tidak ikut)', c2.getKonteks(SPV).ringkasan.masukHariIni===520);
ok('supervisor ubah tanggal entri', /tanggal: /.test(c2.simpanEditEntri(rK.ids[0],{tanggal:hariIni},SPV).log.join()));

console.log('\n— Stok per item di konteks (petunjuk form) —');
const kS = c2.getKonteks(STAF);
ok('stok W240 di GBJ & GP tersedia', kS.stok['RM-CSW-W240'] && kS.stok['RM-CSW-W240'].gp===300 && kS.stok['RM-CSW-W240'].gbj===c2.laporanStok(SPV).daftar.find(s=>s.kode==='RM-CSW-W240').gbj, kS.stok['RM-CSW-W240']);
ok('hariIni & maksMundurHari dikirim', kS.hariIni===hariIni && kS.maksMundurHari===60);

console.log('\n— Edit pekerjaan: hitung ulang susut & HPP —');
const j = c2.mulaiPekerjaan({kodeProduk:'FG-MM-CSW',bahanBaku:[{kode:'RM-CSW-W240',qty:300}],ident:STAF2});
c2.selesaikanPekerjaan({id:j.id,barangJadi:[{kode:'FG-MM-CSW',qty:285}],scrapKg:3,ident:STAF2});
const sel = c2.daftarPekerjaanSelesai(14,STAF2);
ok('daftar selesai ada 1', sel.length===1 && sel[0].susut===12, sel[0]);
ok('operator boleh mengajukan edit', sel[0].bolehEdit===true && sel[0].perluPersetujuan===true);
ok('staf lain tidak boleh', c2.daftarPekerjaanSelesai(14,STAF)[0].bolehEdit===false);
ok('staf tidak lihat hpp di daftar selesai', sel[0].hpp===undefined);
ok('spv lihat hpp di daftar selesai', c2.daftarPekerjaanSelesai(14,SPV)[0].hpp.total===56250000);
const detSebelum = c2.baca_(c2.SHEET.DETAIL).filter(d=>d.ID_Pekerjaan===j.id).length;
const full = c2.ambilPekerjaan(j.id, STAF2);
ok('ambilPekerjaan: 1 bahan, 1 jadi, 1 scrap', full.bahanBaku.length===1 && full.barangJadi.length===1 && full.scrap.length===1);
// salah ketik: barang jadi 285 -> harusnya 275, scrap 3 -> 5
const usulJob = c2.simpanEditPekerjaan(j.id, {bahanBaku:[{kode:'RM-CSW-W240',qty:300}], barangJadi:[{kode:'FG-MM-CSW',qty:275}], scrapKg:5, alasan:'salah catat'}, STAF2);
ok('staf: edit job jadi usulan EDIT_JOB', usulJob.diajukan && usulJob.jenis==='EDIT_JOB', usulJob);
ok('job belum berubah', c2.baca_(c2.SHEET.PEKERJAAN).find(r=>r.ID===j.id).Susut_Kg===12);
ok('usulan tampil di daftar selesai', c2.daftarPekerjaanSelesai(14,STAF2)[0].usulan.jenis==='EDIT_JOB');
tolak('staf lain tidak bisa ajukan', ()=>c2.simpanEditPekerjaan(j.id,{bahanBaku:[{kode:'RM-CSW-W240',qty:1}]},STAF), /operator/);
const e3 = c2.tinjauPermintaan(usulJob.idPermintaan,'setuju','',SPV).hasil;
ok('susut dihitung ulang: 300-275-5 = 20 kg', e3.susut===20 && e3.persen===6.67, e3);
ok('status jadi TINGGI (batas 5.5)', e3.status==='TINGGI');
const detSesudah = c2.baca_(c2.SHEET.DETAIL).filter(d=>d.ID_Pekerjaan===j.id);
ok('baris detail diganti, bukan ditumpuk', detSesudah.length===detSebelum && detSesudah.length===3, detSesudah.length);
const rowJ = c2.baca_(c2.SHEET.PEKERJAAN).find(r=>r.ID===j.id);
ok('HPP per kg dihitung ulang: 55.950.000/275', rowJ.HPP_Per_Kg===Math.round(56250000/275), rowJ.HPP_Per_Kg);
ok('nilai susut 20 × 185.000', rowJ.Nilai_Susut===3700000, rowJ.Nilai_Susut);
ok('Log_Edit pekerjaan: Manager menyetujui usulan Sri', /Manager: disetujui dari usulan Sri .*jadi 285 → 275/.test(rowJ.Log_Edit), rowJ.Log_Edit);
ok('hasil persetujuan (untuk spv) memuat hpp', e3.hpp && e3.hpp.total>0);
tolak('staf lain ditolak edit job', ()=>c2.simpanEditPekerjaan(j.id,{bahanBaku:[{kode:'RM-CSW-W240',qty:1}],barangJadi:[{kode:'FG-MM-CSW',qty:1}]},STAF), /operator/);
const e4 = c2.simpanEditPekerjaan(j.id, {bahanBaku:[{kode:'RM-CSW-W240',qty:300}], barangJadi:[{kode:'FG-MM-CSW',qty:285}], scrapKg:3}, SPV);
ok('supervisor bisa & dapat hpp', e4.hpp && e4.hpp.perKg===Math.round(56250000/285), e4.hpp);
ok('laporan susut konsisten setelah edit', c2.laporanSusut(30,SPV).total.susut===12);
ok('stok GP ikut angka terbaru', c2.laporanStok(SPV).daftar.find(s=>s.kode==='FG-MM-CSW').gp===285);

fs.unlinkSync(__dirname+'/.h2.js');
console.log('\n================ '+pass+' lulus, '+fail+' gagal ================');
process.exit(fail?1:0);
