/* v9: satu gudang (GP dihapus) + migrasi, tambah master dari form, daur ulang scrap → biji plastik (chassen) */
const fs=require('fs');
let src=fs.readFileSync(__dirname+'/harness.js','utf8').replace("return 'pemilik@contoh.co.id';","return '';");
fs.writeFileSync(__dirname + '/.h9.js', src);
const {ctx, SS}=require(__dirname + '/.h9.js');
let pass=0,fail=0;
const ok=(l,c,e)=>{c?(pass++,console.log('  ✓',l)):(fail++,console.log('  ✗',l,e===undefined?'':JSON.stringify(e)))};
function tolak(label, fn, pola){ let e=''; try{ fn(); }catch(x){ e=String(x.message||x); } ok(label, pola.test(e), e); }
const SPV={nama:'Manager',pin:'1357'}, STAF={nama:'Staff Gudang',pin:'1111'}, ADM={nama:'Admin',pin:'1234'};

console.log('— Migrasi v8 → v9: Stok_Awal_GP digabung, kolom dihapus, sheet Transfer diarsipkan —');
{
  /* tiru database v8: Master_Item dengan dua kolom stok awal + sheet Transfer berisi data */
  const shI = SS.insertSheet('Master_Item');
  shI.appendRow(['Kode_Item','Nama_Item','Kategori','Harga_Per_Kg','Stok_Awal_GBJ','Stok_Awal_GP','Aktif']);
  shI.appendRow(['RM-X','Bahan X','BAHAN_BAKU',1000,120,30,'YA']);
  shI.appendRow(['FG-Y','Produk Y','BARANG_JADI','',0,45,'YA']);
  const shT = SS.insertSheet('Transfer');
  shT.appendRow(['ID','Waktu','Tanggal','Arah','Kode_Item','Nama_Item','Qty_Kg']);
  shT.appendRow(['TRF-1',new Date(),'2026-09-01','GBJ_KE_GP','RM-X','Bahan X',30]);
  ctx.migrasiSkema();
  const head = SS.getSheetByName('Master_Item').rows[0];
  ok('header Master_Item: Stok_Awal tunggal, Stok_Awal_GP hilang', head.indexOf('Stok_Awal')===4 && head.indexOf('Stok_Awal_GP')<0 && head.indexOf('Aktif')===5, head);
  const peta = ctx.petaItem_();
  ok('stok awal digabung: 120 + 30 = 150', peta['RM-X'].awal===150 && peta['FG-Y'].awal===45, peta['RM-X']);
  ok('Aktif tetap terbaca YA (kolom tidak bergeser)', peta['RM-X'].aktif==='YA');
  ok('sheet Transfer diganti nama Transfer_lama, isinya utuh', !SS.getSheetByName('Transfer') && SS.getSheetByName('Transfer_lama').rows.length===2);
  ok('migrasi aman diulang', (ctx.migrasiSkema(), SS.getSheetByName('Master_Item').rows[0].indexOf('Stok_Awal')===4));
  ok('sheet baru Daur_Ulang & Daur_Ulang_Detail dibuat', !!SS.getSheetByName('Daur_Ulang') && !!SS.getSheetByName('Daur_Ulang_Detail'));
  ok('setting SUSUT_CHASSEN_PERSEN ditambah', ctx.getSetting_('SUSUT_CHASSEN_PERSEN')==='5' && ctx.getSetting_('TOLERANSI_CHASSEN_PERSEN')==='3');
  /* bersihkan → setup normal untuk uji berikutnya */
  Object.keys(SS.sheets).forEach(n=>delete SS.sheets[n]);
  ctx.lupakanMemo_();
}
ctx.setupSistem();
ok('versi 9.0.0', ctx.APP.versi==='9.0.0');
ok('stok awal 0 di seed → laporan stok kosong (belum ada transaksi)', ctx.laporanStok(SPV).daftar.length===0);

