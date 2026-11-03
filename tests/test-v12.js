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

console.log('\n— v12.2: gabung / pisah SO, beranda per SO —');
{
  const hari = ctx.tglStr_(new Date());
  const a = ctx.simpanSo({customer:CUS, tanggal:hari, tanggalKirim:hari, topHari:0, baris:[{kode:FG, qty:25, harga:19000, ukuran:'10 x 15'}, {kode:FG, qty:75, harga:19000, ukuran:'30 x 30'}]}, SM);
  const b = ctx.simpanSo({customer:CUS, tanggal:hari, tanggalKirim:hari, topHari:0, baris:[{kode:FG, qty:50, harga:19000, ukuran:'45 x 45'}]}, SM);
  const c = ctx.simpanSo({customer:'PT Lain Sekali', tanggal:hari, tanggalKirim:hari, topHari:0, baris:[{kode:FG, qty:10, harga:19000}]}, SM);
  const home = ctx.soKirimHariIni_(hari);
  const ha = home.find(x=>x.noSo===a.noSo);
  ok('beranda "kirim hari ini": satu entri per SO dengan sisa total & baris (ukuran ikut)', ha && ha.jumlahBaris===2 && ha.sisa===100 && ha.baris.length===2 && ha.baris[0].ukuran==='10 x 15' && home.filter(x=>x.noSo===a.noSo).length===1, ha);
  const dokA = ctx.buatDokumen({jenis:'INVOICE', ref:b.noSo}, SM);
  tolak('gabung 1 SO ditolak', ()=>ctx.gabungSo([a.noSo], SM), /minimal 2/i);
  tolak('gabung SO beda customer ditolak', ()=>ctx.gabungSo([a.noSo, c.noSo], SM), /customer yang sama/);
  tolak('Bastari tidak bisa gabung SO', ()=>ctx.gabungSo([a.noSo, b.noSo], MP), /Sales order/);
  tolak('SO tidak dikenal ditolak', ()=>ctx.gabungSo([a.noSo, 'SO-000000-99'], SM), /tidak ditemukan/);
  const g = ctx.gabungSo([b.noSo, a.noSo], YS);
  const rowsG = ctx.baca_(ctx.SHEET.SO).filter(r=>r.No_SO===g.noSo);
  ok('Yansen gabung 2 SO → nomor paling awal dipakai, 3 baris, ID baris tetap', g.ok && g.noSo===a.noSo && g.dari[0]===b.noSo && rowsG.length===3 && rowsG.some(r=>r.ID===b.ids[0]) && g.dokumenDiganti===1, g);
  ok('baris dari SO lama dapat Log_Edit "digabung"', /digabung ke/.test(ctx.baca_(ctx.SHEET.SO).find(r=>r.ID===b.ids[0]).Log_Edit));
  ok('invoice lama SO yang digabung → DIGANTI (link mati)', ctx.ambilDokumenPublik_(dokA.token).diganti===true);
  ok('nomor SO lama tidak ada lagi di daftar', !ctx.daftarSo(SM).some(x=>x.noSo===b.noSo) && ctx.daftarSo(SM).filter(x=>x.noSo===a.noSo).length===3);
  /* pisah */
  tolak('pisah tanpa baris ditolak', ()=>ctx.pisahSo([], SM), /Pilih baris/);
  tolak('pisah semua baris ditolak', ()=>ctx.pisahSo(rowsG.map(r=>r.ID), SM), /Minimal satu baris/);
  tolak('pisah baris dari SO berbeda ditolak', ()=>ctx.pisahSo([rowsG[0].ID, c.ids[0]], SM), /SO yang sama/);
  const dokG = ctx.buatDokumen({jenis:'SO', ref:a.noSo}, SM);
  const p1 = ctx.pisahSo([b.ids[0]], SM);
  ok('pisah 1 baris → SO baru <no>-P2, sisa 2 baris di SO asal, dokumen SO lama diganti', p1.ok && p1.noSo===a.noSo+'-P2' && p1.dari===a.noSo && ctx.baca_(ctx.SHEET.SO).filter(r=>r.No_SO===a.noSo).length===2 && ctx.baca_(ctx.SHEET.SO).find(r=>r.ID===b.ids[0]).No_SO===a.noSo+'-P2' && ctx.ambilDokumenPublik_(dokG.token).diganti===true, p1);
  const p2 = ctx.pisahSo([a.ids[1]], SM);
  ok('pisah lagi → -P3 (bukan -P2-P2)', p2.noSo===a.noSo+'-P3', p2);
  ok('nomor SO baru hari ini tetap urut (parse -P tidak merusak)', /-0\d$/.test(ctx.nomorSoBaru_()) );
  const inv = ctx.buatDokumen({jenis:'INVOICE', ref:a.noSo+'-P2'}, SM);
  ok('invoice bisa dibuat dari SO hasil pisah (1 baris, 50 kg)', inv.ok && ctx.ambilDokumenPublik_(inv.token).baris.length===1 && ctx.ambilDokumenPublik_(inv.token).totalKg===50);
  const g2 = ctx.gabungSo([a.noSo+'-P2', a.noSo+'-P3', a.noSo], SM);
  ok('gabung kembali 3 nomor → nomor asal, 3 baris', g2.noSo===a.noSo && ctx.baca_(ctx.SHEET.SO).filter(r=>r.No_SO===a.noSo).length===3);
  ctx.simpanPengiriman({jenis:'KELUAR', customer:CUS, noSuratJalan:'DO/V122', baris:[{kode:FG, qty:25, idSo:a.ids[0]}], ident:YS});
  const g3 = ctx.pisahSo([a.ids[0]], SM);
  ok('baris yang sudah sebagian dikirim tetap bisa dipisah (pengiriman ikut ID baris)', g3.ok && ctx.baca_(ctx.SHEET.SO).find(r=>r.ID===a.ids[0]).Qty_Dikirim_Kg===25 && ctx.baca_(ctx.SHEET.SO).find(r=>r.ID===a.ids[0]).Status==='SELESAI');
  ok('log audit SO_GABUNG & SO_PISAH tercatat', ctx.baca_(ctx.SHEET.LOG).some(r=>r.Aksi==='SO_GABUNG') && ctx.baca_(ctx.SHEET.LOG).some(r=>r.Aksi==='SO_PISAH'));
}

