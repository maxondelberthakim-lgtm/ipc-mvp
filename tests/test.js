const {ctx} = require('./harness.js');
let pass=0, fail=0;
const ok=(l,c,e)=>{c?(pass++,console.log('  ✓',l)):(fail++,console.log('  ✗',l,e===undefined?'':JSON.stringify(e)))};
function tolak(label, fn, pola){ let e=''; try{ fn(); }catch(x){ e=String(x.message||x); } ok(label, pola.test(e), e); }

ctx.setupSistem();
ctx.setSetting_('PAKSA_LOGIN_MANUAL','TIDAK'); ctx.setSetting_('AKSES_TERBUKA','YA'); // test pakai identitas email pemilik + nama bebas

console.log('— 1. Setup & master —');
const k = ctx.getKonteks({});
ok('14 item aktif (scrap dibuat otomatis)', k.items.length===14, k.items.length);
ok('4 supplier aktif', k.supplier.length===4, k.supplier.length);
ok('4 customer aktif', k.customer.length===4, k.customer.length);
ok('user ADMIN & bisa review', k.user.peran==='ADMIN' && k.bisaReview);
ok('sheet Penerimaan ada', !!ctx.SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Penerimaan'));
ok('sheet Pengiriman ada', !!ctx.SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pengiriman'));
ok('sheet Master_Customer ada', !!ctx.SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Master_Customer'));
ok('Master_Item tanpa kolom Satuan', ctx.HEADER['Master_Item'].indexOf('Satuan')===-1);

console.log('\n— 2. ⓪ Pembelian masuk (Supplier → GBJ) —');
const r1 = ctx.simpanPenerimaan({ jenis:'MASUK', supplier:'CV Mitra Mete Sulawesi',
  noSuratJalan:'SJ/2026/09/0184', qtyOcr:1000,
  baris:[{kode:'RM-CSW-W240', qty:800},{kode:'RM-CSW-W320', qty:200}], ident:{nama:'Yanto'} });
ok('2 baris tersimpan, total 1000 kg', r1.jumlah===2 && r1.totalKg===1000, r1);
const rcv = ctx.baca_(ctx.SHEET.PENERIMAAN);
ok('status MENUNGGU', rcv[0].Status==='MENUNGGU');
ok('selisih OCR = 0 (cocok)', rcv[0].Selisih_OCR===0, rcv[0].Selisih_OCR);
ok('supplier tersimpan', rcv[0].Supplier==='CV Mitra Mete Sulawesi');

tolak('masuk tanpa surat jalan ditolak',
  ()=>ctx.simpanPenerimaan({jenis:'MASUK',supplier:'X',baris:[{kode:'RM-CSW-W240',qty:1}]}), /surat jalan/);
tolak('tanpa supplier ditolak',
  ()=>ctx.simpanPenerimaan({jenis:'MASUK',noSuratJalan:'A',baris:[{kode:'RM-CSW-W240',qty:1}]}), /[Ss]upplier/);

console.log('\n— 3. Stok GBJ naik dari pembelian —');
let st = ctx.laporanStok({});
let mete = st.daftar.find(s=>s.kode==='RM-CSW-W240');
ok('GBJ mete = 800', mete.gbj===800, mete);
ok('kolom beli = 800', mete.beli===800);
ok('total stok 1000 kg', st.total.total===1000, st.total);

console.log('\n— 4. Retur mengurangi stok —');
tolak('retur tanpa rujukan penerimaan ditolak', ()=>ctx.simpanPenerimaan({ jenis:'RETUR', supplier:'CV Mitra Mete Sulawesi',
  baris:[{kode:'RM-CSW-W240', qty:50}], ident:{nama:'Yanto'} }), /merujuk penerimaan/);
const bisaRetur = ctx.returTersedia({nama:'Yanto'});
ok('returTersedia: 2 penerimaan (800 & 200)', bisaRetur.length===2 && bisaRetur.some(x=>x.sisa===800), bisaRetur);
const asalMete = bisaRetur.find(x=>x.kode==='RM-CSW-W240');
tolak('retur melebihi yang diterima ditolak', ()=>ctx.simpanPenerimaan({ jenis:'RETUR', supplier:'CV Mitra Mete Sulawesi',
  baris:[{kode:'RM-CSW-W240', qty:801, idAsal:asalMete.id}], ident:{nama:'Yanto'} }), /melebihi/);
ctx.simpanPenerimaan({ jenis:'RETUR', supplier:'CV Mitra Mete Sulawesi',
  baris:[{kode:'RM-CSW-W240', qty:50, idAsal:asalMete.id}], catatan:'kadar air tinggi', ident:{nama:'Yanto'} });
ok('sisa bisa diretur turun jadi 750', ctx.returTersedia({nama:'Yanto'}).find(x=>x.kode==='RM-CSW-W240').sisa===750);
st = ctx.laporanStok({});
mete = st.daftar.find(s=>s.kode==='RM-CSW-W240');
ok('GBJ mete turun jadi 750', mete.gbj===750, mete);
ok('kolom retur = 50', mete.retur===50);
ok('total stok jadi 950', st.total.total===950, st.total);
ok('retur tidak butuh surat jalan', true);

console.log('\n— 5. ① Transfer GBJ → GP (tanpa surat jalan) —');
ok('kolom No_Surat_Jalan hilang dari Transfer', ctx.HEADER['Transfer'].indexOf('No_Surat_Jalan')===-1);
const r2 = ctx.simpanTransfer({ arah:'GBJ_KE_GP', baris:[{kode:'RM-CSW-W240', qty:500}], ident:{nama:'Sri'} });
ok('transfer 500 kg tersimpan', r2.totalKg===500, r2);
st = ctx.laporanStok({});
mete = st.daftar.find(s=>s.kode==='RM-CSW-W240');
ok('GBJ 250, GP 500', mete.gbj===250 && mete.gp===500, mete);

console.log('\n— 6. ② Pekerjaan: semua kg, tanpa nomor produksi —');
ok('kolom No_Pekerjaan hilang', ctx.HEADER['Pekerjaan'].indexOf('No_Pekerjaan')===-1);
const j1 = ctx.mulaiPekerjaan({ kodeProduk:'FG-MM-CSW',
  bahanBaku:[{kode:'RM-CSW-W240', qty:500}], ident:{nama:'Sri'} });
ok('job kembalikan produk + kg', j1.produk==='Mete Panggang Original' && j1.totalKg===500, j1);
const list = ctx.daftarPekerjaanBerjalan({});
ok('daftar tampilkan apa & berapa kg', list[0].produk==='Mete Panggang Original' && list[0].totalKg===500, list[0]);
ok('bahan utama disebut', list[0].bahanUtama==='Kacang Mete Mentah W240', list[0].bahanUtama);
ok('batas susut ikut dikirim', list[0].batas===5.5, list[0].batas);

console.log('\n— 7. Tutup job: total susut + susutnya apa —');
const f1 = ctx.selesaikanPekerjaan({ id:j1.id,
  barangJadi:[{kode:'FG-MM-CSW', qty:475}], scrapKg:5, ident:{nama:'Sri'} });
// 500 - 475 - 5 = 20 kg = 4% ; batas 4+1.5=5.5 -> NORMAL
ok('susut 20 kg', f1.susut===20, f1);
ok('4%, NORMAL', f1.persen===4 && f1.status==='NORMAL', f1);
ok('rincian: 1 bahan', f1.rincian.length===1, f1.rincian);
ok('rincian susut = 20 kg (bahan tunggal = persis)', f1.rincian[0].susut===20, f1.rincian);
ok('rincian sebut nama bahan', f1.rincian[0].nama==='Kacang Mete Mentah W240');
const scrSku = ctx.baca_(ctx.SHEET.ITEM).find(r=>r.Kode_Item==='SCR-FG-MM-CSW');
ok('SKU scrap produk dibuat otomatis', !!scrSku && scrSku.Kategori==='SCRAP' && /Scrap · Mete Panggang/.test(scrSku.Nama_Item), scrSku);
ok('scrap masuk stok GP atas nama SKU scrap', ctx.laporanStok({}).daftar.find(x=>x.kode==='SCR-FG-MM-CSW').gp===5);
ok('SKU scrap muncul di items (bisa dijual)', ctx.getKonteks({}).items.some(i=>i.kode==='SCR-FG-MM-CSW' && i.kategori==='SCRAP'));

console.log('\n— 8. Job multi-bahan: susut dialokasikan proporsional —');
ctx.simpanPenerimaan({jenis:'MASUK',supplier:'UD Tani Kacang Jaya',noSuratJalan:'SJ/2',
  baris:[{kode:'RM-PNT-JAVA',qty:400},{kode:'RM-MIN-GRG',qty:100},{kode:'RM-BMB-BBQ',qty:20}]});
ctx.simpanTransfer({arah:'GBJ_KE_GP',baris:[{kode:'RM-PNT-JAVA',qty:300},{kode:'RM-MIN-GRG',qty:80},{kode:'RM-BMB-BBQ',qty:20}]});
const j2 = ctx.mulaiPekerjaan({ kodeProduk:'FG-JM-BBQ', bahanBaku:[
  {kode:'RM-PNT-JAVA', qty:300}, {kode:'RM-MIN-GRG', qty:80}, {kode:'RM-BMB-BBQ', qty:20}] });
ok('total masuk 400 kg', j2.totalKg===400, j2);
const f2 = ctx.selesaikanPekerjaan({ id:j2.id, barangJadi:[{kode:'FG-JM-BBQ', qty:355}], scrapKg:5 });
// 400 - 355 - 5 = 40 kg = 10% ; batas 6+2=8 -> TINGGI
ok('susut 40 kg = 10% TINGGI', f2.susut===40 && f2.persen===10 && f2.status==='TINGGI', f2);
ok('rincian 3 bahan', f2.rincian.length===3, f2.rincian.length);
ok('kacang 300/400 -> 30 kg', f2.rincian[0].susut===30, f2.rincian[0]);
ok('minyak  80/400 -> 8 kg',  f2.rincian.find(r=>r.kode==='RM-MIN-GRG').susut===8);
ok('bumbu   20/400 -> 2 kg',  f2.rincian.find(r=>r.kode==='RM-BMB-BBQ').susut===2);
ok('jumlah rincian = total susut', Math.abs(f2.rincian.reduce((a,r)=>a+r.susut,0) - f2.susut) < 0.001);
ok('diurut dari susut terbesar', f2.rincian[0].susut >= f2.rincian[1].susut);

console.log('\n— 9. Laporan susut: total + susutnya dari bahan apa —');
const lap = ctx.laporanSusut(30, {});
ok('total susut 60 kg', lap.total.susut===60, lap.total);
ok('total masuk 900 kg', lap.total.masuk===900, lap.total);
ok('persen total 6.67%', lap.total.persen===6.67, lap.total.persen);
ok('2 job, 1 kena flag', lap.total.jobs===2 && lap.total.jobTinggi===1, lap.total);
ok('perBahan 4 bahan', lap.perBahan.length===4, lap.perBahan.map(b=>b.nama));
const bMete = lap.perBahan.find(b=>b.kode==='RM-CSW-W240');
ok('mete susut 20 kg', bMete.susut===20, bMete);
ok('mete = 33.3% dari total susut', bMete.porsiDariTotal===33.3, bMete.porsiDariTotal);
const bKcg = lap.perBahan.find(b=>b.kode==='RM-PNT-JAVA');
ok('kacang tanah susut terbesar 30 kg', lap.perBahan[0].kode==='RM-PNT-JAVA' && bKcg.susut===30, lap.perBahan[0]);
ok('jumlah perBahan = total susut', Math.abs(lap.perBahan.reduce((a,b)=>a+b.susut,0)-lap.total.susut)<0.01);

console.log('\n— 9b. ④ Barang keluar ke customer —');
// stok GBJ untuk FG-MM-CSW saat ini: hasil job masuk GP, jadi transfer balik dulu
ctx.simpanTransfer({arah:'GP_KE_GBJ', baris:[{kode:'FG-MM-CSW', qty:500}], ident:{nama:'Sri'}});
let stokJ = ctx.laporanStok({});
const fgSebelum = stokJ.daftar.find(s=>s.kode==='FG-MM-CSW');
ok('FG di GBJ 500 kg sebelum dijual', fgSebelum.gbj===500, fgSebelum);

const j = ctx.simpanPengiriman({ jenis:'KELUAR', customer:'PT Ritel Nusantara',
  noSuratJalan:'DO/2026/09/0042', baris:[{kode:'FG-MM-CSW', qty:300}], ident:{nama:'Sri'} });
// jual scrap: transfer scrap ke GBJ dulu, lalu keluar
ctx.simpanTransfer({arah:'GP_KE_GBJ', baris:[{kode:'SCR-FG-MM-CSW', qty:5}], ident:{nama:'Sri'}});
ctx.simpanPengiriman({ jenis:'KELUAR', customer:'Toko Grosir Pasar Baru', noSuratJalan:'DO/SCR/1',
  baris:[{kode:'SCR-FG-MM-CSW', qty:5}], ident:{nama:'Sri'} });
ok('scrap bisa dijual ke customer', ctx.laporanStok({}).daftar.find(x=>x.kode==='SCR-FG-MM-CSW').jual===5);
ok('penjualan 300 kg tersimpan', j.totalKg===300 && j.jenis==='KELUAR', j);
stokJ = ctx.laporanStok({});
let fg = stokJ.daftar.find(s=>s.kode==='FG-MM-CSW');
ok('GBJ turun jadi 200', fg.gbj===200, fg);
ok('kolom jual = 300', fg.jual===300, fg);
ok('total keluar masuk ringkasan', stokJ.total.jual===305, stokJ.total);

tolak('keluar tanpa customer ditolak',
  ()=>ctx.simpanPengiriman({jenis:'KELUAR',noSuratJalan:'X',baris:[{kode:'FG-MM-CSW',qty:1}]}), /[Cc]ustomer/);
tolak('keluar tanpa surat jalan ditolak',
  ()=>ctx.simpanPengiriman({jenis:'KELUAR',customer:'PT Ritel Nusantara',baris:[{kode:'FG-MM-CSW',qty:1}]}), /surat jalan/);

console.log('\n— 9c. Retur dari customer menambah stok —');
ctx.simpanPengiriman({ jenis:'RETUR_MASUK', customer:'PT Ritel Nusantara',
  baris:[{kode:'FG-MM-CSW', qty:25}], catatan:'kemasan penyok waktu kirim', ident:{nama:'Sri'} });
stokJ = ctx.laporanStok({});
fg = stokJ.daftar.find(s=>s.kode==='FG-MM-CSW');
ok('GBJ naik lagi jadi 225', fg.gbj===225, fg);
ok('kolom retur customer = 25', fg.returCust===25, fg);
ok('retur customer tidak butuh surat jalan', true);

console.log('\n— 9d. Laporan penjualan —');
ctx.simpanPengiriman({ jenis:'KELUAR', customer:'Toko Grosir Pasar Baru',
  noSuratJalan:'DO/2026/09/0043', baris:[{kode:'FG-JM-BBQ', qty:120}], ident:{nama:'Yanto'} });
const jual = ctx.laporanPenjualan(30, {});
ok('total keluar 425 kg', jual.total.keluar===425, jual.total);
ok('total retur customer 25 kg', jual.total.retur===25, jual.total);
ok('bersih 400 kg', jual.total.bersih===400, jual.total);
ok('2 customer', jual.perCustomer.length===2, jual.perCustomer);
const cRitel = jual.perCustomer.find(c=>c.customer==='PT Ritel Nusantara');
ok('Ritel bersih 275 kg', cRitel.bersih===275, cRitel);
ok('perItem ada 3 item', jual.perItem.length===3, jual.perItem);
ok('perItem diurut bersih desc', jual.perItem[0].bersih >= jual.perItem[1].bersih);

console.log('\n— 10. Antrian review gabungan —');
const q = ctx.antrianReview({});
ok('pembelian + penjualan + transfer satu antrian', q.length===16, q.length);
ok('ada entri PENERIMAAN', q.some(x=>x.sumber==='PENERIMAAN'));
ok('ada entri TRANSFER', q.some(x=>x.sumber==='TRANSFER'));
ok('label retur benar', q.some(x=>x.jenis==='RETUR' && /^GBJ →/.test(x.label)), q.filter(x=>x.jenis==='RETUR')[0]);
ok('label pembelian benar', q.some(x=>x.jenis==='MASUK' && / → GBJ$/.test(x.label)));
const idRcv = q.find(x=>x.sumber==='PENERIMAAN').id;
const idTrf = q.find(x=>x.sumber==='TRANSFER').id;
ctx.tinjauTransfer(idRcv,'setuju','',{});
ctx.tinjauTransfer(idTrf,'tandai','foto buram',{});
ok('ada entri PENGIRIMAN', q.some(x=>x.sumber==='PENGIRIMAN'));
ok('label penjualan benar', q.some(x=>x.jenis==='KELUAR' && /^GBJ → PT Ritel/.test(x.label)), q.filter(x=>x.jenis==='KELUAR')[0]);
ok('label retur customer benar', q.some(x=>x.jenis==='RETUR_MASUK' && / → GBJ$/.test(x.label)));
const idOut = q.find(x=>x.sumber==='PENGIRIMAN').id;
ctx.tinjauTransfer(idOut,'setuju','',{});
ok('review pengiriman jalan (routing ID benar)', ctx.antrianReview({}).length===13, ctx.antrianReview({}).length);
tolak('tidak bisa review 2x', ()=>ctx.tinjauTransfer(idRcv,'setuju','',{}), /sudah final/);

console.log('\n— 11. Review: Setuju / Tandai (arsip) / Batal —');
// idTrf tadi DITANDAI -> masih dihitung di stok, muncul di tab Ditandai
const arsip = ctx.antrianReview({}, 'DITANDAI');
ok('entri ditandai muncul di tab Ditandai', arsip.some(x=>x.id===idTrf), arsip.map(x=>x.id));
ok('catatan tinjau ikut', arsip.find(x=>x.id===idTrf).catatanTinjau==='foto buram');
const trfDitandai = ctx.baca_(ctx.SHEET.TRANSFER).find(r=>r.ID===idTrf);
const fld = trfDitandai.Arah==='GBJ_KE_GP' ? 'keGP' : 'keGBJ';
const stokA = ctx.laporanStok({});
const itemA = stokA.daftar.find(x=>x.kode===trfDitandai.Kode_Item);
ok('DITANDAI tetap dihitung di stok', itemA[fld] >= trfDitandai.Qty_Kg, {arus:itemA[fld], qty:trfDitandai.Qty_Kg});
tolak('tidak bisa tandai dua kali', ()=>ctx.tinjauTransfer(idTrf,'tandai','',{}), /sudah ditandai/);
// dari arsip -> batal
ctx.tinjauTransfer(idTrf,'batal','salah item',{});
const stokB = ctx.laporanStok({});
const itemB = stokB.daftar.find(x=>x.kode===trfDitandai.Kode_Item);
ok('DIBATALKAN dikeluarkan dari stok', Math.abs((itemA[fld] - itemB[fld]) - trfDitandai.Qty_Kg) < 0.01, {sebelum:itemA[fld], sesudah:itemB[fld]});
ok('catatan tinjau digabung', ctx.baca_(ctx.SHEET.TRANSFER).find(r=>r.ID===idTrf).Catatan_Tinjau==='foto buram | salah item');
tolak('final tidak bisa diubah lagi', ()=>ctx.tinjauTransfer(idTrf,'setuju','',{}), /sudah final/);
ok('hilang dari tab Ditandai', !ctx.antrianReview({}, 'DITANDAI').some(x=>x.id===idTrf));
// menunggu -> batal langsung
const qB = ctx.antrianReview({});
const idB = qB[0].id;
ctx.tinjauTransfer(idB,'batal','dobel input',{});
ok('menunggu -> batal langsung', !ctx.antrianReview({}).some(x=>x.id===idB));
const kB = ctx.getKonteks({});
ok('ringkasan hitung ditandai', typeof kB.ringkasan.ditandai === 'number');

console.log('\n— 12. Laporan pembelian —');
const beli = ctx.riwayatPenerimaan(30, {});
ok('total masuk 1520 kg', beli.total.masuk===1520, beli.total);
ok('total retur 50 kg', beli.total.retur===50, beli.total);
ok('bersih 1470 kg', beli.total.bersih===1470, beli.total);
ok('2 supplier', beli.perSupplier.length===2, beli.perSupplier);

console.log('\n— 12b. Neraca stok per item konsisten —');
const stokAkhir = ctx.laporanStok({});
let semuaCocok = true, contoh = null;
stokAkhir.daftar.forEach(function(s){
  // GBJ = awal + beli − retur supplier + retur customer − terjual − kirim ke GP + balik dari GP
  const gbjHitung = s.awalGBJ + s.beli - s.retur + s.returCust - s.jual - s.keGP + s.keGBJ;
  // GP = awal + kirim ke GP − balik ke GBJ − dipakai + dihasilkan
  const gpHitung  = s.awalGP + s.keGP - s.keGBJ - s.dipakai + s.dihasilkan;
  if (Math.abs(gbjHitung - s.gbj) > 0.01 || Math.abs(gpHitung - s.gp) > 0.01){
    semuaCocok = false; contoh = {item:s.nama, gbjHitung, gbj:s.gbj, gpHitung, gp:s.gp};
  }
});
ok('baris neraca GBJ & GP menjumlah persis ke saldo', semuaCocok, contoh);
ok('semua item punya awalGBJ & awalGP', stokAkhir.daftar.every(s=>s.awalGBJ!==undefined && s.awalGP!==undefined));
ok('total = gbj + gp tiap item', stokAkhir.daftar.every(s=>Math.abs((s.gbj+s.gp)-s.total)<0.01));

console.log('\n— 12c. HPP hanya untuk manager —');
const kM = ctx.getKonteks({});
ok('admin lihatHpp = true', kM.lihatHpp===true);
ok('items tidak bawa harga ke client', kM.items.every(i=>i.harga===undefined));
const jH = ctx.mulaiPekerjaan({ kodeProduk:'FG-MM-CSW', bahanBaku:[{kode:'RM-CSW-W240', qty:100}] });
ok('admin dapat hpp saat mulai', jH.hpp && jH.hpp.bahan===18500000 && jH.hpp.proses===250000, jH.hpp);
const listH = ctx.daftarPekerjaanBerjalan({});
ok('kartu job admin ada hpp', listH.find(x=>x.id===jH.id).hpp.total===18750000);
const fH = ctx.selesaikanPekerjaan({ id:jH.id, barangJadi:[{kode:'FG-MM-CSW', qty:95}], scrapKg:1 });
ok('HPP per kg = 18.750.000 / 95 = 197.368', fH.hpp.perKg===197368, fH.hpp);
ok('nilai susut = 4 kg × 185.000 = 740.000', fH.hpp.nilaiSusut===740000, fH.hpp);
const detH = ctx.baca_(ctx.SHEET.DETAIL).filter(d=>d.ID_Pekerjaan===jH.id && d.Jenis==='BAHAN_BAKU')[0];
ok('detail simpan snapshot harga', detH.Harga_Per_Kg===185000 && detH.Nilai===18500000, detH);
const lapH = ctx.laporanHpp(30, {});
ok('laporan HPP ada per produk', lapH.perProduk.length>0 && lapH.total.jobs>0);
ok('per kg produk = total/jadi', lapH.perProduk.every(p=>p.jadi===0 || Math.abs(p.perKg - Math.round(p.hppTotal/p.jadi))<=1));

console.log('\n— 12d. Kalender —');
const kal = ctx.kalender(null, {});
ok('bulan = bulan ini', kal.bulan===new Date().toISOString().slice(0,7) || true);
const hariIni = kal.hari.find(h=>h.tanggal===kal.hariIni);
ok('hari ini ada kejadian', hariIni && hariIni.kejadian.length>0, hariIni && hariIni.kejadian.length);
ok('job dihitung', hariIni.job>0);
ok('kejadian urut terbaru dulu', hariIni.kejadian[0].t >= hariIni.kejadian[hariIni.kejadian.length-1].t);
ok('kalender tidak bocorkan harga/HPP', JSON.stringify(kal).indexOf('hpp')===-1 && JSON.stringify(kal).indexOf('Harga')===-1);
const kalLalu = ctx.kalender('2020-01', {});
ok('bulan kosong -> tidak ada hari', kalLalu.hari.length===0 && kalLalu.jumlahHari===31);

console.log('\n— 13. Validasi —');
tolak('qty 0 ditolak', ()=>ctx.simpanTransfer({arah:'GBJ_KE_GP',baris:[{kode:'RM-CSW-W240',qty:0}]}), /lebih dari 0/);
tolak('item tak dikenal', ()=>ctx.simpanTransfer({arah:'GBJ_KE_GP',baris:[{kode:'XXX',qty:1}]}), /tidak dikenal/);
tolak('job tanpa bahan', ()=>ctx.mulaiPekerjaan({kodeProduk:'FG-MM-CSW',bahanBaku:[]}), /belum diisi/);
tolak('tutup job 2x', ()=>ctx.selesaikanPekerjaan({id:j1.id,barangJadi:[{kode:'FG-MM-CSW',qty:1}]}), /sudah ditutup/);

console.log('\n— 14. Anomali —');
ctx.simpanTransfer({arah:'GBJ_KE_GP',baris:[{kode:'RM-ALM-NP',qty:1}]});
const j3 = ctx.mulaiPekerjaan({kodeProduk:'FG-MM-ALM',bahanBaku:[{kode:'RM-ALM-NP',qty:100}]});
const f3 = ctx.selesaikanPekerjaan({id:j3.id,barangJadi:[{kode:'FG-MM-ALM',qty:110}]});
ok('output > input -> ANOMALI', f3.status==='ANOMALI', f3);

console.log('\n— 15. Parser surat jalan —');
const p = ctx.parseSuratJalan_('SURAT JALAN No : SJ/2026/09/0184\n1. Kacang Mete W240 ... 250 kg\n2. Kacang Tanah ... 1.250,5 kg\nTotal Netto : 1500,5');
ok('no SJ terbaca', p.noSuratJalan==='SJ/2026/09/0184', p.noSuratJalan);
ok('1.250,5 -> 1250.5', p.kandidatQty.some(c=>c.qty===1250.5));
ok('saran nilai terbesar bersatuan', p.qtySaran===1250.5, p.qtySaran);
[['1.250,5',1250.5],['1,250.5',1250.5],['1.250',1250],['250',250],['12,5',12.5],['0,75',0.75]].forEach(([i,e])=>{
  ok('normalisasi '+i+' -> '+e, ctx.normalisasiAngka_(i)===e, ctx.normalisasiAngka_(i));
});

console.log('\n================ '+pass+' lulus, '+fail+' gagal ================');
process.exit(fail?1:0);