console.log('\n— Tambah master dari form (semua peran) —');
{
  const s1 = ctx.tambahMaster('SUPPLIER', {nama:'  PT  Chassen Jaya '}, STAF);
  ok('staf bisa tambah supplier, kode SUP-005, nama dirapikan', s1.ok && !s1.ada && s1.kode==='SUP-005' && s1.nama==='PT Chassen Jaya', s1);
  ok('langsung muncul di konteks', ctx.getKonteks(STAF).supplier.some(x=>x.nama==='PT Chassen Jaya'));
  const s2 = ctx.tambahMaster('SUPPLIER', {nama:'pt chassen jaya'}, SPV);
  ok('nama sama (beda huruf besar) tidak digandakan', s2.ada===true && s2.kode==='SUP-005', s2);
  ok('supplier tetap 5', ctx.getKonteks(STAF).supplier.length===5);
  const c1 = ctx.tambahMaster('CUSTOMER', {nama:'Toko Plastik Baru'}, STAF);
  ok('customer baru CUS-005', c1.kode==='CUS-005' && ctx.getKonteks(STAF).customer.some(x=>x.nama==='Toko Plastik Baru'), c1);
  const i1 = ctx.tambahMaster('ITEM', {nama:'Biji Plastik Daur Ulang Hitam', kategori:'BAHAN_BAKU'}, STAF);
  ok('item baru: kode otomatis RM-… dari nama', i1.kode==='RM-BIJI-PLASTIK-DAUR-UL' && i1.kategori==='BAHAN_BAKU', i1);
  const i2 = ctx.tambahMaster('ITEM', {nama:'Biji Plastik Daur Ulang Hitam!'}, STAF);
  ok('nama item beda tanda baca → kode unik dengan akhiran -2', i2.kode==='RM-BIJI-PLASTIK-DAUR-UL-2' && !i2.ada, i2);
  const i3 = ctx.tambahMaster('ITEM', {nama:'Polybag Baru', kategori:'BARANG_JADI'}, SPV);
  ok('barang jadi → awalan FG-', i3.kode==='FG-POLYBAG-BARU', i3);
  ok('item baru tanpa harga, stok awal 0, muncul di dropdown', ctx.getKonteks(STAF).items.some(x=>x.kode===i3.kode) && ctx.petaItem_()[i3.kode].awal===0 && ctx.petaItem_()[i3.kode].harga===0);
  tolak('nama kosong ditolak', ()=>ctx.tambahMaster('ITEM', {nama:'  '}, STAF), /Nama/);
  tolak('jenis tak dikenal', ()=>ctx.tambahMaster('WARNA', {nama:'x'}, STAF), /tidak dikenal/);
  /* nonaktif → ditambah lagi = diaktifkan */
  ctx.simpanPenerimaan({jenis:'MASUK',supplier:'PT Chassen Jaya',noSuratJalan:'SJ/X',baris:[{kode:i2.kode,qty:1}],ident:STAF});
  ctx.hapusSku(i2.kode, SPV);
  ok('SKU dinonaktifkan hilang dari dropdown', !ctx.getKonteks(STAF).items.some(x=>x.kode===i2.kode));
  const i4 = ctx.tambahMaster('ITEM', {nama:'biji plastik daur ulang hitam!'}, STAF);
  ok('tambah nama yang sama → SKU lama diaktifkan lagi, bukan dobel', i4.ada && i4.kode===i2.kode && ctx.getKonteks(STAF).items.some(x=>x.kode===i2.kode), i4);
  ok('tercatat di log audit', ctx.baca_(ctx.SHEET.LOG).some(r=>r.Aksi==='TAMBAH_MASTER'));
}

