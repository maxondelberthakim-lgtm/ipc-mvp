/* v12: ukuran SKU, satuan bal (KG_PER_BAL), pengaturan dokumen (kop), kontak WA, invoice dari SO & dokumen PO (token), pembatalan dokumen. */
const fs=require('fs');
let src=fs.readFileSync(__dirname+'/harness.js','utf8').replace("return 'pemilik@contoh.co.id';","return '';");
fs.writeFileSync(__dirname + '/.h12.js', src);
const {ctx}=require(__dirname + '/.h12.js');
let pass=0,fail=0;
const ok=(l,c,e)=>{c?(pass++,console.log('  ✓',l)):(fail++,console.log('  ✗',l,e===undefined?'':JSON.stringify(e)))};
function tolak(label, fn, pola){ let e=''; try{ fn(); }catch(x){ e=String(x.message||x); } ok(label, pola.test(e), e); }
ctx.setupSistem();
const SPV={nama:'Manager',pin:'1357'}, MP={nama:'Bastari',pin:'4433'}, SM={nama:'Deny',pin:'3322'}, YS={nama:'Yansen',pin:'2211'}, STAF={nama:'Staff Gudang',pin:'1111'}, ADM={nama:'Admin',pin:'1234'};
const SUP='PT Sumber Biji Plastik', CUS='PT Nursery Hijau Lestari', KW='RM-BP-KW', FG='FG-PB-KW';

console.log('— Skema v12 —');
ok('sheet Dokumen & Master_Kontak_WA ada', !!ctx.SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Dokumen') && !!ctx.SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Master_Kontak_WA'));
ok('header Master_Item punya Ukuran', ctx.HEADER['Master_Item'].indexOf('Ukuran')>=0);
ok('setting KG_PER_BAL = 25 bawaan', ctx.kgPerBal_()===25 && ctx.getKonteks(YS).kgPerBal===25);

console.log('\n— Ukuran SKU —');
const sku = ctx.daftarSku(SPV).find(x=>x.kode===FG);
ok('daftarSku mengembalikan ukuran (kosong dulu)', sku && sku.ukuran==='');
ctx.simpanSku({baris:sku.baris, kode:FG, nama:sku.nama, kategori:sku.kategori, kualitas:sku.kualitas, awal:sku.awal, ukuran:'30 x 50'}, SPV);
ok('ukuran tersimpan & tampil di konteks items', ctx.daftarSku(SPV).find(x=>x.kode===FG).ukuran==='30 x 50' && ctx.getKonteks(YS).items.find(i=>i.kode===FG).ukuran==='30 x 50');
tolak('Yansen (tanpa MANAJEMEN) tidak bisa ubah SKU', ()=>ctx.simpanSku({baris:sku.baris, kode:FG, nama:sku.nama, kategori:sku.kategori, ukuran:'x'}, YS), /Manajemen/);

console.log('\n— Pengaturan dokumen (Yansen) —');
tolak('staf tidak bisa baca pengaturan dokumen', ()=>ctx.pengaturanDokumen(STAF), /akses PO/);
tolak('Deny (SO saja) boleh lihat tapi tidak ubah', ()=>ctx.simpanPengaturanDokumen({kgPerBal:30}, SM), /akses PO/);
ok('Deny boleh lihat pengaturan (bolehUbah=false)', ctx.pengaturanDokumen(SM).bolehUbah===false);
const pg = ctx.simpanPengaturanDokumen({kgPerBal:30, perusahaan:{nama:'PT Plastik Harapan', alamat:'Jl. Industri 5, Tangerang', telp:'0812-0000', bank:'BCA 123456 a.n. PT Plastik Harapan', catatanInvoice:'Pembayaran transfer sesuai TOP.'}}, YS);
ok('Yansen ubah kg/bal = 30 dan kop perusahaan', pg.kgPerBal===30 && pg.perusahaan.nama==='PT Plastik Harapan' && pg.perusahaan.bank.indexOf('BCA')===0 && pg.bolehUbah===true);
tolak('kg/bal 0 ditolak', ()=>ctx.simpanPengaturanDokumen({kgPerBal:0}, YS), /Kg per bal/);
ok('konteks ikut: kgPerBal 30, bisaDokumen Yansen/Deny true, Bastari false', ctx.getKonteks(YS).kgPerBal===30 && ctx.getKonteks(SM).bisaDokumen===true && ctx.getKonteks(MP).bisaDokumen===false);