console.log('\n— v12.3: tambah item ke SO terbuka, no. surat jalan opsional —');
{
  const hari = ctx.tglStr_(new Date());
  const s1 = ctx.simpanSo({customer:CUS, tanggal:hari, tanggalKirim:ctx.jatuhTempo_(hari,3), topHari:14, topDari:'DOKUMEN', baris:[{kode:FG, qty:100, harga:20000, ukuran:'30 x 30'}]}, SM);
  tolak('Bastari tidak bisa tambah item SO', ()=>ctx.tambahBarisSo(s1.noSo, [{kode:FG, qty:10, harga:20000}], MP), /Sales order/);
  tolak('SO tidak dikenal ditolak', ()=>ctx.tambahBarisSo('SO-000000-77', [{kode:FG, qty:10, harga:20000}], SM), /tidak ditemukan/);
  tolak('tanpa harga ditolak', ()=>ctx.tambahBarisSo(s1.noSo, [{kode:FG, qty:10}], SM), /harga jual/i);
  tolak('qty 0 ditolak', ()=>ctx.tambahBarisSo(s1.noSo, [{kode:'FG-PB-SUP', qty:0, harga:1}], SM), /qty/i);
  const dok1 = ctx.buatDokumen({jenis:'SO', ref:s1.noSo}, SM);
  const t1 = ctx.tambahBarisSo(s1.noSo, [{kode:'FG-PB-SUP', qty:50, harga:22000, ukuran:'40 x 60'}, {kode:FG, qty:25, harga:20000}], YS);
  const rows1 = ctx.baca_(ctx.SHEET.SO).filter(r=>r.No_SO===s1.noSo);
  const baru = rows1.find(r=>r.ID===t1.ids[0]);
  ok('Yansen tambah 2 item → SO punya 3 baris, 75 kg ditambah', t1.ok && t1.ids.length===2 && t1.totalKg===75 && rows1.length===3, t1);
  ok('baris baru ikut tanggal, tanggal kirim, TOP, TOP_Dari, customer SO; ukuran tersimpan; status TERBUKA', baru.Tanggal===hari && baru.Tanggal_Kirim===ctx.jatuhTempo_(hari,3) && ctx.angka_(baru.TOP_Hari)===14 && baru.TOP_Dari==='DOKUMEN' && baru.Customer===CUS && baru.Ukuran==='40 x 60' && baru.Status==='TERBUKA' && baru.Jatuh_Tempo===ctx.jatuhTempo_(hari,14), baru);
  ok('baris baru punya Log_Edit "item ditambahkan"', /item ditambahkan/.test(baru.Log_Edit));
  ok('dokumen SO lama → DIGANTI', ctx.ambilDokumenPublik_(dok1.token).diganti===true && t1.dokumenDiganti===1);
  ok('daftarSo & dokumen baru memuat 3 baris', ctx.daftarSo(SM).filter(x=>x.noSo===s1.noSo).length===3 && ctx.ambilDokumenPublik_(ctx.buatDokumen({jenis:'INVOICE', ref:s1.noSo}, SM).token).baris.length===3);
  ok('konteks: wajibSjKeluar false (bawaan v12.3)', ctx.getKonteks(YS).wajibSjKeluar===false);
  const rc = ctx.simpanPenerimaan({jenis:'MASUK', supplier:SUP, baris:[{kode:KW, qty:10}], ident:YS});
  ok('penerimaan TANPA no. surat jalan tersimpan', rc.ok!==false && ctx.baca_(ctx.SHEET.PENERIMAAN).find(r=>r.ID===(rc.ids||[rc.id])[0]).No_Surat_Jalan==='', rc);
  const kr = ctx.simpanPengiriman({jenis:'KELUAR', customer:CUS, baris:[{kode:FG, qty:5, idSo:t1.ids[1]}], ident:YS});
  ok('pengiriman TANPA no. surat jalan tersimpan (SO baris baru ikut terkirim 5 kg)', kr.ok!==false && ctx.baca_(ctx.SHEET.SO).find(r=>r.ID===t1.ids[1]).Qty_Dikirim_Kg===5, kr);
  ctx.setSetting_('WAJIB_SJ_KELUAR', 'YA');
  tolak('admin nyalakan WAJIB_SJ_KELUAR=YA → tanpa SJ ditolak lagi', ()=>ctx.simpanPengiriman({jenis:'KELUAR', customer:CUS, baris:[{kode:FG, qty:1, idSo:t1.ids[1]}], ident:YS}), /surat jalan wajib/);
  ctx.setSetting_('WAJIB_SJ_KELUAR', 'TIDAK');
  ok('log SO_TAMBAH tercatat', ctx.baca_(ctx.SHEET.LOG).some(r=>r.Aksi==='SO_TAMBAH'));
}