console.log('\n— Daur ulang: scrap → chassen → biji plastik —');
const SUP='CV Mitra Mete Sulawesi', VENDOR='PT Chassen Jaya';
/* stok: beli 1000 @180000 (PO), job 500 → 470 jadi + 20 scrap + 10 susut */
const po = ctx.simpanPo({supplier:SUP, baris:[{kode:'RM-CSW-W240', qty:1000, harga:180000}]}, SPV);
const poLine = ctx.poTerbuka(STAF)[0];
ctx.simpanPenerimaan({jenis:'MASUK',supplier:SUP,noSuratJalan:'SJ/1',baris:[{kode:'RM-CSW-W240',qty:1000,idPo:poLine.id}],ident:STAF});
const j = ctx.mulaiPekerjaan({kodeProduk:'FG-MM-CSW',bahanBaku:[{kode:'RM-CSW-W240',qty:500}],ident:STAF});
ctx.selesaikanPekerjaan({id:j.id,barangJadi:[{kode:'FG-MM-CSW',qty:470}],scrapKg:20,ident:STAF});
const SCR='SCR-FG-MM-CSW', DU='RM-BIJI-PLASTIK-DAUR-UL';
ok('scrap 20 kg ada di gudang', ctx.getKonteks(STAF).stok[SCR].gbj===20);
tolak('bahan baku biasa tidak bisa dikirim ke chassen', ()=>ctx.mulaiDaurUlang({vendor:VENDOR, scrap:[{kode:'RM-CSW-W240',qty:5}], ident:STAF}), /bukan scrap/);
tolak('tanpa vendor ditolak', ()=>ctx.mulaiDaurUlang({scrap:[{kode:SCR,qty:5}], ident:STAF}), /vendor/i);
tolak('tanpa scrap ditolak', ()=>ctx.mulaiDaurUlang({vendor:VENDOR, scrap:[], ident:STAF}), /belum diisi/);
const d1 = ctx.mulaiDaurUlang({vendor:VENDOR, noSuratJalan:'SJ/CH/1', scrap:[{kode:SCR,qty:15}], catatan:'kirim pagi', ident:STAF});
ok('batch dibuat, 15 kg', d1.ok && /^DUR-/.test(d1.id) && d1.totalKg===15, d1);
ok('scrap di gudang berkurang jadi 5 (dalam perjalanan ke chassen)', ctx.getKonteks(STAF).stok[SCR].gbj===5);
ok('neraca: daurKirim 15', ctx.laporanStok(SPV).daftar.find(s=>s.kode===SCR).daurKirim===15);
ok('konteks: daurBerjalan = 1', ctx.getKonteks(STAF).ringkasan.daurBerjalan===1);
const bj = ctx.daftarDaurUlang(STAF, '');
ok('daftar berjalan: 1 batch, staf tidak dapat hpp', bj.length===1 && bj[0].status==='BERJALAN' && bj[0].hpp===undefined && bj[0].scrap[0].qty===15, bj[0]);
ok('manager dapat hpp (masih kosong)', ctx.daftarDaurUlang(SPV, '')[0].hpp !== undefined);
tolak('terima hasil sebagai barang jadi ditolak', ()=>ctx.selesaikanDaurUlang({id:d1.id, hasil:[{kode:'FG-MM-CSW',qty:10}], ident:STAF}), /bukan bahan baku/);
tolak('tanggal terima sebelum kirim ditolak', ()=>ctx.selesaikanDaurUlang({id:d1.id, hasil:[{kode:DU,qty:14}], tanggalTerima:'2026-01-01', ident:STAF}), /sebelum tanggal kirim|terlalu lama/);
/* staf terima 14 kg (susut 1 kg = 6,67% → normal 5 + toleransi 3 = 8 → NORMAL); staf tidak bisa isi jasa */
const t1 = ctx.selesaikanDaurUlang({id:d1.id, hasil:[{kode:DU,qty:14}], biayaJasa:999999, catatan:'diterima sore', ident:STAF});
ok('hasil 14 kg, susut 1 kg = 6,67% NORMAL', t1.hasil===14 && t1.susut===1 && t1.persen===6.67 && t1.status==='NORMAL' && t1.batas===8, t1);
ok('staf tidak menerima hpp di balasan', t1.hpp===undefined);
const row1 = ctx.baca_(ctx.SHEET.DAUR).find(r=>r.ID===d1.id);
ok('biaya jasa dari staf DIABAIKAN (kosong)', row1.Biaya_Jasa==='' && row1.Status==='SELESAI' && row1.Nama_Penerima==='Staff Gudang', row1);
ok('biji plastik daur ulang masuk gudang 14 kg', ctx.getKonteks(STAF).stok[DU].gbj===14);
ok('neraca: daurHasil 14', ctx.laporanStok(SPV).daftar.find(s=>s.kode===DU).daurHasil===14);
ok('daurBerjalan kembali 0', ctx.getKonteks(STAF).ringkasan.daurBerjalan===0);
ok('nilai scrap FIFO = 0 (scrap dinilai 0), HPP/kg = 0 sebelum jasa diisi', row1.Nilai_Scrap===0 && row1.HPP_Per_Kg===0);