console.log('\n— Kontak WA —');
tolak('nomor tidak valid ditolak', ()=>ctx.simpanKontakWa({nama:'Budi', nomor:'abc'}, YS), /tidak valid/);
tolak('nama kosong ditolak', ()=>ctx.simpanKontakWa({nama:'', nomor:'081234567890'}, YS), /Nama pemilik/);
const k1 = ctx.simpanKontakWa({nama:'Pak Budi (Nursery)', nomor:'0812-3456-7890'}, YS);
ok('nomor 0812… dinormalkan ke 62812…', k1.ok && k1.nomor==='6281234567890');
const k2 = ctx.simpanKontakWa({nama:'Budi Nursery', nomor:'+62 812 3456 7890'}, SM);
ok('nomor sama → kontak yang sama diperbarui (tidak dobel)', k2.id===k1.id && ctx.daftarKontakWa(YS).length===1 && ctx.daftarKontakWa(YS)[0].nama==='Budi Nursery');
ctx.simpanKontakWa({nama:'Supplier Biji', nomor:'62811000111'}, YS);
ok('2 kontak, urut nama', ctx.daftarKontakWa(SM).map(k=>k.nama).join('|')==='Budi Nursery|Supplier Biji');
ctx.hapusKontakWa(k1.id, YS);
ok('hapus kontak → nonaktif', ctx.daftarKontakWa(YS).length===1);
tolak('Bastari tidak boleh lihat kontak', ()=>ctx.daftarKontakWa(MP), /akses PO/);

console.log('\n— Invoice dari SO (Deny) —');
const so = ctx.simpanSo({customer:CUS, tanggalKirim:ctx.tglStr_(new Date()), topHari:14, baris:[{kode:FG, qty:600, harga:25000},{kode:'FG-PB-SUP', qty:150, harga:27000}]}, SM);
const noSo = ctx.baca_(ctx.SHEET.SO)[0].No_SO;
tolak('Bastari (PRODUKSI) tidak bisa buat invoice', ()=>ctx.buatDokumen({jenis:'INVOICE', ref:noSo}, MP), /Sales order/);
tolak('SO yang tidak ada ditolak', ()=>ctx.buatDokumen({jenis:'INVOICE', ref:'SO-000000-99'}, SM), /tidak ditemukan/);
const inv = ctx.buatDokumen({jenis:'INVOICE', ref:noSo, catatan:'Mohon transfer sebelum jatuh tempo'}, SM);
const thnBln = ctx.tglStr_(new Date()).slice(0,7).replace('-','/');
ok('invoice dibuat: nomor INV/YYYY/MM/001, total 600×25000 + 150×27000 = 19.050.000', inv.ok && inv.nomor==='INV/'+thnBln+'/001' && inv.total===19050000 && inv.token.length===24, inv);
const pub = ctx.ambilDokumenPublik_(inv.token);
ok('halaman publik: snapshot lengkap (kop, customer, baris dengan bal & ukuran, tanpa PPN)', pub && pub.jenis==='INVOICE' && pub.perusahaan.nama==='PT Plastik Harapan' && pub.pihak.nama===CUS && pub.baris.length===2 && pub.baris[0].bal===20 && pub.baris[0].ukuran==='30 x 50' && pub.total===19050000 && pub.topHari===14 && pub.jatuhTempo && pub.catatan.indexOf('Mohon')===0 && pub.catatanBawah==='Pembayaran transfer sesuai TOP.', pub);
ok('token salah → null', ctx.ambilDokumenPublik_('zzzzzzzzzzzzzzzzzzzzzzzz')===null && ctx.ambilDokumenPublik_('pendek')===null);
const inv2 = ctx.buatDokumen({jenis:'INVOICE', ref:noSo, nomor:'INV/KHUSUS/7'}, SM);
ok('nomor manual dipakai apa adanya', inv2.nomor==='INV/KHUSUS/7');
tolak('nomor dobel ditolak', ()=>ctx.buatDokumen({jenis:'INVOICE', ref:noSo, nomor:'INV/KHUSUS/7'}, SM), /sudah dipakai/);
const inv3 = ctx.buatDokumen({jenis:'INVOICE', ref:noSo}, SM);
ok('nomor otomatis berikutnya 002', inv3.nomor==='INV/'+thnBln+'/002');
const dd = ctx.daftarDokumen(SM, 'INVOICE', noSo);
ok('daftarDokumen untuk SO: 3 invoice, terbaru dulu, token ikut', dd.length===3 && dd[0].nomor===inv3.nomor && dd[0].token===inv3.token && dd[0].pihak===CUS && dd[0].total===19050000);
tolak('batal dokumen tanpa alasan ditolak', ()=>ctx.batalkanDokumen(inv2.id, '', SM), /Alasan pembatalan wajib/);
ctx.batalkanDokumen(inv2.id, 'nomor salah', SM);
ok('dokumen dibatalkan → link mati, token tidak dibagikan lagi', ctx.ambilDokumenPublik_(inv2.token).dibatalkan===true && ctx.daftarDokumen(SM,'INVOICE',noSo).find(x=>x.id===inv2.id).token==='' );
tolak('batal 2x ditolak', ()=>ctx.batalkanDokumen(inv2.id, 'lagi', SM), /sudah dibatalkan/);
const inv4 = ctx.buatDokumen({jenis:'INVOICE', ref:noSo, nomor:'INV/KHUSUS/7'}, SM);
ok('nomor yang dibatalkan boleh dipakai lagi', inv4.ok);
ok('log INVOICE_BUAT tercatat', ctx.baca_(ctx.SHEET.LOG).filter(l=>l.Aksi==='INVOICE_BUAT').length===4);

