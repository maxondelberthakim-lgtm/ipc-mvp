const {ctx}=require('./harness.js');
let pass=0,fail=0;
const ok=(l,c,e)=>{c?(pass++,console.log('  ✓',l)):(fail++,console.log('  ✗',l,e===undefined?'':JSON.stringify(e)))};
function tolak(label, fn, pola){ let e=''; try{ fn(); }catch(x){ e=String(x.message||x); } ok(label, pola.test(e), e); }
// email kosong -> identitas manual, supaya peran bisa diuji
const fs=require('fs');
const src=fs.readFileSync(__dirname+'/harness.js','utf8').replace("return 'max@eramas.co.id';","return '';");
fs.writeFileSync(__dirname+'/.h2.js', src);
const {ctx:c2}=require(__dirname+'/.h2.js');
c2.setupSistem();
const STAF={nama:'Yanto'}, STAF2={nama:'Sri'}, SPV={nama:'Pak Anto',pin:'2468'};

console.log('— Riwayat input per proses —');
c2.simpanPenerimaan({jenis:'MASUK',supplier:'CV Mitra Mete Sulawesi',noSuratJalan:'SJ/1',baris:[{kode:'RM-CSW-W240',qty:500}],ident:STAF});
c2.simpanPenerimaan({jenis:'RETUR',supplier:'CV Mitra Mete Sulawesi',baris:[{kode:'RM-CSW-W240',qty:20}],ident:STAF});
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

console.log('\n— Edit tercatat —');
const e1 = c2.simpanEditEntri(idM,{qty:510, noSuratJalan:'SJ/1-REV', catatan:'timbang ulang'},STAF);
ok('edit sukses', e1.ok && e1.berubah, e1);
const rowM = c2.baca_(c2.SHEET.PENERIMAAN).find(r=>r.ID===idM);
ok('qty jadi 510', rowM.Qty_Kg===510);
ok('no SJ berubah', rowM.No_Surat_Jalan==='SJ/1-REV');
ok('Log_Edit terisi nama + perubahan', /Yanto: .*qty: 500 → 510 kg/.test(rowM.Log_Edit), rowM.Log_Edit);
ok('status tetap MENUNGGU', rowM.Status==='MENUNGGU');
ok('edit tanpa perubahan -> berubah:false', c2.simpanEditEntri(idM,{qty:510},STAF).berubah===false);
tolak('qty 0 ditolak', ()=>c2.simpanEditEntri(idM,{qty:0},STAF), /lebih dari 0/);
const e2 = c2.simpanEditEntri(idM,{kode:'RM-CSW-W320'},SPV);
ok('ganti item tercatat', /item: Kacang Mete Mentah W240 → Kacang Mete Mentah W320/.test(c2.baca_(c2.SHEET.PENERIMAAN).find(r=>r.ID===idM).Log_Edit));
ok('log bertumpuk (2 baris)', c2.baca_(c2.SHEET.PENERIMAAN).find(r=>r.ID===idM).Log_Edit.split('\n').length===2);
ok('stok ikut angka baru', c2.laporanStok(SPV).daftar.find(s=>s.kode==='RM-CSW-W320').beli===510);

console.log('\n— Setelah review, staf terkunci —');
c2.tinjauTransfer(idM,'setuju','',SPV);
ok('bolehEdit staf jadi false', c2.riwayatInput('BELI_MASUK',14,STAF)[0].bolehEdit===false);
tolak('staf ditolak setelah disetujui', ()=>c2.simpanEditEntri(idM,{qty:520},STAF), /sudah ditinjau/);
ok('supervisor masih bisa', c2.simpanEditEntri(idM,{qty:520},SPV).berubah===true);
ok('ambilEntri kembalikan sheet', c2.ambilEntri(idM,SPV).sheet==='Penerimaan');

console.log('\n— Batalkan sendiri —');
const idOut = c2.riwayatInput('JUAL_KELUAR',14,STAF)[0].id;
tolak('staf lain tidak bisa batalkan', ()=>c2.batalkanEntriSendiri(idOut,'x',STAF2), /sendiri/);
c2.batalkanEntriSendiri(idOut,'dobel input',STAF);
ok('status DIBATALKAN', c2.baca_(c2.SHEET.PENGIRIMAN).find(r=>r.ID===idOut).Status==='DIBATALKAN');
ok('keluar dari stok', (c2.laporanStok(SPV).daftar.find(s=>s.kode==='RM-CSW-W240')||{jual:0}).jual===0);
tolak('tidak bisa dibatalkan 2x', ()=>c2.batalkanEntriSendiri(idOut,'x',STAF), /sendiri/);