console.log('\n— Manager isi biaya jasa → HPP biji daur ulang = jasa / kg, mengalir ke FIFO & pekerjaan —');
tolak('staf tidak boleh ubah biaya jasa', ()=>ctx.ubahDaurUlang(d1.id, {biayaJasa:70000}, STAF), /Manager/);
const u1 = ctx.ubahDaurUlang(d1.id, {biayaJasa:70000}, SPV);
ok('jasa 70.000 / 14 kg = HPP 5.000/kg', u1.berubah && u1.hppPerKg===5000, u1);
const row1b = ctx.baca_(ctx.SHEET.DAUR).find(r=>r.ID===d1.id);
ok('kolom HPP terisi & log edit tercatat', row1b.HPP_Total===70000 && row1b.HPP_Per_Kg===5000 && /jasa: — → 70000/.test(row1b.Log_Edit), row1b);
ok('detail HASIL dapat harga 5.000', ctx.baca_(ctx.SHEET.DAUR_DETAIL).find(d=>d.ID_Daur===d1.id && d.Jenis==='HASIL').Harga_Per_Kg===5000);
const nilai = ctx.laporanNilaiStok(SPV).daftar.find(x=>x.kode===DU);
ok('nilai stok FIFO: 14 kg @5.000 (lapisan DUR)', nilai.qty===14 && nilai.rata===5000 && nilai.lapisan[0].asal===d1.id, nilai);
const j2 = ctx.mulaiPekerjaan({kodeProduk:'FG-MM-CSW',bahanBaku:[{kode:DU,qty:10}],ident:STAF});
ok('pekerjaan memakai biji daur ulang @5.000 (FIFO), bukan harga master', ctx.baca_(ctx.SHEET.PEKERJAAN).find(r=>r.ID===j2.id).HPP_Bahan===50000);
ok('daftar SELESAI (manager) tampilkan hpp', ctx.daftarDaurUlang(SPV,'SELESAI')[0].hpp.perKg===5000 && ctx.daftarDaurUlang(SPV,'SELESAI')[0].hpp.jasaKosong===false);
ok('ambilDaurUlang staf: tanpa hpp, ada scrap & hasil', (()=>{ const a=ctx.ambilDaurUlang(d1.id, STAF); return a.hpp===undefined && a.scrap.length===1 && a.hasil.length===1 && a.bolehUbah===false; })());
ok('ambilDaurUlang manager: hpp ada, bolehUbah', (()=>{ const a=ctx.ambilDaurUlang(d1.id, SPV); return a.hpp.jasa===70000 && a.bolehUbah===true; })());

console.log('\n— Batch dengan jasa langsung oleh manager; susut TINGGI; batal —');
const d2 = ctx.mulaiDaurUlang({vendor:VENDOR, scrap:[{kode:SCR,qty:5}], ident:STAF});
const t2 = ctx.selesaikanDaurUlang({id:d2.id, hasil:[{kode:DU,qty:4}], biayaJasa:20000, ident:SPV});
ok('susut 1 dari 5 = 20% → TINGGI', t2.status==='TINGGI' && t2.persen===20, t2);
ok('manager dapat hpp: jasa 20.000, 5.000/kg', t2.hpp && t2.hpp.jasa===20000 && t2.hpp.perKg===5000, t2.hpp);
tolak('batch selesai tidak bisa diterima lagi', ()=>ctx.selesaikanDaurUlang({id:d2.id, hasil:[{kode:DU,qty:1}], ident:SPV}), /sudah SELESAI/);
ok('scrap gudang sekarang 0', ctx.getKonteks(STAF).stok[SCR].gbj===0);
ok('biji daur ulang: 14 + 4 − 10 dipakai job = 8', ctx.getKonteks(STAF).stok[DU].gbj===8);
/* batal: staf hanya batch sendiri yang BERJALAN */
const d3 = ctx.mulaiDaurUlang({vendor:VENDOR, scrap:[{kode:SCR,qty:0.5}], ident:STAF});
tolak('staf tidak bisa batalkan batch selesai', ()=>ctx.batalkanDaurUlang(d2.id, 'x', STAF), /manager/);
ok('scrap −0,5 (batch 3 keluar)', ctx.getKonteks(STAF).stok[SCR].gbj===-0.5);
ctx.batalkanDaurUlang(d3.id, 'salah kirim', STAF);
ok('staf batalkan batch sendiri BERJALAN → scrap kembali', ctx.baca_(ctx.SHEET.DAUR).find(r=>r.ID===d3.id).Status==='DIBATALKAN' && ctx.getKonteks(STAF).stok[SCR].gbj===0);
tolak('batal 2x ditolak', ()=>ctx.batalkanDaurUlang(d3.id, '', SPV), /sudah dibatalkan/);
ctx.batalkanDaurUlang(d2.id, 'ternyata salah timbang', SPV);
ok('manager batalkan batch selesai → hasil & scrap tidak dihitung', ctx.getKonteks(STAF).stok[DU].gbj===4 && ctx.getKonteks(STAF).stok[SCR].gbj===5);
ok('batalkanEntriSendiri dengan ID DUR- diarahkan ke daur ulang', (()=>{ try { ctx.batalkanEntriSendiri(d3.id, '', SPV); return false; } catch(e){ return /sudah dibatalkan/.test(e.message); } })());