console.log('\n— Dokumen PO (Yansen) —');
const po = ctx.simpanPo({supplier:SUP, topHari:30, baris:[{kode:KW, qty:1500, harga:12000, spesifikasi:'KW hitam'}]}, YS);
tolak('Deny tidak bisa buat dokumen PO', ()=>ctx.buatDokumen({jenis:'PO', ref:po.noPo}, SM), /akses PO/);
const dpo = ctx.buatDokumen({jenis:'PO', ref:po.noPo, perusahaan:{alamat:'Alamat khusus sekali ini'}}, YS);
ok('dokumen PO: nomor = No_PO, total 18.000.000, pihak supplier', dpo.ok && dpo.nomor===po.noPo && dpo.total===18000000 && dpo.pihak===SUP);
const pubPo = ctx.ambilDokumenPublik_(dpo.token);
ok('snapshot PO: spesifikasi, bal 50 (1500/30), alamat override, kop nama tetap', pubPo.baris[0].spesifikasi==='KW hitam' && pubPo.baris[0].bal===50 && pubPo.perusahaan.alamat==='Alamat khusus sekali ini' && pubPo.perusahaan.nama==='PT Plastik Harapan' && pubPo.catatanBawah==='');
const dpo2 = ctx.buatDokumen({jenis:'PO', ref:po.noPo}, ADM);
ok('Admin juga boleh buat invoice & dokumen PO', ctx.buatDokumen({jenis:'INVOICE', ref:noSo}, ADM).ok && dpo2.ok);
ok('dokumen PO baru untuk nomor yang sama → versi lama DIGANTI, link lama mati', ctx.ambilDokumenPublik_(dpo.token).diganti===true && ctx.daftarDokumen(YS,'PO',po.noPo).filter(x=>x.status==='AKTIF').length===1);
ok('ubah KG_PER_BAL tidak mengubah dokumen lama (snapshot)', (()=>{ ctx.simpanPengaturanDokumen({kgPerBal:25}, YS); return ctx.ambilDokumenPublik_(dpo2.token).baris[0].bal===50 && ctx.ambilDokumenPublik_(dpo2.token).kgPerBal===30; })());
tolak('staf tidak lihat daftar dokumen', ()=>ctx.daftarDokumen(STAF), /akses PO/);

