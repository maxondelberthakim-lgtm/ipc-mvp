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
tolak('Yansen (PO saja) tidak bisa buat invoice', ()=>ctx.buatDokumen({jenis:'INVOICE', ref:noSo}, YS), /Sales order/);
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

fs.unlinkSync(__dirname+'/.h12.js');
console.log('\n================ '+pass+' lulus, '+fail+' gagal ================');
process.exit(fail?1:0);