console.log('\n— v12.9: surat jalan (delivery order) untuk kiriman ke customer & BS ke jasa daur ulang —');
{
  const hari = ctx.tglStr_(new Date());
  const so = ctx.simpanSo({customer:CUS, tanggal:hari, tanggalKirim:hari, topHari:0, baris:[{kode:FG, qty:100, harga:20000, ukuran:'30 x 50'}, {kode:'FG-PB-SUP', qty:50, harga:22000, ukuran:'40 x 60'}]}, SM);
  const kr = ctx.simpanPengiriman({jenis:'KELUAR', customer:CUS, baris:[{kode:FG, qty:40, idSo:so.ids[0]}, {kode:'FG-PB-SUP', qty:25, idSo:so.ids[1]}], ident:YS});
  ok('kiriman 2 baris (tanpa no. SJ) tersimpan', kr.ok && kr.ids.length===2, kr);
  ok('konteks: bisaSj Yansen (GUDANG) & Deny (SO) true, staf false', ctx.getKonteks(YS).bisaSj===true && ctx.getKonteks(SM).bisaSj===true && ctx.getKonteks(STAF).bisaSj===false);
  tolak('staf tidak bisa buat surat jalan', ()=>ctx.buatDokumen({jenis:'SJ', ref:kr.ids.join(',')}, STAF), /Manager \/ Admin/);
  tolak('ID pengiriman tidak dikenal ditolak', ()=>ctx.buatDokumen({jenis:'SJ', ref:'OUT-000000-000000-1'}, YS), /tidak ditemukan/);
  const riw = ctx.riwayatInput('JUAL_KELUAR', 14, YS).filter(r=>kr.ids.indexOf(r.id)>=0);
  ok('riwayat: dua baris kiriman punya kelompok sama & bolehSj', riw.length===2 && riw[0].kelompok && riw[0].kelompok===riw[1].kelompok && riw.every(r=>r.bolehSj===true), riw.map(r=>r.kelompok));
  const sj = ctx.buatDokumen({jenis:'SJ', ref:kr.ids.join(','), pengangkut:'B 1234 XYZ · Pak Udin', catatan:'Kirim pagi'}, YS);
  ok('surat jalan dibuat: nomor otomatis SJ/YYYY/MM/001, total 65 kg, 2 baris', sj.ok && sj.jenis==='SJ' && sj.nomor==='SJ/'+hari.slice(0,4)+'/'+hari.slice(5,7)+'/001' && sj.totalKg===65 && sj.nomorDiisi===2, sj);
  const pub = ctx.ambilDokumenPublik_(sj.token);
  ok('isi dokumen: customer, no SO, tanggal kirim, pengangkut, ukuran per baris, tanpa harga', pub.jenis==='SJ' && pub.pihak.nama===CUS && pub.noSo===so.noSo && pub.tanggalKirim===hari && pub.pengangkut==='B 1234 XYZ · Pak Udin' && pub.sumber==='KIRIM' && pub.baris.length===2 && pub.baris[0].ukuran==='30 x 50' && pub.baris[1].ukuran==='40 x 60' && pub.total===0 && pub.totalKg===65 && pub.baris.every(b=>b.harga===0), pub);
  const rows = ctx.baca_(ctx.SHEET.PENGIRIMAN).filter(r=>kr.ids.indexOf(r.ID)>=0);
  ok('nomor SJ ditulis balik ke kedua baris pengiriman (+ Log_Edit)', rows.every(r=>r.No_Surat_Jalan===sj.nomor && /no\. surat jalan SJ\//.test(r.Log_Edit)), rows.map(r=>r.No_Surat_Jalan));
  const sj2 = ctx.buatDokumen({jenis:'SJ', ref:kr.ids.join(',')}, YS);
  ok('dibuat lagi untuk kiriman yang sama → nomor ikut yang sudah tercatat, versi lama DIGANTI', sj2.nomor===sj.nomor && ctx.ambilDokumenPublik_(sj.token).diganti===true && ctx.ambilDokumenPublik_(sj2.token).nomor===sj.nomor, sj2);
  tolak('nomor yang sama untuk kiriman lain ditolak', ()=>ctx.buatDokumen({jenis:'SJ', ref:kr.ids[0], nomor:sj.nomor}, YS), /sudah dipakai surat jalan lain/);
  const kr2 = ctx.simpanPengiriman({jenis:'KELUAR', customer:'PT Lain Sekali', baris:[{kode:FG, qty:1}], ident:YS});
  tolak('pengiriman beda customer dalam satu surat jalan ditolak', ()=>ctx.buatDokumen({jenis:'SJ', ref:kr.ids[0]+','+kr2.ids[0]}, YS), /bukan untuk customer yang sama/);
  const sj3 = ctx.buatDokumen({jenis:'SJ', ref:kr2.ids[0]}, SM);
  ok('Deny (SO, tanpa GUDANG) juga boleh; nomor urut berikutnya 002', sj3.ok && /\/002$/.test(sj3.nomor), sj3);
  ok('daftarDokumen jenis SJ: 3 entri, totalKg ikut', ctx.daftarDokumen(YS, 'SJ').length===3 && ctx.daftarDokumen(YS, 'SJ', kr.ids.join(','))[0].totalKg===65);
  /* BS ke jasa daur ulang */
  const SCR='SCR-BS-KW', VENDOR='PT Chassen Jaya', FOTO='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';
  ctx.simpanOpname({baris:[{kode:SCR, fisik:500}], catatan:'uji'}, ADM);
  const du = ctx.mulaiDaurUlang({vendor:VENDOR, scrap:[{kode:SCR, qty:120}], foto:FOTO, ident:YS});
  ok('daur ulang 120 kg BS dimulai', du.ok!==false && /^DUR-/.test(du.id), du);
  const sjd = ctx.buatDokumen({jenis:'SJ', ref:du.id, pengangkut:'Pickup L300'}, YS);
  const pubd = ctx.ambilDokumenPublik_(sjd.token);
  ok('surat jalan BS: pihak = jasa daur ulang, 1 baris 120 kg, sumber DAUR, no. SJ ditulis ke daur ulang', sjd.ok && pubd.pihak.label==='Jasa daur ulang' && pubd.pihak.nama===VENDOR && pubd.sumber==='DAUR' && pubd.baris.length===1 && pubd.baris[0].qty===120 && pubd.totalKg===120 && ctx.baca_(ctx.SHEET.DAUR).find(r=>r.ID===du.id).No_Surat_Jalan===sjd.nomor, pubd);
  tolak('daur ulang yang tidak ada ditolak', ()=>ctx.buatDokumen({jenis:'SJ', ref:'DUR-000000-000000-1'}, YS), /tidak ditemukan/);
  ctx.batalkanDokumen(sjd.id, 'salah', YS);
  ok('surat jalan dibatalkan → link mati', ctx.ambilDokumenPublik_(sjd.token).dibatalkan===true);
  const log = ctx.baca_(ctx.SHEET.LOG).filter(r=>r.Aksi==='DOK_SJ_BUAT');
  ok('log DOK_SJ_BUAT tercatat (4×), berisi kg', log.length===4 && /kg$/.test(log[0].Detail), log.map(r=>r.Detail));
}

console.log('\n— v12.10: perHari (kg per tanggal transaksi) di laporan beli & jual —');
{
  const tg = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return ctx.tglStr_(d); };
  const hariKe = (r, tanggal, kol) => { const x = r.perHari.find(h => h.tanggal === tanggal); return x ? x[kol] : 0; };
  const jml = (r, kol) => Math.round(r.perHari.reduce((a, h) => a + h[kol], 0) * 100) / 100;
  const b0 = ctx.riwayatPenerimaan(30, YS);
  ctx.simpanPenerimaan({jenis:'MASUK', supplier:SUP, tanggal:tg(2), baris:[{kode:KW, qty:40}], ident:YS});
  ctx.simpanPenerimaan({jenis:'MASUK', supplier:SUP, tanggal:tg(2), baris:[{kode:KW, qty:10}], ident:YS});
  const rb = ctx.simpanPenerimaan({jenis:'MASUK', supplier:SUP, tanggal:tg(1), baris:[{kode:KW, qty:7}], ident:YS});
  ctx.batalkanEntriSendiri(rb.ids[0], 'uji batal', YS);
  const b1 = ctx.riwayatPenerimaan(30, YS);
  ok('beli: perHari ada & urut tanggal naik', Array.isArray(b1.perHari) && b1.perHari.every((h, i, a) => !i || a[i-1].tanggal < h.tanggal), b1.perHari);
  ok('beli: dua penerimaan bertanggal 2 hari lalu (40 + 10) masuk ke tanggal transaksinya', hariKe(b1, tg(2), 'masuk') - hariKe(b0, tg(2), 'masuk') === 50, [hariKe(b0, tg(2), 'masuk'), hariKe(b1, tg(2), 'masuk')]);
  ok('beli: penerimaan yang dibatalkan tidak dihitung', hariKe(b1, tg(1), 'masuk') === hariKe(b0, tg(1), 'masuk'));
  ok('beli: jumlah perHari = total masuk & total retur', jml(b1, 'masuk') === b1.total.masuk && jml(b1, 'retur') === b1.total.retur, [jml(b1, 'masuk'), b1.total]);
  ok('beli: perHari hanya kg (tanpa harga / nilai)', b1.perHari.every(h => Object.keys(h).join() === 'tanggal,masuk,retur'));
  const j0 = ctx.laporanPenjualan(30, YS);
  ctx.simpanPengiriman({jenis:'KELUAR', customer:CUS, tanggal:tg(3), baris:[{kode:FG, qty:5}], ident:YS});
  const j1 = ctx.laporanPenjualan(30, SM);
  ok('jual: pengiriman bertanggal 3 hari lalu (5 kg) masuk ke tanggal transaksinya', hariKe(j1, tg(3), 'keluar') - hariKe(j0, tg(3), 'keluar') === 5, [hariKe(j0, tg(3), 'keluar'), hariKe(j1, tg(3), 'keluar')]);
  ok('jual: jumlah perHari = total keluar & total retur', jml(j1, 'keluar') === j1.total.keluar && jml(j1, 'retur') === j1.total.retur, [jml(j1, 'keluar'), j1.total]);
  ok('jual: perHari hanya kg (tanpa harga / nilai)', j1.perHari.every(h => Object.keys(h).join() === 'tanggal,keluar,retur'));
}

fs.unlinkSync(__dirname+'/.h12.js');
console.log('\n================ '+pass+' lulus, '+fail+' gagal ================');
process.exit(fail?1:0);