console.log('\n— v12.1: ukuran per baris, dokumen SO, TOP dari tanggal dokumen / tanggal kirim-terima —');
{
  const hari = ctx.tglStr_(new Date());
  const kemarin = ctx.tglStr_(new Date(Date.now()-864e5));
  const so2 = ctx.simpanSo({customer:CUS, tanggal:kemarin, tanggalKirim:ctx.jatuhTempo_(hari,5), topHari:30, topDari:'KIRIM',
    baris:[{kode:FG, qty:200, harga:24000, ukuran:'40 x 60'}, {kode:'FG-PB-SUP', qty:50, harga:26000}]}, SM);
  const r2 = ctx.baca_(ctx.SHEET.SO).filter(r=>r.No_SO===so2.noSo);
  ok('ukuran baris tersimpan; baris tanpa ukuran → kosong / dari master', r2[0].Ukuran==='40 x 60' && r2[1].Ukuran===(ctx.daftarSku(SPV).find(x=>x.kode==='FG-PB-SUP').ukuran||''), r2.map(r=>r.Ukuran));
  ok('TOP dari KIRIM, belum dikirim → jatuh tempo = rencana kirim + 30', r2.every(r=>r.TOP_Dari==='KIRIM' && r.Jatuh_Tempo===ctx.jatuhTempo_(ctx.jatuhTempo_(hari,5),30)), r2.map(r=>r.Jatuh_Tempo));
  ok('ringkasSo: ukuran & topDari ikut', ctx.daftarSo(SM).find(x=>x.id===r2[0].ID).ukuran==='40 x 60' && ctx.daftarSo(SM).find(x=>x.id===r2[0].ID).topDari==='KIRIM');
  ctx.simpanPengiriman({jenis:'KELUAR', customer:CUS, noSuratJalan:'DO/V121', baris:[{kode:FG, qty:50, idSo:r2[0].ID}], ident:YS});
  const r3 = ctx.baca_(ctx.SHEET.SO).filter(r=>r.No_SO===so2.noSo);
  ok('setelah barang dikirim hari ini → semua baris SO jatuh tempo = hari ini + 30', r3.every(r=>r.Jatuh_Tempo===ctx.jatuhTempo_(hari,30)), r3.map(r=>r.Jatuh_Tempo));
  const so3 = ctx.simpanSo({customer:CUS, tanggal:kemarin, tanggalKirim:hari, topHari:7, topDari:'DOKUMEN', baris:[{kode:FG, qty:10, harga:24000}]}, YS);
  ok('Yansen buat SO, TOP dari tanggal SO → kemarin + 7', ctx.baca_(ctx.SHEET.SO).find(r=>r.No_SO===so3.noSo).Jatuh_Tempo===ctx.jatuhTempo_(kemarin,7));
  const dso = ctx.buatDokumen({jenis:'SO', ref:so2.noSo}, SM);
  const pso = ctx.ambilDokumenPublik_(dso.token);
  ok('dokumen SO: nomor = No SO, harga ada, ukuran baris "40 x 60", TOP dari KIRIM', dso.nomor===so2.noSo && pso.jenis==='SO' && pso.baris[0].ukuran==='40 x 60' && pso.baris[0].harga===24000 && pso.topDari==='KIRIM' && pso.total===200*24000+50*26000, pso);
  tolak('Bastari tidak bisa buat dokumen SO', ()=>ctx.buatDokumen({jenis:'SO', ref:so2.noSo}, MP), /Sales order/);
  const dso2 = ctx.buatDokumen({jenis:'SO', ref:so2.noSo}, YS);
  ok('dokumen SO baru menggantikan yang lama', ctx.ambilDokumenPublik_(dso.token).diganti===true && ctx.ambilDokumenPublik_(dso2.token).jenis==='SO');
  ctx.ubahSo(r2[0].ID, {ukuran:'45 x 65'}, SM);
  ok('ubah ukuran baris SO tercatat', ctx.baca_(ctx.SHEET.SO).find(r=>r.ID===r2[0].ID).Ukuran==='45 x 65' && /ukuran/.test(ctx.baca_(ctx.SHEET.SO).find(r=>r.ID===r2[0].ID).Log_Edit));
  /* PO */
  const po2 = ctx.simpanPo({supplier:SUP, tanggal:kemarin, perkiraanDatang:ctx.jatuhTempo_(hari,3), topHari:30, topDari:'KIRIM', baris:[{kode:KW, qty:300, harga:12000, ukuran:'karung 25 kg'}]}, YS);
  const p2 = ctx.baca_(ctx.SHEET.PO).find(r=>r.No_PO===po2.noPo);
  ok('PO: ukuran baris & TOP dari KIRIM → perkiraan datang + 30', p2.Ukuran==='karung 25 kg' && p2.Jatuh_Tempo===ctx.jatuhTempo_(ctx.jatuhTempo_(hari,3),30), [p2.Ukuran, p2.Jatuh_Tempo]);
  ctx.simpanPenerimaan({jenis:'MASUK', supplier:SUP, noSuratJalan:'SJ/V121', baris:[{kode:KW, qty:100, idPo:p2.ID}], ident:YS});
  ok('PO: setelah barang diterima hari ini → jatuh tempo = hari ini + 30', ctx.baca_(ctx.SHEET.PO).find(r=>r.ID===p2.ID).Jatuh_Tempo===ctx.jatuhTempo_(hari,30));
  ctx.ubahPo(p2.ID, {topDari:'DOKUMEN'}, YS);
  ok('PO: ganti ke TOP dari tanggal PO → kemarin + 30', ctx.baca_(ctx.SHEET.PO).find(r=>r.ID===p2.ID).Jatuh_Tempo===ctx.jatuhTempo_(kemarin,30));
  const dpo3 = ctx.buatDokumen({jenis:'PO', ref:po2.noPo}, YS);
  ok('dokumen PO: ukuran baris & topDari DOKUMEN', ctx.ambilDokumenPublik_(dpo3.token).baris[0].ukuran==='karung 25 kg' && ctx.ambilDokumenPublik_(dpo3.token).topDari==='DOKUMEN');
}

fs.unlinkSync(__dirname+'/.h12.js');
console.log('\n================ '+pass+' lulus, '+fail+' gagal ================');
process.exit(fail?1:0);