console.log('\n— Laporan, kalender, aktivitas, ekspor, hitung ulang HPP —');
const lap = ctx.laporanDaurUlang(90, SPV);
ok('laporan: 1 batch selesai (yang dibatalkan tidak), scrap 15 → 14, susut 6,67%', lap.total.batch===1 && lap.total.scrap===15 && lap.total.hasil===14 && lap.total.persen===6.67, lap.total);
ok('laporan manager: jasa 70.000, HPP/kg 5.000, per vendor', lap.total.jasa===70000 && lap.total.hppPerKg===5000 && lap.perVendor[0].vendor===VENDOR && lap.perVendor[0].jasaPerKg===5000, lap.perVendor);
const lapS = ctx.laporanDaurUlang(90, STAF);
ok('laporan staf: tanpa jasa/hpp', lapS.total.jasa===undefined && lapS.perVendor[0].jasa===undefined && lapS.detail.every(d=>d.hpp===undefined));
ok('JSON laporan staf tidak memuat "jasa"', JSON.stringify(lapS).indexOf('jasa')<0 && JSON.stringify(ctx.daftarDaurUlang(STAF,'SEMUA')).indexOf('hpp')<0);
const kal = ctx.kalender(null, STAF);
const hariIni = kal.hari.find(h=>h.tanggal===kal.hariIni);
ok('kalender: kejadian DAUR_KIRIM & DAUR_TERIMA, tanpa harga', hariIni.kejadian.some(e=>e.jenis==='DAUR_KIRIM' && e.sheet==='daur') && hariIni.kejadian.some(e=>e.jenis==='DAUR_TERIMA' && e.persen===6.67) && JSON.stringify(kal).indexOf('jasa')<0);
ok('kalender: batch dibatalkan tidak muncul', !hariIni.kejadian.some(e=>e.id===d3.id));
const akt = ctx.aktivitasStaf('Staff Gudang', 30, SPV);
ok('aktivitas staf mencatat DAUR_KIRIM & DAUR_TERIMA', akt.daftar[0].jenis.DAUR_KIRIM>=1 && akt.daftar[0].jenis.DAUR_TERIMA===1, akt.daftar[0].jenis);
const bulan = ctx.tglStr_(new Date()).slice(0,7);
const ex = ctx.eksporBulanan(bulan, SPV);
const daurCsv = ex.files.find(f=>f.nama.indexOf('daur_ulang')===0).csv.split('\r\n');
ok('ekspor: daur_ulang 1 baris (yang dibatalkan tidak), ada jasa 70000', daurCsv.length===2 && /;70000;70000;5000;/.test(daurCsv[1]), daurCsv[1]);
const ring = Object.fromEntries(ex.ringkasan);
ok('ringkasan ekspor: baris daur ulang', ring['Daur ulang scrap: batch selesai']===1 && ring['Daur ulang: biaya jasa chassen (nilai)']===70000 && ring['Daur ulang: biji plastik diterima (kg)']===14, ring);
/* hitung ulang HPP: ubah jasa langsung di sheet lalu hitung ulang → HPP daur ikut */
const rowX = ctx.baca_(ctx.SHEET.DAUR).find(r=>r.ID===d1.id);
ctx.ubahBaris_(ctx.SHEET.DAUR, rowX._baris, { Biaya_Jasa: 140000 });
const hu = ctx.hitungUlangHpp(SPV);
ok('hitungUlangHpp memperbarui HPP daur ulang (140.000/14 = 10.000)', hu.daurDiubah===1 && ctx.baca_(ctx.SHEET.DAUR).find(r=>r.ID===d1.id).HPP_Per_Kg===10000, hu);
ok('FIFO lapisan biji daur ulang ikut 10.000', ctx.laporanNilaiStok(SPV).daftar.find(x=>x.kode===DU).rata===10000);
ok('skuDipakai_ mengenali SKU yang hanya dipakai daur ulang', ctx.skuDipakai_()[DU]===true);

console.log('\n— Harga tidak pernah bocor ke STAF (v9) —');
{
  const semua = JSON.stringify([ctx.getKonteks(STAF), ctx.daftarDaurUlang(STAF,'SEMUA'), ctx.ambilDaurUlang(d1.id, STAF), ctx.laporanDaurUlang(90, STAF), ctx.kalender(null, STAF)]);
  ok('tidak ada field hpp/jasa/harga/nilai/biaya di balasan untuk staf', !/"(hpp|jasa\w*|harga\w*|nilai\w*|biaya\w*)":/i.test(semua) && !/jasa: [—\d]/.test(semua) && !/\b70000\b|\b140000\b|\b10000\b/.test(semua));
}

fs.unlinkSync(__dirname + '/.h9.js');
console.log('\n================ '+pass+' lulus, '+fail+' gagal ================');
process.exit(fail?1:0);