console.log('\n— Edit pekerjaan: hitung ulang susut & HPP —');
const j = c2.mulaiPekerjaan({kodeProduk:'FG-MM-CSW',bahanBaku:[{kode:'RM-CSW-W240',qty:300}],ident:STAF2});
c2.selesaikanPekerjaan({id:j.id,barangJadi:[{kode:'FG-MM-CSW',qty:285}],scrap:[{kode:'SCR-KULIT',qty:3}],ident:STAF2});
const sel = c2.daftarPekerjaanSelesai(14,STAF2);
ok('daftar selesai ada 1', sel.length===1 && sel[0].susut===12, sel[0]);
ok('operator boleh edit (<24 jam)', sel[0].bolehEdit===true);
ok('staf lain tidak boleh', c2.daftarPekerjaanSelesai(14,STAF)[0].bolehEdit===false);
ok('staf tidak lihat hpp di daftar selesai', sel[0].hpp===undefined);
ok('spv lihat hpp di daftar selesai', c2.daftarPekerjaanSelesai(14,SPV)[0].hpp.total===56250000);
const detSebelum = c2.baca_(c2.SHEET.DETAIL).filter(d=>d.ID_Pekerjaan===j.id).length;
const full = c2.ambilPekerjaan(j.id, STAF2);
ok('ambilPekerjaan: 1 bahan, 1 jadi, 1 scrap', full.bahanBaku.length===1 && full.barangJadi.length===1 && full.scrap.length===1);
// salah ketik: barang jadi 285 -> harusnya 275, scrap 3 -> 5
const e3 = c2.simpanEditPekerjaan(j.id, {bahanBaku:[{kode:'RM-CSW-W240',qty:300}], barangJadi:[{kode:'FG-MM-CSW',qty:275}], scrap:[{kode:'SCR-KULIT',qty:5}]}, STAF2);
ok('susut dihitung ulang: 300-275-5 = 20 kg', e3.susut===20 && e3.persen===6.67, e3);
ok('status jadi TINGGI (batas 5.5)', e3.status==='TINGGI');
const detSesudah = c2.baca_(c2.SHEET.DETAIL).filter(d=>d.ID_Pekerjaan===j.id);
ok('baris detail diganti, bukan ditumpuk', detSesudah.length===detSebelum && detSesudah.length===3, detSesudah.length);
const rowJ = c2.baca_(c2.SHEET.PEKERJAAN).find(r=>r.ID===j.id);
ok('HPP per kg dihitung ulang: 55.950.000/275', rowJ.HPP_Per_Kg===Math.round(56250000/275), rowJ.HPP_Per_Kg);
ok('nilai susut 20 × 185.000', rowJ.Nilai_Susut===3700000, rowJ.Nilai_Susut);
ok('Log_Edit pekerjaan terisi', /Sri: .*jadi 285 → 275/.test(rowJ.Log_Edit), rowJ.Log_Edit);
ok('staf tidak dapat hpp di hasil edit', e3.hpp===undefined);
tolak('staf lain ditolak edit job', ()=>c2.simpanEditPekerjaan(j.id,{bahanBaku:[{kode:'RM-CSW-W240',qty:1}],barangJadi:[{kode:'FG-MM-CSW',qty:1}]},STAF), /operator/);
const e4 = c2.simpanEditPekerjaan(j.id, {bahanBaku:[{kode:'RM-CSW-W240',qty:300}], barangJadi:[{kode:'FG-MM-CSW',qty:285}], scrap:[{kode:'SCR-KULIT',qty:3}]}, SPV);
ok('supervisor bisa & dapat hpp', e4.hpp && e4.hpp.perKg===Math.round(56250000/285), e4.hpp);
ok('laporan susut konsisten setelah edit', c2.laporanSusut(30,SPV).total.susut===12);
ok('stok GP ikut angka terbaru', c2.laporanStok(SPV).daftar.find(s=>s.kode==='FG-MM-CSW').gp===285);

fs.unlinkSync(__dirname+'/.h2.js');
console.log('\n================ '+pass+' lulus, '+fail+' gagal ================');
process.exit(fail?1:0);
